// pages/api/users/index.js
import { hashPassword } from "@/services/config/auth/hash";
import prisma from "@/services/config/auth/prisma";
import { appBaseUrl } from "@/services/config/appUrl";
import { notifyAccountCreated } from "@/services/config/notifications";
import { FKTND_H } from "@/services/tools/constants";
import { generateRandomString } from "@/services/tools/helper";
import { sendMail } from "@/services/config/mailer";
import { requireActor } from "@/services/config/auth/session";
import { PERMISSIONS, canAssignRole } from "@/services/rbac/permissions";
import { PROFILE_CODE_TO_ROLE, ROLES } from "@/services/rbac/roles";
import { writeAudit, AUDIT_ACTIONS } from "@/services/workflow/audit";

const USER_STATUSES = ["PENDING", "ENABLE", "SUSPENDED", "DISABLE"];

export default async function handler(req, res) {
  if (req.method === "POST") {
    const {
      code,
      firstName,
      lastName,
      email,
      imagePath,
      profileId,
      operatorId,
      serialNumber,
      description,
      status,
      verskth,
    } = req.body;

    if (verskth != FKTND_H) {
      return res.status(405).json({ message: "Requête non autorisée" });
    }

    // Gestion des utilisateurs : super administrateur et administrateur
    // uniquement, identifiés par la session.
    const actor = await requireActor(req, res, PERMISSIONS.USER_MANAGE);
    if (!actor) return;

    if (!code || !email || !firstName || !profileId || !status) {
      res.status(400).json({ error: "Tous les champs sont requis." });
      return;
    }
    if (!USER_STATUSES.includes(status)) {
      return res.status(400).json({ error: "Statut de compte invalide." });
    }

    // 3. Vérifier que l'operateur n'est pas déjà utilisé
    // On vérifie le code ET l'adresse e-mail : `email` est unique en base,
    // sans ce contrôle la création échouait avec une erreur technique Prisma.
    // (Le message précédent, « déjà enregistré pour l'année », provenait d'un
    //  autre module et n'avait pas de sens ici.)
    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ code }, { email }] },
    });

    if (existingUser) {
      return res.status(400).json({
        error:
          existingUser.email === email
            ? "Cette adresse e-mail est déjà utilisée par un autre compte."
            : "Un utilisateur portant ce code existe déjà.",
      });
    }
    const _password = "A!@" + generateRandomString(5);

    const hashedPassword = await hashPassword(_password);

    // Un compte OPÉRATEUR exige un point focal : on vérifie AVANT de créer
    // quoi que ce soit, plutôt que de laisser Prisma échouer une fois
    // l'utilisateur déjà enregistré.
    const profile = await prisma.profile.findUnique({
      where: { id: Number(profileId) },
    });
    if (!profile) {
      return res.status(400).json({ error: "Le profil sélectionné est introuvable." });
    }
    // Un administrateur ne peut ni créer un administrateur ni un super
    // administrateur : seul le super administrateur le peut.
    const targetRole = PROFILE_CODE_TO_ROLE[profile.code] || null;
    const assignable = canAssignRole(actor.role, targetRole);
    if (!assignable.ok) {
      return res.status(403).json({ error: assignable.reason, code: "ROLE_ASSIGNMENT_FORBIDDEN" });
    }
    const isOperatorProfile = targetRole === ROLES.FOCAL_POINT;
    if (isOperatorProfile) {
      if (!serialNumber || !String(serialNumber).trim()) {
        return res.status(400).json({
          error:
            "Un compte opérateur requiert un identifiant (matricule) de point focal.",
        });
      }
      if (!operatorId) {
        return res.status(400).json({
          error: "Un compte opérateur requiert la sélection d'un opérateur.",
        });
      }
    }

    try {
      // BUGFIX: l'utilisateur et son point focal étaient créés séparément.
      // Si la création du point focal échouait, le compte restait enregistré
      // SANS rattachement à son opérateur (état incohérent). On rend donc
      // l'ensemble atomique.
      const user = await prisma.$transaction(async (tx) => {
        const created = await tx.user.create({
          data: {
            code: code,
            firstName: firstName,
            lastName: lastName,
            email: email,
            status: status,
            description: description,
            imagePath: imagePath,
            password: hashedPassword,
            // Mot de passe provisoire : `passwordChangedAt` reste NULL, ce qui
            // déclenche l'écran de changement obligatoire à la connexion
            // (cf. componnents/auth/ForcePasswordChangeGate.jsx).
            passwordChangedAt: null,
            profile: { connect: { id: Number(profileId) } },
          },
        });

        if (isOperatorProfile) {
          await tx.focalPoint.create({
            data: {
              code: "FOC-" + Date.now(),
              serialNumber: String(serialNumber),
              status: "ENABLE",
              user: { connect: { id: created.id } },
              operator: { connect: { id: Number(operatorId) } },
            },
          });
        }

        await writeAudit(tx, {
          action: AUDIT_ACTIONS.USER_CREATE,
          entityType: "USER",
          entityId: created.id,
          actor,
          toStatus: status,
          metadata: { role: targetRole, profileCode: profile.code, operatorId: isOperatorProfile ? Number(operatorId) : null },
        });

        return created;
      });

      const generateRandomString = (length = 20) => {
        return [...Array(length)].map(() => Math.random().toString(36)[2]).join('');
      }
      const token = generateRandomString();

      const baseUrl = appBaseUrl(req);
      const confirmationUrl = `${baseUrl}/confirm-email?email=${email}&token=${token}`;

      // L'envoi passe par la couche `services/config/mailer` : configuration
      // unique, non bloquante, et diagnostic lisible en cas d'échec.
      await notifyAccountCreated({ userId: user.id, firstName });

      const mailResult = await sendMail({
        to: email,
        subject: "Votre compte CompareTIC",
        html: `<h2>Bienvenue, ${firstName + " " + (lastName || "")} !</h2>
          <p>Un compte vient d'être créé pour vous sur la plateforme CompareTIC de l'ARTCI.</p>
          <p>Votre mot de passe provisoire est : <b style="font-size:18px">${_password}</b></p>
          <p>Cliquez sur le lien ci-dessous pour confirmer votre compte :</p>
          <p><a href="${confirmationUrl}">Confirmer mon compte</a></p>`,
      });

      // Le mot de passe n'est renvoyé que si l'e-mail n'a pas pu partir,
      // afin que l'administrateur puisse le communiquer manuellement.
      res.status(201).json({
        ...user,
        password: undefined,
        mail: mailResult,
        temporaryPassword: mailResult.sent ? undefined : _password,
      });
    } catch (error) {
      // Message clair en cas de doublon plutôt que l'erreur technique Prisma
      if (error?.code === "P2002") {
        const field = error?.meta?.target?.[0] || "champ";
        return res.status(400).json({
          error:
            field === "email"
              ? "Cette adresse e-mail est déjà utilisée par un autre compte."
              : `Ce ${field} est déjà utilisé.`,
        });
      }
      console.error("USER CREATE ====>", error?.message);
      res.status(500).json({ error: "Le compte n'a pas pu être créé." });
    }
  } else {
    res.setHeader("Allow", ["GET", "POST"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
