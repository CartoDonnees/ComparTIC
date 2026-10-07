/**
 * Caractère promotionnel d'une offre.
 *
 * Une offre est promotionnelle lorsque `offerType` vaut 1 ; elle est alors
 * accompagnée d'une ligne `SpecialPromotion` qui porte son type et sa durée.
 * C'est la présence de cette ligne   et elle seule   qui distingue ensuite une
 * promotion d'une offre de base : liste des offres parentes possibles,
 * affichage du comparateur, contrôles de l'ARTCI.
 *
 * DÉFAUT CORRIGÉ : les deux routes d'enregistrement ne créaient cette ligne que
 * pour `promoType == "SPECIAL"`. Les trois autres types du formulaire (FLASH,
 * PERIOD, CUSTOMIZE) étaient enregistrés SANS promotion : l'offre devenait donc
 * une offre de base, en silence. Et comme la durée n'était jamais transmise par
 * la couche cliente, même le cas « SPECIAL » échouait (`Number(undefined)`
 * vaut NaN, refusé par Prisma sur un champ Float)   l'offre restait alors
 * créée, sa promotion non.
 */

/** Valeurs acceptées par l'énumération `PromoType` du schéma. */
export const PROMO_TYPES = ["FLASH", "PERIOD", "SPECIAL", "CUSTOMIZE"];

/** Libellés affichés à l'écran, pour les messages d'erreur. */
export const PROMO_LABELS = {
  FLASH: "FLASH",
  PERIOD: "PERIODIQUE",
  SPECIAL: "SPECIALE",
  CUSTOMIZE: "PERSONALISEE",
};

/** L'offre déclarée est-elle une offre promotionnelle ? */
export const isPromotionalOffer = (offerType) => Number(offerType) === 1;

/**
 * Contrôle et prépare la ligne de promotion à créer avec l'offre.
 *
 * @returns {{ok:true, data:null}}            offre de base : rien à créer
 * @returns {{ok:true, data:object}}          offre promotionnelle valide
 * @returns {{ok:false, error:string}}        déclaration promotionnelle incomplète
 */
export const buildPromotionData = ({
  offerType,
  promoType,
  duration,
  prefix = "PROMO",
}) => {
  if (!isPromotionalOffer(offerType)) return { ok: true, data: null };

  const type = String(promoType || "").trim().toUpperCase();
  if (!PROMO_TYPES.includes(type)) {
    return {
      ok: false,
      error:
        "Le type de l'offre promotionnelle est manquant ou inconnu. Valeurs attendues : " +
        PROMO_TYPES.map((t) => PROMO_LABELS[t]).join(", ") +
        ".",
    };
  }

  const value = Number(duration);
  if (!Number.isFinite(value) || value <= 0) {
    return {
      ok: false,
      error:
        "La durée de l'offre promotionnelle est manquante ou invalide : indiquez un nombre de jours supérieur à zéro.",
    };
  }

  return {
    ok: true,
    data: {
      // Le suffixe aléatoire écarte toute collision entre deux déclarations
      // faites dans la même milliseconde.
      code: `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      type,
      duration: value,
    },
  };
};

export default buildPromotionData;
