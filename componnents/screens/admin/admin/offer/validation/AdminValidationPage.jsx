import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/router";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { useReactToPrint } from "react-to-print";
import AdminMainContainerPage from "../../../AdminMainContainerPage";
import AdminOfferViewDialog from "../view/AdminOfferViewDialog";
import { openOfferLetter } from "@/componnents/letters/OfferLetterHost";
import SummaryValidation from "./SummaryValidation";
import DataLoader from "@/componnents/Loader/DataLoader";
import ExportButtons from "@/componnents/export/ExportButtons";
import OfferFilterPanel from "@/componnents/filter/OfferFilterPanel";
import WorkflowStatusBadge from "@/componnents/workflow/WorkflowStatusBadge";
import OfferTypeBadge from "@/componnents/workflow/OfferTypeBadge";
import RowActionBar from "@/componnents/workflow/RowActionBar";
import useWorkflowActions from "@/componnents/workflow/useWorkflowActions";
import useTablePaging from "@/componnents/common/useTablePaging";
import { useAdmin } from "@/services/providers/AdminProvider";
import { getAdminPendingOffers } from "@/services/api/offers/offersApiServices";
import { getOfferAnalysis, requestOfferAnalysis } from "@/services/api/workflow/workflowApiService";
import { OFFER_EXPORT_COLUMNS } from "@/services/tools/exportData";
import { DEFAULT_OFFER_FILTERS, applyOfferFilters } from "@/services/tools/offerFilters";
import { formatDateToFrench } from "@/services/tools/helper";
import OperatorLogo from "@/componnents/common/OperatorLogo";

/**
 * File de validation des offres.
 *
 * Corrige l'ancienne page :
 *  - « Ajouter une offre » et « Supprimer plusieurs sélections » appelaient
 *    des fonctions inexistantes (erreur au clic) ; une suppression n'a de
 *    toute façon pas sa place ici (désactivation, jamais de suppression) ;
 *  - la pré-analyse IA affichait un texte d'exemple figé, identique pour
 *    toutes les offres : elle interroge désormais l'assistant (relais
 *    serveur), sans bloquer la décision ;
 *  - le tri des colonnes de dates était sans effet ;
 *  - l'examen n'avait pas d'adresse : retour navigateur sans effet, lien non
 *    partageable. Il est ouvert par `?examiner=<id>`.
 */

const DAY = 86400000;
const QUEUE_REFRESH_MS = 60000;

const launchInfo = (date) => {
  if (!date) return null;
  const days = Math.ceil((new Date(date).setHours(0, 0, 0, 0) - new Date().setHours(0, 0, 0, 0)) / DAY);
  if (days < 0) return { days, label: `Dépassé de ${-days} j`, tone: "late" };
  if (days === 0) return { days, label: "Aujourd'hui", tone: "late" };
  if (days <= 7) return { days, label: `Dans ${days} j`, tone: "soon" };
  return { days, label: `Dans ${days} j`, tone: "ok" };
};

const waitingSince = (date) => {
  if (!date) return null;
  const days = Math.floor((Date.now() - new Date(date)) / DAY);
  return days <= 0 ? "aujourd'hui" : `depuis ${days} j`;
};

function Kpi({ icon, tone, label, value, hint, active, onClick }) {
  return (
    <button type="button" className={`vq-kpi vq-kpi--${tone}${active ? " is-active" : ""}`} onClick={onClick} aria-pressed={active}>
      <span className="vq-kpi-icon" aria-hidden="true">
        <i className={`bi ${icon}`}></i>
      </span>
      <span className="vq-kpi-text">
        <span className="vq-kpi-value">{value ?? "–"}</span>
        <span className="vq-kpi-label">{label}</span>
        {hint && <span className="vq-kpi-hint">{hint}</span>}
      </span>
    </button>
  );
}

export default function AdminValidationPage() {
  const router = useRouter();
  const { operators } = useAdmin();

  const [offers, setOffers] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lastLoadedAt, setLastLoadedAt] = useState(null);

  const [offerFilters, setOfferFilters] = useState(DEFAULT_OFFER_FILTERS);
  const [scope, setScope] = useState("all"); // all | mine | urgent | promo | base
  const [search, setSearch] = useState("");
  const [selectedOffers, setSelectedOffers] = useState(null);

  const [previewOffer, setPreviewOffer] = useState(null);

  // Examen en cours
  const [reviewOffer, setReviewOffer] = useState(null);
  const [reviewById, setReviewById] = useState({}); // examen des formules conservé par offre
  const [analysisById, setAnalysisById] = useState({});
  const analysisRef = useRef({});
  const analysisControllers = useRef({});
  const contentRef = useRef(null);

  /* ------------------------------------------------------------ Données */
  const loadQueue = useCallback(async ({ silent = false } = {}) => {
    if (silent) setRefreshing(true);
    const data = await getAdminPendingOffers();
    if (Array.isArray(data)) {
      setOffers(data);
      setLoadError(null);
      setLastLoadedAt(new Date());
    } else {
      setLoadError("La file de validation n'a pas pu être chargée.");
      setOffers((prev) => prev ?? []);
    }
    setRefreshing(false);
  }, []);

  useEffect(() => {
    loadQueue();
  }, [loadQueue]);

  const { byId: workflowById, reload: reloadWorkflow } = useWorkflowActions(offers);

  // Actualisation périodique de la liste (hors examen).
  useEffect(() => {
    if (reviewOffer) return undefined;
    const timer = setInterval(() => document.visibilityState === "visible" && loadQueue({ silent: true }), QUEUE_REFRESH_MS);
    return () => clearInterval(timer);
  }, [reviewOffer, loadQueue]);

  // Abandon des analyses en cours en quittant la page.
  useEffect(
    () => () => Object.values(analysisControllers.current).forEach((c) => c?.abort()),
    [],
  );

  const canDecideOn = useCallback(
    (row) => {
      const acts = workflowById?.[row?.id]?.actions || [];
      return acts.includes("VALIDATE_TRANSMIT") || acts.includes("VALIDATE_FINAL") || acts.includes("REFUSE");
    },
    [workflowById],
  );

  /* ------------------------------------------------------------ Analyse IA */
  /**
   * Analyse IA d'une offre.
   *
   * L'analyse est CONSERVÉE côté serveur : à l'ouverture, on lit celle qui
   * existe (aucun calcul). Le serveur ne demande une analyse automatique
   * (`autoRun`) qu'une seule fois, pour le validateur dont la décision est
   * attendue et tant qu'aucune analyse n'existe. `force` = nouvelle analyse
   * demandée volontairement ; les précédentes restent dans l'historique.
   */
  const runAnalysis = useCallback(async (offer, { force = false } = {}) => {
    if (!offer?.id) return;
    const key = offer.id;
    const current = analysisRef.current[key];
    if (!force && current && current.status !== "error") return;
    const setEntry = (entry) => {
      analysisRef.current = { ...analysisRef.current, [key]: entry };
      setAnalysisById(analysisRef.current);
    };
    const fromServer = (data) => ({
      status: data.latest ? "ready" : "empty",
      text: data.latest?.content || "",
      durationMs: data.latest?.durationMs,
      meta: data.latest,
      history: data.history || [],
      canRun: !!data.canRun,
    });

    analysisControllers.current[key]?.abort();
    const controller = new AbortController();
    analysisControllers.current[key] = controller;
    const stale = () => analysisControllers.current[key] !== controller;

    let request = force;
    if (!force) {
      setEntry({ status: "loading", phase: "reading" });
      const stored = await getOfferAnalysis(key, controller.signal);
      if (stale() || stored.aborted) return;
      if (!stored.ok) {
        delete analysisControllers.current[key];
        setEntry({ status: "error", message: stored.error, canRun: stored.status !== 403 });
        return;
      }
      if (!stored.data.autoRun) {
        delete analysisControllers.current[key];
        setEntry(fromServer(stored.data));
        return;
      }
      request = true;
    }

    if (request) {
      setEntry({ status: "loading", phase: "running", previous: current?.status === "ready" ? current : null });
      const res = await requestOfferAnalysis(key, controller.signal);
      if (stale() || res.aborted) return;
      delete analysisControllers.current[key];
      setEntry(res.ok ? fromServer(res.data) : { ...(current?.status === "ready" ? current : { status: "error" }), status: current?.status === "ready" ? "ready" : "error", message: res.error, runError: res.error, canRun: true });
    }
  }, []);

  /* ------------------------------------------------------------ Navigation */
  const examiningId = router.query.examiner ? Number(router.query.examiner) : null;

  const openReview = (offer) => {
    router.push({ pathname: router.pathname, query: { ...router.query, examiner: offer.id } }, undefined, { shallow: true });
  };

  const closeReview = useCallback(() => {
    const { examiner, ...rest } = router.query;
    router.push({ pathname: router.pathname, query: rest }, undefined, { shallow: true });
  }, [router]);

  // L'adresse pilote l'écran : ouverture directe, retour navigateur.
  useEffect(() => {
    if (!router.isReady) return;
    if (!examiningId) {
      if (reviewOffer) {
        setReviewOffer(null);
        loadQueue({ silent: true });
        reloadWorkflow();
      }
      return;
    }
    if (reviewOffer?.id === examiningId || offers == null) return;
    const found = offers.find((o) => o.id === examiningId);
    if (found) {
      setReviewOffer(found);
      runAnalysis(found);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      closeReview();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.isReady, examiningId, offers]);

  // L'offre examinée suit les données actualisées.
  useEffect(() => {
    if (!reviewOffer || !offers) return;
    const fresh = offers.find((o) => o.id === reviewOffer.id);
    if (fresh && fresh !== reviewOffer) setReviewOffer(fresh);
  }, [offers, reviewOffer]);

  // Validation définitive ou refus : le courrier au soumissionnaire est proposé (jamais généré d'office).
  const handleDecided = (data) => {
    if (["VALIDATED", "REFUSED"].includes(data?.offer?.workflowStatus)) {
      openOfferLetter(data.offer, { prompt: true, status: data.offer.workflowStatus });
    }
    setReviewById((prev) => {
      const next = { ...prev };
      delete next[reviewOffer?.id];
      return next;
    });
    closeReview();
  };

  const handlePrint = useReactToPrint({
    contentRef,
    documentTitle: reviewOffer ? `Examen ${reviewOffer.code}` : "Examen",
    pageStyle: "@page { size: A4; margin: 12mm } body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }",
  });

  /* ------------------------------------------------------------ Liste */
  // Les offres dont le circuit vient d'être clôturé par un autre validateur
  // disparaissent dès l'actualisation de leur état.
  const openOffers = useMemo(
    () =>
      (offers || []).filter((o) => {
        const st = workflowById?.[o?.id]?.workflowStatus;
        return !st || ["SUBMITTED", "IN_VALIDATION"].includes(st);
      }),
    [offers, workflowById],
  );

  const stats = useMemo(() => {
    const mine = openOffers.filter(canDecideOn).length;
    const urgent = openOffers.filter((o) => (launchInfo(o.desiredDate)?.days ?? 99) <= 7).length;
    const promo = openOffers.filter((o) => o.specialPromotion).length;
    return { total: openOffers.length, mine, urgent, promo, base: openOffers.length - promo };
  }, [openOffers, canDecideOn]);

  const rows = useMemo(() => {
    if (offers == null) return null;
    let list = applyOfferFilters(openOffers, offerFilters) || [];
    if (scope === "mine") list = list.filter(canDecideOn);
    if (scope === "urgent") list = list.filter((o) => (launchInfo(o.desiredDate)?.days ?? 99) <= 7);
    if (scope === "promo") list = list.filter((o) => o.specialPromotion);
    if (scope === "base") list = list.filter((o) => !o.specialPromotion);
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((o) =>
        [o.title, o.code, o.operator?.name].filter(Boolean).some((v) => String(v).toLowerCase().includes(q)),
      );
    }
    return list.map((o) => ({
      ...o,
      _submitted: new Date(o.submittedAt || o.updatedAt).getTime(),
      _launch: o.desiredDate ? new Date(o.desiredDate).getTime() : null,
      _level: workflowById?.[o.id]?.currentValidationLevel ?? o.currentValidationLevel ?? 0,
      // Droit de décision figé dans la ligne : le tableau ne relit pas la
      // fonction à chaque rendu (voir `decisionSignature`).
      _canDecide: canDecideOn(o),
    }));
  }, [offers, openOffers, offerFilters, scope, search, canDecideOn, workflowById]);

  /**
   * Empreinte des droits de décision.
   *
   * PrimeReact ne compare les lignes que par leur `dataKey` : une ligne dont
   * seul le droit de décision change n'était pas redessinée. La file affichait
   * donc « Consulter » alors que les indicateurs annonçaient « à ma décision »,
   * jusqu'à la prochaine actualisation. Le tableau est remonté lorsque cette
   * empreinte change   ce qui n'arrive qu'à l'arrivée des droits ou après une
   * décision, jamais pendant la navigation.
   */
  // Page conservée quand le tableau est re-créé après une décision.
  const paging = useTablePaging(rows?.length, 25);

  const decisionSignature = useMemo(
    () => (rows || []).map((r) => `${r.id}:${r._canDecide ? 1 : 0}:${r._level}`).join("|"),
    [rows],
  );

  // Sélection limitée aux lignes visibles.
  useEffect(() => {
    if (!selectedOffers?.length || !rows) return;
    const ids = new Set(rows.map((r) => r.id));
    const kept = selectedOffers.filter((s) => ids.has(s.id));
    if (kept.length !== selectedOffers.length) setSelectedOffers(kept.length ? kept : null);
  }, [rows, selectedOffers]);

  /* ------------------------------------------------------------ Colonnes */
  const offerBody = (row) => (
    <div className="vq-offer">
      <OperatorLogo operator={row.operator} size={36} rounded={8} />
      <span className="vq-offer-text">
        <button type="button" className="vq-offer-title" onClick={() => openReview(row)} title="Examiner l'offre">
          {row.title}
        </button>
        <small>
          {row.code} · {row.operator?.name}
          {row.version > 1 ? ` · v${row.version}` : ""}
        </small>
      </span>
    </div>
  );

  const submittedBody = (row) => (
    <div className="vq-date">
      <span>{formatDateToFrench(row.submittedAt || row.updatedAt)}</span>
      <small>{waitingSince(row.submittedAt || row.updatedAt)}</small>
    </div>
  );

  const launchBody = (row) => {
    const info = launchInfo(row.desiredDate);
    return (
      <div className="vq-date">
        <span>{formatDateToFrench(row.desiredDate)}</span>
        {info && <span className={`vq-due vq-due--${info.tone}`}>{info.label}</span>}
      </div>
    );
  };

  const circuitBody = (row) => (
    <div className="wf">
      <WorkflowStatusBadge
        offer={{
          ...row,
          workflowStatus: workflowById?.[row.id]?.workflowStatus ?? row.workflowStatus,
          currentValidationLevel: workflowById?.[row.id]?.currentValidationLevel ?? row.currentValidationLevel,
        }}
        finalLevel={workflowById?.[row.id]?.finalLevel}
      />
      {(row._canDecide ?? canDecideOn(row)) && <span className="vq-mine">À votre décision</span>}
    </div>
  );

  const actionsBody = (row) => {
    const decide = row._canDecide ?? canDecideOn(row);
    return (
      <RowActionBar
        ariaLabel={row.title}
        view={{ onClick: () => setPreviewOffer(row), title: "Aperçu de l'offre" }}
        primary={{
          key: "examine",
          label: decide ? "Examiner et décider" : "Consulter",
          icon: decide ? "bi-check2-circle" : "bi-search",
          tone: decide ? "primary" : "neutral",
          title: decide ? "Examiner l'offre et statuer" : "Examiner l'offre (consultation)",
          onClick: () => openReview(row),
        }}
        circuit={{ href: `/offer-workflow/${row.id}`, title: "Consulter le circuit de validation" }}
      />
    );
  };

  const scopes = [
    { key: "all", label: "Toutes", count: stats.total },
    { key: "mine", label: "À ma décision", count: stats.mine },
    { key: "urgent", label: "Lancement ≤ 7 j", count: stats.urgent },
    { key: "base", label: "Offres de base", count: stats.base },
    { key: "promo", label: "Promotions", count: stats.promo },
  ];

  const reviewAnalysis = reviewOffer ? analysisById[reviewOffer.id] : null;

  /* ------------------------------------------------------------ Rendu */
  return (
    <AdminMainContainerPage
      active="valid"
      children={
        <div className="vq">
          {/* En-tête */}
          <header className="vq-head">
            {reviewOffer ? (
              <>
                <div className="vq-head-main">
                  <button type="button" className="vq-back" onClick={closeReview} title="Retour à la file">
                    <i className="bi bi-arrow-left" aria-hidden="true"></i>
                  </button>
                  <div className="min-w-0">
                    <div className="vq-crumb">File de validation</div>
                    <h1 className="vq-title">Examen de l'offre</h1>
                  </div>
                </div>
                <div className="vq-head-actions">
                  <button type="button" className="btn btn-light btn-sm" onClick={() => handlePrint()}>
                    <i className="bi bi-printer me-1" aria-hidden="true"></i> Imprimer
                  </button>
                  <button type="button" className="btn btn-outline-light btn-sm" onClick={closeReview}>
                    <i className="bi bi-x-lg me-1" aria-hidden="true"></i> Fermer
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="vq-head-main">
                  <span className="vq-head-icon" aria-hidden="true">
                    <i className="bi bi-patch-check"></i>
                  </span>
                  <div className="min-w-0">
                    <h1 className="vq-title">Validation des offres proposées</h1>
                    <div className="vq-sub">
                      Offres soumises en attente d'une décision du circuit de validation
                      {lastLoadedAt && (
                        <span>
                          {" "}
                          · actualisé à {lastLoadedAt.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="vq-head-actions">
                  <button
                    type="button"
                    className="btn btn-light btn-sm"
                    onClick={() => {
                      loadQueue({ silent: true });
                      reloadWorkflow();
                    }}
                    disabled={refreshing || offers == null}
                  >
                    <i className={`bi bi-arrow-clockwise me-1${refreshing ? " vq-spin" : ""}`} aria-hidden="true"></i>
                    Actualiser
                  </button>
                </div>
              </>
            )}
          </header>

          {reviewOffer ? (
            <SummaryValidation
              key={reviewOffer.id}
              offer={reviewOffer}
              workflowInfo={workflowById?.[reviewOffer.id]}
              analysis={reviewAnalysis || { status: "loading", phase: "reading" }}
              review={reviewById[reviewOffer.id] || {}}
              onReviewChange={(value) => setReviewById((prev) => ({ ...prev, [reviewOffer.id]: value }))}
              onRetryAnalysis={() => runAnalysis(reviewOffer, { force: true })}
              onDecided={handleDecided}
              contentRef={contentRef}
            />
          ) : (
            <>
              {/* Indicateurs */}
              <div className="vq-kpis">
                <Kpi icon="bi-inboxes" tone="slate" label="En attente" value={offers ? stats.total : null} active={scope === "all"} onClick={() => setScope("all")} />
                <Kpi
                  icon="bi-person-check"
                  tone="blue"
                  label="À ma décision"
                  value={offers ? stats.mine : null}
                  hint={offers && stats.total ? `${Math.round((stats.mine / stats.total) * 100)} % de la file` : null}
                  active={scope === "mine"}
                  onClick={() => setScope("mine")}
                />
                <Kpi
                  icon="bi-alarm"
                  tone="red"
                  label="Lancement ≤ 7 jours"
                  value={offers ? stats.urgent : null}
                  hint="ou déjà dépassé"
                  active={scope === "urgent"}
                  onClick={() => setScope("urgent")}
                />
                <Kpi icon="bi-box" tone="teal" label="Offres de base" value={offers ? stats.base : null} hint="Circuit V1 → V4" active={scope === "base"} onClick={() => setScope("base")} />
                <Kpi icon="bi-lightning-charge" tone="orange" label="Promotions" value={offers ? stats.promo : null} hint="Circuit V1 → V3" active={scope === "promo"} onClick={() => setScope("promo")} />
              </div>

              <OfferFilterPanel
                filters={offerFilters}
                onChange={setOfferFilters}
                operators={operators}
                showOperators={true}
                resultCount={rows?.length ?? 0}
                totalCount={openOffers.length}
                storageKey="filters-validation"
              />

              {loadError && (
                <div className="vq-error" role="alert">
                  <i className="bi bi-exclamation-triangle" aria-hidden="true"></i> {loadError}
                  <button type="button" className="btn btn-sm btn-outline-danger ms-auto" onClick={() => loadQueue({ silent: true })}>
                    Réessayer
                  </button>
                </div>
              )}

              <section className="vq-table">
                <div className="vq-toolbar">
                  <div className="vq-scopes" role="tablist" aria-label="Filtrer la file">
                    {scopes.map((s) => (
                      <button
                        key={s.key}
                        type="button"
                        role="tab"
                        aria-selected={scope === s.key}
                        className={scope === s.key ? "is-active" : ""}
                        onClick={() => setScope(s.key)}
                      >
                        {s.label}
                        <span>{offers ? s.count : "–"}</span>
                      </button>
                    ))}
                  </div>
                  <div className="vq-toolbar-right">
                    <div className="vq-search">
                      <i className="bi bi-search" aria-hidden="true"></i>
                      <input
                        type="search"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Titre, code, opérateur…"
                        aria-label="Rechercher une offre"
                      />
                    </div>
                    <ExportButtons
                      rows={rows || []}
                      selection={selectedOffers}
                      columns={OFFER_EXPORT_COLUMNS}
                      fileName="compartic_offres_en_validation"
                      title="Offres en cours de validation"
                    />
                  </div>
                </div>

                {rows == null ? (
                  <DataLoader label="Chargement des offres à valider…" />
                ) : (
                  <DataTable
                    key={decisionSignature}
                    value={rows}
                    dataKey="id"
                    selectionMode="checkbox"
                    selection={selectedOffers}
                    onSelectionChange={(e) => setSelectedOffers(e.value)}
                    paginator
                    first={paging.first}
                    rows={paging.rows}
                    onPage={paging.onPage}
                    rowsPerPageOptions={[10, 25, 50, 100]}
                    paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                    currentPageReportTemplate="{first} à {last} sur {totalRecords}"
                    sortField="_submitted"
                    sortOrder={1}
                    removableSort
                    size="small"
                    className="vq-datatable"
                    rowClassName={(row) => ({ "vq-row-mine": canDecideOn(row) })}
                    emptyMessage={
                      <div className="vq-empty">
                        <i className="bi bi-check2-all" aria-hidden="true"></i>
                        <b>{search || scope !== "all" ? "Aucune offre ne correspond." : "Aucune offre en attente de validation."}</b>
                        {(search || scope !== "all") && (
                          <button
                            type="button"
                            className="btn btn-link btn-sm"
                            onClick={() => {
                              setSearch("");
                              setScope("all");
                            }}
                          >
                            Afficher toute la file
                          </button>
                        )}
                      </div>
                    }
                  >
                    <Column selectionMode="multiple" headerStyle={{ width: "2.5rem" }} exportable={false} />
                    <Column header="Offre" field="title" sortable body={offerBody} style={{ minWidth: 240 }} />
                    <Column header="Type" body={(row) => <OfferTypeBadge offer={row} showCircuit />} style={{ minWidth: 150 }} />
                    <Column header="Soumise le" field="_submitted" sortable body={submittedBody} style={{ minWidth: 130 }} />
                    <Column header="Lancement souhaité" field="_launch" sortable body={launchBody} style={{ minWidth: 150 }} />
                    <Column header="Circuit" field="_level" sortable body={circuitBody} style={{ minWidth: 170 }} />
                    <Column header="Actions" body={actionsBody} headerStyle={{ textAlign: "right" }} style={{ minWidth: 300 }} />
                  </DataTable>
                )}
              </section>
            </>
          )}

          <AdminOfferViewDialog visible={!!previewOffer} setVisible={(v) => !v && setPreviewOffer(null)} offer={previewOffer} />
        </div>
      }
    />
  );
}
