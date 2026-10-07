import React, { useEffect, useState } from "react";
import { Dialog } from "primereact/dialog";
import { decideOfferWorkflow } from "@/services/api/workflow/workflowApiService";
import ValidatorComments from "@/componnents/workflow/ValidatorComments";
import { FINAL_CONFIRMATION_TEXT, LEVEL_FUNCTIONS, LEVEL_TITLES } from "@/services/tools/workflowLabels";

/**
 * Décision d'un validateur : valider ou refuser.
 *
 * Validation   deux issues possibles, proposées selon ce que le serveur autorise :
 *  - « Valider et transmettre » : la validation est enregistrée pour ce niveau
 *    et l'offre attend la réponse du niveau supérieur (statut inchangé) ;
 *  - « Valider définitivement sans transmettre » : l'offre devient VALIDÉE et
 *    les notifications partent. Possible à tout niveau pour une promotion, au
 *    dernier niveau seulement pour une offre de base.
 *
 * Le commentaire est obligatoire ; la validation définitive passe par une
 * confirmation explicite. L'API applique les mêmes règles.
 *
 * @param offer       { id, code, title, currentValidationLevel, specialPromotion? }
 * @param finalLevel  dernier niveau (3 promotion, 4 offre de base)
 * @param mode        "VALIDATE" | "REFUSE"
 * @param canTransmit l'acteur peut transmettre au niveau supérieur
 * @param canFinal    l'acteur peut valider définitivement
 * @param onDone      appelé avec la réponse de l'API après succès
 */
export default function WorkflowDecisionDialog({
  visible,
  onHide,
  offer,
  finalLevel,
  mode = "VALIDATE",
  canTransmit,
  canFinal,
  initialComment = "",
  onDone,
}) {
  const level = offer?.currentValidationLevel;
  const refuse = mode === "REFUSE";

  // Sans indication de l'appelant : comportement du dernier niveau / des niveaux intermédiaires.
  const transmitAllowed = canTransmit ?? (level && finalLevel ? level < finalLevel : false);
  const finalAllowed = canFinal ?? (level && finalLevel ? level >= finalLevel : false);
  const bothChoices = transmitAllowed && finalAllowed;

  const [comment, setComment] = useState("");
  const [choice, setChoice] = useState(null); // "TRANSMIT" | "FINAL"
  const [confirming, setConfirming] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!visible) return;
    setComment(initialComment || "");
    setConfirming(false);
    setError(null);
    // Un seul choix possible : il est présélectionné. Deux choix : l'utilisateur
    // doit se prononcer explicitement.
    setChoice(bothChoices ? null : transmitAllowed ? "TRANSMIT" : finalAllowed ? "FINAL" : null);
  }, [visible, mode, initialComment, bothChoices, transmitAllowed, finalAllowed]);

  const send = async (validation) => {
    setSending(true);
    setError(null);
    const res = await decideOfferWorkflow(offer.id, {
      decision: refuse ? "REFUSE" : "VALIDATE",
      comment,
      ...(refuse ? {} : { validation, confirmFinal: validation === "FINAL" }),
    });
    setSending(false);
    if (!res.ok) {
      setConfirming(false);
      setError(res.error);
      return;
    }
    onDone?.(res.data);
  };

  const onPrimary = () => {
    if (!comment.trim()) {
      setError("Le commentaire est obligatoire.");
      return;
    }
    if (refuse) {
      send(null);
      return;
    }
    if (!choice) {
      setError("Choisissez de transmettre l'offre ou de la valider définitivement.");
      return;
    }
    if (choice === "FINAL") {
      setConfirming(true);
      return;
    }
    send("TRANSMIT");
  };

  const nextTitle = LEVEL_TITLES[level + 1];
  const title = refuse
    ? "Refuser l'offre"
    : bothChoices
      ? "Valider l'offre"
      : finalAllowed
        ? "Validation définitive"
        : `Valider et transmettre au ${nextTitle || "niveau supérieur"}`;

  const primaryLabel = refuse
    ? "Refuser l'offre"
    : choice === "FINAL"
      ? "Valider définitivement"
      : choice === "TRANSMIT"
        ? "Valider et transmettre"
        : "Valider";

  return (
    <Dialog
      header={title}
      visible={!!visible}
      onHide={() => !sending && onHide?.()}
      style={{ width: "min(580px, 96vw)" }}
      className="wf wf-dialog"
      modal
      dismissableMask={!sending}
    >
      <p className="wf-sub" style={{ marginBottom: 12 }}>
        <span>
          <b>{offer?.title}</b> ({offer?.code})
        </span>
        {level && (
          <span>
            Décision du {LEVEL_TITLES[level]} ({LEVEL_FUNCTIONS[level]})
          </span>
        )}
      </p>

      {error && (
        <div className="wf-alert wf-tone-danger" role="alert">
          {error}
        </div>
      )}

      {/* Contexte : avis déjà rendus, consultables avant de statuer (repliés ici). */}
      {visible && offer?.id && level > 1 && !confirming && <ValidatorComments offerId={offer.id} defaultOpen={false} className="vc--dialog" />}

      {!confirming ? (
        <>
          {refuse && (
            <div className="wf-alert wf-tone-danger">
              Le refus met fin au circuit de validation. Le point focal de l'opérateur sera notifié
              (plateforme et e-mail) avec votre commentaire.
            </div>
          )}

          {!refuse && (
            <fieldset className="wf-choices" disabled={sending}>
              <legend className="wf-choices-legend">Issue de la validation</legend>
              {transmitAllowed && (
                <label className={`wf-choice ${choice === "TRANSMIT" ? "is-selected" : ""}`}>
                  <input
                    type="radio"
                    name="wf-validation"
                    value="TRANSMIT"
                    checked={choice === "TRANSMIT"}
                    onChange={() => setChoice("TRANSMIT")}
                  />
                  <span className="wf-choice-ico wf-tone-info" aria-hidden="true">
                    <i className="bi bi-arrow-up-circle"></i>
                  </span>
                  <span>
                    <b>Valider et transmettre au {nextTitle}</b>
                    <small>
                      Votre validation est enregistrée pour le niveau {level}. L'offre reste en attente de la
                      réponse du {nextTitle} ({LEVEL_FUNCTIONS[level + 1]}) : son statut ne change pas encore.
                    </small>
                  </span>
                </label>
              )}
              {finalAllowed && (
                <label className={`wf-choice ${choice === "FINAL" ? "is-selected" : ""}`}>
                  <input
                    type="radio"
                    name="wf-validation"
                    value="FINAL"
                    checked={choice === "FINAL"}
                    onChange={() => setChoice("FINAL")}
                  />
                  <span className="wf-choice-ico wf-tone-success" aria-hidden="true">
                    <i className="bi bi-patch-check"></i>
                  </span>
                  <span>
                    <b>{transmitAllowed ? "Valider définitivement sans transmettre" : "Valider définitivement"}</b>
                    <small>
                      L'offre devient VALIDÉE immédiatement, est publiée sur le comparateur et les notifications
                      sont envoyées (point focal, validateurs concernés, administration).
                      {transmitAllowed && level < finalLevel && " Les niveaux supérieurs ne sont pas requis pour une offre promotionnelle."}
                    </small>
                  </span>
                </label>
              )}
            </fieldset>
          )}

          <div className="wf-field">
            <label htmlFor="wf-comment">
              Commentaire <span style={{ color: "#b91c1c" }}>*</span>
            </label>
            <textarea
              id="wf-comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={refuse ? "Motif du refus…" : "Observations, points vérifiés, réserves…"}
              maxLength={5000}
              disabled={sending}
            />
            <div className="wf-field-hint">Obligatoire. Il sera conservé dans l'historique de l'offre.</div>
          </div>
          <div className="wf-dialog-foot">
            <button type="button" className="wf-btn" onClick={onHide} disabled={sending}>
              Annuler
            </button>
            <button
              type="button"
              className={`wf-btn wf-btn-lg ${refuse ? "wf-btn-solid-danger" : "wf-btn-primary"}`}
              onClick={onPrimary}
              disabled={sending || !comment.trim() || (!refuse && !choice)}
            >
              {sending ? (
                <span className="spinner-border spinner-border-sm" aria-hidden="true"></span>
              ) : (
                <i
                  className={`bi ${refuse ? "bi-x-octagon" : choice === "FINAL" ? "bi-patch-check" : "bi-arrow-up-circle"}`}
                ></i>
              )}
              {primaryLabel}
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="wf-confirm" role="alertdialog" aria-live="assertive">
            {FINAL_CONFIRMATION_TEXT}
          </div>
          <div className="wf-dialog-foot">
            <button type="button" className="wf-btn" onClick={() => setConfirming(false)} disabled={sending}>
              Annuler
            </button>
            <button
              type="button"
              className="wf-btn wf-btn-lg wf-btn-primary"
              onClick={() => send("FINAL")}
              disabled={sending}
            >
              {sending ? (
                <span className="spinner-border spinner-border-sm" aria-hidden="true"></span>
              ) : (
                <i className="bi bi-check2-all"></i>
              )}
              Confirmer
            </button>
          </div>
        </>
      )}
    </Dialog>
  );
}
