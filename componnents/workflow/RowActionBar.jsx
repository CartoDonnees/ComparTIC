import React, { useRef } from "react";
import Link from "next/link";
import { Menu } from "primereact/menu";
import Router from "next/router";

/**
 * Barre d'actions d'une ligne de tableau.
 *
 * Remplace la rangée de 6 à 8 boutons (souvent réduits à des icônes sans
 * libellé) par une disposition lisible et stable :
 *   [ aperçu ] [ circuit ]  [ action principale, avec libellé ]  [ ⋯ autres actions ]
 *
 * - l'aperçu reste accessible en un clic ;
 * - l'action principale est celle qu'on attend de l'utilisateur sur cette
 *   ligne (valider, soumettre, examiner…) ;
 * - les autres actions sont regroupées dans un menu, les actions sensibles
 *   (refuser, désactiver, supprimer) séparées et signalées en rouge.
 *
 * @param view     { onClick, title }   bouton d'aperçu (facultatif)
 * @param circuit  { href, title, label?, icon? }   accès direct à la fiche de l'offre : circuit de
 *                 validation pour l'ARTCI, suivi de l'offre pour l'opérateur (facultatif)
 * @param primary  { key, label, icon, onClick?, href?, tone?, title?, disabled? } (facultatif)
 * @param items    [{ key, label, icon, onClick?, href?, danger?, disabled? }]
 * @param ariaLabel nom de la ligne, pour les lecteurs d'écran
 */
export default function RowActionBar({ view, circuit, primary, items = [], ariaLabel = "" }) {
  const menuRef = useRef(null);

  const safe = items.filter(Boolean);
  const regular = safe.filter((i) => !i.danger);
  const danger = safe.filter((i) => i.danger);

  const toModel = (i) => ({
    key: i.key,
    label: i.label,
    icon: `bi ${i.icon}`,
    disabled: i.disabled,
    className: i.danger ? "wf-menu-danger" : undefined,
    command: () => (i.href ? Router.push(i.href) : i.onClick?.()),
  });
  const model = [
    ...regular.map(toModel),
    ...(regular.length && danger.length ? [{ separator: true }] : []),
    ...danger.map(toModel),
  ];

  const primaryClass = `wf-btn wf-row-primary ${
    primary?.tone === "danger" ? "wf-btn-danger" : primary?.tone === "neutral" ? "" : "wf-btn-primary"
  }`;

  return (
    <div className="wf-row-actions" role="group" aria-label={ariaLabel ? `Actions : ${ariaLabel}` : "Actions"}>
      {view && (
        <button
          type="button"
          className="wf-btn wf-icon-btn"
          onClick={view.onClick}
          title={view.title || "Aperçu"}
          aria-label={view.title || "Aperçu"}
        >
          <i className="bi bi-eye" aria-hidden="true"></i>
        </button>
      )}

      {circuit && (
        <Link
          href={circuit.href}
          className="wf-btn wf-circuit-btn"
          title={circuit.title || "Consulter le circuit de validation"}
        >
          <i className={`bi ${circuit.icon || "bi-diagram-3"}`} aria-hidden="true"></i>
          <span>{circuit.label || "Circuit"}</span>
        </Link>
      )}

      {primary &&
        (primary.href ? (
          <Link href={primary.href} className={primaryClass} title={primary.title || primary.label}>
            <i className={`bi ${primary.icon}`} aria-hidden="true"></i>
            <span>{primary.label}</span>
          </Link>
        ) : (
          <button
            type="button"
            className={primaryClass}
            onClick={primary.onClick}
            disabled={primary.disabled}
            title={primary.title || primary.label}
          >
            <i className={`bi ${primary.icon}`} aria-hidden="true"></i>
            <span>{primary.label}</span>
          </button>
        ))}

      {model.length > 0 && (
        <>
          <button
            type="button"
            className="wf-btn wf-icon-btn"
            onClick={(e) => menuRef.current?.toggle(e)}
            title="Plus d'actions"
            aria-label="Plus d'actions"
            aria-haspopup="menu"
          >
            <i className="bi bi-three-dots-vertical" aria-hidden="true"></i>
          </button>
          <Menu
            model={model}
            popup
            ref={menuRef}
            popupAlignment="right"
            className="wf-menu"
            appendTo={typeof document !== "undefined" ? () => document.body : undefined}
          />
        </>
      )}
    </div>
  );
}
