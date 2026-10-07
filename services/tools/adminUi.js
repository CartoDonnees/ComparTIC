/**
 * Espace de gestion (administration, validateurs, opérateurs, « Mon compte »).
 *
 * Ses préférences d'interface (rayon de 8px, `styles/admin-radius.css`) portent
 * aussi sur les dialogues et les menus, que PrimeReact rend directement dans
 * <body>, hors de la page : elles sont donc rattachées à une classe de <body>,
 * posée d'après la route à la fois au rendu serveur (`pages/_document.js`) et à
 * chaque changement de page (`pages/_app.js`).
 */
export const ADMIN_UI_CLASS = "adm-ui";

export const isAdminUiRoute = (pathname) => /^\/(admin-|operator-|offer-workflow(\/|$)|account$)/.test(String(pathname ?? ""));
