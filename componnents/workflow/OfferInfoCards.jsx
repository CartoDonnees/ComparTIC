import React from "react";
import Link from "next/link";
import WorkflowStatusBadge from "@/componnents/workflow/WorkflowStatusBadge";
import { formatDateTime, personName } from "@/services/tools/workflowLabels";

/**
 * Cartes communes aux deux fiches d'une offre : celle de l'ARTCI (circuit de
 * validation, `OfferWorkflowView`) et celle de l'opérateur (évolution de
 * l'offre, `OperatorOfferSheet`).
 */

/** Informations générales de l'offre. */
export function OfferInfoCard({ offer, details }) {
  return (
    <section className="wf-card" aria-labelledby="wf-info">
      <h2 className="wf-card-title" id="wf-info">
        <i className="bi bi-info-circle"></i> Offre
      </h2>
      <dl className="wf-facts">
        <div>
          <dt>Opérateur</dt>
          <dd>{offer.operator?.name || " "}</dd>
        </div>
        <div>
          <dt>Catégorie</dt>
          <dd>{details?.category || " "}</dd>
        </div>
        <div>
          <dt>Type de client</dt>
          <dd>{details?.billingType || " "}</dd>
        </div>
        <div>
          <dt>Déclarée par</dt>
          <dd>{details?.user ? personName(details.user) : " "}</dd>
        </div>
        <div>
          <dt>Notification</dt>
          <dd>{formatDateTime(details?.notifiDate)}</dd>
        </div>
        <div>
          <dt>Lancement souhaité</dt>
          <dd>{formatDateTime(details?.desiredDate)}</dd>
        </div>
        <div>
          <dt>Soumise le</dt>
          <dd>{formatDateTime(offer.submittedAt)}</dd>
        </div>
        {offer.validatedAt && (
          <div>
            <dt>Validée le</dt>
            <dd>{formatDateTime(offer.validatedAt)}</dd>
          </div>
        )}
        {offer.refusedAt && (
          <div>
            <dt>Refusée le</dt>
            <dd>{formatDateTime(offer.refusedAt)}</dd>
          </div>
        )}
        {offer.deactivatedAt && (
          <div>
            <dt>Désactivée le</dt>
            <dd>{formatDateTime(offer.deactivatedAt)}</dd>
          </div>
        )}
        {details?.parent && (
          <div>
            <dt>Offre parente</dt>
            <dd>
              {details.parent.title} ({details.parent.code})
            </dd>
          </div>
        )}
        {details?.target && (
          <div>
            <dt>Cible</dt>
            {/* La cible est saisie en texte riche : seules ses phrases sont affichées. */}
            <dd>{String(details.target).replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim()}</dd>
          </div>
        )}
      </dl>
    </section>
  );
}

/**
 * Versions successives de l'offre.
 * @param emptyText  texte affiché quand l'offre n'a qu'une version
 */
export function OfferVersionsCard({ offer, versions, emptyText = "Aucun monitoring : cette offre n'a qu'une version." }) {
  return (
    <section className="wf-card" aria-labelledby="wf-versions">
      <h2 className="wf-card-title" id="wf-versions">
        <i className="bi bi-layers"></i> Versions
      </h2>
      {versions.length <= 1 ? (
        <p className="wf-empty">{emptyText}</p>
      ) : (
        <ul className="wf-versions">
          {versions.map((v) => (
            <li key={v.id} className={`wf-version ${v.id === offer.id ? "is-current" : ""}`}>
              <span>
                {v.id === offer.id ? (
                  `V${v.version}   ${v.code}`
                ) : (
                  <Link href={`/offer-workflow/${v.id}`}>
                    V{v.version}   {v.code}
                  </Link>
                )}
              </span>
              <WorkflowStatusBadge offer={v} showLevel={false} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
