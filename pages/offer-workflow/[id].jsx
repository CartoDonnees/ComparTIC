"use client";

import React from "react";
import { useRouter } from "next/router";
import AdminMainContainerPage from "@/componnents/screens/admin/AdminMainContainerPage";
import OfferWorkflowView from "@/componnents/workflow/OfferWorkflowView";

/**
 * Fiche de workflow d'une offre : /offer-workflow/:id
 *
 * Accessible à tout le back-office (middleware) ; l'API vérifie la permission
 * de lecture et limite le point focal aux offres de son opérateur.
 */
export default function OfferWorkflowPage() {
  const router = useRouter();
  const id = Number(router.query?.id);

  return (
    <AdminMainContainerPage
      active="d-off"
      children={
        <div className="container-fluid">
          {router.isReady && Number.isInteger(id) ? (
            <OfferWorkflowView offerId={id} />
          ) : null}
        </div>
      }
    />
  );
}
