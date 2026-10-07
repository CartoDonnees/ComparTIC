import { Dialog } from "primereact/dialog";
import React, { useRef, useState } from "react";
import { useReactToPrint } from "react-to-print";

export default function AdminViewOrganizationDialog({
  visible,
  setVisible,
  organization,
}) {
  const [position, setPosition] = useState("center");
  const [max, setMax] = useState(true);

  const contentRef = useRef();

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
      header={<div>Details de zone</div>}
      visible={visible}
      modal
      style={{ width: "50vw" }}
      onHide={() => onHide("displayMaximizable")}
      position="center"
      // maximizable={max}
    >
      {/* <div className="mb-2">
                <button className="btn btn-dark btn-block mb-0 mr-2" onClick={() => handlePrint()}><i className="fa fa-print mr-2"></i> Imprimer</button>
                <hr />
            </div> */}

      <div className="border p-2">
        <div ref={contentRef}>
          <h4 className="">
            <b>{organization?.name}</b>
          </h4>
          {/* <div className="card-shadow-primary mb-3 widget-chart widget-chart2 text-left card p-2"> */}
          <div className="alert alert-info">
            <div className=" mb-3 widget-chart widget-chart2 text-left  p-2">
              <div> {organization?.description} </div>
            </div>
          </div>
        </div>
        <div className="card-shadow-primary mb-3 widget-chart widget-chart2 text-left card">
          <div className="widget-chat-wrapper-outer">
            <div className="widget-chart-content  p-2">
              <h6 className="widget-subheading">Pays concernés :</h6>
              <div className="widget-chart-flex">
                <div className="widget-numbers mb-0 w-100">
                  <div className="widget-chart-flex">
                    <div className="fsize-4">
                      <ul>
                        {organization?.countries &&
                          organization?.countries.map((org, i) => {
                            return (
                              <li className="list-group-item py-5">
                                <div className="d-flex justify-content-between">
                                  <div className="d-flex">
                                    {/* img */}
                                    <img
                                      src="images/default.png"
                                      alt=""
                                      style={{ height: 20, width: 40 }}
                                    />
                                    <div className="ms-4">
                                      <p className="mb-0 small">{org.name}</p>
                                    </div>
                                  </div>
                                </div>
                              </li>
                            );
                          })}
                      </ul>{" "}
                      <b>{organization?.email}</b>{" "}
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
