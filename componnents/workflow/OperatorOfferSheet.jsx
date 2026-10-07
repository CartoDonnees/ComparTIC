import React from "react";
import Link from "next/link";
import { getOfferWorkflow } from "@/services/api/workflow/workflowApiService";
import OfferWorkflowActions from "@/componnents/workflow/OfferWorkflowActions";
import WorkflowStatusBadge from "@/componnents/workflow/WorkflowStatusBadge";
import { OfferInfoCard, OfferVersionsCard } from "@/componnents/workflow/OfferInfoCards";
import OperatorOfferDetailsButton from "@/componnents/screens/admin/operator/offer/view/OperatorOfferDetailsButton";
import { formatDateTime } from "@/services/tools/workflowLabels";

/**
 * Fiche d'une offre vue par l'opérateur (point focal).
 *
 * Elle dit où en est l'offre et comment elle a évolué (déclaration,
 * modifications, soumission, décision, versions), sans rien montrer du
 * circuit de validation de l'ARTCI : ni niveaux, ni décisions par niveau, ni
 * nom de validateur. Ces informations ne sont d'ailleurs pas transmises par
 * le serveur à un point focal (`services/workflow/operatorView.js`).
 *
 * @param state  réponse de `/api/workflow/offers/:id` pour un point focal
 */

const PROMO_LABEL = { SPECIAL: "Spéciale", FLASH: "Flash", PERIOD: "Périodique", CUSTOMIZE: "Personnalisée" };

const OUTCOME = {
  VALIDATED: { tone: "success", icon: "bi-patch-check-fill", text: "Offre validée par l'ARTCI" },
  REFUSED: { tone: "danger", icon: "bi-x-octagon", text: "Offre refusée par l'ARTCI" },
};

export default function OperatorOfferSheet({ state, router, reload }) {
  const load = reload || (async () => undefined);
  const { offer, details, versions, actions, offerType, viewer, outcome, events } = state;
  const listPath = "/operator-list-offer";
  const closing = OUTCOME[outcome?.status];
  // Du plus récent au plus ancien : le présent d'abord, puis ce qui y a mené.
  const steps = [...(events || [])].reverse();
  const [error, setError] = React.useState(null);

  return (
    <div className="wf py-3">
      <div className="wf-head">
        <div>
          <Link href={listPath} className="wf-back">
            <i className="bi bi-arrow-left"></i> Mes offres
          </Link>
          <h1 className="wf-title">{offer.title}</h1>
          <p className="wf-sub">
            <span>{offer.code}</span>
            <span>{offer.operator?.name}</span>
            <span>
              {offerType === "PROMOTION"
                ? `Offre promotionnelle${details?.specialPromotion?.type ? ` (${PROMO_LABEL[details.specialPromotion.type] || details.specialPromotion.type})` : ""}`
                : "Offre de base"}
            </span>
            {offer.version > 1 && <span>Version {offer.version}</span>}
            <span className={`wf-badge wf-tone-${state.published ? "success" : "muted"}`}>
              <i className={`bi ${state.published ? "bi-globe2" : "bi-eye-slash"}`} aria-hidden="true"></i>
              {state.published ? "Publiée sur le comparateur" : "Non publiée"}
            </span>
            <WorkflowStatusBadge offer={offer} showLevel={false} published={state.published} />
          </p>
        </div>
        <div className="wf-head-side">
          <OperatorOfferDetailsButton offerId={offer.id} label="Voir les détails de l'offre" className="wf-btn" onError={setError} />
          <OfferWorkflowActions
            offer={offer}
            info={{ actions }}
            role={viewer?.role}
            compact={false}
            showHistory={false}
            onEdit={() => router?.push(`${listPath}?edit=${offer.id}`)}
            onMonitor={() => router?.push(`${listPath}?monitor=${offer.id}`)}
            onChanged={async () => {
              // Une offre supprimée n'a plus de fiche : retour à la liste.
              const res = await getOfferWorkflow(offer.id);
              if (!res.ok && res.status === 404) router?.push(listPath);
              else load();
            }}
          />
        </div>
      </div>

      {error && (
        <div className="wf-alert wf-tone-danger" role="alert">
          {error}
        </div>
      )}

      {closing && (
        <div className={`wf-alert wf-tone-${closing.tone} wf-closure`} role="status">
          <i className={`bi ${closing.icon}`} aria-hidden="true"></i>
          <span>
            <b>{closing.text}</b>
            {outcome.at ? ` le ${formatDateTime(outcome.at)}.` : "."}
            {outcome.motive ? (
              <>
                {" "}
                <b>Motif :</b> {outcome.motive}
              </>
            ) : null}
            {outcome.status === "REFUSED" ? " Une nouvelle déclaration est nécessaire pour représenter l'offre." : ""}
          </span>
        </div>
      )}
      {["SUBMITTED", "IN_VALIDATION"].includes(offer.workflowStatus) && (
        <div className="wf-alert wf-tone-info" role="status">
          Votre offre est en cours d'examen par l'ARTCI. Vous serez notifié de la décision.
        </div>
      )}
      {offer.workflowStatus === "DEACTIVATED" && offer.deactivationReason === "MONITORING" && (
        <div className="wf-alert wf-tone-warning">
          {state.published
            ? "Cette version a été remplacée par une nouvelle version. Elle reste affichée sur le comparateur tant que la nouvelle version n'est pas validée."
            : "Cette version a été remplacée par une nouvelle version, qui est celle affichée sur le comparateur (voir « Versions »)."}
        </div>
      )}

      <div className="wf-grid">
        <div>
          {/* ---- Évolution de l'offre ------------------------------------- */}
          <section className="wf-card" aria-labelledby="wf-evolution">
            <h2 className="wf-card-title d-flex justify-content-between" id="wf-evolution">
              <span>
                <i className="bi bi-clock-history"></i> Évolution de l'offre
              </span>
              <Link href="/operator-activity" className="wf-event-meta" style={{ fontWeight: 500 }}>
                Suivi de toutes mes offres <i className="bi bi-arrow-right" aria-hidden="true"></i>
              </Link>
            </h2>
            {steps.length === 0 ? (
              <p className="wf-empty">Aucune étape enregistrée.</p>
            ) : (
              <ul className="wf-timeline">
                {steps.map((step) => (
                  <li key={step.id} className={`wf-event wf-tone-${step.tone}`}>
                    <span className="wf-event-ico" aria-hidden="true">
                      <i className={`bi ${step.icon}`}></i>
                    </span>
                    <div>
                      <div className="wf-event-title">{step.label}</div>
                      <div className="wf-event-meta">
                        {step.by && <span>{step.byOperator ? step.by : "ARTCI"}</span>}
                        <span>{formatDateTime(step.at)}</span>
                      </div>
                      {step.comment && (
                        <div className="wf-comment">
                          <b>{step.comment.label} :</b> {step.comment.text}
                        </div>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <div>
          <OfferInfoCard offer={offer} details={details} />
          <OfferVersionsCard offer={offer} versions={versions} emptyText="Cette offre n'a qu'une version." />
        </div>
      </div>
    </div>
  );
}
