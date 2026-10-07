import React, { useEffect, useState } from "react";
import { BASE_FILE_URL } from "@/services/tools/constants";

/**
 * Affichage du document joint à une offre, avec un message clair et
 * compréhensible dans tous les cas :
 *
 *  - AUCUN document rattaché à l'offre      -> message d'information
 *  - Document rattaché mais fichier absent  -> message d'avertissement
 *  - Document disponible                    -> aperçu + bouton de téléchargement
 *
 * L'existence du fichier est vérifiée par une requête HEAD sur l'API
 * `/api/files/downloads/documents` avant d'afficher l'aperçu : cela évite
 * d'afficher une erreur technique brute (JSON 404) dans l'iframe.
 */
export default function OfferDocumentViewer({
  document,
  height = 900,
  title = "Document de l'offre",
}) {
  // "empty" | "checking" | "missing" | "ready" | "error"
  const [state, setState] = useState("checking");

  const path = document?.path;
  const url = path ? BASE_FILE_URL + encodeURIComponent(path) : null;

  useEffect(() => {
    let cancelled = false;

    if (!path) {
      setState("empty");
      return;
    }

    setState("checking");
    fetch(url, { method: "HEAD" })
      .then((res) => {
        if (cancelled) return;
        setState(res.ok ? "ready" : "missing");
      })
      .catch(() => {
        if (!cancelled) setState("error");
      });

    return () => {
      cancelled = true;
    };
  }, [path, url]);

  // ---- Aucun document rattaché ------------------------------------------
  if (state === "empty") {
    return (
      <div className="doc-notice doc-notice--info" role="status">
        <i className="bi bi-file-earmark-x doc-notice__icon" aria-hidden="true"></i>
        <div className="doc-notice__body">
          <div className="doc-notice__title">Aucun document joint</div>
          <p className="doc-notice__text">
            Aucun document n’a été associé à cette offre lors de son
            enregistrement.
          </p>
        </div>
      </div>
    );
  }

  // ---- Vérification en cours --------------------------------------------
  if (state === "checking") {
    return (
      <div className="doc-notice doc-notice--muted" role="status" aria-live="polite">
        <i className="bi bi-hourglass-split doc-notice__icon" aria-hidden="true"></i>
        <div className="doc-notice__body">
          <div className="doc-notice__title">Chargement du document…</div>
          <p className="doc-notice__text">Veuillez patienter un instant.</p>
        </div>
      </div>
    );
  }

  // ---- Fichier introuvable / illisible ----------------------------------
  if (state === "missing" || state === "error") {
    const isMissing = state === "missing";
    return (
      <div className="doc-notice doc-notice--warning" role="alert">
        <i
          className="bi bi-exclamation-triangle-fill doc-notice__icon"
          aria-hidden="true"
        ></i>
        <div className="doc-notice__body">
          <div className="doc-notice__title">
            {isMissing
              ? "Document introuvable"
              : "Document momentanément indisponible"}
          </div>
          <p className="doc-notice__text">
            {isMissing ? (
              <>
                Le fichier associé à cette offre n’a pas pu être retrouvé sur le
                serveur. Il a peut-être été supprimé ou déplacé. Vous pouvez
                demander à l’opérateur de le téléverser à nouveau.
              </>
            ) : (
              <>
                Le document n’a pas pu être chargé. Vérifiez votre connexion puis
                réessayez.
              </>
            )}
          </p>
          {path && (
            <p className="doc-notice__meta">
              Fichier attendu : <code>{path}</code>
            </p>
          )}
        </div>
      </div>
    );
  }

  // ---- Document disponible ----------------------------------------------
  return (
    <div className="doc-viewer">
      <div className="doc-viewer__bar">
        <span className="doc-viewer__name">
          <i className="bi bi-file-earmark-text me-2" aria-hidden="true"></i>
          {title}
        </span>
        <a
          className="doc-viewer__dl"
          href={url + "&download=1"}
          target="_blank"
          rel="noopener noreferrer"
        >
          <i className="bi bi-download me-1" aria-hidden="true"></i>
          Télécharger
        </a>
      </div>
      <iframe
        src={url}
        title={title}
        frameBorder="0"
        height={height}
        style={{ width: "100%" }}
      ></iframe>
    </div>
  );
}
