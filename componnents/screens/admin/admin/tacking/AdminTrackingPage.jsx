import { getAdminOffersByOperators } from "@/services/api/admin/offer/offersApiServices";
import { useAdmin } from "@/services/providers/AdminProvider";
import { BASE_IMG_URL, imageUrl } from "@/services/tools/constants";
import { handleNumThousand } from "@/services/tools/convertions";
import { formatDateToFrench } from "@/services/tools/helper";
import {
  STATUS,
  STATUS_FILTER_OPTIONS,
  resolveStatus,
  statusOf,
} from "@/services/tools/offerStatus";
import {
  DEFAULT_TRACKING_FILTER,
  buildOfferVersions,
  computeTrackingKpis,
  filterTrackedOffers,
  pruneSelection,
  summarizeFormulas,
} from "@/services/tools/tracking";
import { MultiSelect } from "primereact/multiselect";
import React, { useEffect, useMemo, useState } from "react";
import AdminOfferViewDialog from "../offer/view/AdminOfferViewDialog";
import OfferJourney from "@/componnents/workflow/OfferJourney";

/**
 * Suivi de l'évolution des offres de télécommunications.
 *
 * ─── Ce que faisait l'écran précédent ──────────────────────────────────────
 *
 * L'intention était bonne : choisir des opérateurs, puis des offres, et
 * dérouler leur histoire. L'exécution portait en revanche plusieurs défauts,
 * dont quatre qui la rendaient franchement trompeuse :
 *
 *  1. DEUX FILTRAGES CONCURRENTS. Un effet dédié au type de facturation
 *     re-filtrait la liste complète en ignorant la catégorie, et s'exécutait
 *     APRÈS le filtrage global : changer le type de facturation effaçait
 *     silencieusement le filtre de catégorie.
 *  2. TABLEAU VIDE PRIS POUR UNE SÉLECTION. L'état vide s'affichait sur
 *     `selectedOffers ? … : …` ; or `[]` est vrai en JavaScript. En
 *     désélectionnant toutes les offres, l'écran devenait entièrement blanc,
 *     sans le moindre message.
 *  3. SÉLECTION FANTÔME. Les offres choisies n'étaient jamais réévaluées quand
 *     les filtres ou les opérateurs changeaient : on continuait d'afficher des
 *     offres qui ne correspondaient plus aux critères affichés à l'écran.
 *  4. STATUT INEXPLOITABLE. Seul `Offer.status` était montré, en anglais brut
 *     (« PENDING », « DONE »). La DÉCISION de l'ARTCI   validée, refusée,
 *     suspendue   n'apparaissait nulle part, alors que c'est précisément
 *     l'information que suit le régulateur.
 *
 * S'y ajoutaient : des listes déroulantes non contrôlées (impossible à
 * réinitialiser), un champ de recherche déclaré mais jamais branché, un état
 * `active` mort, et le détail intégral des formules recopié en ligne alors que
 * la fenêtre « Voir le détail » le présente déjà.
 *
 * ─── Ce que fait celui-ci ──────────────────────────────────────────────────
 *
 * Un filtrage unique et dérivé (`useMemo`), donc jamais contradictoire ; des
 * indicateurs cliquables qui servent aussi de filtre par statut ; une vraie
 * chronologie par offre   déclaration, décision, monitorings successifs  
 * ordonnée dans le temps ; un résumé des formules, le détail restant dans la
 * fenêtre dédiée ; et des états vides qui distinguent les trois situations
 * possibles au lieu d'un écran blanc.
 */

const CATEGORY_LABEL = { MOBILE: "Mobile", FIXE: "Fixe" };
const BILLING_LABEL = {
  PREPAID: "Prépayé",
  POSTPAID: "Postpayé",
  HYBRID: "Hybride",
  HYBRIDE: "Hybride",
};

export default function AdminTrackingPage() {
  const { operators } = useAdmin();

  const [selectedOperators, setSelectedOperators] = useState([]);
  const [offers, setOffers] = useState([]);
  const [selectedOffers, setSelectedOffers] = useState([]);
  const [filter, setFilter] = useState(DEFAULT_TRACKING_FILTER);
  const [loading, setLoading] = useState(false);

  const [offer, setOffer] = useState(null);
  const [showViewDialog, setShowViewDialog] = useState(false);

  // Tous les opérateurs au premier chargement : l'écran n'a d'intérêt que
  // rempli, un écran vide au démarrage laissait croire à une panne.
  useEffect(() => {
    if (Array.isArray(operators) && operators.length > 0) {
      setSelectedOperators((prev) => (prev.length > 0 ? prev : operators));
    }
  }, [operators]);

  // Chargement des offres du périmètre retenu. Déselectionner tous les
  // opérateurs VIDE la liste : auparavant les offres précédentes restaient
  // affichées, sans rapport avec la sélection visible.
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!selectedOperators || selectedOperators.length === 0) {
        setOffers([]);
        return;
      }
      setLoading(true);
      try {
        const ids = selectedOperators.map((o) => o?.id).filter(Boolean);
        const result = await getAdminOffersByOperators(ids);
        if (!cancelled) setOffers(Array.isArray(result) ? result : []);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [selectedOperators]);

  // Filtrage UNIQUE et dérivé : plus aucun effet concurrent ne peut défaire le
  // travail d'un autre.
  const filteredOffers = useMemo(
    () => filterTrackedOffers(offers, filter),
    [offers, filter],
  );

  // La sélection suit les filtres : une offre qui sort du périmètre sort aussi
  // de la sélection, au lieu de rester affichée à contretemps.
  useEffect(() => {
    setSelectedOffers((prev) => pruneSelection(prev, filteredOffers));
  }, [filteredOffers]);

  const kpis = useMemo(() => computeTrackingKpis(filteredOffers), [filteredOffers]);

  const onFilter = (name, value) =>
    setFilter((prev) => ({ ...prev, [name]: value }));

  const toggleStatusFilter = (key) =>
    setFilter((prev) => ({
      ...prev,
      status: prev.status === key ? "ALL" : key,
    }));

  const resetFilters = () => {
    setFilter(DEFAULT_TRACKING_FILTER);
    setSelectedOperators(Array.isArray(operators) ? operators : []);
    setSelectedOffers([]);
  };

  const handleViewOffer = (_offer) => {
    setOffer(_offer);
    setShowViewDialog(true);
  };

  const operatorTemplate = (option) => (
    <div className="d-flex align-items-center gap-2">
      <img
        alt={option?.name}
        src={imageUrl(option?.imagePath)}
        style={{ width: 22, height: 22, borderRadius: "50%", objectFit: "cover" }}
      />
      <span className="text-dark">{option?.name}</span>
    </div>
  );

  const offerTemplate = (option) => (
    <div className="d-flex align-items-center justify-content-between gap-2">
      <span className="text-dark">{option?.title}</span>
      <span
        className="trk-badge"
        style={{
          background: resolveStatus(option).light,
          color: resolveStatus(option).text,
        }}
      >
        {resolveStatus(option).label}
      </span>
    </div>
  );

  const KPI = ({ value, label, color, light, statusKey }) => (
    <button
      type="button"
      className={`trk-kpi${filter.status === statusKey ? " trk-kpi--on" : ""}`}
      style={{ "--trk-kpi-color": color, "--trk-kpi-light": light }}
      onClick={() => statusKey && toggleStatusFilter(statusKey)}
      disabled={!statusKey}
      title={statusKey ? "Filtrer sur ce statut" : undefined}
    >
      <div>
        <div className="trk-kpi-value" style={{ color }}>
          {value}
        </div>
        <div className="trk-kpi-label">{label}</div>
      </div>
    </button>
  );

  return (
    <div className="trk">
      <div className="trk-head">
        <div>
          <h1 className="trk-title">
            Suivi de l'évolution des offres de télécommunications
          </h1>
          <p className="trk-sub">
            Déclarations, décisions de l'ARTCI et monitorings successifs, offre
            par offre.
          </p>
        </div>
      </div>

      {/* <div className="trk-kpis">
        <KPI value={kpis.total} label="Offres au périmètre" color="#0f172a" />
        <KPI
          value={kpis.pending}
          label={STATUS.PENDING.label}
          color={STATUS.PENDING.bg}
          light={STATUS.PENDING.light}
          statusKey="PENDING"
        />
        <KPI
          value={kpis.allowed}
          label={STATUS.ALLOW.label}
          color={STATUS.ALLOW.bg}
          light={STATUS.ALLOW.light}
          statusKey="ALLOW"
        />
        <KPI
          value={kpis.denied}
          label={STATUS.DINIED.label}
          color={STATUS.DINIED.bg}
          light={STATUS.DINIED.light}
          statusKey="DINIED"
        />
        <KPI
          value={kpis.suspended}
          label={STATUS.SUSPENDED.label}
          color={STATUS.SUSPENDED.bg}
          light={STATUS.SUSPENDED.light}
          statusKey="SUSPENDED"
        />
        <KPI value={kpis.monitorings} label="Monitorings déposés" color="#6366f1" />
      </div> */}

      <div className="trk-filters bg-secondary">
        <div className="trk-filters-grid ">
          <div className="trk-field">
            <label htmlFor="trk-cat" className="text-white">
              Catégorie
            </label>
            <select
              id="trk-cat"
              className="form-select"
              value={filter.category}
              onChange={(e) => onFilter("category", e.target.value)}
            >
              <option value="ALL">Toutes</option>
              <option value="MOBILE">Mobile</option>
              <option value="FIXE">Fixe</option>
            </select>
          </div>

          <div className="trk-field">
            <label htmlFor="trk-bill" className="text-white">Type de client</label>
            <select
              id="trk-bill"
              className="form-select"
              value={filter.billingType}
              onChange={(e) => onFilter("billingType", e.target.value)}
            >
              <option value="ALL">Toutes</option>
              <option value="PREPAID">Prépayé</option>
              <option value="POSTPAID">Postpayé</option>
              <option value="HYBRID">Hybride</option>
            </select>
          </div>

          <div className="trk-field">
            <label htmlFor="trk-status" className="text-white">
              Statut
            </label>
            <select
              id="trk-status"
              className="form-select"
              value={filter.status}
              onChange={(e) => onFilter("status", e.target.value)}
            >
              {STATUS_FILTER_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          {/* <div className="trk-field">
            <label htmlFor="trk-search">Recherche</label>
            <input
              id="trk-search"
              type="search"
              className="form-control"
              placeholder="Intitulé, code ou opérateur"
              value={filter.search}
              onChange={(e) => onFilter("search", e.target.value)}
            />
          </div> */}

          <div className="trk-field">
            <label htmlFor="trk-operators" className="text-white">
              Opérateurs
            </label>
            <MultiSelect
              value={Array.isArray(selectedOperators) ? selectedOperators : []}
              options={Array.isArray(operators) ? operators : []}
              onChange={(e) => setSelectedOperators(e.value || [])}
              optionLabel="name"
              placeholder="Tous les opérateurs"
              maxSelectedLabels={2}
              selectedItemsLabel="{0} opérateurs"
              itemTemplate={operatorTemplate}
              className="w-100"
              style={{ height: 45 }}
              display="chip"
            />
          </div>

          <div className="trk-field w-100" style={{width: "100%"}}>
            <label htmlFor="trk-offers" className="text-white">
              Offres suivies
            </label>
            <MultiSelect
              value={Array.isArray(selectedOffers) ? selectedOffers : []}
              options={filteredOffers}
              onChange={(e) => setSelectedOffers(e.value || [])}
              optionLabel="title"
              dataKey="id"
              filter
              style={{ height: 45 }}
              filterDelay={300}
              filterPlaceholder="Rechercher une offre"
              placeholder={
                filteredOffers.length > 0
                  ? "Sélectionner une ou plusieurs offres"
                  : "Aucune offre au périmètre"
              }
              disabled={filteredOffers.length === 0}
              maxSelectedLabels={2}
              selectedItemsLabel="{0} offres"
              itemTemplate={offerTemplate}
              emptyFilterMessage="Aucune offre ne correspond"
              className="w-100"
            />
          </div>
        </div>
        <hr className="trk-filters-foot p-0 m-2" />
        <div className="trk-filters-info text-white">
          <small>Opérateur sélectionné(s) : </small>
        </div>

        {selectedOperators?.length > 0 && (
          <div className="trk-oper-chips">
            {selectedOperators.map((op) => (
              <span className="trk-oper-chip" key={`op-${op?.id}`}>
                <img alt={op?.name} src={imageUrl(op?.imagePath)} />
                {op?.name}
              </span>
            ))}
          </div>
        )}

        <div className="trk-filters-foot">
          <div className="trk-count text-white">
            <b className="text-white">{filteredOffers.length}</b> offre(s) au périmètre ·{" "}
            <b className="text-white" >{selectedOffers.length}</b> suivie(s)
          </div>
          <div className="trk-actions">
            <button
              type="button"
              className="trk-btn"
              onClick={() => setSelectedOffers(filteredOffers)}
              disabled={filteredOffers.length === 0}
            >
              <i className="bi bi-check2-all"></i> Tout suivre
            </button>
            <button
              type="button"
              className="trk-btn"
              onClick={() => setSelectedOffers([])}
              disabled={selectedOffers.length === 0}
            >
              <i className="bi bi-x-lg"></i> Vider la sélection
            </button>
            <button type="button" className="trk-btn trk-btn--accent" onClick={resetFilters}>
              <i className="bi bi-arrow-counterclockwise"></i> Réinitialiser
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="trk-loading">
          <span
            className="spinner-border spinner-border-sm"
            role="status"
            aria-hidden="true"
          ></span>
          Chargement des offres…
        </div>
      ) : selectedOffers.length === 0 ? (
        // Trois situations distinctes, au lieu d'un écran blanc ou d'un message
        // unique qui ne disait pas quoi faire.
        <div className="trk-empty" role="status">
          {selectedOperators.length === 0 ? (
            <>
              <i className="bi bi-building"></i>
              <div className="trk-empty-title">Aucun opérateur sélectionné</div>
              <div className="trk-empty-text">
                Choisissez au moins un opérateur pour charger ses offres.
              </div>
            </>
          ) : filteredOffers.length === 0 ? (
            <>
              <i className="bi bi-funnel"></i>
              <div className="trk-empty-title">
                Aucune offre ne correspond aux filtres
              </div>
              <div className="trk-empty-text">
                Élargissez les critères ou réinitialisez les filtres.
              </div>
            </>
          ) : (
            <>
              <i className="bi bi-graph-up-arrow"></i>
              <div className="trk-empty-title">Aucune offre suivie</div>
              <div className="trk-empty-text">
                Sélectionnez une ou plusieurs offres parmi les{" "}
                {filteredOffers.length} disponibles, ou cliquez sur « Tout
                suivre ».
              </div>
            </>
          )}
        </div>
      ) : (
        selectedOffers.map((o) => {
          const status = resolveStatus(o);
          const formulas = summarizeFormulas(o);
          const hidden = (o?.formulas?.length || 0) - formulas.length;
          // Frise d'évolution : une colonne par version (déclaration, puis
          // chaque monitoring). La hauteur des barres est relative au tarif le
          // plus élevé de CETTE offre   comparer d'une offre à l'autre n'aurait
          // aucun sens, les ordres de grandeur diffèrent trop.
          const versions = buildOfferVersions(o);
          const scale = Math.max(...versions.map((v) => v.min ?? 0), 0);

          return (
            <article
              className="trk-card"
              key={`trk-${o.id}`}
              style={{ "--trk-oper": o?.operator?.color || "#03832e" }}
            >
              <header className="trk-card-head">
                <img
                  className="trk-card-logo"
                  alt={o?.operator?.name}
                  src={imageUrl(o?.operator?.imagePath)}
                />
                <div className="trk-card-id">
                  <h2 className="trk-card-title">{o?.title}</h2>
                  <span className="trk-card-code">{o?.code}</span>
                </div>
                <div className="trk-badges">
                  <span
                    className="trk-badge"
                    style={{ background: status.light, color: status.text }}
                  >
                    <span
                      className="trk-dot"
                      style={{ background: status.dot }}
                    ></span>
                    {status.label}
                  </span>
                  {o?.category && (
                    <span className="trk-badge trk-badge--soft">
                      {CATEGORY_LABEL[o.category] || o.category}
                    </span>
                  )}
                  {o?.billingType && (
                    <span className="trk-badge trk-badge--soft">
                      {BILLING_LABEL[o.billingType] || o.billingType}
                    </span>
                  )}
                  {o?.specialPromotion && (
                    <span className="trk-badge trk-badge--soft">
                      Promotion {o.specialPromotion.type}
                    </span>
                  )}
                </div>
              </header>

              <div className="trk-card-body">
                <div className="trk-facts">
                  <div className="trk-fact">
                    <div className="trk-fact-label">Opérateur</div>
                    <div className="trk-fact-value">{o?.operator?.name}</div>
                  </div>
                  <div className="trk-fact">
                    <div className="trk-fact-label">Notifiée le</div>
                    <div className="trk-fact-value">
                      {formatDateToFrench(o?.notifiDate)}
                    </div>
                  </div>
                  <div className="trk-fact">
                    <div className="trk-fact-label">Publication souhaitée</div>
                    <div className="trk-fact-value">
                      {formatDateToFrench(o?.desiredDate)}
                    </div>
                  </div>
                  <div className="trk-fact">
                    <div className="trk-fact-label">Zone géographique</div>
                    <div className="trk-fact-value">
                      {o?.area?.title || "Non renseignée"}
                    </div>
                  </div>
                </div>

                <div>
                  {/* ── Frise d'évolution ──────────────────────────────────
                      Le cœur de l'onglet : l'offre et ses versions
                      successives, avec l'écart tarifaire de l'une à l'autre.
                      L'écran précédent empilait les formules sans jamais
                      montrer ce qui avait changé. */}
                  <div className="trk-evo">
                    <div className="trk-evo-head">
                      <span className="trk-evo-title">
                        <i className="bi bi-activity"></i> Évolution
                      </span>
                      <span className="trk-evo-note">
                        {versions.length === 1
                          ? "Version d'origine, aucun monitoring déposé"
                          : `${versions.length} versions · tarif d'entrée par version`}
                      </span>
                    </div>

                    <div
                      className="trk-evo-track"
                      style={{
                        gridTemplateColumns: `repeat(${versions.length}, minmax(78px, 1fr))`,
                      }}
                    >
                      {versions.map((v) => {
                        const vs = statusOf(v.statusKey);
                        const height =
                          scale > 0 && v.min != null
                            ? Math.max(10, Math.round((v.min / scale) * 100))
                            : null;
                        const up = v.delta?.price > 0;
                        const down = v.delta?.price < 0;

                        return (
                          <div className="trk-evo-col" key={v.key}>
                            <div className="trk-evo-plot">
                              {v.delta?.pricePct != null &&
                                v.delta.price !== 0 && (
                                  <span
                                    className={`trk-evo-delta ${
                                      up ? "is-up" : "is-down"
                                    }`}
                                  >
                                    <i
                                      className={`bi bi-arrow-${
                                        up ? "up" : "down"
                                      }-short`}
                                    ></i>
                                    {Math.abs(v.delta.pricePct)}%
                                  </span>
                                )}
                              {height != null ? (
                                <div
                                  className="trk-evo-bar"
                                  style={{
                                    height: `${height}%`,
                                    background: vs.bg,
                                  }}
                                  title={`${handleNumThousand(v.min)} F`}
                                ></div>
                              ) : (
                                <div
                                  className="trk-evo-bar trk-evo-bar--none"
                                  title="Aucun tarif renseigné"
                                ></div>
                              )}
                            </div>

                            <div className="trk-evo-value">
                              {v.min != null
                                ? `${handleNumThousand(v.min)} F`
                                : " "}
                            </div>

                            <div className="trk-evo-node">
                              <span
                                className="trk-evo-dot"
                                style={{ borderColor: vs.bg }}
                              ></span>
                            </div>

                            <div className="trk-evo-label" title={v.title || v.label}>
                              {v.label}
                            </div>
                            <div className="trk-evo-date">
                              {formatDateToFrench(v.date)}
                            </div>
                            <div className="trk-evo-count">
                              {v.count} formule(s)
                              {v.delta && v.delta.count !== 0 && (
                                <b className={v.delta.count > 0 ? "is-up" : "is-down"}>
                                  {" "}
                                  {v.delta.count > 0 ? "+" : ""}
                                  {v.delta.count}
                                </b>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Parcours réel de l'offre (journal du circuit) : passé, présent, à venir. */}
                  <div className="trk-journal-title">Parcours de l'offre</div>
                  <OfferJourney offerId={o.id} />

                  {formulas.length > 0 && (
                    <div className="trk-formulas">
                      {formulas.map((f) => (
                        <span className="trk-formula" key={`f-${o.id}-${f.id}`}>
                          {f.title}
                          {f.price != null && (
                            <>
                              {"   "}
                              <b>{handleNumThousand(f.price)} F</b>
                            </>
                          )}
                          {f.validity ? ` · ${f.validity} j` : ""}
                        </span>
                      ))}
                      {hidden > 0 && (
                        <span className="trk-formula">+{hidden} autre(s)</span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <footer className="trk-card-foot">
                <span>
                  {o?.monitorings?.length || 0} monitoring(s) · dernière mise à
                  jour le {formatDateToFrench(o?.updatedAt)}
                </span>
                <button
                  type="button"
                  className="trk-btn"
                  onClick={() => handleViewOffer(o)}
                >
                  <i className="bi bi-eye"></i> Voir le détail
                </button>
              </footer>
            </article>
          );
        })
      )}

      <AdminOfferViewDialog
        visible={showViewDialog}
        setVisible={setShowViewDialog}
        offer={offer}
      />
    </div>
  );
}
