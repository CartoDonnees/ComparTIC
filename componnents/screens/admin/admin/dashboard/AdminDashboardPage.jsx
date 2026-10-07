import React, { useEffect, useState } from "react";
import DataLoader from "@/componnents/Loader/DataLoader";
import AdminMainContainerPage from "../../AdminMainContainerPage";
import AdminDashboardStatistics from "../statistics/AdminDashboardStatistics";
import Link from "next/link";
import { getGenStats } from "@/services/api/admin/statisticsApiServices";
import { handleNumThousand } from "@/services/tools/convertions";
import AdminTrackingPage from "../tacking/AdminTrackingPage";
import AdminCalendarPage from "../calendar/AdminCalendarPage";
import { useAdmin } from "@/services/providers/AdminProvider";

export default function AdminDashboardPage() {
  const { operators } = useAdmin();
  const [stats, setStats] = useState(null);

  const [active, setActive] = useState(1);

  useEffect(() => {
    init();
  }, []);

  useEffect(() => {
  }, [stats]);

  const init = async () => {
    const _stats = await getGenStats();
    // Objet vide en cas d'échec : l'indicateur de chargement ne reste pas affiché.
    setStats(_stats ?? {});
  };

  return (
    <AdminMainContainerPage
      active="dash"
      children={
        <>
          <section className="">
            {/* row */}
            <div className="container-fluid">
              <div className="row mb-4 ">
                <div className="col-md-6">
                  {/* card */}
                  <div
                    className="card bg-light border-0 rounded-4"
                    style={{
                      backgroundImage: "url(../images/s2.png)",
                      backgroundRepeat: "no-repeat",
                      backgroundSize: "cover",
                      backgroundPosition: "right",
                      height: 320,
                    }}
                  >
                    <div className="card-body p-lg-12">
                      <h1 className="">
                        Tableau de bord !
                        <span className=" text-black" style={{ fontSize: 40 }}>
                          Compare<em>TIC</em>
                        </span>
                      </h1>
                      <p>
                        Comparateur des offres de service de télécommunication
                      </p>
                      <Link
                        href="/admin-create-offer"
                        className="btn btn-primary"
                      >
                        Enregistrer une offre
                      </Link>
                    </div>
                  </div>
                </div>
                <div className="col-md-6 justify-content-center align-content-center">
                  <div className="bg-secondary rounded" style={{}}>
                    <div className="p-1 rounded">
                      <div className="">
                        <div className="text-white text-center ">
                          {/* text */}
                          <div className="" style={{ fontSize: 16 }}>
                            <b>STATISTIQUES GENERALES</b>
                          </div>
                        </div>
                      </div>
                      <div className="p-0">
                        {/* col */}
                        <div className="">
                          {stats == null ? (
                            <div className="bg-white rounded-bottom">
                              <DataLoader label="Calcul des statistiques générales…" variant="table" rows={3} compact />
                            </div>
                          ) : (
                          <table className="table table-bordered table-sm text-white table-primary mb-0 rounded">
                            <thead>
                              <tr style={{ borderBottom: "2px solid #000" }}>
                                <th
                                  style={{ borderRight: "2px solid #000" }}
                                ></th>
                                <th
                                  colSpan={5}
                                  className="text-center fs-12 bwd"
                                  style={{ borderRight: "2px solid #000" }}
                                >
                                  TOTAL
                                </th>
                                <th
                                  colSpan={5}
                                  className="text-center fs-12 bwd"
                                  style={{ borderRight: "2px solid #000" }}
                                >
                                  DE BASE
                                </th>
                                <th
                                  colSpan={5}
                                  className="text-center fs-12 bwd"
                                >
                                  PROMO
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr>
                                <td
                                  style={{ borderRight: "2px solid #000" }}
                                  rowSpan={2}
                                  className="justify-content-center align-content-center"
                                >
                                  <small>
                                    <b>Toutes les offres</b>
                                  </small>
                                </td>
                                <td
                                  rowSpan={2}
                                  className="text-center justify-content-center align-content-center fs-12"
                                >
                                  <b>{handleNumThousand(stats?.[0])}</b>
                                </td>
                                <td>
                                  <small style={{ fontSize: 12 }}>
                                    <i className="bi bi-check-all text-success"></i>
                                  </small>
                                </td>
                                <td>
                                  <small style={{ fontSize: 12 }}>
                                    <i className="fa-solid fa-ban text-danger"></i>
                                  </small>
                                </td>
                                <td>
                                  <small style={{ fontSize: 12 }}>
                                    <i className="bi bi-exclamation-triangle text-warning"></i>
                                  </small>
                                </td>
                                <td style={{ borderRight: "2px solid #000" }}>
                                  <small style={{ fontSize: 12 }}>
                                    <i className="fbi bi-exclamation-diamond-fill text-secondary"></i>
                                  </small>
                                </td>
                                <td
                                  rowSpan={2}
                                  className="text-center justify-content-center align-content-center fs-12"
                                >
                                  <b>{handleNumThousand(stats?.[5])}</b>
                                </td>
                                <td>
                                  <small style={{ fontSize: 12 }}>
                                    <i className="bi bi-check-all text-success"></i>
                                  </small>
                                </td>
                                <td>
                                  <small style={{ fontSize: 12 }}>
                                    <i className="fa-solid fa-ban text-danger"></i>
                                  </small>
                                </td>
                                <td>
                                  <small style={{ fontSize: 12 }}>
                                    <i className="bi bi-exclamation-triangle text-warning"></i>
                                  </small>
                                </td>
                                <td style={{ borderRight: "2px solid #000" }}>
                                  <small style={{ fontSize: 12 }}>
                                    <i className="fbi bi-exclamation-diamond-fill text-secondary"></i>
                                  </small>
                                </td>
                                <td
                                  rowSpan={2}
                                  className="text-center justify-content-center align-content-center fs-12"
                                >
                                  <b>{handleNumThousand(stats?.[10])}</b>
                                </td>
                                <td>
                                  <small style={{ fontSize: 12 }}>
                                    <i className="bi bi-check-all text-success"></i>
                                  </small>
                                </td>
                                <td>
                                  <small style={{ fontSize: 12 }}>
                                    <i className="fa-solid fa-ban text-danger"></i>
                                  </small>
                                </td>
                                <td>
                                  <small style={{ fontSize: 12 }}>
                                    <i className="bi bi-exclamation-triangle text-warning"></i>
                                  </small>
                                </td>
                                <td>
                                  <small style={{ fontSize: 12 }}>
                                    <i className="fbi bi-exclamation-diamond-fill text-secondary"></i>
                                  </small>
                                </td>
                              </tr>
                              <tr style={{ borderBottom: "2px solid #000" }}>
                                <td className="fs-12">
                                  {" "}
                                  {handleNumThousand(stats?.[1])}{" "}
                                </td>
                                <td className="fs-12">
                                  {handleNumThousand(stats?.[2])}{" "}
                                </td>
                                <td className="fs-12">
                                  {handleNumThousand(stats?.[3])}{" "}
                                </td>
                                <td
                                  className="fs-12"
                                  style={{ borderRight: "2px solid #000" }}
                                >
                                  {handleNumThousand(stats?.[4])}{" "}
                                </td>

                                <td className="fs-12">
                                  {handleNumThousand(stats?.[6])}{" "}
                                </td>
                                <td className="fs-12">
                                  {handleNumThousand(stats?.[7])}{" "}
                                </td>
                                <td className="fs-12">
                                  {handleNumThousand(stats?.[8])}{" "}
                                </td>
                                <td
                                  className="fs-12"
                                  style={{ borderRight: "2px solid #000" }}
                                >
                                  {handleNumThousand(stats?.[9])}{" "}
                                </td>

                                <td className="fs-12">
                                  {handleNumThousand(stats?.[11])}{" "}
                                </td>
                                <td className="fs-12">
                                  {handleNumThousand(stats?.[12])}{" "}
                                </td>
                                <td className="fs-12">
                                  {handleNumThousand(stats?.[13])}{" "}
                                </td>
                                <td className="fs-12">
                                  {handleNumThousand(stats?.[14])}{" "}
                                </td>
                              </tr>
                              <tr>
                                <td
                                  style={{ borderRight: "2px solid #000" }}
                                  rowSpan={2}
                                  className="justify-content-center align-content-center"
                                >
                                  <small>
                                    <b>Nationnales</b>
                                  </small>
                                </td>
                                <td
                                  rowSpan={2}
                                  className="text-center justify-content-center align-content-center fs-12"
                                >
                                  <b>{handleNumThousand(stats?.[15])}</b>
                                </td>
                                <td>
                                  <small style={{ fontSize: 12 }}>
                                    <i className="bi bi-check-all text-success"></i>
                                  </small>
                                </td>
                                <td>
                                  <small style={{ fontSize: 12 }}>
                                    <i className="fa-solid fa-ban text-danger"></i>
                                  </small>
                                </td>
                                <td>
                                  <small style={{ fontSize: 12 }}>
                                    <i className="bi bi-exclamation-triangle text-warning"></i>
                                  </small>
                                </td>
                                <td style={{ borderRight: "2px solid #000" }}>
                                  <small style={{ fontSize: 12 }}>
                                    <i className="fbi bi-exclamation-diamond-fill text-secondary"></i>
                                  </small>
                                </td>
                                <td
                                  rowSpan={2}
                                  className="text-center justify-content-center align-content-center fs-12"
                                >
                                  <b>{handleNumThousand(stats?.[20])}</b>
                                </td>
                                <td>
                                  <small style={{ fontSize: 12 }}>
                                    <i className="bi bi-check-all text-success"></i>
                                  </small>
                                </td>
                                <td>
                                  <small style={{ fontSize: 12 }}>
                                    <i className="fa-solid fa-ban text-danger"></i>
                                  </small>
                                </td>
                                <td>
                                  <small style={{ fontSize: 12 }}>
                                    <i className="bi bi-exclamation-triangle text-warning"></i>
                                  </small>
                                </td>
                                <td style={{ borderRight: "2px solid #000" }}>
                                  <small style={{ fontSize: 12 }}>
                                    <i className="fbi bi-exclamation-diamond-fill text-secondary"></i>
                                  </small>
                                </td>
                                <td
                                  rowSpan={2}
                                  className="text-center justify-content-center align-content-center fs-12"
                                >
                                  <b>{handleNumThousand(stats?.[25])}</b>
                                </td>
                                <td>
                                  <small style={{ fontSize: 12 }}>
                                    <i className="bi bi-check-all text-success"></i>
                                  </small>
                                </td>
                                <td>
                                  <small style={{ fontSize: 12 }}>
                                    <i className="fa-solid fa-ban text-danger"></i>
                                  </small>
                                </td>
                                <td>
                                  <small style={{ fontSize: 12 }}>
                                    <i className="bi bi-exclamation-triangle text-warning"></i>
                                  </small>
                                </td>
                                <td>
                                  <small style={{ fontSize: 12 }}>
                                    <i className="fbi bi-exclamation-diamond-fill text-secondary"></i>
                                  </small>
                                </td>
                              </tr>
                              <tr style={{ borderBottom: "2px solid #000" }}>
                                <td className="fs-12">
                                  {handleNumThousand(stats?.[16])}{" "}
                                </td>
                                <td className="fs-12">
                                  {handleNumThousand(stats?.[17])}{" "}
                                </td>
                                <td className="fs-12">
                                  {handleNumThousand(stats?.[18])}{" "}
                                </td>
                                <td
                                  className="fs-12"
                                  style={{ borderRight: "2px solid #000" }}
                                >
                                  {handleNumThousand(stats?.[19])}{" "}
                                </td>

                                <td className="fs-12">
                                  {handleNumThousand(stats?.[21])}{" "}
                                </td>
                                <td className="fs-12">
                                  {handleNumThousand(stats?.[22])}{" "}
                                </td>
                                <td className="fs-12">
                                  {handleNumThousand(stats?.[23])}{" "}
                                </td>
                                <td
                                  className="fs-12"
                                  style={{ borderRight: "2px solid #000" }}
                                >
                                  {handleNumThousand(stats?.[24])}{" "}
                                </td>

                                <td className="fs-12">
                                  {handleNumThousand(stats?.[26])}{" "}
                                </td>
                                <td className="fs-12">
                                  {handleNumThousand(stats?.[27])}{" "}
                                </td>
                                <td className="fs-12">
                                  {handleNumThousand(stats?.[28])}{" "}
                                </td>
                                <td className="fs-12">
                                  {handleNumThousand(stats?.[29])}{" "}
                                </td>
                              </tr>
                              <tr>
                                <td
                                  style={{ borderRight: "2px solid #000" }}
                                  rowSpan={2}
                                  className="justify-content-center align-content-center"
                                >
                                  <small>
                                    <b>Internationales</b>
                                  </small>
                                </td>
                                <td
                                  rowSpan={2}
                                  className="text-center justify-content-center align-content-center fs-12"
                                >
                                  <b>{handleNumThousand(stats?.[30])}</b>
                                </td>
                                <td>
                                  <small style={{ fontSize: 12 }}>
                                    <i className="bi bi-check-all text-success"></i>
                                  </small>
                                </td>
                                <td>
                                  <small style={{ fontSize: 12 }}>
                                    <i className="fa-solid fa-ban text-danger"></i>
                                  </small>
                                </td>
                                <td>
                                  <small style={{ fontSize: 12 }}>
                                    <i className="bi bi-exclamation-triangle text-warning"></i>
                                  </small>
                                </td>
                                <td style={{ borderRight: "2px solid #000" }}>
                                  <small style={{ fontSize: 12 }}>
                                    <i className="fbi bi-exclamation-diamond-fill text-secondary"></i>
                                  </small>
                                </td>
                                <td
                                  rowSpan={2}
                                  className="text-center justify-content-center align-content-center fs-12"
                                >
                                  <b>{handleNumThousand(stats?.[35])}</b>
                                </td>
                                <td>
                                  <small style={{ fontSize: 12 }}>
                                    <i className="bi bi-check-all text-success"></i>
                                  </small>
                                </td>
                                <td>
                                  <small style={{ fontSize: 12 }}>
                                    <i className="fa-solid fa-ban text-danger"></i>
                                  </small>
                                </td>
                                <td>
                                  <small style={{ fontSize: 12 }}>
                                    <i className="bi bi-exclamation-triangle text-warning"></i>
                                  </small>
                                </td>
                                <td style={{ borderRight: "2px solid #000" }}>
                                  <small style={{ fontSize: 12 }}>
                                    <i className="fbi bi-exclamation-diamond-fill text-secondary"></i>
                                  </small>
                                </td>
                                <td
                                  rowSpan={2}
                                  className="text-center justify-content-center align-content-center fs-12"
                                >
                                  <b>{handleNumThousand(stats?.[40])}</b>
                                </td>
                                <td>
                                  <small style={{ fontSize: 12 }}>
                                    <i className="bi bi-check-all text-success"></i>
                                  </small>
                                </td>
                                <td>
                                  <small style={{ fontSize: 12 }}>
                                    <i className="fa-solid fa-ban text-danger"></i>
                                  </small>
                                </td>
                                <td>
                                  <small style={{ fontSize: 12 }}>
                                    <i className="bi bi-exclamation-triangle text-warning"></i>
                                  </small>
                                </td>
                                <td>
                                  <small style={{ fontSize: 12 }}>
                                    <i className="fbi bi-exclamation-diamond-fill text-secondary"></i>
                                  </small>
                                </td>
                              </tr>
                              <tr style={{ borderBottom: "2px solid #000" }}>
                                <td className="fs-12">
                                  {handleNumThousand(stats?.[31])}{" "}
                                </td>
                                <td className="fs-12">
                                  {handleNumThousand(stats?.[22])}{" "}
                                </td>
                                <td className="fs-12">
                                  {handleNumThousand(stats?.[33])}{" "}
                                </td>
                                <td
                                  className="fs-12"
                                  style={{ borderRight: "2px solid #000" }}
                                >
                                  {handleNumThousand(stats?.[34])}{" "}
                                </td>

                                <td className="fs-12">
                                  {handleNumThousand(stats?.[36])}{" "}
                                </td>
                                <td className="fs-12">
                                  {handleNumThousand(stats?.[37])}{" "}
                                </td>
                                <td className="fs-12">
                                  {handleNumThousand(stats?.[38])}{" "}
                                </td>
                                <td
                                  className="fs-12"
                                  style={{ borderRight: "2px solid #000" }}
                                >
                                  {handleNumThousand(stats?.[39])}{" "}
                                </td>

                                <td className="fs-12">
                                  {handleNumThousand(stats?.[41])}{" "}
                                </td>
                                <td className="fs-12">
                                  {handleNumThousand(stats?.[42])}{" "}
                                </td>
                                <td className="fs-12">
                                  {handleNumThousand(stats?.[43])}{" "}
                                </td>
                                <td className="fs-12">
                                  {handleNumThousand(stats?.[44])}{" "}
                                </td>
                              </tr>
                              <tr>
                                <td
                                  style={{ borderRight: "2px solid #000" }}
                                  rowSpan={2}
                                  className="justify-content-center align-content-center"
                                >
                                  <small>
                                    <b>Roaming</b>
                                  </small>
                                </td>
                                <td
                                  rowSpan={2}
                                  className="text-center justify-content-center align-content-center fs-12"
                                >
                                  <b>{handleNumThousand(stats?.[45])}</b>
                                </td>
                                <td>
                                  <small style={{ fontSize: 12 }}>
                                    <i className="bi bi-check-all text-success"></i>
                                  </small>
                                </td>
                                <td>
                                  <small style={{ fontSize: 12 }}>
                                    <i className="fa-solid fa-ban text-danger"></i>
                                  </small>
                                </td>
                                <td>
                                  <small style={{ fontSize: 12 }}>
                                    <i className="bi bi-exclamation-triangle text-warning"></i>
                                  </small>
                                </td>
                                <td style={{ borderRight: "2px solid #000" }}>
                                  <small style={{ fontSize: 12 }}>
                                    <i className="fbi bi-exclamation-diamond-fill text-secondary"></i>
                                  </small>
                                </td>
                                <td
                                  rowSpan={2}
                                  className="text-center justify-content-center align-content-center fs-12"
                                >
                                  {handleNumThousand(stats?.[50])}
                                </td>
                                <td>
                                  <small style={{ fontSize: 12 }}>
                                    <i className="bi bi-check-all text-success"></i>
                                  </small>
                                </td>
                                <td>
                                  <small style={{ fontSize: 12 }}>
                                    <i className="fa-solid fa-ban text-danger"></i>
                                  </small>
                                </td>
                                <td>
                                  <small style={{ fontSize: 12 }}>
                                    <i className="bi bi-exclamation-triangle text-warning"></i>
                                  </small>
                                </td>
                                <td style={{ borderRight: "2px solid #000" }}>
                                  {" "}
                                  <small style={{ fontSize: 12 }}>
                                    <i className="fbi bi-exclamation-diamond-fill text-secondary"></i>
                                  </small>
                                </td>
                                <td
                                  rowSpan={2}
                                  className="text-center justify-content-center align-content-center fs-12"
                                >
                                  {handleNumThousand(stats?.[55])}
                                </td>
                                <td>
                                  <small style={{ fontSize: 12 }}>
                                    <i className="bi bi-check-all text-success"></i>
                                  </small>
                                </td>
                                <td>
                                  <small style={{ fontSize: 12 }}>
                                    <i className="fa-solid fa-ban text-danger"></i>
                                  </small>
                                </td>
                                <td>
                                  <small style={{ fontSize: 12 }}>
                                    <i className="bi bi-exclamation-triangle text-warning"></i>
                                  </small>
                                </td>
                                <td>
                                  <small style={{ fontSize: 12 }}>
                                    <i className="fbi bi-exclamation-diamond-fill text-secondary"></i>
                                  </small>
                                </td>
                              </tr>
                              <tr>
                                <td className="fs-12">
                                  {handleNumThousand(stats?.[46])}{" "}
                                </td>
                                <td className="fs-12">
                                  {handleNumThousand(stats?.[47])}{" "}
                                </td>
                                <td className="fs-12">
                                  {handleNumThousand(stats?.[48])}{" "}
                                </td>
                                <td
                                  className="fs-12"
                                  style={{ borderRight: "2px solid #000" }}
                                >
                                  {handleNumThousand(stats?.[49])}{" "}
                                </td>

                                <td className="fs-12">
                                  {handleNumThousand(stats?.[51])}{" "}
                                </td>
                                <td className="fs-12">
                                  {handleNumThousand(stats?.[52])}{" "}
                                </td>
                                <td className="fs-12">
                                  {handleNumThousand(stats?.[53])}{" "}
                                </td>
                                <td
                                  className="fs-12"
                                  style={{ borderRight: "2px solid #000" }}
                                >
                                  {handleNumThousand(stats?.[54])}{" "}
                                </td>

                                <td className="fs-12">
                                  {handleNumThousand(stats?.[56])}{" "}
                                </td>
                                <td className="fs-12">
                                  {handleNumThousand(stats?.[57])}{" "}
                                </td>
                                <td className="fs-12">
                                  {handleNumThousand(stats?.[58])}{" "}
                                </td>
                                <td className="fs-12">
                                  {handleNumThousand(stats?.[59])}{" "}
                                </td>
                              </tr>
                            </tbody>
                          </table>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="d-flex justify-content-end">
                    <div className="d-flex mt-1">
                      <div className="me-2">
                        <span className="">
                          <i className="bi bi-check-all text-success"></i>{" "}
                          <small className="fs-12">Validée</small>
                        </span>
                      </div>
                      <div
                        style={{ height: 18, borderRight: "1px solid #ccc" }}
                        className="me-2"
                      />
                      <div className="me-2">
                        <span>
                          <i className="bi bi-ban text-danger me-2 fs-12"></i>{" "}
                          <small>Refusée</small>
                        </span>
                      </div>
                      <div
                        style={{ height: 18, borderRight: "1px solid #ccc" }}
                        className="me-2"
                      />
                      <div className="me-2">
                        <span>
                          <i className="bi bi-exclamation-triangle text-warning fs-12"></i>{" "}
                          <small className="fs-12">En attente</small>
                        </span>
                      </div>
                      <div
                        style={{ height: 18, borderRight: "1px solid #ccc" }}
                        className="me-2"
                      />
                      <div className="me-2">
                        <span>
                          <i className="fbi bi-exclamation-diamond-fill fs-12"></i>{" "}
                          <small className="fs-12">Suspendue</small>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <hr />
              <hr />
            </div>
            <div className="m-0 p-0">
              <>
                {/* javascript behaviour */}
                <ul
                  className="nav nav-tabs w-100 bg-light  "
                  id="myTab"
                  role="tablist"
                >
                  <li className="nav-item" style={{ width: "33%" }}>
                    <a
                      className="nav-link active"
                      id="main-tab"
                      data-bs-toggle="tab"
                      href="#main"
                      role="tab"
                      aria-controls="main"
                      aria-selected="true"
                      style={{
                        fontSize: 20,
                      }}
                      onClick={() => setActive(1)}
                    >
                      <b>GENERALITES</b>
                    </a>
                  </li>
                  <li className="nav-item" style={{ width: "33%" }}>
                    <a
                      className="nav-link"
                      id="monitoring-tab"
                      data-bs-toggle="tab"
                      href="#monitoring"
                      role="tab"
                      aria-controls="monitoring"
                      aria-selected="false"
                      style={{
                        fontSize: 20,
                        // borderTop:0,
                        // borderLeft:1,
                        // borderRight:1,
                        // borderColor:'black'
                        // border:'0px 0px 0px 0px solid black',
                        // border:'0.2px solid red',
                      }}
                      onClick={() => setActive(2)}
                    >
                      SUIVI
                    </a>
                  </li>
                  <li className="nav-item" style={{ width: "33%" }}>
                    <a
                      className="nav-link"
                      id="monitoring-tab"
                      data-bs-toggle="tab"
                      href="#monitoring"
                      role="tab"
                      aria-controls="monitoring"
                      aria-selected="false"
                      style={{
                        fontSize: 20,
                      }}
                      onClick={() => setActive(3)}
                    >
                      CALENDRIER
                    </a>
                  </li>
                </ul>
                {active == 1 && (
                  <>
                    <div className="container-fluid pt-4">
                      <AdminDashboardStatistics gStats={stats} operators={operators} />
                    </div>
                  </>
                )}
                {active == 2 && (
                  <>
                    <div className="container-fluid pt-4">
                      <AdminTrackingPage />
                      {/* <AdminMonitoringStatistics /> */}
                    </div>
                  </>
                )}
                {active == 3 && (
                  <>
                    <div className="container-fluid pt-4">
                      <AdminCalendarPage />
                    </div>
                  </>
                )}
              </>
            </div>
            {/* row */}

            {/* row */}
            {/* <div className="row">
              <div className="col-md-9"></div>
              <div className="col-md-3">
                <div>
                  <div
                    className="pt-8 px-6 px-xl-8 rounded"
                    style={{
                      background: "url(images/banner/b1.jpg) no-repeat",
                      backgroundSize: "cover",
                      height: "100",
                    }}
                  >
                    <div>
                      <h3 className="fw-bold text-white">
                        100% Organic Coffee Beans.
                      </h3>
                      <p className="text-white">
                        Get the best deal before close.
                      </p>
                      <a href="#!" className="btn btn-primary">
                        Shop Now
                        <i className="feather-icon icon-arrow-right ms-1" />
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div> */}
          </section>
        </>
      }
    />
  );
}
