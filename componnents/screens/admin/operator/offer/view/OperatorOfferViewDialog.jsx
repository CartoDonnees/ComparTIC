import OfferDocumentViewer from "@/componnents/document/OfferDocumentViewer";
import {
  BASE_FILE_URL,
  BASE_IMG_URL,
  imageUrl,
} from "@/services/tools/constants";
import {
  addDays,
  handleNumThousand,
  srtSubDescription3,
  strUcFirst,
} from "@/services/tools/convertions";
import { convertMoToGo, formatDateToFrench } from "@/services/tools/helper";
import Link from "next/link";
import { Dialog } from "primereact/dialog";
import React, { useEffect, useRef, useState } from "react";
import { useReactToPrint } from "react-to-print";

export default function AdminOperatorViewDialog({
  visible,
  setVisible,
  offer,
}) {
  const [services, setServices] = useState(null);
  const currentDate = new Date();
  const contentRef = useRef();

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
                              {form?.title}
                            </div>
                            <small>
                              <b>{handleNumThousand(form.settlement.price)}F</b>
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
                                              <i className="fa-solid fa-phone me-2"></i>
                                              {
                                                form.settlement.services?.[
                                                  "quantity" + s.title
                                                ]
                                              }
                                              minutes d'appel
                                              {form.settlement.services?.[
                                                "bStep" + s.title
                                              ] && (
                                                <>
                                                  | Pas:
                                                  {
                                                    form.settlement.services?.[
                                                      "bStep" + s.title
                                                    ]
                                                  }
                                                  F/min
                                                </>
                                              )}
                                              |
                                              {form.settlement.services?.[
                                                "comType" + s.title
                                              ] == "allNet" &&
                                                "Tous les réseaux"}
                                              {form.settlement.services?.[
                                                "comType" + s.title
                                              ] == "onNet" && "On-Net"}
                                              {form.settlement.services?.[
                                                "comType" + s.title
                                              ] == "offNet" && "Off-Net"}
                                            </span>
                                          )}
                                          {s.code == "SER-010" && (
                                            <span>
                                              <i className="fa-solid fa-comment-sms me-2"></i>
                                              {
                                                form.settlement.services?.[
                                                  "quantity" + s.title
                                                ]
                                              }
                                              SMS
                                              {form.settlement.services?.[
                                                "bStep" + s.title
                                              ] && (
                                                <>
                                                  | Pas:
                                                  {
                                                    form.settlement.services?.[
                                                      "bStep" + s.title
                                                    ]
                                                  }
                                                  F/sms
                                                </>
                                              )}
                                              |
                                              {form.settlement.services?.[
                                                "comType" + s.title
                                              ] == "allNet" &&
                                                "Tous les réseaux"}
                                              {form.settlement.services?.[
                                                "comType" + s.title
                                              ] == "onNet" && "On-Net"}
                                              {form.settlement.services?.[
                                                "comType" + s.title
                                              ] == "offNet" && "Off-Net"}
                                            </span>
                                          )}
                                          {s.code == "SER-100" && (
                                            <span>
                                              <i className="fa-solid fa-globe me-2"></i>
                                              Internet
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
                                              | Pas:
                                              {
                                                form.settlement.services?.[
                                                  "bStep" + s.title
                                                ]
                                              }
                                              F/Mo
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  }
                                })}
                            </small>
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
                                  <b>{form?.title}</b>
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
                                                  <i className="fa-solid fa-phone me-2"></i>
                                                  {form.settlement?.quantity}
                                                  minutes d'appel
                                                  {form.settlement
                                                    ?.billingStep && (
                                                    <>
                                                      | Pas:
                                                      {
                                                        form.settlement
                                                          ?.billingStep
                                                      }
                                                      F/min
                                                    </>
                                                  )}
                                                  |
                                                  {form.settlement?.comType ==
                                                    "allNet" &&
                                                    "Tous les réseaux"}
                                                  {form.settlement?.comType ==
                                                    "onNet" && "On-Net"}
                                                  {form.settlement?.comType ==
                                                    "offNet" && "Off-Net"}
                                                </span>
                                              )}
                                              {s.code == "SER-010" && (
                                                <span>
                                                  <i className="fa-solid fa-comment-sms me-2"></i>
                                                  {form.settlement.quantity} SMS
                                                  {form.settlement
                                                    ?.billingStep && (
                                                    <>
                                                      | Pas:
                                                      {
                                                        form.settlement
                                                          ?.billingStep
                                                      }
                                                      F/sms
                                                    </>
                                                  )}
                                                  |
                                                  {form.settlement?.comType ==
                                                    "allNet" &&
                                                    "Tous les réseaux"}
                                                  {form.settlement?.comType ==
                                                    "onNet" && "On-Net"}
                                                  {form.settlement?.comType ==
                                                    "offNet" && "Off-Net"}
                                                </span>
                                              )}
                                              {s.code == "SER-100" && (
                                                <span>
                                                  <i className="fa-solid fa-globe me-2"></i>
                                                  Internet
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
                                                  | Pas:
                                                  {form.settlement.billingStep}
                                                  F/mo
                                                </span>
                                              )}
                                            </div>
                                          </div>
                                        );
                                      }
                                    })}
                                </div>
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
                      <td className="p-1 m-0 align-content-center align-self-center"></td>
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

  const handlePrint = useReactToPrint({
    contentRef,
    copyStyles: true,
    pageStyle: `@media print {body {
        padding: 20px; /* Adjust the padding as needed */
      } @page { size: 450mm 250mm;}};`,
  });

  return (
    <Dialog
      header={<h5 className="m-0">Détails de l'offre</h5>}
      visible={visible}
      style={{ width: "96vw" }}
      onHide={() => onHide(false)}
      className="offer-view-dialog"
      dismissableMask
      maximizable
      draggable={false}
      footer={
        <div>
          <button
            className="btn btn-outline-secondary w-100"
            onClick={() => onHide()}
          >
            Fermer
          </button>
        </div>
      }
    >
      <div className="p-2">
        <div className="d-flex justify-content-end mb-2 p-2">
          <button className="btn btn-warning" onClick={() => handlePrint()}>
            <i className="fa fa-print me-2"></i> Imprimer
          </button>
        </div>

        <div className="conatiner p-4" ref={contentRef}>
          <div className="border p-2">
            <div>
              <div className="row">
                <div className="col-md-2">
                  <div className="text-center">
                    <img
                      src="./images/logo/logo.png"
                      className="img-logo"
                      alt=""
                    />
                  </div>
                  <Link href="/" style={{ cursor: "pointer" }}>
                    <h2 className="me-2 text-dark">
                      <em></em>Compare
                      <span className="text-primary">
                        <em>TIC</em>
                      </span>
                    </h2>
                  </Link>
                </div>
                <div className="col-md-8">
                  <div className="text-center">
                    <div
                      className="alert alert-info rounded-0 p-0"
                      style={{ fontSize: 30 }}
                    >
                      <b>{offer?.title.toUpperCase()}</b>
                    </div>
                    <div style={{ fontSize: 20 }}>
                      <em>
                        Code: <b>{offer?.code}</b>
                      </em>
                    </div>
                  </div>
                </div>
                <div className="col-md-2">
                  <div style={{ width: 200 }} className="text-center">
                    <img
                      alt={offer?.operator?.name}
                      src={imageUrl(offer?.operator?.imagePath)}
                      // className={`mr-2 flag me-2 flag-${selected.operator.code.toLowerCase()}`}
                      style={{ height: "80px" }}
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className=" p-2 mb-2">
              <div className="alert alert-success p-1 m-0 rounded-0 ">
                <div className="" style={{ fontSize: 20 }}>
                  <b>
                    <em>Informations générales</em>
                  </b>
                </div>
              </div>
              <div className="border">
                <div className="row">
                  <div className="col-md-4">
                    <table className="table table-sm">
                      <tbody>
                        <tr>
                          <td>
                            <div>Date d'enregistrement :</div>
                          </td>
                          <td className="">
                            <b>{formatDateToFrench(offer?.updatedAt)}</b>
                          </td>
                        </tr>
                        <tr>
                          <td>
                            <div>Date Notification à l'ARTCI :</div>
                          </td>
                          <td className="">
                            <b>{formatDateToFrench(offer?.notifiDate)}</b>
                          </td>
                        </tr>
                        <tr>
                          <td>
                            <div>Date de lancement souhaitée :</div>
                          </td>
                          <td className="">
                            <b>{formatDateToFrench(offer?.desiredDate)}</b>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <div className="col-md-4">
                    {offer?.specialPromotion ? (
                      <>
                        <div
                          className="d-flex justify-content-center text-danger"
                          style={{ fontSize: 30 }}
                        >
                          <em>
                            <b>Offre Promotionnelle </b>{" "}
                          </em>
                        </div>
                        <div>
                          <div className="text-center">
                            <i
                              className="bi bi-lightning-charge text-danger"
                              aria-hidden="true"
                              style={{ fontSize: 40 }}
                            ></i>
                          </div>
                        </div>
                        {offer?.parent && (
                          <>
                            <div>
                              <div
                                className="d-flex justify-content-center"
                                style={{ fontSize: 18 }}
                              >
                                <div>
                                  <em>
                                    Offre parente:{" "}
                                    <b> {offer?.parent?.title} </b>
                                  </em>{" "}
                                </div>
                              </div>
                            </div>
                          </>
                        )}
                        <div className="text-info text-center">
                          Date de fin:
                          <b>
                            {addDays(
                              offer?.desiredDate,
                              offer?.specialPromotion?.duration,
                            )}
                          </b>{" "}
                          [[
                          <b>{offer?.specialPromotion?.duration} jour(s)</b>]]
                        </div>
                      </>
                    ) : (
                      <>
                        <div
                          className="d-flex justify-content-center"
                          style={{ fontSize: 30 }}
                        >
                          <em>
                            <b>Offre de base </b>{" "}
                          </em>
                        </div>
                        <div className="text-center">
                          <i
                            className="bi bi-box me-1"
                            aria-hidden="true"
                            style={{ fontSize: 40 }}
                          ></i>
                          {/* <img
                            src="images/base.png"
                            alt=""
                            style={{ height: 50 }}
                          /> */}
                        </div>
                      </>
                    )}
                  </div>
                  <div className="col-md-4">
                    <table className="table table-sm">
                      <tbody>
                        <tr>
                          <td>Type de client :</td>
                          <td className="">
                            {/* BUGFIX: `billingType`/`category` sont des enums
                                texte ("PREPAID"/"MOBILE"...) et non des nombres.
                                L'ancienne comparaison `== 1` affichait toujours
                                "POST-PAYÉ" / "FIXE". */}
                            <b>
                              {offer?.billingType == "PREPAID" && "PRÉ-PAYÉ"}
                              {offer?.billingType == "POSTPAID" && "POST-PAYÉ"}
                              {offer?.billingType == "HYBRID" && "HYBRIDE"}
                            </b>
                          </td>
                        </tr>
                        <tr>
                          <td>Catégorie :</td>
                          <td className="">
                            <b>
                              {offer?.category == "MOBILE" ? "MOBILE" : "FIXE"}
                            </b>
                          </td>
                        </tr>
                        <tr>
                          <td>Zone d'usage :</td>
                          <td className="">
                            <b>{offer?.area?.title}</b>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
                <div className="p-2 px-4">
                  <hr className="m-0" />
                </div>
                <div className="p-1">
                  <div className="row">
                    <div className="col-md-6">
                      <div className="row">
                        <div className="col-md-6">
                          <div className="">
                            <b>
                              <em>Cible</em>
                            </b>{" "}
                            :
                          </div>
                          <div className="p-2 border bg-white  ">
                            <div
                              dangerouslySetInnerHTML={{
                                __html: offer?.target,
                              }}
                            />
                          </div>
                        </div>
                        <div className="col-md-6">
                          <div className="">
                            <b>
                              <em>Mode d'accès</em>
                            </b>{" "}
                            :
                          </div>
                          <div className="p-2 border bg-white  ">
                            {offer?.accessModes?.length > 0 ? (
                              <ul>
                                {offer?.accessModes.map((am, i) => {
                                  return (
                                    <li key={"am" + i}>
                                      <div
                                        dangerouslySetInnerHTML={{
                                          __html: am?.content,
                                        }}
                                      />
                                    </li>
                                  );
                                })}
                              </ul>
                            ) : (
                              <div>Aucun mode d'accès sélectionné</div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="">
                        <b>
                          <em>Description</em>
                        </b>{" "}
                        :
                      </div>
                      <div className="p-2 border bg-white  ">
                        <div
                          dangerouslySetInnerHTML={{
                            __html: offer?.description,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div>
              <div className=" p-2 mb-4">
                <div className="alert alert-success p-1 m-0 rounded-0 ">
                  <div className="" style={{ fontSize: 20 }}>
                    <b>
                      <em>Formules liées à l'offre</em>
                    </b>
                  </div>
                </div>
                <div className="mb-4">
                  {offer?.formulas?.length > 0 ? (
                    <>
                      <table className="table table-bordered table-striped">
                        <thead>
                          <tr className="bg-secondary">
                            <th className=" text-center" style={{ width: 40 }}>
                              N°
                            </th>
                            <th className=" text-center">
                              <em>CONTENU(S)</em>
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {offer?.formulas.map((form, i) => {
                            return (
                              <React.Fragment key={"frm" + i}>
                                <tr className="p-0 m-0">
                                  <td
                                    className="p-2 align-content-center align-self-center"
                                    style={{ width: 30 }}
                                  >
                                    <div className="text-center">
                                      <b>{i + 1} </b>
                                    </div>
                                  </td>
                                  {form?.price && (
                                    <>
                                      <td className="p-1 m-0 ">
                                        <div className=" bg-light">
                                          <div className="row ">
                                            <div className="col-md-9">
                                              <div
                                                className="px-1 alert alert-info p-1 rounded-0 m-0"
                                                style={{ fontSize: 16 }}
                                              >
                                                <b>{strUcFirst(form?.title)}</b>
                                              </div>
                                            </div>
                                            <div className="col-md-3">
                                              <div className="text-center">
                                                <div style={{ fontSize: 16 }}>
                                                  <b>
                                                    {handleNumThousand(
                                                      form.price.value,
                                                    )}{" "}
                                                    FCFA
                                                  </b>
                                                </div>
                                                <div>
                                                  <em>
                                                    Valable{" "}
                                                    <b>
                                                      {" "}
                                                      {form.validity} jour(s)
                                                    </b>
                                                  </em>{" "}
                                                </div>
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                        <div
                                          style={{ paddingLeft: 10 }}
                                          className="border p-2"
                                        >
                                          <div className="row">
                                            <div className="col-md-6">
                                              <small>
                                                <table
                                                  style={{ paddingLeft: 10 }}
                                                >
                                                  {form.serviceDetail &&
                                                    form.serviceDetail.map(
                                                      (s, ii) => {
                                                        if (
                                                          s.service.title ==
                                                          "VOIX"
                                                        ) {
                                                          return (
                                                            <>
                                                              <tr>
                                                                <td>
                                                                  <i className="fa-solid fa-phone me-2"></i>{" "}
                                                                  Appel
                                                                </td>
                                                                <td className="px-1">
                                                                  <b>
                                                                    {s.quantity}{" "}
                                                                    min
                                                                  </b>
                                                                </td>
                                                                <td>
                                                                  <span>
                                                                    {" "}
                                                                    {s.billingSteps && (
                                                                      <>
                                                                        | Pas:{" "}
                                                                        {
                                                                          s.billingSteps
                                                                        }{" "}
                                                                        F/min{" "}
                                                                      </>
                                                                    )}
                                                                  </span>
                                                                </td>
                                                              </tr>
                                                            </>
                                                          );
                                                        }
                                                        if (
                                                          s.service.title ==
                                                          "SMS"
                                                        ) {
                                                          return (
                                                            <>
                                                              <tr>
                                                                <td>
                                                                  <i className="fa-solid fa-comment-sms me-2"></i>{" "}
                                                                  SMS
                                                                </td>
                                                                <td className="px-1">
                                                                  <b>
                                                                    {s.quantity}{" "}
                                                                    sms
                                                                  </b>
                                                                </td>
                                                                <td>
                                                                  <span>
                                                                    {" "}
                                                                    {s.billingSteps && (
                                                                      <>
                                                                        | Pas:{" "}
                                                                        {
                                                                          s.billingSteps
                                                                        }{" "}
                                                                        F/sms{" "}
                                                                      </>
                                                                    )}
                                                                  </span>
                                                                </td>
                                                              </tr>
                                                            </>
                                                          );
                                                        }
                                                        if (
                                                          s.service.title ==
                                                          "DATA"
                                                        ) {
                                                          return (
                                                            <>
                                                              <tr>
                                                                <td className="">
                                                                  <i className="fa-solid fa-globe me-2"></i>{" "}
                                                                  Internet{" "}
                                                                </td>
                                                                <td className="px-1">
                                                                  <b>
                                                                    {Number(
                                                                      s.quantity,
                                                                    ) >=
                                                                    1024 ? (
                                                                      <>
                                                                        {" "}
                                                                        {convertMoToGo(
                                                                          s.quantity,
                                                                        )}
                                                                      </>
                                                                    ) : (
                                                                      <>
                                                                        {" "}
                                                                        {
                                                                          s.quantity
                                                                        }
                                                                      </>
                                                                    )}
                                                                  </b>
                                                                </td>
                                                                <td>
                                                                  <span>
                                                                    {" "}
                                                                    {s.billingSteps && (
                                                                      <>
                                                                        | Pas:{" "}
                                                                        {
                                                                          s.billingSteps
                                                                        }{" "}
                                                                        F/Mo{" "}
                                                                      </>
                                                                    )}
                                                                  </span>
                                                                </td>
                                                              </tr>
                                                            </>
                                                          );
                                                        }
                                                      },
                                                    )}
                                                  {services &&
                                                    services?.map((s, ii) => {
                                                      if (
                                                        form.serviceDetail
                                                          .services?.[
                                                          s.title
                                                        ] === true
                                                      ) {
                                                        return (
                                                          <div
                                                            key={"bp" + ii}
                                                            className=""
                                                            style={{
                                                              paddingLeft: 10,
                                                            }}
                                                          >
                                                            <div className="d-flex">
                                                              {s.code ==
                                                                "SER-001" && (
                                                                <span>
                                                                  <i className="fa-solid fa-phone me-2"></i>
                                                                  {
                                                                    form
                                                                      .settlement
                                                                      .services?.[
                                                                      "quantity" +
                                                                        s.title
                                                                    ]
                                                                  }
                                                                  minutes
                                                                  d'appel
                                                                  {form
                                                                    .settlement
                                                                    .services?.[
                                                                    "bStep" +
                                                                      s.title
                                                                  ] && (
                                                                    <>
                                                                      | Pas:
                                                                      {
                                                                        form
                                                                          .settlement
                                                                          .services?.[
                                                                          "bStep" +
                                                                            s.title
                                                                        ]
                                                                      }
                                                                      F/min
                                                                    </>
                                                                  )}
                                                                  |
                                                                  {form
                                                                    .settlement
                                                                    .services?.[
                                                                    "comType" +
                                                                      s.title
                                                                  ] ==
                                                                    "allNet" &&
                                                                    "Tous les réseaux"}
                                                                  {form
                                                                    .settlement
                                                                    .services?.[
                                                                    "comType" +
                                                                      s.title
                                                                  ] ==
                                                                    "onNet" &&
                                                                    "On-Net"}
                                                                  {form
                                                                    .settlement
                                                                    .services?.[
                                                                    "comType" +
                                                                      s.title
                                                                  ] ==
                                                                    "offNet" &&
                                                                    "Off-Net"}
                                                                </span>
                                                              )}
                                                              {s.code ==
                                                                "SER-010" && (
                                                                <span>
                                                                  <i className="fa-solid fa-comment-sms me-2"></i>
                                                                  {
                                                                    form
                                                                      .settlement
                                                                      .services?.[
                                                                      "quantity" +
                                                                        s.title
                                                                    ]
                                                                  }
                                                                  SMS
                                                                  {form
                                                                    .settlement
                                                                    .services?.[
                                                                    "bStep" +
                                                                      s.title
                                                                  ] && (
                                                                    <>
                                                                      | Pas:
                                                                      {
                                                                        form
                                                                          .settlement
                                                                          .services?.[
                                                                          "bStep" +
                                                                            s.title
                                                                        ]
                                                                      }
                                                                      F/sms
                                                                    </>
                                                                  )}
                                                                  |
                                                                  {form
                                                                    .settlement
                                                                    .services?.[
                                                                    "comType" +
                                                                      s.title
                                                                  ] ==
                                                                    "allNet" &&
                                                                    "Tous les réseaux"}
                                                                  {form
                                                                    .settlement
                                                                    .services?.[
                                                                    "comType" +
                                                                      s.title
                                                                  ] ==
                                                                    "onNet" &&
                                                                    "On-Net"}
                                                                  {form
                                                                    .settlement
                                                                    .services?.[
                                                                    "comType" +
                                                                      s.title
                                                                  ] ==
                                                                    "offNet" &&
                                                                    "Off-Net"}
                                                                </span>
                                                              )}
                                                              {s.code ==
                                                                "SER-100" && (
                                                                <span>
                                                                  <i className="fa-solid fa-globe me-2"></i>
                                                                  Internet
                                                                  {Number(
                                                                    form
                                                                      .settlement
                                                                      .services?.[
                                                                      "quantity" +
                                                                        s.title
                                                                    ],
                                                                  ) >= 1024
                                                                    ? convertMoToGo(
                                                                        form
                                                                          .settlement
                                                                          .services?.[
                                                                          "quantity" +
                                                                            s.title
                                                                        ],
                                                                        2,
                                                                      ) + " Go"
                                                                    : form
                                                                        .settlement
                                                                        .services?.[
                                                                        "quantity" +
                                                                          s.title
                                                                      ] + " Mo"}
                                                                  | Pas:
                                                                  {
                                                                    form
                                                                      .settlement
                                                                      .services?.[
                                                                      "bStep" +
                                                                        s.title
                                                                    ]
                                                                  }
                                                                  F/Mo
                                                                </span>
                                                              )}
                                                            </div>
                                                          </div>
                                                        );
                                                      }
                                                    })}
                                                </table>
                                              </small>
                                            </div>
                                            <div className="col-md-6">
                                              <div
                                                style={{
                                                  padding: 2,
                                                  borderLeft: "1px solid gray",
                                                }}
                                              ></div>
                                            </div>
                                          </div>
                                          {form?.advantages?.length > 0 &&
                                            form?.advantages && (
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
                                                        <b>
                                                          Autres avantages :
                                                        </b>
                                                      </u>
                                                    </small>
                                                  </div>
                                                  <div>
                                                    {form?.advantages?.map(
                                                      (adv, ii) => {
                                                        return (
                                                          <React.Fragment
                                                            key={"adv" + ii}
                                                          >
                                                            <div>
                                                              <div>
                                                                <div className="p-2   ">
                                                                  <div
                                                                    dangerouslySetInnerHTML={{
                                                                      __html:
                                                                        adv?.title,
                                                                    }}
                                                                  />
                                                                </div>
                                                              </div>
                                                            </div>
                                                          </React.Fragment>
                                                        );
                                                      },
                                                    )}
                                                  </div>
                                                </div>
                                              </>
                                            )}
                                          <div>
                                            {form?.children &&
                                              childrenTemplate(form?.children)}
                                          </div>
                                          {/* {form.settlement?.services.map((s,ii) => {
                                                                                                                              return <div>
          
                                                                                                                              </div>
                                                                                                                          })} */}
                                          {/* <div className=''>
                                                                                                                                  10 Min <b style={{ fontSize: 12 }}><em>[2F/Min]</em></b>
                                                                                                                                  -- 50 SMS <b style={{ fontSize: 12 }}><em>[10F/SMS]</em></b>
                                                                                                                                  -- 50Mo <b style={{ fontSize: 12 }}><em>[5F/Mo]</em></b>
                                                                                                                              </div> */}
                                        </div>
                                      </td>
                                    </>
                                  )}
                                  {form?.type == "bill" && (
                                    <>
                                      <td className="p-1 m-0">
                                        <div className=" bg-light">
                                          <div className="row ">
                                            <div className="col-md-9">
                                              <div
                                                className="px-1 alert alert-info p-1 rounded-0 m-0"
                                                style={{ fontSize: 16 }}
                                              >
                                                <b>{strUcFirst(form?.title)}</b>
                                              </div>
                                            </div>
                                            <div className="col-md-3">
                                              <div className="d-flex justify-content-end">
                                                <div>
                                                  Valable
                                                  <b>
                                                    {form.settlement.validity}
                                                    jour(s)
                                                  </b>
                                                </div>
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                        <div
                                          style={{ paddingLeft: 10 }}
                                          className="border p-2"
                                        >
                                          {services &&
                                            services?.map((s, ii) => {
                                              if (
                                                s.title ===
                                                form.settlement.service
                                              ) {
                                                return (
                                                  <div
                                                    key={"bF" + ii}
                                                    className=""
                                                    style={{ paddingLeft: 10 }}
                                                  >
                                                    <small>
                                                      <div className="d-flex">
                                                        {s.code ==
                                                          "SER-001" && (
                                                          <span>
                                                            <i className="fa-solid fa-phone me-2"></i>
                                                            {
                                                              form.settlement
                                                                ?.quantity
                                                            }
                                                            F CFA la minutes
                                                            d'appel
                                                            {form.settlement
                                                              ?.billingStep && (
                                                              <>
                                                                | Pas:
                                                                {
                                                                  form
                                                                    .settlement
                                                                    ?.billingStep
                                                                }
                                                                F/min
                                                              </>
                                                            )}
                                                            |
                                                            {form.settlement
                                                              ?.comType ==
                                                              "allNet" &&
                                                              "Tous les réseaux"}
                                                            {form.settlement
                                                              ?.comType ==
                                                              "onNet" &&
                                                              "On-Net"}
                                                            {form.settlement
                                                              ?.comType ==
                                                              "offNet" &&
                                                              "Off-Net"}
                                                          </span>
                                                        )}
                                                        {s.code ==
                                                          "SER-010" && (
                                                          <span>
                                                            <i className="fa-solid fa-comment-sms me-2"></i>
                                                            {
                                                              form.settlement
                                                                .quantity
                                                            }
                                                            SMS
                                                            {form.settlement
                                                              ?.billingStep && (
                                                              <>
                                                                | Pas:
                                                                {
                                                                  form
                                                                    .settlement
                                                                    ?.billingStep
                                                                }
                                                                F/ sms
                                                              </>
                                                            )}
                                                            |
                                                            {form.settlement
                                                              ?.comType ==
                                                              "allNet" &&
                                                              "Tous les réseaux"}
                                                            {form.settlement
                                                              ?.comType ==
                                                              "onNet" &&
                                                              "On-Net"}
                                                            {form.settlement
                                                              ?.comType ==
                                                              "offNet" &&
                                                              "Off-Net"}
                                                          </span>
                                                        )}
                                                        {s.code ==
                                                          "SER-100" && (
                                                          <span>
                                                            <i className="fa-solid fa-globe me-2"></i>
                                                            Internet
                                                            {Number(
                                                              form.settlement
                                                                .quantity,
                                                            ) >= 1024
                                                              ? convertMoToGo(
                                                                  form
                                                                    .settlement
                                                                    .quantity,
                                                                  2,
                                                                ) + " Go"
                                                              : form.settlement
                                                                  .quantity +
                                                                " Mo"}
                                                            | Pas:
                                                            {
                                                              form.settlement
                                                                .billingStep
                                                            }
                                                            F/mo
                                                          </span>
                                                        )}
                                                      </div>
                                                    </small>
                                                  </div>
                                                );
                                              }
                                            })}
                                          <div
                                            className=""
                                            style={{ paddingLeft: 50 }}
                                          >
                                            <div>
                                              <small>
                                                <u>
                                                  <b>Autres avantages :</b>
                                                </u>
                                              </small>
                                            </div>
                                            <div>
                                              {form?.advantages?.map(
                                                (adv, ii) => {
                                                  return (
                                                    <React.Fragment
                                                      key={"adv" + ii}
                                                    >
                                                      <div>
                                                        <div>
                                                          <small>
                                                            * {adv?.name}
                                                          </small>
                                                        </div>
                                                      </div>
                                                    </React.Fragment>
                                                  );
                                                },
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                        {/* {form.settlement?.services.map((s,ii) => {
                                                                                                                              return <div>
          
                                                                                                                              </div>
                                                                                                                          })} */}
                                      </td>
                                    </>
                                  )}
                                </tr>
                              </React.Fragment>
                            );
                          })}
                        </tbody>
                      </table>
                    </>
                  ) : (
                    <>
                      <div className="alert alert-warning ">
                        <div className="text-center">
                          Aucune formule n'a été ajouter
                        </div>
                      </div>
                    </>
                  )}
                </div>
                {offer?.validation && (
                  <>
                    <div className="border border-2 px-1">
                      <div className=" p-2 px-0 mb-2">
                        <div
                          /* BUGFIX: le bandeau affichait le mot « VALIDER » en
                             dur, quelle que soit la décision, et ne connaissait
                             que deux couleurs (vert pour ALLOW, rouge pour tout
                             le reste) : une offre SUSPENDUE s affichait donc en
                             rouge avec la mention « VALIDER ». */
                          className={`alert d-flex justify-content-between align-items-center p-1 m-0 rounded-0 ${
                            offer?.validation?.status === "ALLOW"
                              ? "alert-success"
                              : offer?.validation?.status === "SUSPENDED"
                                ? "alert-warning"
                                : offer?.validation?.status === "DINIED"
                                  ? "alert-danger"
                                  : "alert-secondary"
                          }`}
                        >
                          <div className="" style={{ fontSize: 20 }}>
                            <b>
                              <em>Validation</em>
                            </b>
                          </div>
                          <div>
                            <div className="p-1 px-4 fw-bold">
                              {offer?.validation?.status === "ALLOW"
                                ? "VALIDÉE"
                                : offer?.validation?.status === "SUSPENDED"
                                  ? "SUSPENDUE"
                                  : offer?.validation?.status === "DINIED"
                                    ? "REFUSÉE"
                                    : "EN ATTENTE"}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="row">
                        {offer?.validation?.comments &&
                          offer?.validation?.comments?.map((c, i) => {
                            if (c?.type == "AUTO") {
                              return (
                                <React.Fragment key={"comment-" + i}>
                                  <div className="col-md-4">
                                    <div className="alert alert-secondary">
                                      <div className="d-flex justify-content-between mb-3">
                                        <div>
                                          <h4 className="text-center">
                                            Réponse de l'IA
                                          </h4>
                                        </div>
                                        {/* <div><button className="btn btn-sm btn-outline-primary"><i className="fa fa-eye me-1"></i> Voir plus</button></div> */}
                                      </div>
                                      <div className="card border-0 text-center card-lg bg-white">
                                        <div className="card-body p-6">
                                          <div
                                            dangerouslySetInnerHTML={{
                                              __html: c?.content,
                                            }}
                                          />
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </React.Fragment>
                              );
                            } else if (c?.type == "MAIL") {
                              return (
                                <React.Fragment key={"comment-" + i}>
                                  <div className="col-md-4">
                                    <div className="alert alert-secondary">
                                      <div className="d-flex justify-content-between mb-3">
                                        <div>
                                          <h4 className="text-center">
                                            Projet de Mail
                                          </h4>
                                        </div>
                                        {/* <div><button className="btn btn-sm btn-outline-primary"><i className="fa fa-eye me-1"></i> Voir plus</button></div> */}
                                      </div>
                                      <div className="card border-0 text-center card-lg bg-white">
                                        <div className="card-body p-6">
                                          <div
                                            dangerouslySetInnerHTML={{
                                              __html: c?.content,
                                            }}
                                          />
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </React.Fragment>
                              );
                            } else if (c?.type == "BYHAND") {
                              return (
                                <React.Fragment key={"comment-" + i}>
                                  <div className="col-md-4">
                                    <div className="alert alert-secondary">
                                      <div className="d-flex justify-content-between mb-3">
                                        <div>
                                          <h4 className="text-center">
                                            Commentaire
                                          </h4>
                                        </div>
                                        {/* <div><button className="btn btn-sm btn-outline-primary"><i className="fa fa-eye me-1"></i> Voir plus</button></div> */}
                                      </div>
                                      <div className="card border-0 text-center card-lg bg-white">
                                        <div className="card-body p-6">
                                          <div
                                            dangerouslySetInnerHTML={{
                                              __html: c?.content,
                                            }}
                                          />
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </React.Fragment>
                              );
                            }
                          })}
                      </div>
                    </div>
                  </>
                )}
                {/* Aperçu du document joint : gère les cas "aucun document" et
                    "fichier introuvable" avec un message explicite. */}
                <OfferDocumentViewer
                  document={offer?.document}
                  height={900}
                  title={`Document de l'offre ${offer?.code ?? ""}`}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </Dialog>
  );
}
