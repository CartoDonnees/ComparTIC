"use client";

import React from "react";
import AdminMainContainerPage from "@/componnents/screens/admin/AdminMainContainerPage";
import AdminNotificationsPage from "@/componnents/screens/admin/admin/notifications/AdminNotificationsPage";

/**
 * Gestion des notifications   administrateur uniquement.
 *
 * Trois verrous, du plus visible au seul qui compte vraiment :
 *  - l'entrée du menu n'est proposée qu'à l'administrateur ;
 *  - le middleware redirige tout autre profil ;
 *  - la route d'API refuse tout appel qui ne vient pas d'une session
 *    administrateur (c'est elle qui protège effectivement les données).
 */
export default function AdminNotifications() {
  return (
    <AdminMainContainerPage
      active="notifs"
      children={
        <div className="container-fluid pt-3">
          <AdminNotificationsPage />
        </div>
      }
    />
  );
}
