"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import AdminMainContainerPage from "../AdminMainContainerPage";
// On lit le profil via AdminProvider   la même source que l en-tête et la
// barre latérale de l espace admin/opérateur : une mise à jour se répercute
// partout sans rechargement.
import { useAdmin } from "@/services/providers/AdminProvider";
import {
  changePasswordApiService,
  updateProfileApiService,
} from "@/services/api/auth/authApiService";
import {
  toastSuccess,
  toastWarning,
} from "@/componnents/notification/notification";
import { BASE_IMG_URL, imageUrl } from "@/services/tools/constants";
import DefaultLoader from "@/componnents/Loader/DefaultLoader";
import { ROLE_LABELS, roleOf } from "@/services/rbac/roles";

/**
 * « Mon profil » (opérateur) et « Mon compte » (administration, validateurs,
 * superviseur) : la même page, adaptée au compte connecté.
 *
 * Deux volets :
 *  - Informations personnelles (identité, contact, photo) ;
 *  - Accès et sécurité (mot de passe).
 *
 * Les données de rattachement (opérateur, matricule, rôle) sont affichées en
 * lecture seule : elles relèvent de l'administrateur de la plateforme.
 *
 * @param variant  "operator" | "staff" | "auto" (d'après le compte connecté)
 */

const VARIANTS = {
  operator: {
    active: "profile",
    functionHint: "Ex. : Point focal réglementation, Direction Marketing",
    infoHint: "Ces informations apparaissent dans vos déclarations d'offres et dans les échanges avec l'ARTCI.",
    provisional: "Votre compte utilise encore le mot de passe provisoire transmis par l'ARTCI.",
  },
  staff: {
    active: "account",
    functionHint: "Ex. : Direction des marchés, service des tarifs",
    infoHint: "Ces informations apparaissent dans l'historique des offres, les décisions et les notifications.",
    provisional: "Votre compte utilise encore le mot de passe provisoire transmis par l'administrateur de la plateforme.",
  },
};

/** « Validateur 2   Chef de service » → « Validateur 2 · Chef de service ». */
const roleLabel = (user) => (ROLE_LABELS[roleOf(user)] || user?.profile?.name || "").replace(/\s{2,}/g, " · ");

/** Éléments de rattachement, en lecture seule, selon le type de compte. */
const identityFacts = (user, kind) =>
  kind === "operator"
    ? [
        { label: "Opérateur", value: user.focalPoint?.operator?.name, icon: "bi-building" },
        { label: "Matricule", value: user.focalPoint?.serialNumber, icon: "bi-hash" },
        { label: "Profil", value: user.profile?.name, icon: "bi-person-badge" },
      ]
    : [
        { label: "Organisme", value: "ARTCI", icon: "bi-building" },
        { label: "Rôle", value: roleLabel(user), icon: "bi-person-badge" },
        ...(user.createdAt
          ? [{ label: "Compte créé le", value: new Date(user.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }), icon: "bi-calendar3" }]
          : []),
      ];

/** Règles appliquées par l'API (services/config/auth/userValidation.js). */
const PASSWORD_RULES = [
  { label: "8 caractères minimum", test: (v) => v.length >= 8 },
  { label: "une lettre majuscule", test: (v) => /[A-Z]/.test(v) },
  { label: "un chiffre", test: (v) => /\d/.test(v) },
  {
    label: "un caractère spécial (@ $ ! % * ? &)",
    test: (v) => /[@$!%*?&]/.test(v),
  },
];

const initials = (u) =>
  `${(u?.firstName || "").charAt(0)}${(u?.lastName || "").charAt(0)}`
    .toUpperCase()
    .trim() || "?";

export default function ProfilePage({ variant = "auto" }) {
  const { user, setUser } = useAdmin();
  const kind = variant === "auto" ? (roleOf(user) === "FOCAL_POINT" ? "operator" : "staff") : variant;
  const texts = VARIANTS[kind] || VARIANTS.staff;

  const [tab, setTab] = useState("infos");

  // ---- Volet informations ----
  const [form, setForm] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [savingInfo, setSavingInfo] = useState(false);
  const [infoError, setInfoError] = useState(null);
  const fileRef = useRef(null);

  // ---- Volet accès ----
  const [pwd, setPwd] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPwd, setShowPwd] = useState(false);
  const [savingPwd, setSavingPwd] = useState(false);
  const [pwdError, setPwdError] = useState(null);

  useEffect(() => {
    if (user && !form) {
      setForm({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email || "",
        phone: user.phone || "",
        description: user.description || "",
      });
    }
  }, [user]);

  // L'aperçu local est un objet URL : il doit être libéré pour ne pas fuiter.
  useEffect(() => {
    if (!imageFile) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(imageFile);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [imageFile]);

  const dirty = useMemo(() => {
    if (!form || !user) return false;
    return (
      imageFile !== null ||
      form.firstName !== (user.firstName || "") ||
      form.lastName !== (user.lastName || "") ||
      form.email !== (user.email || "") ||
      form.phone !== (user.phone || "") ||
      form.description !== (user.description || "")
    );
  }, [form, user, imageFile]);

  const pwdChecks = useMemo(
    () => PASSWORD_RULES.map((r) => ({ ...r, ok: r.test(pwd.newPassword) })),
    [pwd.newPassword],
  );
  const pwdMatches =
    pwd.newPassword.length > 0 && pwd.newPassword === pwd.confirmPassword;
  const canSubmitPwd =
    pwd.currentPassword.length > 0 &&
    pwdChecks.every((c) => c.ok) &&
    pwdMatches &&
    !savingPwd;

  const onField = (name, value) => {
    setInfoError(null);
    setForm((f) => ({ ...f, [name]: value }));
  };

  const pickImage = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setInfoError("Le fichier choisi n'est pas une image.");
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      setInfoError("La photo ne doit pas dépasser 4 Mo.");
      return;
    }
    setInfoError(null);
    setImageFile(file);
  };

  const submitInfos = async (e) => {
    e?.preventDefault();
    // Sans modification, on évite un aller-retour serveur inutile.
    if (!dirty) {
      toastWarning("Aucune modification à enregistrer.");
      return;
    }
    setInfoError(null);
    setSavingInfo(true);

    const res = await updateProfileApiService(form, imageFile);

    if (res?.error === false) {
      toastSuccess("Profil mis à jour.");
      // Mise à jour immédiate du contexte : en-tête et menus suivent sans
      // rechargement de page.
      setUser?.((u) => ({ ...u, ...res.user }));
      setImageFile(null);
      if (fileRef.current) fileRef.current.value = "";
      setSavingInfo(false);
      return;
    }

    setInfoError(res?.message || "Échec de la mise à jour.");
    setSavingInfo(false);
  };

  const submitPwd = async (e) => {
    e?.preventDefault();
    if (!canSubmitPwd) return;
    setPwdError(null);
    setSavingPwd(true);

    const res = await changePasswordApiService(pwd);

    if (res?.error === false) {
      toastSuccess("Mot de passe modifié.");
      setPwd({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setUser?.((u) => ({ ...u, passwordChangedAt: new Date().toISOString() }));
      setSavingPwd(false);
      return;
    }

    setPwdError(res?.message || "Échec du changement de mot de passe.");
    setSavingPwd(false);
  };

  if (!user || !form) {
    return (
      <AdminMainContainerPage active={texts.active}>
        <div className="py-5">
          <DefaultLoader />
        </div>
      </AdminMainContainerPage>
    );
  }

  const avatar = preview || (user.imagePath ? imageUrl(user.imagePath) : null);

  return (
    <AdminMainContainerPage active={texts.active}>
      <div className="prf-page">
        {/* ---- Bandeau d'identité ---- */}
        <div className="prf-hero">
          <div className="prf-avatar">
            {avatar ? (
              <img src={avatar} alt="" />
            ) : (
              <span>{initials(user)}</span>
            )}
          </div>
          <div className="prf-hero-text">
            <h1 className="prf-name">
              {user.firstName} {user.lastName}
            </h1>
            <p className="prf-meta">
              {identityFacts(user, kind)
                .filter((fact) => fact.value && fact.label !== "Compte créé le")
                .map((fact) => (
                  <span className="prf-chip" key={fact.label}>
                    <i className={`bi ${fact.icon} me-1`}></i>
                    {fact.value}
                  </span>
                ))}
              <span className="prf-chip">
                <i className="bi bi-envelope me-1"></i>
                {user.email}
              </span>
            </p>
          </div>
        </div>

        {/* ---- Onglets ---- */}
        <div className="prf-tabs" role="tablist">
          <button
            role="tab"
            aria-selected={tab === "infos"}
            className={`prf-tab ${tab === "infos" ? "active" : ""}`}
            onClick={() => setTab("infos")}
          >
            <i className="bi bi-person me-2"></i>Informations personnelles
          </button>
          <button
            role="tab"
            aria-selected={tab === "acces"}
            className={`prf-tab ${tab === "acces" ? "active" : ""}`}
            onClick={() => setTab("acces")}
          >
            <i className="bi bi-shield-lock me-2"></i>Accès et sécurité
          </button>
        </div>

        {tab === "infos" && (
          <form className="prf-card" onSubmit={submitInfos}>
            <div className="prf-card-head">
              <h2>Informations personnelles</h2>
              <p>{texts.infoHint}</p>
            </div>

            <div className="prf-photo-row">
              <div className="prf-avatar prf-avatar-sm">
                {avatar ? <img src={avatar} alt="" /> : <span>{initials(user)}</span>}
              </div>
              <div>
                <button
                  type="button"
                  className="prf-btn-ghost"
                  onClick={() => fileRef.current?.click()}
                >
                  <i className="bi bi-upload me-2"></i>
                  {imageFile ? "Changer la photo" : "Choisir une photo"}
                </button>
                {imageFile && (
                  <button
                    type="button"
                    className="prf-btn-link"
                    onClick={() => {
                      setImageFile(null);
                      if (fileRef.current) fileRef.current.value = "";
                    }}
                  >
                    Annuler
                  </button>
                )}
                <div className="prf-hint">JPG ou PNG, 4 Mo maximum.</div>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="d-none"
                  onChange={pickImage}
                />
              </div>
            </div>

            <div className="prf-grid">
              <div>
                <label className="prf-label" htmlFor="prf-first">
                  Prénom <span className="prf-req">*</span>
                </label>
                <input
                  id="prf-first"
                  className="prf-input"
                  value={form.firstName}
                  onChange={(e) => onField("firstName", e.target.value)}
                />
              </div>
              <div>
                <label className="prf-label" htmlFor="prf-last">
                  Nom
                </label>
                <input
                  id="prf-last"
                  className="prf-input"
                  value={form.lastName}
                  onChange={(e) => onField("lastName", e.target.value)}
                />
              </div>
              <div>
                <label className="prf-label" htmlFor="prf-email">
                  Adresse e-mail <span className="prf-req">*</span>
                </label>
                <input
                  id="prf-email"
                  type="email"
                  className="prf-input"
                  value={form.email}
                  onChange={(e) => onField("email", e.target.value)}
                />
                <div className="prf-hint">
                  Elle sert également d'identifiant de connexion.
                </div>
              </div>
              <div>
                <label className="prf-label" htmlFor="prf-phone">
                  Téléphone
                </label>
                <input
                  id="prf-phone"
                  className="prf-input"
                  value={form.phone}
                  onChange={(e) => onField("phone", e.target.value)}
                  placeholder="+225 ..."
                />
              </div>
              <div className="prf-col-2">
                <label className="prf-label" htmlFor="prf-desc">
                  Fonction / note
                </label>
                <textarea
                  id="prf-desc"
                  rows={3}
                  className="prf-input"
                  value={form.description}
                  onChange={(e) => onField("description", e.target.value)}
                  placeholder={texts.functionHint}
                />
              </div>
            </div>

            {/* Rattachement, non modifiable ici : l'afficher évite d'avoir à le demander. */}
            <div className="prf-readonly">
              {identityFacts(user, kind).map((fact) => (
                <div key={fact.label}>
                  <span className="prf-ro-label">{fact.label}</span>
                  <span className="prf-ro-value">{fact.value || " "}</span>
                </div>
              ))}
              <p className="prf-ro-note">
                <i className="bi bi-info-circle me-1"></i>
                Ces éléments sont gérés par l'administrateur de la plateforme.
              </p>
            </div>

            {infoError && (
              <div className="prf-error" role="alert">
                <i className="bi bi-exclamation-triangle me-2"></i>
                {infoError}
              </div>
            )}

            <div className="prf-actions">
              <button
                type="submit"
                className="prf-btn-primary"
                disabled={!dirty || savingInfo}
              >
                {savingInfo ? (
                  <>
                    <span className="prf-spinner" aria-hidden="true"></span>
                    Enregistrement…
                  </>
                ) : (
                  <>
                    <i className="bi bi-check-lg me-2"></i>Enregistrer
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {tab === "acces" && (
          <form className="prf-card" onSubmit={submitPwd}>
            <div className="prf-card-head">
              <h2>Mot de passe</h2>
              <p>
                {user.passwordChangedAt
                  ? `Dernière modification le ${new Date(
                      user.passwordChangedAt,
                    ).toLocaleDateString("fr-FR")}.`
                  : texts.provisional}
              </p>
            </div>

            <div className="prf-grid">
              <div>
                <label className="prf-label" htmlFor="prf-cur">
                  Mot de passe actuel
                </label>
                <input
                  id="prf-cur"
                  className="prf-input"
                  type={showPwd ? "text" : "password"}
                  autoComplete="current-password"
                  value={pwd.currentPassword}
                  onChange={(e) => {
                    setPwdError(null);
                    setPwd({ ...pwd, currentPassword: e.target.value });
                  }}
                />
              </div>
              <div />
              <div>
                <label className="prf-label" htmlFor="prf-new">
                  Nouveau mot de passe
                </label>
                <input
                  id="prf-new"
                  className="prf-input"
                  type={showPwd ? "text" : "password"}
                  autoComplete="new-password"
                  value={pwd.newPassword}
                  onChange={(e) => {
                    setPwdError(null);
                    setPwd({ ...pwd, newPassword: e.target.value });
                  }}
                />
              </div>
              <div>
                <label className="prf-label" htmlFor="prf-conf">
                  Confirmation
                </label>
                <input
                  id="prf-conf"
                  className={`prf-input ${
                    pwd.confirmPassword.length > 0 && !pwdMatches
                      ? "prf-input-error"
                      : ""
                  }`}
                  type={showPwd ? "text" : "password"}
                  autoComplete="new-password"
                  value={pwd.confirmPassword}
                  onChange={(e) => {
                    setPwdError(null);
                    setPwd({ ...pwd, confirmPassword: e.target.value });
                  }}
                />
              </div>
            </div>

            <label className="prf-show">
              <input
                type="checkbox"
                checked={showPwd}
                onChange={(e) => setShowPwd(e.target.checked)}
              />
              <span>Afficher les mots de passe</span>
            </label>

            <ul className="prf-rules">
              {pwdChecks.map((c) => (
                <li key={c.label} className={c.ok ? "ok" : ""}>
                  <i className={`bi ${c.ok ? "bi-check-lg" : "bi-dot"}`}></i>
                  {c.label}
                </li>
              ))}
              <li className={pwdMatches ? "ok" : ""}>
                <i className={`bi ${pwdMatches ? "bi-check-lg" : "bi-dot"}`}></i>
                les deux saisies sont identiques
              </li>
            </ul>

            {pwdError && (
              <div className="prf-error" role="alert">
                <i className="bi bi-exclamation-triangle me-2"></i>
                {pwdError}
              </div>
            )}

            <div className="prf-actions">
              <button
                type="submit"
                className="prf-btn-primary"
                disabled={!canSubmitPwd}
              >
                {savingPwd ? (
                  <>
                    <span className="prf-spinner" aria-hidden="true"></span>
                    Enregistrement…
                  </>
                ) : (
                  <>
                    <i className="bi bi-shield-check me-2"></i>
                    Modifier le mot de passe
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </AdminMainContainerPage>
  );
}
