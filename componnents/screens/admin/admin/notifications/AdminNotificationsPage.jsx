"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Dialog } from "primereact/dialog";
import { MultiSelect } from "primereact/multiselect";
import {
  deleteNotifications,
  getNotificationRecipientOptions,
  listAdminNotifications,
  sendAdminNotification,
  setNotificationsRead,
} from "@/services/api/admin/notificationsAdminApiService";
import {
  NOTIFICATION_TYPE_STYLE,
  notificationStyleOf,
} from "@/services/tools/notificationTypes";
import { toastSuccess, toastWarning } from "@/componnents/notification/notification";

/**
 * Gestion des notifications   administrateur uniquement.
 *
 * Consulter toutes les notifications de la plateforme, les filtrer, les marquer
 * lues ou non lues, les supprimer (une à une ou par lot), et envoyer un
 * message à un public choisi : tous les utilisateurs, un profil, les points
 * focaux d'un opérateur, ou des personnes nommément désignées.
 *
 * Le contrôle d'accès est fait par le serveur (session + profil) ; l'écran se
 * contente d'afficher le refus s'il est opposé.
 */

const DEFAULT_FILTERS = {
  search: "",
  type: "ALL",
  read: "ALL",
  profile: "ALL",
  from: "",
  to: "",
};

const EMPTY_FORM = {
  title: "",
  content: "",
  link: "",
  audienceKind: "ALL",
  profileCode: "",
  operatorId: "",
  userIds: [],
};

const formatDate = (value) =>
  new Date(value).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

export default function AdminNotificationsPage() {
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const [data, setData] = useState({ items: [], total: 0, pages: 1, stats: null });
  const [loading, setLoading] = useState(true);
  const [denied, setDenied] = useState(null);
  const [selected, setSelected] = useState(() => new Set());
  const [busy, setBusy] = useState(false);

  const [options, setOptions] = useState({ users: [], operators: [], profiles: [] });
  const [composerOpen, setComposerOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [sending, setSending] = useState(false);
  const [formError, setFormError] = useState(null);

  const [pendingDelete, setPendingDelete] = useState(null); // tableau d'ids

  // Recherche différée : pas une requête par frappe.
  useEffect(() => {
    const t = setTimeout(() => {
      // L'effet ne se déclenche que lorsque la saisie change : revenir à la
      // première page est alors toujours voulu.
      setPage(1);
      setFilters((f) => (f.search === search ? f : { ...f, search }));
    }, 350);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await listAdminNotifications({ page, pageSize, filters });
    setLoading(false);
    if (res.error) {
      if (res.status === 401 || res.status === 403) setDenied(res.message);
      else toastWarning(res.message);
      return;
    }
    setDenied(null);
    setData(res);
    // La sélection ne garde que les lignes encore visibles.
    setSelected((prev) => {
      const visible = new Set(res.items.map((n) => n.id));
      return new Set([...prev].filter((id) => visible.has(id)));
    });
  }, [page, pageSize, filters]);

  useEffect(() => {
    load();
  }, [load]);

  // Profils, opérateurs et utilisateurs : filtre par profil et destinataires.
  useEffect(() => {
    getNotificationRecipientOptions().then((res) => {
      if (!res.error) {
        setOptions({ users: res.users, operators: res.operators, profiles: res.profiles });
      }
    });
  }, []);

  // Tout changement de filtre ramène à la première page, dans la même mise à
  // jour : un effet séparé relançait la requête deux fois (ancienne page, puis 1).
  const onFilter = (name, value) => {
    setPage(1);
    setFilters((f) => ({ ...f, [name]: value }));
  };

  const resetFilters = () => {
    setSearch("");
    setPage(1);
    setFilters(DEFAULT_FILTERS);
  };

  const items = data.items || [];
  const allChecked = items.length > 0 && items.every((n) => selected.has(n.id));

  const toggleOne = (id) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const toggleAll = () =>
    setSelected(allChecked ? new Set() : new Set(items.map((n) => n.id)));

  const markRead = async (ids, read) => {
    if (!ids.length) return;
    setBusy(true);
    const res = await setNotificationsRead(ids, read);
    setBusy(false);
    if (res.error) return toastWarning(res.message);
    toastSuccess(
      `${res.updated} notification(s) marquée(s) ${read ? "lue(s)" : "non lue(s)"}.`,
    );
    load();
  };

  const confirmDelete = async () => {
    const ids = pendingDelete || [];
    setPendingDelete(null);
    if (!ids.length) return;
    setBusy(true);
    const res = await deleteNotifications(ids);
    setBusy(false);
    if (res.error) return toastWarning(res.message);
    toastSuccess(`${res.deleted} notification(s) supprimée(s).`);
    setSelected(new Set());
    load();
  };

  /* ----------------------------- Rédaction ----------------------------- */

  const audienceCount = useMemo(() => {
    const users = options.users || [];
    switch (form.audienceKind) {
      case "ALL":
        return users.length;
      case "PROFILE":
        return users.filter((u) => u.profileCode === form.profileCode).length;
      case "OPERATOR": {
        const op = options.operators.find((o) => String(o.id) === String(form.operatorId));
        return op ? users.filter((u) => u.operatorName === op.name).length : 0;
      }
      case "USERS":
        return form.userIds.length;
      default:
        return 0;
    }
  }, [form, options]);

  const openComposer = () => {
    setForm(EMPTY_FORM);
    setFormError(null);
    setComposerOpen(true);
  };

  const send = async () => {
    setFormError(null);
    if (!form.title.trim()) return setFormError("L'objet du message est obligatoire.");
    if (!form.content.trim()) return setFormError("Le message est obligatoire.");
    if (form.audienceKind === "PROFILE" && !form.profileCode)
      return setFormError("Choisissez un profil.");
    if (form.audienceKind === "OPERATOR" && !form.operatorId)
      return setFormError("Choisissez un opérateur.");
    if (form.audienceKind === "USERS" && form.userIds.length === 0)
      return setFormError("Choisissez au moins un destinataire.");

    setSending(true);
    const res = await sendAdminNotification({
      title: form.title,
      content: form.content,
      link: form.link,
      audience: {
        kind: form.audienceKind,
        profileCode: form.profileCode || undefined,
        operatorId: form.operatorId || undefined,
        userIds: form.userIds,
      },
    });
    setSending(false);
    if (res.error) return setFormError(res.message);
    toastSuccess(`Message envoyé à ${res.created} destinataire(s).`);
    setComposerOpen(false);
    setPage(1);
    load();
  };

  /* ------------------------------- Rendu ------------------------------- */

  if (denied) {
    return (
      <div className="ntf">
        <div className="ntf-empty">
          <i className="bi bi-shield-lock"></i>
          <div className="ntf-empty-title">Accès refusé</div>
          <div className="ntf-empty-text">{denied}</div>
        </div>
      </div>
    );
  }

  const stats = data.stats || { total: 0, unread: 0, today: 0, byType: {} };
  const typeKeys = Object.keys(stats.byType || {});

  return (
    <div className="ntf">
      <div className="ntf-head">
        <div>
          <h1 className="ntf-title">Gestion des notifications</h1>
          <p className="ntf-sub">
            Toutes les notifications de la plateforme : consultation, suivi de
            lecture, suppression et envoi de messages.
          </p>
        </div>
        <button type="button" className="ntf-btn ntf-btn--accent" onClick={openComposer}>
          <i className="bi bi-megaphone"></i> Nouveau message
        </button>
      </div>

      <div className="ntf-kpis">
        <div className="ntf-kpi">
          <div className="ntf-kpi-value">{stats.total}</div>
          <div className="ntf-kpi-label">Notifications</div>
        </div>
        <button
          type="button"
          className={`ntf-kpi ntf-kpi--click${filters.read === "UNREAD" ? " is-on" : ""}`}
          onClick={() => onFilter("read", filters.read === "UNREAD" ? "ALL" : "UNREAD")}
          title="Filtrer sur les non lues"
        >
          <div className="ntf-kpi-value ntf-kpi-value--warn">{stats.unread}</div>
          <div className="ntf-kpi-label">Non lues</div>
        </button>
        <div className="ntf-kpi">
          <div className="ntf-kpi-value">{stats.today}</div>
          <div className="ntf-kpi-label">Aujourd'hui</div>
        </div>
        <div className="ntf-kpi">
          <div className="ntf-kpi-value">
            {stats.total ? Math.round(((stats.total - stats.unread) / stats.total) * 100) : 0}%
          </div>
          <div className="ntf-kpi-label">Taux de lecture</div>
        </div>
      </div>

      {typeKeys.length > 0 && (
        <div className="ntf-chips">
          {typeKeys.map((t) => {
            const s = notificationStyleOf(t);
            const on = filters.type === t;
            return (
              <button
                type="button"
                key={t}
                className={`ntf-chip ntf-tone-${s.tone}${on ? " is-on" : ""}`}
                onClick={() => onFilter("type", on ? "ALL" : t)}
              >
                <i className={`bi ${s.icon}`}></i> {s.label}
                <span className="ntf-chip-count">{stats.byType[t]}</span>
              </button>
            );
          })}
        </div>
      )}

      <div className="ntf-filters bg-secondary">
        <div className="ntf-field ntf-field--grow">
          <label htmlFor="ntf-search">Recherche</label>
          <input
            id="ntf-search"
            type="search"
            className="form-control"
            placeholder="Objet, message, destinataire…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="ntf-field">
          <label htmlFor="ntf-type">Type</label>
          <select
            id="ntf-type"
            className="form-select"
            value={filters.type}
            onChange={(e) => onFilter("type", e.target.value)}
          >
            <option value="ALL">Tous</option>
            {Object.entries(NOTIFICATION_TYPE_STYLE).map(([k, v]) => (
              <option key={k} value={k}>
                {v.label}
              </option>
            ))}
          </select>
        </div>
        <div className="ntf-field">
          <label htmlFor="ntf-read">État</label>
          <select
            id="ntf-read"
            className="form-select"
            value={filters.read}
            onChange={(e) => onFilter("read", e.target.value)}
          >
            <option value="ALL">Tous</option>
            <option value="UNREAD">Non lues</option>
            <option value="READ">Lues</option>
          </select>
        </div>
        <div className="ntf-field">
          <label htmlFor="ntf-profile">Destinataire</label>
          <select
            id="ntf-profile"
            className="form-select"
            value={filters.profile}
            onChange={(e) => onFilter("profile", e.target.value)}
          >
            <option value="ALL">Tous les profils</option>
            {options.profiles.map((p) => (
              <option key={p.code} value={p.code}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        <div className="ntf-field">
          <label htmlFor="ntf-from">Du</label>
          <input
            id="ntf-from"
            type="date"
            className="form-control"
            value={filters.from}
            max={filters.to || undefined}
            onChange={(e) => onFilter("from", e.target.value)}
          />
        </div>
        <div className="ntf-field">
          <label htmlFor="ntf-to">Au</label>
          <input
            id="ntf-to"
            type="date"
            className="form-control"
            value={filters.to}
            min={filters.from || undefined}
            onChange={(e) => onFilter("to", e.target.value)}
          />
        </div>
        <div className="ntf-field ntf-field--end">
          <button type="button" className="ntf-btn" onClick={resetFilters}>
            <i className="bi bi-arrow-counterclockwise"></i> Réinitialiser
          </button>
        </div>
      </div>

      {selected.size > 0 && (
        <div className="ntf-bulk" role="region" aria-label="Actions groupées">
          <span>
            <b>{selected.size}</b> sélectionnée(s)
          </span>
          <div className="ntf-bulk-actions">
            <button type="button" className="ntf-btn" disabled={busy} onClick={() => markRead([...selected], true)}>
              <i className="bi bi-envelope-open"></i> Marquer lues
            </button>
            <button type="button" className="ntf-btn" disabled={busy} onClick={() => markRead([...selected], false)}>
              <i className="bi bi-envelope"></i> Marquer non lues
            </button>
            <button type="button" className="ntf-btn ntf-btn--danger" disabled={busy} onClick={() => setPendingDelete([...selected])}>
              <i className="bi bi-trash"></i> Supprimer
            </button>
          </div>
        </div>
      )}

      <div className="ntf-card">
        <div className="ntf-table-wrap">
          <table className="ntf-table">
            <thead>
              <tr>
                <th className="ntf-col-check">
                  <input
                    type="checkbox"
                    aria-label="Tout sélectionner"
                    checked={allChecked}
                    onChange={toggleAll}
                    disabled={items.length === 0}
                  />
                </th>
                <th>Notification</th>
                <th>Destinataire(s)</th>
                <th>Date</th>
                <th>État</th>
                <th className="ntf-col-actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6}>
                    <div className="ntf-loading">
                      <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                      Chargement…
                    </div>
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <div className="ntf-empty ntf-empty--inline">
                      <i className="bi bi-bell-slash"></i>
                      <div className="ntf-empty-title">Aucune notification</div>
                      <div className="ntf-empty-text">
                        Aucune notification ne correspond à ces critères.
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                items.map((n) => {
                  const s = notificationStyleOf(n.type);
                  return (
                    <tr key={n.id} className={n.read ? "" : "is-unread"}>
                      <td className="ntf-col-check">
                        <input
                          type="checkbox"
                          aria-label={`Sélectionner « ${n.title || "notification"} »`}
                          checked={selected.has(n.id)}
                          onChange={() => toggleOne(n.id)}
                        />
                      </td>
                      <td>
                        <div className="ntf-item">
                          <span className={`ntf-icon ntf-tone-${s.tone}`}>
                            <i className={`bi ${s.icon}`}></i>
                          </span>
                          <div className="ntf-item-body">
                            <div className="ntf-item-title">{n.title || s.label}</div>
                            {n.content && <div className="ntf-item-text">{n.content}</div>}
                            <div className="ntf-item-meta">
                              <span className={`ntf-type ntf-tone-${s.tone}`}>{s.label}</span>
                              {n.from && <span>· {n.from}</span>}
                              {n.link && <span>· lien : {n.link}</span>}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        {n.recipients.length === 0 ? (
                          <span className="ntf-muted"> </span>
                        ) : (
                          n.recipients.map((r) => (
                            <div key={r.id} className="ntf-recipient">
                              <span className="ntf-recipient-name">{r.name}</span>
                              <span className="ntf-muted">
                                {r.profileName}
                                {r.operatorName ? ` · ${r.operatorName}` : ""}
                              </span>
                            </div>
                          ))
                        )}
                      </td>
                      <td className="ntf-nowrap">{formatDate(n.createdAt)}</td>
                      <td>
                        <span className={`ntf-state ${n.read ? "is-read" : "is-unread"}`}>
                          {n.read ? "Lue" : "Non lue"}
                        </span>
                      </td>
                      <td className="ntf-col-actions">
                        <button
                          type="button"
                          className="ntf-icon-btn"
                          disabled={busy}
                          title={n.read ? "Marquer non lue" : "Marquer lue"}
                          aria-label={n.read ? "Marquer non lue" : "Marquer lue"}
                          onClick={() => markRead([n.id], !n.read)}
                        >
                          <i className={`bi ${n.read ? "bi-envelope" : "bi-envelope-open"}`}></i>
                        </button>
                        <button
                          type="button"
                          className="ntf-icon-btn ntf-icon-btn--danger"
                          disabled={busy}
                          title="Supprimer"
                          aria-label="Supprimer"
                          onClick={() => setPendingDelete([n.id])}
                        >
                          <i className="bi bi-trash"></i>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="ntf-pager">
          <span className="ntf-muted">
            {data.total} notification(s) · page {data.page || page} / {data.pages || 1}
          </span>
          <div className="ntf-pager-actions">
            <select
              className="form-select form-select-sm"
              value={pageSize}
              onChange={(e) => {
                setPage(1);
                setPageSize(Number(e.target.value));
              }}
              aria-label="Lignes par page"
            >
              {[10, 20, 50, 100].map((n) => (
                <option key={n} value={n}>
                  {n} / page
                </option>
              ))}
            </select>
            <button
              type="button"
              className="ntf-btn"
              disabled={loading || page <= 1}
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
            >
              <i className="bi bi-chevron-left"></i> Précédente
            </button>
            <button
              type="button"
              className="ntf-btn"
              disabled={loading || page >= (data.pages || 1)}
              onClick={() => setPage((p) => p + 1)}
            >
              Suivante <i className="bi bi-chevron-right"></i>
            </button>
          </div>
        </div>
      </div>

      {/* ------------------------- Nouveau message ------------------------- */}
      <Dialog
        header="Nouveau message"
        visible={composerOpen}
        onHide={() => (sending ? null : setComposerOpen(false))}
        style={{ width: "min(640px, 96vw)" }}
        draggable={false}
        className="ntf-dialog"
      >
        <div className="ntf-form">
          <div className="ntf-field">
            <label htmlFor="ntf-aud">Destinataires</label>
            <select
              id="ntf-aud"
              className="form-select"
              value={form.audienceKind}
              onChange={(e) => setForm((f) => ({ ...f, audienceKind: e.target.value }))}
            >
              <option value="ALL">Tous les utilisateurs actifs</option>
              <option value="PROFILE">Un profil</option>
              <option value="OPERATOR">Les points focaux d'un opérateur</option>
              <option value="USERS">Des utilisateurs choisis</option>
            </select>
          </div>

          {form.audienceKind === "PROFILE" && (
            <div className="ntf-field">
              <label htmlFor="ntf-aud-profile">Profil</label>
              <select
                id="ntf-aud-profile"
                className="form-select"
                value={form.profileCode}
                onChange={(e) => setForm((f) => ({ ...f, profileCode: e.target.value }))}
              >
                <option value="">Choisir un profil</option>
                {options.profiles.map((p) => (
                  <option key={p.code} value={p.code}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {form.audienceKind === "OPERATOR" && (
            <div className="ntf-field">
              <label htmlFor="ntf-aud-oper">Opérateur</label>
              <select
                id="ntf-aud-oper"
                className="form-select"
                value={form.operatorId}
                onChange={(e) => setForm((f) => ({ ...f, operatorId: e.target.value }))}
              >
                <option value="">Choisir un opérateur</option>
                {options.operators.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {form.audienceKind === "USERS" && (
            <div className="ntf-field">
              <label>Utilisateurs</label>
              <MultiSelect
                value={form.userIds}
                options={options.users.map((u) => ({
                  value: u.id,
                  label: `${u.label}   ${u.profileName || ""}${u.operatorName ? " · " + u.operatorName : ""}`,
                }))}
                onChange={(e) => setForm((f) => ({ ...f, userIds: e.value || [] }))}
                optionLabel="label"
                optionValue="value"
                filter
                placeholder="Rechercher et choisir"
                display="chip"
                className="w-100"
              />
            </div>
          )}

          <div className="ntf-audience">
            <i className="bi bi-people"></i> {audienceCount} destinataire(s) actif(s)
          </div>

          <div className="ntf-field">
            <label htmlFor="ntf-title">Objet</label>
            <input
              id="ntf-title"
              className="form-control"
              maxLength={150}
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            />
          </div>
          <div className="ntf-field">
            <label htmlFor="ntf-content">Message</label>
            <textarea
              id="ntf-content"
              className="form-control"
              rows={5}
              maxLength={2000}
              value={form.content}
              onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
            />
            <div className="ntf-counter">{form.content.length} / 2000</div>
          </div>
          <div className="ntf-field">
            <label htmlFor="ntf-link">Lien interne (facultatif)</label>
            <input
              id="ntf-link"
              className="form-control"
              placeholder="/admin-validation"
              value={form.link}
              onChange={(e) => setForm((f) => ({ ...f, link: e.target.value }))}
            />
          </div>

          {formError && (
            <div className="ntf-error" role="alert">
              <i className="bi bi-exclamation-triangle"></i> {formError}
            </div>
          )}

          <div className="ntf-form-actions">
            <button type="button" className="ntf-btn" disabled={sending} onClick={() => setComposerOpen(false)}>
              Annuler
            </button>
            <button type="button" className="ntf-btn ntf-btn--accent" disabled={sending} onClick={send}>
              {sending ? "Envoi…" : (
                <>
                  <i className="bi bi-send"></i> Envoyer
                </>
              )}
            </button>
          </div>
        </div>
      </Dialog>

      {/* ------------------------ Confirmation ------------------------ */}
      <Dialog
        header="Supprimer"
        visible={!!pendingDelete}
        onHide={() => setPendingDelete(null)}
        style={{ width: "min(440px, 94vw)" }}
        draggable={false}
      >
        <p className="mb-3">
          Supprimer définitivement {pendingDelete?.length || 0} notification(s) ? Cette
          action est irréversible : les destinataires ne les verront plus.
        </p>
        <div className="ntf-form-actions">
          <button type="button" className="ntf-btn" onClick={() => setPendingDelete(null)}>
            Annuler
          </button>
          <button type="button" className="ntf-btn ntf-btn--danger" onClick={confirmDelete}>
            <i className="bi bi-trash"></i> Supprimer
          </button>
        </div>
      </Dialog>
    </div>
  );
}
