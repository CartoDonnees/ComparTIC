import prisma from "@/services/config/auth/prisma";
import { verifyPassword } from "@/services/config/auth/hash";
import { signToken } from "@/services/config/auth/jwt";
import { blockedByRateLimit, resetAttempts } from "@/services/config/auth/rateLimit";
import { serverError } from "@/services/config/apiError";
import { answerPreflight } from "@/services/config/preflight";

/**
 * Connexion d'un compte GRAND PUBLIC (application mobile).
 *
 *   POST /api/public/auth/login { email, password } -> { token, user }
 *
 * Les routes de connexion du site exigent la clé `verskth`, présente dans le
 * code du navigateur : la recopier dans une application distribuée sur les
 * magasins n'aurait aucune valeur de sécurité. Cette route s'en passe et
 * s'appuie sur ce qui protège réellement l'accès : mot de passe vérifié,
 * limitation des tentatives, et jeton signé lié au compte.
 *
 * Réservée au profil client : un compte de l'espace de gestion ne peut pas se
 * connecter depuis l'application mobile.
 */

const CLIENT_PROFILE = "PRF3-TEST";

export default async function handler(req, res) {
  if (answerPreflight(req, res)) return;
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Méthode non autorisée." });
  }

  const email = String(req.body?.email || "").trim().toLowerCase();
  const password = String(req.body?.password || "");

  if (!email || !password) {
    return res.status(400).json({ error: "Adresse e-mail et mot de passe sont obligatoires." });
  }
  if (blockedByRateLimit(req, res, { preset: "login", key: email })) return undefined;

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        code: true,
        email: true,
        firstName: true,
        lastName: true,
        status: true,
        password: true,
        profile: { select: { id: true, code: true, name: true } },
      },
    });

    // Message identique dans tous les cas : ne révèle pas l'existence du compte.
    const invalid = () => res.status(401).json({ error: "Adresse e-mail ou mot de passe incorrect.", code: "INVALID_CREDENTIALS" });

    if (!user || user.profile?.code !== CLIENT_PROFILE) return invalid();
    if (!(await verifyPassword(password, user.password))) return invalid();

    if (user.status !== "ENABLE") {
      return res.status(403).json({
        error:
          user.status === "PENDING"
            ? "Votre compte n'est pas encore activé. Confirmez votre adresse e-mail."
            : "Votre compte n'est pas actif. Contactez l'ARTCI.",
        code: "ACCOUNT_INACTIVE",
      });
    }

    const token = signToken({ userId: user.id, userCode: user.code, profile: user.profile });
    resetAttempts(req, { preset: "login", key: email });

    return res.status(200).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    });
  } catch (error) {
    return serverError(res, error, "API publique : connexion");
  }
}
