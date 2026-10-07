import React, { useMemo, useState } from "react";
import Link from "next/link";
import { Dialog } from "primereact/dialog";
import WorkflowDecisionDialog from "@/componnents/workflow/WorkflowDecisionDialog";
import ValidatorComments from "@/componnents/workflow/ValidatorComments";
import { openOfferLetter } from "@/componnents/letters/OfferLetterHost";
import WorkflowStatusBadge from "@/componnents/workflow/WorkflowStatusBadge";
import OfferTypeBadge from "@/componnents/workflow/OfferTypeBadge";
import { toastInfo, toastSuccess } from "@/componnents/notification/notification";
import { LEVEL_FUNCTIONS, LEVEL_TITLES, formatDateTime } from "@/services/tools/workflowLabels";
import { convertMoToGo, formatDateToFrench } from "@/services/tools/helper";
import { handleNumThousand } from "@/services/tools/convertions";
import { renderMarkdown } from "@/services/tools/markdown";
import { deadlineStatusOf } from "@/services/workflow/deadlines";
import { hasText, sanitizeHtml } from "@/services/tools/sanitizeHtml";
import { BASE_FILE_URL } from "@/services/tools/constants";
import OperatorLogo from "@/componnents/common/OperatorLogo";

/**
 * Écran d'examen d'une offre avant décision.
 *
 * Réécrit : l'ancien écran affichait « POST-PAYÉ » et « FIXE » pour toutes les
 * offres (comparaison à 1 au lieu de PREPAID / MOBILE), un logo d'opérateur
 * codé en dur, les volumes de données < 1 Go sans unité, les avantages sans
 * libellé (`adv.name` inexistant) ; les commentaires par formule n'étaient
 * pas enregistrés, et le texte saisi par l'opérateur était injecté sans
 * nettoyage.
 *
 * @param offer          offre (file de validation)
 * @param workflowInfo   actions autorisées par le serveur
 * @param analysis       { status: "loading"|"ready"|"error", text?, message?, durationMs? }
 * @param offerText      description textuelle transmise à l'assistant
 * @param review         { [formulaId]: { verdict: "OK"|"KO", comment } }
 * @param onReviewChange (review) => void
 * @param onRetryAnalysis relance l'analyse
 * @param onDecided      appelé après une décision enregistrée
 * @param contentRef     zone imprimable
 */

const SERVICE_META = {
  VOIX: { icon: "bi-telephone", label: "Appels", unit: "min", step: "F/min" },
  SMS: { icon: "bi-chat-dots", label: "SMS", unit: "SMS", step: "F/SMS" },
  DATA: { icon: "bi-globe2", label: "Internet", unit: "", step: "F/Mo" },
};
const COMTYPE = { ALL_NET: "Tous réseaux", ON_NET: "On-net", OFF_NET: "Off-net" };
const BILLING = { PREPAID: "Prépayé", POSTPAID: "Postpayé", HYBRID: "Hybride" };
const CATEGORY = { MOBILE: "Mobile", FIXE: "Fixe" };
const PROMO = { FLASH: "Flash", PERIOD: "Périodique", SPECIAL: "Spéciale", CUSTOMIZE: "Personnalisée" };

const daysBetween = (from, to) => Math.round((new Date(to) - new Date(from)) / 86400000);

export const extractConformityRate = (text) => {
  const m = String(text || "").match(/taux\s+de\s+conformit[ée]\s*\**\s*:?\s*\**\s*(\d{1,3}(?:[.,]\d+)?)\s*%/i);
  if (!m) return null;
  const v = Math.round(parseFloat(m[1].replace(",", ".")));
  return v >= 0 && v <= 100 ? v : null;
};

function Section({ icon, title, extra, children }) {
  return (
    <section className="rv-card">
      <header className="rv-card-head">
        <h3>
          <i className={`bi ${icon}`} aria-hidden="true"></i> {title}
        </h3>
        {extra}
      </header>
      <div className="rv-card-body">{children}</div>
    </section>
  );
}

function RichText({ html, empty = "Non renseigné" }) {
  const clean = useMemo(() => sanitizeHtml(html), [html]);
  if (!hasText(html)) return <span className="rv-empty">{empty}</span>;
  return <div className="rv-rich" dangerouslySetInnerHTML={{ __html: clean }} />;
}

function ServiceLine({ detail }) {
  const title = detail?.service?.title;
  const meta = SERVICE_META[title] || { icon: "bi-dot", label: title || "Service", unit: "", step: "F" };
  const qty = Number(detail?.quantity);
  const amount =
    title === "DATA" ? convertMoToGo(qty) : `${Number.isFinite(qty) ? handleNumThousand(qty) : "?"}${meta.unit ? ` ${meta.unit}` : ""}`;
  return (
    <li className="rv-service">
      <i className={`bi ${meta.icon}`} aria-hidden="true"></i>
      <span className="rv-service-label">{meta.label}</span>
      <b>{amount}</b>
      {detail?.comtype && <span className="rv-tag">{COMTYPE[detail.comtype] || detail.comtype}</span>}
      {detail?.billingSteps ? <span className="rv-muted">Pas : {detail.billingSteps} {meta.step}</span> : null}
      {detail?.offerRate?.value != null && <span className="rv-muted">Hors forfait : {detail.offerRate.value} F</span>}
    </li>
  );
}

function FormulaCard({ formula, index, subFormulas, value, onChange, readOnly }) {
  const verdict = value?.verdict;
  const comment = value?.comment?.trim();
  // À l'impression : uniquement la conformité choisie (et l'observation) ;
  // rien si la formule n'a pas été examinée.
  const printed = !readOnly && (verdict || comment);
  return (
    <article
      className={`rv-formula${verdict === "OK" ? " is-ok" : verdict === "KO" ? " is-ko" : ""}${printed ? " has-print-verdict" : ""}`}
    >
      <div className="rv-formula-main">
        <div className="rv-formula-head">
          <span className="rv-formula-index">{index + 1}</span>
          <div className="rv-formula-title">
            <b>{formula?.title || "Formule sans titre"}</b>
            <small>Valable {formula?.validity ?? "?"} jour(s)</small>
          </div>
          <div className="rv-price">
            {formula?.price?.value != null ? (
              <>
                {handleNumThousand(formula.price.value)} <small>FCFA</small>
              </>
            ) : (
              <span className="rv-warn-text">Prix non renseigné</span>
            )}
          </div>
        </div>

        {formula?.serviceDetail?.length ? (
          <ul className="rv-services">
            {formula.serviceDetail.map((d) => (
              <ServiceLine key={d.id} detail={d} />
            ))}
          </ul>
        ) : (
          <div className="rv-empty">Aucun service renseigné.</div>
        )}

        {formula?.advantages?.length > 0 && (
          <div className="rv-advantages">
            {formula.advantages.map((a) => (
              <span key={a.id} className="rv-chip" title={a.description ? a.description.replace(/<[^>]*>/g, "") : undefined}>
                <i className="bi bi-gift" aria-hidden="true"></i> {a.title}
              </span>
            ))}
          </div>
        )}

        {subFormulas?.length > 0 && (
          <div className="rv-children">
            <div className="rv-muted mb-1">Sous-formules</div>
            {subFormulas.map((c) => (
              <div key={c.id} className="rv-child">
                <b>{c.title}</b>
                {c.price?.value != null && <span> · {handleNumThousand(c.price.value)} FCFA</span>}
                <span className="rv-muted"> · {c.validity} j</span>
                {c.serviceDetail?.length > 0 && (
                  <ul className="rv-services rv-services--compact">
                    {c.serviceDetail.map((d) => (
                      <ServiceLine key={d.id} detail={d} />
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {printed && (
        <div className="rv-verdict-print">
          {verdict && (
            <span className={`rv-verdict-badge ${verdict === "OK" ? "is-ok" : "is-ko"}`}>
              {verdict === "OK" ? "✓ Conforme" : "✗ Non conforme"}
            </span>
          )}
          {comment && (
            <div className="rv-verdict-comment">
              <span>Observation :</span> {comment}
            </div>
          )}
        </div>
      )}

      {!readOnly && (
        <div className="rv-verdict">
          <div className="rv-verdict-label">Examen</div>
          <div className="rv-segment" role="radiogroup" aria-label={`Conformité de la formule ${formula?.title || index + 1}`}>
            <button
              type="button"
              role="radio"
              aria-checked={verdict === "OK"}
              className={verdict === "OK" ? "is-ok" : ""}
              onClick={() => onChange({ ...value, verdict: verdict === "OK" ? null : "OK" })}
            >
              <i className="bi bi-check-lg" aria-hidden="true"></i> Conforme
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={verdict === "KO"}
              className={verdict === "KO" ? "is-ko" : ""}
              onClick={() => onChange({ ...value, verdict: verdict === "KO" ? null : "KO" })}
            >
              <i className="bi bi-x-lg" aria-hidden="true"></i> Non conforme
            </button>
          </div>
          <textarea
            className="form-control form-control-sm"
            rows={2}
            maxLength={1000}
            placeholder={verdict === "KO" ? "Motif de non-conformité (recommandé)" : "Observation (facultatif)"}
            value={value?.comment || ""}
            onChange={(e) => onChange({ ...value, comment: e.target.value })}
            aria-label="Observation sur la formule"
          />
        </div>
      )}
    </article>
  );
}

const READER_SIZES = [0.9, 1, 1.12, 1.25];

/** Lecture confortable de la pré-analyse, dans une fenêtre dédiée. */
function AnalysisReader({ visible, onHide, analysis, html, rate, tone, offer, assistantHref, onCopy }) {
  const [size, setSize] = useState(1);
  return (
    <Dialog
      visible={visible}
      onHide={onHide}
      modal
      dismissableMask
      maximizable
      className="rv-reader-dialog"
      style={{ width: "min(900px, 96vw)" }}
      breakpoints={{ "641px": "100vw" }}
      header={
        <div className="rv-reader-head">
          <span className="rv-reader-icon" aria-hidden="true">
            <i className="bi bi-robot"></i>
          </span>
          <div className="min-w-0">
            <div className="rv-reader-title">Pré-analyse ComparIA</div>
            <div className="rv-reader-sub">
              {offer?.title}
              {offer?.code ? ` · ${offer.code}` : ""}
            </div>
          </div>
        </div>
      }
      footer={
        <div className="rv-reader-foot">
          <span className="rv-muted small">
            {analysis?.durationMs ? `Générée en ${(analysis.durationMs / 1000).toFixed(1)} s · ` : ""}
            Analyse indicative : vérifiez-la avant toute décision.
          </span>
          <div className="d-flex gap-2">
            <button type="button" className="btn btn-outline-secondary btn-sm" onClick={onCopy}>
              <i className="bi bi-copy me-1" aria-hidden="true"></i> Copier
            </button>
            <Link className="btn btn-outline-secondary btn-sm" target="_blank" href={assistantHref}>
              <i className="bi bi-chat-dots me-1" aria-hidden="true"></i> Poursuivre avec l'assistant
            </Link>
            <button type="button" className="btn btn-dark btn-sm" onClick={onHide}>
              Fermer
            </button>
          </div>
        </div>
      }
    >
      <div className="rv-reader">
        <div className="rv-reader-toolbar">
          {rate != null ? (
            <div className={`rv-rate rv-rate--${tone} rv-reader-rate`}>
              <div className="rv-rate-value">{rate}%</div>
              <div className="flex-grow-1">
                <div className="rv-rate-bar" aria-hidden="true">
                  <span style={{ width: `${rate}%` }}></span>
                </div>
                <div className="rv-muted">Taux de conformité estimé</div>
              </div>
            </div>
          ) : (
            <span />
          )}
          <div className="rv-reader-size" role="group" aria-label="Taille du texte">
            <button
              type="button"
              onClick={() => setSize((i) => Math.max(0, i - 1))}
              disabled={size === 0}
              title="Réduire le texte"
              aria-label="Réduire le texte"
            >
              A<sup>−</sup>
            </button>
            <button
              type="button"
              onClick={() => setSize((i) => Math.min(READER_SIZES.length - 1, i + 1))}
              disabled={size === READER_SIZES.length - 1}
              title="Agrandir le texte"
              aria-label="Agrandir le texte"
            >
              A<sup>+</sup>
            </button>
          </div>
        </div>
        <article
          className="rv-markdown rv-reader-text"
          style={{ fontSize: `${READER_SIZES[size]}rem` }}
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>
    </Dialog>
  );
}

function AnalysisPanel({ analysis, onRetry, offer }) {
  const [expanded, setExpanded] = useState(false);
  const [reading, setReading] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  // Analyse antérieure consultée (null = analyse de référence).
  const [older, setOlder] = useState(null);
  // Pendant une nouvelle analyse, la précédente reste affichée.
  const shown = analysis?.status === "loading" && analysis.previous ? analysis.previous : analysis;
  const running = analysis?.status === "loading" && analysis.phase === "running";
  const html = useMemo(() => (shown?.status === "ready" ? renderMarkdown(shown.text) : ""), [shown]);
  const rate = shown?.status === "ready" ? extractConformityRate(shown.text) : null;
  const olderHtml = useMemo(() => (older ? renderMarkdown(older.content) : ""), [older]);
  const history = shown?.history || [];
  const canRun = !!(analysis?.canRun ?? shown?.canRun);
  const who = (a) => [a?.requestedBy?.firstName, a?.requestedBy?.lastName].filter(Boolean).join(" ") || "un utilisateur";
  const tone = rate == null ? "neutral" : rate >= 80 ? "good" : rate >= 50 ? "mid" : "bad";

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(shown.text);
      toastInfo("Analyse copiée", 1200);
    } catch {
      toastInfo("La copie n'est pas disponible dans ce navigateur.", 2000);
    }
  };

  // ComparIA reçoit l'identifiant de l'offre : la page charge elle-même le
  // contexte et l'analyse enregistrée (l'ancien lien les passait dans l'adresse,
  // qui devenait trop longue et n'aboutissait pas).
  const assistantHref = { pathname: "/admin-assistant", query: { offer: offer?.id } };

  return (
    <section className="rv-card rv-ai">
      <header className="rv-card-head">
        <h3>
          <i className="bi bi-robot" aria-hidden="true"></i> Analyse IA
        </h3>
        <div className="rv-head-actions">
          {shown?.status === "ready" && (
            <>
              <button type="button" className="rv-icon-btn rv-icon-btn--accent" onClick={() => setReading(true)} title="Lire l'analyse en grand">
                <i className="bi bi-arrows-angle-expand" aria-hidden="true"></i>
              </button>
              <button type="button" className="rv-icon-btn" onClick={copy} title="Copier l'analyse">
                <i className="bi bi-copy" aria-hidden="true"></i>
              </button>
            </>
          )}
        </div>
      </header>
      <div className="rv-card-body">
        {analysis?.status === "loading" && !analysis.previous && analysis.phase === "reading" && (
          <div className="rv-ai-loading" role="status">
            <span className="spinner-border spinner-border-sm" aria-hidden="true"></span>
            <div className="rv-muted">Lecture de l'analyse enregistrée…</div>
          </div>
        )}

        {analysis?.status === "empty" && (
          <div className="rv-ai-empty">
            <i className="bi bi-robot" aria-hidden="true"></i>
            <div>
              <b>Aucune analyse IA pour cette offre.</b>
              <div className="rv-muted">
                {canRun
                  ? "Elle n'est pas lancée automatiquement : demandez-la si vous en avez besoin. Elle sera conservée pour tous les niveaux de validation."
                  : "Elle sera visible ici dès qu'un validateur l'aura demandée."}
              </div>
            </div>
          </div>
        )}

        {analysis?.status === "loading" && !analysis.previous && analysis.phase !== "reading" && (
          <div className="rv-ai-loading" role="status">
            <div className="rv-ai-pulse" aria-hidden="true">
              <span></span>
              <span></span>
              <span></span>
            </div>
            <div>
              <b>Analyse de conformité en cours…</b>
              <div className="rv-muted">
                L'assistant compare l'offre aux décisions de l'ARTCI. Vous pouvez examiner l'offre en attendant.
              </div>
            </div>
          </div>
        )}

        {analysis?.status === "error" && (
          <div className="rv-ai-error" role="alert">
            <i className="bi bi-exclamation-triangle" aria-hidden="true"></i>
            <div>
              <b>Analyse indisponible.</b> {analysis.message}
              <div className="rv-muted">Elle est indicative : vous pouvez statuer sans elle.</div>
            </div>
            <button type="button" className="btn btn-sm btn-outline-secondary ms-auto" onClick={onRetry}>
              Réessayer
            </button>
          </div>
        )}

        {shown?.status === "ready" && (
          <>
            {/* Analyse CONSERVÉE : origine, et rappel qu'aucun calcul n'a été relancé. */}
            <div className="rv-ai-meta">
              <i className="bi bi-archive" aria-hidden="true"></i>
              <span>
                Analyse enregistrée le {formatDateTime(shown.meta?.createdAt)}    demandée par {who(shown.meta)}
                {shown.meta?.level ? ` (niveau ${shown.meta.level})` : ""}. Elle sert de référence à tous les validateurs.
              </span>
            </div>
            {running && (
              <div className="rv-ai-running" role="status">
                <span className="spinner-border spinner-border-sm" aria-hidden="true"></span> Nouvelle analyse en cours… l'analyse précédente reste affichée.
              </div>
            )}
            {analysis?.runError && !running && (
              <div className="rv-ai-error" role="alert">
                <i className="bi bi-exclamation-triangle" aria-hidden="true"></i>
                <div>
                  <b>La nouvelle analyse n'a pas abouti.</b> {analysis.runError}
                </div>
              </div>
            )}
            {rate != null && (
              <div className={`rv-rate rv-rate--${tone}`}>
                <div className="rv-rate-value">{rate}%</div>
                <div className="rv-rate-bar" aria-hidden="true">
                  <span style={{ width: `${rate}%` }}></span>
                </div>
                <div className="rv-muted">Taux de conformité estimé</div>
              </div>
            )}
            <div className={`rv-ai-text${expanded ? " is-expanded" : ""}`}>
              <div className="rv-markdown" dangerouslySetInnerHTML={{ __html: html }} />
            </div>
            <div className="d-flex justify-content-between align-items-center mt-2">
              <span className="d-flex gap-3">
              <button type="button" className="btn btn-link btn-sm p-0" onClick={() => setReading(true)}>
                <i className="bi bi-arrows-angle-expand me-1" aria-hidden="true"></i>Ouvrir en grand
              </button>
              <button type="button" className="btn btn-link btn-sm p-0" onClick={() => setExpanded((v) => !v)}>
                {expanded ? "Réduire" : "Déplier ici"}
              </button>
              </span>
              <span className="rv-muted small">
                {shown.durationMs ? `${(shown.durationMs / 1000).toFixed(1)} s · ` : ""}Indicatif, à vérifier
              </span>
            </div>
          </>
        )}

        {/* Actions : jamais d'analyse automatique après la première. */}
        {analysis?.status && !(analysis.status === "loading" && analysis.phase === "reading") && (
          <div className="rv-ai-actions">
            {canRun && (
              <button type="button" className="btn btn-sm btn-outline-success" onClick={onRetry} disabled={analysis.status === "loading"} title={shown?.status === "ready" ? "Demander une nouvelle analyse ; la précédente reste dans l'historique" : "Demander l'analyse de cette offre"}>
                <i className="bi bi-stars me-1" aria-hidden="true"></i>
                {analysis.status === "loading" ? "Analyse en cours…" : shown?.status === "ready" ? "Nouvelle analyse avec l'IA" : "Analyser avec l'IA"}
              </button>
            )}
            <Link className="btn btn-sm btn-outline-secondary" target="_blank" href={assistantHref} title="Ouvrir ComparIA dans un nouvel onglet, avec cette offre et son analyse">
              <i className="bi bi-chat-dots me-1" aria-hidden="true"></i> Analyser avec ComparIA
            </Link>
          </div>
        )}

        {history.length > 0 && (
          <div className="rv-ai-history">
            <button type="button" className="btn btn-link btn-sm p-0" onClick={() => setHistoryOpen((v) => !v)} aria-expanded={historyOpen}>
              <i className={`bi ${historyOpen ? "bi-chevron-up" : "bi-chevron-down"} me-1`} aria-hidden="true"></i>
              Analyses précédentes ({history.length})
            </button>
            {historyOpen && (
              <ul>
                {history.map((h) => (
                  <li key={h.id}>
                    <button type="button" className="btn btn-link btn-sm p-0" onClick={() => setOlder(h)}>
                      {formatDateTime(h.createdAt)}
                    </button>
                    <span className="rv-muted">
                      {" "}
                         {who(h)}
                      {h.level ? `, niveau ${h.level}` : ""}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
      <Dialog
        header={older ? `Analyse du ${formatDateTime(older.createdAt)}` : ""}
        visible={!!older}
        onHide={() => setOlder(null)}
        style={{ width: "min(820px, 96vw)" }}
        modal
        dismissableMask
      >
        {older && (
          <>
            <p className="rv-muted small">
              Analyse antérieure, conservée pour mémoire    demandée par {who(older)}
              {older.level ? ` (niveau ${older.level})` : ""}. L'analyse de référence est la plus récente.
            </p>
            <div className="rv-markdown" dangerouslySetInnerHTML={{ __html: olderHtml }} />
          </>
        )}
      </Dialog>
      {shown?.status === "ready" && (
        <AnalysisReader
          visible={reading}
          onHide={() => setReading(false)}
          analysis={shown}
          html={html}
          rate={rate}
          tone={tone}
          offer={offer}
          assistantHref={assistantHref}
          onCopy={copy}
        />
      )}
    </section>
  );
}

export default function SummaryValidation({
  offer,
  workflowInfo,
  analysis,
  review = {},
  onReviewChange,
  onRetryAnalysis,
  onDecided,
  contentRef,
}) {
  const [decision, setDecision] = useState(null); // "VALIDATE" | "REFUSE" | null

  const acts = workflowInfo?.actions || [];
  const canValidate = acts.includes("VALIDATE_TRANSMIT") || acts.includes("VALIDATE_FINAL");
  const canRefuse = acts.includes("REFUSE");
  const canFinal = acts.includes("VALIDATE_FINAL");
  const canTransmit = acts.includes("VALIDATE_TRANSMIT");
  const canDecide = canValidate || canRefuse;
  // État frais du serveur plutôt que la ligne de la liste, qui peut dater.
  const status = workflowInfo?.workflowStatus ?? offer?.workflowStatus;
  const level = workflowInfo ? workflowInfo.currentValidationLevel : offer?.currentValidationLevel;
  const circuitClosed = ["VALIDATED", "REFUSED", "DEACTIVATED"].includes(status);

  const formulas = Array.isArray(offer?.formulas) ? offer.formulas : [];
  const topFormulas = formulas.filter((f) => !f.parentId || !formulas.some((p) => p.id === f.parentId));
  const childrenOf = (id) => formulas.filter((f) => f.parentId === id);

  const reviewed = topFormulas.filter((f) => review[f.id]?.verdict);
  const koFormulas = topFormulas.filter((f) => review[f.id]?.verdict === "KO");
  const okCount = reviewed.length - koFormulas.length;

  const promo = offer?.specialPromotion;
  // Délai réglementaire (décision 2024-1098) : préavis exigé selon le type.
  const deadline = deadlineStatusOf(offer);
  const notice = deadline.noticeGivenDays;
  const promoEnd = promo && offer?.desiredDate ? new Date(new Date(offer.desiredDate).getTime() + Number(promo.duration) * 86400000) : null;
  const launchIn = offer?.desiredDate ? Math.ceil((new Date(offer.desiredDate) - Date.now()) / 86400000) : null;
  const author = [offer?.user?.firstName, offer?.user?.lastName].filter(Boolean).join(" ");

  const setFormulaReview = (id, value) => onReviewChange?.({ ...review, [id]: value });

  /** Commentaire pré-rempli à partir de l'examen des formules. */
  const initialComment = () => {
    const line = (f) => {
      const r = review[f.id];
      const price = f.price?.value != null ? ` (${handleNumThousand(f.price.value)} FCFA)` : "";
      return `- ${f.title}${price}${r?.comment?.trim() ? ` : ${r.comment.trim()}` : ""}`;
    };
    const ok = topFormulas.filter((f) => review[f.id]?.verdict === "OK");
    return [
      ok.length ? `Formules conformes :\n${ok.map(line).join("\n")}` : "",
      koFormulas.length ? `Formules non conformes :\n${koFormulas.map(line).join("\n")}` : "",
    ]
      .filter(Boolean)
      .join("\n\n");
  };

  const documentUrl = offer?.document?.path ? BASE_FILE_URL + encodeURIComponent(offer.document.path) : null;

  return (
    <div className="rv">
      <div className="rv-layout">
        {/* ------------------------------------------------ Contenu examiné */}
        <div className="rv-main" ref={contentRef}>
          <section className="rv-hero" style={{ "--op": offer?.operator?.color || "#475569" }}>
            <OperatorLogo operator={offer?.operator} size={64} rounded={16} className="rv-hero-logo" />
            <div className="rv-hero-text">
              <div className="rv-hero-op">{offer?.operator?.name}</div>
              <h2>{offer?.title}</h2>
              <div className="rv-hero-meta">
                <span className="rv-code">{offer?.code}</span>
                {offer?.version > 1 && <span className="rv-tag">Version {offer.version}</span>}
                <span className="wf">
                  <OfferTypeBadge offer={offer} />
                </span>
                <span className="wf">
                  <WorkflowStatusBadge offer={{ ...offer, workflowStatus: status, currentValidationLevel: level }} finalLevel={workflowInfo?.finalLevel} />
                </span>
              </div>
            </div>
          </section>

          <Section icon="bi-info-circle" title="Informations générales">
            <div className="rv-facts">
              <div className="rv-fact">
                <span>Catégorie</span>
                <b>{CATEGORY[offer?.category] || offer?.category || "?"}</b>
              </div>
              <div className="rv-fact">
                <span>Type de client</span>
                <b>{BILLING[offer?.billingType] || offer?.billingType || "?"}</b>
              </div>
              <div className="rv-fact">
                <span>Zone</span>
                <b>{offer?.area?.title || "Non renseignée"}</b>
              </div>
              <div className="rv-fact">
                <span>Notifiée à l'ARTCI</span>
                <b>{formatDateToFrench(offer?.notifiDate)}</b>
              </div>
              <div className="rv-fact">
                <span>Lancement souhaité</span>
                <b>{formatDateToFrench(offer?.desiredDate)}</b>
                {launchIn != null && (
                  <small className={launchIn < 0 ? "rv-bad" : launchIn <= 7 ? "rv-warn-text" : "rv-muted"}>
                    {launchIn < 0 ? `dépassé de ${-launchIn} j` : launchIn === 0 ? "aujourd'hui" : `dans ${launchIn} j`}
                  </small>
                )}
              </div>
              <div className={`rv-fact${deadline.noticeCompliant === false ? " rv-fact--alert" : ""}`}>
                <span>Préavis réglementaire</span>
                <b>
                  {notice != null ? `${notice} j` : "?"} / {deadline.requiredNoticeDays} j exigés
                </b>
                <small className={deadline.noticeCompliant === false ? "rv-bad" : "rv-muted"}>
                  {deadline.noticeCompliant === false
                    ? `Préavis insuffisant pour une ${deadline.kindLabel}`
                    : deadline.noticeCompliant
                      ? `Conforme pour une ${deadline.kindLabel}`
                      : "Dates incomplètes"}
                </small>
              </div>
              <div className="rv-fact">
                <span>Soumise le</span>
                <b>{formatDateToFrench(offer?.submittedAt || offer?.updatedAt)}</b>
                {author && <small className="rv-muted">par {author}</small>}
              </div>
              {promo && (
                <div className="rv-fact rv-fact--promo">
                  <span>Promotion {PROMO[promo.type] || promo.type}</span>
                  <b>{Number(promo.duration)} jour(s)</b>
                  {promoEnd && <small className="rv-muted">jusqu'au {formatDateToFrench(promoEnd)}</small>}
                </div>
              )}
              {promo && (
                <div className="rv-fact">
                  <span>Offre de base</span>
                  <b>{offer?.parent?.title || "Non rattachée"}</b>
                  {offer?.parent?.code && <small className="rv-muted">{offer.parent.code}</small>}
                </div>
              )}
            </div>
          </Section>

          <div className="rv-grid-2">
            <Section icon="bi-people" title="Cible">
              <RichText html={offer?.target} empty="Cible non renseignée" />
            </Section>
            <Section icon="bi-key" title="Modes d'accès">
              {offer?.accessModes?.filter((a) => hasText(a.content)).length ? (
                <ul className="rv-access">
                  {offer.accessModes
                    .filter((a) => hasText(a.content))
                    .map((a) => (
                      <li key={a.id}>
                        <RichText html={a.content} />
                      </li>
                    ))}
                </ul>
              ) : (
                <span className="rv-empty">Aucun mode d'accès renseigné</span>
              )}
            </Section>
          </div>

          <Section icon="bi-card-text" title="Description">
            <RichText html={offer?.description} empty="Description non renseignée" />
          </Section>

          <Section
            icon="bi-layers"
            title={`Formules (${topFormulas.length})`}
            extra={
              canDecide && topFormulas.length > 0 ? (
                <span className="rv-muted small">
                  {reviewed.length}/{topFormulas.length} examinée(s)
                </span>
              ) : null
            }
          >
            {topFormulas.length ? (
              <div className="rv-formulas">
                {topFormulas.map((f, i) => (
                  <FormulaCard
                    key={f.id}
                    formula={f}
                    index={i}
                    subFormulas={childrenOf(f.id)}
                    value={review[f.id]}
                    onChange={(v) => setFormulaReview(f.id, v)}
                    readOnly={!canDecide}
                  />
                ))}
              </div>
            ) : (
              <div className="rv-alert rv-alert--warn">
                <i className="bi bi-exclamation-triangle" aria-hidden="true"></i> Aucune formule n'est rattachée à cette offre.
              </div>
            )}
          </Section>
        </div>

        {/* ------------------------------------------------ Décision */}
        <aside className="rv-side">

          <AnalysisPanel analysis={analysis} onRetry={onRetryAnalysis} offer={offer} />

          <section className="rv-card">
            <header className="rv-card-head">
              <h3>
                <i className="bi bi-paperclip" aria-hidden="true"></i> Document joint
              </h3>
            </header>
            <div className="rv-card-body">
              {documentUrl ? (
                <a href={documentUrl} target="_blank" rel="noopener noreferrer" className="rv-doc">
                  <i className="bi bi-file-earmark-text" aria-hidden="true"></i>
                  <span>{offer.document.path.split("/").pop()}</span>
                  <i className="bi bi-box-arrow-up-right ms-auto" aria-hidden="true"></i>
                </a>
              ) : (
                <span className="rv-empty">Aucun document joint</span>
              )}
            </div>
          </section>
          {/* Avis des niveaux précédents : contexte de la décision, en lecture seule. */}
          {offer?.id && (level > 1 || circuitClosed) && <ValidatorComments offerId={offer.id} refreshKey={status} />}

          <section className="rv-card rv-decision">
            <header className="rv-card-head">
              <h3>
                <i className="bi bi-clipboard-check" aria-hidden="true"></i> Décision
              </h3>
              <Link href={`/offer-workflow/${offer?.id}`} className="rv-link" target="_blank">
                Circuit <i className="bi bi-box-arrow-up-right" aria-hidden="true"></i>
              </Link>
            </header>
            <div className="rv-card-body">
              {canDecide ? (
                <>
                  <div className="rv-level">
                    <span className="rv-level-badge">V{level}</span>
                    <div>
                      <b>{LEVEL_TITLES[level]}</b>
                      <div className="rv-muted small">{LEVEL_FUNCTIONS[level]}</div>
                    </div>
                  </div>
                  <p className="rv-muted small mb-2">
                    {canTransmit && canFinal
                      ? `Offre promotionnelle : validation définitive possible sans transmettre, ou transmission au ${LEVEL_TITLES[level + 1]}.`
                      : canFinal
                        ? "Votre validation sera définitive et déclenchera les notifications."
                        : `Votre validation transmettra l'offre au ${LEVEL_TITLES[level + 1]}.`}
                  </p>

                  {topFormulas.length > 0 && (
                    <div className="rv-progress">
                      <div className="rv-progress-bar" aria-hidden="true">
                        <span className="is-ok" style={{ width: `${(okCount / topFormulas.length) * 100}%` }}></span>
                        <span className="is-ko" style={{ width: `${(koFormulas.length / topFormulas.length) * 100}%` }}></span>
                      </div>
                      <div className="rv-progress-legend">
                        <span>
                          <i className="rv-dot is-ok"></i> {okCount} conforme(s)
                        </span>
                        <span>
                          <i className="rv-dot is-ko"></i> {koFormulas.length} non conforme(s)
                        </span>
                        <span>
                          <i className="rv-dot"></i> {topFormulas.length - reviewed.length} à examiner
                        </span>
                      </div>
                    </div>
                  )}

                  {koFormulas.length > 0 && (
                    <div className="rv-alert rv-alert--danger">
                      <i className="bi bi-exclamation-octagon" aria-hidden="true"></i>
                      {koFormulas.length} formule(s) marquée(s) non conforme(s) : un refus est à envisager.
                    </div>
                  )}
                  {topFormulas.length > 0 && reviewed.length < topFormulas.length && (
                    <div className="rv-muted small mb-2">
                      L'examen des formules est facultatif ; il pré-remplit le commentaire de décision.
                    </div>
                  )}

                  <div className="rv-decision-actions">
                    {canValidate && (
                      <button type="button" className="btn btn-success" onClick={() => setDecision("VALIDATE")}>
                        <i className={`bi ${canFinal && !canTransmit ? "bi-check2-all" : "bi-check2-circle"} me-2`} aria-hidden="true"></i>
                        {canTransmit && canFinal ? "Valider" : canFinal ? "Valider définitivement" : "Valider et transmettre"}
                      </button>
                    )}
                    {canRefuse && (
                      <button type="button" className="btn btn-outline-danger" onClick={() => setDecision("REFUSE")}>
                        <i className="bi bi-x-octagon me-2" aria-hidden="true"></i> Refuser
                      </button>
                    )}
                  </div>
                  <div className="rv-muted small mt-2">Un commentaire est obligatoire. La décision est tracée dans l'historique.</div>
                </>
              ) : (
                <div className={`rv-alert ${circuitClosed ? (status === "REFUSED" ? "rv-alert--danger" : "rv-alert--ok") : "rv-alert--info"}`}>
                  <i className={`bi ${circuitClosed ? "bi-lock" : "bi-eye"}`} aria-hidden="true"></i>
                  <span>
                    {circuitClosed
                      ? `Circuit clôturé : offre ${status === "REFUSED" ? "refusée" : status === "DEACTIVATED" ? "désactivée" : "validée définitivement"}. Aucune décision n'est attendue.`
                      : level
                        ? `Décision attendue du ${LEVEL_TITLES[level]} (${LEVEL_FUNCTIONS[level]}). Vous consultez l'offre sans pouvoir statuer.`
                        : "Aucune décision n'est attendue de votre part."}
                  </span>
                </div>
              )}
              {acts.includes("LETTER") && (
                <button type="button" className="btn btn-outline-success w-100 mt-2" onClick={() => openOfferLetter(offer)}>
                  <i className="bi bi-envelope-paper me-2" aria-hidden="true"></i>{" "}
                  {{ REFUSED: "Générer le courrier de refus", DEACTIVATED: "Générer le courrier de suspension" }[offer?.workflowStatus] || "Générer le courrier de validation"}
                </button>
              )}
            </div>
          </section>
        </aside>
      </div>

      <WorkflowDecisionDialog
        visible={!!decision}
        mode={decision || "VALIDATE"}
        offer={{ ...offer, currentValidationLevel: level }}
        finalLevel={workflowInfo?.finalLevel}
        canTransmit={canTransmit}
        canFinal={canFinal}
        initialComment={decision ? initialComment() : ""}
        onHide={() => setDecision(null)}
        onDone={(data) => {
          const refused = decision === "REFUSE";
          setDecision(null);
          toastSuccess(
            refused
              ? "Offre refusée. Le point focal a été notifié."
              : data?.offer?.workflowStatus === "VALIDATED"
                ? "Offre validée définitivement."
                : `Validation enregistrée : offre transmise au niveau ${data?.offer?.currentValidationLevel}.`,
          );
          onDecided?.(data);
        }}
      />


    </div>
  );
}
