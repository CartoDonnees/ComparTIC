import { BASE_IMG_URL, imageUrl } from "@/services/tools/constants";
import {
  availableCountries,
  availableOrganizations,
} from "@/services/filter/zoneFilter";
import { Dialog } from "primereact/dialog";
import { Dropdown } from "primereact/dropdown";
import { InputNumber } from "primereact/inputnumber";
import { MultiSelect } from "primereact/multiselect";
import React, { useEffect } from "react";

export default function FilterModal({
  visible,
  setVisible,
  filter,
  operators,
  selectedOperators,
  panelFooterTemplate,
  sideControl,
  operatorsToShow,
  operatorTemplate,
  handleSideControlChhange,
  mainOrganisations,
  countries,
  selectedCountry,
  HandleChangeFilter,
  // Offres disponibles : alimentent les listes de zone et de pays.
  clientFormulas,
  setSelectedOperators,
  // BUGFIX: dix gestionnaires étaient APPELÉS par cette modale sans jamais y
  // être transmis. Chacun levait un ReferenceError au premier clic
  // (« onInputValueChange is not defined ») : hors du choix des opérateurs et
  // des zones, aucun filtre du panneau mobile ne fonctionnait.
  initFilter,
  initNational,
  HandleInitInervale,
  onInputValueChange,
  handleInputCheckOffer,
  handleSetBudget,
  handleSetPeriode,
  handleSetCallVolume,
  handleSetSMSVolume,
  handleSetDataVolume,
}) {
  useEffect(() => {
    // handleSetSBill('service','VOIX');
  }, []);

  useEffect(() => {
    if (visible) {
      onClick();
    } else {
      onHide();
    }
  }, [visible]);

  const onClick = (position) => {
    setVisible(true);
  };

  const onHide = (name) => {
    setVisible(false);
    // handleInitVar()
  };
  return (
    <Dialog
      header={<div>CRITERES DE RECHERCHE</div>}
      visible={visible}
      style={{ width: "90vw", marginLeft: 0 }}
      onHide={() => onHide(false)}
      headerStyle={{
        background: "rgb(30, 30, 30)", // Couleur de fond noire
        color: "white", // Couleur du texte blanc (ou autre couleur de texte lisible)
        padding: 5,
      }}
      position="left"
    >
      <div className="sidescroll p-0 filt1 w-100">
        <div className="wrapper filt1">
          <div className="container-ranges py-0">
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
                          HandleChangeFilter("cTPrepay", !filter?.cTPrepay);
                        }}
                      />
                      <label className="form-check-label" htmlFor="cTPrepay">
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
                          HandleChangeFilter("cTPostpay", !filter?.cTPostpay);
                        }}
                      />
                      <label className="form-check-label" htmlFor="cTPostpay">
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
                          HandleChangeFilter("cTHybride", !filter?.cTHybride);
                        }}
                      />
                      <label className="form-check-label" htmlFor="cTHybride">
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
                          onChange={(e) => setSelectedOperators(e.value)}
                          optionLabel="name"
                          placeholder="Sélectionné un ou plusieurs opérateur"
                          maxSelectedLabels={8}
                          className="w-100"
                          itemTemplate={operatorTemplate}
                          panelFooterTemplate={panelFooterTemplate}
                        />
                      </div>
                      <div
                        className={`d-flex trans-fl ${
                          selectedOperators?.length > 0 && "p-1 border"
                        } `}
                      >
                        {selectedOperators?.length > 0 &&
                          selectedOperators?.map((oper, i) => {
                            return (
                              <div className="">
                                {!filter?.randomOper && (
                                  <>
                                    <b className="">{i + 1}</b>
                                  </>
                                )}
                                <img
                                  alt={oper.name}
                                  src={imageUrl(oper?.imagePath)}
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
                handleSideControlChhange("national", !sideControl?.national);
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
                    <div>
                      <button
                        className={
                          sideControl?.need
                            ? "button-6 w-100 bg-success1 rouded-0"
                            : "button-6 w-100"
                        }
                        onClick={() => {
                          handleSideControlChhange("need", !sideControl?.need);
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
                                    onClick={() => handleSetCallVolume(0, 10)}
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
                                    onClick={() => handleSetCallVolume(10, 50)}
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
                                    onClick={() => handleSetCallVolume(50, 500)}
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
                                      filter?.call_volume_min === 1000 &&
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
                              <div className="label">Nombre de SMS :</div>
                              <div>
                                {(filter?.nb_sms_min || filter?.nb_sms_max) && (
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
                                  onInputValueChange(e.value, "nb_sms_min");
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
                                      onInputValueChange(e.value, "nb_sms_min");
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
                                    onClick={() => handleSetSMSVolume(0, 10)}
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
                                    onClick={() => handleSetSMSVolume(10, 50)}
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
                                    onClick={() => handleSetSMSVolume(50, 500)}
                                  />
                                  <label
                                    htmlFor={13}
                                    data-debt-amount2="50-100"
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
                                    data-debt-amount2="100-500"
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
                                    onClick={() => handleSetSMSVolume(1000, -1)}
                                  />
                                  <label
                                    htmlFor={15}
                                    data-debt-amount2="500-Illimités"
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
                                    onClick={() => handleSetDataVolume(0, 500)}
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
                                      filter?.data_volume_min === 1024 &&
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
                                      filter?.data_volume_min === 5120 &&
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
                                      filter?.data_volume_min === 10240 &&
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
                            <div className="label">Autres avantages</div>
                            <div className="" style={{ display: "block" }}>
                              <div className="flex align-items-center">
                                <div className="form-check">
                                  <input
                                    className="form-check-input"
                                    type="checkbox"
                                    defaultValue=""
                                    id="checkChecked"
                                    defaultChecked=""
                                    value={filter?.social_networks}
                                    checked={filter?.social_networks}
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
                              <div className="label">Budget (FCFA) :</div>
                              <div>
                                {(filter?.budg_min || filter?.budg_max) && (
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
                                  onInputValueChange(e.value, "budg_min");
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
                                  onInputValueChange(e.value, "budg_max");
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
                                    onClick={() => handleSetBudget(0, 500)}
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
                                    onClick={() => handleSetBudget(500, 1000)}
                                  />
                                  <label
                                    htmlFor={2}
                                    data-debt-amount="500F-F1k"
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
                                    onClick={() => handleSetBudget(1000, 5000)}
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
                                    onClick={() => handleSetBudget(5000, 10000)}
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
                                {(filter?.period_min || filter?.period_max) && (
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
                                  onInputValueChange(e.value, "period_min");
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
                                  onInputValueChange(e.value, "period_max");
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
                                    onClick={() => handleSetPeriode(0, 3)}
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
                                    onClick={() => handleSetPeriode(3, 7)}
                                  />
                                  <label
                                    htmlFor="period2"
                                    data-debt-amount="3-5 jrs"
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
                                    onClick={() => handleSetPeriode(7, 14)}
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
                                    onClick={() => handleSetPeriode(14, 30)}
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
                                    onClick={() => handleSetPeriode(30, 365)}
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
          <div>
            <button
              className="button-87 w-100 mt-2"
              role="button"
              onClick={() => {
                handleSideControlChhange("internat", !sideControl?.internat);
              }}
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
                {sideControl?.internat && (
                  <>
                    <div>
                      <button
                        title="Rénitialisez les filtres"
                        className=" btn btn-sm btn-warning p-0 px-1 me-2"
                        onClick={() => {
                          initFilter();
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
            {sideControl?.internat && !sideControl?.national && (
              <>
                <div className="wrapper ">
                  <div className="container-ranges pt-0 px-1 pb-2">
                    {/* Aide contextuelle (retour présentation ARTCI) */}
                    <div className="cmp-help-note" role="note">
                      <i className="bi bi-info-circle-fill" aria-hidden="true"></i>
                      <div>
                        <b>International</b> : offres pour joindre l'étranger
                        (appels, SMS, Internet) <b>depuis la Côte d'Ivoire</b>.
                      </div>
                    </div>
                    <div className="">
                      <div className="filter filter-range m-0 px-1 mb-2">
                        <label className="label">Zone</label>
                        {mainOrganisations && (
                          <>
                            <Dropdown
                              value={filter?.interMainorgs ?? null}
                              showClear
                              onChange={(e) => {
                                HandleChangeFilter("interMainorgs", e.value);
                                // Pays hors de la nouvelle zone : on l efface.
                                const next = availableCountries(
                                  clientFormulas,
                                  "INTERNATIONAL",
                                  e.value,
                                );
                                if (
                                  filter?.interCountry &&
                                  !next.some((c) => c?.id === filter.interCountry?.id)
                                ) {
                                  HandleChangeFilter("interCountry", null);
                                }
                              }}
                              options={mainOrganisations}
                              optionLabel="name"
                              placeholder="Sélectionnez une organisation"
                              className="w-100"
                            />
                          </>
                        )}
                      </div>
                      <div className="filter filter-range m-0 px-1">
                        <label className="label">Pays</label>
                        {countries && (
                          <>
                            <div className="p-small-dropdown ">
                              <Dropdown
                                value={filter?.interCountry ?? null}
                                showClear
                                emptyMessage="Aucun pays pour cette zone"
                                onChange={(e) => {
                                  HandleChangeFilter("interCountry", e.value);
                                }}
                                options={countries}
                                optionLabel="name"
                                placeholder="Selectionnez un pays"
                                filter
                                filterDelay={400}
                                // valueTemplate={selectedCountryTemplate}
                                // itemTemplate={countryOptionTemplate}
                                className="w-100"
                              />
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
          <div className="mb-2">
            <button
              className="button-87 w-100 mt-2"
              role="button"
              onClick={() => {
                handleSideControlChhange("roaming", !sideControl?.roaming);
              }}
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
                {sideControl?.roaming && (
                  <>
                    <div>
                      <button
                        title="Rénitialisez les filtres"
                        className=" btn btn-sm btn-warning p-0 px-1 me-2"
                        onClick={() => {
                          initFilter();
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
            {sideControl?.roaming && (
              <>
                <div className="wrapper">
                  <div className="container-ranges pt-2 px-2">
                    {/* Aide contextuelle (retour présentation ARTCI) */}
                    <div className="cmp-help-note" role="note">
                      <i className="bi bi-info-circle-fill" aria-hidden="true"></i>
                      <div>
                        <b>Roaming</b> : offres utilisables <b>lorsque vous
                        voyagez à l'étranger</b>, en conservant votre numéro ivoirien.
                      </div>
                    </div>
                    <div className="">
                      <div className="filter filter-range m-0 px-1 mb-2">
                        <label className="label">Zone</label>
                        {mainOrganisations && (
                          <>
                            {/* BUGFIX: la zone roaming écrivait dans la clé
                                "mainOrganisations", que le filtrage ne lisait
                                pas. Elle utilise désormais "roamMainorgs",
                                comme la version bureau. */}
                            <Dropdown
                              value={filter?.roamMainorgs ?? null}
                              onChange={(e) => {
                                HandleChangeFilter("roamMainorgs", e.value);
                                // Un pays hors de la nouvelle zone est retiré.
                                const next = availableCountries(
                                  clientFormulas,
                                  "ROAMING",
                                  e.value,
                                );
                                if (
                                  filter?.roamCountry &&
                                  !next.some((c) => c?.id === filter.roamCountry?.id)
                                ) {
                                  HandleChangeFilter("roamCountry", null);
                                }
                              }}
                              options={mainOrganisations}
                              optionLabel="name"
                              placeholder="Toutes les zones"
                              className="w-100"
                              showClear
                            />
                          </>
                        )}
                      </div>
                      <div className="filter filter-range m-0 px-1">
                        <label className="label">Pays visité</label>
                        <div className="p-small-dropdown">
                          {/* BUGFIX: cette liste appelait `setSelectedCountry`,
                              qui n existe PAS dans ce composant (elle n est pas
                              reçue en prop) : choisir un pays levait une
                              ReferenceError. Elle écrit maintenant dans le
                              filtre, comme la version bureau. */}
                          <Dropdown
                            value={filter?.roamCountry ?? null}
                            onChange={(e) =>
                              HandleChangeFilter("roamCountry", e.value)
                            }
                            options={availableCountries(
                              clientFormulas,
                              "ROAMING",
                              filter?.roamMainorgs,
                            )}
                            optionLabel="name"
                            placeholder="Tous les pays"
                            filter
                            filterDelay={300}
                            showClear
                            emptyMessage="Aucun pays pour cette zone"
                            className="w-100 "
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
          <button
            className="btn btn-search w-100 p-4 "
            role="button"
            onClick={() => onHide()}
          >
            <i className="bi bi-search" style={{ fontSize: 14 }}></i> Rechercher
          </button>
        </div>
      </div>
    </Dialog>
  );
}
