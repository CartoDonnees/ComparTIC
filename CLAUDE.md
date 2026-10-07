# CompareTIC  - mémo de travail

Plateforme ARTCI de comparaison d'offres télécom (mobile et fixe) pour la Côte d'Ivoire.
Next.js 15 **Pages Router**, React 19, Prisma + PostgreSQL (`cpticdb`), Bootstrap + PrimeReact.

**Rôles** : admin `PRF0-TEST` · superviseur `PRF1-TEST` · opérateur `PRF2-TEST` · client `PRF3-TEST`.
Les espaces admin **et** opérateur partagent `AdminMainContainerPage`
(`.main-wrapper` / `.main-content-wrapper`). Seed admin : `testa@artci.ci` / `Cedricaz@01`.

## ⚠ Serveur de développement  - ne pas s'en emparer

**L'utilisateur lance son propre `next dev` sur le port 3000.** Ne jamais le tuer ni prendre le port
pour une prévisualisation sans demande explicite : deux `next dev` sur le même projet corrompent `.next`
(pages blanches, `_document.js` ENOENT ; correctif = `rm -rf .next` puis relance). Les styles CSS/JSX
sont rechargés à chaud sur son serveur, donc il voit les changements **sans** prévisualisation.

## Styles

Fichiers dédiés importés dans `pages/_app.js` **après** les globals : `styles/comparator.css`
(scopé `#comparator`) et `styles/admin.css` (scopé `.main-content-wrapper`, `.bg-admin-header`, sidebar).

## Session et déploiement

Le cookie de session `Jt` n'est `Secure` que si la requête arrive en HTTPS (`SESSION_COOKIE_SECURE=auto`,
`services/config/auth/sessionCookie.js`). En HTTP, un cookie `Secure` est refusé par le navigateur : la connexion
« réussit » (jeton en localStorage) mais le middleware, qui ne lit que le cookie, renvoie à l'accueil  - tous profils.
Le middleware autorise par **code** de profil (`CODE_TO_PROFILE`), pas par nom. Reproduire en prod via l'IP réseau
(pas `localhost`, où les cookies Secure passent). Le test d'intégration exige `next dev` (codes de soumission
journalisés seulement hors production). Comptes de test workflow : `*@compartic.test` / `Compartic@Test2026`.

## Import Excel des offres

Tout part de `services/import/offerImportSchema.js` (colonnes, listes, version) ; voir README § 5.
Changer la structure ⇒ incrémenter `TEMPLATE_VERSION`. Offres importées = soumises d'office (SUBMITTED, importateur = soumissionnaire ; code e-mail unique pour un point focal).
Next refuse de servir les fichiers `public/` commençant par un point (400)  - utile pour les tests UI.

## Journal d'activité (`/admin-activity`)

Lecture seule de `AuditLog`, administration uniquement (permission `AUDIT_READ` vérifiée par
`/api/admin/activity` ; middleware + menu en plus). Libellés/domaines : `services/audit/activityCatalog.js`
   toute nouvelle action `writeAudit` doit y être ajoutée. Sessions (LOGIN, LOGIN_FAILED, LOGIN_REFUSED,
LOGOUT, entityType SESSION) tracées par `services/audit/sessionAudit.js`, jamais bloquant.

## Évolutions d'octobre 2026 (détail : README § 5)

Réactivation d'offre (`reactivateOffer`), avis des validateurs, filtres par statut, onglet Monitoring
(versions `sourceOfferId`), frise de suivi, référentiels (`services/referential/`), analyse IA conservée
(`OfferAiAnalysis`), courrier (`services/letters/`), ComparIA + base des offres, Assistant IA ARTCI
(`services/artciAssistant/`). Tout appel au service d'analyse passe par `services/assistant/ragClient.js`.

## Courrier au soumissionnaire et rayon de 8px

Ouvert aux offres validées, refusées et suspendues (`LETTER_STATUSES`) ; le modèle pur est dans
`services/letters/letterTemplate.js` (testable sans base). Brouillon : toujours passer l'`id` ; `saveLetter` rend le brouillon identique existant au lieu d'en créer un second.
Envoi : un échec lève une `WorkflowError` qui porte le brouillon (`details.letter`) ; le courrier n'est « envoyé »
qu'après l'accord du serveur SMTP. Limite connue : une boîte inexistante sur un domaine valide n'est signalée que
plus tard, par un avis de non-remise dans la boîte d'expédition. Test sans rien envoyer : `SMTP_HOST=127.0.0.1`
vers un faux serveur local. Rayon : tout nouvel écran de gestion reste à 8px (`styles/admin-radius.css`, classe
`body.adm-ui` posée d'après la route par `services/tools/adminUi.js`) ; pastilles (999px) et avatars (50 %) exceptés.

## Opérateur : le circuit de validation lui est caché

Règle : un point focal voit l'état et l'évolution de ses offres, jamais le niveau de validation, les décisions par
niveau ni le nom d'un validateur. Le filtrage est côté serveur (`services/workflow/operatorView.js`) : toute nouvelle
route lue par un opérateur doit passer par `guardRoute` (retire `currentValidationLevel`) ou par
`operatorWorkflowState` / `operatorEvent`. Toute notification adressée à un point focal a son texte propre
(`operatorContent` dans `workflowNotifications.js`). « Suivi de mes offres » = `/api/operator/evolution`, points focaux seulement.

## Pièges de test (prévisualisation)

- Le bac à sable de `preview_start` ne lit pas `.env` : passer les variables par un fichier du scratchpad,
  valeurs entre apostrophes (une URL contient `&`). Vérifier la base visée avant tout test d'écriture.
- Volet de navigateur masqué : Next dev attend une image (rAF) pour s'afficher ; une capture débloque. Si la
  capture échoue aussi (volet fermé), retirer `[data-next-hide-fouc]` pour lire la page, et faire les captures avec
  Chrome sans fenêtre (`--headless=new --remote-debugging-port`, piloté par le WebSocket natif de Node).
- `router.replace` démonte la page (chargement global de `_app.js`) : ne pas l'appeler avant un `setState`.
- `.env` : `connection_limit=50` ; deux serveurs de dev saturent PostgreSQL (100 connexions).

