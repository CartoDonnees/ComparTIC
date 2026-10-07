import { getServices } from "@/services/api/services/servicesApiServices";
import { Dialog } from "primereact/dialog";
import { TabPanel, TabView } from "primereact/tabview";
import React, { useEffect, useState } from "react";
import AddAdantageDialog from "./AddAdantageDialog";
import AlertAdvantageRemove from "./advantage/AlertAdvantageRemove";

export default function AddFormulaDialog({
  visible,
  setVisible,
  formula,
  setFormula,
  handleSubmitFormula,
  handleEdithFormula,
  services,
  keyForm,
  setKeyForm,
  isEdit,
  setIsEdit,
  offer,
}) {
  const [formulaType, setFormulaType] = useState("price");
  const [serviceSelected, setServiceSelected] = useState(null);

  const [sBill, setSBill] = useState(null);
  const [sPrice, setSPrice] = useState(null);
  const [sPriceServices, setSPriceServices] = useState(null);

  const [showAdvantageDaialog, setShowAdvantageDaialog] = useState(false);
  const [showAlertAdvRemove, setShowAlertAdvRemove] = useState(false);

  const [advantage, setAdvantage] = useState(null);

  useEffect(() => {
    // handleSetSBill('service','VOIX')
  }, []);

  useEffect(() => {
    if (visible) {
      onClick();
    } else {
      onHide();
    }
  }, [visible]);

  useEffect(() => {
    if (sPrice && formula?.type === "price") {
      const _formula = { ...formula };
      _formula["settlement"] = sPrice;
      setFormula(_formula);
    }
  }, [sPrice]);

  useEffect(() => {
    if (sBill && formula?.type === "bill") {
      const _formula = { ...formula };
      _formula["settlement"] = sBill;
      setFormula(_formula);
    }
  }, [sBill]);

  useEffect(() => {
    if (sPriceServices) {
      const _sPrice = { ...sPrice };
      _sPrice["services"] = sPriceServices;
      setSPrice(_sPrice);
    }
  }, [sPriceServices]);

  const onClick = (position) => {
    const _formula = { ...formula };
    if (!_formula?.key) {
      _formula["type"] = "price";
      _formula["key"] = Date.now();
      setFormula(_formula);
    } else {
      if (_formula?.settlement) {
        _formula["isDetails"] = true;
        if (_formula?.type == "price") {
          setFormulaType("price");
          setSPrice(_formula?.settlement);
          setSPriceServices(_formula?.settlement?.services);
        } else if (_formula?.type == "bill") {
          setFormulaType("bill");
          setSBill(_formula?.settlement);
        }
        setFormula(_formula);
      }
    }
    setVisible(true);
  };

  const onHide = (name) => {
    setKeyForm(null);
    setSBill(null);
    setVisible(false);
    setSPrice(null);
    setSPriceServices(null);
    setSBill(null);
    setIsEdit(false);
    setFormula(null);
    // handleInitVar()
  };

  const onInputChange = (name, value) => {
    let _formula = { ...formula };
    if (name == "type") {
      _formula["advantage"] = false;
    }
    _formula[`${name}`] = value;

    setFormula(_formula);
  };

  const handleSPriceService = (name, value) => {
    const _s = null;
    const _sPriceServices = { ...sPriceServices };
    _sPriceServices[name] = value;
    if ((name == "VOIX" || name == "SMS" || name == "DATA") && value == false) {
      _sPriceServices["price" + name] = false;
      _sPriceServices["quantity" + name] = null;
      _sPriceServices["bStep" + name] = null;
      setSPriceServices(_sPriceServices);
      return;
    }
    setSPriceServices(_sPriceServices);
  };

  const handleSetSPrice = (name, value) => {
    const _sPrice = { ...sPrice };
    _sPrice[name] = value;
    setSPrice(_sPrice);
  };

  const handleSelectService = (name, value) => {
    const _service = { ...serviceSelected };
    _service[name] = value;
  };

  const handleSetSBill = (name, value) => {
    const _sBill = { ...sBill };
    _sBill[name] = value;
    setSBill(_sBill);
  };

  const handleInitAddAdvantage = () => {
    setShowAdvantageDaialog(true);
  };

  const handleInitEditAdvantage = (adv) => {
    setAdvantage(adv);
    setShowAdvantageDaialog(true);
  };

  const updateAdvantage = (advs) => {
    return advs.map((adv) => {
      if (adv?.key == advantage?.key) {
        return { ...adv, ...advantage };
      }
      return adv;
    });
  };
  const handleEditAdvantage = () => {
    const _advs = updateAdvantage(formula?.advantages);
    onInputChange("advantages", _advs);
    setAdvantage(null);
    setShowAdvantageDaialog(false);
  };

  const handleInitAdvantage = (adv) => {
    setAdvantage(adv);
    setShowAlertAdvRemove(true);
  };

  const removeAdvantage = (key) => {
    const _advs = formula?.advantages?.filter((item) => item.key != key);
    if (_advs) {
      onInputChange("advantages", _advs);
      setShowAlertAdvRemove(false);
    }
  };

  const changeFormulaType = (t) => {
    const _formula = { ...formula };
    _formula["settlement"] = null;
    _formula["type"] = t;
    setFormula(_formula);
    setFormulaType(t);
  };

  return (
    <Dialog
      header={
        <h5>
          {!isEdit ? (
            <div>
              AJOUTER UNE FORMULE DE <em>
                <u>{offer?.title}</u>
              </em>
            </div>
          ) : (
            <div>
              MODIFIER UNE FORMULE DE <em><u> {offer?.title}</u></em>
            </div>
          )}
        </h5>
      }
      visible={visible}
      style={{ width: formula?.isDetails ? "90vw" : "50vw" }}
      onHide={() => onHide(false)}
      headerStyle={{
        background: "#343A3F", // Couleur de fond noire
        color: "white", // Couleur du texte blanc (ou autre couleur de texte lisible)
        padding: 10,
      }}
      footer={
        <div className="">
          <hr />

          {!isEdit ? (
            <>
              <button
                className="btn w-100 btn-success"
                onClick={() => handleSubmitFormula(keyForm)}
              >
                <i className="fa fa-save me-2"></i>Enregistrer
              </button>
            </>
          ) : (
            <>
              <button
                className="btn btn-info w-100"
                onClick={() => handleEdithFormula(keyForm)}
              >
                <i className="fa fa-save me-2"></i>Enregistrer les modification
                de la formule
              </button>
            </>
          )}
        </div>
      }
    >
      <div className=" pt-2">
        <div className="w-100">
          <div className="form-group mb-2 w-100">
            <label htmlFor="lname">
              Nom de la formule <span className="text-danger">*</span>
            </label>
            <input
              id="lname"
              type="text"
              className="form-control w-100"
              placeholder="Saisir le nom de l'offre"
              required
              style={{ width: 500 }}
              value={formula?.title}
              onChange={(e) => onInputChange("title", e.target.value)}
            />
          </div>
          <div className="bg-light mb-4">
            <input
              id="isDetails"
              className="me-2 "
              type="checkbox"
              name="flexRadioDefault"
              checked={formula?.isDetails}
              onChange={(e) => onInputChange("isDetails", !formula?.isDetails)}
            />
            <label className="form-check-label d-inline " htmlFor="isDetails">
              <b>Détails de la formule </b>
            </label>
          </div>
        </div>
        {formula?.isDetails && (
          <>
            <div className="border rounded-0 p-1 w-100">
              <div>
                <u>
                  <em>
                    <b>DETAILS DE LA FORMULE :</b>
                  </em>
                </u>
              </div>
              <div className="bg-primary11 px-1 py-2">
                <div className="row p-0">
                  <div className="col-md-6 pl-0 mr-0">
                    {formula?.type == "price" ? (
                      <>
                        <div className="text-center text-primary">
                          <b>PRIX</b>
                        </div>
                        <hr className="m-1 w-100 border border-primary" />
                      </>
                    ) : (
                      <>
                        <button
                          className="btn btn-secondary w-100 rounded-0"
                          onClick={(e) => {
                            changeFormulaType("price");
                          }}
                        >
                          PRIX
                        </button>
                      </>
                    )}
                  </div>
                  <div className="col-md-6 pr-0 mr-0">
                    {formula?.type == "bill" ? (
                      <>
                        <div className="text-center text-primary">
                          <b>TARIF</b>
                        </div>
                        <hr className="m-1 w-100 border border-primary" />
                      </>
                    ) : (
                      <>
                        <button
                          className="btn btn-secondary w-100 rounded-0"
                          onClick={(e) => {
                            changeFormulaType("bill");
                          }}
                        >
                          TARIF
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="border p-2 bg-light">
              {formula?.type == "price" && (
                <>
                  <div className="row">
                    <div className="col-md-7">
                      <label htmlFor="lname">
                        Prix de la formule :
                        <span className="text-danger">*</span>
                      </label>
                      <div className="input-group mb-3">
                        <input
                          type="number"
                          className="form-control"
                          placeholder="Saisir le prix de la formule"
                          value={sPrice?.price}
                          onChange={(e) =>
                            handleSetSPrice("price", e.target.value)
                          }
                        />
                        <span className="input-group-text" id="basic-addon2">
                          F CFA
                        </span>
                      </div>
                    </div>
                    <div className="col-md-5">
                      <label htmlFor="lname">
                        Validitée : <span className="text-danger">*</span>
                      </label>
                      <div className="input-group mb-3">
                        <input
                          type="number"
                          className="form-control"
                          placeholder="Saisir le nombre de "
                          value={sPrice?.validity}
                          onChange={(e) =>
                            handleSetSPrice("validity", e.target.value)
                          }
                        />
                        <span className="input-group-text" id="basic-addon2">
                          Jour
                        </span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="row">
                      {services &&
                        services?.map((s, i) => {
                          return (
                            <React.Fragment key={"ss" + i}>
                              <div className="col-md-4 ">
                                <div className="border p-1 rounded">
                                  <label
                                    htmlFor={"ser" + i}
                                    className="d-flex justify-content-center"
                                  >
                                    <a
                                      className=""
                                      style={{
                                        borderRadius: 8,
                                        cursor: "pointer",
                                      }}
                                      onClick={() => {}}
                                    >
                                      {s?.code == "SER-001" && (
                                        <>
                                          <img
                                            src="/images/icons/voice.png"
                                            alt=""
                                            style={{ height: 50 }}
                                          />
                                        </>
                                      )}
                                      {s?.code == "SER-010" && (
                                        <>
                                          <img
                                            src="/images/icons/sms.png"
                                            alt=""
                                            style={{ height: 50 }}
                                          />
                                        </>
                                      )}
                                      {s?.code == "SER-100" && (
                                        <>
                                          <img
                                            src="/images/icons/data.png"
                                            alt=""
                                            style={{ height: 50 }}
                                          />
                                        </>
                                      )}
                                    </a>
                                  </label>
                                  <div className="d-flex justify-content-center">
                                    <input
                                      className="me-2"
                                      type="checkbox"
                                      id={"ser" + i}
                                      name="flexRadioDefault"
                                      defaultValue={s?.title}
                                      value={s?.title}
                                      checked={sPriceServices?.[s?.title]}
                                      onChange={(e) =>
                                        handleSPriceService(
                                          s?.title,
                                          e.target.checked
                                        )
                                      }
                                    />
                                    <label
                                      className="form-check-label d-inline "
                                      htmlFor="checkD0"
                                    >
                                      <b>{s?.title} </b>
                                    </label>
                                  </div>
                                  {sPriceServices?.[s?.title] && (
                                    <>
                                      <hr className="m-1" />
                                      <div className="form-group mb-2">
                                        <label
                                          htmlFor={"servi" + i}
                                          style={{ fontSize: 12 }}
                                        >
                                          <b>
                                            {s?.code == "SER-001" && (
                                              <>
                                                <small>Minutes appels </small> :
                                              </>
                                            )}
                                            {s?.code == "SER-010" && (
                                              <>
                                                <small>Nombre de SMS</small> :
                                              </>
                                            )}
                                            {s?.code == "SER-100" && (
                                              <>
                                                <small>Nombre de Mo</small> :
                                              </>
                                            )}
                                          </b>
                                          <span className="text-danger">*</span>
                                        </label>
                                        <input
                                          type="number"
                                          id={"servi" + i}
                                          className="form-control form-control-sm"
                                          min=""
                                          placeholder="Saisir le nombre"
                                          value={
                                            sPriceServices?.[
                                              "quantity" + s?.title
                                            ]
                                          }
                                          onChange={(e) =>
                                            handleSPriceService(
                                              "quantity" + s?.title,
                                              e.target.value
                                            )
                                          }
                                        />
                                      </div>
                                      <hr className="m-1" />
                                      <div>
                                        <label
                                          htmlFor="lname"
                                          style={{ fontSize: 12 }}
                                        >
                                          Pas de facturation :
                                        </label>
                                        <div className="input-group">
                                          <input
                                            type="number"
                                            placeholder="Saisir le pas"
                                            className="form-control form-control-sm"
                                            value={
                                              sPriceServices?.[
                                                "bStep" + s?.title
                                              ]
                                            }
                                            onChange={(e) =>
                                              handleSPriceService(
                                                "bStep" + s?.title,
                                                e.target.value
                                              )
                                            }
                                          />
                                          <span
                                            className="input-group-text p-1"
                                            id="basic-addon2"
                                          >
                                            {s?.code == "SER-001" && (
                                              <>
                                                <small>/ Min</small>
                                              </>
                                            )}
                                            {s?.code == "SER-010" && (
                                              <>
                                                <small style={{ fontSize: 10 }}>
                                                  / Caractères
                                                </small>
                                              </>
                                            )}
                                            {s?.code == "SER-100" && (
                                              <>
                                                <small>/ Mo</small>
                                              </>
                                            )}
                                          </span>
                                        </div>
                                      </div>
                                      {s?.code != "SER-100" && (
                                        <>
                                          <hr className="m-1" />
                                          <div>
                                            <label
                                              htmlFor="lname"
                                              style={{ fontSize: 12 }}
                                            >
                                              <b>Type communication :</b>
                                              {
                                                formula?.settlement?.services?.[
                                                  "comType" + s?.title
                                                ]
                                              }
                                            </label>
                                            <div className="row">
                                              <div className="col-md-4">
                                                <div className=" form-group bg-light p-1">
                                                  <input
                                                    id={"onNet" + s?.title}
                                                    className="me-2"
                                                    type="radio"
                                                    name={"comType" + s?.title}
                                                    value={
                                                      formula?.settlement
                                                        ?.services?.[
                                                        "comType" + s?.title
                                                      ]
                                                    }
                                                    checked={
                                                      formula?.settlement
                                                        ?.services?.[
                                                        "comType" + s?.title
                                                      ] == "ON_NET"
                                                    }
                                                    onChange={(e) =>
                                                      handleSPriceService(
                                                        "comType" + s?.title,
                                                        "ON_NET"
                                                      )
                                                    }
                                                  />
                                                  <label
                                                    className="form-check-label d-inline "
                                                    htmlFor="onNet"
                                                  >
                                                    <small
                                                      style={{ fontSize: 12 }}
                                                    >
                                                      On net
                                                    </small>
                                                  </label>
                                                </div>
                                              </div>
                                              <div className="col-md-4">
                                                <div className=" form-group bg-light p-1">
                                                  <input
                                                    id={"offNet" + s?.title}
                                                    className="me-2 "
                                                    type="radio"
                                                    name={"comType" + s?.title}
                                                    value="offNet"
                                                    checked={
                                                      formula?.settlement
                                                        ?.services?.[
                                                        "comType" + s?.title
                                                      ] == "OFF_NET"
                                                    }
                                                    onChange={(e) =>
                                                      handleSPriceService(
                                                        "comType" + s?.title,
                                                        "OFF_NET"
                                                      )
                                                    }
                                                  />
                                                  <label
                                                    className="form-check-label d-inline "
                                                    htmlFor="offNet"
                                                  >
                                                    <small
                                                      style={{ fontSize: 12 }}
                                                    >
                                                      Off net
                                                    </small>
                                                  </label>
                                                </div>
                                              </div>
                                              <div className="col-md-4">
                                                <div className=" form-group bg-light p-1">
                                                  <input
                                                    id={"allNet" + s?.title}
                                                    className="me-2 "
                                                    type="radio"
                                                    name={"comType" + s?.title}
                                                    value="allNet"
                                                    checked={
                                                      formula?.settlement
                                                        ?.services?.[
                                                        "comType" + s?.title
                                                      ] == "ALL_NET"
                                                    }
                                                    onChange={(e) =>
                                                      handleSPriceService(
                                                        "comType" + s?.title,
                                                        "ALL_NET"
                                                      )
                                                    }
                                                  />
                                                  <label
                                                    className="form-check-label d-inline "
                                                    htmlFor="allNet"
                                                  >
                                                    <small
                                                      style={{ fontSize: 12 }}
                                                    >
                                                      Tous réseaux
                                                    </small>
                                                  </label>
                                                </div>
                                              </div>
                                            </div>
                                          </div>
                                        </>
                                      )}
                                    </>
                                  )}
                                </div>
                              </div>
                            </React.Fragment>
                          );
                        })}
                    </div>
                  </div>
                </>
              )}
              {formula?.type == "bill" && (
                <>
                  <div className=" p-2">
                    <div className="row">
                      <div className="col-md-6">
                        <div style={{ fontSize: 16 }}>
                          <b>Services : </b>
                          <span className="text-danger">*</span>
                        </div>
                        <div className="border p-1">
                          <div className="row">
                            {services &&
                              services?.map((s, i) => {
                                return (
                                  <React.Fragment key={"serv" + i}>
                                    <div className="col-md-4">
                                      <div className="form-check">
                                        <input
                                          className="form-check-input me-2"
                                          type="radio"
                                          name="radioDefault"
                                          id={"rs" + s?.title}
                                          value={s?.title}
                                          checked={sBill?.service == s?.title}
                                          onChange={(e) =>
                                            handleSetSBill(
                                              "service",
                                              e.target.value
                                            )
                                          }
                                        />
                                        <label
                                          className="form-check-label"
                                          htmlFor={"rs" + s?.name}
                                        >
                                          {s?.title}
                                          {s?.code == "SER-001" && (
                                            <>
                                              <img
                                                src="/images/icons/voice.png"
                                                alt=""
                                                style={{
                                                  height: 20,
                                                  paddingLeft: 3,
                                                }}
                                              />
                                            </>
                                          )}
                                          {s?.code == "SER-010" && (
                                            <>
                                              <img
                                                src="/images/icons/sms.png"
                                                alt=""
                                                style={{
                                                  height: 20,
                                                  paddingLeft: 3,
                                                }}
                                              />
                                            </>
                                          )}
                                          {s?.code == "SER-100" && (
                                            <>
                                              <img
                                                src="/images/icons/data.png"
                                                alt=""
                                                style={{
                                                  height: 20,
                                                  paddingLeft: 3,
                                                }}
                                              />
                                            </>
                                          )}
                                        </label>
                                      </div>
                                    </div>
                                  </React.Fragment>
                                );
                              })}
                          </div>
                        </div>
                      </div>
                      <div className="col-md-6">
                        {sBill?.service && (
                          <>
                            {sBill?.service != "DATA" && (
                              <>
                                <div style={{ fontSize: 16 }}>
                                  <b>Type communication : </b>
                                  <span className="text-danger">*</span>
                                </div>
                                <div className="border p-1">
                                  <div className="row">
                                    <div className="col-md-4">
                                      <div className=" form-group bg-light p-1">
                                        <input
                                          id="onNet"
                                          className="me-2 "
                                          type="radio"
                                          name="comType"
                                          checked={
                                            formula?.settlement?.service?.[
                                              "comType" + s?.title
                                            ] == "ON_NET"
                                          }
                                          onChange={(e) =>
                                            handleSetSBill("comType", "ON_NET")
                                          }
                                        />
                                        <label
                                          className="form-check-label d-inline "
                                          htmlFor="onNet"
                                        >
                                          <small style={{ fontSize: 12 }}>
                                            On net
                                          </small>
                                        </label>
                                      </div>
                                    </div>
                                    <div className="col-md-4">
                                      <div className=" form-group bg-light p-1">
                                        <input
                                          id="offNet"
                                          className="me-2 "
                                          type="radio"
                                          name="comType"
                                          checked={
                                            formula?.settlement?.service?.[
                                              "comType" + s?.title
                                            ] == "OFF_NET"
                                          }
                                          onChange={(e) =>
                                            handleSetSBill("comType", "OFF_NET")
                                          }
                                        />
                                        <label
                                          className="form-check-label d-inline "
                                          htmlFor="offNet"
                                        >
                                          <small style={{ fontSize: 12 }}>
                                            Off net
                                          </small>
                                        </label>
                                      </div>
                                    </div>
                                    <div className="col-md-4">
                                      <div className=" form-group bg-light p-1">
                                        <input
                                          id="allNet"
                                          className="me-2 "
                                          type="radio"
                                          name="comType"
                                          checked={
                                            formula?.settlement?.service?.[
                                              "comType" + s?.title
                                            ] == "OFF_NET"
                                          }
                                          onChange={(e) =>
                                            handleSetSBill("comType", "ALL_NET")
                                          }
                                        />
                                        <label
                                          className="form-check-label d-inline "
                                          htmlFor="allNet"
                                        >
                                          <small style={{ fontSize: 12 }}>
                                            Tous réseaux
                                          </small>
                                        </label>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                    <hr className="p-1 m-1" />
                    <div className="row">
                      <div className="col-md-6">
                        <label htmlFor="lname">
                          Unité : <span className="text-danger">*</span>
                        </label>
                        <div className="input-group mb-3">
                          <input
                            type="number"
                            className="form-control"
                            placeholder="Saisir un nombre "
                            value={formula?.settlement?.quantity}
                            onChange={(e) =>
                              handleSetSBill("quantity", e.target.value)
                            }
                          />
                          <span className="input-group-text" id="basic-addon2">
                            {sBill?.service == "VOIX" && <>Min</>}
                            {sBill?.service == "SMS" && <>SMS</>}
                            {sBill?.service == "DATA" && <>Mo</>}
                          </span>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <label htmlFor="lname">
                          Validité : <span className="text-danger">*</span>
                        </label>
                        <div className="input-group mb-3">
                          <input
                            type="number"
                            className="form-control form-control-sm "
                            placeholder="Saisir le nombre de jour de vaidité "
                            value={formula?.settlement?.validity}
                            onChange={(e) =>
                              handleSetSBill("validity", e.target.value)
                            }
                          />
                          <span className="input-group-text" id="basic-addon2">
                            Jour
                          </span>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <label htmlFor="lname">
                          Tarif appliqué :
                          <span className="text-danger">*</span>
                        </label>
                        <div className="input-group mb-3">
                          <input
                            type="number"
                            className="form-control"
                            placeholder="Saisir le tarif à appliquer "
                            onChange={(e) =>
                              handleSetSBill("rateApplied", e.target.value)
                            }
                            value={formula?.settlement?.rateApplied}
                          />
                          <span className="input-group-text" id="basic-addon2">
                            FCFA
                          </span>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <label htmlFor="lname">Pas de facturation :</label>
                        <div className="input-group mb-3">
                          <input
                            type="number"
                            className="form-control"
                            placeholder="Saisir le pas de facturation "
                            onChange={(e) =>
                              handleSetSBill("billingStep", e.target.value)
                            }
                          />
                          <span className="input-group-text" id="basic-addon2">
                            {sBill?.service == "VOIX" && <> / Min</>}
                            {sBill?.service == "SMS" && <> / Caratères</>}
                            {sBill?.service == "DATA" && <> / Mo</>}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
              {formula?.advantages && (
                <>
                  <hr className="m-2" />
                  <div className="border">
                    <div className="text-center bg-secondary text-white">
                      AVANTAGE(S)
                    </div>
                    <div>
                      <table className="table table-bordered table-responsive">
                        <thead>
                          <tr className="p-1 bg-dark-secondary">
                            <th
                              className="p-1 text-center"
                              style={{ width: 50 }}
                            >
                              
                              <small>N°</small>
                            </th>
                            <th
                              className="p-1 text-center"
                              style={{ width: 400 }}
                            >
                              <small>TITRE</small>
                            </th>
                            <th className="p-1 text-center">
                              <small>DESCRIPTION</small>
                            </th>
                            <th
                              className="p-1 text-center"
                              style={{ width: 100 }}
                            >
                              <small>ACTIONS</small>
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {formula?.advantages?.map((adv, i) => {
                            return (
                              <React.Fragment key={"adv1" + i}>
                                <tr>
                                  <td className="p-1 text-center">
                                    <b>{i + 1}</b>
                                  </td>
                                  <td className="alert alert-warning p-1 m-0">
                                    <div>
                                      <small>{adv?.name} </small>
                                    </div>
                                  </td>
                                  <td className="p-1">
                                    <div
                                      dangerouslySetInnerHTML={{
                                        __html: adv?.description,
                                      }}
                                    />
                                  </td>
                                  <td>
                                    <button
                                      className="btn btn-sm btn-info me-2 mb-1 p-1"
                                      onClick={() =>
                                        handleInitEditAdvantage(adv)
                                      }
                                    >
                                      <i className="fa fa-edit"></i>
                                    </button>
                                    <button
                                      className="btn btn-sm btn-danger mb-1 p-1"
                                      onClick={() => handleInitAdvantage(adv)}
                                    >
                                      <i className="fa fa-trash"></i>
                                    </button>
                                  </td>
                                </tr>
                              </React.Fragment>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}
              <button
                className="btn btn-dark w-100 mt-3"
                onClick={() => handleInitAddAdvantage()}
              >
                <i className="fa fa-plus me-2"></i>Ajouter autres avantages
              </button>
            </div>
          </>
        )}
      </div>

      <AddAdantageDialog
        visible={showAdvantageDaialog}
        setVisible={setShowAdvantageDaialog}
        formula={formula}
        onInputChange={onInputChange}
        advantage={advantage}
        setAdvantage={setAdvantage}
        handleEditAdvantage={handleEditAdvantage}
      />

      <AlertAdvantageRemove
        visible={showAlertAdvRemove}
        setVisible={setShowAlertAdvRemove}
        advantage={advantage}
        handleConfirm={removeAdvantage}
      />

      <style jsx>
        {`
          .demo {
            background: #ffded7;
          }
          a:hover,
          a:focus {
            outline: none;
            text-decoration: none;
          }
          .tab .nav-tabs {
            padding-left: 15px;
            border-bottom: 4px solid #692f6c;
          }
          .tab .nav-tabs li a {
            color: #fff;
            padding: 10px 20px;
            margin-right: 10px;
            background: #692f6c;
            text-shadow: 1px 1px 2px #000;
            border: none;
            border-radius: 0;
            opacity: 0.5;
            position: relative;
            transition: all 0.3s ease 0s;
          }
          .tab .nav-tabs li a:hover {
            background: #692f6c;
            opacity: 0.8;
          }
          .tab .nav-tabs li.active a {
            opacity: 1;
          }
          .tab .nav-tabs li.active a,
          .tab .nav-tabs li.active a:hover,
          .tab .nav-tabs li.active a:focus {
            color: #fff;
            background: #692f6c;
            border: none;
            border-radius: 0;
          }
          .tab .nav-tabs li a:before,
          .tab .nav-tabs li a:after {
            content: "";
            border-top: 42px solid transparent;
            position: absolute;
            top: -2px;
          }
          .tab .nav-tabs li a:before {
            border-right: 15px solid #692f6c;
            left: -15px;
          }
          .tab .nav-tabs li a:after {
            border-left: 15px solid #692f6c;
            right: -15px;
          }
          .tab .nav-tabs li a i,
          .tab .nav-tabs li.active a i {
            display: inline-block;
            padding-right: 5px;
            font-size: 15px;
            text-shadow: none;
          }
          .tab .nav-tabs li a span {
            display: inline-block;
            font-size: 14px;
            letter-spacing: -9px;
            opacity: 0;
            transition: all 0.3s ease 0s;
          }
          .tab .nav-tabs li a:hover span,
          .tab .nav-tabs li.active a span {
            letter-spacing: 1px;
            opacity: 1;
            transition: all 0.3s ease 0s;
          }
          .tab .tab-content {
            padding: 30px;
            background: #fff;
            font-size: 16px;
            color: #6c6c6c;
            line-height: 25px;
          }
          .tab .tab-content h3 {
            font-size: 24px;
            margin-top: 0;
          }
          @media only screen and (max-width: 479px) {
            .tab .nav-tabs li {
              width: 100%;
              margin-bottom: 5px;
              text-align: center;
            }
            .tab .nav-tabs li a span {
              letter-spacing: 1px;
              opacity: 1;
            }
          }
        `}
      </style>
    </Dialog>
  );
}
