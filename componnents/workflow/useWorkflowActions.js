import { useCallback, useEffect, useMemo, useState } from "react";
import { getWorkflowActions } from "@/services/api/workflow/workflowApiService";

/**
 * Actions de workflow disponibles, calculées par le serveur, pour une liste
 * d'offres. Renvoie `{ byId, role, reload }` où `byId[offerId]` vaut
 * `{ actions, workflowStatus, currentValidationLevel, finalLevel, … }`.
 */
export default function useWorkflowActions(offers) {
  const [byId, setById] = useState({});
  const [role, setRole] = useState(null);

  const ids = useMemo(
    () => (Array.isArray(offers) ? offers.map((o) => o?.id).filter(Boolean) : []),
    [offers],
  );
  const key = ids.join(",");

  const reload = useCallback(async () => {
    if (!ids.length) {
      setById({});
      return;
    }
    const res = await getWorkflowActions(ids);
    if (res.ok) {
      setById(res.data?.offers || {});
      setRole(res.data?.role || null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  useEffect(() => {
    reload();
  }, [reload]);

  // Les actions dépendent de décisions prises par d'autres utilisateurs :
  // rafraîchies au retour sur l'onglet et toutes les 30 s.
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") reload();
    };
    window.addEventListener("focus", onVisible);
    document.addEventListener("visibilitychange", onVisible);
    const timer = setInterval(() => document.visibilityState === "visible" && reload(), 30000);
    return () => {
      window.removeEventListener("focus", onVisible);
      document.removeEventListener("visibilitychange", onVisible);
      clearInterval(timer);
    };
  }, [reload]);

  /**
   * Empreinte des actions autorisées.
   *
   * PrimeReact ne redessine une ligne du tableau que si sa clé (`dataKey`)
   * change : les actions, reçues APRÈS l'affichage de la liste, restaient
   * invisibles jusqu'au changement de page. Les tableaux passent cette
   * empreinte en `key` ; elle ne change que si une action, un niveau ou le
   * rôle change réellement (pas à chaque rafraîchissement de 30 s).
   */
  const signature = useMemo(
    () =>
      `${role || ""}|` +
      Object.keys(byId || {})
        .sort()
        .map((id) => {
          const info = byId[id] || {};
          return `${id}:${(info.actions || []).join(".")}:${info.currentValidationLevel ?? ""}:${info.status ?? ""}`;
        })
        .join("|"),
    [byId, role],
  );

  return { byId, role, reload, signature };
}
