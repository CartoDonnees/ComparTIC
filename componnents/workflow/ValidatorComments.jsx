import React, { useEffect, useState } from "react";
import { getOfferWorkflow } from "@/services/api/workflow/workflowApiService";
import { LEVEL_FUNCTIONS, LEVEL_TITLES, ROLE_SHORT_LABELS, formatDateTime, personName } from "@/services/tools/workflowLabels";

/**
 * Avis des validateurs précédents, en lecture seule.
 *
 * Contexte du validateur qui s'apprête à statuer : décisions déjà rendues sur
 * l'offre, dans l'ordre chronologique (niveau, validateur, date, décision,
 * commentaire). Le panneau et chaque avis sont repliables. Rien n'est
 * modifiable ici : les décisions sont des lignes `ValidationDecision`, écrites
 * une fois par le moteur de workflow.
 *
 * @param offerId      offre concernée
 * @param decisions    décisions déjà chargées (sinon lues via la fiche de workflow)
 * @param refreshKey   change pour forcer une relecture (après une décision)
 * @param defaultOpen  panneau déplié à l'ouverture
 * @param className    classe supplémentaire du conteneur
 */

const DECISION = {
  REFUSED: { label: "Refusée", tone: "danger", icon: "bi-x-octagon" },
  FINAL: { label: "Validée définitivement", tone: "success", icon: "bi-patch-check-fill" },
  TRANSMITTED: { label: "Validée et transmise", tone: "info", icon: "bi-arrow-up-circle" },
  VALIDATED: { label: "Validée", tone: "success", icon: "bi-check2-circle" },
};

const decisionOf = (d) =>
  d.decision === "REFUSED" ? DECISION.REFUSED : d.final ? DECISION.FINAL : d.transmitted ? DECISION.TRANSMITTED : DECISION.VALIDATED;

export default function ValidatorComments({ offerId, decisions: provided, refreshKey, defaultOpen = true, className = "" }) {
  const [open, setOpen] = useState(defaultOpen);
  const [decisions, setDecisions] = useState(provided || null);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState({});

  useEffect(() => {
    if (provided) {
      setDecisions(provided);
      return undefined;
    }
    if (!offerId) return undefined;
    let cancelled = false;
    setDecisions(null);
    setError(null);
    getOfferWorkflow(offerId).then((res) => {
      if (cancelled) return;
      if (!res.ok) setError(res.error);
      else setDecisions(res.data?.decisions || []);
    });
    return () => {
      cancelled = true;
    };
  }, [offerId, provided, refreshKey]);

  // Ordre chronologique ; le dernier avis est déplié d'office.
  const list = [...(decisions || [])].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  const lastId = list.length ? list[list.length - 1].id : null;
  const isExpanded = (id) => expanded[id] ?? id === lastId;

  return (
    <section className={`vc ${className}`.trim()}>
      <button type="button" className="vc-head" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <span className="vc-head-title">
          <i className="bi bi-chat-square-text" aria-hidden="true"></i> Avis des validateurs précédents
          {decisions ? <span className="vc-count">{list.length}</span> : null}
        </span>
        <i className={`bi ${open ? "bi-chevron-up" : "bi-chevron-down"}`} aria-hidden="true"></i>
      </button>

      {open && (
        <div className="vc-body">
          {error ? (
            <div className="vc-empty vc-empty--error" role="alert">
              <i className="bi bi-exclamation-triangle" aria-hidden="true"></i> {error}
            </div>
          ) : !decisions ? (
            <div className="vc-empty" aria-busy="true">
              <span className="spinner-border spinner-border-sm" aria-hidden="true"></span> Chargement des avis…
            </div>
          ) : !list.length ? (
            <div className="vc-empty">
              <i className="bi bi-inbox" aria-hidden="true"></i> Aucun validateur n'a encore statué sur cette offre.
            </div>
          ) : (
            <ol className="vc-list">
              {list.map((d) => {
                const dec = decisionOf(d);
                const shown = isExpanded(d.id);
                return (
                  <li key={d.id} className={`vc-item vc-tone-${dec.tone}`}>
                    <button
                      type="button"
                      className="vc-item-head"
                      onClick={() => setExpanded((p) => ({ ...p, [d.id]: !shown }))}
                      aria-expanded={shown}
                    >
                      <span className="vc-level" title={LEVEL_FUNCTIONS[d.level] || ""}>
                        V{d.level}
                      </span>
                      <span className="vc-who">
                        <b>{personName(d.user)}</b>
                        <span className="vc-meta">
                          {LEVEL_TITLES[d.level] || ROLE_SHORT_LABELS[d.userRole] || d.userRole}
                          {LEVEL_FUNCTIONS[d.level] ? ` · ${LEVEL_FUNCTIONS[d.level]}` : ""} · {formatDateTime(d.createdAt)}
                        </span>
                      </span>
                      <span className="vc-decision">
                        <i className={`bi ${dec.icon}`} aria-hidden="true"></i> {dec.label}
                      </span>
                      <i className={`bi ${shown ? "bi-chevron-up" : "bi-chevron-down"} vc-chevron`} aria-hidden="true"></i>
                    </button>
                    {shown && <div className="vc-comment">{d.comment || "Aucun commentaire."}</div>}
                  </li>
                );
              })}
            </ol>
          )}
          {list.length > 0 && <div className="vc-note">Avis en lecture seule : ils ne peuvent pas être modifiés.</div>}
        </div>
      )}
    </section>
  );
}
