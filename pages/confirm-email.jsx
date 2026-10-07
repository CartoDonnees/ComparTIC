"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { FKTND_H } from "@/services/tools/constants";

/**
 * Confirmation d'adresse e-mail.
 *
 * Cette page N'EXISTAIT PAS : les e-mails d'inscription et de création de
 * compte opérateur pointent vers `/confirm-email?email=…&token=…`, ce qui
 * renvoyait donc un 404   aucun compte ne pouvait être activé par ce lien.
 *
 * La page lit les paramètres du lien, appelle l'API de confirmation et affiche
 * un résultat explicite : succès, compte déjà activé, lien expiré ou erreur.
 */
export default function ConfirmEmailPage() {
  const router = useRouter();
  const { email, token } = router.query;

  // "loading" | "success" | "already" | "invalid" | "error"
  const [state, setState] = useState("loading");
  const [message, setMessage] = useState("");
  // Un lien ouvert deux fois (ou le double rendu de développement) ne doit pas
  // déclencher deux appels concurrents.
  const done = useRef(false);

  useEffect(() => {
    if (!router.isReady || done.current) return;

    if (!email || !token) {
      done.current = true;
      setState("invalid");
      setMessage(
        "Ce lien de confirmation est incomplet. Ouvrez-le directement depuis l'e-mail reçu.",
      );
      return;
    }

    done.current = true;

    (async () => {
      try {
        const res = await fetch("/api/auth/confirmEmail", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ verskth: FKTND_H, email, token }),
        });
        const data = await res.json().catch(() => ({}));

        if (res.ok && data?.success) {
          setState(data?.alreadyConfirmed ? "already" : "success");
          setMessage(data?.message || "Votre compte est activé.");
          return;
        }
        setState(res.status === 400 || res.status === 404 ? "invalid" : "error");
        setMessage(
          data?.error || "La confirmation n'a pas pu être effectuée.",
        );
      } catch (e) {
        setState("error");
        setMessage("Serveur injoignable. Réessayez dans un instant.");
      }
    })();
  }, [router.isReady, email, token]);

  const VIEW = {
    loading: { icon: "bi-hourglass-split", tone: "info", title: "Vérification en cours…" },
    success: { icon: "bi-patch-check-fill", tone: "success", title: "Compte activé" },
    already: { icon: "bi-info-circle-fill", tone: "info", title: "Compte déjà activé" },
    invalid: { icon: "bi-x-octagon-fill", tone: "warning", title: "Lien invalide" },
    error: { icon: "bi-exclamation-triangle-fill", tone: "danger", title: "Une erreur est survenue" },
  };
  const v = VIEW[state];

  return (
    <div className="cfm-page">
      <div className="cfm-card">
        <div className={`cfm-icon cfm-icon--${v.tone}`}>
          <i className={`bi ${v.icon}`} aria-hidden="true"></i>
        </div>

        <h1 className="cfm-title">{v.title}</h1>
        <p className="cfm-text" role="status">
          {state === "loading"
            ? "Nous validons votre lien de confirmation."
            : message}
        </p>

        {email && state !== "loading" && (
          <p className="cfm-mail">{email}</p>
        )}

        <div className="cfm-actions">
          {(state === "success" || state === "already") && (
            <Link href="/admin-auth" className="cfm-btn cfm-btn--primary">
              <i className="bi bi-box-arrow-in-right me-2"></i>
              Se connecter
            </Link>
          )}
          {/* {(state === "invalid" || state === "error") && (
            <Link href="/admin-auth" className="cfm-btn cfm-btn--ghost">
              Aller à la connexion
            </Link>
          )} */}
          <Link href="/" className="cfm-btn cfm-btn--ghost">
            Retour à l'accueil
          </Link>
        </div>
      </div>
    </div>
  );
}
