import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { Dialog } from "primereact/dialog";
import AdminMainContainerPage from "../../AdminMainContainerPage";
import { useAdmin } from "@/services/providers/AdminProvider";
import { askAssistant, getAssistantOfferContext } from "@/services/api/assistant/assistantApiService";
import { getAdminOffers, getOperatorOffers } from "@/services/api/offers/offersApiServices";
import { buildOfferText } from "@/services/tools/helper";
import { renderMarkdown, stripMarkdown } from "@/services/tools/markdown";
import { toastInfo } from "@/componnents/notification/notification";

/**
 * ComparIA  - assistant d'analyse des offres (espace de gestion).
 *
 * Remplace l'ancienne page :
 *  - le premier message plantait (`lexiaQuery` indéfini puis `.history`) ;
 *  - l'appel partait du navigateur vers le service d'analyse (refusé hors
 *    `localhost:3001`) : il passe désormais par `/api/assistant/chat` ;
 *  - barre latérale factice (« NeuralFlow », « user@example.com », menus sans
 *    effet) remplacée par de vraies conversations, enregistrées dans ce
 *    navigateur pour l'utilisateur connecté ;
 *  - la réponse était injectée en HTML brut : rendu Markdown échappé.
 *
 * Conservé : l'ouverture depuis la validation d'une offre (« Poursuivre
 * l'échange avec l'assistant ») via les paramètres `iaInput` / `iaRes`.
 */

const MAX_CONVERSATIONS = 40;
const MAX_MESSAGES = 80;
const MAX_INPUT = 12000;
const HISTORY_SENT = 16;

const SUGGESTIONS = [
  {
    icon: "bi-shield-check",
    title: "Conformité d'une offre",
    prompt: "Quels points dois-je vérifier pour m'assurer qu'une offre mobile est conforme aux règles de l'ARTCI avant de la valider ?",
  },
  {
    icon: "bi-megaphone",
    title: "Offres promotionnelles",
    prompt: "Quelles sont les règles applicables aux offres promotionnelles (durée, information du consommateur, notification) ?",
  },
  {
    icon: "bi-pencil-square",
    title: "Rédiger un motif de rejet",
    prompt: "Aide-moi à rédiger un motif de rejet clair et argumenté pour une offre dont le prix affiché ne correspond pas aux formules déclarées.",
  },
  {
    icon: "bi-bar-chart-line",
    title: "Comparer des tarifs",
    prompt: "Comment comparer objectivement le rapport prix / volume de données entre plusieurs offres internet mobile ?",
  },
];

const uid = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

const titleFrom = (text) => {
  const plain = stripMarkdown(text);
  return plain.length > 60 ? `${plain.slice(0, 57)}…` : plain || "Nouvelle conversation";
};

const parseQueryJson = (value) => {
  if (typeof value !== "string" || !value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
};

const formatWhen = (ts) => {
  if (!ts) return "";
  const d = new Date(ts);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  return sameDay
    ? d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
    : d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
};

const groupLabel = (ts) => {
  const days = Math.floor((Date.now() - ts) / 86400000);
  if (days < 1 && new Date(ts).toDateString() === new Date().toDateString()) return "Aujourd'hui";
  if (days < 7) return "7 derniers jours";
  if (days < 30) return "30 derniers jours";
  return "Plus ancien";
};

const storageKeyOf = (user) => (user?.id ? `compartic-assistant:${user.id}` : null);

const loadConversations = (key) => {
  if (!key) return [];
  try {
    const raw = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(raw) ? raw.filter((c) => c?.id && Array.isArray(c.messages)) : [];
  } catch {
    return [];
  }
};

const copyText = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    toastInfo("Texte copié", 1200);
  } catch {
    toastInfo("La copie n'est pas disponible dans ce navigateur.", 2000);
  }
};

/* ------------------------------------------------------------------------ */

function Message({ message, isLast, busy, onRegenerate, onRetry }) {
  const html = useMemo(
    () => (message.role === "assistant" && !message.error ? renderMarkdown(message.content) : null),
    [message.role, message.error, message.content],
  );

  if (message.role === "user") {
    return (
      <div className="ast-msg ast-msg--user">
        <div className="ast-bubble">
          <div className="ast-user-text">{message.content}</div>
        </div>
        <div className="ast-msg-meta">
          {formatWhen(message.at)}
          <button type="button" className="ast-icon-btn" onClick={() => copyText(message.content)} title="Copier">
            <i className="bi bi-copy" aria-hidden="true"></i>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="ast-msg ast-msg--assistant">
      <div className="ast-avatar" aria-hidden="true">
        <i className="bi bi-robot"></i>
      </div>
      <div className="ast-msg-body">
        {message.error ? (
          <div className={`ast-error${message.aborted ? " ast-error--muted" : ""}`} role="alert">
            <i className={`bi ${message.aborted ? "bi-stop-circle" : "bi-exclamation-triangle"} me-2`} aria-hidden="true"></i>
            <span>{message.content}</span>
            {isLast && !busy && (
              <button type="button" className="ast-chip-btn ms-auto" onClick={onRetry}>
                <i className="bi bi-arrow-clockwise me-1" aria-hidden="true"></i> Réessayer
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="ast-markdown" dangerouslySetInnerHTML={{ __html: html }} />
            {message.offers?.used && (
              <div className="ast-sources">
                <i className="bi bi-database" aria-hidden="true"></i>
                <span>
                  {message.offers.sources?.length
                    ? `Base des offres consultée (${message.offers.scope === "OPERATOR" ? "vos offres" : "toutes les offres"}) : `
                    : "Base des offres consultée : aucune offre ne correspond."}
                  {(message.offers.sources || []).map((o, i) => (
                    <React.Fragment key={o.id}>
                      {i > 0 ? ", " : ""}
                      <Link href={`/offer-workflow/${o.id}`} target="_blank" title={`${o.title}    ${o.operator || ""}`}>
                        {o.code}
                      </Link>
                    </React.Fragment>
                  ))}
                  {message.offers.total > (message.offers.sources || []).length ? ` (+${message.offers.total - message.offers.sources.length})` : ""}
                </span>
              </div>
            )}
            <div className="ast-msg-meta">
              {formatWhen(message.at)}
              {message.durationMs ? <span> · {(message.durationMs / 1000).toFixed(1)} s</span> : null}
              {message.imported ? <span> · analyse de la validation</span> : null}
              <button type="button" className="ast-icon-btn" onClick={() => copyText(message.content)} title="Copier la réponse">
                <i className="bi bi-copy" aria-hidden="true"></i>
              </button>
              {isLast && !busy && (
                <button type="button" className="ast-icon-btn" onClick={onRegenerate} title="Générer une autre réponse">
                  <i className="bi bi-arrow-repeat" aria-hidden="true"></i>
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function OfferPicker({ visible, onHide, user, onPick }) {
  const [offers, setOffers] = useState(null);
  const [failed, setFailed] = useState(false);
  const [search, setSearch] = useState("");

  const isFocalPoint = user?.profile?.code === "PRF2-TEST";
  const operatorId = user?.focalPoint?.operatorId ?? user?.focalPoint?.operator?.id;

  useEffect(() => {
    if (!visible || offers) return;
    let cancelled = false;
    (async () => {
      setFailed(false);
      const data = isFocalPoint ? await getOperatorOffers(operatorId) : await getAdminOffers();
      if (cancelled) return;
      if (Array.isArray(data)) setOffers(data);
      else setFailed(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [visible, offers, isFocalPoint, operatorId]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = (offers || []).slice().sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));
    if (!q) return list.slice(0, 60);
    return list
      .filter((o) =>
        [o.title, o.reference, o.code, o.operator?.name, o.category].filter(Boolean).some((v) => String(v).toLowerCase().includes(q)),
      )
      .slice(0, 60);
  }, [offers, search]);

  return (
    <Dialog
      header="Analyser une offre"
      visible={visible}
      onHide={onHide}
      modal
      style={{ width: "min(720px, 96vw)" }}
      breakpoints={{ "641px": "100vw" }}
    >
      <p className="text-muted small mb-2">
        L'offre choisie est décrite à l'assistant (formules, tarifs, zone, modes d'activation, description), qui en analyse la
        conformité.
      </p>
      <div className="ast-search mb-2">
        <i className="bi bi-search" aria-hidden="true"></i>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher par titre, opérateur, catégorie…"
          aria-label="Rechercher une offre"
          autoFocus
        />
      </div>
      {!offers && !failed && (
        <div className="ast-picker-state">
          <span className="spinner-border spinner-border-sm me-2" aria-hidden="true"></span> Chargement des offres…
        </div>
      )}
      {failed && (
        <div className="ast-picker-state text-danger">
          Les offres n'ont pas pu être chargées.{" "}
          <button type="button" className="btn btn-link btn-sm p-0" onClick={() => setOffers(null)}>
            Réessayer
          </button>
        </div>
      )}
      {offers && !filtered.length && <div className="ast-picker-state">Aucune offre ne correspond.</div>}
      {offers && filtered.length > 0 && (
        <ul className="ast-picker-list">
          {filtered.map((o) => (
            <li key={o.id}>
              <button type="button" onClick={() => onPick(o)}>
                <span className="ast-picker-dot" style={{ background: o.operator?.color || "#94a3b8" }} aria-hidden="true"></span>
                <span className="ast-picker-main">
                  <b>{o.title || "Offre sans titre"}</b>
                  <small>
                    {[o.operator?.name, o.category, o.specialPromotion ? "Promotionnelle" : "De base", o.status]
                      .filter(Boolean)
                      .join(" · ")}
                  </small>
                </span>
                <i className="bi bi-chevron-right" aria-hidden="true"></i>
              </button>
            </li>
          ))}
        </ul>
      )}
    </Dialog>
  );
}

/* ------------------------------------------------------------------------ */

export default function AdminAssistanceHomePage() {
  const router = useRouter();
  const { user } = useAdmin();
  const storageKey = storageKeyOf(user);

  const [conversations, setConversations] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [activeId, setActiveId] = useState(null);
  const [input, setInput] = useState("");
  const [pendingId, setPendingId] = useState(null); // conversation en attente de réponse
  const [panelOpen, setPanelOpen] = useState(false);
  const [historySearch, setHistorySearch] = useState("");
  const [renaming, setRenaming] = useState(null);
  const [pickerOpen, setPickerOpen] = useState(false);

  const abortRef = useRef(null);
  const scrollRef = useRef(null);
  const textareaRef = useRef(null);
  const importedRef = useRef(false);

  // Chargement des conversations de l'utilisateur connecté.
  useEffect(() => {
    if (!storageKey) return;
    setConversations(loadConversations(storageKey));
    setLoaded(true);
  }, [storageKey]);

  // Enregistrement (sans les réponses interrompues en cours).
  useEffect(() => {
    if (!loaded || !storageKey) return;
    try {
      const trimmed = conversations
        .filter((c) => c.messages.length)
        .slice(0, MAX_CONVERSATIONS)
        .map((c) => ({ ...c, messages: c.messages.slice(-MAX_MESSAGES) }));
      localStorage.setItem(storageKey, JSON.stringify(trimmed));
    } catch {
      /* stockage plein ou indisponible : la conversation reste en mémoire */
    }
  }, [conversations, loaded, storageKey]);

  // Arrêt de la requête en cours en quittant la page.
  useEffect(() => () => abortRef.current?.abort(), []);

  const active = useMemo(() => conversations.find((c) => c.id === activeId) || null, [conversations, activeId]);
  const messages = active?.messages || [];
  const busy = !!pendingId;
  const waitingHere = busy && pendingId === activeId;

  const patchConversation = useCallback((id, updater) => {
    setConversations((list) => {
      const next = list.map((c) => (c.id === id ? { ...updater(c), updatedAt: Date.now() } : c));
      return next.sort((a, b) => b.updatedAt - a.updatedAt);
    });
  }, []);

  // Défilement vers le dernier message.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages.length, waitingHere, activeId]);

  // Hauteur automatique de la zone de saisie.
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 220)}px`;
  }, [input]);

  /** Envoie `history` (se terminant par la question) et ajoute la réponse. */
  const requestAnswer = useCallback(
    async (conversationId, history, offerId = null) => {
      const question = history[history.length - 1]?.content || "";
      const controller = new AbortController();
      abortRef.current = controller;
      setPendingId(conversationId);

      const res = await askAssistant({
        question,
        history: history
          .filter((m) => !m.error && (m.role === "user" || m.role === "assistant"))
          .slice(-HISTORY_SENT)
          .map((m) => ({ role: m.role, content: m.content })),
        signal: controller.signal,
        // Conversation ouverte depuis une offre : le serveur garde cette offre en contexte.
        offerId,
      });

      if (abortRef.current === controller) abortRef.current = null;
      setPendingId(null);

      const reply = res.error
        ? { id: uid(), role: "assistant", error: true, aborted: !!res.aborted, content: res.message, at: Date.now() }
        : { id: uid(), role: "assistant", content: res.data, durationMs: res.durationMs, offers: res.offers, at: Date.now() };
      patchConversation(conversationId, (c) => ({ ...c, messages: [...c.messages, reply] }));
    },
    [patchConversation],
  );

  const send = useCallback(
    (text) => {
      const content = String(text ?? "").trim();
      if (!content || busy) return;
      if (content.length > MAX_INPUT) {
        toastInfo(`Le message dépasse ${MAX_INPUT} caractères.`, 2500);
        return;
      }
      const userMessage = { id: uid(), role: "user", content, at: Date.now() };
      let conversationId = activeId;
      let history;

      if (!active) {
        conversationId = uid();
        history = [userMessage];
        const conversation = {
          id: conversationId,
          title: titleFrom(content),
          createdAt: Date.now(),
          updatedAt: Date.now(),
          messages: history,
        };
        setConversations((list) => [conversation, ...list]);
        setActiveId(conversationId);
      } else {
        history = [...active.messages.filter((m) => !m.error), userMessage];
        patchConversation(conversationId, (c) => ({ ...c, messages: [...c.messages.filter((m) => !m.error), userMessage] }));
      }
      setInput("");
      requestAnswer(conversationId, history, active?.offer?.id || null);
    },
    [active, activeId, busy, patchConversation, requestAnswer],
  );

  /** Relance la dernière question (après erreur ou pour une autre réponse). */
  const regenerate = useCallback(() => {
    if (!active || busy) return;
    const list = active.messages.slice();
    while (list.length && list[list.length - 1].role === "assistant") list.pop();
    if (!list.length) return;
    patchConversation(active.id, (c) => ({ ...c, messages: list }));
    requestAnswer(active.id, list, active.offer?.id || null);
  }, [active, busy, patchConversation, requestAnswer]);

  const stop = () => abortRef.current?.abort();

  const newConversation = () => {
    if (busy) stop();
    setActiveId(null);
    setInput("");
    setPanelOpen(false);
    setTimeout(() => textareaRef.current?.focus(), 0);
  };

  const openConversation = (id) => {
    setActiveId(id);
    setPanelOpen(false);
  };

  const deleteConversation = (id) => {
    if (!window.confirm("Supprimer cette conversation ?")) return;
    if (pendingId === id) stop();
    setConversations((list) => list.filter((c) => c.id !== id));
    if (activeId === id) setActiveId(null);
  };

  const commitRename = () => {
    if (!renaming) return;
    const title = renaming.title.trim();
    if (title) patchConversation(renaming.id, (c) => ({ ...c, title: title.slice(0, 80) }));
    setRenaming(null);
  };

  const clearAll = () => {
    if (!conversations.length || !window.confirm("Supprimer tout l'historique des conversations ?")) return;
    stop();
    setConversations([]);
    setActiveId(null);
  };

  const copyConversation = () => {
    if (!active) return;
    const text = active.messages
      .filter((m) => !m.error)
      .map((m) => `${m.role === "user" ? "Vous" : "ComparIA"} :\n${m.content}`)
      .join("\n\n");
    copyText(text);
  };

  // Ouverture depuis une offre (« Analyser avec ComparIA ») : ?offer=<id>.
  // La page charge le contexte côté serveur : description de l'offre et
  // analyse IA déjà enregistrée, qui devient le point de départ de l'échange.
  // Aucune analyse n'est relancée ; l'utilisateur poursuit, précise ou en
  // demande une nouvelle.
  useEffect(() => {
    if (!router.isReady || !loaded || importedRef.current) return;
    const offerId = Number(router.query.offer);
    if (!Number.isInteger(offerId) || offerId <= 0) return;
    importedRef.current = true;

    (async () => {
      const ctx = await getAssistantOfferContext(offerId);
      if (ctx.error) {
        toastInfo(ctx.message, 4000);
        return;
      }
      // L'adresse garde ?offer= (la retirer provoque un changement de route qui
      // démonte la page). Un rechargement ne doit pas dupliquer l'échange : la
      // conversation déjà ouverte pour cette offre et cette analyse est reprise.
      const analysisId = ctx.analysis?.id || null;
      const existing = loadConversations(storageKey).find((c) => c.offer?.id === ctx.offer.id && (c.analysisId || null) === analysisId);
      if (existing) {
        setActiveId(existing.id);
        return;
      }
      const now = Date.now();
      const label = `« ${ctx.offer.title} » (${ctx.offer.code})`;
      const msgs = [
        {
          id: uid(),
          role: "user",
          at: now,
          content: `Analyse la conformité de l'offre ${label}${ctx.offer.operator ? ` de ${ctx.offer.operator}` : ""} et signale les points à vérifier ou à corriger avant validation :\n\n${ctx.input}`,
        },
      ];
      if (ctx.analysis?.content) {
        msgs.push({ id: uid(), role: "assistant", content: ctx.analysis.content, at: new Date(ctx.analysis.createdAt).getTime() || now, imported: true });
      }
      const conversation = {
        id: uid(),
        title: titleFrom(`Offre ${ctx.offer.code}    ${ctx.offer.title}`),
        createdAt: now,
        updatedAt: now,
        offer: ctx.offer,
        analysisId,
        messages: msgs,
      };
      setConversations((list) => [conversation, ...list]);
      setActiveId(conversation.id);
      if (!ctx.analysis?.content) {
        toastInfo("Aucune analyse n'est enregistrée pour cette offre : posez votre question ou demandez l'analyse.", 5000);
      }
      setTimeout(() => textareaRef.current?.focus(), 0);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.isReady, router.query.offer, loaded, storageKey]);

  const pickOffer = (offer) => {
    setPickerOpen(false);
    let description;
    try {
      description = buildOfferText(offer);
    } catch {
      description = `Offre « ${offer?.title || ""} » de l'opérateur ${offer?.operator?.name || ""}.`;
    }
    setActiveId(null);
    // `send` lit la conversation active : on attend la remise à zéro.
    setTimeout(() => {
      setInput(
        `Analyse la conformité de l'offre suivante et signale les points à vérifier ou à corriger avant validation :\n\n${description}`,
      );
      textareaRef.current?.focus();
    }, 0);
  };

  const groups = useMemo(() => {
    const q = historySearch.trim().toLowerCase();
    const list = conversations.filter(
      (c) => !q || c.title.toLowerCase().includes(q) || c.messages.some((m) => m.content?.toLowerCase().includes(q)),
    );
    const map = new Map();
    list.forEach((c) => {
      const label = groupLabel(c.updatedAt);
      if (!map.has(label)) map.set(label, []);
      map.get(label).push(c);
    });
    return [...map.entries()];
  }, [conversations, historySearch]);

  const onKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      send(input);
    }
  };

  const firstName = user?.firstName || user?.firstname || "";
  const lastIndex = messages.length - 1;

  return (
    <AdminMainContainerPage
      active="lexia"
      children={
        <div className="ast">
          {/* Conversations */}
          <aside className={`ast-panel${panelOpen ? " is-open" : ""}`} aria-label="Conversations">
            <div className="ast-panel-head">
              <button type="button" className="ast-new" onClick={newConversation}>
                <i className="bi bi-plus-lg me-2" aria-hidden="true"></i> Nouvelle conversation
              </button>
              <button type="button" className="ast-icon-btn d-lg-none" onClick={() => setPanelOpen(false)} title="Fermer">
                <i className="bi bi-x-lg" aria-hidden="true"></i>
              </button>
            </div>
            <div className="ast-search">
              <i className="bi bi-search" aria-hidden="true"></i>
              <input
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                placeholder="Rechercher"
                aria-label="Rechercher dans les conversations"
              />
            </div>

            <div className="ast-history">
              {!loaded && (
                <div className="ast-history-empty">
                  <span className="spinner-border spinner-border-sm me-2" aria-hidden="true"></span> Chargement…
                </div>
              )}
              {loaded && !groups.length && (
                <div className="ast-history-empty">
                  {historySearch ? "Aucune conversation trouvée." : "Vos conversations apparaîtront ici."}
                </div>
              )}
              {groups.map(([label, items]) => (
                <div key={label} className="ast-history-group">
                  <div className="ast-history-label">{label}</div>
                  {items.map((c) => (
                    <div key={c.id} className={`ast-history-item${c.id === activeId ? " is-active" : ""}`}>
                      {renaming?.id === c.id ? (
                        <input
                          className="ast-rename"
                          value={renaming.title}
                          autoFocus
                          maxLength={80}
                          onChange={(e) => setRenaming({ ...renaming, title: e.target.value })}
                          onBlur={commitRename}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") commitRename();
                            if (e.key === "Escape") setRenaming(null);
                          }}
                          aria-label="Nouveau titre"
                        />
                      ) : (
                        <button type="button" className="ast-history-open" onClick={() => openConversation(c.id)} title={c.title}>
                          <i className={`bi ${pendingId === c.id ? "bi-hourglass-split" : "bi-chat-left-text"}`} aria-hidden="true"></i>
                          <span>{c.title}</span>
                        </button>
                      )}
                      <div className="ast-history-actions">
                        <button type="button" className="ast-icon-btn" title="Renommer" onClick={() => setRenaming({ id: c.id, title: c.title })}>
                          <i className="bi bi-pencil" aria-hidden="true"></i>
                        </button>
                        <button type="button" className="ast-icon-btn ast-icon-btn--danger" title="Supprimer" onClick={() => deleteConversation(c.id)}>
                          <i className="bi bi-trash" aria-hidden="true"></i>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>

            <div className="ast-panel-foot">
              <span>
                <i className="bi bi-lock me-1" aria-hidden="true"></i> Enregistré sur ce navigateur
              </span>
              {conversations.length > 0 && (
                <button type="button" className="btn btn-link btn-sm text-danger p-0" onClick={clearAll}>
                  Tout effacer
                </button>
              )}
            </div>
          </aside>
          {panelOpen && <div className="ast-backdrop d-lg-none" onClick={() => setPanelOpen(false)} aria-hidden="true" />}

          {/* Discussion */}
          <section className="ast-chat">
            <header className="ast-chat-head">
              <button type="button" className="ast-icon-btn d-lg-none" onClick={() => setPanelOpen(true)} title="Conversations">
                <i className="bi bi-layout-sidebar" aria-hidden="true"></i>
              </button>
              <div className="ast-brand">
                <span className="ast-brand-icon" aria-hidden="true">
                  <i className="bi bi-robot"></i>
                </span>
                <div className="min-w-0">
                  <div className="ast-brand-title">{active ? active.title : "ComparIA"}</div>
                  <div className="ast-brand-sub">
                    <span className={`ast-status${busy ? " is-busy" : ""}`} aria-hidden="true"></span>
                    {busy ? "Analyse en cours…" : active?.offer ? `Offre en contexte : ${active.offer.code}` : "Assistant d'analyse des offres"}
                  </div>
                </div>
              </div>
              <div className="ast-head-actions">
                <button type="button" className="ast-chip-btn" onClick={() => setPickerOpen(true)} disabled={busy}>
                  <i className="bi bi-file-earmark-text me-1" aria-hidden="true"></i>
                  <span className="d-none d-sm-inline">Analyser une offre</span>
                </button>
                {active && (
                  <button type="button" className="ast-icon-btn" onClick={copyConversation} title="Copier la conversation">
                    <i className="bi bi-clipboard" aria-hidden="true"></i>
                  </button>
                )}
              </div>
            </header>

            <div className="ast-scroll" ref={scrollRef}>
              {!active ? (
                <div className="ast-welcome">
                  <div className="ast-welcome-icon" aria-hidden="true">
                    <i className="bi bi-stars"></i>
                  </div>
                  <h2>Bonjour{firstName ? ` ${firstName}` : ""}, comment puis-je vous aider ?</h2>
                  <p>
                    Posez une question sur la réglementation des offres, demandez l'analyse d'une offre ou l'aide à la rédaction
                    d'une décision.
                  </p>
                  <div className="ast-suggestions">
                    {SUGGESTIONS.map((s) => (
                      <button key={s.title} type="button" className="ast-suggestion" onClick={() => send(s.prompt)} disabled={busy}>
                        <i className={`bi ${s.icon}`} aria-hidden="true"></i>
                        <b>{s.title}</b>
                        <span>{s.prompt}</span>
                      </button>
                    ))}
                    <button type="button" className="ast-suggestion ast-suggestion--accent" onClick={() => setPickerOpen(true)} disabled={busy}>
                      <i className="bi bi-file-earmark-check" aria-hidden="true"></i>
                      <b>Analyser une offre enregistrée</b>
                      <span>Choisissez une offre : sa description complète est transmise à l'assistant.</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="ast-thread">
                  {messages.map((m, i) => (
                    <Message
                      key={m.id}
                      message={m}
                      isLast={i === lastIndex}
                      busy={busy}
                      onRegenerate={regenerate}
                      onRetry={regenerate}
                    />
                  ))}
                  {waitingHere && (
                    <div className="ast-msg ast-msg--assistant">
                      <div className="ast-avatar" aria-hidden="true">
                        <i className="bi bi-robot"></i>
                      </div>
                      <div className="ast-msg-body">
                        <div className="ast-typing" role="status" aria-label="L'assistant rédige sa réponse">
                          <span></span>
                          <span></span>
                          <span></span>
                          <em>Analyse en cours…</em>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <form
              className="ast-composer"
              onSubmit={(e) => {
                e.preventDefault();
                send(input);
              }}
            >
              <div className={`ast-input${busy ? " is-busy" : ""}`}>
                <textarea
                  ref={textareaRef}
                  value={input}
                  rows={1}
                  maxLength={MAX_INPUT}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={onKeyDown}
                  placeholder={busy ? "Patientez pendant la réponse…" : "Écrivez votre question…"}
                  aria-label="Votre message"
                />
                {busy ? (
                  <button type="button" className="ast-send ast-send--stop" onClick={stop} title="Arrêter la réponse">
                    <i className="bi bi-stop-fill" aria-hidden="true"></i>
                  </button>
                ) : (
                  <button type="submit" className="ast-send" disabled={!input.trim()} title="Envoyer (Entrée)">
                    <i className="bi bi-send-fill" aria-hidden="true"></i>
                  </button>
                )}
              </div>
              <div className="ast-composer-foot">
                <span>Entrée pour envoyer · Maj + Entrée pour aller à la ligne</span>
                <span>
                  {input.length > MAX_INPUT * 0.8 ? `${input.length} / ${MAX_INPUT} · ` : ""}
                  Les réponses de l'IA sont indicatives : vérifiez-les avant toute décision.
                </span>
              </div>
            </form>
          </section>

          <OfferPicker visible={pickerOpen} onHide={() => setPickerOpen(false)} user={user} onPick={pickOffer} />
        </div>
      }
    />
  );
}
