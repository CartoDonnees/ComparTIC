import React, { useCallback, useEffect, useMemo, useState } from "react";
import AdminMainContainerPage from "../../AdminMainContainerPage";
import EntityStatsPanel from "@/componnents/stats/EntityStatsPanel";
import ReferentialManager from "../referential/ReferentialManager";
import { computeAreaStats } from "@/services/tools/entityStats";
import { getAreas } from "@/services/api/areas/areasApiServices";

/**
 * Gestion des zones.
 *
 * Il existe trois types de zone (nationale, internationale, roaming) et une
 * zone de RÉFÉRENCE par type, à laquelle se rattachent les organisations.
 * L'ancien écran listait aussi la copie technique créée pour chaque offre
 * (une quarantaine de lignes identiques), acceptait un titre libre que la
 * base refusait, et supprimait sans contrôle. Seules les zones de référence
 * se gèrent ici ; les règles sont dans referentialService.
 *
 * Les statistiques restent calculées sur toutes les zones, copies techniques
 * comprises : ce sont elles qui portent la répartition des offres.
 */
const CONFIG = {
  resource: "area",
  title: "Gestion des zones",
  subtitle: "Zones de référence : une par type. Les organisations s'y rattachent ; chaque offre déclare son type de zone.",
  icon: "bi-map",
  singular: "la zone",
  addLabel: "Ajouter une zone",
  addDisabledHint: "Les trois types de zone existent déjà : une seule zone de référence par type.",
  canAdd: (ctx) => (ctx.missingTypes || []).length > 0,
  searchPlaceholder: "Rechercher une zone…",
  name: (z) => `Zone ${z.label}`,
  search: (z) => `${z.label} ${z.code} ${z.description || ""}`,
  filters: [
    {
      key: "usage",
      label: "Utilisation",
      options: [
        { value: "USED", label: "Avec organisations ou offres" },
        { value: "FREE", label: "Non utilisée" },
      ],
      test: (z, v) => (v === "USED" ? z._count.organizations + z._count.offers > 0 : z._count.organizations + z._count.offers === 0),
    },
  ],
  columns: [
    { field: "label", header: "Zone", body: (z) => <b>{z.label}</b> },
    { field: "code", header: "Code", body: (z) => <span className="ref-mono">{z.code}</span> },
    { field: "description", header: "Description", body: (z) => z.description || "  " },
    { field: "_count.organizations", header: "Organisations", body: (z) => z._count.organizations },
    { field: "_count.offers", header: "Offres", body: (z) => z._count.offers },
  ],
  fields: (ctx, form) => [
    {
      name: "title",
      label: "Type de zone",
      type: "select",
      required: true,
      readOnlyOnEdit: true,
      options: Object.entries(ctx.types || {})
        .filter(([key]) => form.id || (ctx.missingTypes || []).includes(key))
        .map(([key, t]) => ({ value: key, label: t.label })),
      help: "Seuls les types sans zone de référence sont proposés.",
      readOnlyHelp: "Le type d'une zone de référence ne se modifie pas : organisations et offres s'y réfèrent.",
    },
    { name: "description", label: "Description", type: "textarea", placeholder: "Périmètre de la zone" },
  ],
  toForm: (z) => ({ title: z?.title || "", description: z?.description || "" }),
  toPayload: (v) => ({ title: v.title, description: v.description }),
  view: (z) => [
    { label: "Code", value: z.code },
    { label: "Type", value: z.label },
    { label: `Organisations (${z._count.organizations})`, value: z.organizations?.length ? z.organizations.map((o) => o.name).join(", ") : "Aucune" },
    { label: "Offres", value: `${z._count.offers} offre(s) déclarées avec ce type de zone` },
    { label: "Description", value: z.description },
  ],
  usage: (z) => {
    const parts = [];
    if (z?._count?.organizations) parts.push(`${z._count.organizations} organisation(s) y sont rattachées`);
    if (z?._count?.offers) parts.push(`${z._count.offers} offre(s) sont déclarées avec ce type`);
    return parts.length ? parts.join(" et ") : null;
  },
};

export default function AdminAreaPage() {
  const [areas, setAreas] = useState(null);
  const loadStats = useCallback(async () => {
    const list = await getAreas();
    setAreas(Array.isArray(list) ? list : []);
  }, []);
  useEffect(() => {
    loadStats();
  }, [loadStats]);
  const stats = useMemo(() => computeAreaStats(areas), [areas]);

  return (
    <AdminMainContainerPage
      active="area"
      children={
        <div className="container-fluid pt-3">
          <ReferentialManager
            config={CONFIG}
            onChanged={loadStats}
            stats={
              <EntityStatsPanel
                storageKey="stats-areas"
                title="Statistiques des zones"
                subtitle="Zones géographiques des offres : types, utilisation et organisations ciblées."
                loading={!areas}
                kpis={stats.kpis}
                breakdowns={stats.breakdowns}
                lists={stats.lists}
              />
            }
          />
        </div>
      }
    />
  );
}
