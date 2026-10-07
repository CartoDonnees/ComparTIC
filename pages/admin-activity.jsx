"use client";

import React from "react";
import AdminMainContainerPage from "@/componnents/screens/admin/AdminMainContainerPage";
import AdminActivityPage from "@/componnents/screens/admin/admin/activity/AdminActivityPage";

/**
 * Journal d'activité de la plateforme    administration uniquement.
 *
 * Menu (permission AUDIT_READ), middleware (profils d'administration) et
 * route d'API (`/api/admin/activity`, seule protection effective des données).
 */
export default function AdminActivity() {
  return (
    <AdminMainContainerPage
      active="activity"
      children={
        <div className="container-fluid pt-3">
          <AdminActivityPage />
        </div>
      }
    />
  );
}
