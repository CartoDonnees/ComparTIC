import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Dialog } from "primereact/dialog";
import { Editor } from "primereact/editor";
import { Menu } from "primereact/menu";
import {
  deleteOfferLetter,
  generateOfferLetter,
  getOfferLetterWorkspace,
  saveOfferLetter,
  sendOfferLetter,
} from "@/services/api/workflow/workflowApiService";
import { LETTER_LOGO, letterEmailHtml, letterToText, letterheadHtml, sanitizeLetterHtml } from "@/services/letters/letterHtml";
import { WEBMAILS, buildEml, buildMailto, buildWebmailUrl, emlFileName, mailtoLimit } from "@/services/letters/mailCompose";
import { parseRecipients, recipientsError } from "@/services/letters/recipients";
import { formatDateTime } from "@/services/tools/workflowLabels";
import { toastInfo, toastSuccess } from "@/componnents/notification/notification";

/**
 * Courrier au soumissionnaire d'une offre validée, refusée ou suspendue.
 *
 * À l'ouverture : le dernier courrier enregistré depuis que l'offre est dans
 * son état actuel, sinon un modèle généré à partir de l'offre, de la décision
 * (validation, refus ou suspension), des commentaires des validateurs et de
 * l'analyse IA. Un courrier plus ancien notifiait une autre décision : il
 * reste consultable dans « Courriers enregistrés », sans être rouvert d'office. Le texte reste entièrement modifiable : mise en forme, titres,
 * paragraphes, insertion des données de l'offre, aperçu, impression, copie et
 * envoi par e-mail (depuis la plateforme ou depuis la messagerie de l'agent).
 *
 * Un brouillon garde le même identifiant tant qu'on travaille dessus :
 * l'enregistrer, le régénérer ou échouer à l'envoyer le met à jour, sans en
 * créer un second. L'aperçu et l'impression portent le logo de l'ARTCI.
 *
 * @param offerId  offre validée, refusée ou suspendue
 * @param visible / onHide
 */

const PRINT_CSS = `
  @page { size: A4; margin: 20mm 20mm 22mm; }
  * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  body { font-family: Georgia, "Times New Roman", serif; color: #1c2430; font-size: 12pt; line-height: 1.55; margin: 0; }
  .lt-letterhead { border-bottom: 2px solid #f57c00; padding-bottom: 4mm; margin-bottom: 9mm; }
  .lt-letterhead img { display: block; height: 20mm; width: auto; }
  h1, h2, h3, h4 { font-family: Arial, Helvetica, sans-serif; color: #0f172a; margin: 18px 0 6px; }
  h1 { font-size: 15pt; } h2 { font-size: 13pt; } h3 { font-size: 11.5pt; text-transform: uppercase; letter-spacing: 0.03em; }
  p { margin: 0 0 10px; } ul, ol { margin: 0 0 10px 20px; padding: 0; } li { margin-bottom: 4px; }
  .ql-align-right { text-align: right; } .ql-align-center { text-align: center; } .ql-align-justify { text-align: justify; }
  .ql-indent-1 { padding-left: 3em; } .ql-indent-2 { padding-left: 6em; } .ql-indent-3 { padding-left: 9em; }
`;

const escapeText = (text) => String(text ?? "").replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]);

const documentOf = (subject, html, logoUrl) =>
  `<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>${escapeText(subject)}</title><style>${PRINT_CSS}</style></head><body>` +
  `${letterheadHtml(logoUrl)}${html}</body></html>`;

/** Logo de l'ARTCI en base64, pour l'intégrer à un fichier de message. */
const fetchLogoBase64 = async () => {
  try {
    const res = await fetch(LETTER_LOGO.path);
    if (!res.ok) return null;
    const bytes = new Uint8Array(await res.arrayBuffer());
    let binary = "";
    for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    return window.btoa(binary);
  } catch {
    return null;
  }
};

const KIND_TITLE = {
  VALIDATED: "Courrier de validation",
  REFUSED: "Courrier de refus",
  SUSPENDED: "Courrier de suspension",
};

export default function OfferLetterEditor({ offerId, visible, onHide }) {
  const [workspace, setWorkspace] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [letterId, setLetterId] = useState(null);
  const [status, setStatus] = useState("NEW"); // NEW | DRAFT | SENT
  const [sentInfo, setSentInfo] = useState(null);
  const [subject, setSubject] = useState("");
  const [html, setHtml] = useState("");
  const [editorKey, setEditorKey] = useState(0); // recrée l'éditeur quand le contenu est remplacé
  const [dirty, setDirty] = useState(false);
  const [tab, setTab] = useState("edit");
  const [busy, setBusy] = useState(null); // "load" | "generate" | "save" | "send"
  const [notice, setNotice] = useState(null);
  const [error, setError] = useState(null);
  const [mail, setMail] = useState(null); // { to, confirm, error, launch }
  const editorRef = useRef(null);
  // Identifiant du brouillon en cours : lu au moment de l'appel, jamais celui d'un rendu précédent.
  const letterIdRef = useRef(null);
  const statusRef = useRef("NEW");
  const contentRef = useRef({ subject: "", html: "" });
  const saveLock = useRef(null); // enregistrement en cours (promesse partagée)
  const sendLock = useRef(false);
  const fieldsMenu = useRef(null);
  const draftsMenu = useRef(null);
  const loadedHtml = useRef("");

  const readOnly = status === "SENT";
  contentRef.current = { subject, html };

  /** Rattache l'éditeur à un courrier enregistré, sans toucher au texte affiché. */
  const adoptLetter = useCallback((id, nextStatus) => {
    letterIdRef.current = id || null;
    statusRef.current = nextStatus || "NEW";
    setLetterId(id || null);
    setStatus(nextStatus || "NEW");
  }, []);

  const applyLetter = useCallback((letter) => {
    adoptLetter(letter.id, letter.status);
    setSentInfo(letter.status === "SENT" ? { at: letter.sentAt, to: letter.sentTo } : null);
    setSubject(letter.subject || "");
    loadedHtml.current = letter.html || "";
    setHtml(letter.html || "");
    setEditorKey((k) => k + 1);
    setDirty(false);
  }, [adoptLetter]);

  const generate = useCallback(
    async (withAi = true, note = "") => {
      setBusy("generate");
      setError(null);
      const res = await generateOfferLetter(offerId, withAi);
      setBusy(null);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      // Un brouillon en cours reste le même courrier : le modèle le remplacera à
      // l'enregistrement, au lieu de laisser l'ancien brouillon en double.
      const draftId = statusRef.current === "DRAFT" ? letterIdRef.current : null;
      applyLetter({ id: draftId, subject: res.data.subject, html: res.data.html, status: draftId ? "DRAFT" : "NEW" });
      setDirty(true);
      setNotice(
        (res.data.synthesis === "AI"
          ? "Modèle généré : la synthèse de l'examen a été rédigée par l'assistant IA à partir de l'analyse et des commentaires des validateurs. Relisez-la avant envoi."
          : res.data.aiRequested
            ? "Modèle généré sans l'assistant IA (service indisponible) : la synthèse a été composée à partir des éléments enregistrés."
            : "Modèle généré à partir des éléments enregistrés.") +
          (draftId ? " L'enregistrement remplacera le brouillon en cours." : "") +
          note,
      );
    },
    [offerId, applyLetter],
  );

  // Ouverture : dernier brouillon, sinon génération du modèle.
  useEffect(() => {
    if (!visible || !offerId) return undefined;
    let cancelled = false;
    setWorkspace(null);
    setLoadError(null);
    setNotice(null);
    setError(null);
    setMail(null);
    setTab("edit");
    adoptLetter(null, "NEW");
    setBusy("load");
    getOfferLetterWorkspace(offerId).then((res) => {
      if (cancelled) return;
      setBusy(null);
      if (!res.ok) {
        setLoadError(res.error);
        return;
      }
      setWorkspace(res.data);
      // Seul un courrier enregistré depuis l'état actuel de l'offre est repris :
      // après un refus ou une suspension, on ne rouvre pas le courrier de validation.
      const latest = res.data.letters[0];
      const since = res.data.stateSince ? new Date(res.data.stateSince).getTime() : 0;
      if (latest && new Date(latest.updatedAt).getTime() >= since) applyLetter(latest);
      else generate(true, latest ? " Les courriers établis avant cette décision restent dans « Courriers enregistrés »." : "");
    });
    return () => {
      cancelled = true;
    };
  }, [visible, offerId, applyLetter, adoptLetter, generate]);

  const close = () => {
    if (busy === "save" || busy === "send") return;
    if (dirty && !window.confirm("Le courrier contient des modifications non enregistrées. Fermer sans enregistrer ?")) return;
    onHide?.();
  };

  const quill = () => editorRef.current?.getQuill?.() || null;

  /** Insère une donnée de l'offre à l'emplacement du curseur. */
  const insertField = (field) => {
    const q = quill();
    if (!q || readOnly) return;
    const range = q.getSelection(true) || { index: q.getLength() - 1, length: 0 };
    if (field.html) q.clipboard.dangerouslyPasteHTML(range.index, field.html, "user");
    else q.insertText(range.index, field.value, "user");
    q.focus();
  };

  const fieldItems = useMemo(() => {
    const groups = new Map();
    (workspace?.fields || []).forEach((f) => {
      if (!groups.has(f.group)) groups.set(f.group, []);
      groups.get(f.group).push({ label: f.label, command: () => insertField(f) });
    });
    return [...groups.entries()].map(([label, items]) => ({ label, items }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspace, readOnly]);

  const draftItems = useMemo(
    () =>
      (workspace?.letters || []).map((l) => ({
        label: `${l.status === "SENT" ? "Envoyé" : "Brouillon"}    ${formatDateTime(l.status === "SENT" ? l.sentAt : l.updatedAt)}`,
        icon: l.status === "SENT" ? "bi bi-send-check" : "bi bi-file-earmark-text",
        command: () => {
          if (dirty && !window.confirm("Remplacer le texte en cours par ce courrier ? Les modifications non enregistrées seront perdues.")) return;
          applyLetter(l);
          setNotice(null);
        },
      })),
    [workspace, dirty, applyLetter],
  );

  const refreshWorkspace = async () => {
    const res = await getOfferLetterWorkspace(offerId);
    if (res.ok) setWorkspace(res.data);
  };

  /**
   * Enregistre le brouillon. Un seul enregistrement à la fois : un second clic
   * pendant l'opération attend le premier au lieu d'en lancer un autre.
   */
  const save = ({ silent = false } = {}) => {
    if (saveLock.current) return saveLock.current;
    const run = (async () => {
      setBusy("save");
      setError(null);
      const sent = { ...contentRef.current };
      const res = await saveOfferLetter(offerId, { id: letterIdRef.current, ...sent });
      setBusy(null);
      if (!res.ok) {
        setError(res.error);
        return null;
      }
      adoptLetter(res.data.id, "DRAFT");
      // Texte modifié pendant l'enregistrement : il reste « à enregistrer ».
      setDirty(contentRef.current.subject !== sent.subject || contentRef.current.html !== sent.html);
      if (!silent) toastSuccess(res.data.unchanged ? "Brouillon déjà enregistré : aucune modification." : "Brouillon enregistré.");
      refreshWorkspace();
      return res.data;
    })();
    saveLock.current = run;
    run.finally(() => {
      saveLock.current = null;
    });
    return run;
  };

  const duplicate = () => {
    // Un courrier envoyé est figé : sa copie repart en brouillon.
    adoptLetter(null, "NEW");
    setSentInfo(null);
    setDirty(true);
    setEditorKey((k) => k + 1);
    setNotice("Copie du courrier envoyé : elle sera enregistrée comme nouveau brouillon.");
  };

  const removeDraft = async () => {
    if (!letterIdRef.current || readOnly || busy || !window.confirm("Supprimer ce brouillon ?")) return;
    setBusy("delete");
    const res = await deleteOfferLetter(offerId, letterIdRef.current);
    setBusy(null);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    adoptLetter(null, "NEW");
    toastSuccess("Brouillon supprimé.");
    await refreshWorkspace();
    generate(false);
  };

  const cleanHtml = useMemo(() => sanitizeLetterHtml(html), [html]);

  const print = () => {
    const win = window.open("", "_blank", "width=900,height=1000");
    if (!win) {
      toastInfo("L'impression a été bloquée par le navigateur : autorisez les fenêtres pour ce site.", 4000);
      return;
    }
    win.document.write(documentOf(subject, cleanHtml, `${window.location.origin}${LETTER_LOGO.path}`));
    win.document.close();
    // L'impression attend le logo : lancée trop tôt, elle sortirait sans lui.
    let launched = false;
    const launch = () => {
      if (launched || win.closed) return;
      launched = true;
      win.focus();
      win.print();
    };
    const logo = win.document.querySelector(".lt-letterhead img");
    if (!logo || logo.complete) {
      setTimeout(launch, 150);
    } else {
      logo.addEventListener("load", () => setTimeout(launch, 50));
      logo.addEventListener("error", launch);
      setTimeout(launch, 4000);
    }
  };

  const copy = async () => {
    const text = letterToText(cleanHtml);
    try {
      if (window.ClipboardItem && navigator.clipboard?.write) {
        await navigator.clipboard.write([
          new window.ClipboardItem({ "text/html": new Blob([cleanHtml], { type: "text/html" }), "text/plain": new Blob([text], { type: "text/plain" }) }),
        ]);
      } else {
        await navigator.clipboard.writeText(text);
      }
      toastInfo("Courrier copié (mise en forme conservée).", 1800);
    } catch {
      toastInfo("La copie n'est pas disponible dans ce navigateur.", 2500);
    }
  };

  const openMail = () => {
    setError(null);
    setMail({ to: workspace?.recipient?.email || "", confirm: false, error: null, launch: null });
  };

  const bodyText = useMemo(() => letterToText(cleanHtml), [cleanHtml]);
  const recipients = useMemo(() => parseRecipients(mail?.to).valid, [mail?.to]);
  const toError = mail ? recipientsError(mail.to) : null;
  // Calculé seulement quand la fenêtre d'envoi est ouverte (donc dans le navigateur).
  const mailto = useMemo(
    () => buildMailto({ to: recipients, subject, body: bodyText, maxLength: mail ? mailtoLimit(window.navigator.userAgent) : undefined }),
    [recipients, subject, bodyText, !!mail], // eslint-disable-line react-hooks/exhaustive-deps
  );

  /** Copie le texte complet : un lien de messagerie ne peut en porter que le début. */
  const copyBodySilently = async () => {
    try {
      await navigator.clipboard.writeText(bodyText);
      return true;
    } catch {
      return false;
    }
  };

  /** Refuse l'ouverture d'une messagerie tant que le destinataire n'est pas exploitable. */
  const guardRecipients = (event) => {
    if (!toError) return true;
    event.preventDefault();
    setMail((m) => ({ ...m, error: toError, launch: null }));
    return false;
  };

  /**
   * « Ouvrir dans ma messagerie » : le lien `mailto:` confie le courrier à
   * l'application de messagerie du poste. Si aucune n'est configurée, le
   * navigateur ne fait rien et ne prévient pas : on le déduit de ce que la
   * fenêtre garde la main, et on propose alors les autres voies.
   */
  const openInMailClient = (event) => {
    if (!guardRecipients(event)) return;
    const truncated = mailto.truncated;
    setMail((m) => ({ ...m, error: null, launch: { state: "pending", truncated, copied: false } }));
    if (truncated) copyBodySilently().then((copied) => setMail((m) => (m?.launch ? { ...m, launch: { ...m.launch, copied } } : m)));
    let left = false;
    const onLeave = () => {
      left = true;
    };
    const onVisibility = () => {
      if (document.hidden) left = true;
    };
    window.addEventListener("blur", onLeave);
    document.addEventListener("visibilitychange", onVisibility);
    setTimeout(() => {
      window.removeEventListener("blur", onLeave);
      document.removeEventListener("visibilitychange", onVisibility);
      setMail((m) => (m?.launch ? { ...m, launch: { ...m.launch, state: left ? "opened" : "silent" } } : m));
    }, 2500);
  };

  const openInWebmail = (event, provider) => {
    if (!guardRecipients(event)) return;
    const truncated = buildWebmailUrl(provider.key, { to: recipients, subject, body: bodyText }).truncated;
    setMail((m) => ({ ...m, error: null, launch: { state: "webmail", label: provider.label, truncated, copied: false } }));
    if (truncated) copyBodySilently().then((copied) => setMail((m) => (m?.launch ? { ...m, launch: { ...m.launch, copied } } : m)));
  };

  /** Fichier de message complet (mise en forme et logo), à ouvrir dans la messagerie. */
  const downloadEml = async () => {
    if (toError) {
      setMail((m) => ({ ...m, error: toError, launch: null }));
      return;
    }
    const logo = await fetchLogoBase64();
    const eml = buildEml({
      to: recipients,
      subject,
      text: bodyText,
      html: letterEmailHtml(cleanHtml, logo ? `cid:${LETTER_LOGO.cid}` : null),
      images: logo ? [{ cid: LETTER_LOGO.cid, mime: "image/png", base64: logo }] : [],
    });
    const url = URL.createObjectURL(new Blob([eml], { type: "message/rfc822" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = emlFileName(subject);
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    setMail((m) => ({ ...m, error: null, launch: { state: "file" } }));
  };

  const send = async () => {
    if (sendLock.current) return;
    sendLock.current = true;
    setBusy("send");
    setError(null);
    setMail((m) => ({ ...m, error: null, launch: null }));
    const res = await sendOfferLetter(offerId, { id: letterIdRef.current, ...contentRef.current, to: mail.to });
    sendLock.current = false;
    setBusy(null);
    if (!res.ok) {
      // L'envoi a échoué : le courrier n'est pas « envoyé ». Le serveur l'a gardé
      // en brouillon ; l'éditeur continue sur ce même brouillon.
      const kept = res.details?.letter;
      if (kept?.id) {
        adoptLetter(kept.id, "DRAFT");
        setDirty(false);
        refreshWorkspace();
      }
      setMail((m) => (m ? { ...m, confirm: false, error: res.error } : m));
      return;
    }
    setMail(null);
    applyLetter(res.data.letter);
    if (res.data.rejected?.length) {
      setNotice(`Le serveur de messagerie a refusé ${res.data.rejected.join(", ")} : le courrier est parti aux autres destinataires seulement.`);
    } else if (res.data.unverified?.length && !res.data.dryRun) {
      setNotice(
        `Le courrier est parti, mais l'existence du domaine « ${res.data.unverified.join(" », « ")} » n'a pas pu être vérifiée (réseau lent). Si l'adresse est erronée, un avis de non-remise arrivera dans la boîte d'expédition de la plateforme.`,
      );
    }
    toastSuccess(res.data.dryRun ? "Envoi simulé (messagerie en mode test) : le courrier est enregistré comme envoyé." : `Courrier envoyé à ${res.data.letter.sentTo}.`);
    refreshWorkspace();
  };

  const header = (
    <div className="lt-head">
      <div>
        <div className="lt-head-title">
          <i className="bi bi-envelope-paper" aria-hidden="true"></i> {KIND_TITLE[workspace?.kind] || "Courrier au soumissionnaire"}
        </div>
        <div className="lt-head-sub">
          {workspace ? `${workspace.offer.title} (${workspace.offer.code})${workspace.offer.operator ? `    ${workspace.offer.operator}` : ""}` : "Chargement…"}
        </div>
      </div>
      <span className={`lt-status lt-status--${status.toLowerCase()}`}>
        {status === "SENT" ? `Envoyé le ${formatDateTime(sentInfo?.at)}` : status === "DRAFT" ? (dirty ? "Brouillon    modifications non enregistrées" : "Brouillon enregistré") : "Non enregistré"}
      </span>
    </div>
  );

  const toolbar = (
    <span className="ql-formats-wrap">
      <span className="ql-formats">
        <select className="ql-header" defaultValue="" aria-label="Style de paragraphe">
          <option value="1">Titre 1</option>
          <option value="2">Titre 2</option>
          <option value="3">Intertitre</option>
          <option value="">Paragraphe</option>
        </select>
      </span>
      <span className="ql-formats">
        <button className="ql-bold" aria-label="Gras"></button>
        <button className="ql-italic" aria-label="Italique"></button>
        <button className="ql-underline" aria-label="Souligné"></button>
      </span>
      <span className="ql-formats">
        <button className="ql-list" value="ordered" aria-label="Liste numérotée"></button>
        <button className="ql-list" value="bullet" aria-label="Liste à puces"></button>
        <button className="ql-indent" value="-1" aria-label="Diminuer le retrait"></button>
        <button className="ql-indent" value="+1" aria-label="Augmenter le retrait"></button>
      </span>
      <span className="ql-formats">
        <select className="ql-align" aria-label="Alignement"></select>
      </span>
      <span className="ql-formats">
        <button className="ql-link" aria-label="Lien"></button>
        <button className="ql-clean" aria-label="Effacer la mise en forme"></button>
      </span>
    </span>
  );

  return (
    <Dialog visible={!!visible} onHide={close} header={header} className="lt-dialog" style={{ width: "min(1080px, 98vw)" }} maximizable modal closeOnEscape={false}>
      {loadError ? (
        <div className="lt-alert lt-alert--error" role="alert">
          <i className="bi bi-exclamation-triangle" aria-hidden="true"></i> {loadError}
        </div>
      ) : busy === "load" || (busy === "generate" && !html) ? (
        <div className="lt-loading" role="status">
          <span className="spinner-border" aria-hidden="true"></span>
          <b>{busy === "load" ? "Ouverture du courrier…" : "Génération du modèle de courrier…"}</b>
          <span>Synthèse de l'analyse IA, des commentaires des validateurs et des informations de l'offre.</span>
        </div>
      ) : (
        <>
          {notice && (
            <div className="lt-alert lt-alert--info">
              <i className="bi bi-stars" aria-hidden="true"></i> {notice}
              <button type="button" className="lt-alert-close" onClick={() => setNotice(null)} aria-label="Fermer">
                <i className="bi bi-x-lg"></i>
              </button>
            </div>
          )}
          {readOnly && (
            <div className="lt-alert lt-alert--ok">
              <i className="bi bi-send-check" aria-hidden="true"></i> Courrier envoyé à {sentInfo?.to} : il est conservé tel quel.
              <button type="button" className="lt-btn lt-btn--sm" onClick={duplicate}>
                <i className="bi bi-files" aria-hidden="true"></i> Dupliquer pour le modifier
              </button>
            </div>
          )}
          {error && (
            <div className="lt-alert lt-alert--error" role="alert">
              <i className="bi bi-exclamation-octagon" aria-hidden="true"></i> {error}
            </div>
          )}

          <div className="lt-bar">
            <label className="lt-subject">
              <span>Objet</span>
              <input
                type="text"
                value={subject}
                maxLength={200}
                disabled={readOnly}
                onChange={(e) => {
                  setSubject(e.target.value);
                  setDirty(true);
                }}
              />
            </label>
            <div className="lt-tabs" role="tablist">
              <button type="button" role="tab" aria-selected={tab === "edit"} className={tab === "edit" ? "is-active" : ""} onClick={() => setTab("edit")}>
                <i className="bi bi-pencil" aria-hidden="true"></i> Rédaction
              </button>
              <button type="button" role="tab" aria-selected={tab === "preview"} className={tab === "preview" ? "is-active" : ""} onClick={() => setTab("preview")}>
                <i className="bi bi-eye" aria-hidden="true"></i> Aperçu
              </button>
            </div>
          </div>

          <div className="lt-tools">
            <Menu model={fieldItems} popup ref={fieldsMenu} className="lt-menu" />
            <button type="button" className="lt-btn" onClick={(e) => fieldsMenu.current?.toggle(e)} disabled={readOnly || tab !== "edit"} title="Insérer une donnée de l'offre à l'emplacement du curseur">
              <i className="bi bi-braces" aria-hidden="true"></i> Insérer une donnée <i className="bi bi-chevron-down" aria-hidden="true"></i>
            </button>
            <button
              type="button"
              className="lt-btn"
              disabled={!!busy || readOnly}
              onClick={() => {
                if (dirty && !window.confirm("Régénérer le modèle ? Le texte en cours sera remplacé.")) return;
                generate(true);
              }}
              title="Recomposer le modèle à partir de l'offre, de la décision, des commentaires et de l'analyse IA"
            >
              {busy === "generate" ? <span className="spinner-border spinner-border-sm" aria-hidden="true"></span> : <i className="bi bi-stars" aria-hidden="true"></i>} Régénérer le modèle
            </button>
            {draftItems.length > 0 && (
              <>
                <Menu model={draftItems} popup ref={draftsMenu} className="lt-menu" />
                <button type="button" className="lt-btn" onClick={(e) => draftsMenu.current?.toggle(e)}>
                  <i className="bi bi-clock-history" aria-hidden="true"></i> Courriers enregistrés ({draftItems.length})
                </button>
              </>
            )}
            {letterId && !readOnly && (
              <button type="button" className="lt-btn lt-btn--ghost" onClick={removeDraft} disabled={!!busy} title="Supprimer ce brouillon" aria-label="Supprimer ce brouillon">
                <i className="bi bi-trash" aria-hidden="true"></i>
              </button>
            )}
            <span className="lt-recipient">
              <i className="bi bi-person" aria-hidden="true"></i> Destinataire : {workspace?.recipient?.name || "soumissionnaire"}
              {workspace?.recipient?.email ? ` · ${workspace.recipient.email}` : ""}
            </span>
          </div>

          <div className={`lt-work${tab === "preview" ? " is-preview" : ""}`}>
            <div className="lt-editor" hidden={tab !== "edit"}>
              <Editor
                key={editorKey}
                ref={editorRef}
                value={loadedHtml.current}
                readOnly={readOnly}
                headerTemplate={toolbar}
                onTextChange={(e) => {
                  setHtml(e.htmlValue || "");
                  if (e.source === "user") setDirty(true);
                }}
                style={{ height: "min(52vh, 560px)" }}
              />
            </div>
            {tab === "preview" && (
              <div className="lt-preview">
                <div className="lt-sheet">
                  <div className="lt-letterhead">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={LETTER_LOGO.path} alt={LETTER_LOGO.alt} width={Math.round(76 * LETTER_LOGO.ratio)} height={76} />
                  </div>
                  <div className="lt-sheet-body" dangerouslySetInnerHTML={{ __html: cleanHtml }} />
                </div>
              </div>
            )}
          </div>

          <div className="lt-foot">
            <span className="lt-muted">Le courrier reste modifiable jusqu'à son envoi. Enregistrez-le pour le retrouver plus tard.</span>
            <div className="lt-foot-actions">
              <button type="button" className="lt-btn" onClick={copy} disabled={!html}>
                <i className="bi bi-copy" aria-hidden="true"></i> Copier
              </button>
              <button type="button" className="lt-btn" onClick={print} disabled={!html}>
                <i className="bi bi-printer" aria-hidden="true"></i> Imprimer
              </button>
              <button type="button" className="lt-btn" onClick={openMail} disabled={!html || readOnly || !!busy}>
                <i className="bi bi-envelope" aria-hidden="true"></i> Préparer l'e-mail
              </button>
              <button type="button" className="lt-btn lt-btn--accent" onClick={() => save()} disabled={!!busy || readOnly || !html || (!dirty && status === "DRAFT")} aria-busy={busy === "save"}>
                {busy === "save" ? <span className="spinner-border spinner-border-sm" aria-hidden="true"></span> : <i className="bi bi-save" aria-hidden="true"></i>}{" "}
                {busy === "save" ? "Enregistrement…" : !dirty && status === "DRAFT" ? "Enregistré" : "Enregistrer"}
              </button>
            </div>
          </div>
        </>
      )}

      {/* ------------------------------------------------------- Envoi par e-mail */}
      <Dialog visible={!!mail} onHide={() => busy !== "send" && setMail(null)} header="Envoyer le courrier par e-mail" className="lt-dialog lt-dialog--mail" style={{ width: "min(560px, 96vw)" }} modal>
        {mail && (
          <>
            <label className="lt-field">
              <span>Destinataire(s)</span>
              <input
                type="text"
                inputMode="email"
                autoComplete="off"
                value={mail.to}
                onChange={(e) => setMail((m) => ({ ...m, to: e.target.value, confirm: false, error: null, launch: null }))}
                placeholder="adresse@operateur.ci"
                disabled={busy === "send"}
                aria-invalid={!!mail.to && !!toError}
              />
              <small>
                {mail.to && toError
                  ? toError
                  : workspace?.recipient?.email
                    ? `Adresse du soumissionnaire${workspace.recipient.name ? ` (${workspace.recipient.name})` : ""}. Vous pouvez la modifier ; séparez plusieurs adresses par une virgule.`
                    : "Aucune adresse n'est enregistrée pour le soumissionnaire : saisissez-la. Séparez plusieurs adresses par une virgule."}
              </small>
            </label>
            <div className="lt-field">
              <span>Objet</span>
              <div className="lt-readonly">{subject || "(sans objet)"}</div>
            </div>
            {mail.error && (
              <div className="lt-alert lt-alert--error" role="alert">
                <i className="bi bi-exclamation-octagon" aria-hidden="true"></i> {mail.error}
              </div>
            )}

            {mail.confirm ? (
              <>
                <div className="lt-alert lt-alert--warning">
                  <i className="bi bi-send" aria-hidden="true"></i> Le courrier sera envoyé à <b>{recipients.join(", ")}</b> depuis la messagerie de la plateforme, puis conservé sans modification possible.
                </div>
                <div className="lt-foot-actions lt-foot-actions--end">
                  <button type="button" className="lt-btn" onClick={() => setMail((m) => ({ ...m, confirm: false }))} disabled={busy === "send"}>
                    Retour
                  </button>
                  <button type="button" className="lt-btn lt-btn--accent" onClick={send} disabled={busy === "send"} aria-busy={busy === "send"}>
                    {busy === "send" ? <span className="spinner-border spinner-border-sm" aria-hidden="true"></span> : <i className="bi bi-check2" aria-hidden="true"></i>}{" "}
                    {busy === "send" ? "Envoi en cours…" : "Confirmer l'envoi"}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="lt-way">
                  <div className="lt-way-text">
                    <b>Depuis la plateforme</b>
                    <span>Le courrier part mis en forme, avec le logo de l'ARTCI. L'envoi est tracé dans l'historique de l'offre.</span>
                  </div>
                  <button type="button" className="lt-btn lt-btn--accent" onClick={() => setMail((m) => ({ ...m, confirm: true, error: null, launch: null }))} disabled={!!toError || !subject.trim() || !!busy}>
                    <i className="bi bi-send" aria-hidden="true"></i> Envoyer
                  </button>
                </div>

                <div className="lt-way lt-way--stack">
                  <div className="lt-way-text">
                    <b>Depuis ma messagerie</b>
                    <span>Destinataire, objet et texte sont préremplis. Le courrier reste en brouillon ici : la plateforme ne sait pas s'il a été envoyé.</span>
                  </div>
                  <div className="lt-way-actions">
                    <a className={`lt-btn${toError ? " is-off" : ""}`} href={mailto.href} onClick={openInMailClient} aria-disabled={!!toError}>
                      <i className="bi bi-box-arrow-up-right" aria-hidden="true"></i> Ouvrir dans ma messagerie
                    </a>
                    {WEBMAILS.map((provider) => (
                      <a
                        key={provider.key}
                        className={`lt-btn${toError ? " is-off" : ""}`}
                        href={buildWebmailUrl(provider.key, { to: recipients, subject, body: bodyText }).href}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => openInWebmail(e, provider)}
                        aria-disabled={!!toError}
                      >
                        <i className={`bi ${provider.icon}`} aria-hidden="true"></i> {provider.label}
                      </a>
                    ))}
                    <button type="button" className={`lt-btn${toError ? " is-off" : ""}`} onClick={downloadEml} title="Fichier de message complet, avec la mise en forme et le logo">
                      <i className="bi bi-download" aria-hidden="true"></i> Fichier .eml
                    </button>
                  </div>
                </div>

                {mail.launch?.state === "pending" && (
                  <div className="lt-alert lt-alert--info" role="status">
                    <span className="spinner-border spinner-border-sm" aria-hidden="true"></span> Ouverture de votre messagerie…
                  </div>
                )}
                {mail.launch?.state === "opened" && (
                  <div className="lt-alert lt-alert--ok" role="status">
                    <i className="bi bi-check2-circle" aria-hidden="true"></i> Le courrier a été transmis à votre messagerie.
                    {mail.launch.truncated &&
                      (mail.launch.copied
                        ? " Seul le début tient dans le message : le texte complet est copié, collez-le à la place (Ctrl + V)."
                        : " Seul le début tient dans le message : utilisez « Copier » pour reprendre le texte complet.")}
                  </div>
                )}
                {mail.launch?.state === "silent" && (
                  <div className="lt-alert lt-alert--warning" role="status">
                    <i className="bi bi-question-circle" aria-hidden="true"></i>
                    <span>
                      Votre messagerie ne s'est pas ouverte ? Ce poste n'a sans doute pas d'application de messagerie configurée. Utilisez <b>Gmail</b> ou <b>Outlook en ligne</b>,
                      téléchargez le <b>fichier .eml</b>, ou envoyez le courrier depuis la plateforme.
                      {mail.launch.truncated && mail.launch.copied ? " Le texte complet est copié dans le presse-papiers." : ""}
                    </span>
                  </div>
                )}
                {mail.launch?.state === "webmail" && (
                  <div className="lt-alert lt-alert--ok" role="status">
                    <i className="bi bi-check2-circle" aria-hidden="true"></i> {mail.launch.label} s'ouvre dans un nouvel onglet.
                    {mail.launch.truncated && mail.launch.copied ? " Le texte complet est copié : collez-le à la place du début prérempli (Ctrl + V)." : ""}
                  </div>
                )}
                {mail.launch?.state === "file" && (
                  <div className="lt-alert lt-alert--ok" role="status">
                    <i className="bi bi-check2-circle" aria-hidden="true"></i> Fichier téléchargé : ouvrez-le pour retrouver le courrier dans votre messagerie (en brouillon dans Outlook et Thunderbird).
                  </div>
                )}

                <div className="lt-foot-actions lt-foot-actions--end">
                  <button type="button" className="lt-btn" onClick={() => setMail(null)}>
                    Fermer
                  </button>
                </div>
              </>
            )}
          </>
        )}
      </Dialog>
    </Dialog>
  );
}
