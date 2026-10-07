import { PROFILE_CODE_TO_ROLE, ROLE_LABELS } from "@/services/rbac/roles";
import { BASE_IMG_API, BASE_IMG_URL } from "@/services/tools/constants";
import { Dialog } from "primereact/dialog";
import React, { useEffect, useRef, useState } from "react";
import { useReactToPrint } from "react-to-print";

export default function AdminUserViewDialog({ visible, setVisible, user }) {
  const [position, setPosition] = useState("center");
  const [max, setMax] = useState(true);

  const contentRef = useRef();

  useEffect(() => {
    if (visible) {
      onClick();
    } else {
      onHide();
    }
  }, [visible]);

  const onClick = (position) => {
    setVisible(true);
    // handleGetTechnologiesData(technology?.id)
    if (position) {
      setPosition(position);
    }
  };

  const onHide = (name) => {
    setVisible(false);
    // handleInitVar()
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
      header="DETAILS DE L'UTILISATEUR"
      visible={visible}
      modal
      style={{ width: "50vw" }}
      onHide={() => onHide("displayMaximizable")}
      position="center"
      maximizable={max}
    >
      <div className="mb-2">
        <button
          className="btn btn-dark btn-block mb-0 mr-2"
          onClick={() => handlePrint()}
        >
          <i className="fa fa-print mr-2"></i> Imprimer
        </button>
        <hr />
      </div>

      <div ref={contentRef}>
        <div className="row">
          <div className="col-md-4">
            <div className="card-shadow-primary mb-3 widget-chart widget-chart2 text-left card">
              <div className="widget-chat-wrapper-outer">
                <div className="widget-chart-content  p-2">
                  {user?.imagePath ? (
                    <>
                      <img src={BASE_IMG_API + user?.imagePath} />
                    </>
                  ) : (
                    <>
                      <img src="images/default.png" />
                    </>
                  )}

                  <div className="widget-chart-flex">
                    <div className="widget-numbers mb-0 w-100">
                      <div className="widget-chart-flex">
                        <div className="fsize-4 text-center mt-2">
                          {/* <small className="opacity-5">$</small> */}
                          <h5></h5>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="col-md-8">
            <div className="row">
              <div className="col-md-12">
                <div className="card-shadow-primary mb-3 widget-chart widget-chart2 text-left card">
                  <div className="widget-chat-wrapper-outer">
                    <div className="widget-chart-content  p-2">
                      <h6 className="widget-subheading">Code :</h6>
                      <div className="widget-chart-flex">
                        <div className="widget-numbers mb-0 w-100">
                          <div className="widget-chart-flex">
                            <div className="fsize-4">
                              {/* <small className="opacity-5">$</small> */}
                              <b>{user?.code} </b>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-md-6">
                <div className="card-shadow-primary mb-3 widget-chart widget-chart2 text-left card">
                  <div className="widget-chat-wrapper-outer">
                    <div className="widget-chart-content  p-2">
                      <div className="mb-2">
                        <h6 className="  p-0 m-0">Nom :</h6>
                        <div>
                          <b>{user?.lastName} </b>
                        </div>
                      </div>
                      <div>
                        <h6 className="p-0 m-0">Prénoms :</h6>
                        <div>
                          <b>{user?.firstName} </b>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="card-shadow-primary mb-3 widget-chart widget-chart2 text-left card">
                  <div className="widget-chat-wrapper-outer">
                    <div className="widget-chart-content  p-2">
                      <h6 className="widget-subheading">Email :</h6>
                      <div className="widget-chart-flex">
                        <div className="widget-numbers mb-0 w-100">
                          <div className="widget-chart-flex">
                            <div className="fsize-4"> <b>{user?.email}</b> </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-md-6">
                <div className="card-shadow-primary mb-3 widget-chart widget-chart2 text-left card">
                  <div className="widget-chat-wrapper-outer">
                    <div className="widget-chart-content  p-2">
                      <div className="d-flex justify-content-center">
                        {["PRF0-TEST", "PRF-SUPERADMIN", "PRF-VAL1", "PRF-VAL2", "PRF-VAL3", "PRF-VAL4"].includes(user?.profile?.code) && (
                          <img
                            src="images/icons/admin.png"
                            style={{ height: 120 }}
                          />
                        )}
                        {user?.profile?.code == "PRF3-TEST" && (
                          <img
                            src="images/icons/user.png"
                            style={{ height: 120 }}
                          />
                        )}
                        {user?.profile?.code == "PRF1-TEST" && (
                          <img
                            src="images/icons/manager.png"
                            style={{ height: 120 }}
                          />
                        )}
                            {user?.profile?.code == "PRF2-TEST" && (
                              <img
                                src={
                                  BASE_IMG_URL +
                                  user?.focalPoint?.operator?.imagePath
                                }
                                style={{
                                  height: 120,
                                }}
                              />
                            )}
                      </div>

                  <div className="mt-2">
                    {user?.profile?.code == "PRF2-TEST" && (
                      <>
                        <div className="d-flex justify-content-between w-100 text-center">
                          <div>
                            Point focal de l'opérateur{" "}
                            <b>{user?.focalPoint?.operator?.name}</b>
                          </div>
                          <div>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                      <div className="text-center">
                        <b>
                          {ROLE_LABELS[PROFILE_CODE_TO_ROLE[user?.profile?.code]] || user?.profile?.name}
                        </b>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Dialog>
  );
}
