import {
  resolveStatus,
  resolveStatusKey,
  statusOf,
} from "@/services/tools/offerStatus";
import { formatDateToFrench } from "@/services/tools/helper";

/**
 * Logique du suivi des offres, isolée du rendu.
 *
 * Elle vivait dans le composant, éparpillée entre quatre `useEffect` qui se
 * contredisaient (le filtre par type de facturation défaisait celui par
 * catégorie). La sortir ici sert deux buts : un seul chemin de filtrage, et
 * une logique vérifiable sur les données réelles sans passer par un navigateur.
 */

export const DEFAULT_TRACKING_FILTER = {
  category: "ALL",
  billingType: "ALL",
  status: "ALL",
  search: "",
};

/** `HYBRIDE` et `HYBRID` désignent la même chose selon les enregistrements. */
const normalizeBilling = (value) => (value === "HYBRIDE" ? "HYBRID" : value);

/**
 * Filtrage unique : catégorie, facturation, statut et recherche libre sont
 * appliqués ensemble, jamais l'un à la place de l'autre.
 */
export const filterTrackedOffers = (offers, filter = DEFAULT_TRACKING_FILTER) => {
  const f = { ...DEFAULT_TRACKING_FILTER, ...(filter || {}) };
  const needle = String(f.search || "").trim().toLowerCase();

  return (Array.isArray(offers) ? offers : []).filter((o) => {
    if (f.category !== "ALL" && o?.category !== f.category) return false;

    if (f.billingType !== "ALL") {
      if (normalizeBilling(o?.billingType) !== normalizeBilling(f.billingType)) {
        return false;
      }
    }

    if (f.status !== "ALL" && resolveStatusKey(o) !== f.status) return false;

    if (needle) {
      const haystack = `${o?.title || ""} ${o?.code || ""} ${
        o?.operator?.name || ""
      }`.toLowerCase();
      if (!haystack.includes(needle)) return false;
    }

    return true;
  });
};

/** Indicateurs affichés au-dessus des filtres. */
export const computeTrackingKpis = (offers) => {
  const list = Array.isArray(offers) ? offers : [];
  const count = (key) => list.filter((o) => resolveStatusKey(o) === key).length;
  return {
    total: list.length,
    pending: count("PENDING"),
    allowed: count("ALLOW"),
    denied: count("DINIED"),
    suspended: count("SUSPENDED"),
    monitorings: list.reduce((sum, o) => sum + (o?.monitorings?.length || 0), 0),
  };
};

const timeOf = (value) => {
  const t = new Date(value ?? 0).getTime();
  return Number.isFinite(t) ? t : 0;
};

/**
 * Chronologie d'une offre : déclaration, décision de l'ARTCI, puis chaque
 * monitoring, réordonnés dans le temps. C'est cette suite qui constitue
 * « l'évolution » que l'écran doit montrer   l'ancienne version se contentait
 * d'empiler les formules.
 */
export const buildOfferTimeline = (offer) => {
  if (!offer) return [];
  const events = [];

  events.push({
    at: timeOf(offer?.createdAt),
    date: offer?.createdAt,
    kind: "DECLARATION",
    title: "Déclaration de l'offre",
    color: "#0ea5e9",
    text: `Notifiée le ${formatDateToFrench(offer?.notifiDate)} · publication souhaitée le ${formatDateToFrench(offer?.desiredDate)}.`,
  });

  if (offer?.validation?.status) {
    const s = statusOf(offer.validation.status);
    events.push({
      at: timeOf(offer.validation.updatedAt || offer.validation.createdAt),
      date: offer.validation.updatedAt || offer.validation.createdAt,
      kind: "DECISION",
      title: `Décision de l'ARTCI : ${s.label.toLowerCase()}`,
      color: s.bg,
      text: offer.validation.launchDate
        ? `Date de lancement retenue : ${formatDateToFrench(offer.validation.launchDate)}.`
        : null,
    });
  }

  (offer?.monitorings || []).forEach((m) => {
    const s = resolveStatus(m);
    events.push({
      at: timeOf(m?.createdAt),
      date: m?.createdAt,
      kind: "MONITORING",
      title: `Monitoring : ${m?.title || "sans intitulé"}`,
      color: s.bg,
      text: `${m?.code || ""} · ${s.label} · notifié le ${formatDateToFrench(m?.notifiDate)}.`,
    });
  });

  return events.sort((a, b) => a.at - b.at);
};

/** Prix plancher, plafond et nombre de formules d'un jeu de formules. */
export const priceRange = (formulas) => {
  const values = (Array.isArray(formulas) ? formulas : [])
    .map((f) => f?.price?.value)
    .filter((v) => typeof v === "number" && Number.isFinite(v));

  return {
    count: Array.isArray(formulas) ? formulas.length : 0,
    min: values.length ? Math.min(...values) : null,
    max: values.length ? Math.max(...values) : null,
  };
};

/**
 * Les VERSIONS successives d'une offre : la déclaration d'origine, puis chaque
 * monitoring déposé, dans l'ordre chronologique.
 *
 * C'est la matière de la frise : là où la chronologie liste des évènements,
 * ceci compare des états   nombre de formules et fourchette tarifaire   pour
 * que l'évolution se lise d'un coup d'œil au lieu de devoir être reconstituée.
 */
export const buildOfferVersions = (offer) => {
  if (!offer) return [];

  const versions = [
    {
      key: `v-${offer?.id}-0`,
      kind: "DECLARATION",
      label: "Déclaration",
      date: offer?.createdAt,
      at: timeOf(offer?.createdAt),
      statusKey: resolveStatusKey(offer),
      ...priceRange(offer?.formulas),
    },
  ];

  (offer?.monitorings || [])
    .slice()
    .sort((a, b) => timeOf(a?.createdAt) - timeOf(b?.createdAt))
    .forEach((m, i) => {
      versions.push({
        key: `v-${offer?.id}-m${m?.id ?? i}`,
        kind: "MONITORING",
        label: `Monitoring ${i + 1}`,
        title: m?.title,
        code: m?.code,
        date: m?.createdAt,
        at: timeOf(m?.createdAt),
        statusKey: resolveStatusKey(m),
        // Les formules d'un monitoring vivent dans `monitoringFormula`.
        ...priceRange(m?.monitoringFormula),
      });
    });

  // Écart avec la version précédente : c'est lui qui porte l'information
  // « l'offre a augmenté / baissé / s'est enrichie ».
  return versions.map((v, i, all) => {
    if (i === 0) return { ...v, delta: null };
    const prev = all[i - 1];
    const hasBoth = v.min != null && prev.min != null;
    return {
      ...v,
      delta: {
        price: hasBoth ? v.min - prev.min : null,
        pricePct:
          hasBoth && prev.min > 0
            ? Math.round(((v.min - prev.min) / prev.min) * 100)
            : null,
        count: v.count - prev.count,
      },
    };
  });
};

/** Résumé compact des formules ; le détail reste dans la fenêtre dédiée. */
export const summarizeFormulas = (offer, max = 6) =>
  (offer?.formulas || []).slice(0, max).map((f) => ({
    id: f?.id,
    title: f?.title,
    price: f?.price?.value,
    validity: f?.validity,
  }));

/**
 * Conserve, parmi les offres suivies, celles encore présentes au périmètre.
 * Retourne la liste d'origine si rien ne change, pour ne pas relancer un rendu.
 */
export const pruneSelection = (selected, available) => {
  const list = Array.isArray(selected) ? selected : [];
  const ids = new Set((Array.isArray(available) ? available : []).map((o) => o?.id));
  const kept = list.filter((o) => ids.has(o?.id));
  return kept.length === list.length ? list : kept;
};
