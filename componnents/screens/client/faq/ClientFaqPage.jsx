import React from 'react'
import ClientMainContainerPage from '../ClientMainContainerPage'

export default function ClientFaqPage() {
  return (
    <ClientMainContainerPage activeHeader={'faq'} children={<>

      <div className="container py-4" style={{marginTop:50}}>
        <div className="row mb-4 trans-fl-l8">
          <div className="col-12">
            <div className="bg-light p-4 p-sm-5 rounded-3 position-relative overflow-hidden">
              {/* SVG decoration */}
              <figure className="position-absolute top-0 start-0 d-none d-lg-block ms-n7">
                <svg
                  width="200px"
                  height="261.6px"
                  viewBox="0 0 294.5 261.6"
                  style={{ enableBackground: "new 0 0 294.5 261.6" }}
                  className='text-primary'
                >
                  <path
                    className="fill-warning opacity-5"
                    d="M280.7,84.9c-4.6-9.5-10.1-18.6-16.4-27.2c-18.4-25.2-44.9-45.3-76-54.2c-31.7-9.1-67.7-0.2-93.1,21.6 C82,36.4,71.9,50.6,65.4,66.3c-4.6,11.1-9.5,22.3-17.2,31.8c-6.8,8.3-15.6,15-22.8,23C10.4,137.6-0.1,157.2,0,179 c0.1,28,11.4,64.6,40.4,76.7c23.9,10,50.7-3.1,75.4-4.7c23.1-1.5,43.1,10.4,65.5,10.6c53.4,0.6,97.8-42,109.7-90.4 C298.5,140.9,293.4,111.5,280.7,84.9z"
                  />
                </svg>
              </figure>
              {/* SVG decoration */}
              <figure className="position-absolute top-50 start-50 translate-middle">
                <svg width="453px" height="211px" >
                  <path
                    className=" text-primary"
                    d="M16.002,8.001 C16.002,12.420 12.420,16.002 8.001,16.002 C3.582,16.002 -0.000,12.420 -0.000,8.001 C-0.000,3.582 3.582,-0.000 8.001,-0.000 C12.420,-0.000 16.002,3.582 16.002,8.001 Z"
                  />
                  <path
                    className=" text-success"
                    d="M176.227,203.296 C176.227,207.326 172.819,210.593 168.614,210.593 C164.409,210.593 161.000,207.326 161.000,203.296 C161.000,199.266 164.409,196.000 168.614,196.000 C172.819,196.000 176.227,199.266 176.227,203.296 Z"
                  />
                  <path
                    className="text-success"
                    d="M453.002,65.001 C453.002,69.420 449.420,73.002 445.001,73.002 C440.582,73.002 437.000,69.420 437.000,65.001 C437.000,60.582 440.582,57.000 445.001,57.000 C449.420,57.000 453.002,60.582 453.002,65.001 Z"
                  />
                </svg>
              </figure>
              {/* SVG decoration */}
              <figure className="position-absolute top-0 end-0 mt-5 me-n5 d-none d-sm-block">
                <svg width="200px" height="272px" className='text-success'>
                  <path
                    className="fill-info opacity-4"
                    d="M142.500,-0.000 C221.200,-0.000 285.000,60.889 285.000,136.000 C285.000,211.111 221.200,272.000 142.500,272.000 C63.799,272.000 -0.000,211.111 -0.000,136.000 C-0.000,60.889 63.799,-0.000 142.500,-0.000 Z"
                  />
                </svg>
              </figure>
              <div className="col-11 mx-auto position-relative">
                <div className="row align-items-center">
                  {/* Title */}
                  <div className="text-center">
                    <h3>Foire Aux Questions</h3>
                    <p className="mb-3 mb-lg-0">
                      Bienvenue dans notre Foire Aux Questions. Vous trouverez ici les réponses aux questions les plus fréquemment posées.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="trans-fb py-5" style={{marginBottom:50}}>
          {/* Title */}
          <h3 className="">Questions fréquemment posées :</h3>
          {/* FAQ START */}
          <div
            className="accordion accordion-icon accordion-bg-light"
            id="accordionExample2"
          >
            {/* Item */}
            <div className="accordion-item mb-3">
              <h6 className="accordion-header font-base" id="heading-1">
                <button
                  className="accordion-button fw-bold rounded d-inline-block text-success"
                  type="button"
                  data-bs-toggle="collapse"
                  data-bs-target="#collapse-1"
                  aria-expanded="true"
                  aria-controls="collapse-1"
                >
                  1. Comment fonctionne le comparateur ?
                </button>
              </h6>
              {/* Body */}
              <div
                id="collapse-1"
                className="accordion-collapse collapse show"
                aria-labelledby="heading-1"
                data-bs-parent="#accordionExample2"
                style={{}}
              >
                <div className="accordion-body mt-3">
                  <p>
                    Le comparateur d'offres de services de télécommunications fonnctionne comme un guichet unique pour explorer les offres des opérateurs télécoms présents sur le marché.
                  </p>
                  <p>
                    C'est un outil d'analyse des offres disponibles des différents opérateurs de télécommunications. Il vous suffit de renseigner vos critères (type d’offre, budget, data, appels, sms, etc.) et nous vous proposons les offres les plus pertinentes et à jour.
                  </p>
                </div>
              </div>
            </div>
            <div className="accordion-item mb-3">
              <h6 className="accordion-header font-base" id="heading-22">
                <button
                  className="accordion-button fw-bold rounded d-inline-block d-block pe-5 collapsed"
                  type="button"
                  data-bs-toggle="collapse"
                  data-bs-target="#collapse-22"
                  aria-expanded="false"
                  aria-controls="collapse-22"
                >
                  2. Qu'est-ce qu'une offre de service de télécommunication?
                </button>
              </h6>
              {/* Body */}
              <div
                id="collapse-22"
                className="accordion-collapse collapse "
                aria-labelledby="heading-22"
                data-bs-parent="#accordionExample2"
                style={{}}
              >
                <div className="accordion-body mt-3">
                  <p>Une offre de service de télécommunication est une proposition commerciale faite par un opérateur de télécommunication qui permet aux particuliers, entreprises ou administrations d'accéder à des services de communication à distance.</p>
                </div>
              </div>
            </div>
            {/* Item */}
            <div className="accordion-item mb-3">
              <h6 className="accordion-header font-base" id="heading-2">
                <button
                  className="accordion-button fw-bold rounded d-inline-block d-block pe-5 collapsed"
                  type="button"
                  data-bs-toggle="collapse"
                  data-bs-target="#collapse-2"
                  aria-expanded="false"
                  aria-controls="collapse-2"
                >
                  3. Quelle est la différence entre offre mobile et fixe ?
                </button>
              </h6>
              {/* Body */}
              <div
                id="collapse-2"
                className="accordion-collapse collapse "
                aria-labelledby="heading-2"
                data-bs-parent="#accordionExample2"
                style={{}}
              >
                <div className="accordion-body mt-3">
                  <p>La différence entre une offre mobile et une offre fixe réside principalement dans le type de réseau utilisé, les appareils concernés, et la mobilité du service.</p>
                  <div className='mb-2'>
                    <b><i className="bi bi-star-fill text-success me-2"></i> Offre Mobile</b>
                    <p>Une offre mobile est un abonnement ou une recharge qui vous permet d’utiliser un téléphone mobile pour passer des appels, envoyer des SMS/MMS, et accéder à Internet via les réseaux cellulaires (2G, 3G, 4G, 5G).</p>
                  </div>
                  <div>
                    <b><i className="bi bi-star-fill text-success me-2"></i>Offre Fixe</b>
                    <p>Une offre fixe est une offre de télécommunication fournie à un lieu physique fixe (maison, bureau), généralement par câble, fibre optique ou ADSL. Elle donne accès à Internet, à la téléphonie fixe, et parfois à la télévision.</p>
                  </div>
                </div>
              </div>
            </div>
            {/* Item */}
            <div className="accordion-item mb-3">
              <h6 className="accordion-header font-base" id="heading-3">
                <button
                  className="accordion-button fw-bold collapsed rounded d-block pe-5"
                  type="button"
                  data-bs-toggle="collapse"
                  data-bs-target="#collapse-3"
                  aria-expanded="false"
                  aria-controls="collapse-3"
                >
                  4. Les offres sont-elles mises à jour régulièrement ?
                </button>
              </h6>
              {/* Body */}
              <div
                id="collapse-3"
                className="accordion-collapse collapse"
                aria-labelledby="heading-3"
                data-bs-parent="#accordionExample2"
              >
                <div className="accordion-body mt-3">
                  Oui, nous mettons à jour notre base de données quotidiennement afin de vous fournir des offres précises et à jour, en fonction des changements opérateurs.
                </div>
              </div>
            </div>
            {/* Item */}
            <div className="accordion-item mb-3">
              <h6 className="accordion-header font-base" id="heading-4">
                <button
                  className="accordion-button fw-bold collapsed rounded d-block pe-5"
                  type="button"
                  data-bs-toggle="collapse"
                  data-bs-target="#collapse-4"
                  aria-expanded="false"
                  aria-controls="collapse-4"
                >
                 5. Mes données personnelles sont-elles protégées ?
                </button>
              </h6>
              {/* Body */}
              <div
                id="collapse-4"
                className="accordion-collapse collapse"
                aria-labelledby="heading-4"
                data-bs-parent="#accordionExample2"
              >
                <div className="accordion-body mt-3">
                  <p>
                    Oui, nous respectons votre vie privée. Aucune donnée personnelle n’est transmise a un tiers sans votre accord explicite.
                  </p>
                </div>
              </div>
            </div>
            {/* Item */}
            {/* <div className="accordion-item mb-3">
              <h6 className="accordion-header font-base" id="heading-5">
                <button
                  className="accordion-button fw-bold collapsed rounded d-block pe-5"
                  type="button"
                  data-bs-toggle="collapse"
                  data-bs-target="#collapse-5"
                  aria-expanded="false"
                  aria-controls="collapse-5"
                >
                  Additional Options and Services
                </button>
              </h6>
              <div
                id="collapse-5"
                className="accordion-collapse collapse"
                aria-labelledby="heading-5"
                data-bs-parent="#accordionExample2"
              >
                <div className="accordion-body mt-3">
                  Post no so what deal evil rent by real in. But her ready least set
                  lived spite solid. September how men saw tolerably two behavior
                  arranging. She offices for highest and replied one venture pasture.
                  Applauded no discovery in newspaper allowance am northward. Frequently
                  partiality possession resolution at or appearance unaffected me.
                  Engaged its was the evident pleased husband. Ye goodness felicity do
                  disposal dwelling no. First am plate jokes to began to cause a scale.
                  Subjects he prospect elegance followed no overcame possible it on.
                  Improved own provided blessing may peculiar domestic. Sight house has
                  sex never. No visited raising gravity outward subject my cottage Mr
                  be. Hold do at tore in park feet near my case. Invitation at
                  understood occasional sentiments insipidity inhabiting in. Off
                  melancholy alteration principles old. Is do speedily kindness properly
                  oh. Respect article painted cottage he is offices parlors.
                </div>
              </div>
            </div> */}
            {/* Item */}
            <div className="accordion-item">
              <h6 className="accordion-header font-base" id="heading-6">
                <button
                  className="accordion-button fw-bold collapsed rounded d-block pe-5"
                  type="button"
                  data-bs-toggle="collapse"
                  data-bs-target="#collapse-6"
                  aria-expanded="false"
                  aria-controls="collapse-6"
                >
                  6. Puis-je comparer à la fois les offres mobiles et fixes ?
                </button>
              </h6>
              {/* Body */}
              <div
                id="collapse-6"
                className="accordion-collapse collapse"
                aria-labelledby="heading-6"
                data-bs-parent="#accordionExample2"
              >
                <div className="accordion-body mt-3">
                  <p>Oui, la plateforme permet de comparer à la fois les offres mobiles (voix, data, SMS) et les offres fixes (ADSL, fibre, box 4G, etc.).</p>
                </div>
              </div>
            </div>
          </div>
          {/* FAQ END */}
        </div>
      </div>

    </>} />
  )
}
