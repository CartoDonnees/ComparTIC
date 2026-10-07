import { Dialog } from "primereact/dialog";
import React, { useEffect } from "react";

export default function HowUseComparatorModal({ visible, setVisible }) {
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
      header={<h5>Tutoriel de prise en main de l'outil de comparaison des offres de télécommunication électronique </h5>}
      visible={visible}
      style={{ width: "90vw" }}
      onHide={() => onHide(false)}
      headerStyle={{
        background: "rgb(48, 48, 48)", // Couleur de fond noire
        color: "white", // Couleur du texte blanc (ou autre couleur de texte lisible)
        padding: 10,
      }}
    >
      <div className="pt-3">
      <video style={{ width: "100%", height: "100%" }} controls autoPlay={true}>
        <source src="videos/v3.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>
      </div>

    </Dialog>
  );
}
