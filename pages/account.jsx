import React, { useEffect, useState } from "react";
import AdminAccountPage from "@/componnents/screens/admin/account/AdminAccountPage";
import { getAuthUser } from "@/services/api/auth/authApiService";

/**
 * Profils de l'espace d'administration : ils travaillent dans
 * `AdminMainContainerPage` (en-tête et barre latérale admin). Les clients
 * (PRF3-TEST) utilisent la mise en page du site public.
 */
const ADMIN_SPACE_PROFILES = [
  "PRF0-TEST",
  "PRF1-TEST",
  "PRF2-TEST",
  // Rôles du workflow de validation
  "PRF-SUPERADMIN",
  "PRF-VAL1",
  "PRF-VAL2",
  "PRF-VAL3",
  "PRF-VAL4",
];

/**
 * « Mon compte ».
 *
 * Côté admin, la page est rendue comme `children` de la page principale de
 * l'administration ; côté client, elle garde sa mise en page publique.
 *
 * Le profil est connu de façon asynchrone. Tant qu'il ne l'est pas, rien n'est
 * affiché : choisir une mise en page par défaut puis basculer ferait
 * apparaître un instant l'en-tête du site public avant celui de
 * l'administration. En cas d'échec de lecture, on retombe sur la mise en page
 * publique.
 */
export default function Account() {
  const [shell, setShell] = useState(null); // null | "admin" | "client"

  useEffect(() => {
    let cancelled = false;
    getAuthUser()
      .then((user) => {
        if (cancelled) return;
        setShell(
          ADMIN_SPACE_PROFILES.includes(user?.profile?.code) ? "admin" : "client",
        );
      })
      .catch(() => {
        if (!cancelled) setShell("client");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!shell) {
    return (
      <div className="d-flex justify-content-center align-items-center py-5">
        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
        Chargement…
      </div>
    );
  }

  return <AdminAccountPage inAdminShell={shell === "admin"} />;
}
