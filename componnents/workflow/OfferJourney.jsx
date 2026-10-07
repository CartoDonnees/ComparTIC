import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { getOfferWorkflow } from "@/services/api/workflow/workflowApiService";
import { buildOfferJourney } from "@/services/tools/offerJourney";
import { ROLE_SHORT_LABELS, formatDateTime, personName, workflowStatusOf } from "@/services/tools/workflowLabels";

/**
 * Parcours d'une offre sous forme de frise : PASSÉ (toutes les étapes
 * tracées), PRÉSENT (statut, niveau attendu, action en attente, dernier
 * commentaire) et À VENIR (niveaux restants, publication, échéances).
 *
 * Les données viennent de la fiche de workflow (`/api/workflow/offers/:id`),
 * qui contrôle elle-même le droit de voir l'offre.
 *
 * @param offerId     offre suivie
 * @param refreshKey  change pour forcer une relecture
 * @param pastLimit   nombre d'étapes passées visibles avant « Tout afficher »
 */
export default function OfferJourney({ offerId, refreshKey, pastLimit = 5 }) {
  const [state, setState] = useState(null);
  const [error, setError] = useState(null);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    if (!offerId) return undefined;
    let cancelled = false;
    setState(null);
    setError(null);
    getOfferWorkflow(offerId).then((res) => {
      if (cancelled) return;
      if (res.ok) setState(res.data);
      else setError(res.error);
    });
    return () => {
      cancelled = true;
    };
  }, [offerId, refreshKey]);

  const journey = useMemo(() => buildOfferJourney(state), [state]);

  if (error) {
    return (
      <div className="jr-state jr-state--error" role="alert">
        <i className="bi bi-exclamation-triangle" aria-hidden="true"></i> {error}
      </div>
    );
  }
  if (!state) {
    return (
      <div className="jr-state" aria-busy="true">
        <span className="spinner-border spinner-border-sm" aria-hidden="true"></span> Chargement du parcours…
      </div>
    );
  }

  const { past, present, future, closed } = journey;
  const hiddenCount = showAll ? 0 : Math.max(0, past.length - pastLimit);
  const visiblePast = (hiddenCount ? past.slice(-pastLimit) : past)?.reverse();

  return (
    <div className="jr">

      {/* ---------------------------------------------------------- À venir */}
      <div className="jr-section">
        <div className="jr-section-title">
          <span>À venir</span>
        </div>
        {future.length ? (
          <ol className="jr-line jr-line--future">
            {future.map((f) => (
              <li key={f.key} className={`jr-step jr-step--future jr-tone-${f.tone || "neutral"}${f.optional ? " is-optional" : ""}`}>
                <span className="jr-node">
                  <i className={`bi ${f.icon || "bi-circle"}`} aria-hidden="true"></i>
                </span>
                <div className="jr-step-body">
                  <div className="jr-step-head">
                    {f.href ? (
                      <Link href={f.href} className="jr-link">
                        {f.title}
                      </Link>
                    ) : (
                      <b>{f.title}</b>
                    )}
                    {f.optional ? <span className="jr-pill">si nécessaire</span> : null}
                    {f.deadline ? <span className="jr-pill jr-pill--deadline">échéance</span> : null}
                  </div>
                  {f.text && <div className="jr-step-meta">{f.text}</div>}
                  {f.note && <div className="jr-step-meta">{f.note}</div>}
                </div>
              </li>
            ))}
          </ol>
        ) : (
          <div className="jr-empty">
            {closed ? "Aucune étape à venir : le circuit est clos. Une nouvelle déclaration est nécessaire pour représenter l'offre." : "Aucune étape à venir."}
          </div>
        )}
      </div>

      {/* ---------------------------------------------------------- Présent */}
      <div className="jr-section">
        <div className="jr-section-title">
          <span>Présent</span>
        </div>
        <div className={`jr-now jr-tone-${present.tone}`}>
          <span className="jr-now-icon">
            <i className={`bi ${present.icon}`} aria-hidden="true"></i>
          </span>
          <div className="jr-now-body">
            <div className="jr-now-head">
              <span className="jr-now-status">{present.label}</span>
              {present.level ? <span className="jr-pill">Niveau {present.level} / {state.finalLevel}</span> : null}
              {present.waiting ? <span className="jr-date">{present.waiting}</span> : null}
            </div>
            <div className="jr-now-text">{present.headline}</div>
            {present.pending.length > 0 && (
              <ul className="jr-pending">
                {present.pending.map((p) => (
                  <li key={p}>
                    <i className="bi bi-hourglass-split" aria-hidden="true"></i> {p}
                  </li>
                ))}
              </ul>
            )}
            {present.lastComment && (
              <div className="jr-comment">
                <span className="jr-comment-src">
                  Dernier commentaire : {present.lastComment.title}
                  {present.lastComment.actor ? `, ${personName(present.lastComment.actor)}` : ""} :
                </span>{" "}
                {present.lastComment.text}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------ Passé */}
      <div className="jr-section">
        <div className="jr-section-title">
          <span>Passé</span>
          <small>{past.length} étape(s)</small>
        </div>
        <ol className="jr-line">
          {visiblePast.map((e) => (
            <li key={e.key} className={`jr-step jr-tone-${e.tone}`}>
              <span className="jr-node">
                <i className={`bi ${e.icon}`} aria-hidden="true"></i>
              </span>
              <div className="jr-step-body">
                <div className="jr-step-head">
                  <b>{e.title}</b>
                  {e.level ? <span className="jr-pill">V{e.level}</span> : null}
                  <span className="jr-date">{formatDateTime(e.at)}</span>
                </div>
                <div className="jr-step-meta">
                  {e.legacy
                    ? "Étape antérieure au journal (reprise de l'historique)"
                    : e.actor
                      ? `${personName(e.actor)}${e.actorRole ? ` · ${ROLE_SHORT_LABELS[e.actorRole] || e.actorRole}` : ""}`
                      : "Système"}
                  {e.fromStatus && e.toStatus && e.fromStatus !== e.toStatus
                    ? ` · ${workflowStatusOf(e.fromStatus).label} → ${workflowStatusOf(e.toStatus).label}`
                    : ""}
                </div>
                {e.comment && <div className="jr-comment">{e.comment}</div>}
              </div>
            </li>
          ))}
          {!past.length && <li className="jr-empty">Aucune étape enregistrée.</li>}
        </ol>
        {hiddenCount > 0 && (
          <button type="button" className="jr-more" onClick={() => setShowAll(true)}>
            <i className="bi bi-chevron-up" aria-hidden="true"></i> Afficher les {hiddenCount} étape(s) précédente(s)
          </button>
        )}
      </div>

      <Link href={`/offer-workflow/${offerId}`} className="jr-link jr-foot">
        Ouvrir le circuit de validation complet <i className="bi bi-arrow-right" aria-hidden="true"></i>
      </Link>
    </div>
  );
}
