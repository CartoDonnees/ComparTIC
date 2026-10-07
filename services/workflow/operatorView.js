/**
 * Ce qu'un opérateur (point focal) a le droit de savoir d'une offre.
 *
 * Règle : le circuit de validation de l'ARTCI est interne. L'opérateur connaît
 * l'état de son offre (soumise, en cours d'examen, validée, refusée,
 * désactivée) et son évolution dans le temps (déclaration, modifications,
 * versions successives, décision), mais ni le niveau de validation atteint,
 * ni les décisions rendues niveau par niveau, ni l'identité des agents qui
 * ont statué.
 *
 * Le filtrage est fait ICI, côté serveur : masquer ces informations à l'écran
 * ne suffirait pas, elles resteraient lisibles dans les réponses de l'API.
 *
 * Module pur (aucune dépendance) : utilisé par les routes d'API et testé seul.
 */

const FOCAL_POINT = "FOCAL_POINT";

export const isOperatorAudience = (actor) => actor?.role === FOCAL_POINT;

/**
 * Clés retirées de toute réponse faite à un opérateur, où qu'elles se trouvent :
 * niveau attendu, longueur du circuit, niveaux, décisions (y compris leur
 * simple décompte, `_count.decisions`, qui révélerait le niveau atteint).
 */
const HIDDEN_KEYS = new Set(["currentValidationLevel", "finalLevel", "levels", "decisions"]);

const isPlain = (value) => value !== null && typeof value === "object" && Object.getPrototypeOf(value) === Object.prototype;

/** Copie d'une réponse sans les clés du circuit de validation (parcours en profondeur). */
export const stripValidationCircuit = (value) => {
  if (Array.isArray(value)) return value.map(stripValidationCircuit);
  if (!isPlain(value)) return value;
  const out = {};
  for (const [key, item] of Object.entries(value)) {
    if (!HIDDEN_KEYS.has(key)) out[key] = stripValidationCircuit(item);
  }
  return out;
};

/**
 * Étapes de la vie d'une offre montrées à l'opérateur. Les étapes internes
 * (validation intermédiaire, alerte de délai, notifications, courriers en
 * préparation) n'y figurent pas.
 *
 * `comment` : le texte saisi est-il destiné à l'opérateur ? (motif d'un refus
 * ou d'une désactivation : oui ; commentaire d'un validateur : non.)
 */
export const OPERATOR_EVENTS = {
  CREATE: { label: "Offre déclarée", icon: "bi-file-earmark-plus", tone: "neutral" },
  LEGACY_IMPORT: { label: "Offre reprise de l'historique", icon: "bi-archive", tone: "neutral" },
  UPDATE: { label: "Contenu modifié", icon: "bi-pencil-square", tone: "neutral" },
  SUBMIT: { label: "Offre soumise à l'ARTCI", icon: "bi-send-check", tone: "info" },
  VALIDATE_FINAL: { label: "Offre validée par l'ARTCI", icon: "bi-patch-check-fill", tone: "success" },
  REFUSE: { label: "Offre refusée par l'ARTCI", icon: "bi-x-octagon", tone: "danger", comment: "Motif" },
  VERSION_CREATED: { label: "Nouvelle version déclarée", icon: "bi-layers", tone: "info" },
  MONITORING: { label: "Version remplacée par une nouvelle version", icon: "bi-arrow-repeat", tone: "warning" },
  DEACTIVATE: { label: "Offre désactivée", icon: "bi-slash-circle", tone: "warning", comment: "Motif" },
  REACTIVATE: { label: "Offre réactivée", icon: "bi-arrow-counterclockwise", tone: "success", comment: "Motif" },
};

export const OPERATOR_EVENT_ACTIONS = Object.keys(OPERATOR_EVENTS);

const personName = (user) => [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim() || null;

/**
 * Une ligne du journal d'audit, réduite à ce que l'opérateur peut lire.
 * L'auteur n'est nommé que s'il appartient à l'opérateur ; sinon l'étape est
 * attribuée à « l'ARTCI », sans identité.
 */
export const operatorEvent = (entry) => {
  const meta = OPERATOR_EVENTS[entry?.action];
  if (!meta) return null;
  const byOperator = entry.actorRole === FOCAL_POINT;
  return {
    id: entry.id,
    action: entry.action,
    label: meta.label,
    icon: meta.icon,
    tone: meta.tone,
    at: entry.createdAt,
    by: byOperator ? personName(entry.actor) || "Votre équipe" : entry.actorRole ? "ARTCI" : null,
    byOperator,
    comment: meta.comment && entry.comment ? { label: meta.comment, text: entry.comment } : null,
  };
};

export const operatorEvents = (audit = []) => audit.map(operatorEvent).filter(Boolean);

/**
 * Fiche d'une offre pour l'opérateur : état, issue, évolution et versions,
 * sans niveaux, sans décisions par niveau, sans nom de validateur.
 *
 * @param state  résultat de `getWorkflowState` (fiche complète)
 */
export const operatorWorkflowState = (state) => {
  const refusal = [...(state.decisions || [])].reverse().find((d) => d.decision === "REFUSED") || null;
  const status = state.offer?.workflowStatus;
  return {
    audience: "OPERATOR",
    offer: stripValidationCircuit(state.offer),
    offerType: state.offerType,
    versions: stripValidationCircuit(state.versions || []),
    actions: state.actions || [],
    published: !!state.published,
    // Issue de l'examen : la décision et sa date, avec le motif d'un refus.
    outcome: state.circuitClosed
      ? {
          status,
          at: state.closure?.at || null,
          motive: status === "REFUSED" ? refusal?.comment || null : null,
        }
      : null,
    events: operatorEvents(state.audit),
  };
};
