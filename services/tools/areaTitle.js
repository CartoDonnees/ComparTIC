/**
 * Normalisation du libellé de zone géographique.
 *
 * Deux formes circulent dans l'application :
 *  - l'énuméré de la base   : NATIONAL | INTERNATIONAL | ROAMING
 *  - la forme française de l'interface : NATIONALE | INTERNATIONALE | ROAMING
 *
 * Les routes d'enregistrement traduisaient avec une cascade fautive :
 *
 *     title == 'INTERNATIONALE' ? 'INTERNATIONAL'
 *       : (title == 'NATIONALE' ? 'NATIONAL' : 'ROAMING')
 *
 * Tout ce qui n'était pas exactement l'une des deux formes françaises devenait
 * donc ROAMING. À la modification d'une offre, le formulaire renvoie l'énuméré
 * tel qu'il a été chargé ("INTERNATIONAL", "NATIONAL") dès lors que l'admin ne
 * retouche pas le sélecteur : la zone basculait silencieusement en ROAMING.
 */

/** @returns {"NATIONAL"|"INTERNATIONAL"|"ROAMING"|null} */
export const normalizeAreaTitle = (title) => {
  const v = (title ?? "").toString().trim().toUpperCase();
  if (!v) return null;
  // `startsWith` couvre d'un coup l'énuméré et sa forme française.
  if (v.startsWith("INTERNATIONAL")) return "INTERNATIONAL";
  if (v.startsWith("NATIONAL")) return "NATIONAL";
  if (v.startsWith("ROAMING")) return "ROAMING";
  return null;
};

/** Une zone nationale ne porte ni organisation ni pays. */
export const isNationalArea = (title) => normalizeAreaTitle(title) === "NATIONAL";

export default normalizeAreaTitle;
