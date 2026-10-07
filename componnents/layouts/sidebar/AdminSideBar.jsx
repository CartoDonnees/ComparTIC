"use client";

import Link from "next/link";
import { useRouter } from "next/router";
import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useAdmin } from "@/services/providers/AdminProvider";
import { ROLES, ROLE_LABELS, roleOf } from "@/services/rbac/roles";
import { can, PERMISSIONS } from "@/services/rbac/permissions";

/**
 * Barre latérale de l'espace admin / opérateur.
 *
 * Refonte. La version précédente posait quatre problèmes :
 *
 *  1. Chaque entrée était écrite DEUX fois (une version « active », une version
 *     « inactive ») dans un `if/else` JSX, d'où ~730 lignes pour une douzaine
 *     de liens et des divergences entre les deux copies.
 *  2. L'état actif dépendait d'une prop `active` que chaque page passait à la
 *     main, avec des valeurs incohérentes : le tableau de bord se testait sur
 *     `active == "dash"` alors que le clic enregistrait `"dshb"`, si bien que
 *     l'entrée ne s'allumait jamais. Plusieurs pages ne passaient rien du tout.
 *     L'état actif est désormais déduit de la route courante.
 *  3. Les groupes repliables ne s'ouvraient pas sur la section en cours : après
 *     un rechargement sur « Gérer les offres », le groupe COLLECTE était fermé.
 *  4. `d-none d-xl-block` masquait purement et simplement le menu sous 1200 px,
 *     sans aucune solution de repli : la navigation était inaccessible sur
 *     tablette et sur téléphone. Un tiroir coulissant prend le relais.
 *
 * La prop `active` reste acceptée pour compatibilité, mais n'est plus requise.
 *
 * Grand écran : la barre peut être RÉDUITE (icônes seules) ou ÉTENDUE. Le
 * choix est mémorisé dans le navigateur. Réduite, le survol (ou le clic) d'une
 * entrée affiche son libellé, et pour un groupe ses sous-entrées, dans un
 * menu flottant. La largeur passe par la variable CSS --adsb-w, que l'en-tête
 * et le contenu suivent.
 */

const COLLAPSE_KEY = "adsb-collapsed";
const useIsoLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

/**
 * Définition du menu par RÔLE (voir services/rbac). Le menu n'est qu'un confort
 * de navigation : chaque page et chaque route d'API recontrôlent les droits.
 * `match` liste les routes qui allument l'entrée (préfixes).
 */
const buildMenu = (role) => {
  if (!role) return [];
  if (role === ROLES.FOCAL_POINT) {
    return [
      {
        id: "dash",
        label: "Tableau de bord",
        icon: "bi-speedometer2",
        href: "/operator-dashboard",
      },
      {
        id: "activity",
        label: "Suivi de mes offres",
        icon: "bi-clock-history",
        href: "/operator-activity",
      },
      {
        id: "collecte",
        label: "Collecte",
        icon: "bi-collection",
        children: [
          {
            id: "c-off",
            label: "Déclarer une offre",
            icon: "bi-plus-circle",
            href: "/operator-create-offer",
          },
          {
            id: "d-off",
            label: "Gérer mes offres",
            icon: "bi-kanban",
            href: "/operator-list-offer",
          },
        ],
      },
      {
        id: "profile",
        label: "Mon profil",
        icon: "bi-person-gear",
        href: "/operator-profile",
      },
      {
        id: "comparator",
        label: "Comparateur",
        icon: "bi-radar",
        href: "/comparator",
        external: true,
      },
    ];
  }

  const administration = can(role, PERMISSIONS.USER_MANAGE);
  const collecte = [
    can(role, PERMISSIONS.OFFER_CREATE) && {
      id: "c-off",
      label: "Déclarer une offre",
      icon: "bi-plus-circle",
      href: "/admin-create-offer",
    },
    {
      id: "d-off",
      label: "Gérer les offres",
      icon: "bi-kanban",
      href: "/admin-offer-list",
    },
  ].filter(Boolean);

  // Super administrateur, administrateur, superviseur et validateurs
  return [
    {
      id: "dash",
      label: "Tableau de bord",
      icon: "bi-speedometer2",
      href: "/admin-dashboard",
    },
    {
      id: "collecte",
      label: "Collecte",
      icon: "bi-collection",
      children: collecte,
    },
    {
      id: "valid",
      label: can(role, PERMISSIONS.OFFER_DECIDE) ? "Validation" : "Suivi des validations",
      icon: "bi-patch-check",
      href: "/admin-validation",
    },
    // {
    //   id: "stats",
    //   label: "Statistiques",
    //   icon: "bi-bar-chart-line",
    //   href: "/admin-statistics",
    // },
    ...(administration
      ? [
          {
            id: "acteurs",
            label: "Acteurs",
            icon: "bi-people",
            children: [
              {
                id: "actor-1",
                label: "Utilisateurs",
                icon: "bi-person-lines-fill",
                href: "/admin-user",
              },
              {
                id: "actor-2",
                label: "Opérateurs",
                icon: "bi-sd-card",
                href: "/admin-operator",
              },
            ],
          },
          {
            id: "params",
            label: "Paramètres",
            icon: "bi-sliders",
            children: [
              { id: "area", label: "Zones", icon: "bi-map", href: "/admin-areas" },
              {
                id: "org",
                label: "Organisations",
                icon: "bi-diagram-3",
                href: "/admin-organizations",
              },
              { id: "ctr", label: "Pays", icon: "bi-globe2", href: "/admin-countries" },
            ],
          },
        ]
      : []),
    {
      id: "lexia",
      label: "ComparIA",
      icon: "bi-robot",
      href: "/admin-assistant",
    },
    // Assistant réglementaire fondé sur la base documentaire (agents de l'ARTCI).
    // ...(can(role, PERMISSIONS.KNOWLEDGE_READ)
    //   ? [
    //       {
    //         id: "artci-ai",
    //         label: "Assistant IA ARTCI",
    //         icon: "bi-bank2",
    //         href: "/admin-artci-assistant",
    //       },
    //     ]
    //   : []),
    // Gestion des notifications : administration seulement.
    ...(can(role, PERMISSIONS.NOTIFICATION_MANAGE)
      ? [
          {
            id: "notifs",
            label: "Notifications",
            icon: "bi-bell",
            href: "/admin-notifications",
          },
        ]
      : []),
    // Journal d'activité de la plateforme : administration seulement.
    ...(can(role, PERMISSIONS.AUDIT_READ)
      ? [
          {
            id: "activity",
            label: "Journal d'activité",
            icon: "bi-activity",
            href: "/admin-activity",
          },
        ]
      : []),
    {
      id: "account",
      label: "Mon compte",
      icon: "bi-person-gear",
      href: "/account",
    },
    {
      id: "comparator",
      label: "Comparateur",
      icon: "bi-radar",
      href: "/comparator",
      external: true,
    },
  ];
};

export default function AdminSideBar({ active }) {
  const router = useRouter();
  const { user, logout, showSideBar, handleShowSideBar } = useAdmin();

  const role = roleOf(user);
  const menu = useMemo(() => buildMenu(role), [role]);

  const path = router?.pathname || "";

  /** Une entrée est active si la route courante correspond à son lien. */
  const isActive = (item) => {
    if (item.external) return false;
    if (item.href && path === item.href) return true;
    // Compatibilité : certaines pages passent encore la prop `active`.
    return Boolean(active) && active === item.id;
  };
  const groupHasActive = (group) =>
    (group.children || []).some((c) => isActive(c));

  /**
   * Groupes dépliés. L état initial est calculé DÈS LE RENDU (et non dans un
   * effet) : sinon le groupe de la page courante n apparaissait qu après
   * hydratation, le menu s ouvrant sous les yeux de l utilisateur.
   */
  const openFor = (items) => {
    const next = {};
    items.forEach((item) => {
      if (item.children && item.children.some((c) => isActive(c))) {
        next[item.id] = true;
      }
    });
    return next;
  };
  const [open, setOpen] = useState(() => openFor(menu));

  // Navigation vers une autre section : on déplie le groupe concerné, sans
  // refermer ceux que l utilisateur a ouverts lui-même.
  useEffect(() => {
    setOpen((prev) => ({ ...openFor(menu), ...prev }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, menu]);

  const toggle = (id) => setOpen((o) => ({ ...o, [id]: !o[id] }));

  /* ---- Barre réduite / étendue (grand écran) ---------------------------- */
  const [collapsed, setCollapsed] = useState(false);
  // Menu flottant de la barre réduite : { item, top }
  const [flyout, setFlyout] = useState(null);
  const flyoutTimer = useRef(null);

  // Lecture du choix mémorisé avant l'affichage (pas de saut de mise en page).
  useIsoLayoutEffect(() => {
    let saved = false;
    try {
      saved = localStorage.getItem(COLLAPSE_KEY) === "1";
    } catch {
      saved = false;
    }
    setCollapsed(saved);
  }, []);

  useIsoLayoutEffect(() => {
    document.documentElement.classList.toggle("adsb-collapsed", collapsed);
    return () => document.documentElement.classList.remove("adsb-collapsed");
  }, [collapsed]);

  const toggleCollapsed = useCallback(() => {
    setFlyout(null);
    setCollapsed((c) => {
      const next = !c;
      try {
        localStorage.setItem(COLLAPSE_KEY, next ? "1" : "0");
      } catch {
        /* stockage indisponible : le choix vaut pour la session */
      }
      return next;
    });
  }, []);

  // Raccourci clavier : Ctrl / Cmd + B.
  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey && e.key.toLowerCase() === "b") {
        const tag = e.target?.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA" || e.target?.isContentEditable) return;
        e.preventDefault();
        toggleCollapsed();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [toggleCollapsed]);

  // La barre réduite ne concerne que le grand écran (le tiroir mobile reste complet).
  const isDesktop = () => typeof window !== "undefined" && window.matchMedia("(min-width: 1200px)").matches;
  const compact = collapsed && !Boolean(showSideBar?.mobile);

  const showFlyout = (item, target) => {
    if (!compact || !isDesktop()) return;
    clearTimeout(flyoutTimer.current);
    const rect = target.getBoundingClientRect();
    setFlyout({ item, top: rect.top });
  };
  const hideFlyout = () => {
    clearTimeout(flyoutTimer.current);
    flyoutTimer.current = setTimeout(() => setFlyout(null), 160);
  };
  const keepFlyout = () => clearTimeout(flyoutTimer.current);

  useEffect(() => {
    setFlyout(null);
  }, [path, collapsed]);

  useEffect(() => {
    if (!flyout) return undefined;
    const onKey = (e) => e.key === "Escape" && setFlyout(null);
    const onScroll = () => setFlyout(null);
    document.addEventListener("keydown", onKey);
    window.addEventListener("resize", onScroll);
    return () => {
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onScroll);
    };
  }, [flyout]);

  useEffect(() => () => clearTimeout(flyoutTimer.current), []);

  // Tiroir mobile, piloté par l'état partagé du provider (bouton dans l'en-tête).
  const mobileOpen = Boolean(showSideBar?.mobile);
  const closeMobile = () => handleShowSideBar?.("mobile", false);

  // Fermeture du tiroir à chaque navigation, et sur la touche Échap.
  useEffect(() => {
    if (mobileOpen) closeMobile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path]);

  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e) => e.key === "Escape" && closeMobile();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mobileOpen]);

  const renderLeaf = (item, isChild) => {
    const activeNow = isActive(item);
    const content = (
      <>
        <i className={`bi ${item.icon} adsb-ico`}></i>
        <span className="adsb-text">{item.label}</span>
        {item.external && <i className="bi bi-box-arrow-up-right adsb-ext"></i>}
      </>
    );

    const hoverProps =
      !isChild && compact
        ? {
            onMouseEnter: (e) => showFlyout(item, e.currentTarget),
            onMouseLeave: hideFlyout,
            onFocus: (e) => showFlyout(item, e.currentTarget),
            onBlur: hideFlyout,
            "aria-label": item.label,
          }
        : {};

    return (
      <li key={item.id}>
        <Link
          href={item.href}
          className={`adsb-link ${isChild ? "child" : ""} ${
            activeNow ? "active" : ""
          }`}
          aria-current={activeNow ? "page" : undefined}
          {...hoverProps}
          {...(item.external
            ? { target: "_blank", rel: "noopener noreferrer" }
            : {})}
        >
          {content}
        </Link>
      </li>
    );
  };

  const renderGroup = (group) => {
    const expanded = Boolean(open[group.id]);
    const containsActive = groupHasActive(group);
    return (
      <li key={group.id} className="adsb-group">
        <button
          type="button"
          className={`adsb-link adsb-group-btn ${
            containsActive ? "has-active" : ""
          }`}
          onClick={(e) => {
            if (compact && isDesktop()) {
              if (flyout?.item?.id === group.id) setFlyout(null);
              else showFlyout(group, e.currentTarget);
              return;
            }
            toggle(group.id);
          }}
          onMouseEnter={(e) => showFlyout(group, e.currentTarget)}
          onMouseLeave={hideFlyout}
          aria-expanded={compact ? flyout?.item?.id === group.id : expanded}
          aria-label={compact ? group.label : undefined}
        >
          <i className={`bi ${group.icon} adsb-ico`}></i>
          <span className="adsb-text">{group.label}</span>
          <i
            className={`bi bi-chevron-down adsb-caret ${
              expanded ? "up" : ""
            }`}
          ></i>
        </button>
        {expanded && !compact && (
          <ul className="adsb-sub">
            {group.children.map((c) => renderLeaf(c, true))}
          </ul>
        )}
      </li>
    );
  };

  return (
    <>
      {/* Voile du tiroir mobile */}
      {mobileOpen && (
        <div className="adsb-backdrop" onClick={closeMobile} aria-hidden="true" />
      )}

      <nav
        className={`adsb ${mobileOpen ? "adsb-open" : ""} ${compact ? "adsb--compact" : ""}`}
        aria-label="Navigation principale"
      >
        {/* Réduire / étendre (grand écran) */}
        <button
          type="button"
          className="adsb-collapse"
          onClick={toggleCollapsed}
          aria-label={collapsed ? "Étendre le menu" : "Réduire le menu"}
          aria-expanded={!collapsed}
          title={`${collapsed ? "Étendre" : "Réduire"} le menu (Ctrl + B)`}
        >
          <i className={`bi ${collapsed ? "bi-chevron-right" : "bi-chevron-left"}`} aria-hidden="true"></i>
        </button>
        <div className="adsb-brand" style={{ backgroundColor: "white" }}>
          <Link href="/" className="adsb-brand-link">
            <img src="./images/logo/logo.png" alt="" />
            <span>
              <strong className="text-dark">Compare<em style={{ color: "#d65308" }}>TIC</em></strong>
              {/* <small>CompareTIC</small> */}
            </span>
          </Link>
          {/* Fermeture du tiroir : sans ce bouton, seul le voile permettait de
              refermer le menu sur mobile. */}
          <button
            type="button"
            className="adsb-close"
            onClick={closeMobile}
            aria-label="Fermer le menu"
          >
            <i className="bi bi-x-lg"></i>
          </button>
        </div>

        <div className="adsb-scroll" onScroll={() => flyout && setFlyout(null)}>
          <p className="adsb-section">Modules</p>
          <ul className="adsb-list">
            {menu.map((item) =>
              item.children ? renderGroup(item) : renderLeaf(item, false),
            )}
          </ul>
        </div>

        <div className="adsb-foot">
          <div className="adsb-who">
            <span className="adsb-who-name">
              {user?.firstName} {user?.lastName}
            </span>
            <span className="adsb-who-role">
              {role === ROLES.FOCAL_POINT
                ? user?.focalPoint?.operator?.name || "Opérateur"
                : ROLE_LABELS[role] || user?.profile?.name || ""}
            </span>
          </div>
          <button
            type="button"
            className="adsb-logout"
            onClick={() => logout()}
            title={compact ? "Se déconnecter" : undefined}
            aria-label="Se déconnecter"
          >
            <i className="bi bi-box-arrow-right adsb-ico"></i>
            <span className="adsb-text">Se déconnecter</span>
          </button>
        </div>
      </nav>

      {/* Menu flottant de la barre réduite */}
      {compact && flyout && (
        <div
          className="adsb-flyout"
          style={{ top: Math.max(8, Math.min(flyout.top, (typeof window !== "undefined" ? window.innerHeight : 800) - 60)) }}
          onMouseEnter={keepFlyout}
          onMouseLeave={hideFlyout}
          role={flyout.item.children ? "menu" : "tooltip"}
        >
          {flyout.item.children ? (
            <>
              <div className="adsb-flyout-title">{flyout.item.label}</div>
              <ul className="adsb-flyout-list">
                {flyout.item.children.map((c) => {
                  const activeNow = isActive(c);
                  return (
                    <li key={c.id}>
                      <Link
                        href={c.href}
                        role="menuitem"
                        className={`adsb-flyout-link ${activeNow ? "active" : ""}`}
                        aria-current={activeNow ? "page" : undefined}
                        onClick={() => setFlyout(null)}
                        onBlur={hideFlyout}
                        onFocus={keepFlyout}
                      >
                        <i className={`bi ${c.icon}`} aria-hidden="true"></i>
                        <span>{c.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </>
          ) : (
            <div className="adsb-flyout-label">{flyout.item.label}</div>
          )}
        </div>
      )}
    </>
  );
}
