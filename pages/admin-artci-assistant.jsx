"use client";

import React from "react";
import AdminMainContainerPage from "@/componnents/screens/admin/AdminMainContainerPage";
import ArtciAssistantPage from "@/componnents/screens/admin/admin/artciAssistant/ArtciAssistantPage";

/**
 * Assistant IA ARTCI    assistant réglementaire fondé sur la base documentaire.
 * Distinct de ComparIA (/admin-assistant). Accès : agents de l'ARTCI (menu,
 * middleware et routes d'API `/api/artci-assistant/*`).
 */
export default function AdminArtciAssistant() {
  return (
    <AdminMainContainerPage
      active="artci-ai"
      children={
        <div className="container-fluid pt-3">
          <ArtciAssistantPage />
        </div>
      }
    />
  );
}
