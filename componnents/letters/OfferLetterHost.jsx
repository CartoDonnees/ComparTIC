import React, { useEffect, useState } from "react";
import { Dialog } from "primereact/dialog";
import OfferLetterEditor from "@/componnents/letters/OfferLetterEditor";

/**
 * Point d'ancrage unique du courrier au soumissionnaire dans l'espace de
 * gestion.
 *
 * Les boutons d'action d'une offre vivent dans des lignes de tableau qui sont
 * recréées dès que la liste se recharge (après une validation, par exemple) :
 * une fenêtre ouverte depuis la ligne disparaîtrait avec elle. Les écrans
 * demandent donc le courrier par un événement, et c'est ce composant, monté
 * une fois dans la page, qui affiche la proposition puis l'éditeur.
 *
 *   openOfferLetter(offer)             → ouvre l'éditeur
 *   openOfferLetter(offer, { prompt }) → propose d'abord (après une validation
 *                                        définitive, un refus ou une suspension)
 *
 * Le courrier suit l'état de l'offre (`workflowStatus`) : validation, refus ou
 * suspension. `status` permet de préciser l'état quand `offer` ne le porte pas
 * encore (objet lu avant la décision).
 */
const EVENT = "compartic:offer-letter";

export const openOfferLetter = (offer, { prompt = false, status = null } = {}) => {
  if (typeof window === "undefined" || !offer?.id) return;
  window.dispatchEvent(
    new CustomEvent(EVENT, { detail: { offer: { id: offer.id, code: offer.code, title: offer.title, status: status || offer.workflowStatus || null }, prompt } }),
  );
};

/** Proposition affichée après la décision, selon l'état de l'offre. */
const PROMPTS = {
  VALIDATED: { header: "Offre validée", tone: "success", text: "L'offre est validée définitivement. Voulez-vous générer le courrier de validation destiné au soumissionnaire ?" },
  REFUSED: { header: "Offre refusée", tone: "danger", text: "L'offre est refusée. Voulez-vous générer le courrier de refus destiné au soumissionnaire ? Il reprendra le motif du refus." },
  DEACTIVATED: { header: "Offre suspendue", tone: "warning", text: "L'offre est suspendue. Voulez-vous générer le courrier de suspension destiné au soumissionnaire ? Il reprendra le motif indiqué." },
};

export default function OfferLetterHost() {
  const [prompt, setPrompt] = useState(null);
  const [editing, setEditing] = useState(null);

  useEffect(() => {
    const onEvent = (e) => {
      const { offer, prompt: ask } = e.detail || {};
      if (!offer?.id) return;
      if (ask) setPrompt(offer);
      else setEditing(offer);
    };
    window.addEventListener(EVENT, onEvent);
    return () => window.removeEventListener(EVENT, onEvent);
  }, []);

  const ask = PROMPTS[prompt?.status] || PROMPTS.VALIDATED;

  return (
    <>
      <Dialog header={ask.header} visible={!!prompt} onHide={() => setPrompt(null)} style={{ width: "min(480px, 96vw)" }} className="wf wf-dialog" modal>
        <p className="wf-sub" style={{ marginBottom: 12 }}>
          <b>{prompt?.title}</b> {prompt?.code ? `(${prompt.code})` : ""}
        </p>
        <div className={`wf-alert wf-tone-${ask.tone}`}>
          {ask.text} Le modèle est composé à partir de l'analyse IA, des commentaires des validateurs et des informations de l'offre, puis reste
          modifiable.
        </div>
        <div className="wf-dialog-foot">
          <button type="button" className="wf-btn" onClick={() => setPrompt(null)}>
            Plus tard
          </button>
          <button
            type="button"
            className="wf-btn wf-btn-lg wf-btn-primary"
            onClick={() => {
              setEditing(prompt);
              setPrompt(null);
            }}
          >
            <i className="bi bi-envelope-paper"></i> Générer le courrier
          </button>
        </div>
      </Dialog>
      {editing && <OfferLetterEditor offerId={editing.id} visible={!!editing} onHide={() => setEditing(null)} />}
    </>
  );
}
