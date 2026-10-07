import { useCallback, useEffect, useState } from "react";

/**
 * Pagination d'un DataTable PrimeReact conservée hors du tableau.
 *
 * Un tableau re-créé (changement de `key`, ex. arrivée des actions de
 * workflow) repartirait sinon à la première page avec 10 lignes. La page est
 * ramenée au début seulement si elle n'existe plus (liste filtrée plus courte).
 */
export default function useTablePaging(total, initialRows = 10) {
  const [first, setFirst] = useState(0);
  const [rows, setRows] = useState(initialRows);

  useEffect(() => {
    if (first > 0 && first >= (total || 0)) setFirst(0);
  }, [first, total]);

  const onPage = useCallback((e) => {
    setFirst(e.first);
    setRows(e.rows);
  }, []);

  return { first, rows, onPage };
}
