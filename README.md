# CompareTIC  - ARTCI

Plateforme de déclaration, de validation et de comparaison des offres de
télécommunications en Côte d'Ivoire.

- **Opérateurs** : déclaration des offres et suivi de leur avancement.
- **ARTCI** : circuit de validation à quatre niveaux, journal d'audit,
  statistiques, alertes de délai réglementaire.
- **Public** : comparateur d'offres et observatoire des tarifs.

Technologies : Next.js 15 (pages router), React 19, PrimeReact, Prisma,
PostgreSQL.

---

## 1. Démarrage

```bash
npm install
cp .env.example .env        # puis renseigner les valeurs (voir § 2)
npx prisma migrate deploy   # crée le schéma
npm run seed                # jeu de données de démonstration + comptes de test
npm run dev                 # http://localhost:3001
```

`npm run seed` **vide entièrement la base** avant de la recharger : à ne jamais
lancer sur une base de production.

`npm run seed:zones` ajoute, **sans rien effacer**, des offres internationales et de
roaming de démonstration (filtres « International » et « Roaming » du comparateur).
Il se relance sans risque : une offre déjà présente n'est pas recréée.

### Comptes de test (mot de passe `Compartic@Test2026`)

| Rôle | Adresse |
|---|---|
| Super administrateur | super.admin@compartic.test |
| Administrateur | admin@compartic.test |
| Superviseur | superviseur@compartic.test |
| Validateurs 1 à 4 | validateur1@…, validateur2@…, validateur3@…, validateur4@compartic.test |
| Points focaux | pf.orange@…, pf.mtn@…, pf.moov@compartic.test |

Les offres `OF-WFTEST-*` couvrent chaque état du circuit ; les autres offres du
jeu de données sont publiées (reprise de l'existant) et alimentent le
comparateur. Pour les créer « en attente de validation » :
`SEED_DEMO_PENDING=1 npm run seed`.

---

## 2. Variables d'environnement

Voir [.env.example](.env.example). Les indispensables :

| Variable | Rôle |
|---|---|
| `DATABASE_URL` | connexion PostgreSQL |
| `JWT_SECRET` | signature des jetons de session |
| `NEXT_PUBLIC_BASE_URL` | adresse publique, utilisée dans les liens des e-mails |
| `GMAIL_EMAIL` / `GMAIL_PASSWORD` | envoi des e-mails (mot de passe d'application) |
| `MAIL_DRY_RUN` | `true` : aucun e-mail réel n'est envoyé (développement, tests) |
| `ASSISTANT_API_URL` | service d'analyse réglementaire (assistant ComparIA) |
| `ALLOWED_ORIGIN` | origine externe autorisée à appeler l'API (vide = même origine seulement) |
| `CRON_SECRET` | jeton de la tâche d'alertes de délai |
| `SESSION_COOKIE_SECURE` | `auto` (défaut) : cookie de session `Secure` seulement en HTTPS ; `true` / `false` pour forcer |

---

## 3. Tâche planifiée : alertes de délai réglementaire

Les offres encore en circuit dont le lancement approche (moins de 48 h) ou est
dépassé déclenchent une notification et un e-mail au validateur concerné ainsi
qu'à l'administration. Une offre n'est alertée qu'une fois par 24 h.

```bash
# Depuis le serveur, avec l'application démarrée
node --env-file=.env scripts/run-deadline-alerts.mjs            # envoi réel
node --env-file=.env scripts/run-deadline-alerts.mjs --dry-run  # simulation

# Planification quotidienne (cron)
0 7 * * * cd /chemin/CompareTIC && node --env-file=.env scripts/run-deadline-alerts.mjs >> logs/deadlines.log 2>&1
```

Appel direct de l'API : `POST /api/cron/deadline-alerts` avec l'en-tête
`x-cron-secret`. Un administrateur connecté peut aussi la déclencher.

Les préavis exigés (décision 2024-1098) sont définis dans
[services/workflow/deadlines.js](services/workflow/deadlines.js) : 30 jours pour
une offre de base, 1 jour (flash), 3 jours (périodique), 7 jours (spéciale et
personnalisée).

---

## 4. Tests

```bash
npm test                    # 42 tests unitaires : délais, publication, filtres,
                            # statistiques, Markdown, nettoyage HTML, permissions
npm run test:workflow       # 165 contrôles d'intégration du circuit de validation
```

La suite d'intégration exige **une base de test dédiée** et un serveur démarré :
elle réinitialise les offres `OF-WFTEST-*`.

```bash
# Terminal 1  - serveur isolé sur une base de test
DATABASE_URL="postgresql://…/cptic_test" NEXT_DIST_DIR=.next-test MAIL_DRY_RUN=true \
  npx next dev -p 3105

# Terminal 2
DATABASE_URL="postgresql://…/cptic_test" WF_BASE=http://localhost:3105 \
  node --env-file=.env scripts/test-workflow.mjs
```

L'intégration continue ([.github/workflows/ci.yml](.github/workflows/ci.yml))
lance l'installation, la génération Prisma, les tests unitaires et la
compilation de production à chaque poussée.

---

## 5. Organisation du code

| Dossier | Contenu |
|---|---|
| `pages/` | **routes uniquement** : pages publiques, écrans d'administration, `pages/api/` |
| `componnents/screens/` | composants d'écran (admin, opérateur, client)  - hors de `pages/` pour ne pas devenir des URL |
| `componnents/` | composants réutilisables (workflow, filtres, exports, loaders…) |
| `services/rbac/` | rôles, permissions, garde des routes d'API |
| `services/workflow/` | moteur du circuit de validation, publication, audit, délais |
| `services/config/` | session, cookies, limitation de débit, envoi d'e-mails, uploads |
| `services/tools/` | calculs partagés (statistiques, filtres, exports, Markdown, nettoyage HTML) |
| `prisma/` | schéma, migrations, jeu de données |
| `scripts/` | tests et tâches planifiées |
| `docs/WORKFLOW_OFFRES.md` | règles détaillées du circuit de validation |

### Règles à respecter

1. Toute règle métier est contrôlée **côté serveur** ; masquer un bouton ne
   suffit jamais.
2. L'identité provient du jeton signé, jamais du corps de la requête.
3. Les offres ne sont pas supprimées mais **désactivées** ; l'historique n'est
   pas modifiable.
4. Un nouveau composant d'écran se place dans `componnents/screens/`, jamais
   dans `pages/`.

### Import d'offres par fichier Excel

Bouton « Importer depuis Excel » de la création d'offre (administration et point focal).
Parcours : modèle → remplissage → analyse → aperçu → confirmation → rapport.

| Fichier | Rôle |
|---|---|
| `services/import/offerImportSchema.js` | **source unique** : feuilles, colonnes, listes, règles, version du modèle |
| `services/import/offerImportTemplate.js` | génération du modèle (exceljs) avec les référentiels de la base |
| `services/import/offerImportService.js` | lecture, contrôles, aperçu et création des offres |
| `pages/api/admin/offer/import/` | `template` (GET), `analyze` et `commit` (POST) |
| `componnents/offers/import/OfferExcelImport.jsx` | interface d'import |

- Le modèle est **généré à la demande** : il suit toujours le schéma et les référentiels.
  Un point focal ne reçoit que son opérateur.
- Modifier une colonne ou une règle = modifier `offerImportSchema.js` **et** incrémenter
  `TEMPLATE_VERSION` ; un fichier issu d'un autre modèle est refusé avec un message explicite.
- L'import ré-analyse le fichier côté serveur et refuse tout doublon. Chaque offre est créée
  entière ou pas du tout, puis **soumise immédiatement** (à valider) : l'utilisateur qui importe
  est le soumissionnaire. Un point focal confirme par le code e-mail, une fois pour tout le fichier.
- `Template/modele_import_offres_CompareTIC.xlsx` (dossier parent) n'est qu'un exemplaire de référence.
- Type de client : une promotion prépayée ne se rattache pas à une offre parente postpayée,
  ni l'inverse ; l'hybride est compatible avec les deux (`services/tools/clientTypeRules.js`,
  règle partagée avec la création manuelle).

### Évolutions d'octobre 2026

| Sujet | Où | À savoir |
|---|---|---|
| Réactivation d'une offre | `reactivateOffer` (`services/workflow/offerWorkflow.js`) | administration ; l'offre retrouve son état d'avant la désactivation ; refusée si une version plus récente est encore active |
| Avis des validateurs précédents | `componnents/workflow/ValidatorComments.jsx` | lecture seule, dans l'écran d'examen et la fenêtre de décision |
| Filtres par statut | `services/tools/offerFilters.js`, `OfferFilterPanel` | combinables, compteurs recalculés selon les autres critères |
| Onglet Monitoring | `pages/api/admin/offer/getMonitorings.js` | liste les VERSIONS issues d'un monitoring (`sourceOfferId`) + les anciens monitorings |
| Suivi d'une offre | `services/tools/offerJourney.js`, `OfferJourney.jsx` | frise passé / présent / à venir, à partir du journal d'audit |
| Référentiels | `services/referential/referentialService.js` | pays, organisations, zones : doublons refusés, suppression refusée si l'élément est utilisé |
| Indices tarifaires | `pages/api/client/statistics/priceObservatory.js` | `from` / `to` (AAAA-MM-JJ) |
| Analyse IA conservée | `services/assistant/offerAnalysisService.js` | une analyse automatique au plus par offre ; ensuite, sur demande, avec historique |
| ComparIA | `pages/api/assistant/chat.js`, `services/assistant/offerRetrieval.js` | `?offer=<id>` ouvre la conversation avec l'offre et son analyse ; la base des offres est interrogée avec les droits de l'utilisateur |
| Courrier au soumissionnaire | `services/letters/`, `componnents/letters/` | offre validée, refusée ou suspendue (désactivée) : le modèle (`letterTemplate.js`) suit l'état de l'offre et reprend le motif du refus ou de la suspension ; un courrier antérieur à l'état actuel n'est pas rouvert d'office ; un brouillon n'est jamais créé deux fois (`saveLetter`) ; envoi contrôlé (forme de l'adresse, domaine, refus du serveur) et laissé en brouillon s'il échoue ; ouverture dans la messagerie de l'agent (`mailCompose.js` : `mailto:`, Gmail, Outlook en ligne, fichier `.eml`) ; logo ARTCI en aperçu, à l'impression et dans l'e-mail |
| Opérateur : pas de circuit de validation | `services/workflow/operatorView.js`, `services/rbac/guardRoute.js` | un point focal ne reçoit ni niveau, ni décision par niveau, ni nom de validateur : filtré côté serveur (fiche d'offre, actions, listes, journal, notifications) ; fiche dédiée `OperatorOfferSheet` |
| Suivi de mes offres (opérateur) | `pages/api/operator/evolution.js`, `services/offers/offerEvolution.js`, `OperatorActivityPage` | réservé aux points focaux : état actuel, versions successives, ce qui a changé de l'une à l'autre, étapes marquantes, bouton de détails |
| Mon compte / Mon profil | `componnents/screens/admin/profile/ProfilePage.jsx` | page commune à l'administration (`/account`) et aux opérateurs (`/operator-profile`) |
| Rayon de 8px de l'espace de gestion | `styles/admin-radius.css`, `services/tools/adminUi.js` | classe `adm-ui` de `<body>` posée d'après la route ; site public non touché |
| Assistant IA ARTCI | `services/artciAssistant/`, `/admin-artci-assistant` | voir ci-dessous |

### Assistant IA ARTCI (base documentaire)

Assistant réglementaire distinct de ComparIA : il ne répond qu'à partir des textes déposés
dans la base documentaire, cite ses sources et dit ce que la base ne couvre pas.

| Couche | Fichier |
|---|---|
| Interface | `componnents/screens/admin/admin/artciAssistant/ArtciAssistantPage.jsx` |
| Moteur conversationnel | `services/artciAssistant/conversationEngine.js` |
| Gestion du contexte (consignes, budget, citations) | `services/artciAssistant/contextBuilder.js` |
| Base documentaire (dépôt, découpage en passages) | `documentStore.js`, `textExtraction.js`, `chunking.js` |
| Recherche documentaire (plein texte PostgreSQL, français) | `services/artciAssistant/documentSearch.js` |
| Historique des conversations (par utilisateur) | `services/artciAssistant/conversationStore.js` |
| Moteur de rédaction (service d'analyse) | `services/assistant/ragClient.js` |
| Permissions | `KNOWLEDGE_READ` (agents ARTCI), `KNOWLEDGE_MANAGE` (administration) |

- Aucun passage trouvé : l'assistant répond « non disponible dans la base documentaire »
  **sans** appeler le moteur de rédaction (rien ne peut être inventé, aucun coût).
- Moteur de rédaction indisponible : les passages sont renvoyés tels quels.
- Formats déposables : PDF (texte, pas scanné), Word `.docx`, `.txt`, `.md`, ou texte collé.
- Remplacer le moteur de rédaction = modifier `ragClient.js` uniquement.

---

## 6. Production

```bash
npm ci
npx prisma migrate deploy
npm run build
npm start                  # port 3001 (à placer derrière un reverse proxy HTTPS)
```

Avant la mise en service : sauvegarde PostgreSQL planifiée,
`MAIL_DRY_RUN=false`, `CRON_SECRET` renseigné et tâche cron installée.

### Connexion et HTTPS (serveur Ubuntu)

Le cookie de session n'est marqué `Secure` que si la requête arrive en HTTPS
(`SESSION_COOKIE_SECURE=auto`). Un navigateur refuse un cookie `Secure` reçu
en HTTP : la connexion semblait réussir puis renvoyait à l'accueil, quel que
soit le profil. Derrière Nginx, transmettre le protocole d'origine :

```nginx
location / {
    proxy_pass http://127.0.0.1:3001;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
}
```

Une fois le site servi uniquement en HTTPS (certificat Let's Encrypt :
`sudo certbot --nginx`), `SESSION_COOKIE_SECURE=true` peut être fixé.
