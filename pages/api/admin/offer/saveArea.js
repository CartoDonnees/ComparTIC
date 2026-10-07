import prisma from "@/services/config/auth/prisma";
import { FKTND_H } from "@/services/tools/constants";
import { requireEditableOffer } from "@/services/workflow/offerGuards";
import {
  isNationalArea,
  normalizeAreaTitle,
} from "@/services/tools/areaTitle";
import { serverError } from "@/services/config/apiError";

/**
 * Enregistre la zone géographique d'une offre, ses organisations et les pays
 * retenus pour chacune.
 *
 * Trois corrections :
 *
 *  1. TITRE   la traduction du libellé plaçait en ROAMING tout ce qui n'était
 *     pas exactement "NATIONALE" ou "INTERNATIONALE". À la modification, le
 *     formulaire renvoie l'énuméré chargé depuis la base ("INTERNATIONAL",
 *     "NATIONAL") tant que l'admin ne retouche pas le sélecteur : la zone
 *     basculait donc silencieusement en ROAMING. La normalisation accepte
 *     désormais les deux formes (cf. services/tools/areaTitle).
 *
 *  2. ORGANISATIONS SANS PAYS   la condition `if (area && organizations &&
 *     countries)` abandonnait TOUT l'enregistrement quand aucun pays n'était
 *     sélectionné : les organisations elles-mêmes étaient perdues. Elles sont
 *     maintenant enregistrées indépendamment des pays.
 *
 *  3. ZONE PRÉCÉDENTE   chaque enregistrement créait une nouvelle Area sans
 *     supprimer l'ancienne, qui restait en base rattachée à rien (6 zones
 *     orphelines constatées). L'ancienne zone de l'offre est désormais
 *     supprimée, sauf si une autre offre ou un monitoring s'y rattache encore.
 */
export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { offerId, title, organizations, countries, verskth } = req.body;

  if (verskth != FKTND_H) {
    return res.status(405).json({ message: "Requête non autorisée" });
  }
  if (!offerId) {
    return res.status(400).json({ error: "L'identifiant de l'offre est requis." });
  }
  // Session, droits, opérateur et absence de décision (moteur de workflow).
  if (!(await requireEditableOffer(req, res, offerId))) return;

  const areaTitle = normalizeAreaTitle(title);
  if (!areaTitle) {
    return res
      .status(400)
      .json({ error: `Zone géographique inconnue : « ${title} »` });
  }

  const id = Number(offerId);

  try {
    const offer = await prisma.offer.findUnique({
      where: { id },
      select: { id: true, areaId: true },
    });
    if (!offer) {
      return res.status(404).json({ error: "Offre introuvable." });
    }

    const previousAreaId = offer.areaId;

    const area = await prisma.$transaction(async (tx) => {
      const created = await tx.area.create({
        data: {
          code: "ARE-" + Date.now(),
          title: areaTitle,
          offers: { connect: [{ id }] },
        },
      });

      // Une zone nationale ne porte ni organisation ni pays.
      if (!isNationalArea(areaTitle)) {
        // `organizations` et `countries` arrivent sous forme d'objets indexés
        // par nom : on les parcourt par valeurs.
        const orgs = Object.values(organizations || {}).filter(
          (o) => o && o.id,
        );
        const ctrs = Object.values(countries || {}).filter((c) => c && c.id);

        for (const og of orgs) {
          const link = await tx.areaOrganization.create({
            data: {
              area: { connect: { id: created.id } },
              organization: { connect: { id: Number(og.id) } },
            },
          });

          // Pays retenus POUR CETTE organisation. Aucun pays sélectionné est
          // un cas valide : l'organisation est alors enregistrée seule.
          const selected = ctrs.filter(
            (ct) => Number(ct.parentId) === Number(og.id) && ct.value !== false,
          );
          for (const ct of selected) {
            await tx.organisationCountry.create({
              data: {
                areaOrganisation: { connect: { id: link.id } },
                country: { connect: { id: Number(ct.id) } },
              },
            });
          }
        }
      }

      // Suppression de l'ancienne zone si plus rien ne s'y rattache.
      if (previousAreaId && previousAreaId !== created.id) {
        // `Organization` porte elle aussi une clé étrangère vers `Area`
        // (Organization.areaId). L omettre ferait échouer la suppression sur
        // une violation de contrainte   et, la suppression se faisant dans la
        // même transaction, TOUT l enregistrement de la zone serait annulé.
        const stillUsed = await tx.area.findUnique({
          where: { id: previousAreaId },
          select: {
            _count: {
              select: { offers: true, monitorings: true, Organization: true },
            },
          },
        });
        if (
          stillUsed &&
          stillUsed._count.offers === 0 &&
          stillUsed._count.monitorings === 0 &&
          stillUsed._count.Organization === 0
        ) {
          const links = await tx.areaOrganization.findMany({
            where: { areaId: previousAreaId },
            select: { id: true },
          });
          await tx.organisationCountry.deleteMany({
            where: { areaOrganisationId: { in: links.map((l) => l.id) } },
          });
          await tx.areaOrganization.deleteMany({
            where: { areaId: previousAreaId },
          });
          await tx.area.delete({ where: { id: previousAreaId } });
        }
      }

      return created;
    });

    return res.status(201).json(area);
  } catch (error) {
    return serverError(res, error, "pages/api/admin/offer/saveArea.js");
  }
}
