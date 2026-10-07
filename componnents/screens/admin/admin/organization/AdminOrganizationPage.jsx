import React, { useEffect, useMemo, useState } from "react";
import AdminMainContainerPage from "../../AdminMainContainerPage";
import EntityStatsPanel from "@/componnents/stats/EntityStatsPanel";
import ReferentialManager from "../referential/ReferentialManager";
import { computeOrganizationStats } from "@/services/tools/entityStats";
import { ORGANIZATION_EXPORT_COLUMNS } from "@/services/tools/exportData";
import { getAdminMainOrganizations } from "@/services/api/admin/organizations/organizationsApiServices";
import { listReferential } from "@/services/api/admin/referentialApiService";

/**
 * Gestion des organisations (regroupements de pays : CEDEAO, UEMOA, Europe…).
 *
 * Réécrite : une modification régénérait le code de l'organisation, ne
 * pouvait qu'AJOUTER des pays (jamais en retirer), et seules les zones
 * nationale / internationale étaient proposées. Les règles (doublons,
 * organisation ou pays encore utilisés par une offre) sont dans
 * referentialService.
 */
const ZONE_LABELS = { NATIONAL: "Nationale", INTERNATIONAL: "Internationale", ROAMING: "Roaming" };

const CONFIG = {
  resource: "organization",
  title: "Gestion des organisations",
  subtitle: "Regroupements de pays proposés pour les zones des offres internationales et roaming.",
  icon: "bi-diagram-3",
  singular: "l'organisation",
  addLabel: "Ajouter une organisation",
  searchPlaceholder: "Rechercher une organisation, un code ou un pays membre…",
  name: (o) => o.name,
  search: (o) => `${o.name} ${o.code} ${(o.countries || []).map((c) => c.name).join(" ")}`,
  filters: [
    {
      key: "zone",
      label: "Zone",
      options: (ctx) => (ctx.zones || []).map((z) => ({ value: String(z.id), label: z.label })),
      test: (o, v) => String(o.areaId) === String(v),
    },
    {
      key: "usage",
      label: "Utilisation",
      options: [
        { value: "USED", label: "Utilisée par une offre" },
        { value: "FREE", label: "Non utilisée" },
        { value: "EMPTY", label: "Sans pays" },
      ],
      test: (o, v) => (v === "USED" ? o._count.areaOrganizations > 0 : v === "FREE" ? !o._count.areaOrganizations : !o._count.countries),
    },
  ],
  columns: [
    { field: "name", header: "Organisation", body: (o) => <b>{o.name}</b> },
    { field: "code", header: "Code", body: (o) => <span className="ref-mono">{o.code}</span> },
    { field: "area.title", header: "Zone", body: (o) => <span className="ref-badge">{ZONE_LABELS[o.area?.title] || o.area?.title}</span> },
    { field: "_count.countries", header: "Pays", body: (o) => o._count.countries },
    { field: "_count.areaOrganizations", header: "Offres", body: (o) => o._count.areaOrganizations },
  ],
  fields: (ctx) => [
    { name: "name", label: "Nom de l'organisation", type: "text", required: true, placeholder: "Ex. UEMOA" },
    { name: "areaId", label: "Zone", type: "select", required: true, options: (ctx.zones || []).map((z) => ({ value: String(z.id), label: z.label })) },
    {
      name: "countryIds",
      label: "Pays membres",
      type: "multiselect",
      options: (ctx.countries || []).map((c) => ({ value: c.id, label: c.name })),
      placeholder: "Aucun pays",
      help: "Un pays retenu par une offre pour cette organisation ne peut pas en être retiré.",
    },
    { name: "description", label: "Description", type: "textarea", placeholder: "Précisions éventuelles" },
  ],
  toForm: (o) => ({ name: o?.name || "", areaId: o?.areaId ? String(o.areaId) : "", countryIds: (o?.countries || []).map((c) => c.id), description: o?.description || "" }),
  toPayload: (v) => ({ name: v.name, areaId: Number(v.areaId), countryIds: v.countryIds, description: v.description }),
  view: (o) => [
    { label: "Code", value: o.code },
    { label: "Zone", value: ZONE_LABELS[o.area?.title] || o.area?.title },
    { label: `Pays membres (${o._count.countries})`, value: o.countries?.length ? o.countries.map((c) => c.name).join(", ") : "Aucun" },
    { label: "Offres", value: `${o._count.areaOrganizations} offre(s) utilisent cette organisation` },
    { label: "Description", value: o.description },
  ],
  usage: (o) => {
    const parts = [];
    if (o?._count?.areaOrganizations) parts.push(`utilisée dans la zone de ${o._count.areaOrganizations} offre(s)`);
    if (o?._count?.children) parts.push(`parente de ${o._count.children} organisation(s)`);
    return parts.length ? parts.join(" et ") : null;
  },
  exportColumns: ORGANIZATION_EXPORT_COLUMNS,
  exportFile: "compartic_organisations",
};

export default function AdminOrganizationPage() {
  const [organizations, setOrganizations] = useState(null);
  const [mainOrganizations, setMainOrganizations] = useState(null);
  const [context, setContext] = useState({ zones: [], countries: [] });

  // Listes des formulaires : zones de référence et pays.
  useEffect(() => {
    (async () => {
      const [zones, countries, mains] = await Promise.all([listReferential("area"), listReferential("country"), getAdminMainOrganizations()]);
      setContext({ zones: zones.ok ? zones.data.items : [], countries: countries.ok ? countries.data.items : [] });
      setMainOrganizations(Array.isArray(mains) ? mains : []);
    })();
  }, []);

  const stats = useMemo(() => computeOrganizationStats(organizations, mainOrganizations), [organizations, mainOrganizations]);

  return (
    <AdminMainContainerPage
      active="org"
      children={
        <div className="container-fluid pt-3">
          <ReferentialManager
            config={CONFIG}
            context={context}
            onLoaded={setOrganizations}
            stats={
              <EntityStatsPanel
                storageKey="stats-organizations"
                title="Statistiques des organisations"
                subtitle="Organisations régionales et internationales, zones et pays couverts."
                loading={!organizations || !mainOrganizations}
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
