'use client'

import prisma from "@/services/config/auth/prisma";
import { NextResponse } from 'next/server';
import cookie from 'cookie';
import { FKTND_H, JWT_TOKEN } from '@/services/tools/constants';
import { verifyPassword } from '@/services/config/auth/hash';
import { isValidEmail } from '@/services/config/auth/userValidation';
import { signToken } from "@/services/config/auth/jwt";
import { sessionCookie } from "@/services/config/auth/sessionCookie";
import { blockedByRateLimit, resetAttempts } from "@/services/config/auth/rateLimit";
import { recordSessionEvent } from "@/services/audit/sessionAudit";

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { verskth } = req.body;
    if (verskth != FKTND_H) {
      return res.status(405).json({ message: 'Requête non autorisée' });
    }
    const { email, password } = req.body;

    // 1. Vérifier les champs obligatoires
    if (!email || !password) {
      res.status(400).json({ error: 'Tous les champs sont requis.' });
      return;
    }

    // 2. Valider l'email et le mot de passe
    if (!isValidEmail(email)) {
      res.status(400).json({ error: 'Email non valide.' });
      return;
    }

    // Bourrage d'identifiants : 10 tentatives par quart d'heure et par
    // couple (adresse IP, e-mail).
    if (blockedByRateLimit(req, res, { preset: "login", key: email })) return;

    try {

      // BUGFIX: la requete filtrait sur `status: "ACTIVE"`, valeur ABSENTE de
      // l enumeration `Status` (ENABLE | DISABLE | PENDING | SUSPENDED).
      // Prisma rejetait donc la requete elle-meme (« Invalid value for argument
      // status ») : l erreur, avalee par le `catch`, renvoyait une 500 a CHAQUE
      // tentative   aucun compte, seed compris, ne pouvait se connecter.
      //
      // On recherche desormais par e-mail seul, puis on controle le statut
      // APRES le mot de passe : un compte desactive recoit ainsi un message
      // explicite, sans que l existence d un compte soit revelee a qui ne
      // connait pas son mot de passe.
      const user = await prisma.user.findUnique({
        where: { email: String(email).trim().toLowerCase() },
        include:{
          profile:true,
        }
      });

      if (!user) {
        await recordSessionEvent(req, { action: "LOGIN_FAILED", email, space: "admin", reason: "UNKNOWN_ACCOUNT" });
        return res.status(401).json({ error: "Informations d'identification invalides" });
      }

      const isValid = await verifyPassword(password, user.password);

      if (!isValid) {
        await recordSessionEvent(req, { action: "LOGIN_FAILED", user, email, space: "admin", reason: "BAD_PASSWORD" });
        return res.status(401).json({ error: "Informations d'identification invalides" });
      }

      if (user.status !== "ENABLE") {
        const reasons = {
          PENDING:
            "Votre compte n'est pas encore activé. Confirmez votre adresse e-mail à l'aide du lien reçu.",
          SUSPENDED:
            "Votre compte est suspendu. Contactez l'ARTCI pour en connaître la raison.",
          DISABLE:
            "Votre compte est désactivé. Contactez l'ARTCI pour le réactiver.",
        };
        await recordSessionEvent(req, { action: "LOGIN_REFUSED", user, email, space: "admin", reason: user.status });
        return res.status(403).json({
          error: reasons[user.status] || "Votre compte n'est pas actif.",
          reason: user.status,
        });
      }

      // `userCode` lie le jeton au compte : après une réinitialisation de la
      // base (seed), le même identifiant numérique peut désigner un autre
      // utilisateur ; la session est alors refusée au lieu d'être usurpée.
      const token = signToken({ userId: user.id, userCode: user.code, profile: user.profile });

      const _user = {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        profile:user.profile
      }

      res.setHeader("Set-Cookie", sessionCookie(token, req));
      resetAttempts(req, { preset: "login", key: email });
      await recordSessionEvent(req, { action: "LOGIN", user, space: "admin" });

      return res.status(200).json({ token, user: _user });

    } catch (error) {
      // L erreur etait avalee sans trace : c est ce qui a masque la cause du
      // defaut ci-dessus. Elle est journalisee cote serveur, jamais renvoyee.
      console.error("Connexion   erreur :", error?.message);
      res.status(500).json({ error: 'Erreur lors de la connexion.' });
    }

  }
  else {
    res.status(405).json({ error: 'Méthode non autorisée.' });
  }
}
