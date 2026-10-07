import { getClientGenStats } from "@/services/api/client/statisticsApiServices";
import React, { useEffect, useState } from "react";

export default function ClientCountBanner() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    const _stats = await getClientGenStats();
    setStats(_stats);
  };

  return (
    <>
      <section className="py-0 py-3 mb-3 trans-fb">
        <div
          className="container"
          style={{ paddingTop: 20, paddingBottom: 20 }}
        >
          <h1 className="text-success text-center s-cltitle">Chiffres clés </h1>
          <div className="row g-4">
            {/* Counter item */}
            <div className="col-sm-6 col-xl-3">
              <div className="d-flex justify-content-center align-items-center p-4 bg-info bg-opacity-10 rounded">
                <span className="display-6 text-info lh-1 mb-0">
                  <i className="fa fa-star" />
                </span>
                <div className="ms-4 h6 fw-normal mb-0">
                  <div className="d-flex">
                    <h5 className="purecounter mb-0 fw-bold"> </h5>
                    <span className="mb-0 h5"> {stats?.[0]}</span>
                  </div>
                  <p className="mb-0">Total des offres </p>
                </div>
              </div>
            </div>
            {/* Counter item */}
            <div className="col-sm-6 col-xl-3">
              <div className="d-flex justify-content-center align-items-center p-4  bg-warning1 rounded">
                <span className="display-6 lh-1 text-warning mb-0"><i class="bi bi-stars" aria-hidden="true"></i>
                </span>
                <div className="ms-4 h6 fw-normal mb-0">
                  <div className="d-flex">
                    <h5
                      className="purecounter mb-0 fw-bold"
                      data-purecounter-start={0}
                      data-purecounter-end={6}
                      data-purecounter-delay={300}
                      data-purecounter-duration={0}
                    >
                      {stats?.[2]}
                    </h5>
                    <span className="mb-0 h5"></span>
                  </div>
                  <p className="mb-0">Offres en promotion</p>
                </div>
              </div>
            </div>
            {/* Counter item */}
            <div className="col-sm-6 col-xl-3">
              <div className="d-flex justify-content-center align-items-center p-4 bg-blue1 bg-opacity-10 rounded ">
                <span className="display-6 lh-1 text-blue mb-0">
                  <i className="fas fa-mobile" />
                </span>
                <div className="ms-4 h6 fw-normal mb-0">
                  <div className="d-flex">
                    <h5
                      className="purecounter mb-0 fw-bold"
                      data-purecounter-start={0}
                      data-purecounter-end={200}
                      data-purecounter-delay={200}
                      data-purecounter-duration={0}
                    >
                      {stats?.[7]}
                    </h5>
                  </div>
                  <p className="mb-0">Offres mobiles</p>
                </div>
              </div>
            </div>
            {/* Counter item */}
            <div className="col-sm-6 col-xl-3">
              <div className="d-flex justify-content-center align-items-center p-4 bg-purple1 rounded">
                <span className="display-6 lh-1 text-purple mb-0">
                  <i className="fas fa-phone" />
                </span>
                <div className="ms-4 h6 fw-normal mb-0">
                  <div className="d-flex">
                    <h5
                      className="purecounter mb-0 fw-bold"
                      data-purecounter-start={0}
                      data-purecounter-end={60}
                      data-purecounter-delay={200}
                      data-purecounter-duration={0}
                    >
                      {stats?.[8]}
                    </h5>
                    <span className="mb-0 h5"></span>
                  </div>
                  <p className="mb-0">Offres fixes</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
