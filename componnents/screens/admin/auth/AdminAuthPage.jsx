import {
  toastSuccess,
  toastWarning,
} from "@/componnents/notification/notification";
import {
  getAuthUser,
  loginApiService,
  sendEmailForPassForgetApi,
} from "@/services/api/auth/authApiService";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import Link from "next/link";

/**
 * Connexion à l'espace de gestion (ARTCI et points focaux des opérateurs).
 *
 * Mise en page en deux volets : identité de la plateforme à gauche,
 * formulaire à droite ; un seul volet sur mobile. Styles : styles/admin-auth.css
 * (classes préfixées « aa- »). La logique de connexion est inchangée.
 */

export default function AdminAuthPage() {
  const [showError, setShowError] = useState(false);

  const router = useRouter();
  const [user, setUser] = useState();

  // Retour après une session périmée (base réinitialisée, jeton expiré…).
  useEffect(() => {
    if (router.isReady && router.query.session === "expiree") {
      toastWarning(
        "Votre session a expiré ou n'est plus valide. Reconnectez-vous.",
      );
    }
  }, [router.isReady, router.query.session]);

  const [loginResponse, setLoginResponse] = useState();
  const [showPassword, setShowPassword] = useState(false);
  // Connexion en cours : le bouton est neutralisé (pas de double envoi).
  const [submitting, setSubmitting] = useState(false);
  // Mot de passe oublié : le lien ne menait nulle part (href="#").
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotState, setForgotState] = useState(null); // "sending" | "sent" | "error"

  const handleForgot = async (e) => {
    e.preventDefault();
    const email = forgotEmail.trim().toLowerCase();
    if (!email || !email.includes("@")) {
      toastWarning("Saisissez l'adresse e-mail de votre compte.");
      return;
    }
    setForgotState("sending");
    const res = await sendEmailForPassForgetApi(email);
    if (res?.error === false) {
      setForgotState("sent");
      toastSuccess(
        "Si un compte existe pour cette adresse, un message vient d'être envoyé.",
      );
    } else {
      // Réponse volontairement neutre : ne pas révéler l'existence d'un compte.
      setForgotState("sent");
      toastSuccess(
        "Si un compte existe pour cette adresse, un message vient d'être envoyé.",
      );
    }
  };

  const onInputChange = (e, name) => {
    const val = (e.target && e.target.value) || "";
    let _user = { ...user };

    _user[`${name}`] = val;

    setUser(_user);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    if (user?.email?.trim()) {
      if (user?.password?.trim()) {
        setSubmitting(true);
        const response = await loginApiService(user);
        setSubmitting(false);
        if (response?.error === false) {
          const _usr = await getAuthUser();
          if (_usr) {
            // Redirection par rôle : le point focal vers son espace, tout le
            // back-office ARTCI (administration, superviseur, validateurs)
            // vers le tableau de bord. Le superviseur n'était redirigé nulle part.
            if (_usr?.role === "FOCAL_POINT") {
              router.replace("/operator-dashboard");
            } else if (_usr?.role && _usr.role !== "CLIENT") {
              router.replace("/admin-dashboard");
            }
          }
        } else {
          toastWarning(response?.message, 10000);
        }
      }
    } else {
      toastWarning("Veuillez saisir un email valide", 10000);
    }
  };
  return (
    <div className="aa">
      {/* ------------------------------------------------------- Volet identité */}
      <div className="h-100 align-content-center align-items-center bg-bEbrand">
        <aside className="aa-brand align-self-center">
          <div className=" align-self-center">
            <div className="aa-brand-top d-flex justify-content-between">
              <h1 className="aa-brand-title">
                Compare<em>TIC</em>
              </h1>
            </div>
            <div className="aa-brand-body">
              {/* <p className="aa-kicker">Espace de gestion</p>
               */}
              <div className="d-flex justify-content-center">
                <img
                  src="/images/banner/bb3.jpg"
                  alt="Banner"
                  className=""
                  style={{ marginBottom: 30, borderRadius: 8 }}
                />
              </div>
              {/* <p className="aa-brand-text">
            La plateforme de l'ARTCI pour déclarer, examiner et suivre les offres de services de communications électroniques.
          </p>
          <ul className="aa-points">
            <li>
              <i className="bi bi-collection" aria-hidden="true"></i>
              <span>Déclaration et gestion des offres</span>
            </li>
            <li>
              <i className="bi bi-patch-check" aria-hidden="true"></i>
              <span>Circuit de validation à plusieurs niveaux</span>
            </li>
            <li>
              <i className="bi bi-bar-chart-line" aria-hidden="true"></i>
              <span>Suivi, statistiques et indices tarifaires</span>
            </li>
          </ul> */}
              <img
                src="/images/logo/logo-white.png"
                style={{ height: 50, width: 120 }}
                alt="ARTCI"
                className="test"
              />
            </div>
            <div className="aa-brand-foot">
              <span className="aa-flag" aria-hidden="true">
                <i></i>
                <i></i>
                <i></i>
              </span>
              ARTCI © {new Date().getFullYear()} · Tous droits réservés
            </div>
          </div>
        </aside>
      </div>

      {/* ------------------------------------------------------ Volet formulaire */}
      <main className="aa-main">
        <div className="aa-card">
          <div className="aa-card-logo">
            <img src="/images/logo/logo.png" alt="ARTCI" />
          </div>
          <h2 className="aa-title">Connexion</h2>
          <p className="aa-sub">
            Accédez à votre espace de gestion CompareTIC.
          </p>

          <form className="aa-form" onSubmit={handleSubmit} noValidate>
            <div className="aa-field">
              <label htmlFor="email">Adresse e-mail</label>
              <div className="aa-input">
                <i className="bi bi-envelope" aria-hidden="true"></i>
                <input
                  id="email"
                  autoComplete="username"
                  aria-label="Adresse e-mail"
                  name="email"
                  type="email"
                  placeholder="prenom.nom@artci.ci"
                  onChange={(e) => onInputChange(e, "email")}
                  required
                />
              </div>
            </div>

            <div className="aa-field">
              <label htmlFor="password">Mot de passe</label>
              <div className="aa-input">
                <i className="bi bi-lock" aria-hidden="true"></i>
                <input
                  id="password"
                  name="password"
                  type={!showPassword ? "password" : "text"}
                  placeholder="Votre mot de passe"
                  autoComplete="current-password"
                  aria-label="Mot de passe"
                  onChange={(e) => onInputChange(e, "password")}
                  required
                />
                <button
                  type="button"
                  className="aa-eye"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={
                    showPassword
                      ? "Masquer le mot de passe"
                      : "Afficher le mot de passe"
                  }
                  title={
                    showPassword
                      ? "Masquer le mot de passe"
                      : "Afficher le mot de passe"
                  }
                >
                  <i
                    className={`bi ${showPassword ? "bi-eye-slash" : "bi-eye"}`}
                    aria-hidden="true"
                  ></i>
                </button>
              </div>
            </div>

            <div className="aa-row">
              <button
                type="button"
                className="aa-link"
                onClick={() => setForgotOpen((v) => !v)}
                aria-expanded={forgotOpen}
              >
                Mot de passe oublié ?
              </button>
            </div>

            {forgotOpen && (
              <div className="aa-forgot">
                {forgotState === "sent" ? (
                  <div className="aa-forgot-sent">
                    <i className="bi bi-check2-circle" aria-hidden="true"></i>
                    <span>
                      Si un compte existe pour cette adresse, un message
                      contenant la marche à suivre vient d'être envoyé.
                    </span>
                  </div>
                ) : (
                  <>
                    <label htmlFor="forgot-email">
                      Adresse e-mail de votre compte
                    </label>
                    <div className="aa-forgot-row">
                      <div className="aa-input aa-input--sm">
                        <i className="bi bi-envelope" aria-hidden="true"></i>
                        <input
                          id="forgot-email"
                          type="email"
                          value={forgotEmail}
                          onChange={(e) => setForgotEmail(e.target.value)}
                          placeholder="prenom.nom@artci.ci"
                        />
                      </div>
                      <button
                        type="button"
                        className="aa-btn aa-btn--soft"
                        onClick={handleForgot}
                        disabled={forgotState === "sending"}
                      >
                        {forgotState === "sending" ? "Envoi…" : "Envoyer"}
                      </button>
                    </div>
                    <p className="aa-hint">
                      Un message vous indiquera la marche à suivre. Sans
                      réponse, contactez l'administration.
                    </p>
                  </>
                )}
              </div>
            )}

            <button
              type="submit"
              className="aa-btn aa-btn--primary"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <span
                    className="spinner-border spinner-border-sm"
                    aria-hidden="true"
                  ></span>{" "}
                  Connexion…
                </>
              ) : (
                <>
                  Se connecter{" "}
                  <i className="bi bi-arrow-right" aria-hidden="true"></i>
                </>
              )}
            </button>
          </form>

          <div className="aa-notice">
            <i className="bi bi-shield-lock" aria-hidden="true"></i>
            <span>
              <b>Accès restreint.</b> Cette page est strictement réservée aux
              personnes autorisées. Tout accès non autorisé est interdit et peut
              entraîner des sanctions.
            </span>
          </div>

          <Link href="/" className="aa-back">
            <i className="bi bi-arrow-left" aria-hidden="true"></i> Retour au
            site public
          </Link>
        </div>
      </main>
    </div>
  );
}
