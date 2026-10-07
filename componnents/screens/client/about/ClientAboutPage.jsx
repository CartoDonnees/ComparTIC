import React, { useEffect, useState } from "react";
import ClientMainContainerPage from "../ClientMainContainerPage";
import ClientPartnerPage from "@/componnents/partner/ClientPartnerPage";
import { getClientGenStats } from "@/services/api/client/statisticsApiServices";

export default function ClientAboutPage() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    const _stats = await getClientGenStats();
    setStats(_stats);
  };
  return (
    <ClientMainContainerPage
      activeHeader={"about"}
      children={
        <>
          {/* =======================
Page Banner START */}
          <section>
            <div className="container"  style={{marginTop:30}}>
              <div className="row g-4 py-4" >
                <h1 className="block-title size-small text-success trans-fl-l8 mb-5" >
                  A propos de ComparTIC
                </h1>
                {/* Title and SVG START */}
                <div className="col-10 text-center mx-auto position-relative trans-fr">
                  {/* SVG decoration */}
                  <figure className="position-absolute top-100 start-50 translate-middle mt-5 ms-n9 pt-5 d-none d-lg-block text-primary">
                    <svg>
                      <path
                        className="fill-success"
                        d="m181.6 6.7c-0.1 0-0.2-0.1-0.3 0-2.5-0.3-4.9-1-7.3-1.4-2.7-0.4-5.5-0.7-8.2-0.8-1.4-0.1-2.8-0.1-4.1-0.1-0.5 0-0.9-0.1-1.4-0.2-0.9-0.3-1.9-0.1-2.8-0.1-5.4 0.2-10.8 0.6-16.1 1.4-2.7 0.3-5.3 0.8-7.9 1.3-0.6 0.1-1.1 0.3-1.8 0.3-0.4 0-0.7-0.1-1.1-0.1-1.5 0-3 0.7-4.3 1.2-3 1-6 2.4-8.8 3.9-2.1 1.1-4 2.4-5.9 3.9-1 0.7-1.8 1.5-2.7 2.2-0.5 0.4-1.1 0.5-1.5 0.9s-0.7 0.8-1.1 1.2c-1 1-1.9 2-2.9 2.9-0.4 0.3-0.8 0.5-1.2 0.5-1.3-0.1-2.7-0.4-3.9-0.6-0.7-0.1-1.2 0-1.8 0-3.1 0-6.4-0.1-9.5 0.4-1.7 0.3-3.4 0.5-5.1 0.7-5.3 0.7-10.7 1.4-15.8 3.1-4.6 1.6-8.9 3.8-13.1 6.3-2.1 1.2-4.2 2.5-6.2 3.9-0.9 0.6-1.7 0.9-2.6 1.2s-1.7 1-2.5 1.6c-1.5 1.1-3 2.1-4.6 3.2-1.2 0.9-2.7 1.7-3.9 2.7-1 0.8-2.2 1.5-3.2 2.2-1.1 0.7-2.2 1.5-3.3 2.3-0.8 0.5-1.7 0.9-2.5 1.5-0.9 0.8-1.9 1.5-2.9 2.2 0.1-0.6 0.3-1.2 0.4-1.9 0.3-1.7 0.2-3.6 0-5.3-0.1-0.9-0.3-1.7-0.8-2.4s-1.5-1.1-2.3-0.8c-0.2 0-0.3 0.1-0.4 0.3s-0.1 0.4-0.1 0.6c0.3 3.6 0.2 7.2-0.7 10.7-0.5 2.2-1.5 4.5-2.7 6.4-0.6 0.9-1.4 1.7-2 2.6s-1.5 1.6-2.3 2.3c-0.2 0.2-0.5 0.4-0.6 0.7s0 0.7 0.1 1.1c0.2 0.8 0.6 1.6 1.3 1.8 0.5 0.1 0.9-0.1 1.3-0.3 0.9-0.4 1.8-0.8 2.7-1.2 0.4-0.2 0.7-0.3 1.1-0.6 1.8-1 3.8-1.7 5.8-2.3 4.3-1.1 9-1.1 13.3 0.1 0.2 0.1 0.4 0.1 0.6 0.1 0.7-0.1 0.9-1 0.6-1.6-0.4-0.6-1-0.9-1.7-1.2-2.5-1.1-4.9-2.1-7.5-2.7-0.6-0.2-1.3-0.3-2-0.4-0.3-0.1-0.5 0-0.8-0.1s-0.9 0-1.1-0.1-0.3 0-0.3-0.2c0-0.4 0.7-0.7 1-0.8 0.5-0.3 1-0.7 1.5-1l5.4-3.6c0.4-0.2 0.6-0.6 1-0.9 1.2-0.9 2.8-1.3 4-2.2 0.4-0.3 0.9-0.6 1.3-0.9l2.7-1.8c1-0.6 2.2-1.2 3.2-1.8 0.9-0.5 1.9-0.8 2.7-1.6 0.9-0.8 2.2-1.4 3.2-2 1.2-0.7 2.3-1.4 3.5-2.1 4.1-2.5 8.2-4.9 12.7-6.6 5.2-1.9 10.6-3.4 16.2-4 5.4-0.6 10.8-0.3 16.2-0.5h0.5c1.4-0.1 2.3-0.1 1.7 1.7-1.4 4.5 1.3 7.5 4.3 10 3.4 2.9 7 5.7 11.3 7.1 4.8 1.6 9.6 3.8 14.9 2.7 3-0.6 6.5-4 6.8-6.4 0.2-1.7 0.1-3.3-0.3-4.9-0.4-1.4-1-3-2.2-3.9-0.9-0.6-1.6-1.6-2.4-2.4-0.9-0.8-1.9-1.7-2.9-2.3-2.1-1.4-4.2-2.6-6.5-3.5-3.2-1.3-6.6-2.2-10-3-0.8-0.2-1.6-0.4-2.5-0.5-0.2 0-1.3-0.1-1.3-0.3-0.1-0.2 0.3-0.4 0.5-0.6 0.9-0.8 1.8-1.5 2.7-2.2 1.9-1.4 3.8-2.8 5.8-3.9 2.1-1.2 4.3-2.3 6.6-3.2 1.2-0.4 2.3-0.8 3.6-1 0.6-0.2 1.2-0.2 1.8-0.4 0.4-0.1 0.7-0.3 1.1-0.5 1.2-0.5 2.7-0.5 3.9-0.8 1.3-0.2 2.7-0.4 4.1-0.7 2.7-0.4 5.5-0.8 8.2-1.1 3.3-0.4 6.7-0.7 10-1 7.7-0.6 15.3-0.3 23 1.3 4.2 0.9 8.3 1.9 12.3 3.6 1.2 0.5 2.3 1.1 3.5 1.5 0.7 0.2 1.3 0.7 1.8 1.1 0.7 0.6 1.5 1.1 2.3 1.7 0.2 0.2 0.6 0.3 0.8 0.2 0.1-0.1 0.1-0.2 0.2-0.4 0.1-0.9-0.2-1.7-0.7-2.4-0.4-0.6-1-1.4-1.6-1.9-0.8-0.7-2-1.1-2.9-1.6-1-0.5-2-0.9-3.1-1.3-2.5-1.1-5.2-2-7.8-2.8-1-0.8-2.4-1.2-3.7-1.4zm-64.4 25.8c4.7 1.3 10.3 3.3 14.6 7.9 0.9 1 2.4 1.8 1.8 3.5-0.6 1.6-2.2 1.5-3.6 1.7-4.9 0.8-9.4-1.2-13.6-2.9-4.5-1.7-8.8-4.3-11.9-8.3-0.5-0.6-1-1.4-1.1-2.2 0-0.3 0-0.6-0.1-0.9s-0.2-0.6 0.1-0.9c0.2-0.2 0.5-0.2 0.8-0.2 2.3-0.1 4.7 0 7.1 0.4 0.9 0.1 1.6 0.6 2.5 0.8 1.1 0.4 2.3 0.8 3.4 1.1z"
                      />
                    </svg>
                  </figure>
                  {/* SVG decoration */}
                  <figure className="position-absolute top-0 start-0 ms-n9 text-success">
                    <svg width="22px" height="22px" viewBox="0 0 22 22">
                      <polygon
                        className="fill-orange"
                        points="22,8.3 13.7,8.3 13.7,0 8.3,0 8.3,8.3 0,8.3 0,13.7 8.3,13.7 8.3,22 13.7,22 13.7,13.7 22,13.7 "
                      />
                    </svg>
                  </figure>
                  {/* SVG decoration */}
                  <figure className="position-absolute top-100 start-100 translate-middle ms-5 d-none d-md-block text-success">
                    <svg width="21.5px" height="21.5px" viewBox="0 0 21.5 21.5">
                      <polygon
                        className="fill-danger"
                        points="21.5,14.3 14.4,9.9 18.9,2.8 14.3,0 9.9,7.1 2.8,2.6 0,7.2 7.1,11.6 2.6,18.7 7.2,21.5 11.6,14.4 18.7,18.9 "
                      />
                    </svg>
                  </figure>
                  {/* SVG decoration */}
                  <figure className="position-absolute top-0 start-100 translate-middle text-success">
                    <svg width="27px" height="27px">
                      <path
                        className="fill-orange"
                        d="M13.122,5.946 L17.679,-0.001 L17.404,7.528 L24.661,5.946 L19.683,11.533 L26.244,15.056 L18.891,16.089 L21.686,23.068 L15.400,19.062 L13.122,26.232 L10.843,19.062 L4.557,23.068 L7.352,16.089 L-0.000,15.056 L6.561,11.533 L1.582,5.946 L8.839,7.528 L8.565,-0.001 L13.122,5.946 Z"
                      />
                    </svg>
                  </figure>
                  {/* Title */}
                  <h1 className="position-relative fs-2">
                    L'ARTCI Au cœur de la transformation numérique de la Côte
                    d'Ivoire <br />
                    <b className="text-primary">ComparTIC</b> un outil pour
                    l'analyse comparative des offres mobile et fixe des
                    opérateurs de télécommunications au service du consommateur
                  </h1>
                </div>
                {/* Title and SVG END */}
              </div>
              {/* Images END */}
            </div>
          </section>

          <section className="py-0 py-lg-5 trans-fb">
            <div className="container">
              <div className="bg-blue1 bg-opacity-10 p-4 p-sm-5 rounded position-relative overflow-hidden">
                {/* SVG decoration */}
                {/* <figure className="position-absolute top-50 end-0 translate-middle-y me-n7">
                            <svg
                                className="fill-white opacity-8 rotate-193"
                                width="676px"
                                height="161.3px"
                                viewBox="0 0 676 161.3"
                                style={{ enableBackground: "new 0 0 676 161.3" }}
                                xmlSpace="preserve"
                            >
                                <path d="M53.6,18.8c28.6,8.8,50.3,27.3,70.9,48c19.9,19.9,39.5,40.8,65.3,53c53.3,24.9,116,12.4,168.2-9.1 c58.4-23.9,113.2-59.8,176.2-70.3c30.9-5.1,64.1-2.6,90.9,14.7c22.4,14.4,34.4,36.9,39.5,62.4c2.9,14.5,3.9,29.2,4.6,43.9h6.8 c-0.2-4.2-0.5-8.3-0.8-12.5c-1.7-24.1-4.9-49.1-17.6-70.3c-14.5-23.9-40-39.2-67-44.8c-32.9-6.8-67.2-0.3-98.5,10.2 c-30.3,10-59,24.2-87.7,38.1c-54.8,26.4-115.5,53.1-177.9,42c-14.5-2.6-28.7-7.4-41.7-14.7c-12.8-7.3-23.9-16.7-34.6-26.7 c-20.7-19.6-39.4-42-64.1-56.8c-25.6-15.4-56.4-22.2-86-19H0v6.9C17.9,11.8,36.3,13.5,53.6,18.8z" />
                            </svg>
                        </figure> */}
                {/* SVG decoration */}
                {/* <figure className="position-absolute top-0 start-0 mt-3 ms-n3 opacity-5">
                            <svg width="818.6px" height="235.1px" viewBox="0 0 818.6 235.1">
                                <path
                                    className="fill-orange"
                                    d="M735,226.3c-5.7,0.6-11.5,1.1-17.2,1.7c-66.2,6.8-134.7,13.7-192.6-16.6c-34.6-18.1-61.4-47.9-87.3-76.7 c-21.4-23.8-43.6-48.5-70.2-66.7c-53.2-36.4-121.6-44.8-175.1-48c-13.6-0.8-27.5-1.4-40.9-1.9c-46.9-1.9-95.4-3.9-141.2-16.5 C8.3,1.2,6.2,0.6,4.2,0H0c3.3,1,6.6,2,10,3c46,12.5,94.5,14.6,141.5,16.5c13.4,0.6,27.3,1.1,40.8,1.9 c53.4,3.2,121.5,11.5,174.5,47.7c26.5,18.1,48.6,42.7,70,66.5c26,28.9,52.9,58.8,87.7,76.9c58.3,30.5,127,23.5,193.3,16.7 c5.8-0.6,11.5-1.2,17.2-1.7c26.2-2.6,55-4.2,83.5-2.2v-1.2C790,222,761.2,223.7,735,226.3z"
                                />
                            </svg>
                        </figure> */}
                <div className="row g-4 position-relative align-items-center justify-content-center">
                  {/* Counter item */}
                  <div className="col-sm-6 col-lg-3 text-center">
                    <div className="d-flex justify-content-center">
                      <h4
                        className="purecounter display-6 text-orange fw-bold mb-0"
                        data-purecounter-start={0}
                        data-purecounter-end={89}
                        data-purecounter-delay={200}
                        data-purecounter-duration={0}
                      >
                         {stats?.[0]}
                      </h4>
                      {/* <span className="display-6 text-orange mb-0"></span> */}
                    </div>
                    <h6 className="mb-0 fw-bold">Total des offres</h6>
                  </div>
                  {/* Counter item */}
                  <div className="col-sm-6 col-lg-3 text-center">
                    <div className="d-flex justify-content-center">
                      <h4
                        className="purecounter display-6 text-orange fw-bold mb-0"
                        data-purecounter-start={0}
                        data-purecounter-end={25}
                        data-purecounter-delay={200}
                        data-purecounter-duration={0}
                      >
                      {stats?.[2]}
                      </h4>
                      {/* <span className="display-6 text-orange mb-0">K</span> */}
                    </div>
                    <h6 className="mb-0 fw-bold">Offres en promotion</h6>
                  </div>
                  {/* Counter item */}
                  <div className="col-sm-6 col-lg-3 text-center">
                    <div className="d-flex justify-content-center">
                      <h4
                        className="purecounter display-6 text-orange fw-bold mb-0"
                        data-purecounter-start={0}
                        data-purecounter-end={180}
                        data-purecounter-delay={200}
                        data-purecounter-duration={0}
                      >
                      {stats?.[7]}
                      </h4>
                      {/* <span className="display-6 text-orange mb-0">K</span> */}
                    </div>
                    <h6 className="mb-0 fw-bold">Offres mobiles</h6>
                  </div>
                  {/* Counter item */}
                  <div className="col-sm-6 col-lg-3 text-center">
                    <div className="d-flex justify-content-center">
                      <h4
                        className="purecounter display-6 text-orange fw-bold mb-0"
                        data-purecounter-start={0}
                        data-purecounter-end={20}
                        data-purecounter-delay={200}
                        data-purecounter-duration={0}
                      >
                      {stats?.[8]}
                      </h4>
                    </div>
                    <h6 className="mb-0 fw-bold">Offres fixes</h6>
                  </div>
                </div>{" "}
                {/* Row END */}
              </div>
            </div>
          </section>

          {/* =======================
Page Banner END */}
          {/* =======================
About founder START */}
          <section className="pt-0 mb-4 py-3 bg-light trans-fb ">
            <div
              className="container"
              style={{
                paddingTop: 30,
                paddingBottom: 30,
              }}
            >
              {/* Title */}
              <div className="row mb-4">
                <div className="col-lg-8">
                  <h2>
                    Le comparateur (<b className="text-primary">ComparTIC</b>)
                  </h2>
                  <p className="mb-0">
                    Le comparateur d'offres de services de télécommunications
                    fonnctionne comme un guichet unique pour explorer les offres
                    des opérateurs télécoms présents sur le marché.
                  </p>
                </div>
              </div>
              <div className="row align-items-center">
                <div className="col-lg-5 position-relative">
                  {/* SVG decoration */}
                  {/* <figure className="position-absolute top-0 start-0 d-inline-block mt-n3">
                    <svg
                      width={180}
                      height={188}
                      viewBox="0 0 379 395"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        className="fill-dark"
                        d="m194.01 213.69c0.16-5.82-0.7-11.77-1.4-17.55-0.64-5.35-0.76-11.29-2.82-16.27-1.96-4.73-8.61-4.2-9.04 1.22-0.43 5.35 1.23 11.08 2.27 16.34 1.14 5.75 2.15 11.66 4.1 17.18 1.3 3.67 6.78 3.18 6.89-0.92z"
                      />
                      <path
                        className="fill-dark"
                        d="m128.66 204.59c6.52 6.1 15.48 10.99 24.03 13.51 5.22 1.54 7.32-5.35 3.46-8.21-6.75-5.01-16.05-9.23-24.35-10.7-2.94-0.52-5.69 3.02-3.14 5.4z"
                      />
                      <path
                        className="fill-dark"
                        d="m132.2 252.72c6.03 2.03 13-2.24 18.55-4.47 5.74-2.31 12.86-4.01 16.33-9.42 1.35-2.1 0.13-5.66-2.49-6.12-6.49-1.13-12.33 2.76-18.07 5.5-5.32 2.53-13.35 4.85-15.93 10.57-0.73 1.63-0.16 3.34 1.61 3.94z"
                      />
                      <path
                        className="fill-dark"
                        d="m182.31 247.3c-1.06 5.43-0.29 10.91 0.17 16.38 0.45 5.37 0.39 10.33 3.86 14.65 2.48 3.08 6.71 0.8 7.87-2.08 1.92-4.74-0.07-10.24-1.09-15.05-1.07-5.05-1.88-10.15-4.3-14.75-1.37-2.61-5.92-2.16-6.51 0.85z"
                      />
                      <path
                        className="fill-dark"
                        d="m211.23 241.9c5.34 2.71 11.14 3.79 16.93 5.12 5.44 1.25 11.33 3.6 16.8 1.69 2.97-1.04 4.8-5.22 2.01-7.6-4.56-3.89-10.1-3.93-15.86-4.77-5.93-0.87-11.93-2.18-17.94-1.58-3.44 0.33-5.65 5.25-1.94 7.14z"
                      />
                      <path
                        className="fill-dark"
                        d="m214.37 216.88c4.35-2.81 8.22-6.6 12.01-10.11 3.85-3.57 8.13-6.91 9.69-12.11 1.18-3.93-2.72-7.7-6.6-6.6-5.19 1.47-8.64 5.78-12.25 9.56-3.58 3.74-7.38 7.54-10.27 11.86-3.01 4.48 2.94 10.3 7.42 7.4z"
                      />
                      <path
                        className="fill-dark"
                        d="m207.17 163.93c0.09-5.41-0.52-10.86-1.1-16.24-0.53-4.88-0.69-9.86-5.27-12.57-1.66-0.99-4.25-0.79-5.58 0.72-3.58 4.05-2.41 8.55-1.43 13.51 1.05 5.32 2.17 10.73 3.91 15.86 1.72 5.06 9.38 4.33 9.47-1.28z"
                      />
                      <path
                        className="fill-dark"
                        d="m170.28 175.82c-1.08-4.59-5.06-8.9-8.25-12.24-3.48-3.65-7.11-6.76-11.91-8.47-3.27-1.16-6.56 2.43-5.59 5.59 1.49 4.87 4.62 8.63 8.09 12.28 3.19 3.35 7.33 7.35 11.86 8.62 3.57 1.02 6.6-2.33 5.8-5.78z"
                      />
                      <path
                        className="fill-dark"
                        d="m113.84 176.01c-7.44-4.12-18.57-4.89-26.84-3.99-5.8 0.63-7.84 9.04-1.46 10.76 4.65 1.25 9.05 1.98 13.88 1.84 4.39-0.13 9.32 0.11 13.47-1.4 3.03-1.1 4.11-5.46 0.95-7.21z"
                      />
                      <path
                        className="fill-dark"
                        d="m125.34 225.91c-5.47 2.02-10.75 4.18-16 6.74-5.16 2.52-11.05 4.98-14.84 9.42-3.46 4.06-0.13 9.64 5.06 8.7 5.73-1.04 10.86-4.93 15.62-8.12 4.84-3.23 9.35-6.72 13.83-10.42 2.88-2.38-0.19-7.6-3.67-6.32z"
                      />
                      <path
                        className="fill-dark"
                        d="m154.27 279.62c-3.59 9.53-5.46 22.66-3.96 32.73 0.5 3.32 6.07 4.06 7.41 0.97 4.05-9.33 5.62-22.49 4.62-32.61-0.46-4.65-6.4-5.53-8.07-1.09z"
                      />
                      <path
                        className="fill-dark"
                        d="m215.3 280.91c2.51 5 6.64 8.95 10.55 12.87 3.98 3.99 8.2 7.99 13.42 10.24 4.15 1.79 8.7-1.96 6.37-6.37-2.78-5.28-7.24-9.31-11.78-13.1-4.44-3.7-8.65-7.32-14.04-9.52-3.51-1.43-5.91 3.11-4.52 5.88z"
                      />
                      <path
                        className="fill-dark"
                        d="m254.24 267.03c5.83 1.72 12.15 1.57 18.2 1.8 6.2 0.24 12.37 0.53 18.44-0.9 4.44-1.05 4.44-7.93 0-8.98-6.07-1.43-12.24-1.14-18.44-0.9-6.05 0.23-12.36 0.08-18.2 1.8-3.54 1.04-3.55 6.13 0 7.18z"
                      />
                      <path
                        className="fill-dark"
                        d="m249.57 220.6c5.74 0.12 11.6-2.08 17.06-3.7 5.45-1.61 11.25-2.56 15.39-6.7 2.54-2.55 1.73-8.18-2.32-8.79-5.98-0.91-10.83 1.38-16.4 3.38-5.3 1.91-11.59 3.59-16.1 7.03-3.55 2.7-2.68 8.67 2.37 8.78z"
                      />
                      <path
                        className="fill-dark"
                        d="m238.02 166.17c5.01 0.05 6.68-5.95 8.2-9.72 2.09-5.16 5.82-11.06 4.3-16.7-1.07-3.99-5.57-4.49-8.42-2.22-4.5 3.56-5.43 12.37-6.71 17.73-0.63 2.63-2.45 10.86 2.63 10.91z"
                      />
                      <path
                        className="fill-dark"
                        d="m175.92 131.08c-1.38-4.98-4.55-9.43-7.22-13.81-2.74-4.5-5.16-8.6-9.77-11.37-3.99-2.4-7.62 1.55-7.08 5.44 0.71 5.16 3.67 8.88 6.59 13.03 2.76 3.92 5.45 8.49 9.2 11.53 3.63 2.95 9.7 0.32 8.28-4.82z"
                      />
                      <path
                        className="fill-dark"
                        d="m127.5 145.68c-1.48-4.47-4.02-8.5-6.53-12.46-2.62-4.14-5.16-8.26-9.07-11.29-3.8-2.95-11.23-0.45-9.16 5.33 1.79 4.99 4.71 8.72 8.08 12.77 3.16 3.81 6.31 7.59 10.31 10.54 3.06 2.24 7.5-1.48 6.37-4.89z"
                      />
                      <path
                        className="fill-dark"
                        d="m101.97 207.71c-4.66-0.27-9.34 0.67-13.89 1.61-4.86 1-9.5 1.89-13.64 4.77-4.3 2.98-3.09 10.56 2.82 10.41 5.31-0.13 9.68-2.1 14.43-4.28 4.41-2.01 8.72-4.09 12.48-7.19 2.26-1.84 0.25-5.18-2.2-5.32z"
                      />
                      <path
                        className="fill-dark"
                        d="m116.71 272.51c-4.44 3-7.89 7.25-11.32 11.32-3.27 3.87-8.11 8.18-9.12 13.28-0.88 4.45 3.4 7.81 7.48 5.75 4.67-2.35 7.5-8.09 10.36-12.29 3-4.4 6.21-8.89 7.91-13.97 0.98-2.92-2.72-5.84-5.31-4.09z"
                      />
                      <path
                        className="fill-dark"
                        d="m122.39 301.82c-5.73 9.01-7.71 21.98-9 32.42-0.66 5.35 7.05 5.43 8.72 1.18 3.68-9.42 7.84-21.51 7.12-31.74-0.25-3.62-4.81-5.04-6.84-1.86z"
                      />
                      <path
                        className="fill-dark"
                        d="m175.01 308.29c-2.31 11.43-3.44 23.86-1.94 35.44 0.5 3.89 6.31 5.52 7.42 1.01 2.79-11.35 3.18-23.81 2.16-35.41-0.36-4.07-6.71-5.66-7.64-1.04z"
                      />
                      <path
                        className="fill-dark"
                        d="m210.59 318.2c1.26 8.85 4.01 18.05 7.97 26.05 2.65 5.35 9.5 1.21 8.81-3.71-1.22-8.79-4.36-17.94-8.27-25.92-2.53-5.17-9.19-1.18-8.51 3.58z"
                      />
                      <path
                        className="fill-dark"
                        d="m259.62 289.8c3.87 4.03 9.22 6.16 14.27 8.35 5.5 2.38 10.65 4.46 16.62 5.28 3.9 0.54 6.45-4.22 2.79-6.61-5.03-3.27-10.23-5.13-15.94-6.92-5.3-1.66-10.9-3.61-16.51-3.1-1.47 0.15-2.34 1.84-1.23 3z"
                      />
                      <path
                        className="fill-dark"
                        d="m278.17 239.36c4.63 0.39 9.28-1.67 13.66-3 4.69-1.43 9.34-2.62 13.55-5.22 4.66-2.88 1.5-9.44-3.59-8.51-4.84 0.89-9.1 3.2-13.52 5.27-4.12 1.93-8.83 3.5-11.99 6.88-1.68 1.79-0.41 4.39 1.89 4.58z"
                      />
                      <path
                        className="fill-dark"
                        d="m260.7 185.8c6.75-0.5 12.46-6.6 17.59-10.64 6.06-4.77 13.55-9.38 17.13-16.41 1.61-3.15-1.07-7.46-4.83-6.28-7.33 2.3-12.71 8.29-18.33 13.29-4.95 4.42-12.78 9.58-14.42 16.28-0.42 1.75 0.87 3.91 2.86 3.76z"
                      />
                      <path
                        className="fill-dark"
                        d="m222.24 126.71c1.72-5.82 2.23-12.08 2.75-18.11 0.53-6.15 1.5-12.24-0.7-18.15-0.98-2.63-5.02-3.81-6.51-0.85-2.84 5.63-2.77 11.47-2.92 17.68-0.16 6.48-0.31 13.03 0.82 19.43 0.62 3.45 5.67 3 6.56 0z"
                      />
                      <path
                        className="fill-dark"
                        d="m189.37 103.89c1.91-10.31-0.85-23.15-4.28-32.87-1.79-5.06-9.95-4.6-9.79 1.33 0.27 10.37 2.05 23.4 7.57 32.4 1.48 2.42 5.92 2.3 6.5-0.86z"
                      />
                      <path
                        className="fill-dark"
                        d="m138.39 113.34c-2.42-11.53-5.76-23.3-11.04-33.86-2.46-4.91-9.59-1.36-8.51 3.59 2.49 11.44 7.43 22.73 12.74 33.14 2 3.93 7.64 1.09 6.81-2.87z"
                      />
                      <path
                        className="fill-dark"
                        d="m95.58 142.36c-10.59-3.62-23.57-6.37-34.52-2.95-3.37 1.05-4.68 6.37-1.06 8.11 10.9 5.24 23.97 4.38 35.58 2.23 4-0.73 3.28-6.27 0-7.39z"
                      />
                      <path
                        className="fill-dark"
                        d="m71.61 190.69c-11.35-0.2-25.08 1.31-35.4 6.17-5.27 2.48-2.55 10.83 2.9 10.72 11.39-0.23 24.24-5.15 34.27-10.36 3.19-1.65 1.57-6.47-1.77-6.53z"
                      />
                      <path
                        className="fill-dark"
                        d="m70.91 241.18c-6.14 1.41-11.5 5.82-16.53 9.45-5.45 3.92-10.23 8.3-14.75 13.25-3.72 4.07 0.98 10.58 5.97 7.74 5.82-3.3 11.15-6.97 16.18-11.39 4.67-4.1 10.21-8.39 12.96-14.07 1.3-2.67-0.82-5.67-3.83-4.98z"
                      />
                      <path
                        className="fill-dark"
                        d="m80.75 290.12c-11.72 5.48-23.72 14.77-32.18 24.52-3.31 3.82 0.8 9.5 5.44 7.06 11.45-6.02 23.21-15.54 31.25-25.72 2.62-3.32-0.53-7.72-4.51-5.86z"
                      />
                      <path
                        className="fill-dark"
                        d="m137.08 338.96c-3.59 8.71-5.75 20.22-5.21 29.62 0.31 5.45 7.72 6.52 9.47 1.28 3-8.95 3.91-20.61 2.73-29.96-0.5-4.05-5.42-4.76-6.99-0.94z"
                      />
                      <path
                        className="fill-dark"
                        d="m90.97 334.12c-7.42 8.44-11.65 20.48-14.36 31.22-1.21 4.8 5.58 7.88 8.11 3.42 5.49-9.67 10.82-21.27 11.3-32.55 0.11-2.48-3.36-4.01-5.05-2.09z"
                      />
                      <path
                        className="fill-dark"
                        d="m183.75 362.85c-0.94 8.43-1.81 20.63 3.62 27.64 1.57 2.03 5.08 1.2 6.2-0.8 2.33-4.17 2.01-8.48 1.47-13.1-0.58-5-1.14-10.08-2.47-14.94-1.42-5.19-8.29-3.59-8.82 1.2z"
                      />
                      <path
                        className="fill-dark"
                        d="m231.99 363.98c0.76 4.42 4.35 8.51 6.86 12.12 2.85 4.09 5.89 7.41 9.98 10.26 3.45 2.41 9.16-1.67 7.48-5.75-1.99-4.85-4.64-8.7-8.21-12.55-3.27-3.52-6.35-7.46-10.86-9.33-3.33-1.39-5.73 2.47-5.25 5.25z"
                      />
                      <path
                        className="fill-dark"
                        d="m266.34 334.6c3.77 5.1 9.94 7.95 15.32 11.13 5.77 3.4 11.98 8.41 18.68 9.44 4.88 0.75 8.48-4.45 4.9-8.42-4.54-5.05-12.05-7.51-18.06-10.47-5.59-2.74-11.57-6.54-17.86-6.87-2.45-0.14-4.53 3.09-2.98 5.19z"
                      />
                      <path
                        className="fill-dark"
                        d="m316.13 301.59c4.75 2.94 10.54 4.1 15.86 5.66 4.95 1.45 10.22 3.67 14.39-0.45 1.09-1.07 1.7-2.93 1.17-4.42-2.02-5.66-7.03-5.96-12.33-6.86-5.49-0.94-11.33-2.55-16.91-1.99-4.14 0.41-6.06 5.65-2.18 8.06z"
                      />
                      <path
                        className="fill-dark"
                        d="m316.55 243.69c4.9 0.41 9.87-0.06 14.73-0.78 4.98-0.74 9.48-1.05 13.4-4.41 2.7-2.31 1.2-7.08-2.08-7.87-4.92-1.2-9.43 0.65-14.08 2.29-4.56 1.61-9.16 3.42-13.28 5.97-2.27 1.41-1.18 4.59 1.31 4.8z"
                      />
                      <path
                        className="fill-dark"
                        d="m308.04 203.69c4.85-0.37 9.55-2.49 14.01-4.38 4.56-1.94 9.9-3.42 13.28-7.2 3.13-3.51 1.13-9.73-3.99-9.63-5.12 0.09-9.53 2.9-14.03 5.11-4.35 2.14-9.26 4.34-12.71 7.79-2.82 2.8-0.89 8.65 3.44 8.31z"
                      />
                      <path
                        className="fill-dark"
                        d="m269.75 136.35c2.23-2.11 4.44-3.56 6.47-5.95 2.15-2.52 4.26-5.06 6.29-7.68 3.67-4.73 7.87-9.39 10.84-14.59 3.28-5.75-4.7-12.37-9.38-7.24-4.06 4.46-7.24 9.78-10.63 14.75-1.66 2.44-3.23 4.94-4.8 7.44-1.9 3.04-2.79 5.84-4.31 9.01-1.66 3.52 2.51 7.11 5.52 4.26z"
                      />
                      <path
                        className="fill-dark"
                        d="m249.62 85.78c6.03-7.39 11.22-17.92 13.28-27.22 1.53-6.93-6.93-9.89-10.91-4.6-3.02 4.01-4.88 8.3-6.86 12.9-1.87 4.33-4 8.83-4.85 13.48-0.89 4.88 5.45 10.21 9.34 5.44z"
                      />
                      <path
                        className="fill-dark"
                        d="m90.05 91.45c-2.56-5.05-7.57-9.23-11.65-13.07-4.09-3.85-8.31-9.07-14.25-9.28-3.38-0.12-5.49 3.27-4.81 6.31 1.25 5.6 7.66 8.94 12 12.12 4.52 3.31 9.43 7.32 14.87 8.91 3 0.87 5.14-2.45 3.84-4.99z"
                      />
                      <path
                        className="fill-dark"
                        d="m44.95 170.14c-6.71-0.76-13.22-1.96-20-2.4-6.02-0.39-10.51-1.6-14.47 3.58-0.86 1.12-0.86 3.41 0 4.53 3.97 5.2 8.38 3.97 14.47 3.58 6.77-0.43 13.29-1.63 20-2.4 4.42-0.49 4.43-6.38 0-6.89z"
                      />
                      <path
                        className="fill-dark"
                        d="m311.93 138.89c5.64-2.46 10.99-5.48 16.42-8.37 4.61-2.46 10.32-5.01 12.47-10.07 1.14-2.67-0.21-5.1-3.12-5.44-5.48-0.63-10.55 3.08-14.97 5.89-5.19 3.29-10.47 6.45-15.39 10.14-4.7 3.53-0.8 10.21 4.59 7.85z"
                      />
                      <path
                        className="fill-dark"
                        d="m214.43 69.49c1.24-8.38 0.44-19.18-2.63-27.11-1.83-4.74-8.98-4.29-9.15 1.24-0.25 8.53 2.45 19.03 6.47 26.56 1.09 2.05 4.94 1.83 5.31-0.69z"
                      />
                      <path
                        className="fill-dark"
                        d="m155.87 76.25c-0.17-7.42-1.86-17.18-5.87-23.48-2.59-4.06-8.63-2.33-8.88 2.41-0.39 7.46 2.98 16.77 6.49 23.32 2.07 3.87 8.37 2.09 8.26-2.25z"
                      />
                      <path
                        className="fill-dark"
                        d="m69.9 110.49c-2.8-4.65-8.9-5.51-13.81-6.83-5.97-1.6-11.86-2.8-17.96-1.33-3.79 0.91-3.81 5.75-1.01 7.71 4.9 3.44 10.46 4.3 16.31 5 4.92 0.59 11.26 2.24 15.51-0.95 1.15-0.84 1.77-2.26 0.96-3.6z"
                      />
                      <path
                        className="fill-dark"
                        d="m33.45 135.28c-8.15-0.52-16.37-1.58-24.44-0.08-6.41 1.2-4.57 10.75 1.49 10.98 8.03 0.3 16.11-2.12 23.92-3.8 4.17-0.89 2.92-6.85-0.97-7.1z"
                      />
                      <path
                        className="fill-dark"
                        d="m34.21 221.12c-8.24 1.61-16.84 3.23-24.39 7.05-5.18 2.62-1.4 9.93 3.76 8.91 8.15-1.62 15.99-5.81 23.33-9.56 3.73-1.89 1.01-7.12-2.7-6.4z"
                      />
                      <path
                        className="fill-dark"
                        d="m26.3 285.19c-7.04 2.19-14.06 4.08-20.61 7.52-5.56 2.91-1.73 11.9 4.26 10.11 7.07-2.1 13.42-5.69 19.98-9.02 4.75-2.42 1.45-10.2-3.63-8.61z"
                      />
                      <path
                        className="fill-dark"
                        d="m334.44 278.26c5.12 1.04 10.28 0.66 15.46 0.55 5.07-0.11 10.07 0.09 14.73-2.05 3.9-1.78 2.43-7.51-1.13-8.61-4.72-1.46-9.81-0.37-14.64 0.17-4.83 0.53-9.81 0.75-14.43 2.34-3.39 1.17-4.08 6.78 0.01 7.6z"
                      />
                      <path
                        className="fill-dark"
                        d="m324.69 166.67c8.1-2.25 17.57-5.63 24.26-10.79 3.5-2.7 1.72-8.92-3.21-7.61-8.31 2.21-16.63 7.54-23.46 12.69-2.64 2.01-1.26 6.74 2.41 5.71z"
                      />
                      <path
                        className="fill-dark"
                        d="m308.96 97.65c2.67-2.59 4.86-5.22 7.13-8.19 0.99-1.29 1.95-2.55 2.73-3.97 1.11-2.03 1.38-3.83 1.67-6.08 0.47-3.72-4.54-6.15-7.42-4.26-6.13 4.02-8.89 11.77-11.06 18.46-1.33 4.06 4.08 6.83 6.95 4.04z"
                      />
                      <path
                        className="fill-dark"
                        d="m255.79 103.01c4.15-1.4 6.18-6.01 8.31-9.58 2.77-4.65 4.79-9.2 6.24-14.42 1.23-4.44-4.45-6.11-6.91-2.91-3.15 4.1-5.39 8.18-7.37 12.96-1.57 3.81-4.27 8.3-2.9 12.46 0.35 1.05 1.49 1.87 2.63 1.49z"
                      />
                      <path
                        className="fill-dark"
                        d="m237.22 29.96c1.02-7.08 2.4-15.28 0.51-22.27-1.45-5.37-9.43-5.37-10.88 0-1.89 7-0.51 15.19 0.51 22.27 0.7 4.89 9.16 4.89 9.86 0z"
                      />
                      <path
                        className="fill-dark"
                        d="m176.87 37.88c0.46-8.08 0.72-18.2-1.81-25.96-1.44-4.4-8.12-3.72-8.18 1.11-0.1 8.22 3.14 17.78 6.01 25.39 0.79 2.12 3.84 1.82 3.98-0.54z"
                      />
                      <path
                        className="fill-dark"
                        d="m106.47 60.88c-0.25-8.78-2.31-19.27-6.16-27.17-2.47-5.06-8.95-1.13-8.31 3.5 1.12 8.07 5.45 18.05 9.78 24.94 1.28 2.05 4.76 1.32 4.69-1.27z"
                      />
                      <path
                        className="fill-dark"
                        d="m349.66 212.77c6.02-1.78 12.43-3.1 17.89-6.26 2.49-1.44 1.63-6.21-1.58-5.82-6.32 0.77-12.15 3.42-18.09 5.64-3.95 1.47-2.41 7.67 1.78 6.44z"
                      />
                      <path
                        className="fill-dark"
                        d="m263.24 357.22c3.03 5.01 5.77 10.27 10.26 14.11 2.62 2.25 8.08 0.17 6.5-3.78-1.21-3.04-2.59-5.39-4.57-7.97-1.89-2.46-3.92-4.82-5.91-7.21-2.93-3.52-8.59 1.02-6.28 4.85z"
                      />
                    </svg>
                  </figure> */}
                  {/* Image */}
                  <img src="images/banner/bb1.png" className="rounded" alt="" />
                </div>
                <div className="col-lg-7 mt-4 mt-lg-0">
                  {/* Title */}
                  <h4 className="mb-3">Un outil dédié aux consommateurs.</h4>
                  {/* Content */}
                  <p>
                    En quelques clics, vous pouvez accéder à une multitude
                    d'informations détaillées sur les forfaits disponibles, vous
                    permettant ainsi de comparer les prix, les fonctionnalités
                    incluses, les avantages promotionnels et les conditions
                    générales de chaque offre. C ette comparaison simplifiée
                    vous donne le pouvoir de faire un choix éclairé et de
                    sélectionner l'offre qui correspond le mieux à vos besoins
                    spécifiques
                  </p>
                  <p>
                    L'utilisation d'un comparateur d'offres de services de
                    télécommunications est un processus simple et intuitif. Il
                    vous suffit de commencer par saisir vos besoins et
                    préférences en spécifiant votre localisation, votre type
                    d'utilisation d'internet, votre budget mensuel et les
                    fonctionnalités que vous recherchez. Le comparateur se
                    charge ensuite d'analyser les offres disponibles sur le
                    marché et de vous présenter une liste de résultats
                    pertinents. Ces résultats sont généralement affichés sous
                    forme de grille comparative, facilitant ainsi la comparaison
                    des prix, des fonctionnalités et des conditions générales de
                    chaque offre. Enfin, vous êtes libre d'évaluer les
                    différentes options en fonction de vos priorités et de
                    sélectionner l'offre qui correspond le mieux à vos besoins
                    et à votre budget
                  </p>
                  {/* Info */}
                  <ul className="list-group list-group-borderless mt-4">
                    <li className="list-group-item d-flex">
                      <i className="bi bi-patch-check-fill text-success me-2" />
                      Gain de temps et d'économie
                    </li>
                    <li className="list-group-item d-flex">
                      <i className="bi bi-patch-check-fill text-success me-2" />
                      Accès à une information complète et impartiale
                    </li>
                    <li className="list-group-item d-flex">
                      <i className="bi bi-patch-check-fill text-success me-2" />
                      Simplicité d'utilisation et flexibilité
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </section>
          <section className=" py-4">
            <div className="container py-5">
              {/* Title */}
              <div className="row mb-4">
                <div className="col-sm-10 col-xl-6 text-center mx-auto">
                  <h2>
                    L'ARTCI au service du dévéloppement du marché des
                    numériques{" "}
                  </h2>
                </div>
              </div>
              <div className="py-3 text-center">
                <p>
                  Créée en 2012 sous la forme d'une Autorité Administrative
                  Indépendante dotée de la personnalité juridique et de
                  l'autonomie financière, l'Autorité de Régulation des
                  Télécommunications/TIC de Côte d'Ivoire (ARTCI) incarne la
                  volonté politique du Gouvernement ivoirien de promouvoir une
                  économie numérique dynamique et prospère.
                </p>
                <p>
                  L'ARTCI est chargée des missions juridiques, économiques et
                  techniques permettant de protéger les intérêts des
                  consommateurs tout en garantissant les conditions d'une
                  concurrence saine, loyale et durable du secteur des
                  télécommunications/TIC La direction générale est assurer par
                  Mme Nahoum Traoré
                </p>
                <p>
                  <b>Les missions principales de l'ARTCI sont:</b>
                </p>
              </div>
              {/* Work process */}
              <div className="row g-4 g-md-5">
                {/* Item */}
                <div className="col-md-4 ">
                  <div className="text-center">
                    <i
                      className="fa-solid fa-gavel text-primary"
                      style={{ fontSize: 60 }}
                    ></i>
                    <h4 className="mt-3 text-success">
                      <b>Réguler</b>{" "}
                    </h4>
                  </div>
                  <div className="d-flex justify-content-center">
                    <ul>
                      <li>- Le secteur des télécoms</li>
                      <li>- Le secteur postal</li>
                    </ul>
                  </div>
                  <p className="text-truncate-2 mb-0"></p>
                </div>
                <div className="col-md-4 ">
                  <div className="text-center">
                    <i
                      className="fa-solid fa-shield-halved text-primary"
                      style={{ fontSize: 60 }}
                    ></i>
                    <h4 className="mt-3 text-success">
                      <b>Protéger</b>{" "}
                    </h4>
                  </div>
                  <div className="d-flex justify-content-center">
                    <ul>
                      <li>- Le droit des consommateurs de serves numérique</li>
                      <li>- Les réseaux et systèmes d'innformations</li>
                      <li>
                        - Les donnnées à caractères personnels et la vie privée
                      </li>
                    </ul>
                  </div>
                  <p className="text-truncate-2 mb-0"></p>
                </div>
                <div className="col-md-4 ">
                  <div className="text-center">
                    <i
                      className="fa-solid fa-gears text-primary"
                      style={{ fontSize: 60 }}
                    ></i>
                    <h4 className="mt-3 text-success">
                      <b>Gérer</b>{" "}
                    </h4>
                  </div>
                  <div className="d-flex justify-content-center">
                    <ul>
                      <li>- Le secteur des télécoms</li>
                      <li>- Le secteur postal</li>
                    </ul>
                  </div>
                  <p className="text-truncate-2 mb-0"></p>
                </div>
              </div>{" "}
              {/* Row END */}
            </div>
          </section>

          {/* =======================
About founder END */}
          {/* =======================
Client START */}
          <ClientPartnerPage />
          {/* =======================
Client END */}
          {/* =======================
Award and Team START */}
          {/* =======================
Award and Team END */}
        </>
      }
    />
  );
}
