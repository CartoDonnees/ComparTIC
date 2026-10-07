import { getAdminOffersByOperators } from "@/services/api/admin/offer/offersApiServices";
import { getAdminOffers } from "@/services/api/offers/offersApiServices";
import { getServices } from "@/services/api/services/servicesApiServices";
import { useAdmin } from "@/services/providers/AdminProvider";
import { BASE_IMG_URL, imageUrl } from "@/services/tools/constants";
import React, { useEffect, useState } from "react";
import AdminCalendarPage from "../calendar/AdminCalendarPage";
import AdminTrackingPage from "../tacking/AdminTrackingPage";

export default function AdminMonitoringDashPage() {
  const { operators } = useAdmin();
  const [selectedOperators, setSelectedOperators] = useState(null);
  const [filter, setFilter] = useState(null);
  const [search, setSearch] = useState(null);
  const [offers, setOffers] = useState(null);
  const [services, setServices] = useState(null);

  const [selectedOffers, setSelectedOffers] = useState(null);
  const [active, setActive] = useState(1);

  useEffect(() => {
    init();
  }, []);

  useEffect(() => {
    if (selectedOperators) {
      onInputChange("operatorIds", selectedOperators);
    }
  }, [selectedOperators]);

  useEffect(() => {
    if (selectedOperators) {
      handleSubmit();
    }
  }, [selectedOperators]);

  const init = async () => {
    const _filter = { ...filter };
    const _offers = await getAdminOffers();
    const _services = await getServices();
    // const _date = getDateMonthsBefore(date, 60);
    // const _d = formatToYYYYMMDD(_date);
    // _filter["startDate"] = _d;
    // _filter["endDate"] = formatToYYYYMMDD(date);
    // _filter["category"] = -1;
    // _filter["billingType"] = -1;

    setSelectedOperators(operators);
    setOffers(_offers);
    setFilter(_filter);
    setServices(_services);
  };

  const onInputChange = (name, value) => {
    let _filter = { ...filter };
    _filter[`${name}`] = value;

    setFilter(_filter);
  };

  const handleShowActive = (a) => {
    setActive(a);
  };

  const handleSubmit = async () => {
    const _operIds = [];

    if (selectedOperators?.length > 0) {
      selectedOperators.forEach((oper) => {
        _operIds.push(oper?.id);
      });

      const _offers = await getAdminOffersByOperators(_operIds);
      setOffers(_offers);
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

  const offerTemplate = (option) => {
    return (
      <div className="">
        <div className="text-dark">{option.title}</div>
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

  const panelOfferFooterTemplate = () => {
    const l = selectedOffers ? selectedOffers.length : 0;

    return (
      <div className="py-2 px-3 bg-light text-dark">
        <small>
          <b>{l}</b> offres(s){l > 1 ? "s" : ""} sélectionnée(s).
        </small>
      </div>
    );
  };

  const childrenTemplate = (children) => {
    if (children?.length > 0) {
      return (
        <div>
          <hr className="m-0" />
          <div className="mt-1">
            <small>
              <u>
                <b>Sous-offres:</b>
              </u>
            </small>
          </div>
          <table className="table table-bordered mb-0">
            <thead className="p-1">
              <tr className="bg-secondary p-1">
                <th className="text-white text-center" style={{ width: 50 }}>
                  N°
                </th>
                <th className="text-white text-center">CONTENU</th>
                <th className="text-white text-center" style={{ width: 150 }}>
                  ACTIONS
                </th>
              </tr>
            </thead>
            <tbody>
              {children?.map((form, i) => {
                return (
                  <React.Fragment key={"ASS" + i}>
                    <tr>
                      <td className="p-2 align-content-center align-self-center">
                        <b>{i + 1}</b>
                      </td>
                      <td className="p-1">
                        {form?.type == "price" && (
                          <>
                            <div
                              className="px-1 bg-light text-center"
                              style={{ fontSize: 14 }}
                            >
                              {" "}
                              {form?.title}{" "}
                            </div>
                            <small>
                              <b>
                                {handleNumThousand(form.settlement.price)}F{" "}
                              </b>
                              | {form.settlement.validity} jour(s)
                              {services &&
                                services?.map((s, ii) => {
                                  if (
                                    form.settlement.services?.[s.title] === true
                                  ) {
                                    return (
                                      <div
                                        className=""
                                        style={{ paddingLeft: 10 }}
                                      >
                                        <div className="d-flex">
                                          {s.code == "SER-001" && (
                                            <span>
                                              {" "}
                                              <i className="fa-solid fa-phone me-2"></i>{" "}
                                              {
                                                form.settlement.services?.[
                                                  "quantity" + s.title
                                                ]
                                              }{" "}
                                              minutes d'appel
                                              {form.settlement.services?.[
                                                "bStep" + s.title
                                              ] && (
                                                <>
                                                  | Pas:{" "}
                                                  {
                                                    form.settlement.services?.[
                                                      "bStep" + s.title
                                                    ]
                                                  }
                                                  F/min
                                                </>
                                              )}{" "}
                                              |{" "}
                                              {form.settlement.services?.[
                                                "comType" + s.title
                                              ] == "ALL_NET" &&
                                                "Tous les réseaux"}
                                              {form.settlement.services?.[
                                                "comType" + s.title
                                              ] == "ON_NET" && "On-Net"}
                                              {form.settlement.services?.[
                                                "comType" + s.title
                                              ] == "OFF_NET" && "Off-Net"}
                                            </span>
                                          )}
                                          {s.code == "SER-010" && (
                                            <span>
                                              {" "}
                                              <i className="fa-solid fa-comment-sms me-2"></i>{" "}
                                              {
                                                form.settlement.services?.[
                                                  "quantity" + s.title
                                                ]
                                              }{" "}
                                              SMS
                                              {form.settlement.services?.[
                                                "bStep" + s.title
                                              ] && (
                                                <>
                                                  | Pas:{" "}
                                                  {
                                                    form.settlement.services?.[
                                                      "bStep" + s.title
                                                    ]
                                                  }
                                                  F/sms
                                                </>
                                              )}{" "}
                                              |{" "}
                                              {form.settlement.services?.[
                                                "comType" + s.title
                                              ] == "ALL_NET" &&
                                                "Tous les réseaux"}
                                              {form.settlement.services?.[
                                                "comType" + s.title
                                              ] == "ON_NET" && "On-Net"}
                                              {form.settlement.services?.[
                                                "comType" + s.title
                                              ] == "OFF_NET" && "Off-Net"}
                                            </span>
                                          )}
                                          {s.code == "SER-100" && (
                                            <span>
                                              {" "}
                                              <i className="fa-solid fa-globe me-2"></i>{" "}
                                              Internet{" "}
                                              {Number(
                                                form.settlement.services?.[
                                                  "quantity" + s.title
                                                ],
                                              ) >= 1024
                                                ? convertMoToGo(
                                                    form.settlement.services?.[
                                                      "quantity" + s.title
                                                    ],
                                                    2,
                                                  ) + " Go"
                                                : form.settlement.services?.[
                                                    "quantity" + s.title
                                                  ] + " Mo"}
                                              {form.settlement.services?.[
                                                "bStep" + s.title
                                              ] && (
                                                <>
                                                  {" "}
                                                  | Pas:{" "}
                                                  {
                                                    form.settlement.services?.[
                                                      "bStep" + s.title
                                                    ]
                                                  }
                                                  F/Mo
                                                </>
                                              )}{" "}
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  }
                                })}
                            </small>
                            {form?.advantages && (
                              <>
                                <hr className="m-1" />
                                <div className="row">
                                  <div className="col-md-3"></div>
                                  <div className="col-md-9"></div>
                                </div>
                                <div className="" style={{ paddingLeft: 50 }}>
                                  <div>
                                    <small>
                                      <u>
                                        {" "}
                                        <b>Autres avantages :</b>
                                      </u>{" "}
                                    </small>{" "}
                                  </div>
                                  <div>
                                    {form?.advantages?.map((adv, ii) => {
                                      return (
                                        <React.Fragment key={"adv" + ii}>
                                          <div>
                                            <div>
                                              <small>* {adv?.name} </small>{" "}
                                            </div>
                                          </div>
                                        </React.Fragment>
                                      );
                                    })}
                                  </div>
                                </div>
                              </>
                            )}
                            <div>
                              {form?.children &&
                                childrenTemplate(form?.children)}
                            </div>
                          </>
                        )}
                        {form?.type == "bill" && (
                          <>
                            <td className="p-1 m-0">
                              <div className="px-1 bg-light">
                                <small>
                                  <b>{form?.title}</b>{" "}
                                </small>
                              </div>
                              <small>
                                <div>{form.settlement.validity} jour(s)</div>
                                <div>
                                  {services &&
                                    services?.map((s, ii) => {
                                      if (s.title === form.settlement.service) {
                                        return (
                                          <div
                                            className=""
                                            style={{ paddingLeft: 10 }}
                                          >
                                            <div className="d-flex">
                                              {s.code == "SER-001" && (
                                                <span>
                                                  {" "}
                                                  <i className="fa-solid fa-phone me-2"></i>{" "}
                                                  {form.settlement?.quantity}{" "}
                                                  minutes d'appel | Pas:{" "}
                                                  {form.settlement?.billingStep}
                                                  F/Min |{" "}
                                                  {form.settlement?.comType ==
                                                    "ALL_NET" &&
                                                    "Tous les réseaux"}
                                                  {form.settlement?.comType ==
                                                    "ON_NET" && "On-Net"}
                                                  {form.settlement?.comType ==
                                                    "OFF_NET" && "Off-Net"}
                                                </span>
                                              )}
                                              {s.code == "SER-010" && (
                                                <span>
                                                  {" "}
                                                  <i className="fa-solid fa-comment-sms me-2"></i>{" "}
                                                  {form.settlement.quantity} SMS
                                                  | Pas:{" "}
                                                  {form.settlement?.billingStep}
                                                  F/Min |{" "}
                                                  {form.settlement?.comType ==
                                                    "ALL_NET" &&
                                                    "Tous les réseaux"}
                                                  {form.settlement?.comType ==
                                                    "ON_NET" && "On-Net"}
                                                  {form.settlement?.comType ==
                                                    "OFF_NET" && "Off-Net"}
                                                </span>
                                              )}
                                              {s.code == "SER-100" && (
                                                <span>
                                                  {" "}
                                                  <i className="fa-solid fa-globe me-2"></i>{" "}
                                                  Internet{" "}
                                                  {Number(
                                                    form.settlement.quantity,
                                                  ) >= 1024
                                                    ? convertMoToGo(
                                                        form.settlement
                                                          .quantity,
                                                        2,
                                                      ) + " Go"
                                                    : form.settlement.quantity +
                                                      " Mo"}
                                                  | Pas:{" "}
                                                  {form.settlement.billingStep}
                                                  F/Mo
                                                </span>
                                              )}
                                            </div>
                                          </div>
                                        );
                                      }
                                    })}
                                </div>
                                {form?.advantages && (
                                  <>
                                    <hr className="m-1" />
                                    <div className="row">
                                      <div className="col-md-3"></div>
                                      <div className="col-md-9"></div>
                                    </div>
                                    <div
                                      className=""
                                      style={{ paddingLeft: 50 }}
                                    >
                                      <div>
                                        <small>
                                          <u>
                                            {" "}
                                            <b>Autres avantages :</b>
                                          </u>{" "}
                                        </small>{" "}
                                      </div>
                                      <div>
                                        {form?.advantages?.map((adv, ii) => {
                                          return (
                                            <React.Fragment key={"adv" + ii}>
                                              <div>
                                                <div>
                                                  <small>
                                                    * {adv?.name}{" "}
                                                  </small>{" "}
                                                </div>
                                              </div>
                                            </React.Fragment>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  </>
                                )}
                                {/* {form.settlement?.services.map((s,ii) => {
                                                                                  return <div>
      
                                                                                  </div>
                                                                              })} */}
                              </small>
                              <div>
                                {form?.children &&
                                  childrenTemplate(form?.children)}
                              </div>
                            </td>
                          </>
                        )}
                        {!form?.type && (
                          <>
                            <div className="px-1">
                              <small>
                                {" "}
                                <b>{form?.title}</b>
                              </small>
                            </div>
                            <div>
                              {form?.children &&
                                childrenTemplate(form?.children)}
                            </div>
                          </>
                        )}
                      </td>
                      <td className="p-1 m-0 align-content-center align-self-center">
                        {step != 5 && (
                          <>
                            {!form?.type && (
                              <>
                                <button
                                  className="btn btn-sm btn-warning me-2"
                                  onClick={() => handleAddNewForm(form?.key)}
                                >
                                  <i className="fa fa-plus"></i>
                                </button>
                              </>
                            )}
                            <button
                              className="btn btn-sm btn-info me-2 mb-1 p-1"
                              onClick={() => initEdiitFormula(form)}
                            >
                              <i className="fa fa-edit"></i>
                            </button>
                            <button
                              className="btn btn-sm btn-danger mb-1 p-1"
                              onClick={() =>
                                handleConfirmRemoveFomula(form?.key)
                              }
                            >
                              <i className="fa fa-trash"></i>
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      );
    }
  };

  return (
    <div>
      <ul className="nav nav-tabs w-100" id="ceTab" role="tablist">
        <li className="nav-item">
          <a
            className="nav-link active"
            id="evolution-tab"
            data-bs-toggle="tab"
            href="#evolution"
            role="tab"
            aria-controls="evolution"
            aria-selected="false"
            style={{
              fontSize: 16,
            }}
            onClick={() => handleShowActive(1)}
          >
            Evolution
          </a>
        </li>
        <li className="nav-item">
          <a
            className="nav-link "
            id="calendar-tab"
            data-bs-toggle="tab"
            href="#calendar"
            role="tab"
            aria-controls="calendar"
            aria-selected="true"
            style={{
              fontSize: 16,
            }}
            onClick={() => handleShowActive(2)}
          >
            <b>Calendrier</b>
          </a>
        </li>
      </ul>
      {active == 1 && <AdminTrackingPage />}
      {active == 2 && <AdminCalendarPage />}
    </div>
  );
}
