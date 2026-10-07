"use client";

import React, { useEffect, useMemo, useState } from "react";
// On lit le profil via AdminProvider   la même source que l en-tête et la
// barre latérale de l espace admin/opérateur : une mise à jour se répercute
// partout sans rechargement.
import { useAdmin } from "@/services/providers/AdminProvider";
import { changePasswordApiService } from "@/services/api/auth/authApiService";
import { toastSuccess } from "@/componnents/notification/notification";

/**
 * Changement de mot de passe OBLIGATOIRE à la première connexion.
 *
 * Un compte opérateur est créé par l'administrateur avec un mot de passe
 * provisoire transmis par e-mail. Tant que l'opérateur ne l'a pas remplacé,
 * `passwordChangedAt` reste NULL côté base : cet écran s'interpose alors
 * au-dessus de tout l'espace de travail et ne peut être fermé (ni croix, ni
 * clic extérieur, ni touche Échap). Seule la déconnexion permet d'en sortir.
 *
 * Le composant est monté dans le conteneur commun admin/opérateur, ce qui
 * garantit qu'aucune page de l'espace authentifié n'est atteignable avant le
 * changement.
 */

// Profil concerné par l'obligation (cf. table Profile).
const OPERATOR_PROFILE_CODE = "PRF2-TEST";

/** Règle appliquée par l'API (services/config/auth/userValidation.js). */
const RULES = [
  { label: "8 caractères minimum", test: (v) => v.length >= 8 },
  { label: "une lettre majuscule", test: (v) => /[A-Z]/.test(v) },
  { label: "un chiffre", test: (v) => /\d/.test(v) },
  {
    label: "un caractère spécial (@ $ ! % * ? &)",
    test: (v) => /[@$!%*?&]/.test(v),
  },
];

export default function ForcePasswordChangeGate() {
  const { user, logout } = useAdmin();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  // Un opérateur dont le mot de passe n'a jamais été changé doit le faire.
  const required =
    user?.profile?.code === OPERATOR_PROFILE_CODE &&
    !user?.passwordChangedAt &&
    !done;

  // Le fond ne doit pas défiler derrière l'écran bloquant.
  useEffect(() => {
    if (typeof document === "undefined") return;
    if (required) {
      const previous = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = previous;
      };
    }
  }, [required]);

  const checks = useMemo(
    () => RULES.map((r) => ({ ...r, ok: r.test(newPassword) })),
    [newPassword],
  );
  const allRulesOk = checks.every((c) => c.ok);
  const matches = newPassword.length > 0 && newPassword === confirmPassword;
  const canSubmit =
    currentPassword.length > 0 && allRulesOk && matches && !loading;

  if (!required) return null;

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!canSubmit) return;

    setError(null);
    setLoading(true);

    const res = await changePasswordApiService({
      currentPassword,
      newPassword,
      confirmPassword,
    });

    if (res?.error === false) {
      setDone(true);
      toastSuccess("Mot de passe modifié. Bienvenue sur CompareTIC !");
      // Rechargement : le profil est relu et l'écran ne réapparaît plus.
      setTimeout(() => {
        if (typeof window !== "undefined") window.location.reload();
      }, 1200);
      return;
    }

    setError(res?.message || "Échec du changement de mot de passe.");
    setLoading(false);
  };

  return (
    <div
      className="fpc-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="fpc-title"
    >
      <div className="fpc-card">
        <div className="fpc-head">
          <div className="fpc-badge">
            <i className="bi bi-shield-lock"></i>
          </div>
          <div>
            <h2 id="fpc-title" className="fpc-title">
              Changement de mot de passe requis
            </h2>
            <p className="fpc-sub">
              Bienvenue{user?.firstName ? `, ${user.firstName}` : ""}. Votre
              compte utilise encore le mot de passe provisoire transmis par
              l'ARTCI. Définissez votre propre mot de passe pour accéder à
              l'espace opérateur.
            </p>
          </div>
        </div>

        <form className="fpc-body" onSubmit={handleSubmit}>
          <label className="fpc-label" htmlFor="fpc-current">
            Mot de passe provisoire
          </label>
          <input
            id="fpc-current"
            className="fpc-input"
            type={show ? "text" : "password"}
            autoComplete="current-password"
            autoFocus
            value={currentPassword}
            onChange={(e) => {
              setCurrentPassword(e.target.value);
              setError(null);
            }}
            placeholder="Celui reçu par e-mail"
          />

          <label className="fpc-label" htmlFor="fpc-new">
            Nouveau mot de passe
          </label>
          <input
            id="fpc-new"
            className="fpc-input"
            type={show ? "text" : "password"}
            autoComplete="new-password"
            value={newPassword}
            onChange={(e) => {
              setNewPassword(e.target.value);
              setError(null);
            }}
            placeholder="Votre nouveau mot de passe"
          />

          <label className="fpc-label" htmlFor="fpc-confirm">
            Confirmation
          </label>
          <input
            id="fpc-confirm"
            className={`fpc-input ${
              confirmPassword.length > 0 && !matches ? "fpc-input-error" : ""
            }`}
            type={show ? "text" : "password"}
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              setError(null);
            }}
            placeholder="Retapez le nouveau mot de passe"
          />

          <label className="fpc-show">
            <input
              type="checkbox"
              checked={show}
              onChange={(e) => setShow(e.target.checked)}
            />
            <span>Afficher les mots de passe</span>
          </label>

          {/* Contrôles affichés en direct : l'utilisateur sait pourquoi le
              bouton reste inactif, plutôt que de le découvrir après envoi. */}
          <ul className="fpc-rules">
            {checks.map((c) => (
              <li key={c.label} className={c.ok ? "ok" : ""}>
                <i className={`bi ${c.ok ? "bi-check-lg" : "bi-dot"}`}></i>
                {c.label}
              </li>
            ))}
            <li className={matches ? "ok" : ""}>
              <i className={`bi ${matches ? "bi-check-lg" : "bi-dot"}`}></i>
              les deux saisies sont identiques
            </li>
          </ul>

          {error && (
            <div className="fpc-error" role="alert">
              <i className="bi bi-exclamation-triangle me-2"></i>
              {error}
            </div>
          )}

          <div className="fpc-actions">
            <button
              type="button"
              className="fpc-btn-ghost"
              onClick={() => logout?.()}
              disabled={loading}
            >
              Se déconnecter
            </button>
            <button
              type="submit"
              className="fpc-btn-primary"
              disabled={!canSubmit}
            >
              {loading ? (
                <>
                  <span className="fpc-spinner" aria-hidden="true"></span>
                  Enregistrement…
                </>
              ) : (
                <>
                  <i className="bi bi-check-lg me-2"></i>
                  Définir mon mot de passe
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
