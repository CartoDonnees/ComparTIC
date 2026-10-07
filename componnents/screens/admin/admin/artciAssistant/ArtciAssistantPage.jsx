"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Dialog } from "primereact/dialog";
import { renderMarkdown } from "@/services/tools/markdown";
import { formatDateTime } from "@/services/tools/workflowLabels";
import { toastSuccess } from "@/componnents/notification/notification";
import {
  askArtci,
  createKnowledgeDocument,
  deleteArtciConversation,
  deleteKnowledgeDocument,
  getArtciConversation,
  getKnowledgeDocument,
  listArtciConversations,
  listKnowledgeDocuments,
  searchKnowledge,
  updateKnowledgeDocument,
} from "@/services/api/assistant/artciAssistantApiService";

/**
 * Assistant IA ARTCI    assistant réglementaire fondé sur une base documentaire.
 *
 * Distinct de ComparIA : il ne répond qu'à partir des textes déposés dans la
 * base (lois, décrets, décisions…), cite ses sources et dit explicitement ce
 * que la base ne couvre pas.
 *
 * Deux onglets :
 *  - « Assistant » : conversations (conservées côté serveur), réponses avec
 *    les passages cités ;
 *  - « Base documentaire » : textes de référence, recherche dans les passages,
 *    ajout et retrait (administration).
 *
 * L'écran ne porte aucune règle : recherche, rédaction, droits et historique
 * sont côté serveur (services/artciAssistant/*).
 */

const MODE = {
  GENERATED: { label: "Réponse fondée sur la base documentaire", icon: "bi-patch-check", tone: "ok" },
  EXTRACTIVE: { label: "Passages de la base, sans reformulation", icon: "bi-journal-text", tone: "info" },
  NO_SOURCE: { label: "Non disponible dans la base documentaire", icon: "bi-slash-circle", tone: "muted" },
};

const dateFr = (d) => (d ? new Date(d).toLocaleDateString("fr-FR") : "  ");
const sizeLabel = (n) => (n >= 1048576 ? `${(n / 1048576).toFixed(1)} Mo` : `${Math.max(1, Math.round(n / 1024))} Ko`);

const readBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",")[1] || "");
    reader.onerror = () => reject(new Error("Lecture du fichier impossible."));
    reader.readAsDataURL(file);
  });

/* ------------------------------------------------------------------ Sources */
function Sources({ message, onOpen }) {
  const [open, setOpen] = useState(false);
  const sources = message.sources || [];
  if (!sources.length) return null;
  const cited = sources.filter((s) => s.cited).length;
  return (
    <div className="aia-sources">
      <button type="button" className="aia-sources-toggle" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <i className="bi bi-journal-bookmark" aria-hidden="true"></i>
        {sources.length} passage{sources.length > 1 ? "s" : ""} de la base documentaire
        {message.mode === "GENERATED" ? ` · ${cited} cité${cited > 1 ? "s" : ""}` : ""}
        <i className={`bi ${open ? "bi-chevron-up" : "bi-chevron-down"}`} aria-hidden="true"></i>
      </button>
      {open && (
        <ol className="aia-sources-list">
          {sources.map((s) => (
            <li key={s.chunkId} className={s.cited ? "" : "is-uncited"}>
              <button type="button" onClick={() => onOpen(s)} title="Ouvrir le texte à ce passage">
                <span className="aia-source-n">[{s.n}]</span>
                <span className="aia-source-body">
                  <b>{s.label}</b>
                  <span>{s.excerpt}</span>
                  {!s.cited && <em>Transmis à l'assistant, non cité dans la réponse</em>}
                </span>
              </button>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

/* ------------------------------------------------------- Lecture d'un texte */
function DocumentViewer({ target, onHide }) {
  const [doc, setDoc] = useState(null);
  const [error, setError] = useState(null);
  const activeRef = useRef(null);

  useEffect(() => {
    // Fermeture : le texte affiché est oublié (la fenêtre se rouvre sur un autre document).
    if (!target) {
      setDoc(null);
      return undefined;
    }
    let cancelled = false;
    setDoc(null);
    setError(null);
    getKnowledgeDocument(target.documentId).then((res) => {
      if (cancelled) return;
      if (res.ok) setDoc(res.data);
      else setError(res.error);
    });
    return () => {
      cancelled = true;
    };
  }, [target]);

  useEffect(() => {
    if (doc && activeRef.current) activeRef.current.scrollIntoView({ block: "center" });
  }, [doc]);

  return (
    <Dialog visible={!!target} onHide={onHide} header={doc?.title || "Texte de référence"} className="aia-dialog" style={{ width: "min(860px, 96vw)" }} modal dismissableMask maximizable>
      {error ? (
        <div className="aia-alert aia-alert--error" role="alert">
          {error}
        </div>
      ) : !doc || !target ? (
        <div className="aia-loading">
          <span className="spinner-border spinner-border-sm" aria-hidden="true"></span> Ouverture du texte…
        </div>
      ) : (
        <>
          <div className="aia-doc-meta">
            <span className="aia-badge">{target.kindLabel || doc.kind}</span>
            {doc.reference && <span>{doc.reference}</span>}
            {doc.issuedAt && <span>du {dateFr(doc.issuedAt)}</span>}
            <span className={`aia-badge ${doc.inForce ? "aia-badge--ok" : "aia-badge--muted"}`}>{doc.inForce ? "En vigueur" : "Plus en vigueur"}</span>
            <span>{doc.chunks.length} passages</span>
          </div>
          {doc.description && <p className="aia-muted">{doc.description}</p>}
          <div className="aia-passages">
            {doc.chunks.map((c) => (
              <div key={c.id} ref={c.id === target.chunkId ? activeRef : null} className={`aia-passage${c.id === target.chunkId ? " is-active" : ""}`}>
                {c.heading && <div className="aia-passage-head">{c.heading}</div>}
                <div className="aia-passage-text">{c.content}</div>
              </div>
            ))}
          </div>
        </>
      )}
    </Dialog>
  );
}

/* ------------------------------------------------------------ Conversation */
function AssistantTab({ documentsInForce, onOpenSource }) {
  const [conversations, setConversations] = useState(null);
  const [activeId, setActiveId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const abortRef = useRef(null);
  const scrollRef = useRef(null);

  const refreshList = useCallback(async () => {
    const res = await listArtciConversations();
    setConversations(res.ok ? res.data.items : []);
  }, []);

  useEffect(() => {
    refreshList();
    return () => abortRef.current?.abort();
  }, [refreshList]);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages.length, busy]);

  const open = async (id) => {
    abortRef.current?.abort();
    setBusy(false);
    setError(null);
    setActiveId(id);
    setMessages([]);
    const res = await getArtciConversation(id);
    if (res.ok) setMessages(res.data.messages);
    else setError(res.error);
  };

  const fresh = () => {
    abortRef.current?.abort();
    setBusy(false);
    setActiveId(null);
    setMessages([]);
    setError(null);
  };

  const send = async (e) => {
    e?.preventDefault();
    const question = input.trim();
    if (!question || busy) return;
    setInput("");
    setError(null);
    setBusy(true);
    setMessages((m) => [...m, { id: `tmp-${Date.now()}`, role: "user", content: question, createdAt: new Date().toISOString() }]);
    const controller = new AbortController();
    abortRef.current = controller;
    const res = await askArtci(question, activeId, controller.signal);
    if (abortRef.current === controller) abortRef.current = null;
    setBusy(false);
    if (res.aborted) return;
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setActiveId(res.data.conversation.id);
    setMessages((m) => [...m, res.data.message]);
    refreshList();
  };

  const remove = async (id) => {
    if (!window.confirm("Supprimer cette conversation ?")) return;
    const res = await deleteArtciConversation(id);
    if (res.ok) {
      if (activeId === id) fresh();
      refreshList();
    }
  };

  return (
    <div className="aia-chat">
      <aside className="aia-side">
        <button type="button" className="aia-btn aia-btn--accent aia-btn--block" onClick={fresh}>
          <i className="bi bi-plus-lg" aria-hidden="true"></i> Nouvelle conversation
        </button>
        <div className="aia-side-title">Mes conversations</div>
        {conversations === null ? (
          <div className="aia-muted">Chargement…</div>
        ) : conversations.length === 0 ? (
          <div className="aia-muted">Vos conversations apparaîtront ici.</div>
        ) : (
          <ul className="aia-conv-list">
            {conversations.map((c) => (
              <li key={c.id} className={c.id === activeId ? "is-active" : ""}>
                <button type="button" className="aia-conv-open" onClick={() => open(c.id)} title={c.title}>
                  <span>{c.title}</span>
                  <small>{formatDateTime(c.updatedAt)}</small>
                </button>
                <button type="button" className="aia-icon-btn" onClick={() => remove(c.id)} aria-label={`Supprimer « ${c.title} »`} title="Supprimer">
                  <i className="bi bi-trash" aria-hidden="true"></i>
                </button>
              </li>
            ))}
          </ul>
        )}
      </aside>

      <section className="aia-main">
        <div className="aia-thread" ref={scrollRef}>
          {messages.length === 0 && !busy ? (
            <div className="aia-welcome">
              <span className="aia-welcome-icon">
                <i className="bi bi-bank2" aria-hidden="true"></i>
              </span>
              <h2>Assistant IA ARTCI</h2>
              <p>
                Posez une question sur la réglementation des télécommunications/TIC. L'assistant répond <b>uniquement à partir des textes de la base
                documentaire</b>, cite les passages utilisés, distingue ce que disent les textes de ce qui relève de l'interprétation, et signale ce que la
                base ne couvre pas.
              </p>
              <p className={documentsInForce ? "aia-muted" : "aia-alert aia-alert--warning"}>
                {documentsInForce === null
                  ? " "
                  : documentsInForce
                    ? `${documentsInForce} texte(s) en vigueur dans la base documentaire.`
                    : "La base documentaire est vide : ajoutez des textes de référence dans l'onglet « Base documentaire »."}
              </p>
            </div>
          ) : (
            messages.map((m) =>
              m.role === "user" ? (
                <div key={m.id} className="aia-msg aia-msg--user">
                  <div className="aia-bubble">{m.content}</div>
                </div>
              ) : (
                <div key={m.id} className="aia-msg aia-msg--assistant">
                  <span className="aia-avatar" aria-hidden="true">
                    <i className="bi bi-bank2"></i>
                  </span>
                  <div className="aia-answer">
                    {MODE[m.mode] && (
                      <div className={`aia-mode aia-mode--${MODE[m.mode].tone}`}>
                        <i className={`bi ${MODE[m.mode].icon}`} aria-hidden="true"></i> {MODE[m.mode].label}
                      </div>
                    )}
                    <div className="aia-markdown" dangerouslySetInnerHTML={{ __html: renderMarkdown(m.content) }} />
                    {m.mode === "GENERATED" && (m.sources || []).length > 0 && !(m.sources || []).some((s) => s.cited) && (
                      <div className="aia-alert aia-alert--warning">
                        <i className="bi bi-exclamation-triangle" aria-hidden="true"></i> L'assistant n'a cité aucun passage : vérifiez la réponse dans les
                        textes ci-dessous avant de vous y fier.
                      </div>
                    )}
                    <Sources message={m} onOpen={onOpenSource} />
                    <div className="aia-msg-meta">{formatDateTime(m.createdAt)}</div>
                  </div>
                </div>
              ),
            )
          )}
          {busy && (
            <div className="aia-msg aia-msg--assistant">
              <span className="aia-avatar" aria-hidden="true">
                <i className="bi bi-bank2"></i>
              </span>
              <div className="aia-answer aia-pending" role="status">
                <span className="spinner-border spinner-border-sm" aria-hidden="true"></span> Recherche dans la base documentaire, puis rédaction…
                <button type="button" className="aia-link" onClick={() => abortRef.current?.abort()}>
                  Arrêter
                </button>
              </div>
            </div>
          )}
          {error && (
            <div className="aia-alert aia-alert--error" role="alert">
              <i className="bi bi-exclamation-octagon" aria-hidden="true"></i> {error}
            </div>
          )}
        </div>

        <form className="aia-composer" onSubmit={send}>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) send(e);
            }}
            rows={2}
            maxLength={2000}
            placeholder="Votre question sur un texte, une obligation, un délai…"
            aria-label="Votre question"
            disabled={busy}
          />
          <button type="submit" className="aia-btn aia-btn--accent" disabled={busy || !input.trim()}>
            <i className="bi bi-send" aria-hidden="true"></i> Envoyer
          </button>
        </form>
        <div className="aia-disclaimer">Aide à l'analyse : la réponse ne remplace pas la lecture des textes cités.</div>
      </section>
    </div>
  );
}

/* --------------------------------------------------------- Base documentaire */
const EMPTY_FORM = { title: "", kind: "", reference: "", issuedAt: "", description: "", text: "", file: null };

function DocumentsTab({ data, reload, onOpenSource }) {
  const [search, setSearch] = useState("");
  const [kind, setKind] = useState("ALL");
  const [passageQuery, setPassageQuery] = useState("");
  const [passages, setPassages] = useState(null); // { mode, terms, passages }
  const [searching, setSearching] = useState(false);
  const [form, setForm] = useState(null);
  const [formError, setFormError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef(null);

  const kinds = data?.kinds || {};
  const upload = data?.upload || { extensions: [], maxBytes: 0 };
  const canManage = !!data?.canManage;

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (data?.items || []).filter((d) => (kind === "ALL" || d.kind === kind) && (!q || `${d.title} ${d.reference || ""} ${d.description || ""}`.toLowerCase().includes(q)));
  }, [data, search, kind]);

  const runSearch = async (e) => {
    e?.preventDefault();
    if (!passageQuery.trim()) {
      setPassages(null);
      return;
    }
    setSearching(true);
    const res = await searchKnowledge(passageQuery.trim());
    setSearching(false);
    setPassages(res.ok ? res.data : { mode: "NONE", terms: [], passages: [], error: res.error });
  };

  const pickFile = (file) => {
    if (!file) return;
    const ext = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
    if (!upload.extensions.includes(ext)) {
      setFormError({ message: `Format non pris en charge. Formats acceptés : ${upload.extensions.join(", ")}.`, field: "file" });
      return;
    }
    if (upload.maxBytes && file.size > upload.maxBytes) {
      setFormError({ message: `Le fichier dépasse ${sizeLabel(upload.maxBytes)}.`, field: "file" });
      return;
    }
    setFormError(null);
    setForm((f) => ({ ...f, file, title: f.title || file.name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ") }));
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.kind) {
      setFormError({ message: "Le titre et la nature du document sont obligatoires.", field: !form.title.trim() ? "title" : "kind" });
      return;
    }
    if (!form.file && form.text.trim().length < 80) {
      setFormError({ message: "Déposez un fichier ou collez le texte du document (80 caractères au moins).", field: "text" });
      return;
    }
    setSaving(true);
    setFormError(null);
    let payload = { title: form.title, kind: form.kind, reference: form.reference, issuedAt: form.issuedAt || null, description: form.description };
    try {
      payload = form.file ? { ...payload, fileName: form.file.name, fileBase64: await readBase64(form.file) } : { ...payload, text: form.text };
    } catch (err) {
      setSaving(false);
      setFormError({ message: err.message, field: "file" });
      return;
    }
    const res = await createKnowledgeDocument(payload);
    setSaving(false);
    if (!res.ok) {
      setFormError({ message: res.error, field: res.details?.field || null });
      return;
    }
    toastSuccess(`Document ajouté : ${res.data._count.chunks} passage(s) interrogeable(s).`);
    setForm(null);
    reload();
  };

  const toggleInForce = async (doc) => {
    const res = await updateKnowledgeDocument(doc.id, { inForce: !doc.inForce });
    if (res.ok) {
      toastSuccess(res.data.inForce ? "Texte marqué « en vigueur » : il est de nouveau interrogé." : "Texte marqué « plus en vigueur » : l'assistant ne l'interroge plus.");
      reload();
    }
  };

  const confirmDelete = async () => {
    setDeleting(true);
    const res = await deleteKnowledgeDocument(toDelete.id);
    setDeleting(false);
    if (res.ok) {
      toastSuccess("Document retiré de la base documentaire.");
      setToDelete(null);
      reload();
    }
  };

  return (
    <div className="aia-docs">
      <form className="aia-passage-search" onSubmit={runSearch}>
        <div className="aia-search">
          <i className="bi bi-search" aria-hidden="true"></i>
          <input type="search" value={passageQuery} onChange={(e) => setPassageQuery(e.target.value)} placeholder="Rechercher dans le contenu des textes (ex. délai de notification d'une promotion)" aria-label="Rechercher dans les textes" />
        </div>
        <button type="submit" className="aia-btn" disabled={searching || !passageQuery.trim()}>
          {searching ? <span className="spinner-border spinner-border-sm" aria-hidden="true"></span> : <i className="bi bi-journal-text" aria-hidden="true"></i>} Chercher les passages
        </button>
        {passages && (
          <button
            type="button"
            className="aia-btn aia-btn--ghost"
            onClick={() => {
              setPassages(null);
              setPassageQuery("");
            }}
          >
            Effacer
          </button>
        )}
      </form>

      {passages && (
        <div className="aia-results">
          <div className="aia-results-head">
            {passages.passages.length
              ? `${passages.passages.length} passage(s)    ${passages.mode === "ALL_TERMS" ? "tous les termes trouvés" : "une partie des termes trouvée"}`
              : passages.error || "Aucun passage ne correspond dans les textes en vigueur."}
          </div>
          {passages.passages.map((p) => (
            <button key={p.chunkId} type="button" className="aia-result" onClick={() => onOpenSource(p)}>
              <b>{p.label}</b>
              <span>{p.excerpt}</span>
            </button>
          ))}
        </div>
      )}

      <div className="aia-toolbar">
        <div className="aia-search">
          <i className="bi bi-funnel" aria-hidden="true"></i>
          <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Filtrer par titre ou référence…" aria-label="Filtrer les documents" />
        </div>
        <select value={kind} onChange={(e) => setKind(e.target.value)} aria-label="Nature du document">
          <option value="ALL">Toutes les natures</option>
          {Object.entries(kinds).map(([k, label]) => (
            <option key={k} value={k}>
              {label}
            </option>
          ))}
        </select>
        {(search || kind !== "ALL") && (
          <button
            type="button"
            className="aia-btn aia-btn--ghost"
            onClick={() => {
              setSearch("");
              setKind("ALL");
            }}
          >
            <i className="bi bi-arrow-counterclockwise" aria-hidden="true"></i> Réinitialiser
          </button>
        )}
        <span className="aia-count">
          <b>{rows.length}</b> / {data?.items?.length ?? 0}
        </span>
        {canManage && (
          <button
            type="button"
            className="aia-btn aia-btn--accent"
            onClick={() => {
              setFormError(null);
              setForm({ ...EMPTY_FORM });
            }}
          >
            <i className="bi bi-plus-lg" aria-hidden="true"></i> Ajouter un document
          </button>
        )}
      </div>

      {!data ? (
        <div className="aia-loading">
          <span className="spinner-border spinner-border-sm" aria-hidden="true"></span> Chargement de la base documentaire…
        </div>
      ) : rows.length === 0 ? (
        <div className="aia-empty">
          <i className="bi bi-journal-x" aria-hidden="true"></i>
          <b>{data.items.length ? "Aucun document ne correspond" : "La base documentaire est vide"}</b>
          <span>
            {data.items.length
              ? "Modifiez le filtre pour retrouver un texte."
              : canManage
                ? "Ajoutez les lois, décrets et décisions en vigueur : l'assistant ne répond qu'à partir de ces textes."
                : "Un administrateur doit y déposer les textes de référence."}
          </span>
        </div>
      ) : (
        <div className="aia-table-wrap">
          <table className="aia-table">
            <thead>
              <tr>
                <th>Document</th>
                <th>Nature</th>
                <th>Date</th>
                <th>Passages</th>
                <th>Statut</th>
                <th aria-label="Actions"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((d) => (
                <tr key={d.id} className={d.inForce ? "" : "is-off"}>
                  <td>
                    <button type="button" className="aia-doc-title" onClick={() => onOpenSource({ documentId: d.id, chunkId: null, kindLabel: kinds[d.kind] })}>
                      {d.title}
                    </button>
                    <div className="aia-muted">
                      {[d.reference, d.sourceName, `ajouté le ${dateFr(d.createdAt)}`].filter(Boolean).join(" · ")}
                    </div>
                  </td>
                  <td>
                    <span className="aia-badge">{kinds[d.kind] || d.kind}</span>
                  </td>
                  <td>{dateFr(d.issuedAt)}</td>
                  <td>{d._count.chunks}</td>
                  <td>
                    <span className={`aia-badge ${d.inForce ? "aia-badge--ok" : "aia-badge--muted"}`}>{d.inForce ? "En vigueur" : "Plus en vigueur"}</span>
                  </td>
                  <td className="aia-row-actions">
                    <button type="button" className="aia-icon-btn" onClick={() => onOpenSource({ documentId: d.id, chunkId: null, kindLabel: kinds[d.kind] })} title="Lire le texte" aria-label={`Lire ${d.title}`}>
                      <i className="bi bi-eye" aria-hidden="true"></i>
                    </button>
                    {canManage && (
                      <>
                        <button type="button" className="aia-icon-btn" onClick={() => toggleInForce(d)} title={d.inForce ? "Marquer « plus en vigueur » (l'assistant ne l'interrogera plus)" : "Remettre en vigueur"} aria-label={d.inForce ? `Retirer ${d.title} de la vigueur` : `Remettre ${d.title} en vigueur`}>
                          <i className={`bi ${d.inForce ? "bi-pause-circle" : "bi-play-circle"}`} aria-hidden="true"></i>
                        </button>
                        <button type="button" className="aia-icon-btn aia-icon-btn--danger" onClick={() => setToDelete(d)} title="Retirer de la base" aria-label={`Supprimer ${d.title}`}>
                          <i className="bi bi-trash" aria-hidden="true"></i>
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ----------------------------------------------------------------- Ajout */}
      <Dialog visible={!!form} onHide={() => !saving && setForm(null)} header="Ajouter un document de référence" className="aia-dialog" style={{ width: "min(640px, 96vw)" }} modal>
        {form && (
          <form onSubmit={submit} noValidate>
            {formError && (
              <div className="aia-alert aia-alert--error" role="alert">
                <i className="bi bi-exclamation-octagon" aria-hidden="true"></i> {formError.message}
              </div>
            )}
            <div
              className={`aia-drop${dragOver ? " is-over" : ""}${form.file ? " has-file" : ""}`}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                pickFile(e.dataTransfer.files?.[0]);
              }}
              onClick={() => fileRef.current?.click()}
              onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && fileRef.current?.click()}
              role="button"
              tabIndex={0}
            >
              <input
                ref={fileRef}
                type="file"
                hidden
                accept={upload.extensions.join(",")}
                onChange={(e) => {
                  pickFile(e.target.files?.[0]);
                  e.target.value = "";
                }}
              />
              <i className={`bi ${form.file ? "bi-file-earmark-check" : "bi-cloud-arrow-up"}`} aria-hidden="true"></i>
              {form.file ? (
                <span>
                  <b>{form.file.name}</b> · {sizeLabel(form.file.size)}
                </span>
              ) : (
                <span>
                  <b>Déposez le texte ici</b> ou cliquez pour le choisir    {upload.extensions.join(", ")}, {sizeLabel(upload.maxBytes)} maximum
                </span>
              )}
            </div>
            {!form.file && (
              <label className={`aia-field${formError?.field === "text" ? " is-invalid" : ""}`}>
                <span>… ou collez le texte</span>
                <textarea rows={4} value={form.text} onChange={(e) => setForm((f) => ({ ...f, text: e.target.value }))} placeholder="Texte intégral du document" disabled={saving} />
              </label>
            )}
            {form.file && (
              <button type="button" className="aia-link" onClick={() => setForm((f) => ({ ...f, file: null }))}>
                Retirer le fichier et coller le texte à la place
              </button>
            )}
            <div className="aia-form-grid">
              <label className={`aia-field aia-field--wide${formError?.field === "title" ? " is-invalid" : ""}`}>
                <span>
                  Titre <em>*</em>
                </span>
                <input type="text" value={form.title} maxLength={200} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} disabled={saving} />
              </label>
              <label className={`aia-field${formError?.field === "kind" ? " is-invalid" : ""}`}>
                <span>
                  Nature <em>*</em>
                </span>
                <select value={form.kind} onChange={(e) => setForm((f) => ({ ...f, kind: e.target.value }))} disabled={saving}>
                  <option value="" disabled>
                    Choisir…
                  </option>
                  {Object.entries(kinds).map(([k, label]) => (
                    <option key={k} value={k}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="aia-field">
                <span>Référence officielle</span>
                <input type="text" value={form.reference} maxLength={120} placeholder="Ex. Décision n° 2024-1098" onChange={(e) => setForm((f) => ({ ...f, reference: e.target.value }))} disabled={saving} />
              </label>
              <label className={`aia-field${formError?.field === "issuedAt" ? " is-invalid" : ""}`}>
                <span>Date du texte</span>
                <input type="date" value={form.issuedAt} onChange={(e) => setForm((f) => ({ ...f, issuedAt: e.target.value }))} disabled={saving} />
              </label>
              <label className="aia-field aia-field--wide">
                <span>Description</span>
                <input type="text" value={form.description} maxLength={300} placeholder="Objet du texte (facultatif)" onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} disabled={saving} />
              </label>
            </div>
            <div className="aia-dialog-foot">
              <button type="button" className="aia-btn" onClick={() => setForm(null)} disabled={saving}>
                Annuler
              </button>
              <button type="submit" className="aia-btn aia-btn--accent" disabled={saving}>
                {saving && <span className="spinner-border spinner-border-sm" aria-hidden="true"></span>}
                {saving ? "Extraction et découpage…" : "Ajouter à la base"}
              </button>
            </div>
          </form>
        )}
      </Dialog>

      {/* ----------------------------------------------------------- Suppression */}
      <Dialog visible={!!toDelete} onHide={() => !deleting && setToDelete(null)} header="Retirer le document" className="aia-dialog" style={{ width: "min(480px, 96vw)" }} modal>
        {toDelete && (
          <>
            <p>
              Retirer définitivement <b>« {toDelete.title} »</b> de la base documentaire ? Ses {toDelete._count.chunks} passage(s) ne seront plus interrogeables.
            </p>
            <div className="aia-alert aia-alert--info">
              <i className="bi bi-info-circle" aria-hidden="true"></i> Pour un texte abrogé, préférez « plus en vigueur » : il reste consultable sans être interrogé.
            </div>
            <div className="aia-dialog-foot">
              <button type="button" className="aia-btn" onClick={() => setToDelete(null)} disabled={deleting}>
                Annuler
              </button>
              <button type="button" className="aia-btn aia-btn--danger" onClick={confirmDelete} disabled={deleting}>
                {deleting && <span className="spinner-border spinner-border-sm" aria-hidden="true"></span>} Retirer
              </button>
            </div>
          </>
        )}
      </Dialog>
    </div>
  );
}

/* ---------------------------------------------------------------------- Page */
export default function ArtciAssistantPage() {
  const [tab, setTab] = useState("assistant");
  const [data, setData] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [viewed, setViewed] = useState(null);

  const reload = useCallback(async () => {
    const res = await listKnowledgeDocuments();
    if (res.ok) {
      setData(res.data);
      setLoadError(null);
    } else {
      setLoadError(res.status === 403 ? "L'Assistant IA ARTCI est réservé aux agents de l'ARTCI." : res.error);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const inForce = data ? data.items.filter((d) => d.inForce).length : null;
  const openSource = (s) => setViewed({ documentId: s.documentId, chunkId: s.chunkId ?? null, kindLabel: s.kindLabel || data?.kinds?.[s.kind] });

  return (
    <div className="aia">
      <div className="aia-head">
        <div>
          <h1 className="aia-title">
            <i className="bi bi-bank2" aria-hidden="true"></i> Assistant IA ARTCI
          </h1>
          <p className="aia-sub">Assistant réglementaire : réponses fondées sur les textes de référence de la base documentaire, avec citation des sources.</p>
        </div>
        <div className="aia-tabs" role="tablist">
          <button type="button" role="tab" aria-selected={tab === "assistant"} className={tab === "assistant" ? "is-active" : ""} onClick={() => setTab("assistant")}>
            <i className="bi bi-chat-square-text" aria-hidden="true"></i> Assistant
          </button>
          <button type="button" role="tab" aria-selected={tab === "documents"} className={tab === "documents" ? "is-active" : ""} onClick={() => setTab("documents")}>
            <i className="bi bi-journal-text" aria-hidden="true"></i> Base documentaire {data ? <span className="aia-tab-count">{data.items.length}</span> : null}
          </button>
        </div>
      </div>

      {loadError ? (
        <div className="aia-alert aia-alert--error" role="alert">
          <i className="bi bi-shield-lock" aria-hidden="true"></i> {loadError}
        </div>
      ) : tab === "assistant" ? (
        <AssistantTab documentsInForce={inForce} onOpenSource={openSource} />
      ) : (
        <DocumentsTab data={data} reload={reload} onOpenSource={openSource} />
      )}

      <DocumentViewer target={viewed} onHide={() => setViewed(null)} />
    </div>
  );
}
