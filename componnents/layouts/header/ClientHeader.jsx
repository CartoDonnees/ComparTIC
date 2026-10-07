// import './header.css'
import Link from "next/link";
import { ClientNavigation } from "../navigation/ClientNavigation";
import { useState } from "react";
import HeaderModal from "@/componnents/modal/header/HeaderModal";

export const ClientHeader = ({ activeHeader }) => {
  const [showHeadModal, setShowHeadModal] = useState(false);

  return (
    <>
      <header className="comparTIC-top-header">
        {/* =========================
      VERSION DESKTOP
      ========================= */}
        <div className="top-header-desktop">
          <div className="container">
            <div className="top-header-content">
              {/* Logo ARTCI */}
              <Link href="/" className="top-header-brand">
                <img
                  src="/images/logo/logo.png"
                  className="top-header-logo"
                  alt="ARTCI"
                />
              </Link>

              {/* Informations */}
              <div className="top-header-infos">
                <a href="mailto:info@artci.ci" className="top-header-info">
                  <span className="top-header-info-icon">
                    <i className="bi bi-envelope"></i>
                  </span>

                  <span className="top-header-info-content">
                    <small>Email</small>
                    <small><strong>info@artci.ci</strong></small>
                    
                  </span>
                </a>

                <a href="tel:+2252720344373" className="top-header-info">
                  <span className="top-header-info-icon">
                    <i className="bi bi-telephone"></i>
                  </span>

                  <span className="top-header-info-content">
                    <small>Téléphone</small>
                    <small><strong>+225 27 20 34 43 73</strong></small>
                  </span>
                </a>

                <div className="top-header-info">
                  <span className="top-header-info-icon">
                    <i className="bi bi-geo-alt"></i>
                  </span>

                  <span className="top-header-info-content">
                    <small>Localisation</small>
                    <small><strong>Abidjan, Marcory Anoumabo</strong></small>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* =========================
      VERSION MOBILE
      ========================= */}
        <div className="top-header-mobile">
          <div className="container">
            <div className="top-header-mobile-content">
              {/* Logo */}
              <Link href="/" className="top-header-brand-mobile">
                <img src="/images/logo/logo.png" alt="ARTCI" />

                <div className="top-header-mobile-title">
                  <strong className="">
                    Compar<span><em>TIC</em></span>
                  </strong>
                  <small>Comparer les offres de communication électroniques</small>
                </div>
              </Link>

              {/* Menu */}
              <button
                type="button"
                className="top-header-menu-btn"
                onClick={() => setShowHeadModal(true)}
                aria-label="Ouvrir le menu"
              >
                <i className="bi bi-list"></i>
              </button>
            </div>
          </div>
        </div>
      </header>
      <ClientNavigation activeHeader={activeHeader} />
      <HeaderModal
        activeHeader={activeHeader}
        visible={showHeadModal}
        setVisible={setShowHeadModal}
      />
    </>
  );
};
