import React, { useEffect, useMemo, useRef, useState } from "react";
import { Dialog } from "primereact/dialog";
import {
  requestSubmissionCode,
  verifySubmissionCode,
} from "@/services/api/offers/submissionApiService";

/**
 * Confirmation par code avant la soumission définitive d'une offre.
 *
 * La modale ne soumet rien elle-même : elle vérifie le code auprès du serveur
 * et, en cas de succès, remet au parent le JETON à usage unique qui autorisera
 * l'enregistrement. Tant que ce jeton n'a pas été délivré, aucune offre ne peut
 * être créée   l'API le refuse.
 *
 * Elle affiche, comme demandé : le champ de saisie, le bouton « Valider et
 * soumettre », l'option « Renvoyer le code », et la durée de validité restante.
 *
 * @param visible     ouverture pilotée par le parent
 * @param onHide      fermeture (annulation)
 * @param reference   code de l'offre   clé de corrélation du code de validation
 * @param label       intitulé de l'offre, rappelé dans la modale
 * @param info        réponse de la demande de code (adresse masquée, expiration…)
 * @param onValidated appelé avec le jeton une fois le code validé
 * @param submitting  vrai pendant l'enregistrement de l'offre par le parent
 * @param error       message d'échec remonté par le parent (échec d'enregistrement)
 */
export default function SubmissionCodeModal({
  visible,
  onHide,
  reference,
  label,
  info,
  onValidated,
  submitting = false,
  error = null,
}) {
  const length = info?.codeLength || 6;

  const [digits, setDigits] = useState(() => Array(length).fill(""));
  const [checking, setChecking] = useState(false);
  const [resending, setResending] = useState(false);
  const [message, setMessage] = useState(null); // { tone, text }
  const [expiresAt, setExpiresAt] = useState(info?.expiresAt || null);
  const [remaining, setRemaining] = useState(0); // secondes de validité
  const [cooldown, setCooldown] = useState(info?.resendAvailableInSeconds || 0);
  const [maskedEmail, setMaskedEmail] = useState(info?.maskedEmail || "");

  const inputsRef = useRef([]);

  // Réinitialisation à chaque ouverture : un code d'une soumission précédente
  // ne doit jamais rester affiché.
  useEffect(() => {
    if (!visible) return;
    setDigits(Array(length).fill(""));
    setMessage(null);
    setExpiresAt(info?.expiresAt || null);
    setCooldown(info?.resendAvailableInSeconds || 0);
    setMaskedEmail(info?.maskedEmail || "");
    const t = setTimeout(() => inputsRef.current?.[0]?.focus(), 120);
    return () => clearTimeout(t);
  }, [visible, info, length]);

  // Décompte de la validité du code.
  useEffect(() => {
    if (!visible || !expiresAt) return;
    const tick = () => {
      const left = Math.max(
        0,
        Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000),
      );
      setRemaining(left);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [visible, expiresAt]);

  // Décompte du délai avant un nouvel envoi.
  useEffect(() => {
    if (!visible || cooldown <= 0) return;
    const id = setInterval(() => setCooldown((c) => (c > 0 ? c - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, [visible, cooldown]);

  const code = useMemo(() => digits.join(""), [digits]);
  const complete = code.length === length && /^\d+$/.test(code);
  const expired = remaining <= 0;
  const busy = checking || submitting || resending;

  const mmss = (s) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  const setDigit = (index, value) => {
    const clean = String(value).replace(/\D/g, "");
    setDigits((prev) => {
      const next = [...prev];
      next[index] = clean.slice(-1);
      return next;
    });
    if (clean && index < length - 1) inputsRef.current?.[index + 1]?.focus();
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputsRef.current?.[index - 1]?.focus();
    }
    if (e.key === "ArrowLeft" && index > 0) inputsRef.current?.[index - 1]?.focus();
    if (e.key === "ArrowRight" && index < length - 1)
      inputsRef.current?.[index + 1]?.focus();
    if (e.key === "Enter" && complete && !expired && !busy) handleValidate();
  };

  // Le code arrive le plus souvent par copier-coller depuis l'e-mail : on
  // répartit les chiffres collés sur l'ensemble des cases.
  const handlePaste = (e) => {
    const pasted = (e.clipboardData?.getData("text") || "").replace(/\D/g, "");
    if (!pasted) return;
    e.preventDefault();
    const next = Array(length).fill("");
    pasted
      .slice(0, length)
      .split("")
      .forEach((d, i) => {
        next[i] = d;
      });
    setDigits(next);
    inputsRef.current?.[Math.min(pasted.length, length - 1)]?.focus();
  };

  const handleValidate = async () => {
    if (!complete || expired || busy) return;
    setChecking(true);
    setMessage(null);
    try {
      const res = await verifySubmissionCode({ reference, code });
      if (res?.success && res?.ticket) {
        setMessage({ tone: "success", text: "Code validé. Soumission en cours…" });
        await onValidated?.(res.ticket);
        return;
      }
      setMessage({ tone: "danger", text: res?.error || "Code incorrect." });
      if (res?.mustRenew) setRemaining(0);
      setDigits(Array(length).fill(""));
      inputsRef.current?.[0]?.focus();
    } finally {
      setChecking(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || busy) return;
    setResending(true);
    setMessage(null);
    try {
      const res = await requestSubmissionCode({ reference, label });
      if (res?.success) {
        setExpiresAt(res.expiresAt);
        setMaskedEmail(res.maskedEmail || maskedEmail);
        setCooldown(res.resendAvailableInSeconds || 60);
        setDigits(Array(length).fill(""));
        inputsRef.current?.[0]?.focus();
        setMessage({
          tone: "success",
          text: "Un nouveau code vient de vous être envoyé.",
        });
        return;
      }
      if (res?.retryAfterSeconds) setCooldown(res.retryAfterSeconds);
      setMessage({
        tone: "danger",
        text: res?.error || "Le code n'a pas pu être renvoyé.",
      });
    } finally {
      setResending(false);
    }
  };

  return (
    <Dialog
      header={
        <div className="sbc-head">
          <i className="bi bi-shield-lock-fill me-2"></i>
          CONFIRMATION DE LA SOUMISSION
        </div>
      }
      visible={visible}
      onHide={() => (busy ? null : onHide?.())}
      closable={!busy}
      draggable={false}
      dismissableMask={false}
      className="sbc-dialog"
      style={{ width: "min(560px, 96vw)" }}
      headerStyle={{ background: "#03832e", color: "#fff", padding: 14 }}
    >
      <div className="sbc-body">
        <p className="sbc-intro">
          Pour des raisons de sécurité, la soumission de l'offre
          {label ? (
            <>
              {" "}
              <b>« {label} »</b>
            </>
          ) : null}{" "}
          doit être confirmée. Un code de validation vient d'être envoyé à
          l'adresse&nbsp;:
        </p>

        <div className="sbc-mail">
          <i className="bi bi-envelope-check me-2"></i>
          {maskedEmail || "votre adresse enregistrée"}
        </div>

        <label className="sbc-label" htmlFor="sbc-d0">
          Saisissez le code reçu
        </label>

        <div className="sbc-inputs" onPaste={handlePaste}>
          {digits.map((d, i) => (
            <input
              key={`sbc-d-${i}`}
              id={`sbc-d${i}`}
              ref={(el) => {
                inputsRef.current[i] = el;
              }}
              className={`sbc-digit${expired ? " sbc-digit--off" : ""}`}
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={1}
              value={d}
              disabled={expired || busy}
              aria-label={`Chiffre ${i + 1}`}
              onChange={(e) => setDigit(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
            />
          ))}
        </div>

        {/* Durée de validité : exigée par le processus, et utile pour savoir
            s'il faut demander un nouveau code. */}
        <div className={`sbc-timer${expired ? " sbc-timer--off" : ""}`}>
          <i
            className={`bi ${expired ? "bi-x-octagon" : "bi-clock-history"} me-2`}
          ></i>
          {expired ? (
            <>
              Ce code a expiré. Demandez-en un nouveau pour poursuivre la
              soumission.
            </>
          ) : (
            <>
              Code valable encore <b>{mmss(remaining)}</b>   utilisable une seule
              fois.
            </>
          )}
        </div>

        {(message || error) && (
          <div
            className={`sbc-alert sbc-alert--${
              error ? "danger" : message?.tone || "info"
            }`}
            role="alert"
          >
            <i
              className={`bi ${
                error || message?.tone === "danger"
                  ? "bi-exclamation-triangle-fill"
                  : "bi-check-circle-fill"
              } me-2`}
            ></i>
            {error || message?.text}
          </div>
        )}

        <div className="sbc-actions">
          <button
            type="button"
            className="sbc-btn sbc-btn--ghost"
            onClick={() => onHide?.()}
            disabled={busy}
          >
            Annuler
          </button>

          <button
            type="button"
            className="sbc-btn sbc-btn--link"
            onClick={handleResend}
            disabled={cooldown > 0 || busy}
          >
            <i className="bi bi-arrow-repeat me-2"></i>
            {resending
              ? "Envoi…"
              : cooldown > 0
                ? `Renvoyer le code (${cooldown}s)`
                : "Renvoyer le code"}
          </button>

          <button
            type="button"
            className="sbc-btn sbc-btn--primary"
            onClick={handleValidate}
            disabled={!complete || expired || busy}
          >
            {checking || submitting ? (
              <>
                <span className="sbc-spin" aria-hidden="true"></span>
                {submitting ? "Soumission…" : "Vérification…"}
              </>
            ) : (
              <>
                <i className="bi bi-send-check-fill me-2"></i>Valider et soumettre
              </>
            )}
          </button>
        </div>

        <p className="sbc-foot">
          Tant que ce code n'a pas été validé, l'offre n'est pas soumise et reste
          modifiable.
        </p>
      </div>
    </Dialog>
  );
}
