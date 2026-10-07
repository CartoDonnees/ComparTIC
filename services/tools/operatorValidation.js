/**
 * Règles de validation d'un opérateur  - partagées par l'API et le formulaire.
 * Module sans dépendance serveur.
 */

export const OPERATOR_TYPES = [
  { value: "MOBILE", label: "Mobile" },
  { value: "FIXE", label: "Fixe" },
  { value: "HYBRIDE", label: "Hybride (mobile et fixe)" },
];

export const OPERATOR_STATUSES = [
  { value: "ENABLE", label: "Actif" },
  { value: "PENDING", label: "En attente" },
  { value: "SUSPENDED", label: "Suspendu" },
  { value: "DISABLE", label: "Désactivé" },
];

const HEX = /^#[0-9a-fA-F]{6}$/;

/**
 * Normalise et contrôle les champs d'un opérateur.
 * @returns {{ ok: boolean, data?: object, errors?: Record<string,string> }}
 */
export const validateOperator = (input = {}, { partial = false } = {}) => {
  const errors = {};
  const data = {};

  const name = typeof input.name === "string" ? input.name.trim() : "";
  if (!partial || input.name !== undefined) {
    if (!name) errors.name = "Le nom est obligatoire.";
    else if (name.length > 80) errors.name = "Le nom ne doit pas dépasser 80 caractères.";
    else data.name = name.toUpperCase();
  }

  if (!partial || input.type !== undefined) {
    if (!OPERATOR_TYPES.some((t) => t.value === input.type)) errors.type = "Choisissez le type de réseau.";
    else data.type = input.type;
  }

  if (!partial || input.color !== undefined) {
    if (!HEX.test(String(input.color || ""))) errors.color = "Choisissez une couleur (format #RRGGBB).";
    else data.color = String(input.color).toUpperCase();
  }

  if (!partial || input.status !== undefined) {
    const status = input.status || "ENABLE";
    if (!OPERATOR_STATUSES.some((s) => s.value === status)) errors.status = "Statut invalide.";
    else data.status = status;
  }

  if (input.description !== undefined) {
    const d = input.description == null ? "" : String(input.description).trim();
    if (d.length > 2000) errors.description = "La description ne doit pas dépasser 2000 caractères.";
    else data.description = d || null;
  }

  if (input.imagePath !== undefined) {
    const p = input.imagePath == null ? null : String(input.imagePath);
    // Nom de fichier simple : jamais de chemin (le fichier est servi par nom).
    if (p && !/^[\w.-]+$/.test(p)) errors.imagePath = "Image invalide.";
    else data.imagePath = p || null;
  }

  return Object.keys(errors).length ? { ok: false, errors } : { ok: true, data };
};
