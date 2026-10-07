import prisma from "@/services/config/auth/prisma";
import { writeAudit, AUDIT_ACTIONS } from "@/services/workflow/audit";

/**
 * Référentiels géographiques : pays, organisations, zones.
 *
 * Source unique des règles, appelée par les routes `/api/admin/country`,
 * `/api/admin/organization` et `/api/admin/area` :
 *  - champs obligatoires et longueurs ;
 *  - pas de doublon (nom d'un pays ou d'une organisation, type d'une zone) ;
 *  - aucune suppression qui laisserait une référence invalide : un élément
 *    utilisé par une offre ou par un autre référentiel n'est pas supprimable,
 *    et la réponse dit précisément par quoi il est utilisé ;
 *  - chaque création, modification et suppression est tracée (journal d'audit).
 *
 * Modèle :
 *  - `Country` appartient à des organisations (catalogue) et peut être retenu
 *    dans la zone d'une offre (`OrganisationCountry`) ;
 *  - `Organization` est rattachée à une zone de référence et regroupe des
 *    pays ; une offre internationale ou roaming la référence par
 *    `AreaOrganization` ;
 *  - `Area` sert à deux choses : les ZONES DE RÉFÉRENCE (une par type, codes
 *    fixes ci-dessous) et la copie technique créée pour chaque offre. Seules
 *    les premières se gèrent ici.
 */

export const ZONE_TYPES = {
  NATIONAL: { label: "Nationale", code: "ARE-01" },
  INTERNATIONAL: { label: "Internationale", code: "ARE-10" },
  ROAMING: { label: "Roaming", code: "ARE-11" },
};
export const REFERENCE_ZONE_CODES = Object.values(ZONE_TYPES).map((z) => z.code);

export class ReferentialError extends Error {
  constructor(status, code, message, details = undefined) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

const KIND_LABELS = { COUNTRY: "Pays", ORGANIZATION: "Organisation", ZONE: "Zone" };

const clean = (value) => String(value ?? "").replace(/\s+/g, " ").trim();
const idOf = (value) => {
  const n = Number(value);
  if (!Number.isInteger(n) || n <= 0) throw new ReferentialError(400, "INVALID_ID", "Identifiant invalide.");
  return n;
};
const uniqueCode = (prefix) => `${prefix}-${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2, 5).toUpperCase()}`;

const requireName = (value, label) => {
  const name = clean(value);
  if (!name) throw new ReferentialError(400, "NAME_REQUIRED", `${label} est obligatoire.`, { field: "name" });
  if (name.length < 2 || name.length > 100) {
    throw new ReferentialError(400, "NAME_LENGTH", `${label} doit compter entre 2 et 100 caractères.`, { field: "name" });
  }
  return name;
};
const optionalText = (value) => {
  const text = String(value ?? "").trim();
  if (text.length > 2000) throw new ReferentialError(400, "DESCRIPTION_LENGTH", "La description ne doit pas dépasser 2 000 caractères.", { field: "description" });
  return text || null;
};

const audit = (db, action, actor, kind, entity, extra = {}) =>
  writeAudit(db, {
    action,
    actor,
    entityType: "REFERENTIAL",
    entityId: entity.id,
    metadata: { kind, kindLabel: KIND_LABELS[kind], code: entity.code, name: entity.name ?? ZONE_TYPES[entity.title]?.label, ...extra },
  });

const plural = (n, one, many) => `${n} ${n > 1 ? many : one}`;

/* ========================================================================== */
/* Pays                                                                       */
/* ========================================================================== */

const COUNTRY_SELECT = {
  id: true,
  code: true,
  name: true,
  indicator: true,
  description: true,
  createdAt: true,
  updatedAt: true,
  organizations: { select: { id: true, name: true }, orderBy: { name: "asc" } },
  _count: { select: { organizations: true, organisationCountries: true } },
};

export const listCountries = () => prisma.country.findMany({ orderBy: { name: "asc" }, select: COUNTRY_SELECT });

const countryInput = async (body, currentId = null) => {
  const name = requireName(body?.name, "Le nom du pays");
  let indicator = null;
  if (body?.indicator !== undefined && body?.indicator !== null && String(body.indicator).trim() !== "") {
    indicator = Number(String(body.indicator).replace(/^\+/, ""));
    if (!Number.isInteger(indicator) || indicator < 1 || indicator > 9999) {
      throw new ReferentialError(400, "INDICATOR", "L'indicatif téléphonique doit être un nombre entre 1 et 9999.", { field: "indicator" });
    }
  }
  const duplicate = await prisma.country.findFirst({
    where: { name: { equals: name, mode: "insensitive" }, ...(currentId ? { id: { not: currentId } } : {}) },
    select: { id: true, name: true },
  });
  if (duplicate) throw new ReferentialError(409, "DUPLICATE", `Le pays « ${duplicate.name} » existe déjà.`, { field: "name" });
  return { name, indicator, description: optionalText(body?.description) };
};

export const createCountry = async (body, actor) => {
  const data = await countryInput(body);
  return prisma.$transaction(async (tx) => {
    const created = await tx.country.create({ data: { code: uniqueCode("PYS"), ...data }, select: COUNTRY_SELECT });
    await audit(tx, AUDIT_ACTIONS.REFERENTIAL_CREATE, actor, "COUNTRY", created);
    return created;
  });
};

export const updateCountry = async (id, body, actor) => {
  const countryId = idOf(id);
  const current = await prisma.country.findUnique({ where: { id: countryId }, select: { id: true, name: true, indicator: true, description: true } });
  if (!current) throw new ReferentialError(404, "NOT_FOUND", "Pays introuvable.");
  const data = await countryInput(body, countryId);
  const changed = Object.keys(data).filter((k) => (data[k] ?? null) !== (current[k] ?? null));
  return prisma.$transaction(async (tx) => {
    const updated = await tx.country.update({ where: { id: countryId }, data, select: COUNTRY_SELECT });
    if (changed.length) await audit(tx, AUDIT_ACTIONS.REFERENTIAL_UPDATE, actor, "COUNTRY", updated, { changed, previousName: current.name });
    return updated;
  });
};

export const deleteCountry = async (id, actor) => {
  const countryId = idOf(id);
  const country = await prisma.country.findUnique({ where: { id: countryId }, select: COUNTRY_SELECT });
  if (!country) throw new ReferentialError(404, "NOT_FOUND", "Pays introuvable.");
  const reasons = [];
  if (country._count.organisationCountries) reasons.push(`retenu dans la zone de ${plural(country._count.organisationCountries, "offre", "offres")}`);
  if (country._count.organizations) {
    reasons.push(`membre de ${plural(country._count.organizations, "organisation", "organisations")} (${country.organizations.slice(0, 4).map((o) => o.name).join(", ")}${country.organizations.length > 4 ? "…" : ""})`);
  }
  if (reasons.length) {
    throw new ReferentialError(409, "IN_USE", `« ${country.name} » ne peut pas être supprimé : il est ${reasons.join(" et ")}. Retirez-le d'abord de ces éléments.`, {
      offers: country._count.organisationCountries,
      organizations: country._count.organizations,
    });
  }
  await prisma.$transaction(async (tx) => {
    await tx.country.delete({ where: { id: countryId } });
    await audit(tx, AUDIT_ACTIONS.REFERENTIAL_DELETE, actor, "COUNTRY", country);
  });
  return { deleted: true };
};

/* ========================================================================== */
/* Organisations                                                              */
/* ========================================================================== */

const ORGANIZATION_SELECT = {
  id: true,
  code: true,
  name: true,
  description: true,
  createdAt: true,
  updatedAt: true,
  areaId: true,
  area: { select: { id: true, code: true, title: true } },
  countries: { select: { id: true, code: true, name: true }, orderBy: { name: "asc" } },
  _count: { select: { countries: true, areaOrganizations: true, children: true } },
};

export const listOrganizations = () => prisma.organization.findMany({ orderBy: { name: "asc" }, select: ORGANIZATION_SELECT });

const organizationInput = async (body, currentId = null) => {
  const name = requireName(body?.name, "Le nom de l'organisation");
  const duplicate = await prisma.organization.findFirst({
    where: { name: { equals: name, mode: "insensitive" }, ...(currentId ? { id: { not: currentId } } : {}) },
    select: { name: true },
  });
  if (duplicate) throw new ReferentialError(409, "DUPLICATE", `L'organisation « ${duplicate.name} » existe déjà.`, { field: "name" });

  if (!body?.areaId) throw new ReferentialError(400, "ZONE_REQUIRED", "La zone de l'organisation est obligatoire.", { field: "areaId" });
  const area = await prisma.area.findFirst({ where: { id: idOf(body.areaId), code: { in: REFERENCE_ZONE_CODES } }, select: { id: true } });
  if (!area) throw new ReferentialError(400, "ZONE_INVALID", "La zone choisie n'est pas une zone de référence.", { field: "areaId" });

  const ids = [...new Set((Array.isArray(body?.countryIds) ? body.countryIds : []).map(Number).filter((n) => Number.isInteger(n) && n > 0))];
  if (ids.length) {
    const found = await prisma.country.count({ where: { id: { in: ids } } });
    if (found !== ids.length) throw new ReferentialError(400, "COUNTRY_INVALID", "Un des pays sélectionnés n'existe plus. Rechargez la page.", { field: "countryIds" });
  }
  return { name, description: optionalText(body?.description), areaId: area.id, countryIds: ids };
};

export const createOrganization = async (body, actor) => {
  const { countryIds, areaId, ...data } = await organizationInput(body);
  return prisma.$transaction(async (tx) => {
    const created = await tx.organization.create({
      data: { code: uniqueCode("ORG"), ...data, area: { connect: { id: areaId } }, countries: { connect: countryIds.map((id) => ({ id })) } },
      select: ORGANIZATION_SELECT,
    });
    await audit(tx, AUDIT_ACTIONS.REFERENTIAL_CREATE, actor, "ORGANIZATION", created, { countries: countryIds.length });
    return created;
  });
};

export const updateOrganization = async (id, body, actor) => {
  const organizationId = idOf(id);
  const current = await prisma.organization.findUnique({ where: { id: organizationId }, select: ORGANIZATION_SELECT });
  if (!current) throw new ReferentialError(404, "NOT_FOUND", "Organisation introuvable.");
  const { countryIds, areaId, ...data } = await organizationInput(body, organizationId);

  // Un pays retenu par une offre POUR cette organisation ne peut pas en sortir :
  // la zone de l'offre désignerait un pays qui n'appartient plus à l'organisation.
  const removed = current.countries.filter((c) => !countryIds.includes(c.id));
  if (removed.length) {
    const used = await prisma.organisationCountry.findMany({
      where: { countryId: { in: removed.map((c) => c.id) }, areaOrganisation: { organizationId } },
      select: { country: { select: { name: true } } },
      distinct: ["countryId"],
    });
    if (used.length) {
      throw new ReferentialError(409, "COUNTRY_IN_USE", `Impossible de retirer ${used.map((u) => u.country.name).join(", ")} : ${used.length > 1 ? "ces pays sont retenus" : "ce pays est retenu"} dans la zone d'au moins une offre pour cette organisation.`, { field: "countryIds" });
    }
  }

  const changed = [];
  if (data.name !== current.name) changed.push("name");
  if ((data.description ?? null) !== (current.description ?? null)) changed.push("description");
  if (areaId !== current.areaId) changed.push("zone");
  const added = countryIds.filter((cid) => !current.countries.some((c) => c.id === cid));
  if (added.length || removed.length) changed.push("countries");

  return prisma.$transaction(async (tx) => {
    const updated = await tx.organization.update({
      where: { id: organizationId },
      // Le code est un identifiant stable : il n'est jamais régénéré.
      data: { ...data, area: { connect: { id: areaId } }, countries: { set: countryIds.map((cid) => ({ id: cid })) } },
      select: ORGANIZATION_SELECT,
    });
    if (changed.length) {
      await audit(tx, AUDIT_ACTIONS.REFERENTIAL_UPDATE, actor, "ORGANIZATION", updated, { changed, countriesAdded: added.length, countriesRemoved: removed.length, previousName: current.name });
    }
    return updated;
  });
};

export const deleteOrganization = async (id, actor) => {
  const organizationId = idOf(id);
  const org = await prisma.organization.findUnique({ where: { id: organizationId }, select: ORGANIZATION_SELECT });
  if (!org) throw new ReferentialError(404, "NOT_FOUND", "Organisation introuvable.");
  const reasons = [];
  if (org._count.areaOrganizations) reasons.push(`utilisée dans la zone de ${plural(org._count.areaOrganizations, "offre", "offres")}`);
  if (org._count.children) reasons.push(`parente de ${plural(org._count.children, "organisation", "organisations")}`);
  if (reasons.length) {
    throw new ReferentialError(409, "IN_USE", `« ${org.name} » ne peut pas être supprimée : elle est ${reasons.join(" et ")}.`, {
      offers: org._count.areaOrganizations,
      children: org._count.children,
    });
  }
  await prisma.$transaction(async (tx) => {
    // Les rattachements aux pays (table de liaison) disparaissent avec elle ; les pays restent.
    await tx.organization.update({ where: { id: organizationId }, data: { countries: { set: [] }, parentOrgs: { set: [] } } });
    await tx.organization.delete({ where: { id: organizationId } });
    await audit(tx, AUDIT_ACTIONS.REFERENTIAL_DELETE, actor, "ORGANIZATION", org, { countries: org._count.countries });
  });
  return { deleted: true };
};

/* ========================================================================== */
/* Zones de référence                                                         */
/* ========================================================================== */

const zoneShape = async (area) => ({
  id: area.id,
  code: area.code,
  title: area.title,
  label: ZONE_TYPES[area.title]?.label || area.title,
  description: area.description,
  createdAt: area.createdAt,
  updatedAt: area.updatedAt,
  organizations: area.Organization?.map((o) => ({ id: o.id, name: o.name })) || [],
  _count: {
    organizations: area._count?.Organization ?? 0,
    // Offres déclarées avec ce type de zone (chacune porte sa propre copie).
    offers: await prisma.offer.count({ where: { area: { title: area.title } } }),
  },
});

const ZONE_SELECT = {
  id: true,
  code: true,
  title: true,
  description: true,
  createdAt: true,
  updatedAt: true,
  Organization: { select: { id: true, name: true }, orderBy: { name: "asc" } },
  _count: { select: { Organization: true } },
};

export const listZones = async () => {
  const areas = await prisma.area.findMany({ where: { code: { in: REFERENCE_ZONE_CODES } }, orderBy: { code: "asc" }, select: ZONE_SELECT });
  return Promise.all(areas.map(zoneShape));
};

/** Types de zone qui n'ont pas encore de zone de référence. */
export const missingZoneTypes = async () => {
  const existing = await prisma.area.findMany({ where: { code: { in: REFERENCE_ZONE_CODES } }, select: { title: true } });
  return Object.keys(ZONE_TYPES).filter((t) => !existing.some((a) => a.title === t));
};

export const createZone = async (body, actor) => {
  const type = clean(body?.title).toUpperCase();
  if (!ZONE_TYPES[type]) throw new ReferentialError(400, "TYPE_REQUIRED", "Le type de zone est obligatoire : nationale, internationale ou roaming.", { field: "title" });
  const exists = await prisma.area.findFirst({ where: { OR: [{ code: ZONE_TYPES[type].code }, { title: type, code: { in: REFERENCE_ZONE_CODES } }] }, select: { id: true } });
  if (exists) throw new ReferentialError(409, "DUPLICATE", `La zone « ${ZONE_TYPES[type].label} » existe déjà : une seule zone de référence par type.`, { field: "title" });
  const description = optionalText(body?.description);
  const created = await prisma.$transaction(async (tx) => {
    const area = await tx.area.create({ data: { code: ZONE_TYPES[type].code, title: type, description }, select: ZONE_SELECT });
    await audit(tx, AUDIT_ACTIONS.REFERENTIAL_CREATE, actor, "ZONE", area);
    return area;
  });
  return zoneShape(created);
};

const referenceZone = async (id) => {
  const area = await prisma.area.findUnique({ where: { id: idOf(id) }, select: ZONE_SELECT });
  if (!area) throw new ReferentialError(404, "NOT_FOUND", "Zone introuvable.");
  if (!REFERENCE_ZONE_CODES.includes(area.code)) {
    throw new ReferentialError(409, "TECHNICAL_ZONE", "Cette zone est la copie technique d'une offre : elle se modifie depuis l'offre, pas depuis le référentiel.");
  }
  return area;
};

/** Le type d'une zone de référence est fixé par son code : seule la description se modifie. */
export const updateZone = async (id, body, actor) => {
  const area = await referenceZone(id);
  const type = clean(body?.title).toUpperCase();
  if (type && type !== area.title) {
    throw new ReferentialError(409, "TYPE_LOCKED", "Le type d'une zone de référence ne peut pas être changé : les organisations et les offres s'y réfèrent.", { field: "title" });
  }
  const description = optionalText(body?.description);
  const updated = await prisma.$transaction(async (tx) => {
    const next = await tx.area.update({ where: { id: area.id }, data: { description }, select: ZONE_SELECT });
    if ((description ?? null) !== (area.description ?? null)) await audit(tx, AUDIT_ACTIONS.REFERENTIAL_UPDATE, actor, "ZONE", next, { changed: ["description"] });
    return next;
  });
  return zoneShape(updated);
};

export const deleteZone = async (id, actor) => {
  const area = await referenceZone(id);
  const shaped = await zoneShape(area);
  const reasons = [];
  if (shaped._count.organizations) reasons.push(`${plural(shaped._count.organizations, "organisation y est rattachée", "organisations y sont rattachées")}`);
  if (shaped._count.offers) reasons.push(`${plural(shaped._count.offers, "offre est déclarée", "offres sont déclarées")} avec ce type de zone`);
  if (reasons.length) {
    throw new ReferentialError(409, "IN_USE", `La zone « ${shaped.label} » ne peut pas être supprimée : ${reasons.join(" et ")}.`, shaped._count);
  }
  await prisma.$transaction(async (tx) => {
    await tx.area.delete({ where: { id: area.id } });
    await audit(tx, AUDIT_ACTIONS.REFERENTIAL_DELETE, actor, "ZONE", area);
  });
  return { deleted: true };
};

/** Réponse HTTP d'une erreur de référentiel (ou erreur technique). */
export const sendReferentialError = (res, error, context) => {
  if (error instanceof ReferentialError) {
    return res.status(error.status).json({ error: error.message, code: error.code, details: error.details });
  }
  console.error(`[référentiels] ${context} :`, error);
  return res.status(500).json({ error: "Une erreur technique est survenue. Réessayez dans quelques instants.", code: "SERVER_ERROR" });
};
