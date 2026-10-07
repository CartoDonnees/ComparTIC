"use client";
import { getClientUnreadNotification } from "@/services/api/client/notificationApiService";
import { useClient } from "@/services/providers/ClientProvider";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
// import './navigation.css'

export const ClientNavigation = ({ activeHeader }) => {
  const { user, logout } = useClient();

  const [notifications, setNotifications] = useState(null);

  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    // const _notifs = await getClientUnreadNotification();
    // setNotifications(_notifs);
  };

  return (
    <>
      {/* <header id="primaryNavigation" className="comparTIC-header">
        <div className="container">
          <nav className="comparTIC-navbar">
            <Link href="/" className="comparTIC-brand">
              <div className="brand-mark text-white">
                <span>Compar</span>
                <strong><em>TIC</em></strong>
              </div>
              <span className="brand-subtitle">
              </span>
            </Link>

            <div className="comparTIC-nav-wrapper">
              <ul className="comparTIC-nav">
                <li>
                  <Link
                    href="/"
                    className={`comparTIC-nav-link ${
                      activeHeader === "home" ? "active" : ""
                    }`}
                  >
                    <i className="bi bi-house-door-fill"></i>
                    <span>Accueil</span>
                  </Link>
                </li>

                <li>
                  <Link
                    href="/comparator"
                    className={`comparTIC-nav-link comparator-link ${
                      activeHeader === "comparator" ? "active" : ""
                    }`}
                  >
                    <i className="bi bi-sliders2"></i>
                    <span>Comparateur</span>
                  </Link>
                </li>

                <li>
                  <Link
                    href="/observatoire"
                    className={`comparTIC-nav-link ${
                      activeHeader === "observatoire" ? "active" : ""
                    }`}
                  >
                    <i className="bi bi-graph-up-arrow"></i>
                    <span>Indices tarifaires</span>
                  </Link>
                </li>

                <li>
                  <Link
                    href="/faq"
                    className={`comparTIC-nav-link ${
                      activeHeader === "faq" ? "active" : ""
                    }`}
                  >
                    <i className="bi bi-patch-question"></i>
                    <span>FAQ</span>
                  </Link>
                </li>

                <li>
                  <Link
                    href="/about"
                    className={`comparTIC-nav-link ${
                      activeHeader === "about" ? "active" : ""
                    }`}
                  >
                    <i className="bi bi-info-circle"></i>
                    <span>À propos</span>
                  </Link>
                </li>

                <li>
                  <Link
                    href="/contact"
                    className={`comparTIC-nav-link ${
                      activeHeader === "contact" ? "active" : ""
                    }`}
                  >
                    <i className="bi bi-headset"></i>
                    <span>Contact</span>
                  </Link>
                </li>
              </ul>
            </div>

            {/* Zone utilisateur 
            <div className="comparTIC-actions">
              {user ? (
                <>
                  {/* Notifications 
                  <div className="dropdown">
                    <button
                      className="comparTIC-icon-btn"
                      type="button"
                      data-bs-toggle="dropdown"
                      aria-expanded="false"
                    >
                      <i className="bi bi-bell"></i>

                      {notifications?.length > 0 && (
                        <span className="notification-badge">
                          {notifications.length > 99
                            ? "99+"
                            : notifications.length}
                        </span>
                      )}
                    </button>

                    <div className="dropdown-menu dropdown-menu-end comparTIC-dropdown notifications-dropdown">
                      <div className="dropdown-header-custom">
                        <div>
                          <h6>Notifications</h6>
                          <small>
                            {notifications?.length || 0} message(s) non lu(s)
                          </small>
                        </div>

                        <i className="bi bi-bell"></i>
                      </div>

                      <div className="notification-content">
                        {notifications?.length > 0 ? (
                          <ul className="list-unstyled mb-0">
                            {notifications.map((notification, index) => (
                              <li key={notification.id || index}>
                                <a href="#" className="notification-item">
                                  <div className="notification-icon">
                                    <i className="bi bi-info-circle"></i>
                                  </div>

                                  <div>
                                    <strong>
                                      {notification.title ||
                                        "Nouvelle notification"}
                                    </strong>

                                    <p>
                                      {notification.message ||
                                        "Vous avez reçu une nouvelle notification."}
                                    </p>

                                    <small>
                                      <i className="bi bi-clock me-1"></i>
                                      {notification.createdAt || "À l'instant"}
                                    </small>
                                  </div>
                                </a>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <div className="empty-notifications">
                            <i className="bi bi-bell-slash"></i>
                            <p>Aucune nouvelle notification</p>
                          </div>
                        )}
                      </div>

                      <div className="dropdown-footer">
                        <Link href="/notifications">
                          Voir toutes les notifications
                          <i className="bi bi-arrow-right ms-2"></i>
                        </Link>
                      </div>
                    </div>
                  </div>

                  {/* Profil 
                  <div className="dropdown">
                    <button
                      className="comparTIC-user"
                      type="button"
                      data-bs-toggle="dropdown"
                      aria-expanded="false"
                    >
                      <div className="user-avatar">
                        <i className="bi bi-person-fill"></i>
                      </div>

                      <div className="user-info">
                        <strong>
                          {user?.lastName} {user?.firstName}
                        </strong>
                        <small>{user?.profile?.name || "Utilisateur"}</small>
                      </div>

                      <i className="bi bi-chevron-down user-chevron"></i>
                    </button>

                    <div className="dropdown-menu dropdown-menu-end comparTIC-dropdown user-dropdown">
                      <div className="user-dropdown-header">
                        <div className="user-avatar large">
                          <i className="bi bi-person-fill"></i>
                        </div>

                        <div>
                          <strong>
                            {user?.lastName} {user?.firstName}
                          </strong>
                          <small>{user?.email}</small>
                        </div>
                      </div>

                      <div className="dropdown-divider"></div>

                      <Link className="dropdown-item-custom" href="/account">
                        <i className="bi bi-person"></i>
                        <span>Mon compte</span>
                        <i className="bi bi-chevron-right ms-auto"></i>
                      </Link>

                      {[
                        "PRF0-TEST",
                        "PRF1-TEST",
                        "PRF-SUPERADMIN",
                        "PRF-VAL1",
                        "PRF-VAL2",
                        "PRF-VAL3",
                        "PRF-VAL4",
                      ].includes(user?.profile?.code) && (
                        <Link
                          className="dropdown-item-custom"
                          href="/admin-dashboard"
                        >
                          <i className="bi bi-grid-1x2"></i>
                          <span>Tableau de bord</span>
                          <i className="bi bi-chevron-right ms-auto"></i>
                        </Link>
                      )}

                      {user?.profile?.code === "PRF2-TEST" && (
                        <Link
                          className="dropdown-item-custom"
                          href="/operator-dashboard"
                        >
                          <i className="bi bi-speedometer2"></i>
                          <span>Tableau de bord</span>
                          <i className="bi bi-chevron-right ms-auto"></i>
                        </Link>
                      )}

                      <div className="dropdown-divider"></div>

                      <button
                        className="dropdown-item-custom logout-item"
                        onClick={() => logout()}
                      >
                        <i className="bi bi-box-arrow-right"></i>
                        <span>Se déconnecter</span>
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <Link href="/subscribe" className="comparTIC-subscribe">
                    <i className="bi bi-person-plus me-2"></i>
                    S'abonner
                  </Link>

                  {/* <Link href="/login" className="comparTIC-login">
                    Se connecter
                  </Link> */}

              {/* Mobile 
              <button
                className="comparTIC-mobile-toggle"
                type="button"
                data-bs-toggle="collapse"
                data-bs-target="#comparTICMobileMenu"
              >
                <i className="bi bi-list"></i>
              </button>
            </div>
          </nav>

          {/* Navigation mobile 
          <div
            id="comparTICMobileMenu"
            className="collapse comparTIC-mobile-menu"
          >
            <div className="mobile-menu-inner">
              <Link href="/" className="mobile-nav-link">
                <i className="bi bi-house-door"></i>
                Accueil
              </Link>
              <Link href="/comparator" className="mobile-nav-link">
                          <i className="bi bi-radar me-1"></i>
                Comparateur
              </Link>

              <Link href="/observatoire" className="mobile-nav-link">
                <i className="bi bi-graph-up-arrow"></i>
                Indices tarifaires
              </Link>

              <Link href="/faq" className="mobile-nav-link">
                <i className="bi bi-patch-question"></i>
                FAQ
              </Link>

              <Link href="/about" className="mobile-nav-link">
                <i className="bi bi-info-circle"></i>À propos
              </Link>

              <Link href="/contact" className="mobile-nav-link">
                <i className="bi bi-headset"></i>
                Contact
              </Link>
            </div>
          </div>
        </div>
      </header> */}

      
       <div id="primaryNavigation" className="bg-header">
        <div className="container">
          <nav
            role="navigation"
            className=" header_custom   d-flex justify-content-between"
          >
            <Link href="/" style={{ cursor: "pointer" }}>
              <h2 className="me-2 text-white">
                <em></em>Compar
                <span className="text-primary">
                  <em>TIC</em>
                </span>{" "}
              </h2>
            </Link>
            <div className="navigation-left m-0 p-0">
              <ul className="p-0 m-0">
                <li className="">
                  <div className="title title_custom text-white">
                    {activeHeader == "home" ? (
                      <>
                        <Link href="/" className="active">
                          <span className="text ml-2">
                            <i className="bi bi-house-fill me-1"></i>Accueil
                          </span>
                        </Link>
                      </>
                    ) : (
                      <>
                        <Link href="/" className="">
                          <span className="text ml-2">
                            <i className="bi bi-house me-1"></i>Accueil
                          </span>
                        </Link>
                      </>
                    )}
                  </div>
                </li>
                <li className="p-0 m-0">
                  <div className="title ">
                    {activeHeader == "comparator" ? (
                      <>
                        <Link
                          href="/comparator"
                          className="active text-center"
                          target="_self"
                        >
                          <i className="bi bi-radar me-1"></i>
                          <span className="text me-1 text-center">
                            Comparateur
                          </span>
                        </Link>
                      </>
                    ) : (
                      <>
                        <Link
                          href="/comparator"
                          className="text-center"
                          target="_self"
                        >
                          <i className="bi bi-radar me-1"></i>
                          <span className="text me-1 text-center">
                            Comparateur
                          </span>
                        </Link>
                      </>
                    )}
                    <span className="icon"></span>
                  </div>
                </li>
                <li className="">
                  <div className="title text-white">
                    <Link
                      href="/observatoire"
                      className={activeHeader == "observatoire" ? "active" : ""}
                      target="_self"
                    >
                      <i className="bi bi-graph-up-arrow me-1"></i>
                      <span className="text me-1 text-center">Indices tarifaires</span>
                    </Link>
                    <span className="icon"></span>
                  </div>
                </li>
                <li className="">
                  <div className="title text-white">
                    {activeHeader == "faq" ? (
                      <>
                        <Link
                          href="/faq"
                          className="active"
                        >
                          <i className="bi bi-patch-question-fill me-1"></i>
                          <span className="text ml-2">Faq</span>
                        </Link>
                      </>
                    ) : (
                      <>
                        <Link href="/faq">
                          <i className="bi bi-patch-question me-1"></i>
                          <span className="text ml-2">Faq</span>
                        </Link>
                      </>
                    )}
                  </div>
                </li>
                <li className="">
                  <div className="title text-white">
                    {activeHeader == "about" ? (
                      <>
                        <Link
                          href="/about"
                          className="active"
                        >
                          <i className="bi bi-award-fill me-1"></i>
                          <span className="text ml-2">A propos</span>
                        </Link>
                      </>
                    ) : (
                      <>
                        <Link
                          href="/about"
                          className=""
                        >
                          <i className="bi bi-award me-1"></i>
                          <span className="text ml-2">A propos</span>
                        </Link>
                      </>
                    )}
                  </div>
                </li>
                <li className="">
                  <div className="title text-white">
                    {activeHeader == "contact" ? (
                      <>
                        <Link
                          href="/contact"
                          className="active"
                        >
                          <i className="bi bi-person-lines-fill me-2"></i>
                          <span className="text ml-2">Contact</span>
                        </Link>
                      </>
                    ) : (
                      <>
                        <Link
                          href="/contact"
                          className=""
                        >
                          <i className="bi bi-person-lines-fill me-2"></i>
                          <span className="text ml-2">Contact</span>
                        </Link>
                      </>
                    )}
                  </div>
                </li>
              </ul>
            </div>
            {user ? (
              <>
                <ul className="list-unstyled d-flex align-items-center mb-0 ms-5 ms-lg-0">
                  <li className="dropdown-center">
                    <a
                      className="position-relative btn-icon btn-ghost-secondary btn rounded-circle"
                      href="#"
                      role="button"
                      data-bs-toggle="dropdown"
                      aria-expanded="false"
                    >
                      <i className="bi bi-bell fs-5" />
                      {notifications?.length > 0 && <>
                      <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger mt-4 ms-n2 p-1">
                        {notifications?.length}
                        <span className="visually-hidden">Message(s) non lu(s)</span>
                      </span>
                      </>}
                    </a>
                    <div className="dropdown-menu dropdown-menu-end dropdown-menu-lg p-0 border-0">
                      <div className="border-bottom p-5 d-flex justify-content-between align-items-center">
                        <div>
                          <h5 className="mb-1">Notifications</h5>
                          <p className="mb-0 small">
                            Vous avez {notifications?.length > 0 ? notifications?.length : 0} message(s) non lu(s)
                          </p>
                        </div>
                        <a href="#!" className="text-muted"></a>
                      </div>
                      <div data-simplebar="init" >
                        <div
                          className="simplebar-wrapper"
                          style={{ margin: 0 }}
                        >
                          <div className="simplebar-height-auto-observer-wrapper">
                            <div className="simplebar-height-auto-observer" />
                          </div>
                          <div className="simplebar-mask">
                            <div
                              className="simplebar-offset"
                              style={{ right: 0, bottom: 0 }}
                            >
                              <div
                                className="simplebar-content-wrapper"
                                tabIndex={0}
                                role="region"
                                aria-label="scrollable content"
                                style={{ height: "auto", overflow: "hidden" }}
                              >
                                <div
                                  className="simplebar-content"
                                  style={{ padding: 0 }}
                                >
                                  <ul className="list-group list-group-flush notification-list-scroll fs-6">
                                    <li className="list-group-item px-5 py-4 list-group-item-action active">
                                      <a href="#!" className="text-muted">
                                        <div className="d-flex">
                                          <img
                                            src="../assets/images/avatar/avatar-1.jpg"
                                            alt=""
                                            className="avatar avatar-md rounded-circle"
                                          />
                                          <div className="ms-4">
                                            <p className="mb-1">
                                              <span className="text-dark">
                                                Your order is placed
                                              </span>
                                              waiting for shipping
                                            </p>
                                            <span>
                                              <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                width={12}
                                                height={12}
                                                fill="currentColor"
                                                className="bi bi-clock text-muted"
                                                viewBox="0 0 16 16"
                                              >
                                                <path d="M8 3.5a.5.5 0 0 0-1 0V9a.5.5 0 0 0 .252.434l3.5 2a.5.5 0 0 0 .496-.868L8 8.71V3.5z" />
                                                <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm7-8A7 7 0 1 1 1 8a7 7 0 0 1 14 0z" />
                                              </svg>
                                              <small className="ms-2">
                                                1 minute ago
                                              </small>
                                            </span>
                                          </div>
                                        </div>
                                      </a>
                                    </li>
                                  </ul>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div
                            className="simplebar-placeholder"
                            style={{ width: 0, height: 0 }}
                          />
                        </div>
                        <div
                          className="simplebar-track simplebar-horizontal"
                          style={{ visibility: "hidden" }}
                        >
                          <div
                            className="simplebar-scrollbar"
                            style={{ width: 0, display: "none" }}
                          />
                        </div>
                        <div
                          className="simplebar-track simplebar-vertical"
                          style={{ visibility: "hidden" }}
                        >
                          <div
                            className="simplebar-scrollbar"
                            style={{ height: 0, display: "none" }}
                          />
                        </div>
                      </div>
                      <div className="border-top px-5 py-4 text-center">
                        <a href="#!">Voir tout</a>
                      </div>
                    </div>
                  </li>
                  <li className="dropdown ms-4">
                    <a
                      href="#"
                      role="button"
                      data-bs-toggle="dropdown"
                      aria-expanded="true"
                      className="show"
                    >
                      <i
                        className="bi bi-person-circle"
                        style={{ fontSize: 30 }}
                      ></i>
                    </a>
                    <div
                      className="dropdown-menu dropdown-menu-end p-0"
                      data-bs-popper="static"
                    >
                      <div className="lh-1 px-5 py-4 border-bottom">
                        <h5 className="mb-1 h6">
                          {user?.lastName + " " + user?.firstName}{" "}
                        </h5>
                        <small>{user?.email}</small>
                      </div>
                      <ul className="list-unstyled px-2 py-3">
                        <li>
                          <Link className="dropdown-item" href="/account">
                            <i className="fa fa-user me-2"></i> Compte
                          </Link>
                        </li>
                        {['PRF0-TEST', 'PRF1-TEST', 'PRF-SUPERADMIN', 'PRF-VAL1', 'PRF-VAL2', 'PRF-VAL3', 'PRF-VAL4'].includes(user?.profile?.code) && <>
                        <li>
                          <Link className="dropdown-item" href="/admin-dashboard">
                            <i className="fa fa-table me-2"></i> Tableau de bord
                          </Link>
                        </li>
                        </>}
                        {user?.profile?.code == 'PRF2-TEST' && <>
                        <li>
                          <Link className="dropdown-item" href="/operator-dashboard">
                            <i className="fa fa-table me-2"></i> Tableau de bord
                          </Link>
                        </li>
                        </>}
                      </ul>
                      <div className="border-top px-5 py-3" onClick={() => logout()}>
                        <a href="#">Se déconnecter</a>
                      </div>
                    </div>
                  </li>
                </ul>
              </>
            ) : (
              <>
                <div className="btn-call1" target="_blank">
                  <Link href="/subscribe" className=" btn-register">
                    S'abonner
                  </Link>
                </div>
              </>
            )}

            <span className="close"></span>
          </nav>
        </div>
        <div className="overlay"></div>
      </div>
    </>
  );
};
