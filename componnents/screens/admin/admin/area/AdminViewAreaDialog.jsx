import { Dialog } from "primereact/dialog";
import React, { useRef, useState } from "react";
import { useReactToPrint } from "react-to-print";

export default function AdminViewAreaDialog({ visible, setVisible, area }) {
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
            <b>{area?.title}</b>
          </h4>
          {/* <div className="card-shadow-primary mb-3 widget-chart widget-chart2 text-left card p-2"> */}
          <div className=" mb-3 widget-chart widget-chart2 text-left  p-2">
            <div> {area?.description} </div>
          </div>
        </div>
      </div>
    </Dialog>
  );
}
