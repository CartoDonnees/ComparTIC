import "@/styles/globals.css";
import "@/styles/styles.scss";
// Styles dédiés au comparateur (chargés après globals pour pouvoir surcharger)
import "@/styles/comparator.css";
// Styles dédiés à l'espace admin / opérateur (modernisation)
import "@/styles/admin.css";
// Styles des listes et tableaux (DataTable) admin / opérateur
import "@/styles/admin-tables.css";
// Styles dédiés aux modales "Détails de l'offre" (admin + opérateur)
import "@/styles/offer-view.css";
// Styles dédiés à la vue "Résumé de l'offre" (étape 5)
import "@/styles/offer-recap.css";
// Styles dédiés au processus de validation des offres
import "@/styles/offer-validation.css";
// Styles de l'écran de changement de mot de passe obligatoire
import "@/styles/force-password.css";
// Connexion à l espace de gestion (/admin-auth)
import "@/styles/admin-auth.css";
// Styles de l espace « Mon profil » (opérateur)
import "@/styles/profile.css";
// Styles de l en-tête admin / opérateur
import "@/styles/admin-header.css";
// Styles de la barre latérale admin / opérateur
import "@/styles/admin-sidebar.css";
// Styles de la page de confirmation d e-mail
import "@/styles/confirm-email.css";
// Styles de la modale de validation par code avant soumission d une offre
import "@/styles/submission-code.css";
// Styles de l onglet « Suivi » du tableau de bord admin
import "@/styles/admin-tracking.css";
// Styles de l onglet « Generalites » du tableau de bord admin
import "@/styles/admin-stats.css";
// Styles de la gestion des notifications (administrateur)
import "@/styles/admin-notifications.css";
// Styles du workflow de validation des offres (fiche, file, dialogues)
import "@/styles/workflow.css";
// Panneau de statistiques des pages de gestion (utilisateurs, opérateurs, organisations)
import "@/styles/entity-stats.css";
// Panneau de filtres des listes d'offres (gestion, validation, mes offres)
import "@/styles/offer-filters.css";
// Indicateur de chargement des modules (listes, tableaux de bord)
import "@/styles/data-loader.css";

import "@/styles/assistant.css";
import "@/styles/validation-queue.css";
import "@/styles/observatory.css";
import "@/styles/page-loader.css";
// Import d'offres par fichier Excel (admin + opérateur)
import "@/styles/offer-import.css";
// Journal d'activité de la plateforme (administration)
import "@/styles/admin-activity.css";
// Gestion des référentiels (pays, organisations, zones)
import "@/styles/referential.css";
// Courrier au soumissionnaire (éditeur, aperçu)
import "@/styles/offer-letter.css";
// Assistant IA ARTCI (conversation, sources, base documentaire)
import "@/styles/artci-assistant.css";
// Suivi de mes offres (opérateur) : évolution d'une offre
import "@/styles/offer-evolution.css";
import { PrimeReactProvider } from "primereact/api";
import "primereact/resources/themes/lara-light-cyan/theme.css";
import "primeicons/primeicons.css";
// Rayon unique (8px) de l'espace de gestion : après le thème PrimeReact, qu'il ajuste.
import "@/styles/admin-radius.css";
import { ToastContainer } from "react-toastify";
import { useEffect, useLayoutEffect, useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import { getAuthUser } from "@/services/api/auth/authApiService";
import { ClientProvider } from "@/services/providers/ClientProvider";
import { AdminProvider } from "@/services/providers/AdminProvider";
import { OperatorProvider } from "@/services/providers/OperatorProvider";
import { SupervisorProvider } from "@/services/providers/SupervisorProvider";
// Attente de chargement d'une page, aux couleurs de la plateforme.
// (MainLoader reste disponible pour les autres écrans.)
import PageLoader from "@/componnents/Loader/PageLoader";
import ErrorBoundary from "@/componnents/ErrorBoundary";
import { ADMIN_UI_CLASS, isAdminUiRoute } from "@/services/tools/adminUi";

/** Titres des pages (onglet du navigateur, partages, référencement). */
const PAGE_TITLES = {
  "/": "CompareTIC  - Comparateur des offres télécoms · ARTCI",
  "/comparator": "Comparateur des offres  - CompareTIC",
  "/observatoire": "Observatoire des tarifs télécoms  - CompareTIC",
  "/faq": "Questions fréquentes  - CompareTIC",
  "/about": "À propos  - CompareTIC",
  "/contact": "Nous contacter  - CompareTIC",
  "/subscribe": "Créer un compte  - CompareTIC",
  "/admin-auth": "Connexion à l'espace de gestion  - CompareTIC",
  "/admin-dashboard": "Tableau de bord  - CompareTIC",
  "/admin-validation": "Validation des offres  - CompareTIC",
  "/admin-statistics": "Statistiques  - CompareTIC",
  "/admin-list-offer": "Gestion des offres  - CompareTIC",
  "/admin-assistant": "Assistant ComparIA  - CompareTIC",
  "/admin-artci-assistant": "Assistant IA ARTCI  - CompareTIC",
  "/admin-activity": "Journal d'activité  - CompareTIC",
  "/admin-user": "Utilisateurs  - CompareTIC",
  "/admin-operator": "Opérateurs  - CompareTIC",
  "/operator-dashboard": "Tableau de bord opérateur  - CompareTIC",
  "/operator-list-offer": "Mes offres  - CompareTIC",
  "/operator-activity": "Suivi de mes offres  - CompareTIC",
  "/operator-create-offer": "Déclarer une offre  - CompareTIC",
  "/account": "Mon compte  - CompareTIC",
};

export default function App({ Component, pageProps }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const [activeProvider, setactiveProvider] = useState(0);

  // Espace de gestion : classe de <body> tenue à jour à chaque changement de page.
  useLayoutEffect(() => {
    document.body.classList.toggle(ADMIN_UI_CLASS, isAdminUiRoute(router.pathname));
  }, [router.pathname]);

  useEffect(() => {
    let active = 0;

    const init = async () => {
      const _usr = await getAuthUser();
      if (_usr) {
        if (_usr?.profile?.code == "PRF0-TEST") {
          //ADMIN
          active = 1;
        } else if (_usr?.profile?.code == "PRF3-TEST") {
          //SUPERVISOR
          active = 2;
        } else if (_usr?.profile?.code == "PRF2-TEST") {
          //OPERATOR
          active = 3;
        } else if (_usr?.profile?.code == "PRF3-TEST") {
          //CLIENT
          active = 4;
        }
      }
    };

    if (router.pathname === "/") {
      setactiveProvider(0);
    } else {
      init();
    }
    setactiveProvider(active);
  }, [router.pathname]);

  useEffect(() => {
    const handleStart = (url) => {
      if (url !== router.asPath) {
        setLoading(true);
      }
    };
    const handleComplete = () => {
      setLoading(false);
    };

    router.events.on("routeChangeStart", handleStart);
    router.events.on("routeChangeComplete", handleComplete);
    router.events.on("routeChangeError", handleComplete);

    return () => {
      router.events.off("routeChangeStart", handleStart);
      router.events.off("routeChangeComplete", handleComplete);
      router.events.off("routeChangeError", handleComplete);
    };
  }, [router]);

  // Titre et description par défaut : aucune page n'en avait, l'onglet du
  // navigateur restait vide et le site n'était pas correctement référencé.
  // Une page peut toujours poser son propre <Head>, qui a la priorité.
  const pageTitle = PAGE_TITLES[router.pathname] || "CompareTIC  - ARTCI";

  return (
    <div>
      <Head>
        <title>{pageTitle}</title>
        <meta
          name="description"
          content="CompareTIC : comparez les offres de communications électroniques en Côte d'Ivoire et suivez l'évolution des tarifs. Service de l'ARTCI."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#03832e" />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="CompareTIC  - ARTCI" />
      </Head>
      {loading ? (
        <PageLoader title="Chargement de la page…" hint="La page demandée arrive, merci de patienter." />
      ) : (
        <PrimeReactProvider>
          <ClientProvider>
            <AdminProvider>
              <OperatorProvider>
                <SupervisorProvider>
                  {/* Error Boundary : empêche la page blanche en cas d'erreur
                      de rendu ; routeKey réinitialise l'état à chaque page. */}
                  <ErrorBoundary routeKey={router.asPath}>
                    <Component {...pageProps} />
                  </ErrorBoundary>
                </SupervisorProvider>
              </OperatorProvider>
            </AdminProvider>
          </ClientProvider>
          <ToastContainer />
        </PrimeReactProvider>
      )}
    </div>
  );
}
