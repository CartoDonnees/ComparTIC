/**
 * Rôles de ComparTIC et correspondance avec les profils en base.
 *
 * Les codes de profil historiques (`PRF0-TEST`…`PRF3-TEST`) sont CONSERVÉS :
 * ils sont utilisés dans toute l'application. Les rôles du workflow s'y
 * ajoutent. Le reste du code doit raisonner en RÔLES (`ROLES.*`), jamais en
 * codes de profil, pour que la correspondance ne vive qu'ici.
 *
 * Module sans dépendance serveur : importable côté navigateur.
 */

export const ROLES = {
  SUPER_ADMIN: "SUPER_ADMIN",
  ADMIN: "ADMIN",
  SUPERVISOR: "SUPERVISOR",
  VALIDATOR_1: "VALIDATOR_1",
  VALIDATOR_2: "VALIDATOR_2",
  VALIDATOR_3: "VALIDATOR_3",
  VALIDATOR_4: "VALIDATOR_4",
  FOCAL_POINT: "FOCAL_POINT",
  CLIENT: "CLIENT",
};

/** Code de profil → rôle. */
export const PROFILE_CODE_TO_ROLE = {
  "PRF-SUPERADMIN": ROLES.SUPER_ADMIN,
  "PRF0-TEST": ROLES.ADMIN,
  "PRF1-TEST": ROLES.SUPERVISOR,
  "PRF-VAL1": ROLES.VALIDATOR_1,
  "PRF-VAL2": ROLES.VALIDATOR_2,
  "PRF-VAL3": ROLES.VALIDATOR_3,
  "PRF-VAL4": ROLES.VALIDATOR_4,
  "PRF2-TEST": ROLES.FOCAL_POINT,
  "PRF3-TEST": ROLES.CLIENT,
};

/** Rôle → code de profil. */
export const ROLE_TO_PROFILE_CODE = Object.fromEntries(
  Object.entries(PROFILE_CODE_TO_ROLE).map(([code, role]) => [role, code]),
);

/** Libellés affichés. */
export const ROLE_LABELS = {
  SUPER_ADMIN: "Super administrateur",
  ADMIN: "Administrateur",
  SUPERVISOR: "Superviseur",
  VALIDATOR_1: "Validateur 1   Responsable / Agent",
  VALIDATOR_2: "Validateur 2   Chef de service",
  VALIDATOR_3: "Validateur 3   Chef de département",
  VALIDATOR_4: "Validateur 4   Directeur",
  FOCAL_POINT: "Point focal opérateur",
  CLIENT: "Client",
};

/** Rôle d'un utilisateur chargé avec son profil ; null si inconnu. */
export const roleOf = (user) =>
  PROFILE_CODE_TO_ROLE[user?.profile?.code] || user?.role || null;

const VALIDATOR_LEVEL = {
  VALIDATOR_1: 1,
  VALIDATOR_2: 2,
  VALIDATOR_3: 3,
  VALIDATOR_4: 4,
};

/** Niveau de validation d'un rôle (1 à 4), ou null. */
export const validatorLevelOf = (role) => VALIDATOR_LEVEL[role] ?? null;

/** Rôle de validateur correspondant à un niveau. */
export const validatorRoleOfLevel = (level) =>
  Object.keys(VALIDATOR_LEVEL).find((r) => VALIDATOR_LEVEL[r] === Number(level)) || null;

export const isValidatorRole = (role) => validatorLevelOf(role) !== null;

/** Super administrateur ou administrateur. */
export const isAdministration = (role) =>
  role === ROLES.SUPER_ADMIN || role === ROLES.ADMIN;

/** Profils de l'espace de gestion (tous sauf le client du site public). */
export const isBackOffice = (role) => !!role && role !== ROLES.CLIENT;

/** Rôles que l'on ne peut attribuer ni modifier qu'en étant super admin. */
export const PRIVILEGED_ROLES = [ROLES.SUPER_ADMIN, ROLES.ADMIN];

export default ROLES;
