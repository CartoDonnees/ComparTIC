import { BASE_IMG_URL, imageUrl } from "@/services/tools/constants";
import { useAdmin } from "@/services/providers/AdminProvider";
import { Dropdown } from "primereact/dropdown";
import { Editor } from "primereact/editor";
import { ChevronDownIcon } from "primereact/icons/chevrondown";
import { ChevronRightIcon } from "primereact/icons/chevronright";
import React, { useEffect, useState } from "react";
import { buildParentOfferOptions } from "@/services/tools/parentOffers";

export default function CreateStep1({
  operators,
  offer,
  offers,
  onInputChange,
  searchOffers,
  setSearchOffers,
  offerType,
  handlePreviousStep,
  handleNextStep,
  target,
  setTarget,
  selectOffer,
  setSelectOffer,
  targetTab,
  setTargetTab,
  otherTarget,
  setOtherTarget,
  step,
}) {
  const { user } = useAdmin();
  const [selectedOperator, setSelectedOperator] = useState(null);

  useEffect(() => {
    if (user) {
      setSelectedOperator(user?.focalPoint?.operator)
    }
  }, [user]);

  // Recalcul dès que les offres OU l opérateur changent : la liste arrive
  // d un appel réseau distinct et peut être renseignée après l opérateur.
  useEffect(() => {
    setSearchOffers(buildParentOfferOptions(offers, offer));
  }, [offers, offer?.operator?.code, offer?.operator?.id, offer?.id]);

  useEffect(() => {
    if (selectOffer) {
      onInputChange("parentOffer", selectOffer);
    }
  }, [selectOffer]);

  useEffect(() => {
    if (targetTab) {
      loadTarget();
    }
  }, [targetTab]);

  useEffect(() => {
    if (otherTarget) {
      loadTarget();
    }
  }, [otherTarget]);

  useEffect(() => {
    if(selectedOperator){
      onInputChange("operator", selectedOperator);
    }
  }, [selectedOperator]);

  const loadTarget = () => {
    let _target = "";
    if (targetTab) {
      _target = "<ul>";
      Object.entries(targetTab).forEach(([key, value]) => {
        if (value == true) {
          if (key == "allCient") {
            _target = _target + "<li> - Tous les clients</li>";
          } else if (key == "mobile") {
            _target = _target + "<li>- Abonnés mobile (hypbride)</li>";
          } else if (key == "mbPrepay") {
            _target = _target + "<li>- Abonnés mobile (prépayé)</li>";
          } else if (key == "mbPostpay") {
            _target = _target + "<li>- Abonnés mobile (postpayé)</li>";
          } else if (key == "fix") {
            _target = _target + "<li>- Abonnés fixe (hypbride)</li>";
          } else if (key == "fixPrepay") {
            _target = _target + "<li>- Abonnés fixe (prépayé)</li>";
          } else if (key == "fixPostpay") {
            _target = _target + "<li>- Abonnés fix (postpayé)</li>";
          } else if (key == "company") {
            _target = _target + "<li>- Entreprise</li>";
          } else if (key == "nbMoney") {
            _target =
              _target +
              "<li>- Abonnés titulaires d'un compte Mobile money</li>";
          } else if (key == "provider") {
            _target =
              _target + "<li>- Fournisseurs de contenus et Start-up</li>";
          }
        }
      });
      _target = _target + "</ul>";
    }
    if (otherTarget) {
      _target = _target + otherTarget;
    }
    setTarget(_target);
  };

  //FUNCTIONS

  const onSelectTarget = (name, value) => {
    const _targetTab = { ...targetTab };
    // if (name == 'mobile' && value == false) {
    //     _targetTab['mbPrepay'] = false;
    //     _targetTab['mbPostpay'] = false
    // }
    // else if (name == 'fix' && value == false) {
    //     _targetTab['fixPrepay'] = false;
    //     _targetTab['fixPostpay'] = false
    // }
    // else if ((name == 'mbPrepay' || name == 'mbPostpay') && value == false) {
    //     _targetTab['mobile'] = false
    // }
    // else if ((name == 'fixPrepay' || name == 'fixPostpay') && value == false) {
    //     _targetTab['fix'] = false
    // }
    _targetTab[name] = value;
    setTargetTab(_targetTab);
  };

  ///TEMPLATES
  const groupedItemTemplate = (option) => {
    return (
      <div className="flex align-items-center mt-3 mb-0 bg-light">
        <div>{option.name}</div>
      </div>
    );
  };

  const offerOptionTemplate = (option) => {
    return (
      <div className="P-2 w-100">
        <table className="w-100">
          <tbody>
            <tr>
              <td>{"->"}</td>
              <td>
                <div className="w-100">
                  {option.code == "OF-000000000000000" ? (
                    <div className="alert alert-warning p-0 m-0 rounded-0 px-2">
                      <b>
                        {" "}
                        {option.title} <i className="bi bi-question-octagon"></i>
                      </b>
                    </div>
                  ) : (
                    <div className="px-2">
                      <b>{option.title} </b>
                    </div>
                  )}
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  };

  const selectedOfferTemplate = (option, props) => {
    if (option) {
      return (
        <div className="flex align-items-center">
          <div>
            {" "}
            <b>{option.title} </b>
          </div>
        </div>
      );
    }

    return <span>{props.placeholder}</span>;
  };

  const operatorTemplate = (oper) => {
    return (
      <div className="d-flex p-1">
        <div style={{ paddingRight: 10 }}>
          <img
            alt={oper.name}
            src={imageUrl(oper?.imagePath)}
            className={`mr-2`}
            style={{ width: "28px" }}
          />
        </div>
        <div>{oper.name}</div>
      </div>
    );
  };

  const selectedOperatorTemplate = (oper, props) => {
    if (oper) {
      return (
        <div className="d-flex p-1">
          <div style={{ paddingRight: 10 }}>
            <img
              alt={oper.name}
              src={imageUrl(oper?.imagePath)}
              className={`mr-2`}
              style={{ width: "35px" }}
            />
          </div>
          <div style={{fontSize:20}}>{oper.name}</div>
        </div>
      );
    }

    return <span>{props.placeholder}</span>;
  };

  return (
    <div>
      <div className="card rounded-0 ">
        <div className="card-header bg-secondary   d-flex justify-content-between rounded-0  ">
          <h5 className="p-0 m-0">
            <strong className="headings-color text-white">
              Etape 1: Informations générales
            </strong>
          </h5>

          <div className=" text-center">
            {step > 1 && (
              <>
                <button
                  className="btn btn-sm btn-sm btn-secondary me-2"
                  id="prevBtn"
                  onClick={() => handlePreviousStep()}
                >
                  <i className="fa fa-arrow-left me-2"></i> Précédent
                </button>
              </>
            )}
            {step < 5 && (
              <>
                <button
                  className="btn btn-sm btn-sm btn-info me-2"
                  id="nextBtn"
                  onClick={() => handleNextStep()}
                >
                  Suivant <i className="fa fa-arrow-right "></i>
                </button>
              </>
            )}
          </div>
        </div>
        <div className="card-body">
          <div className="row">
            <div className="col-md-5 m-0 ">
              {offerType == 1 && (
                <>
                  <div className="card mb-2">
                    <div className="card-header bg-light4">
                      <b>OFFRE PARENTE</b>
                    </div>
                    <div className="card-body bg-primary1 ">
                      {searchOffers?.length > 0 ? (
                        <>
                          <div className=" bg-primary1 mb-2">
                            <Dropdown
                              value={selectOffer}
                              onChange={(e) => setSelectOffer(e.value)}
                              options={searchOffers}
                              optionLabel="title"
                              placeholder="Sélectionner une offre parente"
                              valueTemplate={selectedOfferTemplate}
                              itemTemplate={offerOptionTemplate}
                              className="w-100"
                              disabled={offer?.operator ? false : true}
                              emptyMessage="Aucune option disponible"
                              dropdownIcon={(opts) => {
                                return opts.iconProps[
                                  "data-pr-overlay-visible"
                                ] ? (
                                  <ChevronRightIcon {...opts.iconProps} />
                                ) : (
                                  <ChevronDownIcon {...opts.iconProps} />
                                );
                              }}
                              filter
                              filterDelay={400}
                            />
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="alert alert-warning rounded-0 mb-0">
                            <div className="text-center small">
                              {/* On distingue les deux causes : sans ce
                                  message, un champ vide laissait croire à un
                                  dysfonctionnement. */}
                              {offer?.operator
                                ? "Aucune offre de base de cet opérateur ne peut servir d'offre parente."
                                : "Sélectionnez d'abord un opérateur."}
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </>
              )}
              <div className="card mb-2">
                <div className="card-header bg-light4">
                  <b>PLANNING</b>
                </div>
                <div className="card-body bg-primary1 ">
                  {offerType == 1 ? (
                    <>
                      <div className="row">
                        <div className="col-md-6">
                          <div className="form-group mb-2 m-0">
                            <label htmlFor="date_n">
                              Date de notification de l'offre :{" "}
                              <span className="text-danger">*</span>
                            </label>
                            <input
                              type="date"
                              id="date_n"
                              className="form-control"
                              min=""
                              required=""
                              value={offer?.notifDate}
                              onChange={(e) => {
                                onInputChange("notifDate", e.target.value);
                              }}
                            />
                          </div>
                        </div>
                        <div className="col-md-6">
                          <div className="form-group mb-2">
                            <label htmlFor="date_s">
                              Date de lancement souhaitée :{" "}
                              <span className="text-danger">*</span>
                            </label>
                            <input
                              type="date"
                              id="date_s"
                              className="form-control"
                              max=""
                              required=""
                              value={offer?.startDate}
                              onChange={(e) => {
                                onInputChange("startDate", e.target.value);
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="form-group mb-2 m-0">
                        <label htmlFor="date_n">
                          Date de notification de l'offre :{" "}
                          <span className="text-danger">*</span>
                        </label>
                        <input
                          type="date"
                          id="date_n"
                          className="form-control"
                          min=""
                          required=""
                          value={offer?.notifDate}
                          onChange={(e) => {
                            onInputChange("notifDate", e.target.value);
                          }}
                        />
                      </div>
                      <div className="form-group mb-2">
                        <label htmlFor="date_s">
                          Date de lancement souhaitée :{" "}
                          <span className="text-danger">*</span>
                        </label>
                        <input
                          type="date"
                          id="date_s"
                          className="form-control"
                          max=""
                          required=""
                          value={offer?.startDate}
                          onChange={(e) => {
                            onInputChange("startDate", e.target.value);
                          }}
                        />
                      </div>
                    </>
                  )}
                  {offerType == 1 && (
                    <>
                      <div className="row">
                        <div className="col-md-6">
                          <div className="form-group mb-2">
                            <label htmlFor="duration">
                              Durée : <span className="text-danger">*</span>
                            </label>
                            <div className="input-group mb-3">
                              <input
                                type="number"
                                className="form-control"
                                placeholder="Saisir la durée de la promotion"
                                aria-label="Recipient’s username"
                                aria-describedby="basic-addon2"
                                id="duration"
                                required=""
                                value={offer?.duration}
                                onChange={(e) => {
                                  onInputChange("duration", e.target.value);
                                }}
                              />
                              <span
                                className="input-group-text"
                                id="basic-addon2"
                              >
                                Jour(s)
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="col-md-6">
                          <div className="form-group mb-4">
                            <label htmlFor="type">
                              Type d'offre promotionnelle
                            </label>
                            <select
                              name=""
                              id="type"
                              className="form-control"
                              value={offer?.promoType}
                              onChange={(e) => {
                                onInputChange("promoType", e.target.value);
                              }}
                            >
                              <option value="">Sélectionner un type</option>
                              <option value="FLASH">FLASH</option>
                              <option value="PERIOD">PERIODIQUE</option>
                              <option value="SPECIAL">SPECIALE</option>
                              <option value="CUSTOMIZE">PERSONALISEE</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
              <div className="card mb-2">
                <div className="card-header bg-light4">
                  <b>PARTENAIRES</b>
                </div>
                <div className="card-body bg-primary1 ">
                  <div className="form-group  mb-2">
                    <input
                      id="oTitle"
                      type="text"
                      className="form-control"
                      placeholder="Saisir le nom des partenaires séparer d'une virgule"
                      required=""
                      value={offer?.partner}
                      onChange={(e) => {
                        onInputChange("partner", e.target.value);
                      }}
                      // style={{
                      //     fontSize: 16,
                      //     fontWeight: 'bold'
                      // }}
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-7">
              <div className="card mb-2">
                <div className="card-header bg-light4">
                  <b>GENERALITES</b>
                </div>
                <div className="card-body bg-primary1 ">
                  <div className="d-flex justify-content-between p-1 bg-white rounded ">
                    <div
                      htmlFor="lname "
                      className="me-2 align-content-center w-10"
                    >
                      <b>CODE :</b>
                    </div>
                    <div className="form-group  mb-2 w-100">
                      <input
                        id="code"
                        type="text"
                        className="form-control text-secondary"
                        // placeholder="Saisir le libéllé de l'offre"
                        // required=""
                        disabled
                        value={offer?.code}
                        // onChange={(e) => { onInputChange("title", e.target.value) }}
                      />
                    </div>
                  </div>
                  <hr className="m-1" />

                  <div className="form-group  mb-2">
                    <label htmlFor="oTitle">
                      Nom de l'offre <span className="text-danger">*</span>
                    </label>
                    <input
                      id="oTitle"
                      type="text"
                      className="form-control"
                      placeholder="Saisir le nom de l'offre"
                      required=""
                      value={offer?.title}
                      onChange={(e) => {
                        onInputChange("title", e.target.value);
                      }}
                      style={{
                        fontSize: 16,
                        fontWeight: "bold",
                      }}
                    />
                  </div>
                  <div className="bg-white rounded">
                    <div className="d-flex justify-content-between p-1  ">
                      <div className=" w-100 me-2">
                        <div>Type de client :</div>
                        <div className="alert alert-warning p-0 rounded-0 px-1">
                          <div className="d-flex justify-content-between px-2">
                            <div className="">
                              <input
                                className="form-check-input"
                                type="radio"
                                name="otype"
                                id="otype1"
                                checked={Number(offer?.billingType) == 1}
                                value={1}
                                onChange={(e) => {
                                  onInputChange("billingType", e.target.value);
                                }}
                              />
                              <label
                                className="form-check-label"
                                htmlFor="otype1"
                              >
                                PRE-PAYE
                              </label>
                            </div>
                            <div className="col-md-6">
                              <input
                                className="form-check-input"
                                type="radio"
                                name="otype"
                                id="otype2"
                                checked={Number(offer?.billingType) == 2}
                                value={2}
                                onChange={(e) => {
                                  onInputChange("billingType", e.target.value);
                                }}
                              />
                              <label
                                className="form-check-label ml-2"
                                htmlFor="otype2"
                              >
                                POST-PAYE
                              </label>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="w-100">
                        <div>Catégorie :</div>
                        <div className="alert alert-warning p-0 rounded-0 px-1">
                          <div className="d-flex justify-content-between px-2">
                            <div className="">
                              <input
                                className="form-check-input"
                                type="radio"
                                name="ocateg"
                                id="ocateg1"
                                checked={offer?.category == 1}
                                value={1}
                                onChange={(e) => {
                                  onInputChange("category", e.target.value);
                                }}
                              />
                              <label
                                className="form-check-label"
                                htmlFor="ocateg1"
                              >
                                MOBILE
                              </label>
                            </div>
                            <div className="">
                              <input
                                className="form-check-input"
                                type="radio"
                                name="ocateg"
                                id="ocateg2"
                                checked={offer?.category == 2}
                                value={2}
                                onChange={(e) => {
                                  onInputChange("category", e.target.value);
                                }}
                              />
                              <label
                                className="form-check-label ml-2"
                                htmlFor="ocateg2"
                              >
                                FIXE
                              </label>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="form-group  mb-2">
                    <label htmlFor="lname">Cibles de l'offre</label>
                    <div className="border p-2 bg-white">
                      <div className=" form-group bg-light p-1">
                        <input
                          id="allTg"
                          className="me-2 "
                          type="checkbox"
                          name="allTg"
                          checked={targetTab?.allCient}
                          onChange={(e) =>
                            onSelectTarget("allCient", e.target.checked)
                          }
                        />
                        <label
                          className="form-check-label d-inline "
                          htmlFor="allTg"
                        >
                          <small style={{ fontSize: 12 }}>
                            Tous les clients
                          </small>
                        </label>
                      </div>
                      <hr className=" border-opacity-10 m-1" />
                      {!targetTab?.allCient && (
                        <>
                          <div className="row">
                            <div className="col-md-4">
                              <div className=" form-group bg-light p-1">
                                <input
                                  id="mbTg"
                                  className="me-2 "
                                  type="checkbox"
                                  name="mbTg"
                                  checked={targetTab?.hybride}
                                  onClick={(e) =>
                                    onSelectTarget(
                                      "hybride",
                                      !targetTab?.hybride,
                                    )
                                  }
                                />
                                <label
                                  className="form-check-label d-inline "
                                  htmlFor="mbTg"
                                >
                                  <small style={{ fontSize: 12 }}>
                                    Clients Hybrides
                                  </small>
                                </label>
                              </div>
                            </div>
                            <div className="col-md-4">
                              <div className=" form-group bg-light p-1">
                                <input
                                  id="mnTgPrepay"
                                  className="me-2 "
                                  type="checkbox"
                                  name="mnTgPrepay"
                                  checked={targetTab?.prepay}
                                  onChange={(e) =>
                                    onSelectTarget("prepay", e.target.checked)
                                  }
                                />
                                <label
                                  className="form-check-label d-inline "
                                  htmlFor="mnTgPrepay"
                                >
                                  <small style={{ fontSize: 12 }}>
                                    Clients Prépayés
                                  </small>
                                </label>
                              </div>
                            </div>
                            <div className="col-md-4">
                              <div className=" form-group bg-light p-1">
                                <input
                                  id="mnTgPostpay"
                                  className="me-2 "
                                  type="checkbox"
                                  name="mnTgPostpay"
                                  checked={targetTab?.postpay}
                                  onChange={(e) =>
                                    onSelectTarget("postpay", e.target.checked)
                                  }
                                />
                                <label
                                  className="form-check-label d-inline "
                                  htmlFor="mnTgPostpay"
                                >
                                  <small style={{ fontSize: 12 }}>
                                    Clients Postpayés
                                  </small>
                                </label>
                              </div>
                            </div>
                          </div>
                        </>
                      )}
                      <hr className="m-1" />
                      <label
                        className="form-check-label d-inline "
                        htmlFor="other"
                      >
                        <small>Autres cibles</small>
                      </label>
                      <div className="bg-light p-2">
                        <div className="bg-white">
                          <Editor
                            value={otherTarget}
                            placeholder="Ajouter d'autres cibles..."
                            onTextChange={(e) => setOtherTarget(e.htmlValue)}
                            style={{ height: "100px" }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>

          <div className="card mb-2">
            <div className="card-body bg-primary1 ">
              <div className="form-group  mb-2">
                <label htmlFor="lname">Description de l'offre :</label>
                <div className="bg-white">
                  <Editor
                    value={offer?.description}
                    placeholder="Saisir une description de l'offre..."
                    onTextChange={(e) =>
                      onInputChange("description", e.htmlValue)
                    }
                    style={{ height: "320px" }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
