import { Html, Head, Main, NextScript } from "next/document";
import { ADMIN_UI_CLASS, isAdminUiRoute } from "@/services/tools/adminUi";

/**
 * Document HTML de base.
 *
 * Les bibliothèques du gabarit (Bootstrap, jQuery, Font Awesome,
 * encrypt-storage) étaient chargées par des balises `<script>` SYNCHRONES dans
 * le `<head>` : le navigateur bloquait l'affichage le temps de les
 * télécharger, sur chaque page, y compris l'espace de gestion qui ne s'en
 * sert pas. Elles sont désormais chargées en fin de document (`defer`), ce
 * qui ne change rien à leur disponibilité au moment où l'utilisateur agit,
 * mais laisse la page s'afficher d'abord.
 *
 * La feuille du gabarit reste dans le `<head>` (sans quoi la page
 * s'afficherait sans style), avec préconnexion aux domaines externes.
 */
export default function Document(props) {
  // Espace de gestion : la classe est posée dès le rendu serveur, pour que le
  // premier affichage ait déjà ses rayons de 8px.
  const adminUi = isAdminUiRoute(props?.__NEXT_DATA__?.page) ? ` ${ADMIN_UI_CLASS}` : "";
  return (
    <Html lang="fr">
      <Head>
        <link rel="icon" href="/images/logo/logo.png" />

        {/* Ouverture anticipée des connexions aux CDN utilisés ci-dessous. */}
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://kit.fontawesome.com" crossOrigin="anonymous" />

        <link rel="stylesheet" id="style-css" href="/assets/style.min.css" type="text/css" media="all" />
        <link
          href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css"
          rel="stylesheet"
          integrity="sha384-QWTKZyjpPEjISv5WaRU9OFeRpok6YctnYmDr5pNlyT2bRjXh0JMhjY6hW+ALEwIH"
          crossOrigin="anonymous"
        />
      </Head>
      <body
        className={`home page-template page-template-templates page-template-home page-template-templateshome-php page page-id-17 no-amp bdy-container${adminUi}`}
        style={{ padding: 0 }}
      >
        <Main />
        <NextScript />

        {/* Scripts du gabarit : différés, donc non bloquants pour l'affichage. */}
        <script src="/assets/jquery.min.js" id="jquery-core-js" defer></script>
        <script
          src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"
          integrity="sha384-YvpcrYf0tY3lHB60NNkmXc5s9fDVZLESaAA55NDzOxhy9GkcIdslK1eN7N6jIeHz"
          crossOrigin="anonymous"
          defer
        ></script>
        <script src="https://kit.fontawesome.com/9ca3b27b3d.js" crossOrigin="anonymous" defer></script>
      </body>
    </Html>
  );
}
