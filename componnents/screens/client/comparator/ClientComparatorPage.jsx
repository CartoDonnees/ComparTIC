// import { getMobileFixes, getMobileOffers, getOffers } from "@/services/api/offer/offerApiService";
// import { generalOfferFilter } from "@/services/tools/filter/filter";
import { useEffect, useState } from "react";
import ClientMainContainerPage from "../ClientMainContainerPage";
import { ComparatorSideBarComponent } from "@/componnents/layouts/sidebar/ComparatorSideBarComponent";
import { ResultComponent } from "@/componnents/screens/client/comparator/ResultComponent";
import { OfferModalComponent } from "@/componnents/modal/OfferModalComponent";
import { generalOfferFilter } from "@/services/tools/filter/filter";
import Link from "next/link";
import { getClientOperators } from "@/services/api/client/operators/operatorsApiServices";
import { handleInitFilter, sortOffers } from "@/services/filter/filterServices";
import { getClientFormulas } from "@/services/api/formulas/formulasApiServices";
import { useRouter } from "next/router";

export default function ClientComparatorPage() {
  const { query } = useRouter();

  const [operators, setOperators] = useState(null);
  const [filter, setFilter] = useState([]);
  const [visibleOffer, setVisibleOffer] = useState(false);
  const [offer, setOffer] = useState(null);
  const [offers, setOffers] = useState([]);
  const [filterOffers, setFilterOffers] = useState(null);
  const [typeOffer, setTypeOffer] = useState(null);
  const [beginFilter, setBeginFilter] = useState(false);

  const [showError, setShowError] = useState(false);
  const [selectedOperators, setSelectedOperators] = useState(null);

  const [clientFormulas, setClientFormulas] = useState(null);
  const [sideControl, setSideControl] = useState(null);

  const [filter2, setFitler2] = useState();
  const [search, setSearch] = useState(null);

  const [initPage, setInitPage] = useState(false);

  useEffect(() => {
    initF();
  }, []);

  // useEffect(() => {
  //   if (offers) {
  //   }
  // }, [offers]);

  useEffect(() => {
    if (filter && clientFormulas) {
      const _offs = handleInitFilter(
        filter,
        clientFormulas,
        selectedOperators,
        sideControl,
      );
      setFilterOffers(_offs);
    }
    // BUGFIX: l'ancien tableau de dépendances était une expression booléenne
    // (`clientFormulas && (filter || selectedOperators)`) qui empêchait le
    // recalcul du filtre lors d'un changement de `sideControl` (Mon besoin /
    // Mon budget / National…). On liste désormais explicitement chaque
    // dépendance réellement utilisée dans l'effet.
  }, [clientFormulas, filter, selectedOperators, sideControl]);

  const onInputValueChange = (value, name) => {
    let _filter = { ...filter };

    _filter[`${name}`] = value;

    setFilter(_filter);
  };

  const initF = async () => {
    if (!operators) {
      const _operators = await getClientOperators();

      setOperators(_operators);
    }

    const _formulas = await getClientFormulas();
    setClientFormulas(Array.isArray(_formulas) ? _formulas : []);
    setInitPage(true);
  };

  // Formules toujours à jour : une offre validée définitivement pendant que le
  // comparateur est ouvert apparaît au retour sur l'onglet, et au plus tard
  // dans la minute, sans recharger la page (les filtres choisis sont conservés).
  useEffect(() => {
    const refresh = async () => {
      if (document.visibilityState !== "visible") return;
      const _formulas = await getClientFormulas();
      // Un échec réseau ne vide pas la liste affichée.
      if (Array.isArray(_formulas)) setClientFormulas(_formulas);
    };
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    const timer = setInterval(refresh, 60000);
    return () => {
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
      clearInterval(timer);
    };
  }, []);

  const initFilter = () => {
    let _filter = null;
    _filter = { ..._filter };

    // _filter["offerType"] = -1;
    _filter["category"] = -1;
    _filter["cTPrepay"] = true;
    _filter["cTPostpay"] = true;
    _filter["cTHybride"] = true;

    setFilter(_filter);
    setSelectedOperators(operators);
  };

  const onInputChange = (e, name) => {
    const val = (e.target && e.target.value) || "";
    let _filter = { ...filter };

    _filter[`${name}`] = val;

    setFilter(_filter);
  };

  const onInputSliderChange = (value1, value2, name1, name2) => {
    let _filter = { ...filter };

    _filter[`${name1}`] = value1;
    _filter[`${name2}`] = value2;

    setFilter(_filter);
  };

  const handleSearchByTitle = (s) => {
    setSearch(s);
    if (s?.length > 0) {
      let _offers = null;
      if (filterOffers) {
        _offers = filterOffers.filter((item) =>
          item.title.toLowerCase().includes(s.toLowerCase()),
        );
      } else {
        _offers = offers.filter((item) =>
          item.title.toLowerCase().includes(s.toLowerCase()),
        );
      }
      // alert('OK')
      setFilterOffers(_offers);
    } else {
      const _offs = handleInitFilter(
        filter,
        clientFormulas,
        selectedOperators,
        sideControl,
      );
      setFilterOffers(_offs);
    }
  };

  const handleInputCheckOffer = (e, name) => {
    let _filter = { ...filter };

    if (e.checked) {
      _filter[`${name}`] = true;
    } else {
      _filter[`${name}`] = false;
    }

    setFilter(_filter);
  };

  const handleShowOfferDialog = (offer) => {
    setOffer(offer);
    setVisibleOffer(true);
  };

  const handleFilterFormulas = (key) => {
    const _filter = { ...filter2 };
    if (key == "price") {
      _filter["validity"] = false;
      _filter["voice"] = false;
      _filter["sms"] = false;
      _filter["data"] = false;
    } else if (key == "validity") {
      _filter["price"] = false;
      _filter["voice"] = false;
      _filter["sms"] = false;
      _filter["data"] = false;
    } else if (key == "voice") {
      _filter["price"] = false;
      _filter["validity"] = false;
      _filter["sms"] = false;
      _filter["data"] = false;
    } else if (key == "sms") {
      _filter["price"] = false;
      _filter["validity"] = false;
      _filter["voice"] = false;
      _filter["data"] = false;
    } else if (key == "data") {
      _filter["price"] = false;
      _filter["validity"] = false;
      _filter["voice"] = false;
      _filter["sms"] = false;
    }

    _filter[key] = true;
    let _order = null;

    if (_filter[key + "Order"] == "asc") {
      _filter[key + "Order"] = "desc";
    } else {
      _filter[key + "Order"] = "asc";
    }
    // alert('OK')
    const _formulas = sortOffers(
      filterOffers ? filterOffers : clientFormulas,
      key,
      _filter[key + "Order"],
    );

    setFilterOffers(_formulas);
    setFitler2(_filter);
    // setFilter(_filter);

  };

  return (
    <>
      <ClientMainContainerPage
        activeHeader={"comparator"}
        children={
          <>
            <div className="bg-light" id="comparator">
              <div className="pt-2 container-fluid container-offer bg-image-font1">
                <div className="">
                  <div>
                    <div className="alert alert-info p-2 trans-fr">
                      <div className="block-title c-mt1 ">
                        Accédez à l’ensemble{" "}
                        <span className="text-primary">
                          des offres de service proposées
                        </span>{" "}
                        sur le marché des communications électroniques.
                        {/* Profitez des <span className="text-primary">offres de services disponibles</span> du marché des communications <span className="text">électroniques</span>  */}
                      </div>
                    </div>
                  </div>
                </div>
                <div className=" p-2  pt-0 c_main">
                  <div id="comparison-listing" className="">
                    <ComparatorSideBarComponent
                      initFilter={initFilter}
                      operators={operators}
                      filter={filter}
                      setFilter={setFilter}
                      onInputValueChange={onInputValueChange}
                      handleInputCheckOffer={handleInputCheckOffer}
                      onInputChange={onInputChange}
                      onInputSliderChange={onInputSliderChange}
                      typeOffer={typeOffer}
                      offers={offers}
                      setFilterOffers={setFilterOffers}
                      selectedOperators={selectedOperators}
                      setSelectedOperators={setSelectedOperators}
                      clientFormulas={clientFormulas}
                      sideControl={sideControl}
                      setSideControl={setSideControl}
                      query={query}
                      search={search}
                      handleSearchByTitle={handleSearchByTitle}
                    />

                    <ResultComponent
                      operators={operators}
                      beginFilter={beginFilter}
                      filter={filter}
                      filter2={filter2}
                      initPage={initPage}
                      typeOffer={typeOffer}
                      handleShowOfferDialog={handleShowOfferDialog}
                      setShowError={setShowError}
                      clientFormulas={
                        filterOffers ? filterOffers : clientFormulas
                      }
                      handleFilterFormulas={handleFilterFormulas}
                      handleSearchByTitle={handleSearchByTitle}
                      search={search}
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-white">
              <div
                className="container"
                style={{ paddingTop: 60, paddingBottom: 60 }}
              >
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
                      Compartic est une plateforme de comparaison d’offres
                      mobiles et fixes des opérateurs télécoms. Elle aide les
                      utilisateurs à trouver les offres adaptées à leurs besoins
                      et à leur budget. La plateforme permet de comparer
                      facilement les tarifs, la validité et les volumes de
                      services : appels, SMS et Internet. Elle met également en
                      avant les promotions et les avantages associés à chaque
                      offre.
                      <br />
                    </p>
                  </div>
                  <div className="col-lg-4">
                    <div className="card card-body bg-light p-5 text-center">
                      <h5 className="fw-normal">Commencer à</h5>
                      <Link
                        href="#comparator"
                        className="btn1 bg-success text-white mb-2"
                      >
                        Comparer les offres
                      </Link>
                      <p className="mb-0"></p>
                    </div>
                  </div>
                  {/* Right image side END */}
                  {/* Video START */}
                  {/* Video END */}
                </div>
              </div>
            </div>
            <OfferModalComponent
              display={visibleOffer}
              setDisplay={setVisibleOffer}
              offer={offer}
            />
            {/* <Error404ModalComponent display={showError} setDisplay={setShowError} /> */}
          </>
        }
      />
    </>
  );
}
