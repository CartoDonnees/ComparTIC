import { useEffect, useState } from "react";
import { Checkbox } from "primereact/checkbox";
import { Slider } from "primereact/slider";
import { handleNumThousand } from "@/services/tools/convertions";

import { InputNumber } from "primereact/inputnumber";
import { Calendar } from "primereact/calendar";
import Link from "next/link";
import {
  getClientMainOrganisations,
  getClientOrganizations,
} from "@/services/api/admin/organizations/organizationsApiServices";
import { getClientCountries } from "@/services/api/countries/countriesApiServices";
import { Dropdown } from "primereact/dropdown";
import { getOperator } from "@/services/api/client/operators/operatorsApiServices";
import { MultiSelect } from "primereact/multiselect";
import { BASE_IMG_URL, imageUrl } from "@/services/tools/constants";
import { toastWarning } from "@/componnents/notification/notification";
// BUGFIX: suppression de `import { setTimeout } from "timers"`   module Node
// importé par erreur dans un composant client (inutilisé, risque de bundle).
import { handleInitFilter } from "@/services/filter/filterServices";
import {
  availableCountries,
  availableOrganizations,
} from "@/services/filter/zoneFilter";
import FilterModal from "@/componnents/modal/filter/FilterModal";

export const ComparatorSideBarComponent = ({
  filter,
  setFilter,
  handleInputCheckOffer,
  onInputSliderChange,
  onInputValueChange,
  operators,
  selectedOperators,
  setSelectedOperators,
  sideControl,
  setSideControl,
  initFilter,
  query,
  search,
  handleSearchByTitle,
  // Offres réellement disponibles : elles alimentent les listes de zone
  // et de pays (voir plus bas), au lieu des référentiels complets.
  clientFormulas,
}) => {
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [selectedTypeOffer, setSelectedTypeOffer] = useState(null);

  const [operatorsToShow, setOperatorsToShow] = useState(null);

  const [mainOrganisations, setMainOrganisations] = useState(null);
  const [countries, setCountries] = useState(null);
  const [init1, setInit1] = useState(false);

  const [isMobile, setIsMobile] = useState(false);

  const [showFilterModal, setShowFilterModal] = useState(false);

  useEffect(() => {
    const checkScreen = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkScreen();

    window.addEventListener("resize", checkScreen);

    return () => {
      window.removeEventListener("resize", checkScreen);
    };
  }, []);

  useEffect(() => {
    if (operators) {
      init();
    }
  }, [operators]);

  useEffect(() => {
    if (sideControl) {
      const _filter = { ...filter };
      if (sideControl?.national) {
        if (sideControl?.need) {
          _filter["budg_min"] = null;
          _filter["budg_max"] = null;
          _filter["s_call"] = null;
          _filter["s_sms"] = null;
          _filter["s_data"] = null;
        } else if (sideControl?.budget) {
          _filter["call_volume_min"] = null;
          _filter["call_volume_max"] = null;
          _filter["nb_sms_min"] = null;
          _filter["nb_sms_max"] = null;
          _filter["data_volume_min"] = null;
          _filter["data_volume_max"] = null;
          _filter["social_networks"] = null;
        }
      } else {
        _filter["budg_min"] = null;
        _filter["budg_max"] = null;
        _filter["s_call"] = null;
        _filter["s_sms"] = null;
        _filter["s_data"] = null;

        _filter["call_volume_min"] = null;
        _filter["call_volume_max"] = null;
        _filter["nb_sms_min"] = null;
        _filter["nb_sms_max"] = null;
        _filter["data_volume_min"] = null;
        _filter["data_volume_max"] = null;
        _filter["social_networks"] = null;
      }
      // BUGFIX: l'effet construisait `_filter` mais ne l'appliquait jamais
      // (setFilter manquant) -> changer de zone (National/Inter/Roaming) ou de
      // mode (Besoin/Budget) ne réinitialisait pas les critères devenus
      // inactifs. On applique désormais le filtre nettoyé.
      setFilter(_filter);
    }
  }, [sideControl]);

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
      if (init1 == false) {
        setOperatorsToShow(ops);
        setInit1(true);
      }
      setSelectedOperators(ops);
    }
  }, [filter?.category]);

  const init = async () => {
    setSelectedOperators(operators);
    if (!mainOrganisations) {
      const _mOrgs = await getClientMainOrganisations();
      setMainOrganisations(_mOrgs);
    }
    if (!countries) {
      const _contries = await getClientCountries();

      setCountries(_contries);
    }

    if (operators) {
    }

    const _sideControl = { ...sideControl };
    _sideControl["national"] = true;

    const _filter = { ...filter };

    if (Number(query?.type) == 1) {
      _filter["category"] = 1; //MOBILE
    } else if (Number(query?.type) == 2) {
      _filter["category"] = 2; //FIXE
    } else {
      _filter["category"] = -1; //TOUTES LES CATEGORIES
    }
    _filter["offerType"] = -1; // TOUTES LES OFFRES
    _filter["clientType"] = 1; //PREPAYE
    _filter["randomOper"] = true; //PREPAYE

    setSideControl(_sideControl);
    setFilter(_filter);
    setSelectedTypeOffer(-1);
  };

  const initNational = () => {
    const _sideControl = { ...sideControl };
    const _filter = { ...filter };
    _filter["call_volume_min"] = null;
    _filter["call_volume_max"] = null;
    _filter["nb_sms_min"] = null;
    _filter["nb_sms_max"] = null;
    _filter["data_volume_min"] = null;
    _filter["data_volume_max"] = null;

    _filter["budg_min"] = null;
    _filter["budg_max"] = null;
    _filter["period_min"] = null;
    _filter["period_max"] = null;

    // Le bouton annonce « réinitialiser TOUS les critères » : les filtres de
    // zone (International / Roaming) en font partie et restaient actifs.
    _filter["interMainorgs"] = null;
    _filter["interCountry"] = null;
    _filter["roamMainorgs"] = null;
    _filter["roamCountry"] = null;
    setSelectedCountry(null);

    _sideControl["need"] = false;
    _sideControl["budget"] = false;

    setFilter(_filter);
    setSideControl(_sideControl);
  };

  // ---- Filtres de zone (International / Roaming) ---------------------------
  // Préfixes : "inter" -> interMainorgs / interCountry
  //            "roam"  -> roamMainorgs  / roamCountry

  /** Nombre de critères actifs, affiché en pastille sur l'en-tête du panneau. */
  const interActiveCount =
    (filter?.interMainorgs ? 1 : 0) + (filter?.interCountry ? 1 : 0);
  const roamActiveCount =
    (filter?.roamMainorgs ? 1 : 0) + (filter?.roamCountry ? 1 : 0);

  /**
   * Options dérivées des OFFRES DISPONIBLES (et non des référentiels).
   *
   * Auparavant les listes proposaient toutes les organisations et les ~200 pays
   * du monde : on pouvait choisir une zone ou un pays qu'aucune offre ne
   * couvre, et se retrouver sans résultat sans comprendre pourquoi.
   *
   * La liste des pays dépend en outre de la zone géographique retenue.
   */
  const interOrgOptions = availableOrganizations(
    clientFormulas,
    "INTERNATIONAL",
  );
  const roamOrgOptions = availableOrganizations(clientFormulas, "ROAMING");

  /** Nombre d offres disponibles dans chaque zone, pour l état vide. */
  const countInZone = (zone) =>
    (Array.isArray(clientFormulas) ? clientFormulas : []).filter(
      (x) => x?.offer?.area?.title === zone,
    ).length;
  const interZoneCount = countInZone("INTERNATIONAL");
  const roamZoneCount = countInZone("ROAMING");

  const interCountryOptions = availableCountries(
    clientFormulas,
    "INTERNATIONAL",
    filter?.interMainorgs,
  );
  const roamCountryOptions = availableCountries(
    clientFormulas,
    "ROAMING",
    filter?.roamMainorgs,
  );

  /**
   * Changement de zone géographique.
   * Si le pays déjà sélectionné n'appartient pas à la nouvelle zone, on le
   * retire : le laisser produirait une combinaison sans résultat, sans que
   * l'utilisateur comprenne pourquoi.
   */
  const handleZoneOrgChange = (prefix, organization) => {
    const orgKey = prefix === "inter" ? "interMainorgs" : "roamMainorgs";
    const countryKey = prefix === "inter" ? "interCountry" : "roamCountry";

    const zone = prefix === "inter" ? "INTERNATIONAL" : "ROAMING";
    const nextCountries = availableCountries(
      clientFormulas,
      zone,
      organization,
    );
    const current = filter?.[countryKey];
    const stillValid =
      !current || nextCountries.some((c) => c?.id === current?.id);

    const _filter = { ...filter };
    _filter[orgKey] = organization ?? null;
    if (!stillValid) _filter[countryKey] = null;
    setFilter(_filter);
  };

  /** Efface les critères d'un seul panneau (et non tout le formulaire). */
  const resetZone = (prefix) => {
    const _filter = { ...filter };
    if (prefix === "inter") {
      _filter["interMainorgs"] = null;
      _filter["interCountry"] = null;
    } else {
      _filter["roamMainorgs"] = null;
      _filter["roamCountry"] = null;
      setSelectedCountry(null);
    }
    setFilter(_filter);
  };

  const HandleChangeFilter = (name, value) => {
    let _filter = { ...filter };
    _filter[name] = value;
    setFilter(_filter);
  };

  const HandleInitInervale = (name1, name2) => {
    let _filter = { ...filter };
    _filter[name1] = null;
    _filter[name2] = null;
    setFilter(_filter);
  };

  const handleSideControlChhange = (name, value) => {
    const _sideControl = { ...sideControl };
    _sideControl[name] = value;

    if (name == "need" && value == true) {
      _sideControl["budget"] = false;
    }
    if (name == "budget" && value == true) {
      _sideControl["need"] = false;
    }

    if (name == "national" && value == true) {
      _sideControl["internat"] = false;
      _sideControl["roaming"] = false;
    } else if (name == "internat" && value == true) {
      _sideControl["national"] = false;
      _sideControl["roaming"] = false;
    } else if (name == "roaming" && value == true) {
      _sideControl["national"] = false;
      _sideControl["internat"] = false;
    }

    setSideControl(_sideControl);
  };

  const handleSetBudget = (val1, val2) => {
    onInputSliderChange(val1, val2, "budg_min", "budg_max");
  };

  const handleSetPeriode = (val1, val2) => {
    onInputSliderChange(val1, val2, "period_min", "period_max");
  };

  const handleSetCallVolume = (val1, val2) => {
    onInputSliderChange(val1, val2, "call_volume_min", "call_volume_max");
  };

  const handleSetSMSVolume = (val1, val2) => {
    onInputSliderChange(val1, val2, "nb_sms_min", "nb_sms_max");
  };

  const handleSetDataVolume = (val1, val2) => {
    onInputSliderChange(val1, val2, "data_volume_min", "data_volume_max");
  };

  const operatorTemplate = (option) => {
    return (
      <div className="d-flex align-items-center">
        <img
          alt={option.name}
          src={imageUrl(option?.imagePath)}
          className={`mr-2 flag flag-${option.code.toLowerCase()}`}
          style={{ width: "20px" }}
        />{" "}
        <div>{option.name}</div>
      </div>
    );
  };

  const panelFooterTemplate = () => {
    const length = selectedOperators ? selectedOperators.length : 0;

    return (
      <div className="py-2 px-3 bg-light">
        <small>
          {/* BUGFIX: pluralisation -> produisait "opérateur(s)s sélectionné(s)" */}
          <b>{length}</b> opérateur{length > 1 ? "s" : ""} sélectionné
          {length > 1 ? "s" : ""}.
        </small>
      </div>
    );
  };

  return (
    <>
      <div className="comparison-filters mb-5">
        <div className="sidebar__inner position-relative ">
          <div className="d-flex">
            <div className=" align-content-center align-items-center align-self-center px-0 m-0 bx-sc2">
              <button
                className="btn filters-title m-0 bsc-11  "
                onClick={() => setShowFilterModal(true)}
              >
                <i className="bi bi-funnel me-2 fs-4 "></i>{" "}
                <span className="sp-fil">Critères de recherches</span>
                <span className="chevron me-5 sp-fil"></span>
              </button>
            </div>
            <div className="sch-fl w-100 ">
              <div className="input-group m-0 p-0 mb-2 trans-fr m-0 p-0 ">
                <input
                  type="text"
                  className="form-control m-0"
                  placeholder="Recherche par nom de l'offre..."
                  aria-label="Recherche par nom de l'offre"
                  onChange={(e) => handleSearchByTitle(e.target.value)}
                  // BUGFIX: input non contrôlé (`search` initial = null)
                  value={search || ""}
                />
                <div className="input-group-text">
                  <i className="fa fa-search"></i>
                </div>
              </div>
            </div>
          </div>
          {!isMobile ? (
            <>
              <div className="sidescroll p-0 filt1 w-100">
                <div className="wrapper filt1">
                  <div className="container-ranges px-1 py-0">
                    <div>
                      <div className="p-1">
                        <div className="form-group m-0 ">
                          <label className="form-label m-0 p-0 text-black">
                            <b>Type d'offre:</b>
                          </label>
                        </div>
                        <Dropdown
                          value={filter?.offerType}
                          onChange={(e) => {
                            HandleChangeFilter("offerType", e.value);
                          }}
                          options={[
                            { name: "Toutes les offres", value: -1 },
                            { name: "Offre de base", value: 1 },
                            { name: "Offres promotionnelles", value: 2 },
                          ]}
                          optionLabel="name"
                          placeholder="Sélectionner le type d'offre"
                          className="w-100"
                        />
                      </div>
                    </div>
                    <hr className="m-1 mb-2" />
                    <div className=" p-1 mb-1 mt-1 rounded">
                      <div className="filter filter-range m-0 mb-2">
                        <div className="d-flex justify-content-between">
                          <div className="">
                            <div className="label mb-1 text-black lbft1">
                              <b>Categorie :</b>
                            </div>
                            <div className="form-check">
                              <input
                                className="form-check-input"
                                type="radio"
                                id="cMobile"
                                name="category"
                                checked={filter?.category == 1}
                                onChange={(e) => {
                                  HandleChangeFilter("category", 1);
                                }}
                              />
                              <label
                                className="form-check-label cPointer"
                                htmlFor="cMobile"
                              >
                                Mobile
                              </label>
                            </div>
                            <div className="form-check">
                              <input
                                className="form-check-input me-2"
                                type="radio"
                                id="cFixed"
                                name="category"
                                checked={filter?.category == 2}
                                onChange={(e) => {
                                  HandleChangeFilter("category", 2);
                                }}
                              />
                              <label
                                className="form-check-label cPointer"
                                htmlFor="cFixed"
                              >
                                Fixe
                              </label>
                            </div>
                            <div className="form-check">
                              <input
                                className="form-check-input me-2"
                                type="radio"
                                id="cAll"
                                name="category"
                                checked={filter?.category == -1}
                                onChange={(e) => {
                                  HandleChangeFilter("category", -1);
                                }}
                              />
                              <label
                                className="form-check-label cPointer"
                                htmlFor="cAll"
                              >
                                Toutes
                              </label>
                            </div>
                          </div>
                          <div style={{ borderRight: "1px solid gray" }} />
                          <div className="">
                            <div className="label mb-0 mb-1 text-black lbft1">
                              <b>Type de client :</b>
                            </div>
                            <div className="form-check">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                id="cTPrepay"
                                name="cTPrepay"
                                checked={filter?.cTPrepay}
                                onChange={(e) => {
                                  HandleChangeFilter(
                                    "cTPrepay",
                                    !filter?.cTPrepay,
                                  );
                                }}
                              />
                              <label
                                className="form-check-label"
                                htmlFor="cTPrepay"
                              >
                                Pré-payé
                              </label>
                            </div>
                            <div className="form-check">
                              <input
                                className="form-check-input me-2"
                                type="checkbox"
                                id="cTPostpay"
                                name="cTPostpay"
                                checked={filter?.cTPostpay}
                                onChange={(e) => {
                                  HandleChangeFilter(
                                    "cTPostpay",
                                    !filter?.cTPostpay,
                                  );
                                }}
                              />
                              <label
                                className="form-check-label"
                                htmlFor="cTPostpay"
                              >
                                Post-payé
                              </label>
                            </div>
                            <div className="form-check">
                              <input
                                className="form-check-input me-2"
                                type="checkbox"
                                id="cTHybride"
                                name="cTHybride"
                                checked={filter?.cTHybride}
                                onChange={(e) => {
                                  HandleChangeFilter(
                                    "cTHybride",
                                    !filter?.cTHybride,
                                  );
                                }}
                              />
                              <label
                                className="form-check-label"
                                htmlFor="cTHybride"
                              >
                                Hybride
                              </label>
                            </div>
                          </div>
                        </div>
                      </div>
                      <hr className="p-0 m-0 mt-2" />
                      <div className="filter filter-range mt-2 border p-1 bg-light">
                        <div className="p-1">
                          <div className="form-group m-0 ">
                            <div className="d-flex justify-content-between">
                              <label className="form-label m-0 p-0 text-black">
                                <b>Operateurs: </b>
                                {/* (
                        <span
                          className="text-danger"
                          style={{ textTransform: "lowercase" }}
                        >
                          <small>* Dépendant de la catégorie</small>
                        </span>
                        ) */}
                              </label>
                              <div>
                                <div className="form-check">
                                  <label
                                    className="form-check-label"
                                    htmlFor="randomOper"
                                  >
                                    <small>Aléatoire</small>
                                  </label>
                                  <input
                                    className="form-check-input"
                                    type="checkbox"
                                    id="randomOper"
                                    name="randomOper"
                                    checked={filter?.randomOper}
                                    onChange={(e) => {
                                      HandleChangeFilter(
                                        "randomOper",
                                        !filter?.randomOper,
                                      );
                                    }}
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                          {operators && operatorsToShow && (
                            <>
                              <div className="slt-input trans-fr">
                                <MultiSelect
                                  value={
                                    Array.isArray(selectedOperators)
                                      ? selectedOperators
                                      : []
                                  }
                                  options={
                                    Array.isArray(operatorsToShow)
                                      ? operatorsToShow
                                      : []
                                  }
                                  onChange={(e) =>
                                    setSelectedOperators(e.value)
                                  }
                                  optionLabel="name"
                                  placeholder="Sélectionné un ou plusieurs opérateur"
                                  maxSelectedLabels={8}
                                  className="w-100"
                                  itemTemplate={operatorTemplate}
                                  panelFooterTemplate={panelFooterTemplate}
                                />
                              </div>
                              {filter?.randomOper && (
                                <>
                                  <div
                                    className={`d-flex trans-fl ${
                                      selectedOperators?.length > 0 &&
                                      "p-1 border"
                                    } `}
                                  >
                                    {selectedOperators?.length > 0 &&
                                      selectedOperators?.map((oper, i) => {
                                        return (
                                          // BUGFIX: ajout de la prop `key` (warning React)
                                          <div
                                            className=""
                                            key={"sel-op-" + (oper?.id ?? i)}
                                          >
                                            {!filter?.randomOper && (
                                              <>
                                                <b className="">{i + 1}</b>
                                              </>
                                            )}
                                            <img
                                              alt={oper.name}
                                              src={
                                                imageUrl(oper?.imagePath)
                                              }
                                              className={`mr-2 flag me-2 flag-${oper.code.toLowerCase()}`}
                                              style={{
                                                width: 30,
                                                height: 30,
                                                border: "0.1px solid black",
                                              }}
                                            />{" "}
                                          </div>
                                        );
                                      })}
                                  </div>
                                </>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="">
                  <div>
                    <button
                      className="button-87 w-100  mt-2"
                      role="button"
                      id="national"
                      onClick={() => {
                        handleSideControlChhange(
                          "national",
                          !sideControl?.national,
                        );
                      }}
                    >
                      <div className="d-flex justify-content-between">
                        <div className="d-flex justify-content-between w-100 me-5">
                          <div className="me-2">NATIONALE</div>
                          <div>
                            {sideControl?.national ? (
                              <>
                                <i className="fa fa-chevron-down"></i>
                              </>
                            ) : (
                              <>
                                <i className="fa fa-chevron-right"></i>
                              </>
                            )}
                          </div>
                        </div>
                        {sideControl?.national &&
                          ((sideControl?.need &&
                            (filter?.call_volume_max ||
                              filter?.call_volume_min ||
                              filter?.nb_sms_max ||
                              filter?.nb_sms_min ||
                              filter?.data_volume_max ||
                              filter?.data_volume_min)) ||
                            (sideControl?.budget &&
                              (filter?.budg_max ||
                                filter?.budg_min ||
                                filter?.period_max ||
                                filter?.period_min))) && (
                            <>
                              <div>
                                <button
                                  title="Rénitialisez les filtres"
                                  className=" btn btn-sm btn-warning p-0 px-1 me-2"
                                  onClick={() => {
                                    initNational();
                                  }}
                                >
                                  <i className="bi bi-arrow-clockwise"></i>
                                  {/* <i className="fa fa-xmark"></i> */}
                                  {/* <i className="bi bi-arrow-clockwise"></i> */}
                                </button>
                              </div>
                            </>
                          )}
                      </div>
                    </button>
                    {sideControl?.national && !sideControl?.internat && (
                      <>
                        <div className="wrapper ">
                          <div className="container-ranges pt-2 px-1 pb-2">
                            {/* Aide contextuelle (retour présentation ARTCI) */}
                            <div className="cmp-help-note" role="note">
                              <i
                                className="bi bi-info-circle-fill"
                                aria-hidden="true"
                              ></i>
                              <div>
                                <b>Nationale</b> : offres utilisables{" "}
                                <b>en Côte d'Ivoire</b> vers les réseaux locaux.
                                Affinez selon votre besoin ou votre budget.
                              </div>
                            </div>
                            <div>
                              <button
                                className={
                                  sideControl?.need
                                    ? "button-6 w-100 bg-success1 rouded-0"
                                    : "button-6 w-100"
                                }
                                onClick={() => {
                                  handleSideControlChhange(
                                    "need",
                                    !sideControl?.need,
                                  );
                                }}
                              >
                                <div className="d-flex justify-content-between w-100">
                                  <div>Mon Besoin</div>
                                  <div>
                                    <i className="fa fa-chevron-down ml-2"></i>
                                  </div>
                                </div>
                              </button>
                            </div>
                            {sideControl?.need && (
                              <>
                                <div className="p-1 border border-success mb-2 trans-fr">
                                  <div className="filter filter-range ">
                                    <div className="d-flex justify-content-between">
                                      <div className="label">
                                        Volume d'appel (Min) :
                                      </div>
                                      <div>
                                        {(filter?.call_volume_min ||
                                          filter?.call_volume_max) && (
                                          <>
                                            <button
                                              title="Rénitialisez les filtres"
                                              className=" btn btn-sm btn-warning p-0 px-1 mb-1"
                                              style={{ marginLeft: 10 }}
                                              onClick={() => {
                                                HandleInitInervale(
                                                  "call_volume_min",
                                                  "call_volume_max",
                                                );
                                              }}
                                            >
                                              <i className="bi bi-arrow-clockwise"></i>
                                              {/* <i className="fa fa-xmark"></i> */}
                                              {/* <i className="bi bi-arrow-clockwise"></i> */}
                                            </button>
                                          </>
                                        )}
                                      </div>
                                    </div>
                                    <div className="p-inputgroup flex-1">
                                      <span className="p-inputgroup-addon crit-content">
                                        De
                                      </span>
                                      <InputNumber
                                        placeholder="0"
                                        className="crit-content"
                                        value={filter?.call_volume_min}
                                        onChange={(e) => {
                                          onInputValueChange(
                                            e.value,
                                            "call_volume_min",
                                          );
                                        }}
                                      />
                                      <span className="p-inputgroup-addon crit-content">
                                        A
                                      </span>
                                      {filter?.call_volume_max == -1 ? (
                                        <>
                                          <div
                                            className="p-0 px-2 border"
                                            style={{ borderTopRightRadius: 8 }}
                                          >
                                            Illimité
                                          </div>
                                          {/* <InputNumber
                                      placeholder="0"
                                      className="crit-content"
                                      value={"Illimité"}
                                    /> */}
                                        </>
                                      ) : (
                                        <>
                                          <InputNumber
                                            placeholder="0"
                                            className="crit-content"
                                            value={filter?.call_volume_max}
                                            onChange={(e) => {
                                              onInputValueChange(
                                                e.value,
                                                "call_volume_max",
                                              );
                                            }}
                                          />
                                        </>
                                      )}
                                    </div>
                                    <div className="form-wrapper2">
                                      <form className="w-100">
                                        <div id="debt-amount-slider1">
                                          <input
                                            type="radio"
                                            name="debt-amount1"
                                            id={6}
                                            defaultValue={6}
                                            checked={
                                              filter?.call_volume_min === 0 &&
                                              filter?.call_volume_max === 10
                                            }
                                            required=""
                                            onClick={() =>
                                              handleSetCallVolume(0, 10)
                                            }
                                          />
                                          <label
                                            htmlFor={6}
                                            data-debt-amount1="< 10 min"
                                          />
                                          <input
                                            type="radio"
                                            name="debt-amount1"
                                            id={7}
                                            defaultValue={7}
                                            checked={
                                              filter?.call_volume_min === 10 &&
                                              filter?.call_volume_max === 50
                                            }
                                            required=""
                                            onClick={() =>
                                              handleSetCallVolume(10, 50)
                                            }
                                          />
                                          <label
                                            htmlFor={7}
                                            data-debt-amount1="10-50 min"
                                          />
                                          <input
                                            type="radio"
                                            name="debt-amount1"
                                            id={8}
                                            defaultValue={8}
                                            checked={
                                              filter?.call_volume_min === 50 &&
                                              filter?.call_volume_max === 500
                                            }
                                            required=""
                                            onClick={() =>
                                              handleSetCallVolume(50, 500)
                                            }
                                          />
                                          <label
                                            htmlFor={8}
                                            data-debt-amount1="50-500 min"
                                          />
                                          <input
                                            type="radio"
                                            name="debt-amount1"
                                            id={9}
                                            defaultValue={9}
                                            checked={
                                              filter?.call_volume_min === 500 &&
                                              filter?.call_volume_max === 1000
                                            }
                                            required=""
                                            onClick={() =>
                                              handleSetCallVolume(500, 1000)
                                            }
                                          />
                                          <label
                                            htmlFor={9}
                                            data-debt-amount1="500-1k min"
                                          />
                                          <input
                                            type="radio"
                                            name="debt-amount1"
                                            id={10}
                                            defaultValue={10}
                                            checked={
                                              filter?.call_volume_min ===
                                                1000 &&
                                              filter?.call_volume_max === -1
                                            }
                                            required=""
                                            onClick={() =>
                                              handleSetCallVolume(1000, -1)
                                            }
                                          />
                                          <label
                                            htmlFor={10}
                                            data-debt-amount1="1k- illimité"
                                          />
                                          <div id="debt-amount-pos1" />
                                        </div>
                                      </form>
                                    </div>
                                  </div>
                                  <hr className="p-0 m-0 mt-2" />
                                  <div className="filter filter-range">
                                    <div className="d-flex justify-content-between">
                                      <div className="label">
                                        Nombre de SMS :
                                      </div>
                                      <div>
                                        {(filter?.nb_sms_min ||
                                          filter?.nb_sms_max) && (
                                          <>
                                            <button
                                              title="Rénitialisez les filtres"
                                              className=" btn btn-sm btn-warning p-0 px-1 mb-1"
                                              style={{ marginLeft: 10 }}
                                              onClick={() => {
                                                HandleInitInervale(
                                                  "nb_sms_min",
                                                  "nb_sms_max",
                                                );
                                              }}
                                            >
                                              <i className="bi bi-arrow-clockwise"></i>
                                              {/* <i className="fa fa-xmark"></i> */}
                                              {/* <i className="bi bi-arrow-clockwise"></i> */}
                                            </button>
                                          </>
                                        )}
                                      </div>
                                    </div>
                                    <div className="p-inputgroup flex-1">
                                      <span className="p-inputgroup-addon crit-content">
                                        De
                                      </span>
                                      <InputNumber
                                        placeholder="0"
                                        className="crit-content"
                                        value={filter?.nb_sms_min}
                                        onChange={(e) => {
                                          onInputValueChange(
                                            e.value,
                                            "nb_sms_min",
                                          );
                                        }}
                                      />
                                      <span className="p-inputgroup-addon crit-content">
                                        A
                                      </span>

                                      {filter?.nb_sms_max == -1 ? (
                                        <>
                                          <div
                                            className="p-0 px-2 border"
                                            style={{ borderTopRightRadius: 8 }}
                                          >
                                            Illimité
                                          </div>
                                          {/* <InputNumber
                                      placeholder="0"
                                      className="crit-content"
                                      value={"Illimité"}
                                    /> */}
                                        </>
                                      ) : (
                                        <>
                                          <InputNumber
                                            placeholder="0"
                                            className="crit-content"
                                            value={filter?.nb_sms_max}
                                            onChange={(e) => {
                                              // BUGFIX: écrivait dans "nb_sms_min"
                                              // -> le champ "À" du nombre de SMS
                                              // ne mettait jamais à jour le max.
                                              onInputValueChange(
                                                e.value,
                                                "nb_sms_max",
                                              );
                                            }}
                                          />
                                        </>
                                      )}
                                    </div>
                                    <div className="form-wrapper3">
                                      <form className="w-100">
                                        <div id="debt-amount-slider2">
                                          <input
                                            type="radio"
                                            name="debt-amount2"
                                            id={11}
                                            defaultValue={11}
                                            checked={
                                              filter?.nb_sms_min === 0 &&
                                              filter?.nb_sms_max === 10
                                            }
                                            required=""
                                            onClick={() =>
                                              handleSetSMSVolume(0, 10)
                                            }
                                          />
                                          <label
                                            htmlFor={11}
                                            data-debt-amount2="< 10"
                                          />
                                          <input
                                            type="radio"
                                            name="debt-amount2"
                                            id={12}
                                            defaultValue={12}
                                            checked={
                                              filter?.nb_sms_min === 10 &&
                                              filter?.nb_sms_max === 50
                                            }
                                            required=""
                                            onClick={() =>
                                              handleSetSMSVolume(10, 50)
                                            }
                                          />
                                          <label
                                            htmlFor={12}
                                            data-debt-amount2="10-50"
                                          />
                                          <input
                                            type="radio"
                                            name="debt-amount2"
                                            id={13}
                                            defaultValue={13}
                                            checked={
                                              filter?.nb_sms_min === 50 &&
                                              filter?.nb_sms_max === 500
                                            }
                                            required=""
                                            onClick={() =>
                                              handleSetSMSVolume(50, 500)
                                            }
                                          />
                                          <label
                                            htmlFor={13}
                                            data-debt-amount2="50-500"
                                          />
                                          <input
                                            type="radio"
                                            name="debt-amount2"
                                            id={14}
                                            defaultValue={14}
                                            checked={
                                              filter?.nb_sms_min === 500 &&
                                              filter?.nb_sms_max === 1000
                                            }
                                            required=""
                                            onClick={() =>
                                              handleSetSMSVolume(500, 1000)
                                            }
                                          />
                                          <label
                                            htmlFor={14}
                                            data-debt-amount2="500-1k"
                                          />
                                          <input
                                            type="radio"
                                            name="debt-amount2"
                                            id={15}
                                            defaultValue={15}
                                            checked={
                                              filter?.nb_sms_min === 1000 &&
                                              filter?.nb_sms_max === -1
                                            }
                                            required=""
                                            onClick={() =>
                                              handleSetSMSVolume(1000, -1)
                                            }
                                          />
                                          <label
                                            htmlFor={15}
                                            data-debt-amount2="1k-Illimités"
                                          />
                                          <div id="debt-amount-pos2" />
                                        </div>
                                      </form>
                                    </div>
                                  </div>
                                  <hr className="p-0 m-0 mt-2" />
                                  <div className="filter filter-range">
                                    <div className="d-flex justify-content-between">
                                      <div className="label">
                                        Volume internet (Mo) :
                                      </div>
                                      <div>
                                        {(filter?.data_volume_min ||
                                          filter?.data_volume_max) && (
                                          <>
                                            <button
                                              title="Rénitialisez les filtres"
                                              className=" btn btn-sm btn-warning p-0 px-1 mb-1"
                                              style={{ marginLeft: 10 }}
                                              onClick={() => {
                                                HandleInitInervale(
                                                  "data_volume_min",
                                                  "data_volume_max",
                                                );
                                              }}
                                            >
                                              <i className="bi bi-arrow-clockwise"></i>
                                              {/* <i className="fa fa-xmark"></i> */}
                                              {/* <i className="bi bi-arrow-clockwise"></i> */}
                                            </button>
                                          </>
                                        )}
                                      </div>
                                    </div>
                                    <div className="p-inputgroup flex-1">
                                      <span className="p-inputgroup-addon crit-content">
                                        De
                                      </span>
                                      <InputNumber
                                        placeholder="0"
                                        className="crit-content"
                                        value={filter?.data_volume_min}
                                        onChange={(e) => {
                                          onInputValueChange(
                                            e.value,
                                            "data_volume_min",
                                          );
                                        }}
                                      />
                                      <span className="p-inputgroup-addon crit-content">
                                        A
                                      </span>
                                      {filter?.data_volume_max == -1 ? (
                                        <>
                                          <div
                                            className="p-0 px-2 border"
                                            style={{ borderTopRightRadius: 8 }}
                                          >
                                            Illimité
                                          </div>
                                          {/* <InputNumber
                                      placeholder="0"
                                      className="crit-content"
                                      value={"Illimité"}
                                    /> */}
                                        </>
                                      ) : (
                                        <>
                                          <InputNumber
                                            placeholder="0"
                                            className="crit-content"
                                            value={filter?.data_volume_max}
                                            onChange={(e) => {
                                              onInputValueChange(
                                                e.value,
                                                "data_volume_max",
                                              );
                                            }}
                                          />
                                        </>
                                      )}
                                    </div>
                                    <div className="form-wrapper4">
                                      <form className="w-100">
                                        <div id="debt-amount-slider3">
                                          <input
                                            type="radio"
                                            name="debt-amount3"
                                            id={16}
                                            defaultValue={16}
                                            checked={
                                              filter?.data_volume_min === 0 &&
                                              filter?.data_volume_max === 500
                                            }
                                            required=""
                                            onClick={() =>
                                              handleSetDataVolume(0, 500)
                                            }
                                          />
                                          <label
                                            htmlFor={16}
                                            data-debt-amount3="< 500 Mo"
                                          />
                                          <input
                                            type="radio"
                                            name="debt-amount3"
                                            id={17}
                                            defaultValue={17}
                                            checked={
                                              filter?.data_volume_min === 500 &&
                                              filter?.data_volume_max === 1024
                                            }
                                            required=""
                                            onClick={() =>
                                              handleSetDataVolume(500, 1024)
                                            }
                                          />
                                          <label
                                            htmlFor={17}
                                            data-debt-amount3="500Mo-1Go"
                                          />
                                          <input
                                            type="radio"
                                            name="debt-amount3"
                                            id={18}
                                            defaultValue={18}
                                            checked={
                                              filter?.data_volume_min ===
                                                1024 &&
                                              filter?.data_volume_max === 5120
                                            }
                                            required=""
                                            onClick={() =>
                                              handleSetDataVolume(1024, 5120)
                                            }
                                          />
                                          <label
                                            htmlFor={18}
                                            data-debt-amount3="1-5Go"
                                          />
                                          <input
                                            type="radio"
                                            name="debt-amount3"
                                            id={19}
                                            defaultValue={19}
                                            checked={
                                              filter?.data_volume_min ===
                                                5120 &&
                                              filter?.data_volume_max === 10240
                                            }
                                            required=""
                                            onClick={() =>
                                              handleSetDataVolume(5120, 10240)
                                            }
                                          />
                                          <label
                                            htmlFor={19}
                                            data-debt-amount3="5-10Go"
                                          />
                                          <input
                                            type="radio"
                                            name="debt-amount3"
                                            id={20}
                                            defaultValue={20}
                                            checked={
                                              filter?.data_volume_min ===
                                                10240 &&
                                              filter?.data_volume_max === -1
                                            }
                                            required=""
                                            onClick={() =>
                                              handleSetDataVolume(10240, -1)
                                            }
                                          />
                                          <label
                                            htmlFor={20}
                                            data-debt-amount3="10Go-Illimités"
                                          />
                                          <div id="debt-amount-pos3" />
                                        </div>
                                      </form>
                                    </div>
                                    {/* <div className="mt-3">
                                <Slider value={dataVolume} onChange={(e) => setDataVolume(e.value)} className="w-14rem" range />
                            </div> */}
                                  </div>
                                  <hr />
                                  <div className="filter filter-range">
                                    <div className="label">
                                      Autres avantages
                                    </div>
                                    <div
                                      className=""
                                      style={{ display: "block" }}
                                    >
                                      <div className="flex align-items-center">
                                        <div className="form-check">
                                          <input
                                            className="form-check-input"
                                            type="checkbox"
                                            id="checkChecked"
                                            // BUGFIX: suppression de `defaultChecked=""`
                                            // (valeur invalide) et de `value`/`defaultValue`
                                            // sur une case à cocher contrôlée par `checked`.
                                            checked={!!filter?.social_networks}
                                            onChange={(e) => {
                                              handleInputCheckOffer(
                                                e,
                                                "social_networks",
                                              );
                                            }}
                                          />
                                          <label
                                            className="form-check-label"
                                            htmlFor="checkChecked"
                                          >
                                            Réseaux sociaux
                                          </label>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </>
                            )}
                            <div className="mt-2">
                              <button
                                className={
                                  sideControl?.budget
                                    ? "button-6 w-100 bg-success1 rouded-0"
                                    : "button-6 w-100"
                                }
                                onClick={() => {
                                  handleSideControlChhange(
                                    "budget",
                                    !sideControl?.budget,
                                  );
                                }}
                              >
                                <div className="d-flex justify-content-between w-100">
                                  <div>Mon budget et mes préférences</div>
                                  <div>
                                    <i className="fa fa-chevron-down ml-2"></i>
                                  </div>
                                </div>
                              </button>
                            </div>
                            {sideControl?.budget && (
                              <>
                                <div className="p-2 border border-success trans-fr">
                                  <div className="filter filter-range">
                                    <div className="d-flex justify-content-between">
                                      <div className="label">
                                        Budget (FCFA) :
                                      </div>
                                      <div>
                                        {(filter?.budg_min ||
                                          filter?.budg_max) && (
                                          <>
                                            <button
                                              title="Rénitialisez les filtres"
                                              className=" btn btn-sm btn-warning p-0 px-1 mb-1"
                                              style={{ marginLeft: 10 }}
                                              onClick={() => {
                                                HandleInitInervale(
                                                  "budg_min",
                                                  "budg_max",
                                                );
                                              }}
                                            >
                                              <i className="bi bi-arrow-clockwise"></i>
                                              {/* <i className="fa fa-xmark"></i> */}
                                              {/* <i className="bi bi-arrow-clockwise"></i> */}
                                            </button>
                                          </>
                                        )}
                                      </div>
                                    </div>
                                    <div className="p-inputgroup flex-1">
                                      <span className="p-inputgroup-addon crit-content">
                                        De
                                      </span>
                                      <InputNumber
                                        placeholder="0"
                                        className="crit-content"
                                        value={filter?.budg_min}
                                        onChange={(e) => {
                                          onInputValueChange(
                                            e.value,
                                            "budg_min",
                                          );
                                        }}
                                      />
                                      <span className="p-inputgroup-addon crit-content">
                                        A
                                      </span>
                                      <InputNumber
                                        placeholder="0"
                                        className="crit-content"
                                        value={filter?.budg_max}
                                        onChange={(e) => {
                                          onInputValueChange(
                                            e.value,
                                            "budg_max",
                                          );
                                        }}
                                      />
                                    </div>
                                    <div className="w-100 form-wrapper1">
                                      <form className="w-100">
                                        <div id="debt-amount-slider">
                                          <input
                                            type="radio"
                                            name="debt-amount"
                                            id={1}
                                            defaultValue={1}
                                            checked={
                                              filter?.budg_min === 0 &&
                                              filter?.budg_max === 500
                                            }
                                            required=""
                                            onClick={() =>
                                              handleSetBudget(0, 500)
                                            }
                                          />
                                          <label
                                            htmlFor={1}
                                            data-debt-amount="< 500F"
                                          />
                                          <input
                                            type="radio"
                                            name="debt-amount"
                                            id={2}
                                            defaultValue={2}
                                            checked={
                                              filter?.budg_min === 500 &&
                                              filter?.budg_max === 1000
                                            }
                                            required=""
                                            onClick={() =>
                                              handleSetBudget(500, 1000)
                                            }
                                          />
                                          <label
                                            htmlFor={2}
                                            data-debt-amount="500F-1k F"
                                          />
                                          <input
                                            type="radio"
                                            name="debt-amount"
                                            id={3}
                                            defaultValue={3}
                                            required=""
                                            checked={
                                              filter?.budg_min === 1000 &&
                                              filter?.budg_max === 5000
                                            }
                                            onClick={() =>
                                              handleSetBudget(1000, 5000)
                                            }
                                          />
                                          <label
                                            htmlFor={3}
                                            data-debt-amount="1k-5k F"
                                          />
                                          <input
                                            type="radio"
                                            name="debt-amount"
                                            id={4}
                                            defaultValue={4}
                                            checked={
                                              filter?.budg_min === 5000 &&
                                              filter?.budg_max === 10000
                                            }
                                            required=""
                                            onClick={() =>
                                              handleSetBudget(5000, 10000)
                                            }
                                          />
                                          <label
                                            htmlFor={4}
                                            data-debt-amount="5k-10k F"
                                          />
                                          <input
                                            type="radio"
                                            name="debt-amount"
                                            id={5}
                                            defaultValue={5}
                                            checked={
                                              filter?.budg_min === 10000 &&
                                              filter?.budg_max === 100000
                                            }
                                            required=""
                                            onClick={() =>
                                              handleSetBudget(10000, 100000)
                                            }
                                          />
                                          <label
                                            htmlFor={5}
                                            data-debt-amount="10k-100k F"
                                          />
                                          <div id="debt-amount-pos" />
                                        </div>
                                      </form>
                                    </div>
                                  </div>
                                  <hr className="p-0 m-0 mt-2" />
                                  <div className="filter filter-range">
                                    <div className="d-flex justify-content-between">
                                      <div className="label">
                                        Validite de l'offre (jours) :
                                      </div>
                                      <div>
                                        {(filter?.period_min ||
                                          filter?.period_max) && (
                                          <>
                                            <button
                                              title="Rénitialisez les filtres"
                                              className=" btn btn-sm btn-warning p-0 px-1 mb-1"
                                              style={{ marginLeft: 10 }}
                                              onClick={() => {
                                                HandleInitInervale(
                                                  "period_min",
                                                  "period_max",
                                                );
                                              }}
                                            >
                                              <i className="bi bi-arrow-clockwise"></i>
                                              {/* <i className="fa fa-xmark"></i> */}
                                              {/* <i className="bi bi-arrow-clockwise"></i> */}
                                            </button>
                                          </>
                                        )}
                                      </div>
                                    </div>
                                    <div className="p-inputgroup flex-1">
                                      <span className="p-inputgroup-addon crit-content">
                                        De
                                      </span>
                                      <InputNumber
                                        placeholder="0"
                                        className="crit-content"
                                        value={filter?.period_min}
                                        onChange={(e) => {
                                          onInputValueChange(
                                            e.value,
                                            "period_min",
                                          );
                                        }}
                                      />
                                      <span className="p-inputgroup-addon crit-content">
                                        A
                                      </span>
                                      <InputNumber
                                        placeholder="0"
                                        className="crit-content"
                                        value={filter?.period_max}
                                        onChange={(e) => {
                                          onInputValueChange(
                                            e.value,
                                            "period_max",
                                          );
                                        }}
                                      />
                                      <span className="p-inputgroup-addon crit-content">
                                        <small>Jours</small>
                                      </span>
                                    </div>
                                    <div className="w-100 form-wrapper1">
                                      <form className="w-100">
                                        <div id="debt-amount-slider">
                                          <input
                                            type="radio"
                                            name="debt-amount"
                                            id="period1"
                                            defaultValue="period1"
                                            checked={
                                              filter?.period_min === 0 &&
                                              filter?.period_max === 3
                                            }
                                            onClick={() =>
                                              handleSetPeriode(0, 3)
                                            }
                                          />
                                          <label
                                            htmlFor="period1"
                                            data-debt-amount="< 3 jrs"
                                          />
                                          <input
                                            type="radio"
                                            name="debt-amount"
                                            id="period2"
                                            defaultValue="period2"
                                            checked={
                                              filter?.period_min === 3 &&
                                              filter?.period_max === 7
                                            }
                                            onClick={() =>
                                              handleSetPeriode(3, 7)
                                            }
                                          />
                                          <label
                                            htmlFor="period2"
                                            data-debt-amount="3-7 jrs"
                                          />
                                          <input
                                            type="radio"
                                            name="debt-amount"
                                            id="period3"
                                            defaultValue="period3"
                                            checked={
                                              filter?.period_min === 7 &&
                                              filter?.period_max === 14
                                            }
                                            onClick={() =>
                                              handleSetPeriode(7, 14)
                                            }
                                          />
                                          <label
                                            htmlFor="period3"
                                            data-debt-amount="7-14 jrs"
                                          />
                                          <input
                                            type="radio"
                                            name="debt-amount"
                                            id="period4"
                                            defaultValue="period4"
                                            checked={
                                              filter?.period_min === 14 &&
                                              filter?.period_max === 30
                                            }
                                            onClick={() =>
                                              handleSetPeriode(14, 30)
                                            }
                                          />
                                          <label
                                            htmlFor="period4"
                                            data-debt-amount="14 jrs - 1 mois"
                                          />
                                          <input
                                            type="radio"
                                            name="debt-amount"
                                            id="period5"
                                            defaultValue="period5"
                                            checked={
                                              filter?.period_min === 30 &&
                                              filter?.period_max === 365
                                            }
                                            onClick={() =>
                                              handleSetPeriode(30, 365)
                                            }
                                          />
                                          <label
                                            htmlFor="period5"
                                            data-debt-amount="1 mois - 1 an"
                                          />
                                          <div id="debt-amount-pos" />
                                        </div>
                                      </form>
                                    </div>
                                  </div>
                                  {/* <hr className="p-0 m-0 mt-2" />
                            <div className="filter filter-range">
                              <div className="label">SERVICES D'INTÉRÊT</div>
                              <div className="">
                                <div className="mb-2">
                                  <label htmlFor="scall" className="ml-2">
                                    Service n°1
                                  </label>
                                  <Dropdown
                                    value={filter?.mainOrganisations}
                                    onChange={(e) => {
                                      HandleChangeFilter(
                                        "mainOrganisations",
                                        e.value
                                      );
                                    }}
                                    options={[
                                      { name: "Appel", value: 1 },
                                      { name: "SMS", value: 2 },
                                      { name: "Internet", value: 3 },
                                    ]}
                                    optionLabel="name"
                                    className="w-100"
                                    placeholder="Sélectionner le 1er service d'intérêt"
                                  />
                                </div>
                                <div className="mb-2">
                                  <label htmlFor="scall" className="ml-2">
                                    Service n°2
                                  </label>
                                  <Dropdown
                                    value={filter?.mainOrganisations}
                                    onChange={(e) => {
                                      HandleChangeFilter(
                                        "mainOrganisations",
                                        e.value
                                      );
                                    }}
                                    options={[
                                      { name: "Appel", value: 1 },
                                      { name: "SMS", value: 2 },
                                      { name: "Internet", value: 3 },
                                    ]}
                                    optionLabel="name"
                                    className="w-100"
                                    placeholder="Sélectionner le 2eme service d'intérêt"
                                  />
                                </div>
                                <div className="">
                                  <label htmlFor="scall" className="ml-2">
                                    Service n°3
                                  </label>
                                  <Dropdown
                                    value={filter?.mainOrganisations}
                                    onChange={(e) => {
                                      HandleChangeFilter(
                                        "mainOrganisations",
                                        e.value
                                      );
                                    }}
                                    options={[
                                      { name: "Appel", value: 1 },
                                      { name: "SMS", value: 2 },
                                      { name: "Internet", value: 3 },
                                    ]}
                                    optionLabel="name"
                                    className="w-100"
                                    placeholder="Sélectionner le 3eme service d'intérêt"
                                  />
                                </div>
                              </div>
                            </div> */}
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                  {/* ==========================================================
                      ZONE INTERNATIONALE
                      Refonte : la zone et le pays choisis n étaient pris en
                      compte par aucun filtre (cf. services/filter/zoneFilter).
                      Les listes sont désormais reliées au filtre, la liste des
                      pays se restreint à la zone retenue, chaque critère est
                      effaçable et le panneau indique combien de critères sont
                      actifs.
                      ========================================================== */}
                  <div className="cmp-zone">
                    <button
                      className="button-87 w-100  mt-2"
                      role="button"
                      id="international"
                      onClick={() =>
                        handleSideControlChhange(
                          "internat",
                          !sideControl?.internat,
                        )
                      }
                    >
                      <div className="d-flex justify-content-between">
                        <div className="d-flex justify-content-between w-100 me-5">
                          <div className="me-2">INTERNATIONALE</div>
                          <div>
                            {sideControl?.internat ? (
                              <>
                                <i className="fa fa-chevron-down"></i>
                              </>
                            ) : (
                              <>
                                <i className="fa fa-chevron-right"></i>
                              </>
                            )}
                          </div>
                        </div>
                        {(sideControl?.interMainorgs ||
                          sideControl?.interCountry) && (
                          <>
                            <div>
                              <button
                                title="Rénitialisez les filtres"
                                className=" btn btn-sm btn-warning p-0 px-1 me-2"
                                onClick={() => resetZone("inter")}
                              >
                                <i className="bi bi-arrow-clockwise"></i>
                                {/* <i className="fa fa-xmark"></i> */}
                                {/* <i className="bi bi-arrow-clockwise"></i> */}
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </button>
                    {/* <button
                      type="button"
                      className={`button-87 w-100 ${sideControl?.internat ? "is-open" : ""}`}
                      aria-expanded={Boolean(sideControl?.internat)}
                      onClick={() =>
                        handleSideControlChhange(
                          "internat",
                          !sideControl?.internat,
                        )
                      }
                    >
                      <i
                        className="bi bi-globe2 cmp-zone__ico"
                        aria-hidden="true"
                      ></i>
                      <span className="cmp-zone__title">INTERNATIONALE</span>
                      {interActiveCount > 0 && (
                        <span
                          className="cmp-zone__count"
                          title="Critères actifs"
                        >
                          {interActiveCount}
                        </span>
                      )}
                      <i
                        className={`bi bi-chevron-down cmp-zone__caret ${sideControl?.internat ? "up" : ""}`}
                        aria-hidden="true"
                      ></i>
                    </button> */}

                    {sideControl?.internat && (
                      <div className="cmp-zone__body">
                        <div className="cmp-help-note" role="note">
                          <i
                            className="bi bi-info-circle-fill"
                            aria-hidden="true"
                          ></i>
                          <div>
                            <b>International</b> : offres pour joindre
                            l'étranger (appels, SMS, Internet){" "}
                            <b>depuis la Côte d'Ivoire</b>. Choisissez la zone
                            puis le pays de destination.
                          </div>
                        </div>

                        {/* État vide explicite : une liste déroulante vide
                            sans explication passe pour un dysfonctionnement. */}
                        {interZoneCount === 0 ? (
                          <div className="cmp-zone__empty">
                            <i className="bi bi-slash-circle me-1"></i>
                            Aucune offre internationale n'est actuellement
                            disponible.
                          </div>
                        ) : (
                          interOrgOptions.length === 0 && (
                            <div className="cmp-zone__empty">
                              <i className="bi bi-info-circle me-1"></i>
                              Les {interZoneCount} offres internationales
                              disponibles ne précisent pas de zone géographique.
                            </div>
                          )
                        )}

                        <label className="cmp-zone__label" htmlFor="inter-org">
                          Zone géographique
                        </label>
                        <Dropdown
                          inputId="inter-org"
                          value={filter?.interMainorgs ?? null}
                          onChange={(e) =>
                            handleZoneOrgChange("inter", e.value)
                          }
                          options={interOrgOptions}
                          optionLabel="name"
                          placeholder="Toutes les zones"
                          className="w-100 cmp-zone__field"
                          showClear
                          disabled={interOrgOptions.length === 0}
                          emptyMessage="Aucune zone renseignée sur les offres disponibles"
                        />

                        <label
                          className="cmp-zone__label"
                          htmlFor="inter-country"
                        >
                          Pays de destination
                        </label>
                        <Dropdown
                          inputId="inter-country"
                          value={filter?.interCountry ?? null}
                          onChange={(e) =>
                            HandleChangeFilter("interCountry", e.value)
                          }
                          options={interCountryOptions}
                          disabled={interCountryOptions.length === 0}
                          optionLabel="name"
                          placeholder="Tous les pays"
                          className="w-100 cmp-zone__field"
                          filter
                          filterDelay={300}
                          showClear
                          emptyMessage="Aucun pays disponible pour cette zone"
                        />

                        {interActiveCount > 0 && (
                          <button
                            type="button"
                            className="cmp-zone__reset"
                            onClick={() => resetZone("inter")}
                          >
                            <i className="bi bi-arrow-clockwise me-1"></i>
                            Effacer les critères internationaux
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* ==========================================================
                      ROAMING
                      La liste « Pays » n écrivait pas dans le filtre : elle
                      alimentait un état local jamais lu, et aucun filtrage
                      roaming n existait côté service.
                      ========================================================== */}
                  <div className="cmp-zone mb-2">
                    <button
                      className="button-87 w-100  mt-2"
                      role="button"
                      id="roaming"
                      onClick={() =>
                        handleSideControlChhange(
                          "roaming",
                          !sideControl?.roaming,
                        )
                      }
                    >
                      <div className="d-flex justify-content-between">
                        <div className="d-flex justify-content-between w-100 me-5">
                          <div className="me-2">ROAMING</div>
                          <div>
                            {sideControl?.roaming ? (
                              <>
                                <i className="fa fa-chevron-down"></i>
                              </>
                            ) : (
                              <>
                                <i className="fa fa-chevron-right"></i>
                              </>
                            )}
                          </div>
                        </div>
                        {(sideControl?.roamMainorgs ||
                          sideControl?.roamCountry) && (
                          <>
                            <div>
                              <button
                                title="Rénitialisez les filtres"
                                className=" btn btn-sm btn-warning p-0 px-1 me-2"
                                onClick={() => resetZone("roam")}
                              >
                                <i className="bi bi-arrow-clockwise"></i>
                                {/* <i className="fa fa-xmark"></i> */}
                                {/* <i className="bi bi-arrow-clockwise"></i> */}
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </button>
                    {/* <button
                      type="button"
                      className={`cmp-zone__head ${sideControl?.roaming ? "is-open" : ""}`}
                      aria-expanded={Boolean(sideControl?.roaming)}
                      onClick={() =>
                        handleSideControlChhange(
                          "roaming",
                          !sideControl?.roaming,
                        )
                      }
                    >
                      <i
                        className="bi bi-airplane cmp-zone__ico"
                        aria-hidden="true"
                      ></i>
                      <span className="cmp-zone__title">ROAMING</span>
                      {roamActiveCount > 0 && (
                        <span
                          className="cmp-zone__count"
                          title="Critères actifs"
                        >
                          {roamActiveCount}
                        </span>
                      )}
                      <i
                        className={`bi bi-chevron-down cmp-zone__caret ${sideControl?.roaming ? "up" : ""}`}
                        aria-hidden="true"
                      ></i>
                    </button> */}

                    {sideControl?.roaming && (
                      <div className="cmp-zone__body">
                        <div className="cmp-help-note" role="note">
                          <i
                            className="bi bi-info-circle-fill"
                            aria-hidden="true"
                          ></i>
                          <div>
                            <b>Roaming</b> : offres utilisables{" "}
                            <b>lorsque vous voyagez à l'étranger</b>, en
                            conservant votre numéro ivoirien sur le réseau d'un
                            opérateur partenaire.
                          </div>
                        </div>

                        {roamZoneCount === 0 ? (
                          <div className="cmp-zone__empty">
                            <i className="bi bi-slash-circle me-1"></i>
                            Aucune offre de roaming n'est actuellement
                            disponible.
                          </div>
                        ) : (
                          roamOrgOptions.length === 0 && (
                            <div className="cmp-zone__empty">
                              <i className="bi bi-info-circle me-1"></i>
                              Les {roamZoneCount} offres de roaming disponibles
                              ne précisent pas de zone géographique.
                            </div>
                          )
                        )}

                        <label className="cmp-zone__label" htmlFor="roam-org">
                          Zone géographique
                        </label>
                        <Dropdown
                          inputId="roam-org"
                          value={filter?.roamMainorgs ?? null}
                          onChange={(e) => handleZoneOrgChange("roam", e.value)}
                          options={roamOrgOptions}
                          optionLabel="name"
                          placeholder="Toutes les zones"
                          className="w-100 cmp-zone__field"
                          showClear
                          disabled={roamOrgOptions.length === 0}
                          emptyMessage="Aucune zone renseignée sur les offres disponibles"
                        />

                        <label
                          className="cmp-zone__label"
                          htmlFor="roam-country"
                        >
                          Pays visité
                        </label>
                        <Dropdown
                          inputId="roam-country"
                          value={filter?.roamCountry ?? null}
                          onChange={(e) => {
                            // BUGFIX: cette liste n alimentait qu un état local
                            // (`setSelectedCountry`) que rien ne lisait : le
                            // choix d un pays n avait aucun effet.
                            HandleChangeFilter("roamCountry", e.value);
                            setSelectedCountry(e.value);
                          }}
                          options={roamCountryOptions}
                          disabled={roamCountryOptions.length === 0}
                          optionLabel="name"
                          placeholder="Tous les pays"
                          className="w-100 cmp-zone__field"
                          filter
                          filterDelay={300}
                          showClear
                          emptyMessage="Aucun pays disponible pour cette zone"
                        />

                        {roamActiveCount > 0 && (
                          <button
                            type="button"
                            className="cmp-zone__reset"
                            onClick={() => resetZone("roam")}
                          >
                            <i className="bi bi-arrow-clockwise me-1"></i>
                            Effacer les critères roaming
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                  <button
                    className="btn btn-search w-100 p-4 "
                    role="button"
                    onClick={() => initNational()}
                  >
                    RENITIALISER TOUS LES CRITERES{" "}
                    <i
                      className="bi bi-arrow-clockwise"
                      style={{ fontSize: 14 }}
                    ></i>
                  </button>
                </div>
              </div>
            </>
          ) : (
            <>
              {operators && (
                <>
                  <FilterModal
                    visible={showFilterModal}
                    setVisible={setShowFilterModal}
                    filter={filter}
                    operators={operators}
                    selectedOperators={selectedOperators}
                    panelFooterTemplate={panelFooterTemplate}
                    sideControl={sideControl}
                    operatorsToShow={operatorsToShow}
                    operatorTemplate={operatorTemplate}
                    handleSideControlChhange={handleSideControlChhange}
                    mainOrganisations={mainOrganisations}
                    countries={countries}
                    clientFormulas={clientFormulas}
                    selectedCountry={selectedCountry}
                    HandleChangeFilter={HandleChangeFilter}
                    setSelectedOperators={setSelectedOperators}
                    initFilter={initFilter}
                    initNational={initNational}
                    HandleInitInervale={HandleInitInervale}
                    onInputValueChange={onInputValueChange}
                    handleInputCheckOffer={handleInputCheckOffer}
                    handleSetBudget={handleSetBudget}
                    handleSetPeriode={handleSetPeriode}
                    handleSetCallVolume={handleSetCallVolume}
                    handleSetSMSVolume={handleSetSMSVolume}
                    handleSetDataVolume={handleSetDataVolume}
                  />
                </>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
};
