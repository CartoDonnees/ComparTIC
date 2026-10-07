import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { getOfferWorkflow } from "@/services/api/workflow/workflowApiService";
import OfferWorkflowActions from "@/componnents/workflow/OfferWorkflowActions";
import WorkflowStatusBadge from "@/componnents/workflow/WorkflowStatusBadge";
import { OfferInfoCard, OfferVersionsCard } from "@/componnents/workflow/OfferInfoCards";
import OperatorOfferSheet from "@/componnents/workflow/OperatorOfferSheet";
import {
  AUDIT_ACTION_LABELS,
  LEVEL_FUNCTIONS,
  LEVEL_TITLES,
  ROLE_SHORT_LABELS,
  formatDateTime,
  personName,
  workflowStatusOf,
} from "@/services/tools/workflowLabels";

const LEVEL_STATE_LABEL = {
  UPCOMING: "À venir",
  CURRENT: "Décision attendue",
  VALIDATED: "Validé",
  REFUSED: "Refusé",
  SKIPPED: "Non atteint",
  NOT_RECORDED: "Antérieur au workflow",
  NOT_REQUIRED: "Non requis",
};

const AUDIT_TONE = {
  VALIDATE_TRANSMIT: "info",
  VALIDATE_FINAL: "success",
  REFUSE: "danger",
  DEACTIVATE: "warning",
  REACTIVATE: "success",
  DELETE: "danger",
  MONITORING: "warning",
  VERSION_CREATED: "info",
  SUBMIT: "info",
};

const PROMO_LABEL = { SPECIAL: "Spéciale", FLASH: "Flash", PERIOD: "Périodique", CUSTOMIZE: "Personnalisée" };

/**
 * Auteur d'une étape du circuit : nom, e-mail, rôle au moment de l'action, date.
 */
function StepActor({ user, role, date, actions }) {
  const email = user?.email;
  return (
    <div className="wf-step-who">
      {actions?.length > 0 && (
        <span className="wf-step-actions">
          {actions.map((a) => `${a.label}${a.count > 1 ? ` ×${a.count}` : ""}`).join(" · ")}
        </span>
      )}
      <span className="wf-step-person">{personName(user)}</span>
      {email && (
        <a className="wf-step-email" href={`mailto:${email}`} title={email}>
          {email}
        </a>
      )}
      {role && <span className="wf-step-role">{ROLE_SHORT_LABELS[role] || role}</span>}
      {date && <span className="wf-step-date">{formatDateTime(date)}</span>}
    </div>
  );
}

/**
 * Fiche de workflow d'une offre : informations, circuit de validation par
 * niveau, décisions (validateur, rôle, date, commentaire), historique complet,
 * versions (monitoring) et actions possibles pour l'utilisateur connecté.
 *
 * Toutes les données et les actions viennent de `/api/workflow/offers/:id` :
 * l'écran n'invente aucun droit.
 */
export default function OfferWorkflowView({ offerId }) {
  const router = useRouter();
  const [state, setState] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async ({ silent = false } = {}) => {
    if (!offerId) return;
    if (!silent) setLoading(true);
    const res = await getOfferWorkflow(offerId);
    if (!silent) setLoading(false);
    if (!res.ok) {
      // Un rafraîchissement silencieux raté (réseau) ne vide pas la fiche.
      if (silent && res.status === 0) return;
      setError(res);
      setState(null);
      return;
    }
    setError(null);
    setState(res.data);
  }, [offerId]);

  useEffect(() => {
    load();
  }, [load]);

  // Fiche toujours à jour : un autre validateur peut statuer pendant qu'elle
  // est ouverte. Rafraîchissement au retour sur l'onglet et toutes les 20 s
  // tant que le circuit est en cours.
  const inProgress = ["SUBMITTED", "IN_VALIDATION"].includes(state?.offer?.workflowStatus);
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") load({ silent: true });
    };
    window.addEventListener("focus", onVisible);
    document.addEventListener("visibilitychange", onVisible);
    const timer = inProgress
      ? setInterval(() => document.visibilityState === "visible" && load({ silent: true }), 20000)
      : null;
    return () => {
      window.removeEventListener("focus", onVisible);
      document.removeEventListener("visibilitychange", onVisible);
      if (timer) clearInterval(timer);
    };
  }, [load, inProgress]);

  if (loading && !state) {
    return (
      <div className="wf py-5 text-center">
        <span className="spinner-border" aria-hidden="true"></span>
        <p className="wf-empty mt-2">Chargement de l'offre…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="wf py-4">
        <div className={`wf-alert wf-tone-${error.status === 403 ? "warning" : "danger"}`} role="alert">
          {error.status === 404 ? "Cette offre n'existe pas (ou a été supprimée)." : error.error}
        </div>
        <button type="button" className="wf-btn" onClick={() => router.back()}>
          <i className="bi bi-arrow-left"></i> Retour
        </button>
      </div>
    );
  }
  if (!state) return null;

  // Opérateur : fiche sans circuit de validation (le serveur ne l'a pas transmis).
  if (state.audience === "OPERATOR") return <OperatorOfferSheet state={state} router={router} reload={load} />;

  return <OfferWorkflowContent state={state} router={router} reload={load} />;
}

/**
 * Rendu de la fiche à partir de l'état renvoyé par l'API (séparé du
 * chargement : testable en rendu serveur avec un état connu).
 */
export function OfferWorkflowContent({ state, router, reload }) {
  const [showNotify, setShowNotify] = useState(false);
  const load = reload || (async () => undefined);
  const { offer, details, levels, decisions, audit, versions, actions, finalLevel, offerType, viewer, legacyDecision } = state;
  const isFocalPoint = viewer?.role === "FOCAL_POINT";
  const listPath = isFocalPoint ? "/operator-list-offer" : "/admin-offer-list";
  const visibleAudit = showNotify ? audit : audit.filter((a) => a.action !== "NOTIFY");

  return (
    <div className="wf py-3">
      <div className="wf-head">
        <div>
          <Link href={listPath} className="wf-back">
            <i className="bi bi-arrow-left"></i> Offres
          </Link>
          <h1 className="wf-title">{offer.title}</h1>
          <p className="wf-sub">
            <span>{offer.code}</span>
            <span>{offer.operator?.name}</span>
            <span>
              {offerType === "PROMOTION"
                ? `Offre promotionnelle${details?.specialPromotion?.type ? ` (${PROMO_LABEL[details.specialPromotion.type] || details.specialPromotion.type})` : ""}`
                : "Offre de base"}{" "}
                validation finale au niveau {finalLevel}
            </span>
            {offer.version > 1 && <span>Version {offer.version}</span>}
            <span className={`wf-badge wf-tone-${state.published ? "success" : "muted"}`}>
              <i className={`bi ${state.published ? "bi-globe2" : "bi-eye-slash"}`} aria-hidden="true"></i>
              {state.published ? "Publiée sur le comparateur" : "Non publiée"}
            </span>
            <WorkflowStatusBadge offer={offer} finalLevel={finalLevel} />
          </p>
        </div>
        <OfferWorkflowActions
          offer={offer}
          info={{ actions, finalLevel }}
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

      {state.circuitClosed && state.closure?.decision && ["VALIDATED", "REFUSED"].includes(state.closure.status) && (
        <div className={`wf-alert wf-tone-${state.closure.status === "REFUSED" ? "danger" : "success"} wf-closure`} role="status">
          <i className={`bi ${state.closure.status === "REFUSED" ? "bi-x-octagon" : "bi-patch-check-fill"}`} aria-hidden="true"></i>
          <span>
            <b>Circuit clôturé :</b>{" "}
            {state.closure.status === "REFUSED" ? "offre refusée" : "offre validée définitivement"} au niveau{" "}
            {state.closure.decision.level} par {personName(state.closure.decision.user)}
            {state.closure.decision.user?.email ? ` (${state.closure.decision.user.email})` : ""} le{" "}
            {formatDateTime(state.closure.decision.createdAt)}. Aucune autre décision n'est attendue.
          </span>
        </div>
      )}
      {offer.workflowStatus === "DEACTIVATED" && offer.deactivationReason === "MONITORING" && (
        <div className="wf-alert wf-tone-warning">
          {state.published
            ? "Cette version a été remplacée par un monitoring. Elle reste affichée sur le comparateur tant que la nouvelle version n'est pas validée définitivement (voir « Versions »)."
            : "Cette version a été remplacée par un monitoring : la nouvelle version, validée, est celle affichée sur le comparateur (voir « Versions »)."}
        </div>
      )}
      {legacyDecision && (
        <div className="wf-alert wf-tone-neutral">
          La décision de cette offre est antérieure au workflow à niveaux : elle a été reprise telle quelle,
          sans détail par niveau.
        </div>
      )}

      {/* ---- Circuit de validation ------------------------------------ */}
      <section className="wf-card" aria-labelledby="wf-levels">
        <h2 className="wf-card-title" id="wf-levels">
          <i className="bi bi-diagram-3"></i> Circuit de validation
        </h2>
        <ol className="wf-steps">
          {/* Étape 0 : soumission de l'offre */}
          <li className={`wf-step ${state.submission ? "is-validated" : "is-upcoming"}`}>
            <div className="wf-step-dot" aria-hidden="true">
              {state.submission ? <i className="bi bi-send-check"></i> : <i className="bi bi-pencil"></i>}
            </div>
            <div className="wf-step-name">Soumission</div>
            <div className="wf-step-fn">{offer.operator?.name || "Opérateur"}</div>
            <div className="wf-step-state">{state.submission ? "Soumise" : "Brouillon"}</div>
            {/* Toutes les personnes ayant agi avant la validation. */}
            {(state.contributors || []).map((c) => (
              <StepActor key={c.user?.id ?? c.firstAt} user={c.user} role={c.role} date={c.lastAt} actions={c.actions} />
            ))}
          </li>
          {levels.map((l) => (
            <li key={l.level} className={`wf-step is-${String(l.state).toLowerCase()}`}>
              <div className="wf-step-dot" aria-hidden="true">
                {l.state === "VALIDATED" ? <i className="bi bi-check-lg"></i> : l.state === "REFUSED" ? <i className="bi bi-x-lg"></i> : `V${l.level}`}
              </div>
              <div className="wf-step-name">
                {LEVEL_TITLES[l.level]}
                {l.isFinal && " · final"}
              </div>
              <div className="wf-step-fn">{LEVEL_FUNCTIONS[l.level]}</div>
              <div className="wf-step-state">{LEVEL_STATE_LABEL[l.state] || l.state}</div>
              {l.decision && (
                <StepActor user={l.decision.user} role={l.decision.userRole} date={l.decision.createdAt} />
              )}
            </li>
          ))}
        </ol>
      </section>

      <div className="wf-grid">
        <div>
          {/* ---- Décisions ---------------------------------------------- */}
          <section className="wf-card" aria-labelledby="wf-decisions">
            <h2 className="wf-card-title" id="wf-decisions">
              <i className="bi bi-chat-square-text"></i> Décisions
            </h2>
            {decisions.length === 0 ? (
              <p className="wf-empty">Aucune décision n'a encore été enregistrée.</p>
            ) : (
              <ul className="wf-timeline">
                {decisions.map((d) => {
                  const refused = d.decision === "REFUSED";
                  const tone = refused ? "danger" : d.final ? "success" : "info";
                  return (
                    <li key={d.id} className={`wf-event wf-tone-${tone}`}>
                      <span className="wf-event-ico" aria-hidden="true">
                        <i className={`bi ${refused ? "bi-x-octagon" : d.final ? "bi-patch-check-fill" : "bi-arrow-up-circle"}`}></i>
                      </span>
                      <div>
                        <div className="wf-event-title">
                          {refused
                            ? `Refus au niveau ${d.level}`
                            : d.final
                              ? d.level < finalLevel
                                ? `Validation définitive sans transmission (niveau ${d.level})`
                                : `Validation définitive (niveau ${d.level})`
                              : `Validation du niveau ${d.level}, transmise au niveau ${d.level + 1}`}
                        </div>
                        <div className="wf-event-meta">
                          <span>{personName(d.user)}</span>
                          {d.user?.email && <span>{d.user.email}</span>}
                          <span>{ROLE_SHORT_LABELS[d.userRole] || d.userRole}</span>
                          <span>{formatDateTime(d.createdAt)}</span>
                        </div>
                        <div className="wf-comment">{d.comment}</div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          {/* ---- Historique --------------------------------------------- */}
          <section className="wf-card" aria-labelledby="wf-audit">
            <h2 className="wf-card-title d-flex justify-content-between" id="wf-audit">
              <span>
                <i className="bi bi-clock-history"></i> Historique
              </span>
              <label className="wf-event-meta" style={{ fontWeight: 500, cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={showNotify}
                  onChange={(e) => setShowNotify(e.target.checked)}
                  style={{ marginRight: 5 }}
                />
                Afficher les notifications
              </label>
            </h2>
            {visibleAudit.length === 0 ? (
              <p className="wf-empty">Aucun événement.</p>
            ) : (
              <ul className="wf-timeline">
                {visibleAudit.map((a) => {
                  const meta = AUDIT_ACTION_LABELS[a.action] || { label: a.action, icon: "bi-dot" };
                  return (
                    <li key={a.id} className={`wf-event wf-tone-${AUDIT_TONE[a.action] || "neutral"}`}>
                      <span className="wf-event-ico" aria-hidden="true">
                        <i className={`bi ${meta.icon}`}></i>
                      </span>
                      <div>
                        <div className="wf-event-title">
                          {meta.label}
                          {a.level ? `   niveau ${a.level}` : ""}
                        </div>
                        <div className="wf-event-meta">
                          <span>{a.actor ? personName(a.actor) : a.actorRole ? "Utilisateur supprimé" : "Système"}</span>
                          {a.actor?.email && <span>{a.actor.email}</span>}
                          {a.actorRole && <span>{ROLE_SHORT_LABELS[a.actorRole] || a.actorRole}</span>}
                          <span>{formatDateTime(a.createdAt)}</span>
                          {a.fromStatus && a.toStatus && a.fromStatus !== a.toStatus && (
                            <span>
                              {workflowStatusOf(a.fromStatus).label} → {workflowStatusOf(a.toStatus).label}
                            </span>
                          )}
                          {a.action === "NOTIFY" && a.metadata && (
                            <span>
                              {a.metadata.notified ?? 0} destinataire(s)
                              {a.metadata.emails ? `, ${a.metadata.emails} e-mail(s)` : ""}
                            </span>
                          )}
                        </div>
                        {a.comment && <div className="wf-comment">{a.comment}</div>}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>

        <div>
          <OfferInfoCard offer={offer} details={details} />
          <OfferVersionsCard offer={offer} versions={versions} />
        </div>
      </div>
    </div>
  );
}
