# Workflow de gestion, validation et monitoring des offres   ComparTIC

Document de référence : audit de l'existant, analyse des écarts, conception.
Il précède et encadre l'implémentation.

---

## 1. Audit de l'existant

### Architecture
- Next.js 15 (Pages Router), React 19, JSX. API routes dans `pages/api`.
- Prisma 6 / PostgreSQL (`cpticdb`).
- Mise en page back-office : `pages/admin/AdminMainContainerPage.jsx` (en-tête + barre latérale).

### Authentification et autorisation
| Élément | Constat |
|---|---|
| Connexion | JWT signé (`JWT_SECRET`), déposé en cookie httpOnly `Jt` et en `localStorage['Jt']`. |
| Middleware | Protège quelques pages par **nom** de profil (`ADMINISTRATOR`, `SUPERVISOR`, `OPERATOR`, `CLIENT`). |
| API | **Aucune autorisation réelle.** Les routes vérifient seulement `FKTND_H`, une clé fixe incluse dans le code JavaScript servi au navigateur, donc publique. L'auteur d'une action est lu dans le corps de la requête (`userId`). |
| Axios | L'intercepteur lit `localStorage.getItem(process.env.USER_TOKEN)` : variable absente côté navigateur → **aucun en-tête `Authorization` n'est jamais envoyé.** |
| Profils | 4 : `PRF0-TEST` ADMINISTRATOR, `PRF1-TEST` SUPERVISOR, `PRF2-TEST` OPERATOR (point focal), `PRF3-TEST` CLIENT (site public). Codes utilisés dans ~45 fichiers. |

### Modèles concernés
| Modèle | Constat |
|---|---|
| `Offer` | `status` (`PENDING`/`DONE`), `parentId` (offre de base → offres dérivées/promotionnelles), `specialPromotion` (présence ⇒ promotionnelle). Pas de version, pas de désactivation, pas de niveau de validation. |
| `Validation` | **Une seule** décision par offre (`PENDING`/`ALLOW`/`DINIED`/`SUSPENDED`), commentaires dans `Comment` (sans auteur, sans niveau). |
| `Monitoring` (+ 10 tables `Monitoring*`) | Copie **parallèle** de la structure d'une offre, avec sa propre validation. Un monitoring ne devient jamais une offre, n'apparaît pas au comparateur et ne désactive rien. |
| `Notification` | Une ligne par destinataire (relation `to`), `type`, `title`, `content`, `link`, `read`. Pas d'`offerId`, pas de date de lecture. |
| `History` | Sans rapport (historique de l'assistant). **Aucun journal d'audit.** |
| `FocalPoint` | Rattache un utilisateur à un opérateur (`operatorId`). |

### Logiques métier actuelles
- **Validation** : `pages/api/admin/validation/index.js`   l'administrateur statue en une fois (valider, refuser, suspendre, remettre en attente).
- **Publication** : le comparateur publie les offres dont `validation.status = ALLOW`. Seize écrans et API lisent `validation.status`.
- **Suppression d'offre** : aucune route n'existe ; les boutons « Supprimer plusieurs » des listes ne suppriment rien.
- **Suppression d'opérateur** : `admin/operator/[id].js` appelle `prisma.district`, modèle inexistant (plantage).
- **Monitoring** : routes `admin/offer/monitoring.js` et `saveMonitoring*` (tables parallèles).

---

## 2. Analyse des écarts

| Fonction | Existant | Partiel | Manquant | Modification |
|---|:-:|:-:|:-:|---|
| Identité serveur fiable | | | ✗ | Lecture du JWT (cookie **ou** en-tête Bearer) ; `userId` du corps ignoré ; intercepteur Axios corrigé |
| RBAC 8 profils | | ✓ (4 profils) | 4 profils | Profils `SUPER_ADMIN`, `VALIDATOR_1..4` ; matrice de permissions centrale |
| Contrôle d'accès des API | | | ✗ | Garde d'autorisation sur chaque route d'écriture et de lecture back-office |
| Superviseur lecture seule | | ✓ (menu) | côté API | Refus serveur de toute écriture |
| Admin ≠ créer admin / super admin | | | ✗ | Contrôle dans la gestion des utilisateurs |
| Point focal limité à son opérateur | | ✓ (écrans) | côté API | `actor.operatorId === offer.operatorId` sur chaque action |
| Validation hiérarchique V1→V4 | | ✓ (1 niveau) | niveaux | Moteur de workflow + historique des décisions par niveau |
| V4 final (base) / V3 final (promo) | | | ✗ | Niveau final calculé par le serveur |
| Commentaire obligatoire | | | ✗ | Refus serveur + blocage interface |
| Transmission au niveau supérieur | | | ✗ | Décision intermédiaire non finale, notification du niveau suivant |
| Confirmation de validation définitive | | | ✗ | `confirmFinal` exigé par le serveur + dialogue explicite |
| Modification bloquée après décision | | ✓ (opérateur) | tous acteurs | Règle unique dans le moteur |
| Machine à états cohérente | | ✓ (`PENDING/DONE`) | ✗ | `workflowStatus` + `currentValidationLevel` |
| Monitoring = nouvelle version | | ✓ (tables parallèles) | versionnage | Nouvelle `Offer` liée à la source, ancienne désactivée |
| Désactivation au lieu de suppression | | | ✗ | Désactivation tracée ; suppression seulement sans aucune décision |
| Journal d'audit | | | ✗ | Modèle `AuditLog` immuable, écrit dans la même transaction |
| Notifications liées à l'offre | ✓ | ✓ | `offerId`, `readAt` | Champs ajoutés ; événements du workflow centralisés |
| Notification e-mail des décisions | | ✓ (mailer) | ✗ | E-mail au point focal pour décision finale et refus |
| Seed de test des 8 profils | | ✓ (4 profils) | ✗ | Comptes et offres dans chaque état |

---

## 3. Conception

### 3.1 Profils et rôles

Les codes existants sont **conservés** (utilisés partout) ; les nouveaux rôles sont ajoutés.

| Rôle (moteur) | Code profil | Nom (middleware) |
|---|---|---|
| `SUPER_ADMIN` | `PRF-SUPERADMIN` | `SUPER_ADMIN` |
| `ADMIN` | `PRF0-TEST` | `ADMINISTRATOR` |
| `SUPERVISOR` | `PRF1-TEST` | `SUPERVISOR` |
| `VALIDATOR_1` | `PRF-VAL1` | `VALIDATOR_1` |
| `VALIDATOR_2` | `PRF-VAL2` | `VALIDATOR_2` |
| `VALIDATOR_3` | `PRF-VAL3` | `VALIDATOR_3` |
| `VALIDATOR_4` | `PRF-VAL4` | `VALIDATOR_4` |
| `FOCAL_POINT` | `PRF2-TEST` | `OPERATOR` |
| `CLIENT` (site public, hors workflow) | `PRF3-TEST` | `CLIENT` |

### 3.2 Matrice RBAC

`✓` autorisé · `○` limité à son opérateur · `–` refusé

| Permission | SA | ADMIN | SUP | V1–V4 | PF |
|---|:-:|:-:|:-:|:-:|:-:|
| Consulter offres, opérateurs, validations, historique | ✓ | ✓ | ✓ | ✓ | ○ |
| Statistiques | ✓ | ✓ | ✓ | ✓ | ○ |
| Exporter / imprimer | ✓ | ✓ | ✓ | ✓ | ○ |
| Créer une offre | ✓ | ✓ | – | ✓ | ○ |
| Modifier une offre (sans décision) | ✓ | ✓ | – | ✓ | ○ |
| Soumettre | ✓ | ✓ | – | ✓ | ○ |
| Valider / refuser | ✓ ¹ | ✓ ¹ | – | ✓ ² | – |
| Monitoring | ✓ | ✓ | – | ✓ | ○ |
| Désactiver | ✓ | ✓ | – | – | – |
| Supprimer (sans aucune décision) | ✓ | ✓ | – | – | – |
| Gérer opérateurs et référentiels | ✓ | ✓ | – | – | – |
| Gérer utilisateurs | ✓ | ✓ ³ | – | – | – |
| Gérer les notifications | ✓ | ✓ | – | – | – |

¹ Au niveau **courant** du workflow uniquement : aucun niveau ne peut être sauté.
² Validateur *n* : uniquement lorsque l'offre attend le niveau *n*.
³ Sauf créer, promouvoir ou modifier un `ADMIN` ou un `SUPER_ADMIN`.

### 3.3 Machine à états

États stockés (`Offer.workflowStatus`) :

| État | Signification | Niveau courant |
|---|---|---|
| `DRAFT` | Brouillon, non soumis |   |
| `SUBMITTED` | Soumise, en attente du premier niveau, aucune décision | 1 |
| `IN_VALIDATION` | Au moins une validation intermédiaire, en attente du niveau supérieur | 2…4 |
| `VALIDATED` | Validée définitivement et publiée |   |
| `REFUSED` | Refusée |   |
| `DEACTIVATED` | Désactivée (manuellement ou par monitoring) |   |

Choix pour éviter les états redondants :
- **« EN_ATTENTE_VALIDATION_SUPÉRIEURE »** = `IN_VALIDATION` + `currentValidationLevel`.
- **« VALIDÉE » et « ACTIVE »** sont un seul état stocké (`VALIDATED`) : l'application publie une offre dès sa validation, il n'existe aucune étape de publication distincte.
- **« EN_ANALYSE »** n'est pas stocké : aucune action métier ne le déclenche ; la prise en compte est tracée dans le journal.

Transitions autorisées :

```
DRAFT ──soumettre──▶ SUBMITTED (niveau 1)
SUBMITTED | IN_VALIDATION(n) ──valider + transmettre (n < final)──▶ IN_VALIDATION (n+1)
SUBMITTED | IN_VALIDATION(n) ──valider + confirmer (n = final)──▶ VALIDATED
SUBMITTED | IN_VALIDATION(n) ──refuser──▶ REFUSED
SUBMITTED | IN_VALIDATION | VALIDATED | REFUSED ──désactiver──▶ DEACTIVATED
VALIDATED ──monitoring──▶ DEACTIVATED (motif MONITORING) + nouvelle offre SUBMITTED
DRAFT | SUBMITTED sans décision ──supprimer──▶ (supprimée)
```

Niveau final : **4** pour une offre de base, **3** pour une offre promotionnelle (présence de `specialPromotion`).

### 3.4 Compatibilité

`Offer.workflowStatus` est la **source de vérité**. Le moteur tient à jour, dans la même transaction, les projections lues par l'existant :

| workflowStatus | `validation.status` | `offer.status` |
|---|---|---|
| `DRAFT` | (aucune validation) | `PENDING` |
| `SUBMITTED`, `IN_VALIDATION` | `PENDING` | `PENDING` |
| `VALIDATED` | `ALLOW` | `DONE` |
| `REFUSED` | `DINIED` | `DONE` |
| `DEACTIVATED` | `SUSPENDED` | `DONE` |

Le comparateur, les statistiques, le calendrier et le suivi continuent de fonctionner sans modification, et seul le moteur écrit ces champs.

### 3.5 Modèles ajoutés ou modifiés

- `Offer` : `workflowStatus`, `currentValidationLevel`, `submittedAt`, `validatedAt`, `refusedAt`, `deactivatedAt`, `deactivationReason`, `deactivatedById`, `version`, `sourceOfferId` (relation « versions »).
- `ValidationDecision` (nouveau) : offre, niveau, décision, transmise, finale, commentaire obligatoire, auteur, rôle, date.
- `AuditLog` (nouveau, immuable) : action, entité, offre, auteur, rôle, ancien et nouveau statut, niveau, commentaire, métadonnées, date.
- `Notification` : `offerId`, `readAt`.
- `Profile` : nouveaux profils insérés par la migration.

### 3.6 Notifications

| Événement | Destinataires | E-mail |
|---|---|---|
| Soumission | Validateurs V1, administrateurs, super admins, autres points focaux de l'opérateur | – |
| Transmission n → n+1 | Validateurs du niveau n+1 | – |
| Validation définitive | Points focaux de l'opérateur, validateurs ayant statué, admins, super admins | Points focaux |
| Refus | Points focaux de l'opérateur, validateurs ayant statué, admins, super admins | Points focaux |
| Monitoring | Validateurs V1, admins, super admins, points focaux de l'opérateur | – |
| Désactivation | Points focaux de l'opérateur, admins, super admins | – |

Toutes les notifications sont émises par un seul module (`services/workflow/workflowNotifications.js`), **après** le succès de la transaction.

### 3.7 Audit

Chaque transition écrit une ligne `AuditLog` dans la même transaction que le changement d'état : `CREATE`, `UPDATE`, `SUBMIT`, `VALIDATE_TRANSMIT`, `VALIDATE_FINAL`, `REFUSE`, `MONITORING`, `VERSION_CREATED`, `DEACTIVATE`, `DELETE`, `NOTIFY`. Aucune route ne permet de modifier ni de supprimer une ligne d'audit.

---

## 4. Implémentation

### 4.1 Services métier

| Fichier | Rôle |
|---|---|
| `services/rbac/roles.js` | Rôles, correspondance profil ↔ rôle, niveaux de validateur, libellés |
| `services/rbac/permissions.js` | Matrice des permissions, `can`, `canAssignRole` |
| `services/rbac/guardRoute.js` | Enveloppe d'autorisation des routes existantes (permission par méthode, périmètre opérateur) |
| `services/config/auth/session.js` | Identité serveur (cookie `Jt` ou `Authorization: Bearer`), `requireActor` |
| `services/workflow/offerWorkflow.js` | Moteur : actions possibles, transitions, projections, versions |
| `services/workflow/offerGuards.js` | `requireEditableOffer` / `requireReadableOffer` pour les sous-routes |
| `services/workflow/offerCreation.js` | Contexte de création (auteur et opérateur issus de la session) |
| `services/workflow/workflowNotifications.js` | Diffusion des notifications et e-mails après transaction |
| `services/workflow/audit.js` | Écriture seule du journal d'audit |
| `services/workflow/legacyRoute.js` | Réponse 410 des routes historiques retirées |

### 4.2 API

| Route | Méthode | Permission / règle |
|---|---|---|
| `/api/workflow/offers/:id` | GET | Lecture (point focal : son opérateur)   état, niveaux, décisions, historique, versions, actions |
| `/api/workflow/offers/:id` | DELETE | Suppression sans décision, sans version ni dépendance |
| `/api/workflow/offers/:id/submit` | POST | Brouillon → soumise ; point focal : jeton du code e-mail |
| `/api/workflow/offers/:id/decide` | POST | Validateur du niveau attendu ou administration ; commentaire obligatoire ; `confirmFinal` au dernier niveau |
| `/api/workflow/offers/:id/deactivate` | POST | Administration ; motif obligatoire |
| `/api/workflow/offers/:id/monitor` | POST | Auteurs ; offre validée → nouvelle version soumise, ancienne désactivée |
| `/api/workflow/actions` | POST | Actions possibles pour une liste d'offres |
| `/api/workflow/queue` | GET | File de validation de l'utilisateur |

Routes existantes sécurisées : création (`admin/offer`, `saveOfferWithParent`), modification (`updateOffer`) et contenu (`saveArea`, `saveFormula`, `saveAccessMode`, `saveAdvantage`, `clearOfferDetails`) via le moteur ; lectures d'offres et statistiques (session + périmètre opérateur) ; utilisateurs (`USER_MANAGE`, `canAssignRole`, audit) ; opérateurs et référentiels (écriture réservée à l'administration) ; `client/user/:id` (titulaire du compte uniquement) ; `admin/mail/test`.

Routes retirées (410) : `admin/validation`, `admin/offer/monitoring`, `saveMonitoringOfferWithParent`, `saveMonitoringArea|Formula|AccessMode`, `admin/accessMode`, `operators` (POST) et `operators/:id` (PUT, DELETE).

### 4.3 Interface

- `/offer-workflow/:id` : fiche (frise V1 → V4 ou V1 → V3, décisions, historique, versions, actions contextuelles).
- Validation (`/admin-validation`) : file filtrée par niveau, « Examiner et décider » seulement pour le niveau attendu, dialogue de décision (commentaire obligatoire, texte de confirmation finale).
- Listes admin et opérateur : statut de workflow et actions calculées par le serveur (Workflow, Modifier, Soumettre, Valider, Refuser, Monitoring, Désactiver, Supprimer).
- Création : « Enregistrer comme brouillon » (admin et point focal).
- Menus par rôle, gestion des utilisateurs limitée aux profils attribuables.

### 4.4 Données de test

`prisma/seeders/workflowSeeder.js` (idempotent, non destructif, appelé aussi par `prisma/seed.js`) :

```bash
node --env-file=.env prisma/seeders/workflowSeeder.js
```

Mot de passe commun : `Compartic@Test2026`. Adresses en `.test` (non délivrables).

| Code | Rôle | E-mail |
|---|---|---|
| SUPER_ADMIN_TEST | Super administrateur | super.admin@compartic.test |
| ADMIN_TEST | Administrateur | admin@compartic.test |
| SUPERVISEUR_TEST | Superviseur | superviseur@compartic.test |
| VALIDATEUR_1_TEST … VALIDATEUR_4_TEST | Validateurs 1 à 4 | validateur1@ … validateur4@compartic.test |
| POINT_FOCAL_ORANGE_TEST | Point focal Orange | pf.orange@compartic.test |
| POINT_FOCAL_MTN_TEST | Point focal MTN | pf.mtn@compartic.test |
| POINT_FOCAL_MOOV_TEST | Point focal Moov | pf.moov@compartic.test |

Offres `OF-WFTEST-*` : brouillon, soumises (base et promotion), en validation (V2, V4, promotion V3), validées (base et promotion), refusée, désactivée, monitoring (V1 désactivée + V2 soumise).

### 4.5 Tests

```bash
NEXT_DIST_DIR=.next-wftest MAIL_DRY_RUN=true npx next dev -p 3105 > /tmp/wf.log 2>&1 &
WF_BASE=http://localhost:3105 WF_SERVER_LOG=/tmp/wf.log node --env-file=.env scripts/test-workflow.mjs
```

Les 14 scénarios d'acceptation et des contrôles transverses (125 contrôles) passent ; le script supprime ses données et restaure le jeu de test. `MAIL_DRY_RUN=true` n'envoie aucun e-mail et écrit le texte (dont le code de soumission) dans la console du serveur, hors production.

### 4.6 Publication sur le comparateur

Règle unique : `services/workflow/publication.js`, utilisée par `/api/client/offer/getClientFormulas`, la fiche de workflow et les listes.

Une offre est affichée sur `/comparator` si elle est la dernière version **validée définitivement** de sa lignée :

- `workflowStatus = VALIDATED` ;
- ou version désactivée par un **monitoring** tant qu'aucune version suivante n'a été validée définitivement (l'offre ne disparaît pas pendant que la nouvelle version parcourt le circuit, ni si celle-ci est refusée ou abandonnée).

Brouillons, offres soumises, en validation, refusées et désactivées manuellement ne sont jamais affichées. L'administration peut retirer du comparateur une version remplacée encore affichée (action « Désactiver », motif obligatoire, tracée).

### 4.7 Validation sans transmission (offres promotionnelles)

| Type d'offre | Niveaux 1 à n-1 | Dernier niveau |
|---|---|---|
| Offre de base (V1 → V4) | **Transmettre** uniquement | V4 : valider définitivement ou refuser |
| Promotion (V1 → V3) | **Transmettre** au niveau supérieur **ou valider définitivement sans transmettre** | V3 : valider définitivement ou refuser |

- *Transmettre* : la validation du niveau est enregistrée, l'offre reste EN VALIDATION et attend la réponse du N+1 (statut, comparateur et notifications finales inchangés ; seul le N+1 est notifié).
- *Valider définitivement sans transmettre* : confirmation explicite obligatoire, puis l'offre devient VALIDÉE, est publiée sur le comparateur et les notifications de validation finale partent. Les niveaux supérieurs apparaissent « Non requis » dans la frise ; l'audit porte `withoutTransmission` et les niveaux non sollicités.
- Le N+1 dispose des mêmes choix (transmettre ou valider définitivement), jusqu'à V3 qui ne peut plus transmettre.

API : `POST /api/workflow/offers/:id/decide` avec `validation: "TRANSMIT" | "FINAL"` (sans précision : transmission tant qu'un niveau supérieur existe). Refus serveur : `TRANSMISSION_REQUIRED` (validation définitive d'une offre de base avant V4), `FINAL_LEVEL` (transmission au-delà du dernier niveau), `CONFIRMATION_REQUIRED`.

### 4.8 Réactivation d'une offre désactivée

`POST /api/workflow/offers/:id/reactivate { comment? }`    permission `offer.reactivate`
(super administrateur, administrateur).

- L'offre retrouve l'état qu'elle avait **avant** sa désactivation (lu dans le journal
  d'audit) : validée (elle revient au comparateur), refusée, ou en cours de validation au
  niveau qui suit la dernière validation enregistrée.
- Interdite si une version plus récente (issue d'un monitoring) est encore vivante : deux
  versions d'une même offre ne coexistent jamais (`NEWER_VERSION`).
- Rien n'est effacé : la désactivation reste au journal, la réactivation y ajoute sa ligne
  (`REACTIVATE` : auteur, date, motif facultatif, motif de la désactivation d'origine).
- Notification `OFFER_REACTIVATED` : points focaux de l'opérateur, administration, et les
  validateurs du niveau attendu si le circuit reprend.

