import { BASE_IMG_URL, imageUrl } from "@/services/tools/constants";
import { Dialog } from "primereact/dialog";
import React, { useEffect, useRef, useState } from "react";
import { useReactToPrint } from "react-to-print";

export default function AdminOperatorViewDialog({
  visible,
  setVisible,
  operator,
}) {
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
    // handleGetTechnologiesData(operator?.id)
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
      header="DETAILS OPERATEUR "
      visible={visible}
      modal
      style={{ width: "50vw" }}
      onHide={() => onHide("displayMaximizable")}
      position="center"
      maximizable={max}
    >
      <div className="card border-0 text-center card-lg">
        <div className="card-body p-6">
          <div>
            {/* img */}
            <img
              src={imageUrl(operator?.imagePath)}
              style={{ height: 150, width: 250 }}
              alt=""
              className=" icon-shape icon-xxl mb-6"
            />
            {/* content */}
            <h2 className="mb-2 h5">
              <a href="#!" className="text-inherit">
                {operator?.name}
              </a>
            </h2>
            <hr />

            <div>
              {operator?.type == "MOBILE" && (
                <>
                  <i className="bi bi-phone" style={{ fontSize: 30 }}></i> Mobile
                </>
              )}
              {operator?.type == "FIXE" && (
                <>
                  <i className="bi bi-geo-fill" style={{ fontSize: 30 }}></i> Fixe
                </>
              )}
              {operator?.type == "HYBRIDE" && (
                <>
                  <i className="bi bi-arrows-collapse-vertical me-2"></i>Hybride
                </>
              )}
            </div>
            <hr />
            <div>{operator?.description}</div>
          </div>
        </div>
      </div>
    </Dialog>
  );
}
