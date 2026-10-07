import { guardRoute } from "@/services/rbac/guardRoute";
import { PERMISSIONS } from "@/services/rbac/permissions";
// pages/api/users/index.js
import prisma from "@/services/config/auth/prisma";
import { serverError } from "@/services/config/apiError";

async function handler(req, res) {
if (req.method === 'POST') {
    const { code, name, description,status,imagePath } = req.body;

    if (!code || !name) {
      res.status(400).json({ error: 'Tous les champs sont requis. '+code+' '+name });
      return;
    }

    // 3. Vérifier que lee service n'est pas déjà utilisé
    const existingOperator = await prisma.service.findFirst({
      where: {
        code,
      }
    });

    if (existingOperator) {
      res.status(400).json({ error: 'Cet service est déjà enregistré pour l\'année ' + year + '.', existingOperator: existingOperator });
      return;
    }

    try {
      const service = await prisma.service.create({
        data: {
          code: code,
          name:name.toUpperCase(),
          status: status,
          description: description,
          imagePath:imagePath
        },
      });
      res.status(201).json(service);
    } catch (error) {
      serverError(res, error, "pages/api/admin/services/index.js");
    }
  }
  else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

// Autorisation vérifiée côté serveur (session + permission).
export default guardRoute(handler, { methods: { POST: PERMISSIONS.REFERENTIAL_MANAGE } });
