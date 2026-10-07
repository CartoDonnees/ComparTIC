import React, { useState } from "react";
import Link from "next/link";
import { Dialog } from "primereact/dialog";
import {
  deactivateOfferWorkflow,
  deleteOfferWorkflow,
  reactivateOfferWorkflow,
  submitOfferWorkflow,
} from "@/services/api/workflow/workflowApiService";
import { requestSubmissionCode } from "@/services/api/offers/submissionApiService";
import SubmissionCodeModal from "@/componnents/modal/offer/SubmissionCodeModal";
import WorkflowDecisionDialog from "@/componnents/workflow/WorkflowDecisionDialog";
import RowActionBar from "@/componnents/workflow/RowActionBar";
import { openOfferLetter } from "@/componnents/letters/OfferLetterHost";
import { PERMISSIONS, can } from "@/services/rbac/permissions";
import { toastSuccess, toastWarning } from "@/componnents/notification/notification";

/** Annonce de l'état retrouvé après une réactivation. */
const REACTIVATED_LABEL = {
  VALIDATED: "elle est de nouveau validée et visible au comparateur",
  REFUSED: "elle a retrouvé son statut « refusée »",
  SUBMITTED: "elle attend de nouveau la décision du Validateur 1",
  IN_VALIDATION: "elle a repris son circuit de validation",
};

/** Message après soumission, pour l'opérateur : sans vocabulaire du circuit. */
const SUBMITTED_OPERATOR = "Offre soumise : elle est en cours d'examen par l'ARTCI.";

/** Libellé de l'action « courrier » selon la décision à notifier. */
const LETTER_LABEL = {
  VALIDATED: "Générer le courrier de validation",
  REFUSED: "Générer le courrier de refus",
  DEACTIVATED: "Générer le courrier de suspension",
};

/**
 * Actions contextuelles d'une offre, calculées par le SERVEUR
 * (`/api/workflow/actions` ou fiche de workflow) : un bouton n'apparaît que si
 * l'action est réellement possible pour l'utilisateur, sur cette offre, dans
 * son état actuel. Chaque route d'API recontrôle de toute façon.
 *
 * @param offer      offre (id, code, title, workflowStatus, currentValidationLevel)
 * @param info       { actions: string[], finalLevel } renvoyé par le serveur
 * @param role       rôle de l'utilisateur connecté
 * @param onEdit     ouverture de la modification (liste)
 * @param onMonitor  ouverture du monitoring (liste)
 * @param onView     aperçu (liste)
 * @param onChanged  rechargement après une action réussie
 * @param compact    boutons réduits (listes) ; sinon libellés complets (fiche)
 * @param showHistory lien vers la fiche de workflow
 */
export default function OfferWorkflowActions({
  offer,
  info,
  role,
  onEdit,
  onMonitor,
  onView,
  onChanged,
  compact = true,
  showHistory = true,
}) {
  const actions = info?.actions || [];
  const has = (a) => actions.includes(a);
  const forOperator = role === "FOCAL_POINT";

  const [decision, setDecision] = useState(null); // "VALIDATE" | "REFUSE"
  const [reasonDialog, setReasonDialog] = useState(null); // "DEACTIVATE" | "REACTIVATE" | "DELETE" | "SUBMIT"
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  // Soumission d'un brouillon par un point focal : code reçu par e-mail.
  const [codeInfo, setCodeInfo] = useState(null);
  const [codeOpen, setCodeOpen] = useState(false);
  const [codeError, setCodeError] = useState(null);

  if (!offer) return null;

  const done = (message) => {
    toastSuccess(message);
    setReasonDialog(null);
    setDecision(null);
    setCodeOpen(false);
    onChanged?.();
  };

  const openReason = (kind) => {
    setReason("");
    setError(null);
    setReasonDialog(kind);
  };

  const startSubmit = async () => {
    if (role !== "FOCAL_POINT") {
      openReason("SUBMIT");
      return;
    }
    setBusy(true);
    const res = await requestSubmissionCode({ reference: offer.code, label: offer.title });
    setBusy(false);
    if (!res?.success) {
      toastWarning(res?.error || "Le code de validation n'a pas pu être envoyé.");
      return;
    }
    setCodeError(null);
    setCodeInfo(res);
    setCodeOpen(true);
  };

  const submitWithTicket = async (ticket) => {
    setBusy(true);
    const res = await submitOfferWorkflow(offer.id, ticket);
    setBusy(false);
    if (!res.ok) {
      setCodeError(res.error);
      return;
    }
    done(forOperator ? SUBMITTED_OPERATOR : "Offre soumise : elle attend la décision du Validateur 1.");
  };

  const confirmReason = async () => {
    setBusy(true);
    setError(null);
    let res;
    if (reasonDialog === "DEACTIVATE") res = await deactivateOfferWorkflow(offer.id, reason);
    else if (reasonDialog === "REACTIVATE") res = await reactivateOfferWorkflow(offer.id, reason);
    else if (reasonDialog === "DELETE") res = await deleteOfferWorkflow(offer.id);
    else res = await submitOfferWorkflow(offer.id);
    setBusy(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    // Suspension : le courrier au soumissionnaire est proposé (jamais généré d'office).
    if (reasonDialog === "DEACTIVATE" && can(role, PERMISSIONS.LETTER_MANAGE)) openOfferLetter(offer, { prompt: true, status: "DEACTIVATED" });
    done(
      reasonDialog === "DEACTIVATE"
        ? "Offre désactivée. Son historique est conservé."
        : reasonDialog === "REACTIVATE"
          ? `Offre réactivée : ${REACTIVATED_LABEL[res.data?.offer?.workflowStatus] || "elle a retrouvé son état précédent"}.`
          : reasonDialog === "DELETE"
          ? "Offre supprimée."
          : forOperator
            ? SUBMITTED_OPERATOR
            : "Offre soumise : elle attend la décision du Validateur 1.",
    );
  };

  // ---- Descripteurs d'actions (une seule source pour les deux dispositions) --
  const both = has("VALIDATE_TRANSMIT") && has("VALIDATE_FINAL");
  const validate = (has("VALIDATE_TRANSMIT") || has("VALIDATE_FINAL")) && {
    key: "validate",
    label: both ? "Valider" : has("VALIDATE_FINAL") ? "Valider définitivement" : "Valider et transmettre",
    icon: has("VALIDATE_TRANSMIT") ? "bi-check2-circle" : "bi-patch-check",
    title: both
      ? "Valider : transmettre au niveau supérieur ou valider définitivement"
      : has("VALIDATE_FINAL")
        ? "Valider définitivement"
        : "Valider et transmettre au niveau supérieur",
    onClick: () => setDecision("VALIDATE"),
  };
  const submit = has("SUBMIT") && {
    key: "submit",
    label: "Soumettre",
    icon: "bi-send-check",
    title: "Soumettre pour validation",
    onClick: startSubmit,
    disabled: busy,
  };
  const edit = has("EDIT") && onEdit && {
    key: "edit",
    label: "Modifier",
    icon: "bi-pencil-square",
    title: "Modifier (aucune décision n'a encore été prise)",
    onClick: () => onEdit(offer),
  };
  const monitor = has("MONITOR") && onMonitor && {
    key: "monitor",
    label: "Monitoring",
    icon: "bi-arrow-repeat",
    title: "Créer une nouvelle version (monitoring)",
    onClick: () => onMonitor(offer),
  };
  const history = showHistory && has("HISTORY") && {
    key: "history",
    // Opérateur : le circuit de validation est interne à l'ARTCI ; sa fiche montre l'évolution de l'offre.
    label: forOperator ? "Suivi de l'offre" : "Circuit et historique",
    icon: forOperator ? "bi-clock-history" : "bi-diagram-3",
    href: `/offer-workflow/${offer.id}`,
  };
  const refuse = has("REFUSE") && {
    key: "refuse",
    label: "Refuser",
    icon: "bi-x-octagon",
    danger: true,
    onClick: () => setDecision("REFUSE"),
  };
  const deactivate = has("DEACTIVATE") && {
    key: "deactivate",
    label: "Désactiver",
    icon: "bi-slash-circle",
    danger: true,
    onClick: () => openReason("DEACTIVATE"),
  };
  const reactivate = has("REACTIVATE") && {
    key: "reactivate",
    label: "Réactiver",
    icon: "bi-arrow-counterclockwise",
    title: "Réactiver l'offre : elle retrouve son état d'avant la désactivation",
    onClick: () => openReason("REACTIVATE"),
  };
  const letter = has("LETTER") && {
    key: "letter",
    label: LETTER_LABEL[offer?.workflowStatus] || "Générer un modèle de courrier",
    icon: "bi-envelope-paper",
    title: "Courrier au soumissionnaire : modèle généré à partir de l'offre, de la décision, des commentaires et de l'analyse IA",
    onClick: () => openOfferLetter(offer),
  };
  const remove = has("DELETE") && {
    key: "delete",
    label: "Supprimer",
    icon: "bi-trash",
    danger: true,
    onClick: () => openReason("DELETE"),
  };

  // Action principale : ce qu'on attend de l'utilisateur sur cette offre.
  // Le circuit de validation a son propre bouton, toujours visible.
  const primary = validate || submit || edit || monitor || reactivate || null;
  const secondary = [validate, submit, edit, monitor, letter, refuse, deactivate, reactivate, remove].filter(
    (a) => a && a !== primary,
  );

  const fullButton = (a) =>
    a.href ? (
      <Link key={a.key} href={a.href} className="wf-btn" title={a.title || a.label}>
        <i className={`bi ${a.icon}`}></i>
        {a.label}
      </Link>
    ) : (
      <button
        key={a.key}
        type="button"
        className={`wf-btn ${a.danger ? "wf-btn-danger" : a === primary || a.key === "submit" ? "wf-btn-primary" : ""}`}
        onClick={a.onClick}
        disabled={a.disabled}
        title={a.title || a.label}
      >
        <i className={`bi ${a.icon}`}></i>
        {a.label}
      </button>
    );

  return (
    <>
      {compact ? (
        <RowActionBar
          ariaLabel={offer.title}
          view={onView ? { onClick: () => onView(offer), title: "Aperçu de l'offre" } : null}
          // Toujours présent sur une ligne d'offre, sans attendre le calcul des
          // actions : la fiche contrôle elle-même l'accès (point focal limité
          // à son opérateur).
          circuit={
            showHistory && offer?.id
              ? forOperator
                ? { href: `/offer-workflow/${offer.id}`, title: "Consulter le suivi de l'offre", label: "Suivi", icon: "bi-clock-history" }
                : { href: `/offer-workflow/${offer.id}`, title: "Consulter le circuit de validation de l'offre" }
              : null
          }
          primary={primary}
          items={secondary}
        />
      ) : (
        <div className="wf-actions">
          {onView && (
            <button type="button" className="wf-btn" onClick={() => onView(offer)} title="Aperçu de l'offre">
              <i className="bi bi-eye"></i>
              Voir
            </button>
          )}
          {[history, edit, submit, validate, refuse, monitor, letter, deactivate, reactivate, remove].filter(Boolean).map(fullButton)}
        </div>
      )}

      <WorkflowDecisionDialog
        visible={!!decision}
        mode={decision || "VALIDATE"}
        offer={offer}
        finalLevel={info?.finalLevel}
        canTransmit={has("VALIDATE_TRANSMIT")}
        canFinal={has("VALIDATE_FINAL")}
        onHide={() => setDecision(null)}
        onDone={(data) => {
          const validated = decision !== "REFUSE" && data?.offer?.workflowStatus === "VALIDATED";
          done(
            decision === "REFUSE"
              ? "Offre refusée. Le point focal a été notifié."
              : validated
                ? "Offre validée définitivement."
                : `Validation enregistrée : offre transmise au niveau ${data?.offer?.currentValidationLevel}.`,
          );
          // Validation définitive ou refus : le courrier au soumissionnaire est proposé (jamais généré d'office).
          if (validated) openOfferLetter(offer, { prompt: true, status: "VALIDATED" });
          else if (decision === "REFUSE" && can(role, PERMISSIONS.LETTER_MANAGE)) openOfferLetter(offer, { prompt: true, status: "REFUSED" });
        }}
      />

      <Dialog
        header={
          reasonDialog === "DEACTIVATE"
            ? "Désactiver l'offre"
            : reasonDialog === "REACTIVATE"
              ? "Réactiver l'offre"
              : reasonDialog === "DELETE"
              ? "Supprimer l'offre"
              : "Soumettre l'offre"
        }
        visible={!!reasonDialog}
        onHide={() => !busy && setReasonDialog(null)}
        style={{ width: "min(520px, 96vw)" }}
        className="wf wf-dialog"
        modal
      >
        <p className="wf-sub" style={{ marginBottom: 12 }}>
          <b>{offer.title}</b> ({offer.code})
        </p>
        {error && <div className="wf-alert wf-tone-danger" role="alert">{error}</div>}
        {reasonDialog === "DEACTIVATE" && (
          <>
            <div className="wf-alert wf-tone-warning">
              {forOperator
                ? "L'offre sera retirée de l'examen et du comparateur, mais conservée avec son historique."
                : "L'offre sera retirée du circuit et du comparateur, mais conservée avec toutes ses décisions et son historique."}
            </div>
            <div className="wf-field">
              <label htmlFor="wf-reason">
                Motif <span style={{ color: "#b91c1c" }}>*</span>
              </label>
              <textarea id="wf-reason" value={reason} onChange={(e) => setReason(e.target.value)} disabled={busy} maxLength={5000} />
            </div>
          </>
        )}
        {reasonDialog === "REACTIVATE" && (
          <>
            <div className="wf-alert wf-tone-info">
              L'offre retrouvera l'état qu'elle avait avant sa désactivation (validée, refusée ou en cours de
              validation). La désactivation reste inscrite dans l'historique, et cette réactivation y sera ajoutée
              avec votre nom et la date.
            </div>
            <div className="wf-field">
              <label htmlFor="wf-reactivate-reason">Motif (facultatif)</label>
              <textarea id="wf-reactivate-reason" value={reason} onChange={(e) => setReason(e.target.value)} disabled={busy} maxLength={5000} />
            </div>
          </>
        )}
        {reasonDialog === "DELETE" && (
          <div className="wf-alert wf-tone-danger">
            Aucune décision n'a été enregistrée sur cette offre : elle peut être supprimée définitivement.
            Cette suppression sera tracée dans le journal d'audit.
          </div>
        )}
        {reasonDialog === "SUBMIT" && (
          <div className="wf-alert wf-tone-info">
            L'offre quittera l'état brouillon et sera {forOperator ? "transmise à l'ARTCI pour examen" : "transmise au Validateur 1"}. Elle restera modifiable tant
            qu'aucune décision n'aura été prise.
          </div>
        )}
        <div className="wf-dialog-foot">
          <button type="button" className="wf-btn" onClick={() => setReasonDialog(null)} disabled={busy}>
            Annuler
          </button>
          <button
            type="button"
            className={`wf-btn wf-btn-lg ${reasonDialog === "SUBMIT" || reasonDialog === "REACTIVATE" ? "wf-btn-primary" : "wf-btn-solid-danger"}`}
            onClick={confirmReason}
            disabled={busy || (reasonDialog === "DEACTIVATE" && !reason.trim())}
          >
            {busy && <span className="spinner-border spinner-border-sm" aria-hidden="true"></span>}
            {reasonDialog === "DEACTIVATE" ? "Désactiver" : reasonDialog === "REACTIVATE" ? "Réactiver" : reasonDialog === "DELETE" ? "Supprimer définitivement" : "Soumettre"}
          </button>
        </div>
      </Dialog>

      <SubmissionCodeModal
        visible={codeOpen}
        onHide={() => {
          setCodeOpen(false);
          setCodeError(null);
        }}
        reference={offer.code}
        label={offer.title}
        info={codeInfo}
        submitting={busy}
        error={codeError}
        onValidated={submitWithTicket}
      />
    </>
  );
}
