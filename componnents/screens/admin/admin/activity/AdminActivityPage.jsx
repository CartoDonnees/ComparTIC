"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Dialog } from "primereact/dialog";
import { activityExportUrl, getActivityOptions, listActivity } from "@/services/api/admin/activityApiService";
import {
  ACTIVITY_ACTIONS,
  ACTIVITY_DOMAINS,
  METADATA_LABELS,
  SESSION_REASONS,
  SESSION_SPACES,
  activityActionOf,
} from "@/services/audit/activityCatalog";
import { ROLE_SHORT_LABELS, formatDateTime, workflowStatusOf } from "@/services/tools/workflowLabels";
import { ROLES } from "@/services/rbac/roles";

/**
 * Journal d'activité de toute la plateforme (administration uniquement).
 *
 * Lecture seule du journal d'audit : offres (circuit de validation,
 * notifications, alertes), comptes utilisateurs, opérateurs et sessions
 * (connexions, échecs, déconnexions). Le contrôle d'accès est fait par la
 * route d'API ; l'écran affiche le refus s'il est opposé.
 */

const TZ = "Africa/Abidjan";

const PERIODS = [
  { key: "all", label: "Tout" },
  { key: "today", label: "Aujourd'hui" },
  { key: "7", label: "7 jours" },
  { key: "30", label: "30 jours" },
  { key: "90", label: "90 jours" },
];

const DEFAULT_FILTERS = { q: "", domain: "ALL", action: "ALL", role: "ALL", actorId: "ALL", operatorId: "ALL", from: "", to: "" };

const isoDay = (date) => new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(date);
const shiftDays = (n) => isoDay(new Date(Date.now() - n * 86400000));

const periodRange = (key) => {
  if (key === "all") return { from: "", to: "" };
  if (key === "today") return { from: isoDay(new Date()), to: "" };
  return { from: shiftDays(Number(key) - 1), to: "" };
};

const dayLabel = (key) => {
  if (key === isoDay(new Date())) return "Aujourd'hui";
  if (key === shiftDays(1)) return "Hier";
  const label = new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(
    new Date(`${key}T12:00:00Z`),
  );
  return label.charAt(0).toUpperCase() + label.slice(1);
};

const timeOf = (value) => new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: TZ }).format(new Date(value));

const fmtInt = (n) => Number(n || 0).toLocaleString("fr-FR");

const actorLine = (item) => {
  if (item.actor) return item.actor.name;
  if (item.domain === "SESSION") return item.metadata?.email ? `Tentative : ${item.metadata.email}` : "Tentative anonyme";
  return "Système";
};

const metaValue = (key, value) => {
  if (value === null || value === undefined || value === "") return "  ";
  if (key === "space") return SESSION_SPACES[value] || value;
  if (key === "reason") return SESSION_REASONS[value] || value;
  if (key === "role") return ROLE_SHORT_LABELS[value] || value;
  if (typeof value === "boolean") return value ? "Oui" : "Non";
  if (Array.isArray(value)) return value.length ? value.join(", ") : "  ";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
};

function StatusChip({ status }) {
  if (!status) return null;
  const s = workflowStatusOf(status);
  return <span className={`act-chip act-tone-${s.tone}`}>{s.label}</span>;
}

function Kpi({ icon, tone, value, label }) {
  return (
    <div className="act-kpi">
      <span className={`act-kpi-icon act-tone-${tone}`}>
        <i className={`bi ${icon}`} aria-hidden="true" />
      </span>
      <div>
        <div className="act-kpi-value">{fmtInt(value)}</div>
        <div className="act-kpi-label">{label}</div>
      </div>
    </div>
  );
}

function ActivityDetail({ item, onHide }) {
  if (!item) return null;
  const a = activityActionOf(item.action);
  const meta = Object.entries(item.metadata || {}).filter(([, v]) => v !== null && v !== undefined && v !== "");
  return (
    <Dialog
      visible={!!item}
      onHide={onHide}
      position="right"
      className="act-detail"
      style={{ width: "min(460px, 100vw)", height: "100vh", maxHeight: "100vh", margin: 0 }}
      header={
        <div className="act-detail-head">
          <span className={`act-ico act-tone-${a.tone}`}>
            <i className={`bi ${a.icon}`} aria-hidden="true" />
          </span>
          <div>
            <div className="act-detail-title">{a.label}</div>
            <div className="act-detail-sub">{formatDateTime(item.createdAt)}</div>
          </div>
        </div>
      }
      modal
      dismissableMask
      draggable={false}
      resizable={false}
    >
      <dl className="act-dl">
        <dt>Domaine</dt>
        <dd>{ACTIVITY_DOMAINS[item.domain]?.label || item.domain}</dd>

        <dt>Auteur</dt>
        <dd>
          {item.actor ? (
            <>
              <div className="act-strong">{item.actor.name}</div>
              <div className="act-muted">{item.actor.email}</div>
            </>
          ) : (
            actorLine(item)
          )}
          {item.actorRole ? <span className="act-role">{ROLE_SHORT_LABELS[item.actorRole] || item.actorRole}</span> : null}
        </dd>

        {item.target ? (
          <>
            <dt>Cible</dt>
            <dd>
              {item.target.href ? (
                <Link href={item.target.href} className="act-link">
                  {item.target.label} <i className="bi bi-box-arrow-up-right" aria-hidden="true" />
                </Link>
              ) : (
                <span className="act-strong">{item.target.label}</span>
              )}
              {item.target.sub ? <div className="act-muted act-mono">{item.target.sub}</div> : null}
              {item.target.deleted ? <div className="act-muted">Élément supprimé depuis</div> : null}
            </dd>
          </>
        ) : null}

        {item.target?.operator ? (
          <>
            <dt>Opérateur</dt>
            <dd>{item.target.operator}</dd>
          </>
        ) : null}

        {item.fromStatus || item.toStatus ? (
          <>
            <dt>Statut</dt>
            <dd className="act-transition">
              <StatusChip status={item.fromStatus} />
              {item.fromStatus && item.toStatus ? <i className="bi bi-arrow-right" aria-hidden="true" /> : null}
              <StatusChip status={item.toStatus} />
            </dd>
          </>
        ) : null}

        {item.level ? (
          <>
            <dt>Niveau</dt>
            <dd>Validateur {item.level}</dd>
          </>
        ) : null}

        {item.comment ? (
          <>
            <dt>Commentaire</dt>
            <dd className="act-comment">{item.comment}</dd>
          </>
        ) : null}
      </dl>

      {meta.length ? (
        <>
          <div className="act-section">Détails techniques</div>
          <dl className="act-dl act-dl--meta">
            {meta.map(([k, v]) => (
              <React.Fragment key={k}>
                <dt>{METADATA_LABELS[k] || k}</dt>
                <dd className={k === "userAgent" || k === "emails" ? "act-break" : ""}>{metaValue(k, v)}</dd>
              </React.Fragment>
            ))}
          </dl>
        </>
      ) : null}
      <div className="act-foot">Trace n° {item.id} · lecture seule</div>
    </Dialog>
  );
}

export default function AdminActivityPage() {
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [search, setSearch] = useState("");
  const [period, setPeriod] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [options, setOptions] = useState({ actors: [], operators: [] });
  const [selected, setSelected] = useState(null);
  const requestId = useRef(0);

  // Recherche : appliquée après une courte pause de saisie.
  useEffect(() => {
    const t = setTimeout(() => {
      setFilters((f) => (f.q === search.trim() ? f : { ...f, q: search.trim() }));
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    getActivityOptions().then((res) => {
      if (!res.error) setOptions({ actors: res.actors || [], operators: res.operators || [] });
    });
  }, []);

  const load = useCallback(async () => {
    const id = ++requestId.current;
    setLoading(true);
    const res = await listActivity({ page, pageSize, filters });
    if (id !== requestId.current) return; // réponse périmée
    if (res.error) {
      setError(res.status === 403 ? "Le journal d'activité est réservé à l'administration." : res.message);
      setData(null);
    } else {
      setError(null);
      setData(res);
    }
    setLoading(false);
  }, [page, pageSize, filters]);

  useEffect(() => {
    load();
  }, [load]);

  const update = (patch) => {
    setFilters((f) => ({ ...f, ...patch }));
    setPage(1);
  };

  const choosePeriod = (key) => {
    setPeriod(key);
    update(periodRange(key));
  };

  const setDate = (key, value) => {
    setPeriod("custom");
    update({ [key]: value });
  };

  const reset = () => {
    setSearch("");
    setPeriod("all");
    setFilters(DEFAULT_FILTERS);
    setPage(1);
  };

  const actionOptions = useMemo(() => {
    const domains = filters.domain === "ALL" ? Object.keys(ACTIVITY_DOMAINS) : [filters.domain];
    return domains.map((d) => ({
      domain: d,
      label: ACTIVITY_DOMAINS[d].label,
      actions: Object.entries(ACTIVITY_ACTIONS).filter(([, a]) => a.domain === d),
    }));
  }, [filters.domain]);

  const groups = useMemo(() => {
    const out = [];
    (data?.items || []).forEach((item) => {
      const key = isoDay(new Date(item.createdAt));
      const last = out[out.length - 1];
      if (last?.key === key) last.items.push(item);
      else out.push({ key, items: [item] });
    });
    return out;
  }, [data]);

  const activeCount = ["domain", "action", "role", "actorId", "operatorId"].filter((k) => filters[k] !== "ALL").length + (filters.q ? 1 : 0) + (filters.from || filters.to ? 1 : 0);
  const summary = data?.summary;
  const first = data && data.total ? (data.page - 1) * data.pageSize + 1 : 0;
  const last = data ? Math.min(data.total, data.page * data.pageSize) : 0;

  return (
    <div className="act">
      <div className="act-head">
        <div>
          <h1 className="act-title">Journal d'activité</h1>
          <p className="act-sub">Toutes les actions tracées sur la plateforme : offres, comptes, opérateurs et connexions. Lecture seule.</p>
        </div>
        <div className="act-head-actions">
          <button type="button" className="act-btn" onClick={load} disabled={loading}>
            <i className={`bi bi-arrow-clockwise${loading ? " act-spin" : ""}`} aria-hidden="true" /> Actualiser
          </button>
          <a className={`act-btn act-btn--accent${!data?.total ? " is-disabled" : ""}`} href={activityExportUrl(filters)} download aria-disabled={!data?.total}>
            <i className="bi bi-download" aria-hidden="true" /> Exporter (CSV)
          </a>
        </div>
      </div>

      <div className="act-periods" role="radiogroup" aria-label="Période">
        {PERIODS.map((p) => (
          <button key={p.key} type="button" role="radio" aria-checked={period === p.key} className={period === p.key ? "is-active" : ""} onClick={() => choosePeriod(p.key)}>
            {p.label}
          </button>
        ))}
        <div className="act-dates">
          <label>
            Du
            <input type="date" value={filters.from} max={filters.to || undefined} onChange={(e) => setDate("from", e.target.value)} />
          </label>
          <label>
            au
            <input type="date" value={filters.to} min={filters.from || undefined} onChange={(e) => setDate("to", e.target.value)} />
          </label>
        </div>
      </div>

      <div className="act-kpis">
        <Kpi icon="bi-activity" tone="info" value={summary?.total} label="Événements" />
        <Kpi icon="bi-calendar-day" tone="success" value={summary?.today} label="Aujourd'hui" />
        <Kpi icon="bi-people" tone="primary" value={summary?.actors} label="Utilisateurs actifs" />
        <Kpi icon="bi-shield-exclamation" tone={summary?.failedLogins ? "danger" : "neutral"} value={summary?.failedLogins} label="Échecs de connexion" />
      </div>

      <div className="act-panel">
        <div className="act-domains" role="tablist" aria-label="Domaine">
          <button type="button" role="tab" aria-selected={filters.domain === "ALL"} className={filters.domain === "ALL" ? "is-active" : ""} onClick={() => update({ domain: "ALL", action: "ALL" })}>
            Tout <span className="act-count">{fmtInt(summary?.all)}</span>
          </button>
          {Object.entries(ACTIVITY_DOMAINS).map(([key, d]) => (
            <button key={key} type="button" role="tab" aria-selected={filters.domain === key} className={filters.domain === key ? "is-active" : ""} onClick={() => update({ domain: key, action: "ALL" })}>
              <i className={`bi ${d.icon}`} aria-hidden="true" /> {d.label} <span className="act-count">{fmtInt(summary?.byDomain?.[key])}</span>
            </button>
          ))}
        </div>

        <div className="act-filters">
          <div className="act-search">
            <i className="bi bi-search" aria-hidden="true" />
            <input type="search" placeholder="Offre, code, personne, e-mail, commentaire…" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Rechercher" />
          </div>
          <select value={filters.action} onChange={(e) => update({ action: e.target.value })} aria-label="Action">
            <option value="ALL">Toutes les actions</option>
            {actionOptions.map((g) => (
              <optgroup key={g.domain} label={g.label}>
                {g.actions.map(([key, a]) => (
                  <option key={key} value={key}>
                    {a.label}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
          <select value={filters.actorId} onChange={(e) => update({ actorId: e.target.value })} aria-label="Utilisateur">
            <option value="ALL">Tous les utilisateurs</option>
            {options.actors.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
                {u.name !== u.email ? `    ${u.email}` : ""}
              </option>
            ))}
          </select>
          <select value={filters.role} onChange={(e) => update({ role: e.target.value })} aria-label="Profil">
            <option value="ALL">Tous les profils</option>
            {Object.keys(ROLES).map((r) => (
              <option key={r} value={r}>
                {ROLE_SHORT_LABELS[r] || r}
              </option>
            ))}
          </select>
          <select value={filters.operatorId} onChange={(e) => update({ operatorId: e.target.value })} aria-label="Opérateur">
            <option value="ALL">Tous les opérateurs</option>
            {options.operators.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </select>
          {activeCount ? (
            <button type="button" className="act-btn act-btn--ghost" onClick={reset}>
              <i className="bi bi-x-circle" aria-hidden="true" /> Réinitialiser ({activeCount})
            </button>
          ) : null}
        </div>

        {error ? (
          <div className="act-state act-state--error" role="alert">
            <i className="bi bi-shield-lock" aria-hidden="true" /> {error}
          </div>
        ) : loading && !data ? (
          <div className="act-skeleton" aria-busy="true" aria-label="Chargement">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="act-skeleton-row" />
            ))}
          </div>
        ) : !data?.items?.length ? (
          <div className="act-state">
            <i className="bi bi-inbox" aria-hidden="true" />
            <div className="act-strong">Aucune activité</div>
            <div className="act-muted">Aucun événement ne correspond à ces filtres.</div>
          </div>
        ) : (
          <div className={`act-feed${loading ? " is-loading" : ""}`}>
            {groups.map((g) => (
              <section key={g.key} className="act-day">
                <h2 className="act-day-title">
                  {dayLabel(g.key)} <span>{g.items.length}</span>
                </h2>
                <ul className="act-list">
                  {g.items.map((item) => {
                    const a = activityActionOf(item.action);
                    return (
                      <li key={item.id}>
                        <button type="button" className="act-row" onClick={() => setSelected(item)}>
                          <span className={`act-ico act-tone-${a.tone}`}>
                            <i className={`bi ${a.icon}`} aria-hidden="true" />
                          </span>
                          <span className="act-body">
                            <span className="act-line">
                              <span className="act-strong">{a.label}</span>
                              {item.target && !(item.domain === "SESSION" && item.actor) ? (
                                <span className="act-target">
                                  {item.target.label}
                                  {item.target.sub && item.target.type === "OFFER" ? <span className="act-mono"> · {item.target.sub}</span> : null}
                                </span>
                              ) : null}
                            </span>
                            <span className="act-meta">
                              <span>
                                <i className="bi bi-person" aria-hidden="true" /> {actorLine(item)}
                              </span>
                              {item.actorRole ? <span className="act-role">{ROLE_SHORT_LABELS[item.actorRole] || item.actorRole}</span> : null}
                              {item.target?.operator ? (
                                <span>
                                  <i className="bi bi-sd-card" aria-hidden="true" /> {item.target.operator}
                                </span>
                              ) : null}
                              {item.domain === "SESSION" && item.metadata?.space ? <span>{SESSION_SPACES[item.metadata.space] || item.metadata.space}</span> : null}
                              {item.metadata?.reason && SESSION_REASONS[item.metadata.reason] ? <span>{SESSION_REASONS[item.metadata.reason]}</span> : null}
                              {item.fromStatus || item.toStatus ? (
                                <span className="act-transition">
                                  <StatusChip status={item.fromStatus} />
                                  {item.fromStatus && item.toStatus ? <i className="bi bi-arrow-right" aria-hidden="true" /> : null}
                                  <StatusChip status={item.toStatus} />
                                </span>
                              ) : null}
                            </span>
                            {item.comment ? <span className="act-snippet">« {item.comment} »</span> : null}
                          </span>
                          <span className="act-time">
                            {timeOf(item.createdAt)}
                            <i className="bi bi-chevron-right" aria-hidden="true" />
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))}
          </div>
        )}

        {data?.total ? (
          <div className="act-pager">
            <span className="act-muted">
              {fmtInt(first)}–{fmtInt(last)} sur {fmtInt(data.total)}
            </span>
            <div className="act-pager-actions">
              <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }} aria-label="Lignes par page">
                {[25, 50, 100].map((n) => (
                  <option key={n} value={n}>
                    {n} / page
                  </option>
                ))}
              </select>
              <button type="button" className="act-icon-btn" disabled={page <= 1 || loading} onClick={() => setPage((p) => p - 1)} aria-label="Page précédente">
                <i className="bi bi-chevron-left" />
              </button>
              <span className="act-page">
                {data.page} / {data.pageCount}
              </span>
              <button type="button" className="act-icon-btn" disabled={page >= data.pageCount || loading} onClick={() => setPage((p) => p + 1)} aria-label="Page suivante">
                <i className="bi bi-chevron-right" />
              </button>
            </div>
          </div>
        ) : null}
      </div>

      <ActivityDetail item={selected} onHide={() => setSelected(null)} />
    </div>
  );
}
