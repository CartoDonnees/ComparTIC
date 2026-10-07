"use client";
import React, { useState } from "react";
import ClientMainContainerPage from "../ClientMainContainerPage";
import { ClientSlide } from "@/componnents/layouts/slide/ClientSlide";
import ClientPartnerPage from "@/componnents/partner/ClientPartnerPage";
import ClientCountBanner from "@/componnents/banner/ClientCountBanner";
import NewsList from "@/componnents/news/NewsList";
import ClientCallToActionNewsLetter from "@/componnents/news/ClientCallToActionNewsLetter";
import Link from "next/link";
import HowUseComparatorPage from "@/componnents/modal/video/HowUseComparatorModal";

export default function ClientHomePage() {
  const [showVideo, setShowVideo] = useState(false);

  const handleShowVideo = () => {
    setShowVideo(true);
  };

  return (
    <ClientMainContainerPage
      activeHeader={"home"}
      children={
        <>
          <ClientSlide />
          <ClientCountBanner />

          <section
            className="bg-light trans-fb"
            style={{ paddingTop: 30, paddingBottom: 30 }}
          >
            <div className="container py-4">
              <div className="row g-4 g-md-5">
                <div className="col-lg-8">
                  <h1>
                    Pourquoi Compar
                    <span className="text-primary">
                      <em>TIC</em>
                    </span>{" "}
                    ?
                  </h1>
                  <p className="mb-0">
                    Compartic est une plateforme de comparaison d’offres mobiles
                    et fixes des réseaux de communications électroniques. Elle aide les utilisateurs
                    à trouver les offres adaptées à leurs besoins et à leur
                    budget. La plateforme permet de comparer facilement les
                    tarifs, la validité et les volumes des services de communication : Voix, SMS
                    et Internet. Elle met également en avant les promotions et
                    les avantages associés à chaque offre.
                    <br />
                    <b>
                      <em>
                        Visionnez cette vidéo pour découvrir comment ça marche
                        en détail :
                      </em>
                    </b>
                  </p>
                </div>
                <div className="col-lg-4">
                  <div className="card card-body bg-light p-5 text-center">
                    <h5 className="fw-normal">Commencer à</h5>
                    <Link
                      href="/comparator"
                      className="btn1 bg-success text-white mb-2"
                    >
                      Comparer les offres
                    </Link>
                    <p className="mb-0"></p>
                  </div>
                </div>
                <div className="col-md-12 text-center mx-auto">
                  <div
                    className="card card-body shadow p-2 h-200px h-sm-400px position-relative overflow-hidden rounded"
                    style={{
                      backgroundImage: "url(images/banner/bb1.png)",
                      backgroundPosition: "center left",
                      backgroundSize: "cover",
                      height: 300,
                    }}
                  >
                    <div className="bg-overlay bg-dark opacity-6" />
                    <div className="card-img-overlay">
                      <div className="position-absolute top-50 start-50 translate-middle bg-succ">
                        <a
                          className="btn btn-lg text-white btn-round btn-white-shadow mb-0"
                          // target='_blank'
                          onClick={() => handleShowVideo()}
                        >
                          <i className="fas fa-play" style={{fontSize:50}} />
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* <NewsList /> */}

          <ClientPartnerPage />
          <ClientCallToActionNewsLetter />

          <HowUseComparatorPage visible={showVideo} setVisible={setShowVideo} />
        </>
      }
    />
  );
}
