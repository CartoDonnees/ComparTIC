import React, { useCallback, useEffect, useState } from "react";
import AdminMainContainerPage from "../../AdminMainContainerPage";
import DataLoader from "@/componnents/Loader/DataLoader";
import WorkflowStatusBadge from "@/componnents/workflow/WorkflowStatusBadge";
import OperatorOfferDetailsButton from "../offer/view/OperatorOfferDetailsButton";
import { JWT_TOKEN } from "@/services/tools/constants";

/**
 * « Suivi de mes offres » : l'évolution des offres de l'opérateur.
 *
 * Pour chaque offre, l'état actuel (le présent) et ce qui y a mené (le
 * passé) : versions successives, ce qui a changé de l'une à l'autre, et
 * étapes marquantes (déclaration, soumission, décision, désactivation).
 * Un bouton ouvre le détail de l'offre ou d'une de ses anciennes versions.
 *
 * Ce n'est pas le suivi de la validation : le circuit et les niveaux de
 * validation de l'ARTCI n'apparaissent pas, et le serveur ne les transmet pas
 * (`/api/operator/evolution`, réservé aux points focaux).
 */

const PAGE_SIZE = 8;

const FILTERS = [
  { value: "", label: "Toutes", count: "ALL" },
  { value: "REVIEW", label: "En cours d'examen", count: "REVIEW" },
  { value: "VALIDATED", label: "Validées", count: "VALIDATED" },
  { value: "REFUSED", label: "Refusées", count: "REFUSED" },
  { value: "DEACTIVATED", label: "Désactivées", count: "DEACTIVATED" },
  { value: "DRAFT", label: "Brouillons", count: "DRAFT" },
];

const CHANGE_ICON = { added: "bi-plus-circle", removed: "bi-dash-circle", changed: "bi-arrow-left-right", more: "bi-three-dots" };

const authHeaders = () => {
  try {
    const token = typeof window !== "undefined" ? localStorage.getItem(JWT_TOKEN) : null;
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch {
    return {};
  }
};

const formatDate = (value) => (value ? new Date(value).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }) : null);
const formatDateTime = (value) =>
  value ? new Date(value).toLocaleString("fr-FR", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "";
const money = (value) => `${Number(value).toLocaleString("fr-FR")} FCFA`;

const summaryText = (summary) => {
  if (!summary?.formulas) return "Aucune formule";
  const count = `${summary.formulas} formule${summary.formulas > 1 ? "s" : ""}`;
  if (summary.priceMin === null) return count;
  return summary.priceMin === summary.priceMax ? `${count} · ${money(summary.priceMin)}` : `${count} · de ${money(summary.priceMin)} à ${money(summary.priceMax)}`;
};

export default function OperatorActivityPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(() => new Set());

  // Recherche : la liste suit la saisie avec un léger délai.
  useEffect(() => {
    const timer = setTimeout(() => {
      setQuery(search.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const load = useCallback(async () => {
    setError(null);
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: String(PAGE_SIZE) });
      if (status) params.set("status", status);
      if (query) params.set("q", query);
      const res = await fetch(`/api/operator/evolution?${params}`, { credentials: "same-origin", cache: "no-store", headers: authHeaders() });
      const payload = await res.json().catch(() => null);
      if (!res.ok) throw new Error(payload?.error || "Chargement impossible.");
      setData(payload);
    } catch (e) {
      setData({ items: [], total: 0, pageCount: 1, page: 1, counts: {} });
      setError(e.message);
    }
  }, [page, status, query]);

  useEffect(() => {
    setData(null);
    load();
  }, [load]);

  const toggle = (id) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const detailsButton = (version, label) => <OperatorOfferDetailsButton offerId={version.id} label={label} onError={setError} />;

  const items = data?.items || [];
  const counts = data?.counts || {};

  return (
    <AdminMainContainerPage
      active="activity"
      children={
        <div className="vq evo">
          <header className="vq-head">
            <div className="vq-head-main">
              <span className="vq-head-icon" aria-hidden="true">
                <i className="bi bi-clock-history"></i>
              </span>
              <div className="min-w-0">
                <h1 className="vq-title">Suivi de mes offres</h1>
                <div className="vq-sub">
                  L'évolution de vos offres : leur état actuel, leurs versions précédentes et les étapes qui y ont mené
                  {data ? ` · ${data.total} offre(s)` : ""}
                </div>
              </div>
            </div>
            <div className="vq-head-actions">
              <button type="button" className="btn btn-light btn-sm" onClick={load} disabled={!data}>
                <i className="bi bi-arrow-clockwise me-1" aria-hidden="true"></i> Actualiser
              </button>
            </div>
          </header>

          <div className="evo-toolbar">
            <div className="evo-filters" role="tablist" aria-label="Filtrer par état">
              {FILTERS.map((f) => (
                <button
                  key={f.value || "all"}
                  type="button"
                  role="tab"
                  aria-selected={status === f.value}
                  className={status === f.value ? "is-active" : ""}
                  onClick={() => {
                    setStatus(f.value);
                    setPage(1);
                  }}
                >
                  {f.label}
                  {counts[f.count] !== undefined && <span>{counts[f.count]}</span>}
                </button>
              ))}
            </div>
            <label className="evo-search">
              <i className="bi bi-search" aria-hidden="true"></i>
              <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Nom ou code de l'offre" aria-label="Rechercher une offre" />
            </label>
          </div>

          {error && (
            <div className="vq-error" role="alert">
              <i className="bi bi-exclamation-triangle" aria-hidden="true"></i> {error}
            </div>
          )}

          {!data && <DataLoader label="Chargement de vos offres…" rows={4} />}

          {data && !items.length && !error && (
            <div className="vq-empty">
              <i className="bi bi-inbox" aria-hidden="true"></i>
              <b>{query || status ? "Aucune offre ne correspond à ces critères." : "Vous n'avez encore déclaré aucune offre."}</b>
            </div>
          )}

          <div className="evo-list">
            {items.map((item) => {
              const current = item.versions[0];
              const past = item.versions.slice(1);
              const isOpen = open.has(item.id);
              const steps = item.versions.reduce((n, v) => n + v.events.length, 0);
              return (
                <article key={item.id} className="evo-card">
                  <header className="evo-card-head">
                    <div className="evo-card-title">
                      <h2>{current.title}</h2>
                      <div className="evo-card-meta">
                        <span className="evo-code">{current.code}</span>
                        <span>Version {current.version}</span>
                        <span>{current.offerType === "PROMOTION" ? "Offre promotionnelle" : "Offre de base"}</span>
                        <span>{summaryText(current.summary)}</span>
                      </div>
                    </div>
                    <div className="evo-card-actions">{detailsButton(current, "Voir les détails")}</div>
                  </header>

                  {/* ------------------------------------------------ Présent */}
                  <div className={`evo-now evo-tone-${current.state.tone}`}>
                    <span className="evo-tag">Présent</span>
                    <span className="wf">
                      <WorkflowStatusBadge offer={current} showLevel={false} published={current.published} />
                    </span>
                    <span className="evo-now-text">
                      {current.state.label}
                      {current.state.at ? <time dateTime={current.state.at}> Depuis le {formatDate(current.state.at)}.</time> : null}
                    </span>
                  </div>

                  <button type="button" className="evo-toggle" onClick={() => toggle(item.id)} aria-expanded={isOpen}>
                    <i className={`bi ${isOpen ? "bi-chevron-up" : "bi-chevron-down"}`} aria-hidden="true"></i>
                    {isOpen ? "Masquer l'évolution" : "Voir l'évolution"}
                    <small>
                      {steps} étape{steps > 1 ? "s" : ""}
                      {past.length ? ` · ${past.length} version${past.length > 1 ? "s" : ""} précédente${past.length > 1 ? "s" : ""}` : ""}
                    </small>
                  </button>

                  {/* -------------------------------------------------- Passé */}
                  {isOpen && (
                    <div className="evo-past">
                      {item.versions.map((version, index) => {
                        const previous = item.versions[index + 1];
                        return (
                          <section key={version.id} className={`evo-version${version.current ? " is-current" : ""}`}>
                            <div className="evo-version-head">
                              <span className="evo-version-node" aria-hidden="true">
                                V{version.version}
                              </span>
                              <div className="evo-version-title">
                                <b>
                                  Version {version.version}
                                  {version.current ? " (actuelle)" : ""}
                                </b>
                                <span className="evo-code">{version.code}</span>
                                <span className="evo-muted">{summaryText(version.summary)}</span>
                              </div>
                              {!version.current && (
                                <>
                                  <span className="wf">
                                    <WorkflowStatusBadge offer={version} showLevel={false} published={version.published} />
                                  </span>
                                  {detailsButton(version, "Détails de cette version")}
                                </>
                              )}
                            </div>

                            {previous && (
                              <div className="evo-changes">
                                <div className="evo-changes-title">Ce qui a changé par rapport à la version {previous.version}</div>
                                {version.changes.length ? (
                                  <ul>
                                    {version.changes.map((change, i) => (
                                      <li key={i} className={`evo-change evo-change--${change.kind}`}>
                                        <i className={`bi ${CHANGE_ICON[change.kind] || "bi-dot"}`} aria-hidden="true"></i>
                                        <span>
                                          {change.label}
                                          {change.from && change.to ? (
                                            <>
                                              {" : "}
                                              <s>{change.from}</s> <i className="bi bi-arrow-right" aria-hidden="true"></i> <b>{change.to}</b>
                                            </>
                                          ) : change.to ? (
                                            <>
                                              {" : "}
                                              <b>{change.to}</b>
                                            </>
                                          ) : change.from ? (
                                            <>
                                              {" : "}
                                              <s>{change.from}</s>
                                            </>
                                          ) : null}
                                        </span>
                                      </li>
                                    ))}
                                  </ul>
                                ) : (
                                  <p className="evo-muted">Même nom, mêmes formules et mêmes prix : les autres caractéristiques sont visibles dans les détails.</p>
                                )}
                              </div>
                            )}

                            <ol className="evo-line">
                              {version.events.map((event) => (
                                <li key={event.id} className={`evo-step evo-tone-${event.tone}`}>
                                  <span className="evo-step-node" aria-hidden="true">
                                    <i className={`bi ${event.icon}`}></i>
                                  </span>
                                  <div className="evo-step-body">
                                    <div className="evo-step-head">
                                      <b>{event.label}</b>
                                      <time dateTime={event.at}>{formatDateTime(event.at)}</time>
                                    </div>
                                    {event.by && <div className="evo-muted">{event.byOperator ? `Par ${event.by}` : "Par l'ARTCI"}</div>}
                                    {event.comment && (
                                      <p className="evo-comment">
                                        <b>{event.comment.label} :</b> {event.comment.text}
                                      </p>
                                    )}
                                  </div>
                                </li>
                              ))}
                              {!version.events.length && <li className="evo-muted evo-step--empty">Aucune étape enregistrée pour cette version.</li>}
                            </ol>
                          </section>
                        );
                      })}
                    </div>
                  )}
                </article>
              );
            })}
          </div>

          {data && data.pageCount > 1 && (
            <nav className="act-pager" aria-label="Pagination des offres">
              <button type="button" className="btn btn-sm btn-outline-secondary" disabled={data.page <= 1} onClick={() => setPage(data.page - 1)}>
                <i className="bi bi-chevron-left" aria-hidden="true"></i> Précédent
              </button>
              <span>
                Page {data.page} sur {data.pageCount}
              </span>
              <button type="button" className="btn btn-sm btn-outline-secondary" disabled={data.page >= data.pageCount} onClick={() => setPage(data.page + 1)}>
                Suivant <i className="bi bi-chevron-right" aria-hidden="true"></i>
              </button>
            </nav>
          )}
        </div>
      }
    />
  );
}
