import { guardRoute } from "@/services/rbac/guardRoute";
import { PERMISSIONS } from "@/services/rbac/permissions";
import { sendReferentialError } from "@/services/referential/referentialService";

/**
 * Fabrique des routes de référentiel (pays, organisations, zones).
 *
 *   GET    /api/admin/<ressource>        liste de gestion (avec compteurs d'usage)
 *   POST   /api/admin/<ressource>        création
 *   PUT    /api/admin/<ressource>/:id    modification
 *   DELETE /api/admin/<ressource>/:id    suppression (refusée si l'élément est utilisé)
 *
 * Toutes exigent la permission REFERENTIAL_MANAGE (administration), vérifiée
 * par `guardRoute` à partir de la session ; l'auteur tracé est `req.actor`.
 */
const MANAGE = PERMISSIONS.REFERENTIAL_MANAGE;

export const collectionRoute = ({ label, list, create, normalize = (b) => b, extra = null }) =>
  guardRoute(
    async (req, res) => {
      res.setHeader("Cache-Control", "no-store");
      try {
        if (req.method === "GET") return res.status(200).json({ items: await list(), ...(extra ? await extra() : {}) });
        if (req.method === "POST") return res.status(201).json(await create(await normalize(req.body || {}), req.actor));
        res.setHeader("Allow", ["GET", "POST"]);
        return res.status(405).json({ error: "Méthode non autorisée." });
      } catch (error) {
        return sendReferentialError(res, error, label);
      }
    },
    { methods: { GET: MANAGE, POST: MANAGE } },
  );

export const itemRoute = ({ label, update, remove, normalize = (b) => b }) =>
  guardRoute(
    async (req, res) => {
      res.setHeader("Cache-Control", "no-store");
      try {
        if (req.method === "PUT") return res.status(200).json(await update(req.query.id, await normalize(req.body || {}), req.actor));
        if (req.method === "DELETE") return res.status(200).json(await remove(req.query.id, req.actor));
        res.setHeader("Allow", ["PUT", "DELETE"]);
        return res.status(405).json({ error: "Méthode non autorisée." });
      } catch (error) {
        return sendReferentialError(res, error, label);
      }
    },
    { methods: { PUT: MANAGE, DELETE: MANAGE } },
  );
