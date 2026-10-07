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
import { profile } from "console";

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

    if (blockedByRateLimit(req, res, { preset: "login", key: email })) return;

    try {

      const user = await prisma.user.findUnique({
        where: { email, profile:{
            code:'PRF3-TEST'
        } },
        include:{
          profile:true,
        }
      });

      if (!user) {
        await recordSessionEvent(req, { action: "LOGIN_FAILED", email, space: "client", reason: "UNKNOWN_ACCOUNT" });
        return res.status(401).json({ error: "Informations d'identification invalides" });
      }

      const isValid = await verifyPassword(password, user.password);

      if (!isValid) {
        await recordSessionEvent(req, { action: "LOGIN_FAILED", user, email, space: "client", reason: "BAD_PASSWORD" });
        return res.status(401).json({ error: "Informations d'identification invalides" });
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
      resetAttempts(req, { preset: "login", key: email })
      await recordSessionEvent(req, { action: "LOGIN", user, space: "client" });

      return res.status(200).json({ token, user: _user });
    } catch (error) {
      res.status(500).json({ error: 'Erreur lors de la connexion.' });
    }

  }
  else {
    res.status(405).json({ error: 'Méthode non autorisée.' });
  }
}
