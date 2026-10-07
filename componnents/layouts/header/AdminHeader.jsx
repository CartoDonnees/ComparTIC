"use client";

import { notificationStyleOf } from "@/services/tools/notificationTypes";
import { useAdmin } from "@/services/providers/AdminProvider";
import Link from "next/link";
import { useRouter } from "next/router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/services/api/notifications/notificationsApiService";
import { BASE_IMG_URL, imageUrl } from "@/services/tools/constants";

/**
 * En-tête de l'espace admin / opérateur.
 *
 * Refonte : l'ancienne version affichait une cloche décorative (« 2 messages
 * non lus » codés en dur) dont le panneau, hérité d'un gabarit HTML, ne
 * contenait qu'un squelette `simplebar` vide   aucune notification n'a jamais
 * pu y apparaître. Le menu utilisateur n'était par ailleurs rendu que pour le
 * profil ADMINISTRATEUR : un opérateur n'avait ni accès à son compte, ni
 * bouton de déconnexion dans l'en-tête.
 *
 * Les deux menus sont désormais pilotés en React (et non par le JavaScript de
 * Bootstrap, absent de certaines pages), avec fermeture au clic extérieur et
 * à la touche Échap.
 */

/** Pictogramme et couleur par catégorie de notification : référentiel partagé
 *  avec la page de gestion des notifications (services/tools/notificationTypes). */
const styleOf = notificationStyleOf;

/** « il y a 5 min », « il y a 3 j »… */
const timeAgo = (date) => {
  const diff = Math.max(0, Date.now() - new Date(date).getTime());
  const min = Math.floor(diff / 60000);
  if (min < 1) return "à l'instant";
  if (min < 60) return `il y a ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `il y a ${h} h`;
  const d = Math.floor(h / 24);
  if (d < 30) return `il y a ${d} j`;
  return new Date(date).toLocaleDateString("fr-FR");
};

const initials = (u) =>
  `${(u?.firstName || "").charAt(0)}${(u?.lastName || "").charAt(0)}`
    .toUpperCase()
    .trim() || "?";

export default function AdminHeader() {
  const { user, logout, showSideBar, handleShowSideBar } = useAdmin();
  const router = useRouter();

  const [openMenu, setOpenMenu] = useState(null); // "notif" | "user" | null
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);
  const rootRef = useRef(null);

  const isOperator = user?.profile?.code === "PRF2-TEST";
  const profileHref = isOperator ? "/operator-profile" : "/account";

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const res = await getNotifications(20);
    if (res?.error === false) {
      setItems(res.items || []);
      setUnread(res.unread || 0);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    load();
    // Rafraîchissement périodique : une décision de validation peut tomber
    // pendant que l'utilisateur travaille sur une autre page.
    const timer = setInterval(load, 60000);
    return () => clearInterval(timer);
  }, [load]);

  // Fermeture au clic extérieur et à la touche Échap.
  useEffect(() => {
    if (!openMenu) return;
    const onClick = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) {
        setOpenMenu(null);
      }
    };
    const onKey = (e) => e.key === "Escape" && setOpenMenu(null);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [openMenu]);

  const openNotifications = () => {
    setOpenMenu(openMenu === "notif" ? null : "notif");
    if (openMenu !== "notif") load();
  };

  const onNotificationClick = async (n) => {
    if (!n.read) {
      // Mise à jour optimiste : le panneau réagit sans attendre le serveur.
      setItems((list) =>
        list.map((i) => (i.id === n.id ? { ...i, read: true } : i)),
      );
      setUnread((u) => Math.max(0, u - 1));
      await markNotificationRead(n.id);
    }
    if (n.link) {
      setOpenMenu(null);
      router.push(n.link);
    }
  };

  const onReadAll = async () => {
    setItems((list) => list.map((i) => ({ ...i, read: true })));
    setUnread(0);
    await markAllNotificationsRead();
  };

  const avatar = user?.imagePath ? imageUrl(user.imagePath) : null;

  return (
    <nav className="adh" ref={rootRef}>
      {/* Ouverture de la barre latérale en tiroir : sous 1200 px, la barre
          est masquée et n était accessible par aucun autre moyen. */}
      <button
        type="button"
        className="adh-burger"
        onClick={() => handleShowSideBar?.("mobile", !showSideBar?.mobile)}
        aria-label="Ouvrir le menu"
      >
        <i className="bi bi-list"></i>
      </button>

      {/* ---- Identité de l'espace ---- */}
      <div className="adh-brand">
        <span className="adh-brand-mark" aria-hidden="true">
          <i className="bi bi-broadcast-pin"></i>
        </span>
        <span className="adh-brand-text">
          <span className="adh-brand-title">CompareTIC</span>
          <span className="adh-brand-sub">
            {isOperator
              ? `Espace opérateur${
                  user?.focalPoint?.operator?.name
                    ? `   ${user.focalPoint.operator.name}`
                    : ""
                }`
              : "Espace d'administration"}
          </span>
        </span>
      </div>

      {/* ---- Actions ---- */}
      <div className="adh-actions">
        {/* Cloche de notifications */}
        <div className="adh-menu-wrap">
          <button
            type="button"
            className={`adh-icon-btn ${openMenu === "notif" ? "active" : ""}`}
            onClick={openNotifications}
            aria-haspopup="true"
            aria-expanded={openMenu === "notif"}
            aria-label={
              unread > 0
                ? `Notifications, ${unread} non lues`
                : "Notifications"
            }
          >
            <i className="bi bi-bell"></i>
            {unread > 0 && (
              <span className="adh-badge">{unread > 99 ? "99+" : unread}</span>
            )}
          </button>

          {openMenu === "notif" && (
            <div className="adh-panel" role="menu">
              <div className="adh-panel-head">
                <div>
                  <h6>Notifications</h6>
                  <p>
                    {unread > 0
                      ? `${unread} non lue${unread > 1 ? "s" : ""}`
                      : "Tout est à jour"}
                  </p>
                </div>
                {unread > 0 && (
                  <button
                    type="button"
                    className="adh-link"
                    onClick={onReadAll}
                  >
                    Tout marquer comme lu
                  </button>
                )}
              </div>

              <div className="adh-panel-body">
                {loading && items.length === 0 && (
                  <div className="adh-empty">Chargement…</div>
                )}
                {!loading && items.length === 0 && (
                  <div className="adh-empty">
                    <i className="bi bi-inbox d-block mb-2"></i>
                    Aucune notification pour le moment.
                  </div>
                )}
                {items.map((n) => {
                  const s = styleOf(n.type);
                  return (
                    <button
                      key={n.id}
                      type="button"
                      className={`adh-notif ${n.read ? "" : "unread"}`}
                      onClick={() => onNotificationClick(n)}
                    >
                      <span className={`adh-notif-icon tone-${s.tone}`}>
                        <i className={`bi ${s.icon}`}></i>
                      </span>
                      <span className="adh-notif-text">
                        <span className="adh-notif-title">
                          {n.title || n.from || "Notification"}
                        </span>
                        <span className="adh-notif-body">{n.content}</span>
                        <span className="adh-notif-time">
                          {timeAgo(n.createdAt)}
                        </span>
                      </span>
                      {!n.read && <span className="adh-dot" aria-hidden="true" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Menu utilisateur   rendu pour TOUS les profils du back-office */}
        <div className="adh-menu-wrap">
          <button
            type="button"
            className={`adh-user-btn ${openMenu === "user" ? "active" : ""}`}
            onClick={() => setOpenMenu(openMenu === "user" ? null : "user")}
            aria-haspopup="true"
            aria-expanded={openMenu === "user"}
          >
            <span className="adh-avatar">
              {avatar ? <img src={avatar} alt="" /> : initials(user)}
            </span>
            <span className="adh-user-name">
              {user?.firstName} {user?.lastName}
            </span>
            <i className="bi bi-chevron-down adh-caret"></i>
          </button>

          {openMenu === "user" && (
            <div className="adh-panel adh-panel-sm" role="menu">
              <div className="adh-user-head">
                <span className="adh-avatar adh-avatar-lg">
                  {avatar ? <img src={avatar} alt="" /> : initials(user)}
                </span>
                <div>
                  <strong>
                    {user?.firstName} {user?.lastName}
                  </strong>
                  <small>{user?.email}</small>
                  <small className="adh-role">
                    {user?.profile?.name || " "}
                  </small>
                </div>
              </div>
              <div className="adh-panel-body">
                <Link
                  className="adh-item"
                  href={profileHref}
                  onClick={() => setOpenMenu(null)}
                >
                  <i className="bi bi-person-gear"></i> Mon profil
                </Link>
                {isOperator && (
                  <Link
                    className="adh-item"
                    href="/operator-list-offer"
                    onClick={() => setOpenMenu(null)}
                  >
                    <i className="bi bi-list-check"></i> Mes offres
                  </Link>
                )}
              </div>
              <div className="adh-panel-foot">
                <button
                  type="button"
                  className="adh-item danger"
                  onClick={() => logout()}
                >
                  <i className="bi bi-box-arrow-right"></i> Se déconnecter
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
