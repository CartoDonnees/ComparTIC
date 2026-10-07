import React from "react";
import ProfilePage from "@/componnents/screens/admin/profile/ProfilePage";

/**
 * « Mon compte » de l'espace de gestion (administration, validateurs,
 * superviseur) : identité, coordonnées, photo et mot de passe.
 *
 * La page est celle du profil, commune avec l'espace opérateur
 * (`ProfilePage`) : elle s'affiche dans l'en-tête et la barre latérale de
 * l'administration et s'adapte au compte connecté.
 *
 * @param inAdminShell  vrai pour un compte de l'espace de gestion. Les clients
 *   du site public n'ont pas de page de compte ici (comportement inchangé).
 */
export default function AdminAccountPage({ inAdminShell = false }) {
  if (!inAdminShell) return null;
  return <ProfilePage variant="auto" />;
}
