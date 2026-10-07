import React, { useEffect, useState } from "react";
import DataLoader from "@/componnents/Loader/DataLoader";
import StatsFilterBar from "@/componnents/filter/StatsFilterBar";
import AdminMainContainerPage from "../../AdminMainContainerPage";
import Link from "next/link";
import { handleNumThousand } from "@/services/tools/convertions";
import { useAdmin } from "@/services/providers/AdminProvider";
import {
  formatDateFr,
  formatToYYYYMMDD,
  getDateMonthsBefore,
} from "@/services/tools/helper";
import { MultiSelect } from "primereact/multiselect";
import { BASE_IMG_URL } from "@/services/tools/constants";
import { getOperatorStats } from "@/services/api/opeartor/statistics/statisticsApiServices ";
import { Chart } from "primereact/chart";
import ChartDataLabels from "chartjs-plugin-datalabels";
import { Chart as ChartJS, ArcElement, Tooltip, Legend, Title } from "chart.js";

const styles = `

  .brd-all-black{
    border:2 px solid #000 !important
  }

`;

export default function OperatorDashboard() {
  const documentStyle = getComputedStyle(document.documentElement);

  const { user, operators } = useAdmin();

  const [data, setdata] = useState(null);
  const [date, setDate] = useState(new Date());
  const [stats, setStats] = useState(null);
  const [filter, setFilter] = useState(null);
  const [selectedOperators, setSelectedOperators] = useState(null);
  const [initApp, setInitApp] = useState(false);
  const textColor = documentStyle.getPropertyValue("--text-color");
  const surfaceBorder = documentStyle.getPropertyValue("--surface-border");
  const textColorSecondary = documentStyle.getPropertyValue(
    "--text-color-secondary",
  );

  const options8 = {
    maintainAspectRatio: false,
    aspectRatio: 0.6,
    plugins: {
      legend: {
        labels: {
          color: textColor,
        },
        font: {
          family: "Lato", // Appliquer "Lato" avec poids Black
          weight: 900, // Poids 900 pour "Lato Black"
          size: 14, // Taille de la police de la légende
        },
      },
    },
    scales: {
      x: {
        ticks: {
          color: textColorSecondary,
        },
        grid: {
          color: surfaceBorder,
        },
      },
      y: {
        ticks: {
          color: textColorSecondary,
        },
        grid: {
          color: surfaceBorder,
        },
      },
    },
  };

  useEffect(() => {
    init();
  }, []);

  useEffect(() => {
    if (filter?.category && operators) {
      // setSelectedOperators(null);
      let ops = null;
      if (filter?.category == 1) {
        ops = operators.filter(
          (op) => op.type == "MOBILE" || op.type == "HYBRIDE",
        );
      } else if (filter?.category == 2) {
        ops = operators.filter(
          (op) => op.type == "FIXE" || op.type == "HYBRIDE",
        );
      } else {
        ops = operators;
      }
      setSelectedOperators(ops);
    }
  }, [filter?.category]);

  useEffect(() => {
    if (filter) {
      submitFilterData();
    }
  }, [filter]);

  useEffect(() => {
    if (user && initApp && filter) {
      submitFilterData();
    }
  }, [user && initApp && filter]);

  const init = async () => {
    const _filter = { ...filter };
    const _date = getDateMonthsBefore(date, 60);
    const _d = formatToYYYYMMDD(_date);
    _filter["startDate"] = _d;
    _filter["endDate"] = formatToYYYYMMDD(date);
    _filter["category"] = -1;
    _filter["billingType"] = -1;

    // const _stats = await getOperatorStats(_filter);
    // setStats(_stats);

    setSelectedOperators(operators);
    setFilter(_filter);
    setInitApp(true);
  };

  // Mise à jour fonctionnelle : plusieurs champs peuvent changer d'affilée.
  const onInputChange = (name, value) => {
    setFilter((prev) => ({ ...(prev || {}), [name]: value }));
  };

  const submitFilterData = async () => {
    const _operIds = [];
    const operLabels = [];
    const operColors = [];

    let weekdata = null;

    _operIds.push(user?.focalPoint?.operatorId);
    operLabels.push(user?.focalPoint?.operator?.name);
    operColors.push(user?.focalPoint?.operator?.color);

    if (filter?.startDate && filter?.endDate) {
      const _filter = { ...filter };
      _filter["operatorIds"] = _operIds;

      const _stats = await getOperatorStats(_filter);

      const weekLabels = [];
      const weekBase = [];
      const weekPromo = [];
      const weekMobile = [];
      const weekFixe = [];
      const weekDatasts = [];

      if (_stats?.weekBase) {
        _stats?.weekBase.forEach((e) => {
          weekLabels.push(formatDateFr(e.week));
          weekBase.push(e.count);
        });
        weekDatasts.push({
          type: "bar",
          label: "Offres de bases",
          data: weekBase,
          fill: false,
          backgroundColor: documentStyle.getPropertyValue("--blue-200"),
        });
      }
      if (_stats?.weekPromo) {
        _stats?.weekPromo.forEach((e) => {
          weekPromo.push(e.count);
        });

        weekDatasts.push({
          type: "bar",
          label: "Offres promotionnelles",
          data: weekPromo,
          // fill: true,,
          backgroundColor: documentStyle.getPropertyValue("--red-200"),
        });
      }
      if (_stats?.weekMobile) {
        _stats?.weekMobile.forEach((e) => {
          weekMobile.push(e.count);
        });
      }
      if (_stats?.weekFixe) {
        _stats?.weekFixe.forEach((e) => {
          weekFixe.push(e.count);
        });
      }

      if (filter?.category == -1) {
        weekDatasts.push({
          type: "line",
          label: "Offres Mobiles",
          backgroundColor: "#01717E",
          data: weekMobile,
          borderWidth: 2,
          tension: 0.4,
          borderColor: "#53EAFD",
        });
        weekDatasts.push({
          type: "line",
          label: "Offres Fixes",
          tension: 0.4,
          backgroundColor: "#6730D5",
          data: weekFixe,
          borderColor: "#BA30D5",
          borderWidth: 2,
        });
      } else if (filter?.category == 1) {
        weekDatasts.push({
          type: "line",
          label: "Offres Mobiles",
          backgroundColor: "#01717E",
          data: weekMobile,
          borderWidth: 2,
          tension: 0.4,
          borderColor: "#53EAFD",
        });
      } else if (filter?.category == 2) {
        weekDatasts.push({
          type: "line",
          label: "Offres Fixes",
          tension: 0.4,
          backgroundColor: "#6730D5",
          data: weekFixe,
          borderColor: "#BA30D5",
          borderWidth: 2,
        });
      }

      weekdata = {
        labels: weekLabels,
        datasets: weekDatasts,
      };

      const _data = { ...data };
      _data["weekdata"] = weekdata;

      setStats(_stats ?? {});
      setdata(_data);
    }
  };

// <<<<<<< HEAD
  const getSTasts = async () => {
    const _filter = { ...filter };
    _filter["operatorIds"] = [user?.focalPoint?.operator?.id];
    const _stats = await getOperatorStats(_filter);
    setStats(_stats);
  };
// =======
  // const getSTasts = async () => {
  //   const _filter = { ...filter };
  //   _filter["operatorIds"] = [user?.focalPoint?.operator?.id];
  //   const _stats = await getOperatorStats(_filter);
  //   setStats(_stats);
  // };
// >>>>>>> 8aded37 (saves)

  return (
    <AdminMainContainerPage
      active="dash"
      children={
        <>
          <style>{styles}</style>
          <div className="container-fluid">
            <div className="mb-4">
              <div className="row">
                <div className="col-md-14">
                  <div
                    className="card bg-light border-0 rounded-4"
                    style={{
                      backgroundImage: "url(../images/s2.png)",
                      backgroundRepeat: "no-repeat",
                      backgroundSize: "cover",
                      backgroundPosition: "right",
                      height: 180,
                    }}
                  >
                    <div className="card-body ">
                      <div className="row">
                        <div className="col-md-8">
                          <h1 className="">
                            Tableau de bord !
                            <span
                              className=" text-black"
                              style={{ fontSize: 20 }}
                            ></span>
                          </h1>
                          <p>
                            Comparateur des offres de service de
                            télécommunication
                          </p>
                          <Link
                            href="/operator-create-offer"
                            className="btn btn-success"
                          >
                            Déclarer une nouvelle offre
                          </Link>
                        </div>
                        <div className="col-md-4">
                          <div className="d-flex justify-content-end">
                            <img
                              alt={user?.focalPoint?.operator?.name}
                              src={
                                BASE_IMG_URL +
                                user?.focalPoint?.operator?.imagePath
                              }
                              className={`mr-2 flag flag-${user?.focalPoint?.operator?.code.toLowerCase()}`}
                              style={{ width: "100px" }}
                            />{" "}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div>
              <div className="table-responsive-xl mb-6 mb-lg-0">
                <div>
                  <StatsFilterBar
                    filter={filter}
                    onChange={onInputChange}
                    subtitle="Statistiques de vos offres : combinez période, catégorie et type de client."
                  />
                </div>
              </div>
            </div>
            {/* <div className="bg-secondary " style={{}}>
              <div className="p-1 rounded">
                <div className="">
                  <div className="text-white text-center ">
                    <div className="" style={{ fontSize: 30 }}>
                      <b></b>
                    </div>
                  </div>
                </div>
              </div>
            </div> */}
            {stats == null ? (
              <DataLoader label="Calcul de vos statistiques…" variant="chart" rows={6} />
            ) : (
            <>
            <div className="mb-5">
              <div className="">
                <table className="table table-bordered table-sm text-white  mb-0 rounded">
                  <thead className="border-0">
                    <tr style={{ borderBottom: "2px solid #000" }}>
                      <th
                        style={{
                          border: "0px",
                          borderRight: "2px solid #000",
                          width: "30vw",
                          backgroundColor: "#EEF2F7",
                        }}
                      >
                        <div className="d-flex justify-content-start">
                          <div className="d-flex mt-1">
                            <div className="me-2">
                              <span className="">
                                <small
                                  className="fs-12 "
                                  style={{ color: "#A65F1B" }}
                                >
                                  <b>
                                    <u>Légende :</u>
                                  </b>
                                </small>
                              </span>
                            </div>
                            <div
                              style={{
                                height: 18,
                                // borderRight: "1px solid #ccc",
                              }}
                              className="me-2"
                            />
                            <div className="me-2">
                              <span className="">
                                <i className="bi bi-check-all text-success"></i>{" "}
                                <small className="fs-12">Validée</small>
                              </span>
                            </div>
                            <div
                              style={{
                                height: 18,
                                borderRight: "1px solid #ccc",
                              }}
                              className="me-2"
                            />
                            <div className="me-2">
                              <span>
                                <i className="bi bi-ban text-danger me-2 fs-12"></i>{" "}
                                <small>Refusée</small>
                              </span>
                            </div>
                            <div
                              style={{
                                height: 18,
                                borderRight: "1px solid #ccc",
                              }}
                              className="me-2"
                            />
                            <div className="me-2">
                              <span>
                                <i className="bi bi-exclamation-triangle text-warning fs-12"></i>{" "}
                                <small className="fs-12">En attente</small>
                              </span>
                            </div>
                            <div
                              style={{
                                height: 18,
                                borderRight: "1px solid #ccc",
                              }}
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
                      </th>
                      <th
                        className="text-center"
                        colSpan={5}
                        style={{
                          borderLeft: "2px solid #000",
                          borderTop: "2px solid #000",
                          borderRight: "2px solid #000",
                        }}
                      >
                        TOTAL
                      </th>
                      <th
                        className="text-center"
                        colSpan={5}
                        style={{
                          borderTop: "2px solid #000",
                          borderRight: "2px solid #000",
                        }}
                      >
                        DE BASE
                      </th>
                      <th
                        className="text-center"
                        colSpan={5}
                        style={{
                          borderTop: "2px solid #000",
                          borderRight: "2px solid #000",
                        }}
                      >
                        PROMO
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="brd-all-black">
                      <td
                        rowSpan={2}
                        className="justify-content-center align-content-center "
                        style={{ border: "2px solid #000" }}
                      >
                        <small>
                          <b>Toutes les offres</b>
                        </small>
                      </td>
                      <td
                        rowSpan={2}
                        className="text-center justify-content-center align-content-center fs-14 brd-all-black"
                      >
                        <b>{handleNumThousand(stats?.nbOffers)}</b>
                      </td>
                      <td className="brd-all-black">
                        <small style={{ fontSize: 14 }}>
                          <i className="bi bi-check-all text-success"></i>
                        </small>
                      </td>
                      <td>
                        <small style={{ fontSize: 14 }}>
                          <i className="fa-solid fa-ban text-danger"></i>
                        </small>
                      </td>
                      <td>
                        <small style={{ fontSize: 14 }}>
                          <i className="bi bi-exclamation-triangle text-warning"></i>
                        </small>
                      </td>
                      <td style={{ borderRight: "2px solid #000" }}>
                        <small style={{ fontSize: 14 }}>
                          <i className="fbi bi-exclamation-diamond-fill text-secondary"></i>
                        </small>
                      </td>
                      <td
                        rowSpan={2}
                        className="text-center justify-content-center align-content-center fs-14"
                      >
                        <b>{handleNumThousand(stats?.nbBase)}</b>
                      </td>
                      <td>
                        <small style={{ fontSize: 14 }}>
                          <i className="bi bi-check-all text-success"></i>
                        </small>
                      </td>
                      <td>
                        <small style={{ fontSize: 14 }}>
                          <i className="fa-solid fa-ban text-danger"></i>
                        </small>
                      </td>
                      <td>
                        <small style={{ fontSize: 14 }}>
                          <i className="bi bi-exclamation-triangle text-warning"></i>
                        </small>
                      </td>
                      <td style={{ borderRight: "2px solid #000" }}>
                        <small style={{ fontSize: 14 }}>
                          <i className="fbi bi-exclamation-diamond-fill text-secondary"></i>
                        </small>
                      </td>
                      <td
                        rowSpan={2}
                        className="text-center justify-content-center align-content-center fs-14"
                      >
                        <b>{handleNumThousand(stats?.nbPromo)}</b>
                      </td>
                      <td>
                        <small style={{ fontSize: 14 }}>
                          <i className="bi bi-check-all text-success"></i>
                        </small>
                      </td>
                      <td>
                        <small style={{ fontSize: 14 }}>
                          <i className="fa-solid fa-ban text-danger"></i>
                        </small>
                      </td>
                      <td>
                        <small style={{ fontSize: 14 }}>
                          <i className="bi bi-exclamation-triangle text-warning"></i>
                        </small>
                      </td>
                      <td style={{ borderRight: "2px solid #000" }}>
                        <small style={{ fontSize: 14 }}>
                          <i className="fbi bi-exclamation-diamond-fill text-secondary"></i>
                        </small>
                      </td>
                    </tr>
                    <tr style={{ borderBottom: "2px solid #000" }}>
                      <td className="text-center justify-content-center align-content-center fs-14">
                        <b>{handleNumThousand(stats?.nbValid)}</b>
                      </td>
                      <td>
                        <small style={{ fontSize: 14 }} className="">
                          <b>{handleNumThousand(stats?.nbInvalide)}</b>
                        </small>
                      </td>
                      <td>
                        <small style={{ fontSize: 14 }}>
                          <b>{handleNumThousand(stats?.nbPending)}</b>
                        </small>
                      </td>
                      <td
                        style={{ borderRight: "2px solid #000" }}
                        className="fs-14 text-center"
                      >
                        <small>
                          <b>{handleNumThousand(stats?.nbSuspended)}</b>
                        </small>
                      </td>
                      <td>
                        <small>
                          <b>{handleNumThousand(stats?.nbBaseValid)}</b>
                        </small>
                      </td>
                      <td>
                        <small style={{ fontSize: 14 }} className="fs-14">
                          <b>{handleNumThousand(stats?.nbBaseInvalid)}</b>
                        </small>
                      </td>
                      <td>
                        <small style={{ fontSize: 14 }} className="fs-14">
                          <b>{handleNumThousand(stats?.nbBasePending)}</b>
                        </small>
                      </td>
                      <td style={{ borderRight: "2px solid #000" }}>
                        <small>
                          <b> {handleNumThousand(stats?.nbBaseSuspended)}</b>
                        </small>
                      </td>
                      <td>
                        <small>
                          <b> {handleNumThousand(stats?.nbPromoValid)} </b>
                        </small>
                      </td>
                      <td>
                        <small style={{ fontSize: 14 }} className="fs-14">
                          <b> {handleNumThousand(stats?.nbPromoInvalid)} </b>
                        </small>
                      </td>
                      <td>
                        <small style={{ fontSize: 14 }} className="fs-14">
                          <b>{handleNumThousand(stats?.nbPromoPending)}</b>
                        </small>
                      </td>
                      <td style={{ borderRight: "2px solid #000" }}>
                        <small>
                          <b> {handleNumThousand(stats?.nbPromoSuspended)} </b>
                        </small>
                      </td>
                    </tr>
                    {/* MAAAAAAAAAAMAMAMAMAMAMAMAMM */}
                    <tr className="brd-all-black">
                      <td
                        rowSpan={2}
                        className="justify-content-center align-content-center "
                        style={{ border: "2px solid #000" }}
                      >
                        <small>
                          <b>Nationnales</b>
                        </small>
                      </td>
                      <td
                        rowSpan={2}
                        className="text-center justify-content-center align-content-center fs-14 brd-all-black"
                      >
                        <b>{handleNumThousand(stats?.nbNatOffers)}</b>
                      </td>
                      <td className="brd-all-black">
                        <small style={{ fontSize: 14 }}>
                          <i className="bi bi-check-all text-success"></i>
                        </small>
                      </td>
                      <td>
                        <small style={{ fontSize: 14 }}>
                          <i className="fa-solid fa-ban text-danger"></i>
                        </small>
                      </td>
                      <td>
                        <small style={{ fontSize: 14 }}>
                          <i className="bi bi-exclamation-triangle text-warning"></i>
                        </small>
                      </td>
                      <td style={{ borderRight: "2px solid #000" }}>
                        <small style={{ fontSize: 14 }}>
                          <i className="fbi bi-exclamation-diamond-fill text-secondary"></i>
                        </small>
                      </td>
                      <td
                        rowSpan={2}
                        className="text-center justify-content-center align-content-center fs-14"
                      >
                        <b>{handleNumThousand(stats?.nbNatBase)}</b>
                      </td>
                      <td>
                        <small style={{ fontSize: 14 }}>
                          <i className="bi bi-check-all text-success"></i>
                        </small>
                      </td>
                      <td>
                        <small style={{ fontSize: 14 }}>
                          <i className="fa-solid fa-ban text-danger"></i>
                        </small>
                      </td>
                      <td>
                        <small style={{ fontSize: 14 }}>
                          <i className="bi bi-exclamation-triangle text-warning"></i>
                        </small>
                      </td>
                      <td style={{ borderRight: "2px solid #000" }}>
                        <small style={{ fontSize: 14 }}>
                          <i className="fbi bi-exclamation-diamond-fill text-secondary"></i>
                        </small>
                      </td>
                      <td
                        rowSpan={2}
                        className="text-center justify-content-center align-content-center fs-14"
                      >
                        <b>{handleNumThousand(stats?.nbNatPromo)}</b>
                      </td>
                      <td>
                        <small style={{ fontSize: 14 }}>
                          <i className="bi bi-check-all text-success"></i>
                        </small>
                      </td>
                      <td>
                        <small style={{ fontSize: 14 }}>
                          <i className="fa-solid fa-ban text-danger"></i>
                        </small>
                      </td>
                      <td>
                        <small style={{ fontSize: 14 }}>
                          <i className="bi bi-exclamation-triangle text-warning"></i>
                        </small>
                      </td>
                      <td style={{ borderRight: "2px solid #000" }}>
                        <small style={{ fontSize: 14 }}>
                          <i className="fbi bi-exclamation-diamond-fill text-secondary"></i>
                        </small>
                      </td>
                    </tr>
                    <tr style={{ borderBottom: "2px solid #000" }}>
                      <td className="text-center justify-content-center align-content-center fs-14">
                        <b>{handleNumThousand(stats?.nbNatValid)}</b>
                      </td>
                      <td>
                        <small style={{ fontSize: 14 }}>
                          <b>{handleNumThousand(stats?.nbNatInvalid)}</b>
                        </small>
                      </td>
                      <td>
                        <small style={{ fontSize: 14 }}>
                          <b>{handleNumThousand(stats?.nbNatPending)}</b>
                        </small>
                      </td>
                      <td
                        style={{ borderRight: "2px solid #000" }}
                        className="fs-14"
                      >
                        <small>
                          <b>{handleNumThousand(stats?.nbNatSuspended)}</b>
                        </small>
                      </td>
                      {/* BASE */}
                      <td>
                        <small>
                          <b>{handleNumThousand(stats?.nbNatBaseValid)}</b>
                        </small>
                      </td>
                      <td>
                        <small style={{ fontSize: 14 }} className="fs-14">
                          <b>{handleNumThousand(stats?.nbNatBaseInvalid)}</b>
                        </small>
                      </td>
                      <td>
                        <small style={{ fontSize: 14 }} className="fs-14">
                          <b>{handleNumThousand(stats?.nbNatBasePending)}</b>
                        </small>
                      </td>
                      <td style={{ borderRight: "2px solid #000" }}>
                        <small>
                          <b>{handleNumThousand(stats?.nbNatBaseSuspended)}</b>
                        </small>
                      </td>
                      {/* PROMO */}
                      <td>
                        <small>
                          <b>{handleNumThousand(stats?.nbNatPromoValid)}</b>
                        </small>
                      </td>
                      <td>
                        <small style={{ fontSize: 14 }} className="fs-14">
                          <b>{handleNumThousand(stats?.nbNatPromoInvalid)}</b>
                        </small>
                      </td>
                      <td>
                        <small style={{ fontSize: 14 }} className="fs-14">
                          <b>{handleNumThousand(stats?.nbNatPromoPending)}</b>
                        </small>
                      </td>
                      <td style={{ borderRight: "2px solid #000" }}>
                        <small>
                          <b>{handleNumThousand(stats?.nbNatPromoSuspended)}</b>
                        </small>
                      </td>
                    </tr>
                    {/* MAAAAAAAAAAMAMAMAMAMAMAMAMM */}
                    <tr className="brd-all-black">
                      <td
                        rowSpan={2}
                        className="justify-content-center align-content-center "
                        style={{ border: "2px solid #000" }}
                      >
                        <small>
                          <b>Internationales</b>
                        </small>
                      </td>
                      <td
                        rowSpan={2}
                        className="text-center justify-content-center align-content-center fs-14 brd-all-black"
                      >
                        <b>{handleNumThousand(stats?.nbInterOffers)}</b>
                      </td>
                      <td className="brd-all-black">
                        <small style={{ fontSize: 14 }}>
                          <i className="bi bi-check-all text-success"></i>
                        </small>
                      </td>
                      <td>
                        <small style={{ fontSize: 14 }}>
                          <i className="fa-solid fa-ban text-danger"></i>
                        </small>
                      </td>
                      <td>
                        <small style={{ fontSize: 14 }}>
                          <i className="bi bi-exclamation-triangle text-warning"></i>
                        </small>
                      </td>
                      <td style={{ borderRight: "2px solid #000" }}>
                        <small style={{ fontSize: 14 }}>
                          <i className="fbi bi-exclamation-diamond-fill text-secondary"></i>
                        </small>
                      </td>
                      <td
                        rowSpan={2}
                        className="text-center justify-content-center align-content-center fs-14"
                      >
                        <b>{handleNumThousand(stats?.nbInterBase)}</b>
                      </td>
                      <td>
                        <small style={{ fontSize: 14 }}>
                          <i className="bi bi-check-all text-success"></i>
                        </small>
                      </td>
                      <td>
                        <small style={{ fontSize: 14 }}>
                          <i className="fa-solid fa-ban text-danger"></i>
                        </small>
                      </td>
                      <td>
                        <small style={{ fontSize: 14 }}>
                          <i className="bi bi-exclamation-triangle text-warning"></i>
                        </small>
                      </td>
                      <td style={{ borderRight: "2px solid #000" }}>
                        <small style={{ fontSize: 14 }}>
                          <i className="fbi bi-exclamation-diamond-fill text-secondary"></i>
                        </small>
                      </td>
                      <td
                        rowSpan={2}
                        className="text-center justify-content-center align-content-center fs-14"
                      >
                        <b>{handleNumThousand(stats?.nbInterPromo)}</b>
                      </td>
                      <td>
                        <small style={{ fontSize: 14 }}>
                          <i className="bi bi-check-all text-success"></i>
                        </small>
                      </td>
                      <td>
                        <small style={{ fontSize: 14 }}>
                          <i className="fa-solid fa-ban text-danger"></i>
                        </small>
                      </td>
                      <td>
                        <small style={{ fontSize: 14 }}>
                          <i className="bi bi-exclamation-triangle text-warning"></i>
                        </small>
                      </td>
                      <td style={{ borderRight: "2px solid #000" }}>
                        <small style={{ fontSize: 14 }}>
                          <i className="fbi bi-exclamation-diamond-fill text-secondary"></i>
                        </small>
                      </td>
                    </tr>
                    {/* ALL */}
                    <tr style={{ borderBottom: "2px solid #000" }}>
                      <td className="text-center justify-content-center align-content-center fs-14">
                        <b>{handleNumThousand(stats?.nbInterNatValid)}</b>
                      </td>
                      <td>
                        <small style={{ fontSize: 14 }}>
                          <b>{handleNumThousand(stats?.nbInterNatInvalid)}</b>
                        </small>
                      </td>
                      <td>
                        <small style={{ fontSize: 14 }}>
                          <b>{handleNumThousand(stats?.nbInterNatPending)}</b>
                        </small>
                      </td>
                      <td
                        style={{ borderRight: "2px solid #000" }}
                        className="fs-14"
                      >
                        <small>
                          <b>{handleNumThousand(stats?.nbInterNatSuspended)}</b>
                        </small>
                      </td>
                      {/* BASE */}
                      <td>
                        <small>
                          <b>{handleNumThousand(stats?.nbInterBaseValid)}</b>
                        </small>
                      </td>
                      <td>
                        <small style={{ fontSize: 14 }} className="fs-14">
                          <b>{handleNumThousand(stats?.nbInterBaseInvalid)}</b>
                        </small>
                      </td>
                      <td>
                        <small style={{ fontSize: 14 }} className="fs-14">
                          <b>{handleNumThousand(stats?.nbInterBasePending)}</b>
                        </small>
                      </td>
                      <td style={{ borderRight: "2px solid #000" }}>
                        <small>
                          <b>
                            {handleNumThousand(stats?.nbInterBaseSuspended)}
                          </b>
                        </small>
                      </td>
                      {/* PROMO */}
                      <td>
                        <small>
                          <b>{handleNumThousand(stats?.nbInterPromoValid)}</b>
                        </small>
                      </td>
                      <td>
                        <small style={{ fontSize: 14 }} className="fs-14">
                          <b>{handleNumThousand(stats?.nbInterPromoInvalid)}</b>
                        </small>
                      </td>
                      <td>
                        <small style={{ fontSize: 14 }} className="fs-14">
                          <b>{handleNumThousand(stats?.nbInterPromoPending)}</b>
                        </small>
                      </td>
                      <td style={{ borderRight: "2px solid #000" }}>
                        <small>
                          <b>
                            {handleNumThousand(stats?.nbInterPromoSuspended)}
                          </b>
                        </small>
                      </td>
                    </tr>
                    {/* MAAAAAAAAAAMAMAMAMAMAMAMAMM */}
                    <tr className="brd-all-black">
                      <td
                        rowSpan={2}
                        className="justify-content-center align-content-center "
                        style={{ border: "2px solid #000" }}
                      >
                        <small>
                          <b>Roaming</b>
                        </small>
                      </td>
                      <td
                        rowSpan={2}
                        className="text-center justify-content-center align-content-center fs-14 brd-all-black"
                      >
                        <b>{handleNumThousand(stats?.nbRoamOffers)}</b>
                      </td>
                      <td className="brd-all-black">
                        <small style={{ fontSize: 14 }}>
                          <i className="bi bi-check-all text-success"></i>
                        </small>
                      </td>
                      <td>
                        <small style={{ fontSize: 14 }}>
                          <i className="fa-solid fa-ban text-danger"></i>
                        </small>
                      </td>
                      <td>
                        <small style={{ fontSize: 14 }}>
                          <i className="bi bi-exclamation-triangle text-warning"></i>
                        </small>
                      </td>
                      <td style={{ borderRight: "2px solid #000" }}>
                        <small style={{ fontSize: 14 }}>
                          <i className="fbi bi-exclamation-diamond-fill text-secondary"></i>
                        </small>
                      </td>
                      <td
                        rowSpan={2}
                        className="text-center justify-content-center align-content-center fs-14"
                      >
                        <b>{handleNumThousand(stats?.nbRoamBase)}</b>
                      </td>
                      <td>
                        <small style={{ fontSize: 14 }}>
                          <i className="bi bi-check-all text-success"></i>
                        </small>
                      </td>
                      <td>
                        <small style={{ fontSize: 14 }}>
                          <i className="fa-solid fa-ban text-danger"></i>
                        </small>
                      </td>
                      <td>
                        <small style={{ fontSize: 14 }}>
                          <i className="bi bi-exclamation-triangle text-warning"></i>
                        </small>
                      </td>
                      <td style={{ borderRight: "2px solid #000" }}>
                        <small style={{ fontSize: 14 }}>
                          <i className="fbi bi-exclamation-diamond-fill text-secondary"></i>
                        </small>
                      </td>
                      <td
                        rowSpan={2}
                        className="text-center justify-content-center align-content-center fs-14"
                      >
                        <b>{handleNumThousand(stats?.nbRoamPromo)}</b>
                      </td>
                      <td>
                        <small style={{ fontSize: 14 }}>
                          <i className="bi bi-check-all text-success"></i>
                        </small>
                      </td>
                      <td>
                        <small style={{ fontSize: 14 }}>
                          <i className="fa-solid fa-ban text-danger"></i>
                        </small>
                      </td>
                      <td>
                        <small style={{ fontSize: 14 }}>
                          <i className="bi bi-exclamation-triangle text-warning"></i>
                        </small>
                      </td>
                      <td style={{ borderRight: "2px solid #000" }}>
                        <small style={{ fontSize: 14 }}>
                          <i className="fbi bi-exclamation-diamond-fill text-secondary"></i>
                        </small>
                      </td>
                    </tr>
                    {/* ALL */}
                    <tr style={{ borderBottom: "2px solid #000" }}>
                      <td className="text-center justify-content-center align-content-center fs-14">
                        <b>{handleNumThousand(stats?.nbIRoamValid)}</b>
                      </td>
                      <td>
                        <small style={{ fontSize: 14 }}>
                          <b>{handleNumThousand(stats?.nbRoamInvalid)}</b>
                        </small>
                      </td>
                      <td>
                        <small style={{ fontSize: 14 }}>
                          <b>{handleNumThousand(stats?.nbRoamPending)}</b>
                        </small>
                      </td>
                      <td
                        style={{ borderRight: "2px solid #000" }}
                        className="fs-14"
                      >
                        <small>
                          <b>{handleNumThousand(stats?.nbRoamSuspended)}</b>
                        </small>
                      </td>
                      {/* BASE */}
                      <td>
                        <small>
                          <b>{handleNumThousand(stats?.nbRoamBaseValid)}</b>
                        </small>
                      </td>
                      <td>
                        <small style={{ fontSize: 14 }} className="fs-14">
                          <b>{handleNumThousand(stats?.nbRoamBaseInvalid)}</b>
                        </small>
                      </td>
                      <td>
                        <small style={{ fontSize: 14 }} className="fs-14">
                          <b>{handleNumThousand(stats?.nbRoamBasePending)}</b>
                        </small>
                      </td>
                      <td style={{ borderRight: "2px solid #000" }}>
                        <small>
                          <b>{handleNumThousand(stats?.nbRoamBaseSuspended)}</b>
                        </small>
                      </td>
                      {/* PROMO */}
                      <td>
                        <small>
                          <b>{handleNumThousand(stats?.nbRoamPromoValid)}</b>
                        </small>
                      </td>
                      <td>
                        <small style={{ fontSize: 14 }} className="fs-14">
                          <b>{handleNumThousand(stats?.nbRoamPromoInvalid)}</b>
                        </small>
                      </td>
                      <td>
                        <small style={{ fontSize: 14 }} className="fs-14">
                          <b>{handleNumThousand(stats?.nbRoamPromoPending)}</b>
                        </small>
                      </td>
                      <td style={{ borderRight: "2px solid #000" }}>
                        <small>
                          <b>
                            {handleNumThousand(stats?.nbRoamPromoSuspended)}
                          </b>
                        </small>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            <div className="card bg-white">
              <div className="card-body">
                <div>
                  <Chart type="line" data={data?.weekdata} options={options8} />
                </div>
                <div
                  className="text-center lato-black text-dark"
                  style={{ fontSize: 12 }}
                >
                  <em>Evolution des offres par type et catégories</em>
                </div>
              </div>
            </div>
            </>
            )}
          </div>
        </>
      }
    />
  );
}
