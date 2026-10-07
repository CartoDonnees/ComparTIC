"use client";
import AdminFooter from "@/componnents/layouts/footer/AdminFooter";
import styles from "@/styles/DashboardStyle.module.css";
import AdminHeader from "@/componnents/layouts/header/AdminHeader";
import AdminSideBar from "@/componnents/layouts/sidebar/AdminSideBar";
import React, { useState } from "react";
import { ToastContainer } from "react-toastify";
import ForcePasswordChangeGate from "@/componnents/auth/ForcePasswordChangeGate";
import OfferLetterHost from "@/componnents/letters/OfferLetterHost";

export default function AdminMainContainerPage({ children, active }) {

  return (
    <div>
      {/* Changement de mot de passe obligatoire à la première connexion d'un
          opérateur. Monté ici   conteneur commun à toutes les pages de
          l'espace authentifié   pour qu'aucun écran ne soit accessible avant.
          Ne s'affiche que si l'obligation s'applique. */}
      <ForcePasswordChangeGate />
      <AdminHeader />
      <div className="main-wrapper">
        <AdminSideBar active={active}  />
        <main className="main-content-wrapper px-3   ">
          {children}
          <AdminFooter />
        </main>
      </div>
      <ToastContainer />
      {/* Courrier au soumissionnaire : proposition et éditeur, ouverts depuis n'importe quel écran. */}
      <OfferLetterHost />
    </div>
  );
}
