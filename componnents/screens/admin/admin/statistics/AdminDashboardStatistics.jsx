"use client";

import { getMain1Stats } from "@/services/api/admin/statistics/statisticsApiServices ";
import DataLoader from "@/componnents/Loader/DataLoader";
import { useAdmin } from "@/services/providers/AdminProvider";
import {
  BASE_IMG_URL, imageUrl,
  chartSumDataOptionLight,
  SingleDoughnutOption,
} from "@/services/tools/constants";
import { handleNumThousand } from "@/services/tools/convertions";
import {
  formatDateFr,
  formatToYYYYMMDD,
  getDateMonthsBefore,
} from "@/services/tools/helper";
import { Chart } from "primereact/chart";
import { MultiSelect } from "primereact/multiselect";
import StatsFilterBar from "@/componnents/filter/StatsFilterBar";
import { getModernStats } from "@/services/api/admin/statisticsModernApiServices";
import {
  OfferKindSplit,
  OfferTrendPanel,
  OperatorDetailTable,
  GranularitySwitch,
  defaultGranularity,
} from "@/componnents/stats/OfferStatsSections";
import React, { useEffect, useMemo, useState } from "react";
import ChartDataLabels from "chartjs-plugin-datalabels";
import { Chart as ChartJS, ArcElement, Tooltip, Legend, Title } from "chart.js";

export default function AdminDashboardStatistics({ gStats }) {
  const { operators } = useAdmin();

  const [filter, setFilter] = useState(null);
  const [date, setDate] = useState(new Date());

  const [stats, setStats] = useState(null);

  const [data, setdata] = useState(null);
  // Chargement des statistiques (premier affichage et changement de filtre).
  const [mainLoading, setMainLoading] = useState(false);

  const [selectedOperators, setSelectedOperators] = useState(null);
  const [operatorsToShow, setOperatorsToShow] = useState(null);

  // Sections détaillées (proportion base / promo, évolution mensuelle, détail
  // par opérateur) : même agrégation que la page /admin-statistics, pilotée
  // par LES MÊMES filtres que le reste de cet écran   période sur la date de
  // notification, catégorie, facturation et opérateurs sélectionnés.
  const [detailStats, setDetailStats] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const mainColors = {
    "base": "#b105fb",
    "promo": "#ff0303",
    "decided": "#000000",
    "mobile": "#53EAFD",
    "fixe": "#F4A8FF",
    
  }



  const operatorKey = (
    Array.isArray(selectedOperators) ? selectedOperators : []
  )
    .map((o) => o?.id)
    .filter(Boolean)
    .join(",");

  useEffect(() => {
    if (!filter?.startDate || !filter?.endDate || !operatorKey) {
      setDetailStats(null);
      return undefined;
    }
    let cancelled = false;
    // Nombre de mois couverts par la période (courbe mensuelle complète).
    const start = new Date(filter.startDate);
    const end = new Date(filter.endDate);
    const months =
      Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())
        ? 12
        : Math.min(
            Math.max(
              (end.getFullYear() - start.getFullYear()) * 12 +
                end.getMonth() -
                start.getMonth() +
                1,
              1,
            ),
            120,
          );
    setDetailLoading(true);
    getModernStats({
      operatorIds: operatorKey.split(",").map(Number),
      from: filter.startDate,
      to: filter.endDate,
      category:
        Number(filter.category) === -1 ? undefined : Number(filter.category),
      billingType:
        Number(filter.billingType) === -1
          ? undefined
          : Number(filter.billingType),
      months,
      dateField: "notifiDate",
    })
      .then((data) => {
        if (!cancelled) setDetailStats(data);
      })
      .finally(() => {
        if (!cancelled) setDetailLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [
    filter?.startDate,
    filter?.endDate,
    filter?.category,
    filter?.billingType,
    operatorKey,
  ]);

  // Graphique historique « Évolution des offres par type et catégories » :
  // le serveur fournit des comptes par semaine ; ils sont additionnés par mois
  // ou par année (semaine rattachée à la période de son lundi).
  const [legacyGranularity, setLegacyGranularity] = useState(null);
  const legacyUnit =
    legacyGranularity || defaultGranularity(filter?.startDate, filter?.endDate);
  const legacyTrend = useMemo(() => {
    const raw = data?.weekRaw;
    if (!raw?.weeks?.length) return data?.weekdata || null;
    const MONTHS = [
      "janv.",
      "févr.",
      "mars",
      "avr.",
      "mai",
      "juin",
      "juil.",
      "août",
      "sept.",
      "oct.",
      "nov.",
      "déc.",
    ];
    const groups = new Map();
    raw.weeks.forEach((week, i) => {
      const d = new Date(week);
      let key;
      let label;
      if (legacyUnit === "year") {
        key = String(d.getFullYear());
        label = key;
      } else if (legacyUnit === "month") {
        key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        label = `${MONTHS[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`;
      } else {
        key = `w${i}`;
        label = formatDateFr(week);
      }
      const g = groups.get(key) || {
        label,
        base: 0,
        promo: 0,
        mobile: 0,
        fixe: 0,
      };
      g.base += Number(raw.base?.[i]) || 0;
      g.promo += Number(raw.promo?.[i]) || 0;
      g.mobile += Number(raw.mobile?.[i]) || 0;
      g.fixe += Number(raw.fixe?.[i]) || 0;
      groups.set(key, g);
    });
    const rows = [...groups.values()];
    const cat = Number(filter?.category);
    // Couleurs lues ici : `documentStyle` est déclaré plus bas dans le composant.
    const css =
      typeof document !== "undefined"
        ? getComputedStyle(document.documentElement)
        : null;
    const color = (name, fallback) =>
      (css?.getPropertyValue(name) || "").trim() || fallback;
    const datasets = [
      {
        type: "bar",
        label: "Offres de bases",
        data: rows.map((r) => r.base),
        backgroundColor: color("--blue-200", "#bfdbfe"),
      },
      {
        type: "bar",
        label: "Offres promotionnelles",
        data: rows.map((r) => r.promo),
        backgroundColor: color("--red-200", "#fecaca"),
      },
    ];
    if (cat === -1 || cat === 1) {
      datasets.push({
        type: "line",
        label: "Offres Mobiles",
        backgroundColor: "#01717E",
        data: rows.map((r) => r.mobile),
        borderWidth: 2,
        tension: 0.4,
        borderColor: "#53EAFD",
      });
    }
    if (cat === -1 || cat === 2) {
      datasets.push({
        type: "line",
        label: "Offres Fixes",
        backgroundColor: "#6730D5",
        data: rows.map((r) => r.fixe),
        borderWidth: 2,
        tension: 0.4,
        borderColor: "#BA30D5",
      });
    }
    return { labels: rows.map((r) => r.label), datasets };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.weekRaw, data?.weekdata, legacyUnit, filter?.category]);

  const documentStyle = getComputedStyle(document.documentElement);
  const textColor = documentStyle.getPropertyValue("--text-color");
  const surfaceBorder = documentStyle.getPropertyValue("--surface-border");
  const textColorSecondary = documentStyle.getPropertyValue(
    "--text-color-secondary",
  );

  const options = {
    plugins: {
      legend: {
        labels: {
          boxWidth: 10,
          fontSize: 6,
          color: "black",
          font: {
            family: "Lato", // Appliquer "Lato" avec poids Black
            weight: 900, // Poids 900 pour "Lato Black"
            size: 10, // Taille de la police de la légende
          },
        },
        position: "top",
        color: "black",
        font: {
          family: "Lato", // Appliquer "Lato" avec poids Black
          weight: 900, // Poids 900 pour "Lato Black"
          size: 14, // Taille de la police de la légende
        },
      },
      datalabels: {
        display: true,
        color: "#FFFFFF",
        fontSize: 10,
        font: {
          family: "Lato", // Appliquer "Lato" avec poids Black
          weight: 900, // Poids 900 pour "Lato Black"
          size: 12, // Taille de la police de la légende
          fontWeight: "bold",
        },
        anchor: "end", // Position du label sur la barre (vous pouvez ajuster selon vos préférences)
        align: "start",
        rotation: 90,
      },
    },
    scales: {
      r: {
        grid: {
          display: true,
        },
      },
    },
  };

  const options3 = {
    maintainAspectRatio: false,
    aspectRatio: 0.6,
    plugins: {
      legend: {
        labels: {
          boxWidth: 10,
          fontSize: 6,
          color: "black",
          font: {
            family: "Lato", // Appliquer "Lato" avec poids Black
            weight: 900, // Poids 900 pour "Lato Black"
            size: 10, // Taille de la police de la légende
          },
        },
        position: "top",
        color: "black",
        font: {
          family: "Lato", // Appliquer "Lato" avec poids Black
          weight: 900, // Poids 900 pour "Lato Black"
          size: 14, // Taille de la police de la légende
        },
      },
      datalabels: {
        display: true,
        color: "#FFFFFF",
        fontSize: 10,
        font: {
          family: "Lato", // Appliquer "Lato" avec poids Black
          weight: 900, // Poids 900 pour "Lato Black"
          size: 12, // Taille de la police de la légende
          fontWeight: "bold",
        },
        anchor: "end", // Position du label sur la barre (vous pouvez ajuster selon vos préférences)
        align: "start",
        rotation: 90,
        formatter: (value) => {
          return value === 0 ? null : value;
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
          display: false,
        },
      },
    },
  };

  const options5 = {
    indexAxis: "y",
    maintainAspectRatio: false,
    aspectRatio: 0.8,
    plugins: {
      tooltips: {
        mode: "index",
        intersect: false,
      },
      legend: {
        labels: {
          color: textColor,
          family: "Lato",
        },
        font: {
          family: "Lato", // Appliquer "Lato" avec poids Black
          weight: 900, // Poids 900 pour "Lato Black"
          size: 14, // Taille de la police de la légende
        },
      },
      datalabels: {
        display: true,
        color: "#FFFFFF",
        fontSize: 10,
        font: {
          // family: "Lato", // Appliquer "Lato" avec poids Black
          weight: 900, // Poids 900 pour "Lato Black"
          size: 12, // Taille de la police de la légende
          fontWeight: "bold",
        },
        anchor: "end", // Position du label sur la barre (vous pouvez ajuster selon vos préférences)
        align: "start",
        formatter: (value) => {
          return value === 0 ? null : value;
        },
        // rotation: 90,
      },
    },
    scales: {
      x: {
        stacked: true,
        ticks: {
          color: textColorSecondary,
        },
        grid: {
          color: surfaceBorder,
          display: false,
        },
      },
      y: {
        stacked: true,
        ticks: {
          color: textColorSecondary,
        },
        grid: {
          color: surfaceBorder,
          display: false,
        },
      },
    },
  };

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
    setTimeout(() => {
      init();
    }, 500);
  }, []);

  useEffect(() => {
    if (filter) {
      submitFilterData();
    }
  }, [filter]);

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
    if (selectedOperators) {
      submitFilterData();
    }
  }, [selectedOperators]);

  const init = async () => {
    const _filter = { ...filter };
    const _date = getDateMonthsBefore(date, 60);
    const _d = formatToYYYYMMDD(_date);
    _filter["startDate"] = _d;
    _filter["endDate"] = formatToYYYYMMDD(date);
    _filter["category"] = -1;
    _filter["billingType"] = -1;

    setSelectedOperators(operators);
    setFilter(_filter);
    submitFilterData();
  };

  // Mise à jour fonctionnelle : la barre de filtres peut modifier plusieurs
  // champs d'affilée (période rapide, réinitialisation) sans en perdre.
  const onInputChange = (name, value) => {
    setFilter((prev) => ({ ...(prev || {}), [name]: value }));
  };

  const submitFilterData = async () => {
    const _operIds = [];
    const operLabels = [];
    const operColors = [];

    let weekdata = null;

    if (selectedOperators?.length > 0) {
      selectedOperators.forEach((oper) => {
        _operIds.push(oper?.id);
        operLabels.push(oper?.name);
        operColors.push(oper?.color);
      });

      const _filter = { ...filter };
      _filter["operatorIds"] = _operIds;

      setMainLoading(true);
      try {
      const _stats = await getMain1Stats(_filter);
      console.log("=========STATS=====>", _stats)

      const _dataOpers = [];
      const _datasetsTypeOper = [];
      const _datasetsAreaOper = [];
      const _operBase = [];
      const _operPromo = [];
      const _operMobile = [];
      const _operFixe = [];

      selectedOperators.forEach((oper) => {
        _dataOpers.push(_stats?.operOffers?.["nb" + oper.name]);
        _datasetsTypeOper.push({
          type: "bar",
          label: oper?.name,
          backgroundColor: oper?.color,
          data: [
            _stats?.operOffers?.["nbBase" + oper.name],
            _stats?.operOffers?.["nbPromo" + oper.name],
          ],
          borderColor: "white",
          borderWidth: 2,
        });
        _datasetsAreaOper.push({
          type: "bar",
          label: oper?.name,
          backgroundColor: oper?.color,
          data: [
            _stats?.operOffers?.["nbNat" + oper.name],
            _stats?.operOffers?.["nbInt" + oper.name],
            _stats?.operOffers?.["nbRoam" + oper.name],
          ],
          borderColor: "white",
          borderWidth: 2,
        });
        _operBase.push(_stats?.operOffers?.["nbBase" + oper.name]);
        _operPromo.push(_stats?.operOffers?.["nbPromo" + oper.name]);
        _operMobile.push(_stats?.operOffers?.["nbMobile" + oper.name]);
        _operFixe.push(_stats?.operOffers?.["nbFixe" + oper.name]);
      });

      const dataByStatus = {
        datasets: [
          {
            data: [
              _stats?.nbValid,
              _stats?.nbInvalide,
              _stats?.nbPending,
              _stats?.nbSuspended,
            ],
            backgroundColor: ["#158F4A", "#DC3645", "#FFC104", "#889298"],
            label: "offres",
          },
        ],
        labels: ["Validée", "Réfusée", "En attente", "Suspendue"],
      };


      const dataByCateg = {
        datasets: [
          {
            data: [
              _stats?._nbMobile,
              _stats?._nbFixe,
            ],
            backgroundColor: [
              mainColors?.mobile,
              mainColors?.fixe,
            ],
            hoverBackgroundColor: [
              documentStyle.getPropertyValue("--cyan-400"),
              documentStyle.getPropertyValue("--pink-400"),
            ],
            label: "offres",
          },
        ],
        labels: ["Mobile", "Fixe"],
      };

      const dataByArea = {
        datasets: [
          {
            data: [
              _stats?.nbNatOffers,
              _stats?.nbInterOffers,
              _stats?.nbRoamOffers,
            ],
            backgroundColor: [
              documentStyle.getPropertyValue("--green-500"),
              documentStyle.getPropertyValue("--pink-500"),
              documentStyle.getPropertyValue("--purple-500"),
            ],
            hoverBackgroundColor: [
              documentStyle.getPropertyValue("--green-400"),
              documentStyle.getPropertyValue("--pink-400"),
              documentStyle.getPropertyValue("--purple-400"),
            ],
            label: "offres",
          },
        ],
        labels: ["Nationnale", "Internationale", "Roaming"],
      };

      const dataDistribution = {
        labels: ["Offre de base", "Offre en promotions"],
        datasets: [
          {
            data: [_stats?.nbBase, _stats?.nbPromo],
            backgroundColor: [
              mainColors["base"] || documentStyle.getPropertyValue("--blue-500"),
              mainColors["promo"] || documentStyle.getPropertyValue("--red-500"),
            ],
            hoverBackgroundColor: [
              mainColors["base"] || documentStyle.getPropertyValue("--red-400"),
              mainColors["promo"] || documentStyle.getPropertyValue("--blue-400")
            ],
            label: "offres",
          },
        ],
      };

      const dataOpers = {
        labels: operLabels,
        datasets: [
          {
            data: _dataOpers,
            backgroundColor: operColors,
            // hoverBackgroundColor: [
            //   documentStyle.getPropertyValue("--blue-400"),
            //   documentStyle.getPropertyValue("--yellow-400"),
            //   documentStyle.getPropertyValue("--green-400"),
            // ],
            label: "offres",
          },
        ],
      };

      const dataTypeOffer = {
        labels: ["Offres de bases", "Offres promotionnelles"],
        datasets: _datasetsTypeOper,
      };

      const datasetsAreaOper = {
        labels: ["Zone nationale", "Zone internationale", "Zone roaming"],
        datasets: _datasetsAreaOper,
      };

      const dataOperType = {
        labels: operLabels,
        datasets: [
          {
            type: "bar",
            label: "Offre de base",
            backgroundColor: mainColors["base"] || documentStyle.getPropertyValue("--blue-500"),
            data: _operBase,
          },
          {
            type: "bar",
            label: "Offre promotionnelles",
            backgroundColor: mainColors["promo"] || documentStyle.getPropertyValue("--red-500"),
            data: _operPromo,
          },
        ],
      };

      const dataOperCateg = {
        labels: operLabels,
        datasets: [
          {
            type: "bar",
            label: "Mobile",
            backgroundColor: mainColors["mobile"] || documentStyle.getPropertyValue("--blue-500"),
            data: _operMobile,
          },
          {
            type: "bar",
            label: "Fixe",
            backgroundColor: mainColors["fixe"] || documentStyle.getPropertyValue("--red-500"),
            data: _operFixe,
          },
        ],
      };

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
          backgroundColor: mainColors["mobile"] || documentStyle.getPropertyValue("--blue-500"),
          data: weekMobile,
          borderWidth: 2,
          tension: 0.4,
          borderColor: "#53EAFD",
        });
        weekDatasts.push({
          type: "line",
          label: "Offres Fixes",
          tension: 0.4,
          backgroundColor: mainColors["fixe"] || documentStyle.getPropertyValue("--red-500"),
          data: weekFixe,
          borderColor: "#BA30D5",
          borderWidth: 2,
        });
      } else if (filter?.category == 1) {
        weekDatasts.push({
          type: "line",
          label: "Offres Mobiles",
          backgroundColor: mainColors["mobile"] || documentStyle.getPropertyValue("--blue-500"),
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
          backgroundColor: mainColors["fixe"] || documentStyle.getPropertyValue("--red-500"),
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
      _data["dataByStatus"] = dataByStatus;
      _data["dataByCateg"] = dataByCateg;
      _data["dataByArea"] = dataByArea;
      _data["dataDistribution"] = dataDistribution;
      _data["dataOpers"] = dataOpers;
      _data["dataTypeOffer"] = dataTypeOffer;
      _data["datasetsAreaOper"] = datasetsAreaOper;
      _data["dataOperType"] = dataOperType;
      _data["dataOperCateg"] = dataOperCateg;
      _data["weekdata"] = weekdata;
      // Séries hebdomadaires brutes : regroupées par mois ou par année à
      // l'affichage, selon la maille choisie.
      _data["weekRaw"] = {
        weeks: (_stats?.weekBase || []).map((e) => e.week),
        base: weekBase,
        promo: weekPromo,
        mobile: weekMobile,
        fixe: weekFixe,
      };

      setStats(_stats);
      setdata(_data);
      } catch (error) {
        console.error("Statistiques du tableau de bord :", error?.message);
        // Écran rendu malgré l'échec : pas d'indicateur de chargement sans fin.
        setdata((prev) => prev || {});
      } finally {
        setMainLoading(false);
      }
    } else {
      setStats(null);
      setdata(null);
      setMainLoading(false);
    }
  };

  const operatorTemplate = (option) => {
    return (
      <div className="d-flex align-items-center ">
        <img
          alt={option.name}
          src={imageUrl(option?.imagePath)}
          className={`mr-2 flag flag-${option.code.toLowerCase()}`}
          style={{ width: "20px" }}
        />{" "}
        <div className="text-dark">{option.name}</div>
      </div>
    );
  };

  const panelFooterTemplate = () => {
    const l = selectedOperators ? selectedOperators.length : 0;

    return (
      <div className="py-2 px-3 bg-light text-dark">
        <small>
          <b>{l}</b> opérateur(s){l > 1 ? "s" : ""} sélectionné(s).
        </small>
      </div>
    );
  };

  return (
    <div>
      <div className=" mb-3 mt-1 lcard-bx bg-white">
        <div
          style={{
            padding: "10px 10px",
          }}
        >
          <h1
            style={{
              margin: 0,
              fontSize: 20,
              fontWeight: 700,
              color: "#0f172a",
              letterSpacing: "-0.03em",
            }}
            className=""
          >
            Statistiques génerales détaillées sur les offres de
            télécommunications
          </h1>
          <p style={{ margin: "2px 0 0", fontSize: 13, color: "#94a3b8" }}>
            Dynamisez l'affichages des statistiques en combinant les filtres
          </p>
        </div>
      </div>
      <StatsFilterBar
        filter={filter}
        onChange={onInputChange}
        operators={operators}
        selectedOperators={selectedOperators}
        onOperatorsChange={setSelectedOperators}
        subtitle="Combinez période, catégorie, type de client et opérateurs : les statistiques se mettent à jour automatiquement."
      />
      <div className="my-4">
        <hr className="m-0 mb-2" />
        <hr className="m-0" />
      </div>

      {selectedOperators?.length > 0 && !data ? (
        <DataLoader label="Calcul des statistiques…" hint="Les chiffres et graphiques s'affichent dès que le calcul est terminé." variant="chart" rows={6} />
      ) : selectedOperators?.length > 0 ? (
        <div className={mainLoading ? "dld-refresh" : ""} aria-busy={mainLoading}>
          {mainLoading && (
            <div className="dld-refresh-badge" role="status">
              <span className="dld-spinner" aria-hidden="true"></span> Mise à jour des statistiques…
            </div>
          )}
          <div className="table-responsive-xl mb-6 mb-lg-0">
            <div className="row">
              <div className="col-lg-3 col-12 mb-6">
                {/* card */}
                <div className=" h-100 card-lg lcard-bx bg-white">
                  {/* card body */}
                  <div className="card-body p-2">
                    {/* heading */}
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <h4 className="mb-0 fs-14 textBold">Offres validées</h4>
                      </div>
                      <div className="icon-shape icon-md bg-success text-dark-info rounded-circle text-white p-1 fs-12">
                        <i className="bi bi-check-all"></i>
                        {/* <i className="fa-solid fa-ban fs-5"></i> */}
                      </div>
                    </div>
                    {/* project number */}
                    <div className="lh-1">
                      <h1 className="mb-2 fw-bold fs-2"> {stats?.nbValid} </h1>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-lg-3 col-12 mb-6">
                {/* card */}
                <div className="lcard-bx h-100 card-lg bg-white">
                  {/* card body */}
                  <div className="card-body p-2">
                    {/* heading */}
                    <div className="d-flex justify-content-between align-items-center ">
                      <div>
                        <h4 className="mb-0 fs-14 textBold">Offres refusées</h4>
                      </div>
                      <div className="icon-shape icon-md bg-danger text-dark-info rounded-circle text-white">
                        <i className="fa-solid fa-ban fs-5"></i>
                      </div>
                    </div>
                    {/* project number */}
                    <div className="lh-1">
                      <h1 className="mb-2 fw-bold fs-2">{stats?.nbInvalide}</h1>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-lg-3 col-12 mb-6">
                {/* card */}
                <div className="lcard-bx h-100 card-lg bg-white">
                  {/* card body */}
                  <div className="card-body p-2">
                    {/* heading */}
                    <div className="d-flex justify-content-between align-items-center ">
                      <div>
                        <h4 className="mb-0 fs-14 textBold">
                          Offres en attente
                        </h4>
                      </div>
                      <div className="icon-shape icon-md bg-warning text-dark-info rounded-circle">
                        <i className="bi bi-exclamation-triangle fs-5"></i>
                      </div>
                    </div>
                    {/* project number */}
                    <div className="lh-1">
                      <h1 className="mb-2 fw-bold fs-2">{stats?.nbPending}</h1>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-lg-3 col-12 mb-6">
                {/* card */}
                <div className="lcard-bx h-100 card-lg bg-white">
                  {/* card body */}
                  <div className="card-body p-2">
                    {/* heading */}
                    <div className="d-flex justify-content-between align-items-center ">
                      <div>
                        <h4 className="mb-0 fs-14 textBold">
                          Offres suspendues
                        </h4>
                      </div>
                      <div className="icon-shape icon-md bg-secondary text-dark-info rounded-circle">
                        <i className="fbi bi-exclamation-diamond-fill"></i>
                      </div>
                    </div>
                    {/* project number */}
                    <div className="lh-1">
                      <h1 className="mb-2 fw-bold fs-2">
                        {stats?.nbSuspended}
                      </h1>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="row pb-3 pb-lg-0 mb-2">
              <div className="col-md-3">
                <div className="lcard-bx p-2 bg-white">
                  <div className="d-flex justify-content-between ">
                    <img src="images/all.png" alt="" style={{ height: 70 }} />
                    <div>
                      <div className="textBold">Toutes les offres</div>
                      <div className="d-flex justify-content-end">
                        <div className="lh-1">
                          <h1 className="mb-2 fw-bold fs-2">
                            {stats?.nbOffers}{" "}
                          </h1>
                        </div>
                      </div>
                    </div>
                  </div>
                  <table className="table table-sm table-bordered mb-0 mt-1">
                    <thead>
                      <tr>
                        <th></th>
                        <th>
                          <span style={{ fontSize: 12 }}>
                            <img
                              src="images/base.png"
                              alt=""
                              style={{ height: 20 }}
                              className="me-2"
                            />
                            <em>
                              <span className="text-dark me-1">
                                {stats?.nbBase}{" "}
                              </span>{" "}
                              De bases
                            </em>
                          </span>
                        </th>
                        <th>
                          <span style={{ fontSize: 12 }}>
                            <img
                              src="images/promo.png"
                              alt=""
                              style={{ height: 15 }}
                              className="me-2"
                            />
                            <em>
                              <span className="text-dark me-1">
                                {stats?.nbPromo}
                              </span>{" "}
                              Promo
                            </em>
                          </span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {/*  */}
                      <tr>
                        <td>
                          <i className="bi bi-exclamation-triangle text-warning"></i>
                        </td>
                        <td className="fs-12 text-center">
                          {handleNumThousand(stats?.nbBasePending)}
                        </td>
                        <td className="fs-12 text-center">
                          {handleNumThousand(stats?.nbPromoPending)}
                        </td>
                      </tr>

                      {/* VALID */}
                      <tr>
                        <td>
                          <i className="bi bi-check-all text-success"></i>
                        </td>
                        <td className="fs-12 text-center">
                          {handleNumThousand(stats?.nbBaseValid)}
                        </td>
                        <td className="fs-12 text-center">
                          {handleNumThousand(stats?.nbPromoValid)}
                        </td>
                      </tr>

                      {/* INVALID */}
                      <tr>
                        <td>
                          <i className="bi bi-ban text-danger me-2"></i>
                        </td>
                        <td className="fs-12 text-center">
                          {handleNumThousand(stats?.nbBaseInvalid)}
                        </td>
                        <td className="fs-12 text-center">
                          {handleNumThousand(stats?.nbPromoInvalid)}
                        </td>
                      </tr>

                      {/* SUSPEND */}
                      <tr>
                        <td>
                          <i className="fbi bi-exclamation-diamond-fill"></i>
                        </td>
                        <td className="fs-12 text-center">
                          {handleNumThousand(stats?.nbBaseSuspended)}
                        </td>
                        <td className="fs-12 text-center">
                          {handleNumThousand(stats?.nbPromoSuspended)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
              {/* NATIONAL */}
              <div className="col-md-3">
                <div className="lcard-bx p-2 bg-white">
                  <div className="d-flex justify-content-between">
                    <img
                      src="images/national1.png"
                      alt=""
                      style={{ height: 70 }}
                    />
                    <div>
                      <div className="textBold">Offres nationales</div>
                      <div className="d-flex justify-content-end">
                        <div className="lh-1">
                          <h1 className="mb-2 fw-bold fs-2">
                            {stats?.nbNatOffers}
                          </h1>
                        </div>
                      </div>
                    </div>
                  </div>
                  <table className="table table-sm table-bordered mb-0 mt-1">
                    <thead>
                      <tr>
                        <th></th>
                        <th>
                          <span style={{ fontSize: 12 }}>
                            <img
                              src="images/base.png"
                              alt=""
                              style={{ height: 20 }}
                              className="me-2"
                            />
                            <span className="text-dark me-1">
                              {" "}
                              {stats?.nbNatBase}{" "}
                            </span>{" "}
                            De bases
                          </span>
                        </th>
                        <th>
                          <span style={{ fontSize: 12 }}>
                            <img
                              src="images/promo.png"
                              alt=""
                              style={{ height: 15 }}
                              className="me-2"
                            />
                            <span className="text-dark me-1">
                              {stats?.nbNatPromo}
                            </span>{" "}
                            Promo
                          </span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {/*  */}
                      <tr>
                        <td>
                          <i className="bi bi-exclamation-triangle text-warning"></i>
                          {/* <i className="bi bi-hourglass-split text-warning"></i> */}
                        </td>
                        <td className="fs-12 text-center">
                          {handleNumThousand(stats?.nbNatBasePending)}
                        </td>
                        <td className="fs-12 text-center">
                          {handleNumThousand(stats?.nbNatPromoPending)}
                        </td>
                      </tr>

                      {/* VALID */}
                      <tr>
                        <td>
                          <i className="bi bi-check-all text-success"></i>
                        </td>
                        <td className="fs-12 text-center">
                          {handleNumThousand(stats?.nbNatBaseValid)}
                        </td>
                        <td className="fs-12 text-center">
                          {handleNumThousand(stats?.nbNatPromoValid)}
                        </td>
                      </tr>

                      {/* INVALID */}
                      <tr>
                        <td>
                          <i className="bi bi-ban text-danger me-2"></i>
                        </td>
                        <td className="fs-12 text-center">
                          {handleNumThousand(stats?.nbNatBaseInvalid)}
                        </td>
                        <td className="fs-12 text-center">
                          {handleNumThousand(stats?.nbNatPromoInvalid)}
                        </td>
                      </tr>

                      {/* SUSPEND */}
                      <tr>
                        <td>
                          <i className="fbi bi-exclamation-diamond-fill"></i>
                        </td>
                        <td className="fs-12 text-center">
                          {handleNumThousand(stats?.nbNatBaseSuspended)}
                        </td>
                        <td className="fs-12 text-center">
                          {handleNumThousand(stats?.nbNatPromoSuspended)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
              {/* INTERNATIONAL */}
              <div className="col-md-3">
                <div className="lcard-bx p-2 bg-white">
                  <div className="d-flex justify-content-between">
                    <img src="images/word1.png" alt="" style={{ height: 70 }} />
                    <div>
                      <div className="textBold">Offres internationales</div>
                      <div className="d-flex justify-content-end">
                        <div className="lh-1">
                          <h1 className="mb-2 fw-bold fs-2">
                            {stats?.nbInterOffers}
                          </h1>
                        </div>
                      </div>
                    </div>
                  </div>
                  <table className="table table-sm table-bordered mb-0 mt-1">
                    <thead>
                      <tr>
                        <th></th>
                        <th>
                          <span style={{ fontSize: 12 }}>
                            <img
                              src="images/base.png"
                              alt=""
                              style={{ height: 20 }}
                              className="me-2"
                            />
                            <span className="text-dark me-1">
                              {stats?.nbInterBase}
                            </span>{" "}
                            De bases
                          </span>
                        </th>
                        <th>
                          <span style={{ fontSize: 12 }}>
                            <img
                              src="images/promo.png"
                              alt=""
                              style={{ height: 15 }}
                              className="me-2"
                            />
                            <span className="text-dark me-1">
                              {stats?.nbInterPromo}
                            </span>{" "}
                            Promo
                          </span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {/*  */}
                      <tr>
                        <td>
                          <i className="bi bi-exclamation-triangle text-warning"></i>
                        </td>
                        <td className="fs-12 text-center">
                          {handleNumThousand(stats?.nbInterBasePending)}
                        </td>
                        <td className="fs-12 text-center">
                          {handleNumThousand(stats?.nbInterPromoPending)}
                        </td>
                      </tr>

                      {/* VALID */}
                      <tr>
                        <td>
                          <i className="bi bi-check-all text-success"></i>
                        </td>
                        <td className="fs-12 text-center">
                          {handleNumThousand(stats?.nbInterBaseValid)}
                        </td>
                        <td className="fs-12 text-center">
                          {handleNumThousand(stats?.nbInterPromoValid)}
                        </td>
                      </tr>

                      {/* INVALID */}
                      <tr>
                        <td>
                          <i className="bi bi-ban text-danger me-2"></i>
                        </td>
                        <td className="fs-12 text-center">
                          {handleNumThousand(stats?.nbInterBaseInvalid)}
                        </td>
                        <td className="fs-12 text-center">
                          {handleNumThousand(stats?.nbInterPromoInvalid)}
                        </td>
                      </tr>

                      {/* SUSPEND */}
                      <tr>
                        <td>
                          <i className="fbi bi-exclamation-diamond-fill"></i>
                        </td>
                        <td className="fs-12 text-center">
                          {handleNumThousand(stats?.nbInterBaseSuspended)}
                        </td>
                        <td className="fs-12 text-center">
                          {handleNumThousand(stats?.nbInterPromoSuspended)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
              {/* ROAMING */}
              <div className="col-md-3">
                <div className="lcard-bx p-2 bg-white">
                  <div className="d-flex justify-content-between">
                    <img
                      src="images/roaming.png"
                      alt=""
                      style={{ height: 70, width: 100 }}
                    />
                    <div>
                      <div className="textBold">Offres Roamings</div>
                      <div className="d-flex justify-content-end">
                        <div className="lh-1">
                          <h1 className="mb-2 fw-bold fs-2">
                            {stats?.nbRoamOffers}
                          </h1>
                        </div>
                      </div>
                    </div>
                  </div>
                  <table className="table table-sm table-bordered mb-0 mt-1">
                    <thead>
                      <tr>
                        <th></th>
                        <th>
                          <span style={{ fontSize: 12 }}>
                            <img
                              src="images/base.png"
                              alt=""
                              style={{ height: 20 }}
                              className="me-2"
                            />
                            <span className="text-dark me-1">
                              {stats?.nbRoamBase}{" "}
                            </span>{" "}
                            De bases
                          </span>
                        </th>
                        <th>
                          <span style={{ fontSize: 12 }}>
                            <img
                              src="images/promo.png"
                              alt=""
                              style={{ height: 15 }}
                              className="me-2"
                            />
                            <span className="text-dark me-1">
                              {stats?.nbRoamPromo}
                            </span>{" "}
                            Promo
                          </span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {/*  */}
                      <tr>
                        <td>
                          <i className="bi bi-exclamation-triangle text-warning"></i>
                        </td>
                        <td className="fs-12 text-center">
                          {handleNumThousand(stats?.nbRoamBasePending)}
                        </td>
                        <td className="fs-12 text-center">
                          {handleNumThousand(stats?.nbRoamPromoPending)}
                        </td>
                      </tr>

                      {/* VALID */}
                      <tr>
                        <td>
                          <i className="bi bi-check-all text-success"></i>
                        </td>
                        <td className="fs-12 text-center">
                          {handleNumThousand(stats?.nbRoamBaseValid)}
                        </td>
                        <td className="fs-12 text-center">
                          {handleNumThousand(stats?.nbRoamPromoValid)}
                        </td>
                      </tr>

                      {/* INVALID */}
                      <tr>
                        <td>
                          <i className="bi bi-ban text-danger me-2"></i>
                        </td>
                        <td className="fs-12 text-center">
                          {handleNumThousand(stats?.nbRoamBaseInvalid)}
                        </td>
                        <td className="fs-12 text-center">
                          {handleNumThousand(stats?.nbRoamPromoInvalid)}
                        </td>
                      </tr>

                      {/* SUSPEND */}
                      <tr>
                        <td>
                          <i className="fbi bi-exclamation-diamond-fill"></i>
                        </td>
                        <td className="fs-12 text-center">
                          {handleNumThousand(stats?.nbRoamBaseSuspended)}
                        </td>
                        <td className="fs-12 text-center">
                          {handleNumThousand(stats?.nbRoamPromoSuspended)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            {/*  */}
          </div>
          <hr />
          <div className="card bg-white">
            <div className="card-body">
              <div className="row">
                {/* <div className="col-md-3 d-flex justify-content-center">
                  <div className="">
                    <Chart
                      type="polarArea"
                      data={data?.dataByStatus}
                      options={options}
                      plugins={[ChartDataLabels]}
                      height={200}
                    />
                    <div
                      className="text-center lato-black text-dark"
                      style={{ fontSize: 12 }}
                    >
                      <em>Statut des offres</em>
                    </div>
                  </div>
                </div> */}

                    {/* <Chart
                type="doughnut"
                data={data}
                options={SingleDoughnutOption}
                height={180}
              /> */}

                <div className="col-md-3 d-flex justify-content-center">
                  <div>
                    <Chart
                      type="doughnut"
                      data={data?.dataByCateg}
                      options={chartSumDataOptionLight}
                      plugins={[ChartDataLabels]}
                      height={200}
                    />
                    <div
                      className="text-center lato-black text-dark"
                      style={{ fontSize: 12 }}
                    >
                      <em>Répartition par catégories </em>
                    </div>
                  </div>
                </div>
                <div className="col-md-3 d-flex justify-content-center">
                  <div>
                    <Chart
                      type="doughnut"
                      data={data?.dataByArea}
                      options={chartSumDataOptionLight}
                      plugins={[ChartDataLabels]}
                      height={200}
                    />
                    <div
                      className="text-center lato-black text-dark"
                      style={{ fontSize: 12 }}
                    >
                      <em>Répartition par zones </em>
                    </div>
                  </div>
                </div>
                <div className="col-md-3 d-flex justify-content-center">
                  <div>
                    <Chart
                      type="doughnut"
                      data={data?.dataDistribution}
                      options={chartSumDataOptionLight}
                      plugins={[ChartDataLabels]}
                      height={200}
                    />
                    {/* <div
                style={{
                  position: "absolute",
                  marginTop: "-70px",
                  left: "28%",
                  transform: "translate(-50%, -50%)",
                  fontSize: "25px",
                  fontWeight: "bold",
                  color: "black",
                }}
                className="lato-black"
              >
                90 %
              </div> */}
                    <div
                      className="text-center lato-black text-dark"
                      style={{ fontSize: 12 }}
                    >
                      <em>Répartition par type d'offre </em>
                    </div>
                  </div>
                </div>
                <div className="col-md-3 d-flex justify-content-center">
                  <div>
                    <Chart
                      type="doughnut"
                      data={data?.dataOpers}
                      options={chartSumDataOptionLight}
                      plugins={[ChartDataLabels]}
                      height={200}
                    />
                    {/* <div
                style={{
                  position: "absolute",
                  marginTop: "-70px",
                  left: "28%",
                  transform: "translate(-50%, -50%)",
                  fontSize: "25px",
                  fontWeight: "bold",
                  color: "black",
                }}
                className="lato-black"
              >
                90 %
              </div> */}
                    <div
                      className="text-center lato-black text-dark"
                      style={{ fontSize: 12 }}
                    >
                      <em>Répartition des offres par opérateurs </em>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <hr />
          <div className="card bg-white">
            <div className="card-body">
              <div className="row">
                <div className="col-md-6">
                  <div>
                    <Chart
                      type="line"
                      data={data?.dataTypeOffer}
                      options={options3}
                      plugins={[ChartDataLabels]}
                    />
                  </div>
                  <div
                    className="text-center lato-black mb-2 text-dark"
                    style={{ fontSize: 12 }}
                  >
                    <em>Répartition par type d'offre et par opérateurs </em>
                  </div>
                </div>
                <div className="col-md-6">
                  <div>
                    <Chart
                      type="line"
                      data={data?.datasetsAreaOper}
                      options={options3}
                      plugins={[ChartDataLabels]}
                    />
                  </div>
                  <div
                    className="text-center lato-black mb-2 text-dark"
                    style={{ fontSize: 12 }}
                  >
                    <em>Répartition par zone et par opérateurs </em>
                  </div>
                </div>
              </div>
              <hr />
              <div className="row">
                <div className="col-md-6">
                  <div>
                    <Chart
                      type="bar"
                      data={data?.dataOperType}
                      options={options5}
                      plugins={[ChartDataLabels]}
                    />
                  </div>
                  <div
                    className="text-center lato-black text-dark"
                    style={{ fontSize: 12 }}
                  >
                    <em>Répartition par opérateurs et par type d'offre </em>
                  </div>
                </div>
                <div className="col-md-6">
                  <div>
                    <Chart
                      type="bar"
                      data={data?.dataOperCateg}
                      options={options5}
                      plugins={[ChartDataLabels]}
                    />
                  </div>
                  <div
                    className="text-center lato-black text-dark"
                    style={{ fontSize: 12 }}
                  >
                    <em>Répartition par opérateurs et par type d'offre </em>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <hr />

          <div className={`sts mb-3${detailLoading ? " sts-is-loading" : ""}`}>
            <OfferKindSplit stats={detailStats} />
          </div>
          <div className={`sts mt-3${detailLoading ? " sts-is-loading" : ""}`}>
            <div className="sts-grid">
              <OfferTrendPanel
                stats={detailStats}
                from={filter?.startDate}
                to={filter?.endDate}
                subtitle="selon la date de notification, sur la période et le périmètre filtrés"
              />
            </div>
          </div>
          <hr />
          {/* <div className="card bg-white">
            <div className="card-body">
              <div className="row">
                <div>
                  <Chart type="line" data={legacyTrend} options={options8} />
                </div>
                <div
                  className="d-flex flex-wrap justify-content-between align-items-center gap-2 mt-2 text-dark"
                  style={{ fontSize: 12 }}
                >
                  <em className="lato-black">
                    Evolution des offres par type et catégories  {" "}
                    {legacyUnit === "week"
                      ? "par semaine"
                      : legacyUnit === "month"
                        ? "par mois"
                        : "par année"}
                  </em>
                  <span className="sts">
                    <GranularitySwitch
                      value={legacyUnit}
                      onChange={setLegacyGranularity}
                    />
                  </span>
                </div>
              </div>
            </div>
          </div> */}
          <hr />

          <OperatorDetailTable stats={detailStats} />
        </div>
      ) : (
        <>
          <div className="alert alert-warning text-center">
            <div className="">
              <i
                className="fa-solid fa-triangle-exclamation"
                style={{ fontSize: 40 }}
              ></i>
            </div>
            <div>Aucun opérateur sélectionnée.</div>
          </div>
        </>
      )}

      {/* table */}
    </div>
  );
}
