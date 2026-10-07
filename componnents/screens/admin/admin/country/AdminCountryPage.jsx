import React, { useMemo, useState } from "react";
import AdminMainContainerPage from "../../AdminMainContainerPage";
import EntityStatsPanel from "@/componnents/stats/EntityStatsPanel";
import ReferentialManager from "../referential/ReferentialManager";
import { computeCountryStats } from "@/services/tools/entityStats";
import { COUNTRY_EXPORT_COLUMNS } from "@/services/tools/exportData";

/**
 * Gestion des pays.
 *
 * Réécrite : « Modifier » créait un second pays (la modification appelait la
 * création), l'indicatif n'était pas saisissable, le bouton « Fermer » ne
 * fermait rien et une suppression refusée par la base restait sans message.
 * Les règles (doublons, pays encore utilisé) sont dans referentialService.
 */
const usageOf = (c) => {
  const parts = [];
  if (c?._count?.organisationCountries) parts.push(`retenu dans la zone de ${c._count.organisationCountries} offre(s)`);
  if (c?._count?.organizations) parts.push(`membre de ${c._count.organizations} organisation(s)`);
  return parts.length ? parts.join(" et ") : null;
};

const CONFIG = {
  resource: "country",
  title: "Gestion des pays",
  subtitle: "Pays proposés dans les organisations et dans les zones des offres internationales et roaming.",
  icon: "bi-globe2",
  singular: "le pays",
  addLabel: "Ajouter un pays",
  searchPlaceholder: "Rechercher un pays, un code ou un indicatif…",
  name: (c) => c.name,
  search: (c) => `${c.name} ${c.code} ${c.indicator ? `+${c.indicator}` : ""}`,
  filters: [
    {
      key: "usage",
      label: "Utilisation",
      options: [
        { value: "ORG", label: "Membre d'une organisation" },
        { value: "OFFER", label: "Retenu dans une offre" },
        { value: "FREE", label: "Non utilisé" },
      ],
      test: (c, v) =>
        v === "ORG" ? c._count.organizations > 0 : v === "OFFER" ? c._count.organisationCountries > 0 : !c._count.organizations && !c._count.organisationCountries,
    },
  ],
  columns: [
    { field: "name", header: "Pays", body: (c) => <b>{c.name}</b> },
    { field: "code", header: "Code", body: (c) => <span className="ref-mono">{c.code}</span> },
    { field: "indicator", header: "Indicatif", body: (c) => (c.indicator ? `+${c.indicator}` : "  ") },
    { field: "_count.organizations", header: "Organisations", body: (c) => c._count.organizations },
    { field: "_count.organisationCountries", header: "Offres", body: (c) => c._count.organisationCountries },
  ],
  fields: () => [
    { name: "name", label: "Nom du pays", type: "text", required: true, placeholder: "Ex. Burkina Faso" },
    { name: "indicator", label: "Indicatif téléphonique", type: "number", min: 1, max: 9999, placeholder: "Ex. 226", help: "Sans le « + ». Facultatif." },
    { name: "description", label: "Description", type: "textarea", placeholder: "Précisions éventuelles" },
  ],
  toForm: (c) => ({ name: c?.name || "", indicator: c?.indicator ?? "", description: c?.description || "" }),
  toPayload: (v) => ({ name: v.name, indicator: v.indicator, description: v.description }),
  view: (c) => [
    { label: "Code", value: c.code },
    { label: "Indicatif", value: c.indicator ? `+${c.indicator}` : null },
    { label: "Organisations", value: c.organizations?.length ? c.organizations.map((o) => o.name).join(", ") : "Aucune" },
    { label: "Offres", value: `${c._count.organisationCountries} offre(s) retiennent ce pays` },
    { label: "Description", value: c.description },
  ],
  usage: usageOf,
  exportColumns: COUNTRY_EXPORT_COLUMNS,
  exportFile: "compartic_pays",
};

export default function AdminCountryPage() {
  const [countries, setCountries] = useState(null);
  const stats = useMemo(() => computeCountryStats(countries), [countries]);

  return (
    <AdminMainContainerPage
      active="ctr"
      children={
        <div className="container-fluid pt-3">
          <ReferentialManager
            config={CONFIG}
            onLoaded={setCountries}
            stats={
              <EntityStatsPanel
                storageKey="stats-countries"
                title="Statistiques des pays"
                subtitle="Pays rattachés aux organisations et ciblés dans les zones des offres."
                loading={!countries}
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
