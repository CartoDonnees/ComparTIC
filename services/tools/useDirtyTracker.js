import { useCallback, useRef, useState } from "react";

/**
 * Suit si l'utilisateur a réellement modifié le formulaire.
 *
 * Permet d'avertir « aucune modification » au lieu de soumettre inutilement.
 *
 * Le chargement d'une offre déclenche plusieurs mises à jour automatiques de
 * l'état (zone, cible, modes d'accès, type d'offre) : celles-ci ne doivent PAS
 * être comptées comme des modifications de l'utilisateur. On ouvre donc une
 * courte fenêtre d'initialisation pendant laquelle `markDirty()` est ignoré.
 *
 * Utilisation :
 *   const { isDirty, markDirty, beginInit, endInit, reset } = useDirtyTracker();
 *   // dans init() :        beginInit(); ... endInit();
 *   // dans les handlers :  markDirty();
 *   // à la soumission :    if (!isDirty) { avertir; return; }
 */
export const useDirtyTracker = ({ initWindowMs = 800 } = {}) => {
  const initializing = useRef(true);
  const timer = useRef(null);
  const [isDirty, setIsDirty] = useState(false);

  /** Début du chargement : les changements automatiques sont ignorés. */
  const beginInit = useCallback(() => {
    initializing.current = true;
    if (timer.current) clearTimeout(timer.current);
    setIsDirty(false);
  }, []);

  /**
   * Fin du chargement. On laisse passer un court délai pour que les effets
   * de synchronisation déclenchés par le chargement se terminent.
   */
  const endInit = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      initializing.current = false;
    }, initWindowMs);
  }, [initWindowMs]);

  /** À appeler dans chaque handler modifiant réellement le formulaire. */
  const markDirty = useCallback(() => {
    if (!initializing.current) setIsDirty(true);
  }, []);

  /** Remet le suivi à zéro (après un enregistrement réussi par exemple). */
  const reset = useCallback(() => setIsDirty(false), []);

  return { isDirty, markDirty, beginInit, endInit, reset };
};

export default useDirtyTracker;
