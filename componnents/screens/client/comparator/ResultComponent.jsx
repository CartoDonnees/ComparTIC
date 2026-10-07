// BUGFIX: `shuffleArray` était importé de "convertions" alors qu il est
// exporté par "tools/filter/filter". L import ne résolvait donc rien
import { exportToPdf, FORMULA_EXPORT_COLUMNS } from "@/services/tools/exportData";
// (« Attempted import error » au build)   et la fonction n était jamais
// appelée ici. Import retiré.
import {
  addDays,
  convertDays,
  handleNumThousand,
} from "@/services/tools/convertions";
import React, { useEffect, useMemo, useRef, useState } from "react";
import OfferCoverage from "@/componnents/comparator/OfferCoverage";
import DetailFomulaModal from "./DetailFomulaModal";
import { convertMoToGo, extractHtmlText } from "@/services/tools/helper";
import { BASE_IMG_URL, imageUrl } from "@/services/tools/constants";
import { getClientApiServices } from "@/services/api/services/servicesApiServices";
import ExportDataModal from "@/componnents/modal/export/ExportDataModal";
// BUGFIX: suppression de `import { number } from "framer-motion"`   export
// inexistant, jamais utilisé (alourdissait le bundle / risque d'erreur).
import { interleaveOffersByOperator } from "@/services/tools/filter/filter";
import CompareOffersModal from "./CompareOffersModal";

export const ResultComponent = ({
  filter,
  setShowError,
  clientFormulas,
  handleFilterFormulas,
  filter2,
  search,
  handleSearchByTitle,
  initPage,
}) => {
  const [showGrid, setShowGrid] = useState(false);

  const [showDetailModal, setShowDetailModal] = useState(false);
  // Formule sélectionnée pour le modal de détail
  const [detailFormula, setDetailFormula] = useState(null);
  const [services, setServices] = useState(null);
  const [showDetail, setShowDetail] = useState(null);

  // Ouvre le modal de détail sur la formule cliquée
  const handleOpenDetail = (formula) => {
    setDetailFormula(formula);
    setShowDetailModal(true);
  };

  // ── Comparaison multi-offres (retour présentation ARTCI) ─────────────
  const MAX_COMPARE = 4;
  const [compareList, setCompareList] = useState([]);
  const [showCompare, setShowCompare] = useState(false);

  const isInCompare = (f) => compareList.some((c) => c?.code === f?.code);
  const toggleCompare = (f) => {
    setCompareList((prev) => {
      if (prev.some((c) => c?.code === f?.code)) {
        return prev.filter((c) => c?.code !== f?.code);
      }
      if (prev.length >= MAX_COMPARE) return prev; // limite atteinte
      return [...prev, f];
    });
  };
  const removeFromCompare = (f) =>
    setCompareList((prev) => prev.filter((c) => c?.code !== f?.code));
  const clearCompare = () => setCompareList([]);

  const [showExporModal, setShowExporModal] = useState(null);
  const [formsToShow, setFormsToShow] = useState(null);

  /* ------------------------------------------------------------------
     Pagination des offres.

     La liste complète était rendue d'un seul bloc dans une zone défilante :
     avec plusieurs centaines de formules, la page devenait lourde à afficher
     et l'internaute ne savait ni combien d'offres existaient, ni où il en
     était. Le découpage se fait côté navigateur, sur la liste DÉJÀ filtrée,
     donc sans appel supplémentaire au serveur.
     ------------------------------------------------------------------ */
  const PAGE_SIZES = [12, 24, 48];
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZES[0]);
  const resultsRef = useRef(null);

  const totalForms = formsToShow?.length || 0;
  const pageCount = Math.max(1, Math.ceil(totalForms / pageSize));

  // Filtre, recherche ou tri modifiés : retour à la première page.
  useEffect(() => {
    setPage(1);
  }, [formsToShow, pageSize]);

  const pagedForms = useMemo(() => {
    if (!formsToShow) return [];
    const start = (page - 1) * pageSize;
    return formsToShow.slice(start, start + pageSize);
  }, [formsToShow, page, pageSize]);

  const goToPage = (next) => {
    const target = Math.min(pageCount, Math.max(1, next));
    setPage(target);
    // Remonte en haut des résultats : sans cela, on change de page en restant
    // au milieu de la liste précédente.
    resultsRef.current?.scrollTo?.({ top: 0, behavior: "smooth" });
  };

  /** Numéros affichés : 1 … n-1 [n] n+1 … total */
  const pageNumbers = useMemo(() => {
    const around = new Set([1, pageCount, page, page - 1, page + 1]);
    return [...around]
      .filter((n) => n >= 1 && n <= pageCount)
      .sort((a, b) => a - b)
      .reduce((acc, n, i, arr) => {
        if (i > 0 && n - arr[i - 1] > 1) acc.push("…");
        acc.push(n);
        return acc;
      }, []);
  }, [page, pageCount]);

  useEffect(() => {
    init();
  }, []);

  useEffect(() => {
    if (clientFormulas) {
      if (filter?.randomOper) {
        const _forms = interleaveOffersByOperator(clientFormulas);
        setFormsToShow(_forms);
      } else {
        const _forms = clientFormulas;
        setFormsToShow(_forms);
      }
    }
  }, [clientFormulas]);

  const init = async () => {
    const _services = await getClientApiServices();
    setServices(_services);
  };

  const handleViewDetails = (name, value) => {
    const _details = { ...showDetail };
    _details[name] = value;
    setShowDetail(_details);
  };

  const cols = [
    { field: "number", header: "N°" },
    { field: "code", header: "Code" },
    { field: "title", header: "Nom" },
    { field: "category", header: "Categorie" },
    { field: "operator", header: "Operateur" },
    { field: "type", header: "Type d'offre" },
    { field: "validity", header: "Validité" },
    { field: "price", header: "Prix" },
    { field: "service", header: "Service" },
  ];

  const exportColumns = cols.map((col) => ({
    title: col.header,
    dataKey: col.field,
  }));

  /**
   * Export PDF des formules AFFICHÉES (après filtres et tri). L'ancienne
   * version exportait toutes les formules sans tenir compte des filtres et
   * plantait sur une formule sans prix (formule « à la facture »).
   */
  const exportPdf = async () => {
    const rows = Array.isArray(formsToShow) && formsToShow.length ? formsToShow : clientFormulas || [];
    if (!rows.length) return;
    try {
      await exportToPdf({
        rows,
        columns: FORMULA_EXPORT_COLUMNS,
        fileName: "compartic_comparateur_offres",
        title: "ComparTIC   Offres de services (www.compartic.artci.ci)",
        subtitle: rows === formsToShow ? "Résultats affichés selon vos critères" : null,
      });
    } catch (error) {
      console.error("Export PDF impossible :", error);
    }
  };

  return (
    <>
      <div className="comparison-products sch1">
        <div className="sch-rs">
          <div className="input-group m-0 p-0 mb-2 trans-fr ">
            <input
              type="text"
              className="form-control"
              placeholder="Recherche par nom de l'offre..."
              aria-label="Recherche par nom de l'offre"
              onChange={(e) => handleSearchByTitle(e.target.value)}
              // BUGFIX: `search` vaut `null` au départ -> input non contrôlé
              // (warning React). On force une chaîne vide.
              value={search || ""}
            />
            <div className="input-group-text">
              <i className="fa fa-search"></i>
            </div>
          </div>
        </div>
        <div className="products-head mb-0 trans-fl ">
          {/* Nombre d'offres : libellé court pour tenir sur la même ligne que
              les filtres ; le mot complet reste dans l'infobulle. */}
          <div
            className="legend cmp-count"
            title={
              formsToShow?.length > 0
                ? `${formsToShow.length} ${formsToShow.length === 1 ? "offre trouvée" : "offres trouvées"}`
                : undefined
            }
          >
            {formsToShow?.length > 0 && (
              <b>
                {formsToShow.length} {formsToShow.length === 1 ? "offre" : "offres"}
              </b>
            )}
          </div>
          <div className="order">
            <div className="legend align-self-center c-lg1 cmp-sort-label">Trier par :</div>
            <ul className="c-ful m-0 p-0">
              <li
                className={
                  filter2?.price ? "btn-filter is-active" : "btn-filter "
                }
                onClick={() => {
                  handleFilterFormulas("price");
                }}
              >
                Prix
                {filter2?.price ? (
                  <>
                    {filter2?.priceOrder == "asc" ? (
                      <>
                        <i className="bi bi-arrow-down c-ic1 "></i>
                      </>
                    ) : (
                      <>
                        <i className="bi bi-arrow-up c-ic1"></i>
                      </>
                    )}
                  </>
                ) : (
                  <>
                    <i
                      className="pi pi-sort-alt c-ic1"
                      style={{ paddingLeft: 5, fontSize: 10 }}
                    ></i>
                  </>
                )}
              </li>
              <li
                className={
                  filter2?.validity ? "btn-filter is-active" : "btn-filter "
                }
                onClick={() => {
                  handleFilterFormulas("validity");
                }}
              >
                Validite
                {filter2?.validity ? (
                  <>
                    {filter2?.validityOrder == "asc" ? (
                      <>
                        <i className="bi bi-arrow-down c-ic1  "></i>
                      </>
                    ) : (
                      <>
                        <i className="bi bi-arrow-up c-ic1"></i>
                      </>
                    )}
                  </>
                ) : (
                  <>
                    <i
                      className="pi pi-sort-alt c-ic1"
                      style={{ paddingLeft: 5, fontSize: 10 }}
                    ></i>
                  </>
                )}
              </li>
              <li
                className={
                  filter2?.voice ? "btn-filter is-active" : "btn-filter "
                }
                onClick={() => {
                  handleFilterFormulas("voice");
                }}
              >
                Voix
                {filter2?.voice ? (
                  <>
                    {filter2?.voiceOrder == "asc" ? (
                      <>
                        <i className="bi bi-arrow-down c-ic1 "></i>
                      </>
                    ) : (
                      <>
                        <i className="bi bi-arrow-up c-ic1"></i>
                      </>
                    )}
                  </>
                ) : (
                  <>
                    <i
                      className="pi pi-sort-alt c-ic1"
                      style={{ paddingLeft: 5, fontSize: 10 }}
                    ></i>
                  </>
                )}
              </li>
              <li
                className={
                  filter2?.sms ? "btn-filter is-active" : "btn-filter "
                }
                onClick={() => {
                  handleFilterFormulas("sms");
                }}
              >
                SMS
                {filter2?.sms ? (
                  <>
                    {filter2?.smsOrder == "asc" ? (
                      <>
                        <i className="bi bi-arrow-down c-ic1 "></i>
                      </>
                    ) : (
                      <>
                        <i className="bi bi-arrow-up c-ic1"></i>
                      </>
                    )}
                  </>
                ) : (
                  <>
                    <i
                      className="pi pi-sort-alt c-ic1"
                      style={{ paddingLeft: 5, fontSize: 10 }}
                    ></i>
                  </>
                )}
              </li>
              <li
                className={
                  filter2?.data ? "btn-filter is-active" : "btn-filter "
                }
                onClick={() => {
                  handleFilterFormulas("data");
                }}
              >
                Internet
                {filter2?.data ? (
                  <>
                    {/* BUGFIX: l'indicateur Internet lisait `smsOrder` au lieu de `dataOrder` */}
                    {filter2?.dataOrder == "asc" ? (
                      <>
                        <i className="bi bi-arrow-down c-ic1 "></i>
                      </>
                    ) : (
                      <>
                        <i className="bi bi-arrow-up c-ic1"></i>
                      </>
                    )}
                  </>
                ) : (
                  <>
                    <i
                      className="pi pi-sort-alt c-ic1"
                      style={{ paddingLeft: 5, fontSize: 10 }}
                    ></i>
                  </>
                )}
              </li>
              {formsToShow?.length > 0 && (
                <>
                  <li
                    className="btn-filter btn-f"
                    data-value="data"
                    // onClick={() => setShowExporModal(true)}
                    onClick={() => exportPdf()}
                  >
                    <i className="fa fa-file c-ic1 me-1"></i>
                    Exporter
                  </li>
                </>
              )}
            </ul>
          </div>
          <ul className="p-0 c-grid">
            <li
              className={
                showGrid == false
                  ? "btn-filter is-active text-center "
                  : "btn-filter text-center"
              }
              onClick={() => setShowGrid(false)}
              role="button"
              tabIndex={0}
              aria-pressed={showGrid == false}
              aria-label="Affichage en liste"
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") setShowGrid(false);
              }}
            >
              <i
                className="fa-solid fa-list align-self-center c-ic11"
                style={{ paddingLeft: 5, fontSize: 20 }}
              />
            </li>
            <li
              className={
                showGrid == true
                  ? " btn-filter is-active text-center"
                  : " btn-filter text-center"
              }
              onClick={() => setShowGrid(true)}
              role="button"
              tabIndex={0}
              aria-pressed={showGrid == true}
              aria-label="Affichage en grille"
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") setShowGrid(true);
              }}
            >
              <i
                className="fa-solid fa-table c-ic11"
                style={{ paddingLeft: 5, fontSize: 20 }}
              />
            </li>
          </ul>
        </div>
        {initPage ? (
          <>
            {formsToShow?.length > 0 ? (
              <>
                <div className=" py-2 px-1 trans-fl">
                  <div
                    className="  mofscroll "
                    ref={resultsRef}
                  >
                    {showGrid == true ? (
                      <>
                        <div className="container-fluid p-0">
                          <div className="masonry-container row">
                            {pagedForms.length > 0 &&
                              pagedForms.map((formula, i) => {
                                return (
                                  <div className="col-md-4" key={"ms" + i}>
                                    <div
                                      // `is-compared` met la carte en évidence
                                      // (bordure + ombre) quand elle est
                                      // sélectionnée pour la comparaison
                                      className={
                                        isInCompare(formula)
                                          ? "masonry-item is-compared"
                                          : "masonry-item"
                                      }
                                      // onMouseEnter={() =>
                                      //   handleViewDetails("viewMore" + i, true)
                                      // }
                                      // onMouseLeave={() =>
                                      //   handleViewDetails("viewMore" + i, false)
                                      // }
                                    >
                                      <div className="text-center">
                                        <div className="offer-header bg-gray-form d-flex justify-content-center lato-bold ">
                                          <div>{formula.title}</div>
                                        </div>
                                      </div>
                                      <div className="px-3">
                                        <div className="d-flex justify-content-between pt-1">
                                          <div className="pt-1">
                                            <img
                                              src={
                                                BASE_IMG_URL +
                                                formula.offer.operator.imagePath
                                              }
                                              className="me-2 offer-oper-img"
                                              alt=""
                                            />
                                          </div>
                                          <div className="text-center">
                                            {formula?.offer
                                              ?.specialPromotion && (
                                              <>
                                                <div>
                                                  <img
                                                    src="images/promo.png"
                                                    alt=""
                                                    style={{ height: 40 }}
                                                  />
                                                </div>
                                                <small style={{ fontSize: 10 }}>
                                                  <em>
                                                    Jusqu'au:{" "}
                                                    <span
                                                      style={{ fontSize: 12 }}
                                                      className="text-danger"
                                                    >
                                                      <b>
                                                        {addDays(
                                                          formula.offer
                                                            ?.desiredDate,
                                                          formula.offer
                                                            ?.specialPromotion
                                                            ?.duration,
                                                        )}
                                                      </b>
                                                    </span>{" "}
                                                  </em>
                                                </small>
                                              </>
                                            )}
                                          </div>
                                          <div>
                                            <div className="d-flex justify-content-end mb-1">
                                              <div>
                                                <span
                                                  className="cmp-badge cmp-badge--billing"
                                                  style={{ fontSize: 10 }}
                                                >
                                                  <i className="bi bi-credit-card-2-back"></i>
                                                  {formula.offer.billingType ==
                                                  "PREPAID"
                                                    ? "Prépayé"
                                                    : "Postpayé"}
                                                </span>
                                                <span className="cmp-badge cmp-badge--zone">
                                                  <i className="bi bi-geo-alt-fill c-ic1"></i>
                                                  {/* BUGFIX: le test portait sur
                                                      "INTERNATIONNAL" (deux N)
                                                      alors que la valeur est
                                                      "INTERNATIONAL" : le badge
                                                      des offres internationales
                                                      restait vide. */}
                                                  {formula.offer.area?.title ==
                                                    "NATIONAL" && "Nationale"}
                                                  {(formula.offer.area?.title ==
                                                    "INTERNATIONAL" ||
                                                    formula.offer.area?.title ==
                                                      "INTERNATIONNAL") &&
                                                    "Internationale"}
                                                  {formula.offer.area?.title ==
                                                    "ROAMING" && "Roaming"}
                                                </span>
                                              </div>
                                            </div>
                                            <div>
                                              <div
                                                className=""
                                                style={{
                                                  backgroundColor: "#EEEFF2",
                                                  paddingInline: 5,
                                                  borderRadius: 5,
                                                  textAlign: "center",
                                                }}
                                              >
                                                <small>
                                                  <i className="bi bi-calendar-check me-2"></i>
                                                  <span className="text-dark">
                                                    <b>
                                                      {convertDays(
                                                        formula.validity,
                                                      )}
                                                    </b>
                                                  </span>
                                                </small>
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                        {/* Couverture géographique : zones et
                                            pays concernés. Ne s affiche que
                                            pour les offres internationales et
                                            de roaming (cf. OfferCoverage). */}
                                        <OfferCoverage
                                          offer={formula.offer}
                                          variant="compact"
                                        />
                                        <hr className="m-1" />
                                        <div className="d-flex justify-content-between">
                                          <div className=" p-0 m-0">
                                            <div
                                              className="text-center w-100 align-content-center"
                                              style={{
                                                height: 100,
                                              }}
                                            >
                                              {services &&
                                                formula.serviceDetail &&
                                                services.map((s, idx) => {
                                                  return (
                                                    <React.Fragment
                                                      key={"ser" + idx}
                                                    >
                                                      {formula.serviceDetail.map(
                                                        (sd, ii) => {
                                                          if (
                                                            sd.service.id ==
                                                            s.id
                                                          ) {
                                                            return (
                                                              <div
                                                                className=""
                                                                key={"srv" + ii}
                                                              >
                                                                <div
                                                                  style={{
                                                                    fontWeight:
                                                                      "bold",
                                                                    fontSize:
                                                                      formula
                                                                        .serviceDetail
                                                                        ?.length >
                                                                      1
                                                                        ? 25
                                                                        : 35,
                                                                  }}
                                                                >
                                                                  <table className="">
                                                                    <tbody>
                                                                      <tr className="p-0 m-0">
                                                                        <td className="p-0 ">
                                                                          <span
                                                                            className="text-dark text-muted"
                                                                            style={{
                                                                              fontSize:
                                                                                formula
                                                                                  .serviceDetail
                                                                                  ?.length >
                                                                                1
                                                                                  ? 15
                                                                                  : 25,
                                                                            }}
                                                                          >
                                                                            {sd
                                                                              .service
                                                                              .code ==
                                                                              "SER-001" && (
                                                                              <>
                                                                                <i className="bi bi-telephone-fill me-2"></i>
                                                                              </>
                                                                            )}
                                                                            {sd
                                                                              .service
                                                                              .code ==
                                                                              "SER-010" && (
                                                                              <>
                                                                                <i className="bi bi-chat-left-text-fill me-2"></i>
                                                                              </>
                                                                            )}
                                                                            {sd
                                                                              .service
                                                                              .code ==
                                                                              "SER-100" && (
                                                                              <>
                                                                                <i className="bi bi-globe me-2"></i>
                                                                              </>
                                                                            )}
                                                                          </span>
                                                                        </td>
                                                                        <td className="">
                                                                          {sd
                                                                            .service
                                                                            .code ==
                                                                            "SER-001" && (
                                                                            <>
                                                                              {handleNumThousand(
                                                                                sd.quantity,
                                                                              )}{" "}
                                                                              mins
                                                                            </>
                                                                          )}
                                                                          {sd
                                                                            .service
                                                                            .code ==
                                                                            "SER-010" && (
                                                                            <>
                                                                              {handleNumThousand(
                                                                                sd.quantity,
                                                                              )}{" "}
                                                                              sms
                                                                            </>
                                                                          )}
                                                                          {sd
                                                                            .service
                                                                            .code ==
                                                                            "SER-100" && (
                                                                            <>
                                                                              {convertMoToGo(
                                                                                sd.quantity,
                                                                                1,
                                                                              )}
                                                                            </>
                                                                          )}
                                                                        </td>
                                                                      </tr>
                                                                    </tbody>
                                                                  </table>
                                                                </div>
                                                                <small></small>
                                                              </div>
                                                            );
                                                          }
                                                        },
                                                      )}
                                                    </React.Fragment>
                                                  );
                                                })}
                                            </div>
                                          </div>
                                          <div
                                            className=""
                                            style={{ fontSize: 20 }}
                                          >
                                            <div className="bg-light2 rounded px-2">
                                              <div
                                                className="text-center"
                                                style={{ fontSize: 14 }}
                                              >
                                                <i className="bi bi-cash-stack"></i>
                                              </div>
                                              <div className="w-100 lato-bold ">
                                                {formula?.price ? (
                                                  <>
                                                    <b>
                                                      {handleNumThousand(
                                                        formula.price.value,
                                                      )}
                                                    </b>
                                                  </>
                                                ) : (
                                                  <>
                                                    {formula?.serviceDetail
                                                      ?.offerRate && (
                                                      <>
                                                        <b>
                                                          {handleNumThousand(
                                                            formula
                                                              ?.serviceDetail
                                                              ?.offerRate,
                                                          )}
                                                        </b>
                                                      </>
                                                    )}
                                                  </>
                                                )}
                                                <small>
                                                  <b>F</b>
                                                </small>
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                        <div className="pb-3">
                                          <div className="mt-4 d-flex justify-content-center gap-2">
                                            {!showDetail?.["viewMore" + i] ==
                                            true ? (
                                              <>
                                                <button
                                                  className="btn btn-outline-success btn-act-goto btn-sm flex-grow-1"
                                                  type="button"
                                                  onClick={() => {
                                                    handleViewDetails(
                                                      "viewMore" + i,
                                                      !showDetail?.[
                                                        "viewMore" + i
                                                      ],
                                                    );
                                                  }}
                                                >
                                                  Voir plus...
                                                  <i className="bi bi-chevron-down"></i>
                                                </button>
                                              </>
                                            ) : (
                                              <>
                                                <button
                                                  className="btn btn-success btn-act-goto1 btn-sm flex-grow-1 mb-0"
                                                  type="button"
                                                  onClick={() => {
                                                    handleViewDetails(
                                                      "viewMore" + i,
                                                      !showDetail?.[
                                                        "viewMore" + i
                                                      ],
                                                    );
                                                  }}
                                                >
                                                  Voir moins...
                                                  <i className="bi bi-chevron-up"></i>
                                                </button>
                                              </>
                                            )}
                                            {/* Ouvre le modal de détail complet */}
                                            <button
                                              className="btn btn-success btn-act-goto1 btn-sm"
                                              type="button"
                                              title="Voir le détail complet"
                                              aria-label="Voir les détails complet de l'offre"
                                              onClick={() =>
                                                handleOpenDetail(formula)
                                              }
                                            >
                                              <i className="bi bi-arrows-fullscreen"></i>
                                            </button>
                                            {/* Ajouter / retirer de la comparaison */}
                                            <button
                                              className={
                                                isInCompare(formula)
                                                  ? "cmp-cmp-toggle is-on"
                                                  : "cmp-cmp-toggle"
                                              }
                                              type="button"
                                              aria-pressed={isInCompare(formula)}
                                              aria-label={
                                                isInCompare(formula)
                                                  ? "Retirer de la comparaison"
                                                  : "Ajouter à la comparaison"
                                              }
                                              title={
                                                isInCompare(formula)
                                                  ? "Retirer de la comparaison"
                                                  : "Ajouter à la comparaison"
                                              }
                                              onClick={() => toggleCompare(formula)}
                                            >
                                              <i
                                                className={
                                                  isInCompare(formula)
                                                    ? "bi bi-check-lg"
                                                    : "bi bi-plus-lg"
                                                }
                                              ></i>
                                            </button>
                                          </div>
                                          {showDetail?.["viewMore" + i] && (
                                            <>
                                              <div className="border border-success px-2 mt-0">
                                                <div className=" pb-2">
                                                  <div className="me-2">
                                                    <small>
                                                      Mode d'accès :
                                                    </small>
                                                  </div>
                                                  {formula?.offer
                                                    ?.accessModes &&
                                                    formula?.offer?.accessModes
                                                      ?.length > 0 &&
                                                    formula?.offer?.accessModes.map(
                                                      (am, idx) => {
                                                        return (
                                                          <div
                                                            key={"am" + am.id}
                                                            className=" limite-access me-2 mb-1"
                                                          >
                                                            {extractHtmlText(
                                                              am?.content,
                                                            )}
                                                          </div>
                                                        );
                                                      },
                                                    )}
                                                </div>
                                                <div>
                                                  {formula?.advantages &&
                                                    formula?.advantages
                                                      ?.length > 0 && (
                                                      <>
                                                        <hr className="m-0 mb-1" />
                                                        <div>
                                                          <em>
                                                            <b>
                                                              <u>
                                                                <small>
                                                                  Autres
                                                                  avantages :
                                                                </small>
                                                              </u>
                                                            </b>
                                                          </em>
                                                        </div>
                                                        <ul className="list-unstyled  pb-2">
                                                          {formula?.advantages.map(
                                                            (adv, idx) => {
                                                              return (
                                                                <li
                                                                  key={
                                                                    "adv" + idx
                                                                  }
                                                                  style={{
                                                                    fontSize: 12,
                                                                  }}
                                                                >
                                                                  {" "}
                                                                  -{" "}
                                                                  {extractHtmlText(
                                                                    adv.title,
                                                                  ) +
                                                                    " " +
                                                                    extractHtmlText(
                                                                      adv.description,
                                                                    )}
                                                                </li>
                                                              );
                                                            },
                                                          )}
                                                        </ul>
                                                        {/* <div>
                                        <hr className="mb-1" />
                                        <div className="p-2 pt-0 ">
                                          <div>
                                            <small>
                                              <em>
                                                <u>
                                                  <b>Autre avantages:</b>
                                                </u>
                                              </em>
                                            </small>
                                          </div>

                                        </div>
                                      </div> */}
                                                      </>
                                                    )}
                                                </div>
                                              </div>
                                            </>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        {pagedForms.length > 0 &&
                          pagedForms.map((formula, i) => {
                            return (
                              <div
                                className={
                                  isInCompare(formula)
                                    ? "masonry-item p-3 px-5 is-compared"
                                    : "masonry-item p-3 px-5"
                                }
                                key={"list" + i}
                              >
                                <div className="row mb-1">
                                  <div className="col-md-1 p-0 m-0 d-flex justify-content-center text-center">
                                    <img
                                      src={
                                        BASE_IMG_URL +
                                        formula.offer.operator.imagePath
                                      }
                                      className="offer-oper-img1"
                                      style={{}}
                                      alt=""
                                    />
                                  </div>
                                  <div className="col-md-11 ">
                                    <div className="row">
                                      <div className="col-md-6   align-content-center ">
                                        <div className="">
                                          <div className="bg-light2 d-flex justify-content-between">
                                            <div
                                              style={{
                                                fontSize: 25,
                                                fontWeight: "bold",
                                              }}
                                              className="px-2 lato-black c_to1"
                                            >
                                              {formula.title}
                                            </div>
                                            {formula?.offer
                                              ?.specialPromotion && (
                                              <>
                                                <div>
                                                  <img
                                                    src="images/promo.png"
                                                    alt=""
                                                    style={{ height: 40 }}
                                                  />
                                                </div>
                                              </>
                                            )}
                                          </div>
                                          {/* Type de paiement et zone : ces deux
                                              badges n existaient qu en vue
                                              grille, la vue liste n affichait
                                              donc pas la même information. */}
                                          <div className="cmp-meta px-2">
                                            <span className="cmp-badge cmp-badge--billing">
                                              <i className="bi bi-credit-card-2-back me-1"></i>
                                              {formula.offer.billingType ==
                                              "PREPAID"
                                                ? "Prépayé"
                                                : "Postpayé"}
                                            </span>
                                            <span className="cmp-badge cmp-badge--zone">
                                              <i className="bi bi-geo-alt-fill c-ic1 me-1"></i>
                                              {formula.offer.area?.title ==
                                                "NATIONAL" && "Nationale"}
                                              {(formula.offer.area?.title ==
                                                "INTERNATIONAL" ||
                                                formula.offer.area?.title ==
                                                  "INTERNATIONNAL") &&
                                                "Internationale"}
                                              {formula.offer.area?.title ==
                                                "ROAMING" && "Roaming"}
                                            </span>
                                          </div>
                                        </div>
                                      </div>
                                      <div className="col-md-3">
                                        <div className="" style={{fontSize:30}}>
                                          {services &&
                                            formula.serviceDetail &&
                                            services.map((s, idx) => {
                                              return (
                                                <React.Fragment
                                                  key={"ser" + idx}
                                                >
                                                  {formula.serviceDetail.map(
                                                    (sd, ii) => {
                                                      if (
                                                        sd.service.id == s.id
                                                      ) {
                                                        return (
                                                          <div
                                                            className=""
                                                            key={"srv" + ii}
                                                          >
                                                            <div
                                                              style={{
                                                                fontWeight:
                                                                  "bold",
                                                                fontSize: 25,
                                                              }}
                                                            >
                                                              <table className="" >
                                                                <tbody>
                                                                  <tr>
                                                                    <td>
                                                                      <span
                                                                        className="text-dark text-muted"
                                                                        style={{
                                                                          fontSize: 15,
                                                                        }}
                                                                      >
                                                                        {sd
                                                                          .service
                                                                          .code ==
                                                                          "SER-001" && (
                                                                          <>
                                                                            <i className="bi bi-telephone-fill me-2"></i>
                                                                          </>
                                                                        )}
                                                                        {sd
                                                                          .service
                                                                          .code ==
                                                                          "SER-010" && (
                                                                          <>
                                                                            <i className="bi bi-chat-left-text-fill me-2"></i>
                                                                          </>
                                                                        )}
                                                                        {sd
                                                                          .service
                                                                          .code ==
                                                                          "SER-100" && (
                                                                          <>
                                                                            <i className="bi bi-globe me-2"></i>
                                                                          </>
                                                                        )}
                                                                      </span>
                                                                    </td>
                                                                    <td className="c-ts1">
                                                                      {sd
                                                                        .service
                                                                        .code ==
                                                                        "SER-001" && (
                                                                        <>
                                                                          {handleNumThousand(
                                                                            sd.quantity,
                                                                          )}{" "}
                                                                          mins
                                                                        </>
                                                                      )}
                                                                      {sd
                                                                        .service
                                                                        .code ==
                                                                        "SER-010" && (
                                                                        <>
                                                                          {handleNumThousand(
                                                                            sd.quantity,
                                                                          )}{" "}
                                                                          sms
                                                                        </>
                                                                      )}
                                                                      {sd
                                                                        .service
                                                                        .code ==
                                                                        "SER-100" && (
                                                                        <>
                                                                          {convertMoToGo(
                                                                            sd.quantity,
                                                                            1,
                                                                          )}
                                                                        </>
                                                                      )}
                                                                    </td>
                                                                  </tr>
                                                                </tbody>
                                                              </table>
                                                            </div>
                                                            <small></small>
                                                          </div>
                                                        );
                                                      }
                                                    },
                                                  )}
                                                </React.Fragment>
                                              );
                                            })}
                                        </div>
                                      </div>
                                      <div className="col-md-3 align-content-center">
                                        <div
                                          className="bg-light2"
                                          style={{
                                            backgroundColor: "#EEEFF2",
                                            paddingInline: 5,
                                            borderRadius: 5,
                                            textAlign: "center",
                                          }}
                                        >
                                          <small>
                                            <i className="bi bi-calendar-check me-2"></i>
                                            <span className="text-dark">
                                              <b>
                                                {convertDays(formula.validity)}
                                              </b>
                                            </span>
                                          </small>
                                        </div>
                                      </div>
                                    </div>
                                    <hr className="m-1" />
                                  </div>
                                </div>
                                {/* Organisations et pays concernés : présents
                                    en vue grille, absents de la vue liste. */}
                                <OfferCoverage
                                  offer={formula.offer}
                                  variant="compact"
                                />
                                <div className="row">
                                  <div className="col-md-3 align-content-center">
                                    <div className="" style={{ fontSize: 23 }}>
                                      <div
                                        className="bg-light3 px-2"
                                        style={{
                                          backgroundColor: "#EEEFF2",
                                          paddingInline: 5,
                                          borderRadius: 5,
                                          textAlign: "center",
                                        }}
                                      >
                                        <div className="w-100 " style={{fontSize:25}}>
                                          <span
                                            className="text-center me-2"
                                            style={{ fontSize: 20 }}
                                          >
                                            <i className="bi bi-cash-stack"></i>
                                          </span>
                                          {formula?.price ? (
                                            <>
                                              <b>
                                                {handleNumThousand(
                                                  formula.price.value,
                                                )}
                                              </b>
                                            </>
                                          ) : (
                                            <>
                                              {formula?.serviceDetail
                                                ?.offerRate && (
                                                <>
                                                  <b>
                                                    {handleNumThousand(
                                                      formula?.serviceDetail
                                                        ?.offerRate,
                                                    )}
                                                  </b>
                                                </>
                                              )}
                                            </>
                                          )}{" "}
                                          <small>
                                            <b>F</b>
                                          </small>
                                        </div>
                                      </div>
                                    </div>
                                    <div className="">
                                      {/* <div
                                className="limited-date d-flex justify-content-center"
                                style={{ fontSize: 15, borderRadius: 5 }}
                              >
                                <small>
                                  ⏰ Du <strong>09/07/2023</strong> au
                                  <strong>09/07/2023</strong>
                                </small>
                              </div> */}
                                    </div>
                                  </div>
                                  {formula.offer?.specialPromotion ? (
                                    <>
                                      <div className="col-md-6 mb-2">
                                        <div className="">
                                          <div className="d-flex pt-4">
                                            <div className="me-2">
                                              <small>Mode d'accès :</small>
                                            </div>
                                            {formula?.offer?.accessModes &&
                                              formula?.offer?.accessModes
                                                ?.length > 0 &&
                                              formula?.offer?.accessModes.map(
                                                (am, idx) => {
                                                  return (
                                                    <div
                                                      key={"am" + am.id}
                                                      className=" limite-access me-2"
                                                    >
                                                      {extractHtmlText(
                                                        am?.content,
                                                      )}
                                                    </div>
                                                  );
                                                },
                                              )}
                                            {/* <div className="limite-access">
                                    Application MaxIt
                                    ⏰ Jusqu’au <strong>{addDaysDate(formula. formula.validity)} </strong>
                                  </div> */}
                                          </div>
                                        </div>
                                        {formula?.advantages &&
                                          formula?.advantages?.length > 0 && (
                                            <>
                                              <div>
                                                <hr className="mb-1" />
                                                <div className="p-2 pt-0 ">
                                                  <div>
                                                    <small>
                                                      <em>
                                                        <u>
                                                          <b>
                                                            Autre avantages:
                                                          </b>
                                                        </u>
                                                      </em>
                                                    </small>
                                                  </div>
                                                  <ul className="list-unstyled mb-0">
                                                    {formula?.advantages.map(
                                                      (adv, idx) => {
                                                        return (
                                                          <li
                                                            key={"adv" + idx}
                                                            style={{
                                                              fontSize: 12,
                                                            }}
                                                          >
                                                            {extractHtmlText(
                                                              adv.title,
                                                            ) +
                                                              " " +
                                                              extractHtmlText(
                                                                adv.description,
                                                              )}
                                                          </li>
                                                        );
                                                      },
                                                    )}
                                                  </ul>
                                                </div>
                                              </div>
                                            </>
                                          )}
                                      </div>
                                      <div className="col-md-3">
                                        <em>
                                          Jusqu'au:{" "}
                                          <span
                                            style={{ fontSize: 16 }}
                                            className="text-danger"
                                          >
                                            <b>
                                              {addDays(
                                                formula.offer?.desiredDate,
                                                formula.offer?.specialPromotion
                                                  ?.duration,
                                              )}
                                            </b>
                                          </span>{" "}
                                        </em>
                                      </div>
                                    </>
                                  ) : (
                                    <>
                                      <div className="col-md-9 mb-2">
                                        <div className="">
                                          <div className="d-flex pt-4">
                                            <div className="me-2">
                                              <small>Mode d'accès :</small>
                                            </div>
                                            {formula?.offer?.accessModes &&
                                              formula?.offer?.accessModes
                                                ?.length > 0 &&
                                              formula?.offer?.accessModes.map(
                                                (am, idx) => {
                                                  return (
                                                    <div
                                                      key={"am" + am.id}
                                                      className=" limite-access me-2"
                                                    >
                                                      {extractHtmlText(
                                                        am?.content,
                                                      )}
                                                    </div>
                                                  );
                                                },
                                              )}
                                            {/* <div className="limite-access">
                                    Application MaxIt
                                    ⏰ Jusqu’au <strong>{addDaysDate(formula. formula.validity)} </strong>
                                  </div> */}
                                          </div>
                                        </div>
                                        {formula?.advantages &&
                                          formula?.advantages?.length > 0 && (
                                            <>
                                              <div>
                                                <hr className="mb-1" />
                                                <div className="p-2 pt-0 ">
                                                  <div>
                                                    <small>
                                                      <em>
                                                        <u>
                                                          <b>
                                                            Autre avantages:
                                                          </b>
                                                        </u>
                                                      </em>
                                                    </small>
                                                  </div>
                                                  <ul className="list-unstyled mb-0">
                                                    {formula?.advantages.map(
                                                      (adv, idx) => {
                                                        return (
                                                          <li
                                                            key={"adv" + idx}
                                                            style={{
                                                              fontSize: 12,
                                                            }}
                                                          >
                                                            {extractHtmlText(
                                                              adv.title,
                                                            ) +
                                                              " " +
                                                              extractHtmlText(
                                                                adv.description,
                                                              )}
                                                          </li>
                                                        );
                                                      },
                                                    )}
                                                  </ul>
                                                </div>
                                              </div>
                                            </>
                                          )}
                                      </div>
                                    </>
                                  )}
                                </div>

                                {/* Actions : comparer + détail complet */}
                                <div className="d-flex justify-content-end gap-2">
                                  {/* Bascule "comparer" : icône seule pour rester
                                      compacte et de taille constante. L'état est
                                      porté par l'icône, le style et aria-pressed. */}
                                  <button
                                    className={
                                      isInCompare(formula)
                                        ? "cmp-cmp-toggle is-on"
                                        : "cmp-cmp-toggle"
                                    }
                                    type="button"
                                    aria-pressed={isInCompare(formula)}
                                    aria-label={
                                      isInCompare(formula)
                                        ? "Retirer de la comparaison"
                                        : "Ajouter à la comparaison"
                                    }
                                    title={
                                      isInCompare(formula)
                                        ? "Retirer de la comparaison"
                                        : "Ajouter à la comparaison"
                                    }
                                    onClick={() => toggleCompare(formula)}
                                  >
                                    <i
                                      className={
                                        isInCompare(formula)
                                          ? "bi bi-check-lg"
                                          : "bi bi-plus-lg"
                                      }
                                    ></i> Comparer
                                  </button>
                                  <button
                                    className="btn btn-outline-success btn-act-goto btn-sm"
                                    type="button"
                                    onClick={() => handleOpenDetail(formula)}
                                  >
                                    Voir les détails
                                    <i className="bi bi-chevron-right ms-1"></i>
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                      </>
                    )}
                  </div>

                  {/* Pagination : affichée uniquement lorsqu'il y a plus
                      d'une page. En deçà, elle n'apporte rien et alourdit
                      l'écran. */}
                  {pageCount > 1 && (
                    <nav className="cmp-pager" aria-label="Pagination des offres">
                      <p className="cmp-pager__count" aria-live="polite">
                        Offres <b>{(page - 1) * pageSize + 1}</b> à{" "}
                        <b>{Math.min(page * pageSize, totalForms)}</b> sur <b>{totalForms}</b>
                      </p>

                      <div className="cmp-pager__pages">
                          <button
                            type="button"
                            className="cmp-pager__btn"
                            onClick={() => goToPage(page - 1)}
                            disabled={page <= 1}
                            aria-label="Page précédente"
                          >
                            <i className="bi bi-chevron-left" aria-hidden="true"></i>
                          </button>

                          {pageNumbers.map((n, i) =>
                            n === "…" ? (
                              <span className="cmp-pager__gap" key={`gap${i}`}>
                                …
                              </span>
                            ) : (
                              <button
                                type="button"
                                key={n}
                                className={`cmp-pager__num${n === page ? " is-current" : ""}`}
                                onClick={() => goToPage(n)}
                                aria-current={n === page ? "page" : undefined}
                                aria-label={`Page ${n}`}
                              >
                                {n}
                              </button>
                            ),
                          )}

                        <button
                          type="button"
                          className="cmp-pager__btn"
                          onClick={() => goToPage(page + 1)}
                          disabled={page >= pageCount}
                          aria-label="Page suivante"
                        >
                          <i className="bi bi-chevron-right" aria-hidden="true"></i>
                        </button>
                      </div>

                      <label className="cmp-pager__size">
                        <span>Offres par page</span>
                        <select
                          value={pageSize}
                          onChange={(e) => setPageSize(Number(e.target.value))}
                          aria-label="Nombre d'offres par page"
                        >
                          {PAGE_SIZES.map((size) => (
                            <option key={size} value={size}>
                              {size}
                            </option>
                          ))}
                        </select>
                      </label>
                    </nav>
                  )}
                </div>
              </>
            ) : (
              // État vide repensé : illustration, message clair et action de
              // réinitialisation (feedback utilisateur immédiat).
              <div className="cmp-empty-state" role="status" aria-live="polite">
                <div className="cmp-empty-state__icon">
                  <i
                    className="fa-solid fa-magnifying-glass"
                    aria-hidden="true"
                  ></i>
                </div>
                <h3 className="cmp-empty-state__title">
                  Aucune offre disponible
                </h3>
                <p className="cmp-empty-state__text">
                  Aucune offre ne correspond aux critères sélectionnés. Essayez
                  d’élargir votre recherche ou de réinitialiser les filtres.
                </p>
              </div>
            )}
          </>
        ) : (
          // État de chargement : squelettes animés (skeleton) au lieu d'un
          // simple spinner -> perception de fluidité accrue.
          <div className="cmp-skeleton-grid" aria-hidden="true">
            {Array.from({ length: 6 }).map((_, i) => (
              <div className="cmp-skeleton-card" key={"sk" + i}>
                <div className="cmp-skeleton-line cmp-skeleton-line--title" />
                <div className="cmp-skeleton-row">
                  <div className="cmp-skeleton-avatar" />
                  <div className="cmp-skeleton-badges">
                    <div className="cmp-skeleton-pill" />
                    <div className="cmp-skeleton-pill" />
                  </div>
                </div>
                <div className="cmp-skeleton-line" />
                <div className="cmp-skeleton-line cmp-skeleton-line--short" />
                <div className="cmp-skeleton-line cmp-skeleton-line--btn" />
              </div>
            ))}
          </div>
        )}

        {/* {filter && Object.keys(filter).length > 0 ? (
          <>
            {offersToShow && Object.keys(offersToShow).length > 0 ? (
              <>
                {!layoutColumn ? (
                  <>
                    <div className="products-listing">
                      <div className="scroll-catalog-1">
                        {offersToShow &&
                          offersToShow.map((offer, index) => {
                            return (
                              <>
                                <div
                                  href=""
                                  onClick={() => handleShowOfferDialog(offer)}
                                  className="product product-plan"
                                  data-id="290603"
                                  target="_blank"
                                >
                                  <div className="inner">
                                    <div className="head">
                                      <p className="name">{offer?.nom} </p>
                                    </div>
                                    <div className="column-description">
                                      <p className="name">{offer?.nom}</p>
                                      <div className="description">
                                        <div className="logo">
                                          <img
                                            width="300"
                                            height="150"
                                            // src={urlBaseImage + offer?.operateur?.logo}
                                            alt="Auchan Telecom"
                                            className="img-fluid"
                                            loading="lazy"
                                          />
                                        </div>
                                        <ul>
                                          {offer?.services &&
                                            offer?.services.map(
                                              (service, index1) => {
                                                return (
                                                  <>
                                                    <li>{service?.nom}</li>
                                                  </>
                                                );
                                              }
                                            )}
                                        </ul>
                                      </div>
                                    </div>
                                    <div className="column-data">
                                      <ul className="text-dark">
                                        <li> {offer?.type.nom} </li>
                                        {offer?.type.nom ==
                                          "Offre promotionnelle" && (
                                          <>
                                            <li>
                                              Début:
                                              <b style={{ fontSize: 14 }}>
                                                {offer?.type.debut}
                                              </b>
                                            </li>
                                            <li>
                                              Fin:
                                              <b style={{ fontSize: 14 }}>
                                                {offer?.type.fin}
                                              </b>
                                            </li>
                                          </>
                                        )}
                                        <li>
                                          Durée:
                                          <b style={{ fontSize: 14 }}>
                                            {offer?.type.duree}
                                          </b>
                                        </li>
                                      </ul>
                                    </div>
                                    <div className="column-price">
                                      <p className="price">
                                        <span>
                                          {handleNumThousand(offer?.prix)} FCFA
                                        </span>
                                      </p>
                                      {offer?.type?.type_paie == 1 && (
                                        <>
                                          <p
                                            className="bg-light"
                                            style={{ color: "#EF674A" }}
                                          >
                                            PRE-PAYE
                                          </p>
                                        </>
                                      )}
                                      {offer?.type?.type_paie == 2 && (
                                        <>
                                          <p
                                            className="bg-light"
                                            style={{ color: "#EF674A" }}
                                          >
                                            POST-PAYE
                                          </p>
                                        </>
                                      )}
                                      {offer?.type?.reduction?.type == 1 && (
                                        <>
                                          <p className="text-dark">
                                            - {offer?.type?.reduction?.montant}%
                                          </p>
                                        </>
                                      )}
                                    </div>
                                    <div className="column-button">
                                      <div className="btn -tiny -arrow text-white">
                                        Voir l'offre
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </>
                            );
                          })}
                      </div>
                    </div>
                    <Paginator
                      first={first}
                      rows={rows}
                      totalRecords={offers?.length}
                      onPageChange={onPageChange}
                    />
                  </>
                ) : (
                  <>
                    <div className="products-listing">
                      <div className="d-flex justify-content-between">
                        {operators &&
                          operators.map((operator, index) => {
                            if (filter?.["OP-" + operator?.nom]) {
                              if (operator.type_operateur == 3) {
                                const _opOffers =
                                  offers?.filter(
                                    (item) =>
                                      item?.operateur?.nom == operator?.nom
                                  ) || [];
                                return (
                                  <>
                                    <div
                                      className={
                                        (index + 1) % 2 == 0
                                          ? "container1 bg-light"
                                          : "container1 bg-light"
                                      }
                                    >
                                      <div className="pt-3 d-flex justify-content-center">
                                        <img
                                          src={urlBaseImage + operator.logo}
                                          style={{ height: 40, width: 40 }}
                                          alt=""
                                        />
                                        <div className="card-title1">
                                          {operator?.nom}
                                        </div>
                                      </div>
                                      <div className="text-center p-0">
                                        {_opOffers?.length} Offres
                                      </div>
                                      <div className="scroll-catalog-1">
                                        {_opOffers &&
                                          _opOffers.map((offer, index1) => {
                                            return (
                                              <>
                                                <div
                                                  className="p-1"
                                                  key={"-off" + index1}
                                                >
                                                  <div
                                                    href=""
                                                    onClick={() =>
                                                      handleShowOfferDialog(
                                                        offer
                                                      )
                                                    }
                                                    className="product product-plan p-2  p-card"
                                                    data-id="290603"
                                                    target="_blank"
                                                  >
                                                    <div className=" text-center">
                                                      <h5 className="name">
                                                        {offer.nom}
                                                        {operator.nom}
                                                      </h5>
                                                    </div>
                                                    <div className="d-flex justify-content-between">
                                                      <div className="description p-0 m-0">
                                                        <ul className="p-0 m-0">
                                                          {offer.services &&
                                                            offer.services.map(
                                                              (
                                                                service,
                                                                index2
                                                              ) => {
                                                                return (
                                                                  <>
                                                                    <li
                                                                      key={
                                                                        "is-" +
                                                                        index2
                                                                      }
                                                                    >
                                                                      {
                                                                        service.nom
                                                                      }
                                                                    </li>
                                                                  </>
                                                                );
                                                              }
                                                            )}
                                                        </ul>
                                                      </div>
                                                      <div className="af-line1" />
                                                      <div>
                                                        <ul className="text-dark p-0 m-0">
                                                          <li>
                                                            {offer.type.nom}
                                                          </li>
                                                          {(offer.type.id ==
                                                            1 ||
                                                            offer.type.id ==
                                                              3) && (
                                                            <>
                                                              <li>
                                                                Début:
                                                                <b
                                                                  style={{
                                                                    fontSize: 14,
                                                                  }}
                                                                >
                                                                  {
                                                                    offer.type
                                                                      .debut
                                                                  }
                                                                </b>
                                                              </li>
                                                              <li>
                                                                Fin:
                                                                <b
                                                                  style={{
                                                                    fontSize: 14,
                                                                  }}
                                                                >
                                                                  {
                                                                    offer.type
                                                                      .fin
                                                                  }
                                                                </b>
                                                              </li>
                                                            </>
                                                          )}
                                                          {offer.type.id ==
                                                            2 && (
                                                            <>
                                                              <li>
                                                                Durée:
                                                                <b
                                                                  style={{
                                                                    fontSize: 14,
                                                                  }}
                                                                >
                                                                  {
                                                                    offer.type
                                                                      .duree
                                                                  }
                                                                </b>
                                                              </li>
                                                            </>
                                                          )}
                                                        </ul>
                                                      </div>
                                                    </div>
                                                    <div className="d-flex justify-content-between">
                                                      <div className="inner p-0 m-0">
                                                        <div className="column-price w-100 p-0 m-0">
                                                          <p className="price p-0 m-0">
                                                            <span>
                                                              {handleNumThousand(
                                                                offer.prix
                                                              )}
                                                              FCFA
                                                            </span>
                                                          </p>
                                                        </div>
                                                      </div>
                                                      <div className="innerp-0 m-0">
                                                        <div className="column-price w-100 p-0 m-0">
                                                          {offer.type
                                                            .type_paie == 1 && (
                                                            <>
                                                              <p
                                                                className="bg-light p-0 m-0"
                                                                style={{
                                                                  color:
                                                                    "#EF674A",
                                                                }}
                                                              >
                                                                PRE-PAYE
                                                              </p>
                                                            </>
                                                          )}
                                                          {offer.type
                                                            .type_paie == 2 && (
                                                            <>
                                                              <p
                                                                className="bg-light p-0 m-0"
                                                                style={{
                                                                  color:
                                                                    "#EF674A",
                                                                }}
                                                              >
                                                                POST-PAYE
                                                              </p>
                                                            </>
                                                          )}
                                                        </div>
                                                      </div>
                                                    </div>

                                                    {offer.type?.reduction
                                                      ?.type == 1 && (
                                                      <>
                                                        <div className="text-dark p-0 m-0 text-center">
                                                          -
                                                          {
                                                            offer.type.reduction
                                                              .montant
                                                          }
                                                          %
                                                        </div>
                                                      </>
                                                    )}
                                                  </div>
                                                </div>
                                              </>
                                            );
                                          })}
                                      </div>
                                    </div>
                                    {index + 1 != 3 && (
                                      <div className="af-line2" />
                                    )}
                                  </>
                                );
                              }
                            }
                          })}
                        <></>
                      </div>
                    </div>
                  </>
                )}
              </>
            ) : (
              <>
                <div className="d-flex justify-content-center">
                  <div className="text-center p-4">
                    <div>
                      <h1 className="text-danger">
                        <i className="fa-solid fa-triangle-exclamation"></i>
                      </h1>
                    </div>
                    <h4 className="text-danger">
                      Aucune offre de service trouvé pour les critères
                      séléctionnés
                    </h4>
                    <img src="./images/vide.png" style={{ height: 200 }} />
                  </div>
                </div>
              </>
            )}
          </>
        ) : (
          <>
            <div className="d-flex justify-content-center">
              <div className="text-center p-4">
                <div>
                  <h1>
                    <i className="fa-solid fa-triangle-exclamation"></i>
                  </h1>
                </div>
                <h4 className="">
                  Selectionnez au moins un critère de comparaison des offres
                </h4>
                <img src="./images/gif/a1.gif" style={{ height: 200 }} />
              </div>
            </div>
          </>
        )} */}
      </div>
      <DetailFomulaModal
        visible={showDetailModal}
        setVisible={setShowDetailModal}
        formula={detailFormula}
        services={services}
      />

      {/* Barre flottante de comparaison multi-offres */}
      {compareList.length > 0 && (
        <div className="cmp-cmp-bar" role="region" aria-label="Comparaison d'offres">
          <div className="cmp-cmp-bar__thumbs">
            {compareList.map((f, i) => (
              <span className="cmp-cmp-thumb" key={"th" + i} title={f?.title}>
                <img
                  src={imageUrl(f?.offer?.operator?.imagePath)}
                  alt={f?.offer?.operator?.name || ""}
                />
                <button
                  type="button"
                  onClick={() => removeFromCompare(f)}
                  aria-label={"Retirer " + (f?.title || "")}
                >
                  ×
                </button>
              </span>
            ))}
            <span className="cmp-cmp-bar__count">
              {compareList.length}/{MAX_COMPARE} sélectionnée
              {compareList.length > 1 ? "s" : ""}
            </span>
          </div>
          <div className="cmp-cmp-bar__actions">
            <button
              type="button"
              className="btn btn-sm btn-outline-light"
              onClick={clearCompare}
            >
              Vider
            </button>
            <button
              type="button"
              className="btn btn-sm btn-light fw-bold"
              disabled={compareList.length < 2}
              onClick={() => setShowCompare(true)}
            >
              <i className="bi bi-bar-chart-steps me-1"></i>
              Comparer ({compareList.length})
            </button>
          </div>
        </div>
      )}

      <CompareOffersModal
        visible={showCompare}
        setVisible={setShowCompare}
        formulas={compareList}
        onRemove={removeFromCompare}
      />
    </>
  );
};

export default ResultComponent;
