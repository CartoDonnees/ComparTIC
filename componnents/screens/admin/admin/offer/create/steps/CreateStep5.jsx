import OfferDocumentViewer from "@/componnents/document/OfferDocumentViewer";
import { BASE_IMG_URL } from "@/services/tools/constants";
import {
  addDays,
  handleNumThousand,
  strUcFirst,
} from "@/services/tools/convertions";
import { convertMoToGo, formatDateToFrench } from "@/services/tools/helper";
import React, { useRef } from "react";
import { useReactToPrint } from "react-to-print";

export default function CreateStep5({
  step,
  offer,
  offerType,
  previewDocument,
  document,
  services,
  destinations,
  selectOrgans,
  selectCountries,
  handleSubmitOffer,
  // Enregistrement en brouillon (sans soumission)   facultatif.
  handleSaveDraft,
  savingDraft = false,
}) {
  // Impression du résumé : la référence cible la feuille récapitulative
  const recapRef = useRef(null);
  const handlePrintRecap = useReactToPrint({
    contentRef: recapRef,
    documentTitle: `Resume_offre_${offer?.code ?? ""}`,
  });

  const currentDate = new Date();

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
                                                ]
                                              ) >= 1024
                                                ? convertMoToGo(
                                                    form.settlement.services?.[
                                                      "quantity" + s.title
                                                    ],
                                                    2
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
                                                    form.settlement.quantity
                                                  ) >= 1024
                                                    ? convertMoToGo(
                                                        form.settlement
                                                          .quantity,
                                                        2
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
      <div className="p-2 offer-recap">
        <div className="card mb-2">
          <div className="card-header bg-light4">
            <div className="d-flex justify-content-between">
              <div>
                <b>RESUME DE L'OFFRE</b>
              </div>
              <button
                className="btn btn-sm btn-warning"
                type="button"
                onClick={() => handlePrintRecap?.()}
              >
                <i className="fa fa-print me-2"></i> Imprimer
              </button>
            </div>
          </div>
          <div className="card-body bg-primary1 ">
            {/* ZONE IMPRIMÉE.
                Deux correctifs :
                  - le `ref` était posé PLUS BAS : la nature de l offre
                    (promotionnelle / de base) et l offre parente restaient
                    hors du document imprimé ;
                  - les styles du récapitulatif sont écrits sous `.offer-recap`,
                    or react-to-print ne clone que le nœud référencé, sans ses
                    ancêtres : la classe est reportée ici pour que la mise en
                    forme survive à l impression. */}
            <div className="offer-recap recap-print bg-shadow" ref={recapRef}>
              {/* En-tête visible uniquement sur le document imprimé. */}
              <div className="recap-print-head">
                <div className="recap-print-title">RÉSUMÉ DE L'OFFRE</div>
                <div className="recap-print-meta">
                  {offer?.code ? `Code : ${offer.code} - ` : ""}
                  ARTCI · CompareTIC - édité le{" "}
                  {currentDate.toLocaleDateString("fr-FR")}
                </div>
              </div>
            <div className="d-flex justify-content-between">
              {offerType == 1 ? (
                <>
                  <div
                    className="d-flex justify-content-center"
                    style={{ fontSize: 30 }}
                  >
                    <img src="images/promo.png" alt="" style={{ height: 40 }} />{" "}
                    <em>
                      <b>Offre Promotionnelle </b>{" "}
                    </em>
                  </div>
                </>
              ) : (
                <>
                  <div>OFFRE DE BASE</div>
                </>
              )}
              <div style={{ fontSize: 20 }}> <b>OFFRE PARENT</b>: {offer?.parentOffer?.title || "Aucune"  } </div>
            </div>
            <div className="alert alert-info p-2 m-0 mb-2 rounded-0">
              <div className="d-flex justify-content-between ">
                <div className="text-center">
                  <h2 className="m-0 p-0">{offer?.title}</h2>
                </div>
                <div>
                  <h4>
                    <b>CODE: {offer?.code}</b>
                  </h4>
                </div>
              </div>
            </div>
            <div className="alert alert-warning p-2 m-0 mb-2 rounded-0">
              <div className="row">
                <div className="col-md-4">
                  <div>
                    <div>
                      Date d'enregistrement : {formatDateToFrench(currentDate)}
                    </div>
                    <div>
                      <div>
                        Date Notification ARTCI:
                        <b>{formatDateToFrench(offer?.notifDate)}</b>
                      </div>
                      <div className="text-danger">
                        Date de lancement souhaitée:
                        <b>{formatDateToFrench(offer?.startDate)}</b>
                      </div>
                      {offerType == 1 && (
                        <>
                          <div className="text-info">
                            Date de fin:
                            <b>
                              {addDays(offer?.startDate, offer?.specialPromotion?.duration)}
                            </b>{" "}
                            [[
                            <b>{offer?.specialDuration?.duration} jour(s)</b>]]
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="d-flex justify-content-center">
                    <div>
                      <div className="">
                        {offerType == 1 && (
                          <>
                            <div>
                              Type de promotion :
                              {offerType == 1 && (
                                <>
                                  {offer?.promoType == "FLASH" && <b>FLASH</b>}
                                  {offer?.promoType == "PERIOD" && (
                                    <b>PERIODIQUE</b>
                                  )}
                                  {offer?.promoType == "SPECIAL" && (
                                    <b>SPECIALE</b>
                                  )}
                                  {offer?.promoType == "CUSTOMIZE" && (
                                    <b>PERSONALISEE</b>
                                  )}
                                </>
                              )}
                            </div>
                          </>
                        )}

                        <div>
                          Type de client :
                          <b>
                            {offer?.billingType == 1 ? "PRE-PAYE" : "POST-PAYE"}
                          </b>
                        </div>
                      </div>
                      <div className="">
                        <div>
                          Catégorie :
                          <b>{offer?.category == 1 ? "MOBILE" : "FIXE"}</b>
                        </div>
                        <div>
                          Zone d'usage : <b>{offer?.area?.title}</b>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="d-flex justify-content-end">
                    {offer?.operator ? (
                      <>
                        <img
                          src={
                            BASE_IMG_URL +
                            offer?.operator?.imagePath
                          }
                          className="rounded"
                          alt=""
                          style={{ height: 100, width: 100 }}
                        />
                      </>
                    ) : (
                      <>
                        <img
                          src="/images/default.png"
                          className="rounded"
                          alt=""
                          style={{ height: 100, width: 100 }}
                        />
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
            {/* La zone imprimée se refermait ICI : destinations, cible,
                description, formules et document associé restaient hors du
                document. Sa fermeture est reportée après le dernier bloc. */}
            <div className="row mb-4">
              <div className="col-md-4">
                {offer?.area?.title != "NATIONALE" && (
                  <>
                    <div className="alert alert-success p-1 m-0 rounded-0">
                      <div className="text-center">DESTINATION</div>
                    </div>
                    <div className="border p-2 mb-4">
                      <div className="row">
                        {destinations &&
                          destinations.map((org, i) => {
                            if (selectOrgans?.[org.name]?.value) {
                              return (
                                <div key={"dest11" + i} className="col-md-3">
                                  <div>
                                    <b>{org.name}</b>
                                  </div>
                                  {selectOrgans?.[org.name]?.value && (
                                    <>
                                      <div
                                        className="scrollspy-example bg-white scroll-container m-0"
                                        style={{ paddingLeft: 10 }}
                                      >
                                        {org?.countries &&
                                          org?.countries.map((c, ii) => {
                                            if (
                                              selectCountries?.[c.name]
                                                ?.value == true
                                            ) {
                                              return (
                                                <div key={"dccc1" + ii}>
                                                  <label
                                                    className="form-check-label d-inline "
                                                    htmlFor={"cont1" + ii}
                                                  >
                                                    {c.name}
                                                  </label>
                                                </div>
                                              );
                                            }
                                          })}
                                      </div>
                                    </>
                                  )}
                                </div>
                              );
                            }
                          })}
                      </div>
                    </div>
                  </>
                )}
                <div className="bg-shadow">
                  <div className="alert alert-success p-1 m-0 rounded-0 ">
                    <div className="text-center"><b>CIBLE</b> </div>
                  </div>
                  <div className="border w-100 p-2 mb-4 bg-white">
                    <div dangerouslySetInnerHTML={{ __html: offer?.target }} />
                  </div>
                </div>
                <div className="bg-shadow">
                  <div className="alert alert-success p-1 m-0 rounded-0">
                    <div className="text-center"><b>MODE D'ACCES</b></div>
                  </div>
                  <div className="border p-2 mb-4 bg-white">
                    {offer?.accessModes ? (
                      <>
                        {offer?.accessModes &&
                          offer?.accessModes.map((a, i) => {
                            return (
                              <React.Fragment key={"acK" + i}>
                                <div className="d-flex justify-content-between">
                                  <div className="" style={{}}>
                                    <table className="table table-bordered mb-1 pb-1">
                                      <tbody>
                                        <tr>
                                          <td className="p-1 bg-primary1">
                                            {" "}
                                            {i + 1}{" "}
                                          </td>
                                          <td>
                                            <div
                                              dangerouslySetInnerHTML={{
                                                __html: a.content,
                                              }}
                                            />
                                          </td>
                                        </tr>
                                      </tbody>
                                    </table>
                                  </div>
                                  <div className="d-flex justify-content-between">
                                    {step != 5 && (
                                      <>
                                        <button
                                          className="btn btn-sm btn-info me-2"
                                          onClick={() =>
                                            handleEditAccessMode(a)
                                          }
                                        >
                                          <i className="fa fa-edit"></i>
                                        </button>
                                        <button
                                          className="btn btn-sm btn-danger"
                                          onClick={() => handleDeleteAcMode(a)}
                                        >
                                          <i className="fa fa-trash"></i>
                                        </button>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </React.Fragment>
                            );
                          })}
                      </>
                    ) : (
                      <>
                        <div className="alert alert-warning text-center">
                          <div className="">
                            <i
                              className="fa-solid fa-triangle-exclamation"
                              style={{ fontSize: 40 }}
                            ></i>
                          </div>
                          <div>Aucun mode d'accès definis !</div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="col-md-8 ">
                <div className="bg-white p-0 bg-shadow h-100">
                <div className="alert alert-success p-1 m-0 rounded-0">
                  <div className="text-center"><b>DESCRIPTION</b> </div>
                </div>
                <div className="p-2   ">
                  <div
                    dangerouslySetInnerHTML={{ __html: offer?.description }}
                  />
                </div>
                </div>
              </div>
            </div>
            <div className="bg-white bg-shadow">
              <div className="alert alert-primary p-1 m-0 rounded-0">
                <div className="text-center"><b>FORMULES</b></div>
              </div>
              <div className="p-2 border border-orangered mb-4">
                {offer?.formulas?.length > 0 ? (
                  <>
                    <table className="table table-bordered table-striped">
                      <thead>
                        <tr className="bg-secondary">
                          <th
                            className="text-white text-center"
                            style={{ width: 40 }}
                          >
                            N°
                          </th>
                          <th className="text-white text-center"><em>CONTENU(S)</em></th>
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
                                {form?.type == "price" && (
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
                                            <div className="d-flex justify-content-end">
                                              <div>
                                                <b>
                                                  {handleNumThousand(
                                                    form.settlement.price
                                                  )}
                                                  FCFA
                                                </b>
                                                | Valable
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
                                        <div className="row">
                                          <div className="col-md-6">
                                            <small>
                                              {services &&
                                                services?.map((s, ii) => {
                                                  if (
                                                    form.settlement.services?.[
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
                                                                form.settlement
                                                                  .services?.[
                                                                  "quantity" +
                                                                    s.title
                                                                ]
                                                              }
                                                              minutes d'appel
                                                              {form.settlement
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
                                                              {form.settlement
                                                                .services?.[
                                                                "comType" +
                                                                  s.title
                                                              ] == "allNet" &&
                                                                "Tous les réseaux"}
                                                              {form.settlement
                                                                .services?.[
                                                                "comType" +
                                                                  s.title
                                                              ] == "onNet" &&
                                                                "On-Net"}
                                                              {form.settlement
                                                                .services?.[
                                                                "comType" +
                                                                  s.title
                                                              ] == "offNet" &&
                                                                "Off-Net"}
                                                            </span>
                                                          )}
                                                          {s.code ==
                                                            "SER-010" && (
                                                            <span>
                                                              <i className="fa-solid fa-comment-sms me-2"></i>
                                                              {
                                                                form.settlement
                                                                  .services?.[
                                                                  "quantity" +
                                                                    s.title
                                                                ]
                                                              }
                                                              SMS
                                                              {form.settlement
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
                                                              {form.settlement
                                                                .services?.[
                                                                "comType" +
                                                                  s.title
                                                              ] == "allNet" &&
                                                                "Tous les réseaux"}
                                                              {form.settlement
                                                                .services?.[
                                                                "comType" +
                                                                  s.title
                                                              ] == "onNet" &&
                                                                "On-Net"}
                                                              {form.settlement
                                                                .services?.[
                                                                "comType" +
                                                                  s.title
                                                              ] == "offNet" &&
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
                                                                  .services?.[
                                                                  "quantity" +
                                                                    s.title
                                                                ]
                                                              ) >= 1024
                                                                ? convertMoToGo(
                                                                    form
                                                                      .settlement
                                                                      .services?.[
                                                                      "quantity" +
                                                                        s.title
                                                                    ],
                                                                    2
                                                                  ) + " Go"
                                                                : form
                                                                    .settlement
                                                                    .services?.[
                                                                    "quantity" +
                                                                      s.title
                                                                  ] + " Mo"}
                                                              | Pas:
                                                              {
                                                                form.settlement
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
                                                  }
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
                                                      {s.code == "SER-001" && (
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
                                                                form.settlement
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
                                                            "onNet" && "On-Net"}
                                                          {form.settlement
                                                            ?.comType ==
                                                            "offNet" &&
                                                            "Off-Net"}
                                                        </span>
                                                      )}
                                                      {s.code == "SER-010" && (
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
                                                                form.settlement
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
                                                            "onNet" && "On-Net"}
                                                          {form.settlement
                                                            ?.comType ==
                                                            "offNet" &&
                                                            "Off-Net"}
                                                        </span>
                                                      )}
                                                      {s.code == "SER-100" && (
                                                        <span>
                                                          <i className="fa-solid fa-globe me-2"></i>
                                                          Internet
                                                          {Number(
                                                            form.settlement
                                                              .quantity
                                                          ) >= 1024
                                                            ? convertMoToGo(
                                                                form.settlement
                                                                  .quantity,
                                                                2
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
                                              }
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
                                {!form?.type && (
                                  <>
                                    <td className="p-1 m-0 ">
                                      <div className="px-1">
                                        <small>
                                          <b>{form?.title}</b>
                                        </small>
                                      </div>

                                      <div>
                                        {form?.children &&
                                          childrenTemplate(form?.children)}
                                      </div>
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
                        Aucune formules n'a été ajouter
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
            <div className="bg-white bg-shadow">
              <div className="alert text-white bg-dark p-1 m-0 rounded-0">
                <div className="text-center"><b>DOCUMENT ASSOCIE</b></div>
              </div>
              <div className="border p-2 mb-4">
                {previewDocument || document?.filePath ? (
                  <>
                    <p className="">Aperçu du fichier joint</p>
                    <div className="position-relative">
                      {previewDocument ? (
                        <iframe
                          src={previewDocument}
                          title="Aperçu du document"
                          frameBorder="0"
                          height="1000"
                          style={{ width: "100%" }}
                        ></iframe>
                      ) : (
                        /* Fichier déjà stocké : message clair s il est introuvable */
                        <OfferDocumentViewer
                          document={{ path: document?.filePath }}
                          height={1000}
                          title="Document joint"
                        />
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="alert alert-warning text-center">
                      Aucun document associé !
                    </div>
                  </>
                )}
              </div>
            </div>
            {/* Fin de la zone imprimée (voir plus haut). */}
            </div>
          </div>
        </div>
        <div className="d-flex justify-content-center mb-5 gap-2">
          {handleSaveDraft && (
            <button
              type="button"
              className="btn btn-outline-secondary w-50"
              onClick={() => handleSaveDraft?.()}
              disabled={savingDraft}
              title="Enregistrer sans soumettre : l'offre restera modifiable et pourra être soumise plus tard"
            >
              {savingDraft ? (
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
              ) : (
                <i className="bi bi-save me-2"></i>
              )}
              Enregistrer comme brouillon
            </button>
          )}
          <button
            className="btn btn-block btn-success w-100"
            onClick={() => handleSubmitOffer?.()}
          >
            <i className="bi bi-send-fill me-2"></i>Enregistrer et soumettre
          </button>
        </div>
      </div>
    </div>
  );
}
