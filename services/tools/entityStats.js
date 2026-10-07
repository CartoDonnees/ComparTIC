import { PROFILE_CODE_TO_ROLE, ROLE_LABELS } from "@/services/rbac/roles";
import { BASE_IMG_URL } from "@/services/tools/constants";

/**
 * Indicateurs des pages de gestion (utilisateurs, opérateurs, organisations),
 * calculés à partir des listes déjà chargées et présentés par
 * `componnents/stats/EntityStatsPanel.jsx`.
 *
 * Module sans dépendance serveur : importé côté navigateur.
 */

/** Tonalité de chaque rôle dans les répartitions. */
const ROLE_TONES = {
  SUPER_ADMIN: "violet",
  ADMIN: "blue",
  SUPERVISOR: "teal",
  VALIDATOR_1: "amber",
  VALIDATOR_2: "orange",
  VALIDATOR_3: "pink",
  VALIDATOR_4: "red",
  FOCAL_POINT: "green",
  CLIENT: "slate",
};

const STATUS_META = {
  ENABLE: { label: "Actifs", tone: "green" },
  PENDING: { label: "En attente d'activation", tone: "amber" },
  SUSPENDED: { label: "Suspendus", tone: "orange" },
  DISABLE: { label: "Désactivés", tone: "slate" },
};

/** Indicateurs de la page, calculés à partir de la liste chargée. */
export const computeUserStats = (users) => {
  const list = Array.isArray(users) ? users : [];
  const total = list.length;
  const roleOfUser = (u) => u?.role || PROFILE_CODE_TO_ROLE[u?.profile?.code] || null;
  const count = (fn) => list.filter(fn).length;
  const since = Date.now() - 30 * 24 * 3600 * 1000;

  const focalPoints = list.filter((u) => roleOfUser(u) === "FOCAL_POINT");
  const byOperator = new Map();
  focalPoints.forEach((u) => {
    const op = u?.focalPoint?.operator;
    if (!op) return;
    const cur = byOperator.get(op.id) || { key: `op-${op.id}`, label: op.name, value: 0, image: op.imagePath ? BASE_IMG_URL + op.imagePath : null };
    cur.value += 1;
    byOperator.set(op.id, cur);
  });
  const operatorsCovered = byOperator.size;
  const validators = count((u) => String(roleOfUser(u) || "").startsWith("VALIDATOR_"));

  return {
    kpis: [
      { key: "total", label: "Comptes utilisateurs", value: total, icon: "bi-people", tone: "blue", hint: `${count((u) => new Date(u?.createdAt).getTime() >= since)} créé(s) sur 30 jours` },
      { key: "active", label: "Comptes actifs", value: count((u) => u?.status === "ENABLE"), total, icon: "bi-person-check", tone: "green" },
      { key: "pending", label: "En attente d'activation", value: count((u) => u?.status === "PENDING"), total, icon: "bi-hourglass-split", tone: "amber" },
      { key: "blocked", label: "Suspendus ou désactivés", value: count((u) => ["SUSPENDED", "DISABLE"].includes(u?.status)), total, icon: "bi-person-slash", tone: "red" },
      { key: "validators", label: "Validateurs (V1 à V4)", value: validators, total, icon: "bi-patch-check", tone: "orange" },
      { key: "fp", label: "Points focaux", value: focalPoints.length, total, icon: "bi-broadcast-pin", tone: "teal", hint: `${operatorsCovered} opérateur(s)` },
    ],
    breakdowns: [
      {
        key: "roles",
        title: "Répartition par profil",
        icon: "bi-diagram-3",
        items: Object.keys(ROLE_LABELS).map((role) => ({
          key: role,
          label: ROLE_LABELS[role],
          value: count((u) => roleOfUser(u) === role),
          tone: ROLE_TONES[role],
        })),
      },
      {
        key: "status",
        title: "Répartition par statut",
        icon: "bi-toggles",
        items: Object.entries(STATUS_META).map(([status, meta]) => ({
          key: status,
          label: meta.label,
          value: count((u) => u?.status === status),
          tone: meta.tone,
        })),
      },
    ],
    lists: [
      {
        key: "fp-operators",
        title: "Points focaux par opérateur",
        icon: "bi-building",
        empty: "Aucun point focal rattaché à un opérateur.",
        items: [...byOperator.values()].sort((x, y) => y.value - x.value),
      },
    ],
  };
};

/**
 * Indicateurs de la page. L'entrée « ARTCI » (OPE-000) est une entité de
 * référence (offre repère « Offre Inconnu ») : elle n'est pas comptée comme
 * opérateur.
 */
export const computeOperatorStats = (operators) => {
  const list = (Array.isArray(operators) ? operators : []).filter((o) => o?.code !== "OPE-000");
  const total = list.length;
  const count = (fn) => list.filter(fn).length;
  const offers = list.reduce((s, o) => s + (o?._count?.offers || 0), 0);
  const focalPoints = list.reduce((s, o) => s + (o?._count?.focalPoints || 0), 0);
  const withoutFocalPoint = count((o) => (o?._count?.focalPoints || 0) === 0);
  const imageOf = (o) => (o?.imagePath ? BASE_IMG_URL + o.imagePath : null);

  return {
    kpis: [
      { key: "total", label: "Opérateurs", value: total, icon: "bi-building", tone: "blue" },
      { key: "mobile", label: "Réseau mobile", value: count((o) => ["MOBILE", "HYBRIDE"].includes(o?.type)), total, icon: "bi-phone", tone: "green", hint: "hybrides inclus" },
      { key: "fixe", label: "Réseau fixe", value: count((o) => ["FIXE", "HYBRIDE"].includes(o?.type)), total, icon: "bi-router", tone: "teal", hint: "hybrides inclus" },
      { key: "active", label: "Opérateurs actifs", value: count((o) => o?.status === "ENABLE"), total, icon: "bi-check-circle", tone: "violet" },
      { key: "offers", label: "Offres déclarées", value: offers, icon: "bi-collection", tone: "orange", hint: total ? `${(offers / total).toFixed(1).replace(".", ",")} par opérateur en moyenne` : undefined },
      { key: "fp", label: "Points focaux", value: focalPoints, icon: "bi-broadcast-pin", tone: withoutFocalPoint ? "red" : "green", hint: withoutFocalPoint ? `${withoutFocalPoint} opérateur(s) sans point focal` : "tous les opérateurs sont couverts" },
    ],
    breakdowns: [
      {
        key: "type",
        title: "Répartition par type de réseau",
        icon: "bi-diagram-2",
        items: [
          { key: "MOBILE", label: "Mobile uniquement", value: count((o) => o?.type === "MOBILE"), tone: "green" },
          { key: "FIXE", label: "Fixe uniquement", value: count((o) => o?.type === "FIXE"), tone: "teal" },
          { key: "HYBRIDE", label: "Hybride (mobile et fixe)", value: count((o) => o?.type === "HYBRIDE"), tone: "violet" },
        ],
      },
      {
        key: "status",
        title: "Répartition par statut",
        icon: "bi-toggles",
        items: [
          { key: "ENABLE", label: "Actifs", value: count((o) => o?.status === "ENABLE"), tone: "green" },
          { key: "PENDING", label: "En attente", value: count((o) => o?.status === "PENDING"), tone: "amber" },
          { key: "SUSPENDED", label: "Suspendus", value: count((o) => o?.status === "SUSPENDED"), tone: "orange" },
          { key: "DISABLE", label: "Désactivés", value: count((o) => o?.status === "DISABLE"), tone: "slate" },
          { key: "NONE", label: "Non renseigné", value: count((o) => !o?.status), tone: "red" },
        ],
      },
    ],
    lists: [
      {
        key: "offers",
        title: "Offres déclarées par opérateur",
        icon: "bi-bar-chart",
        empty: "Aucune offre déclarée.",
        items: list
          .map((o) => ({ key: `of-${o.id}`, label: o.name, value: o?._count?.offers || 0, image: imageOf(o) }))
          .filter((it) => it.value > 0)
          .sort((x, y) => y.value - x.value)
          .slice(0, 8),
      },
    ],
  };
};

const AREA_LABELS = {
  NATIONAL: { label: "Nationale", tone: "green" },
  INTERNATIONAL: { label: "Internationale", tone: "blue" },
  ROAMING: { label: "Roaming", tone: "violet" },
};

/** Indicateurs de la page, calculés à partir des listes chargées. */
export const computeOrganizationStats = (organizations, mainOrganizations) => {
  const orgs = Array.isArray(organizations) ? organizations : [];
  const mains = Array.isArray(mainOrganizations) ? mainOrganizations : [];
  const countryIds = new Set();
  orgs.forEach((o) => (o?.countries || []).forEach((c) => countryIds.add(c.id)));
  const withoutCountry = orgs.filter((o) => !(o?.countries || []).length).length;
  const memberships = mains.reduce((s, m) => s + (m?._count?.organizations || 0), 0);

  return {
    kpis: [
      { key: "main", label: "Organisations principales", value: mains.length, icon: "bi-diagram-3", tone: "violet", hint: `${memberships} rattachement(s)` },
      { key: "orgs", label: "Organisations", value: orgs.length, icon: "bi-globe-europe-africa", tone: "blue" },
      { key: "countries", label: "Pays couverts", value: countryIds.size, icon: "bi-flag", tone: "green", hint: "pays distincts" },
      { key: "nocountry", label: "Organisations sans pays", value: withoutCountry, total: orgs.length, icon: "bi-exclamation-triangle", tone: withoutCountry ? "amber" : "green" },
    ],
    breakdowns: [
      {
        key: "area",
        title: "Répartition par zone",
        icon: "bi-map",
        items: [
          ...Object.entries(AREA_LABELS).map(([title, meta]) => ({
            key: title,
            label: meta.label,
            value: orgs.filter((o) => o?.area?.title === title).length,
            tone: meta.tone,
          })),
          { key: "NONE", label: "Zone non renseignée", value: orgs.filter((o) => !o?.area?.title).length, tone: "slate" },
        ],
      },
    ],
    lists: [
      {
        key: "countries",
        title: "Pays par organisation",
        icon: "bi-bar-chart",
        empty: "Aucun pays rattaché.",
        items: orgs
          .map((o) => ({ key: `org-${o.id}`, label: o.name, value: (o?.countries || []).length }))
          .filter((it) => it.value > 0)
          .sort((x, y) => y.value - x.value)
          .slice(0, 8),
      },
      {
        key: "mains",
        title: "Membres par organisation principale",
        icon: "bi-people",
        empty: "Aucune organisation principale.",
        items: mains
          .map((m) => ({ key: `main-${m.id}`, label: m.name, value: m?._count?.organizations || 0 }))
          .sort((x, y) => y.value - x.value)
          .slice(0, 8),
      },
    ],
  };
};

/* -------------------------------------------------------------------------- */
/* Pays                                                                        */
/* -------------------------------------------------------------------------- */

/**
 * `_count.organizations` : organisations dont le pays est membre ;
 * `_count.organisationCountries` : sélections du pays dans la zone d'une offre.
 */
export const computeCountryStats = (countries) => {
  const list = Array.isArray(countries) ? countries : [];
  const total = list.length;
  const count = (fn) => list.filter(fn).length;
  const inOrganization = count((c) => (c?._count?.organizations || 0) > 0);
  const targeted = count((c) => (c?._count?.organisationCountries || 0) > 0);
  const selections = list.reduce((s, c) => s + (c?._count?.organisationCountries || 0), 0);
  const top = (key) =>
    list
      .map((c) => ({ key: `${key}-${c.id}`, label: c.name, value: c?._count?.[key] || 0 }))
      .filter((it) => it.value > 0)
      .sort((x, y) => y.value - x.value || x.label.localeCompare(y.label))
      .slice(0, 8);

  return {
    kpis: [
      { key: "total", label: "Pays enregistrés", value: total, icon: "bi-flag", tone: "blue" },
      { key: "indicator", label: "Indicatif renseigné", value: count((c) => c?.indicator), total, icon: "bi-telephone", tone: "teal" },
      { key: "orgs", label: "Membres d'une organisation", value: inOrganization, total, icon: "bi-diagram-3", tone: "violet" },
      { key: "targeted", label: "Ciblés par des offres", value: targeted, total, icon: "bi-broadcast", tone: "green", hint: `${selections} sélection(s) dans les zones d'offres` },
    ],
    breakdowns: [
      {
        key: "membership",
        title: "Rattachement aux organisations",
        icon: "bi-diagram-3",
        items: [
          { key: "in", label: "Membres d'au moins une organisation", value: inOrganization, tone: "violet" },
          { key: "out", label: "Sans organisation", value: total - inOrganization, tone: "slate" },
        ],
      },
      {
        key: "usage",
        title: "Utilisation dans les offres",
        icon: "bi-broadcast",
        items: [
          { key: "targeted", label: "Ciblés par au moins une offre", value: targeted, tone: "green" },
          { key: "never", label: "Jamais ciblés", value: total - targeted, tone: "slate" },
        ],
      },
    ],
    lists: [
      { key: "offers", title: "Pays les plus ciblés par les offres", icon: "bi-bar-chart", empty: "Aucun pays ciblé par une offre.", items: top("organisationCountries") },
      { key: "orgs", title: "Pays membres du plus d'organisations", icon: "bi-people", empty: "Aucun pays rattaché à une organisation.", items: top("organizations") },
    ],
  };
};

/* -------------------------------------------------------------------------- */
/* Zones                                                                       */
/* -------------------------------------------------------------------------- */

const AREA_TYPES = {
  NATIONAL: { label: "Nationale", kpi: "Zones nationales", tone: "green", icon: "bi-geo-alt" },
  INTERNATIONAL: { label: "Internationale", kpi: "Zones internationales", tone: "blue", icon: "bi-globe2" },
  ROAMING: { label: "Roaming", kpi: "Zones roaming", tone: "violet", icon: "bi-airplane" },
};

/**
 * Une zone est enregistrée pour chaque offre (et chaque monitoring) : les
 * indicateurs distinguent donc les zones utilisées des zones orphelines.
 */
export const computeAreaStats = (areas) => {
  const list = Array.isArray(areas) ? areas : [];
  const total = list.length;
  const offersOf = (a) => a?._count?.offers ?? (a?.offers || []).length;
  const used = list.filter((a) => offersOf(a) > 0 || (a?._count?.monitorings || 0) > 0).length;
  const offers = list.reduce((s, a) => s + offersOf(a), 0);
  const withOrganizations = list.filter((a) => (a?._count?.areaOrganizations || 0) > 0).length;
  const byType = (fn) =>
    Object.entries(AREA_TYPES).map(([title, meta]) => ({
      key: title,
      label: meta.label,
      value: list.filter((a) => a?.title === title).reduce((s, a) => s + fn(a), 0),
      tone: meta.tone,
    }));

  return {
    kpis: [
      { key: "total", label: "Zones enregistrées", value: total, icon: "bi-map", tone: "blue" },
      ...Object.entries(AREA_TYPES).map(([title, meta]) => ({
        key: title,
        label: meta.kpi,
        value: list.filter((a) => a?.title === title).length,
        total,
        icon: meta.icon,
        tone: meta.tone,
      })),
      { key: "used", label: "Zones utilisées", value: used, total, icon: "bi-link-45deg", tone: "teal", hint: `${total - used} orpheline(s)` },
      { key: "orgs", label: "Avec organisations ciblées", value: withOrganizations, total, icon: "bi-diagram-3", tone: "orange" },
    ],
    breakdowns: [
      { key: "type", title: "Répartition des zones par type", icon: "bi-pie-chart", items: byType(() => 1) },
      { key: "offers", title: "Offres par type de zone", icon: "bi-collection", empty: "Aucune offre rattachée à une zone.", items: byType(offersOf) },
    ],
    lists: [
      {
        key: "reach",
        title: "Organisations ciblées par type de zone",
        icon: "bi-bar-chart",
        empty: "Aucune organisation ciblée.",
        items: byType((a) => a?._count?.areaOrganizations || 0).filter((it) => it.value > 0).sort((x, y) => y.value - x.value),
      },
    ],
  };
};
