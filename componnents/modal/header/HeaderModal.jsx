import Link from "next/link";
import { Dialog } from "primereact/dialog";
import React, { useEffect } from "react";

export default function HeaderModal({ visible, setVisible, activeHeader }) {
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
      header={<h5>Menu de navigation </h5>}
      visible={visible}
      style={{ width: "90vw" }}
      onHide={() => onHide(false)}
      headerStyle={{
        //   background: '#FD0606FF', // Couleur de fond noire
        color: "black", // Couleur du texte blanc (ou autre couleur de texte lisible)
        padding: 10,
      }}
    >
      <div className="">
        <ul className="p-1">
          <li className="mb-1 p-2">
            {activeHeader == "home" ? (
              <>
                <Link href="/" className="active">
                  <span className="text ml-2">
                    <i className="bi bi-house-fill me-2"></i>Accueil
                  </span>
                </Link>
              </>
            ) : (
              <>
                <Link href="/" className="text-black">
                  <span className="text ml-2 ">
                    <i className="bi bi-house me-2"></i>Accueil
                  </span>
                </Link>
              </>
            )}
          </li>
          <hr className="m-1" />
          <li className="mb-1 p-2">
            {activeHeader == "comparator" ? (
              <>
                <Link
                  href="/comparator"
                  className="active text-center"
                  target="_self"
                >
                  <i className="bi bi-radar me-2"></i>
                  <span className="text me-2 text-center">Comparateur</span>
                </Link>
              </>
            ) : (
              <>
                <Link href="/comparator" className="text-center text-black" target="_self">
                  <i className="bi bi-radar me-2"></i>
                  <span className="text me-2 text-center">Comparateur</span>
                </Link>
              </>
            )}
            <span className="icon"></span>
          </li>
          <hr className="m-1" />
          <li className="mb-1 p-2">
            <div className="title text-white">
              {activeHeader == "faq" ? (
                <>
                  <Link
                    href="/faq"
                    onClick={() => setShowError(true)}
                    className="active"
                  >
                    <i className="bi bi-patch-question-fill me-2"></i>
                    <span className="text ml-2">Faq</span>
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/faq" onClick={() => setShowError(true)} className="text-black">
                    <i className="bi bi-patch-question me-2"></i>
                    <span className="text ml-2">Faq</span>
                  </Link>
                </>
              )}
            </div>
          </li>
          <hr className="m-1" />
          <li className="mb-1 p-2">
            <div className="title text-white ">
              {activeHeader == "about" ? (
                <>
                  <Link
                    href="/about"
                    onClick={() => setShowError(true)}
                    className="active"
                  >
                    <i className="bi bi-award-fill me-2"></i>
                    <span className="text ml-2">A propos</span>
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href="/about"
                    onClick={() => setShowError(true)}
                    className="text-black"
                  >
                    <i className="bi bi-award me-2"></i>
                    <span className="text ml-2">A propos</span>
                  </Link>
                </>
              )}
            </div>
          </li>
          <hr className="m-1" />
          <li className="mb-1 p-2">
            <div className="title text-white">
              {activeHeader == "contact" ? (
                <>
                  <Link
                    href="/contact"
                    onClick={() => setShowError(true)}
                    className="active"
                  >
                    <i className="bi bi-person-lines-fill me-2"></i>
                    <span className="text ml-2">Contact</span>
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href="/contact"
                    onClick={() => setShowError(true)}
                    className="text-black"
                  >
                    <i className="bi bi-person-lines-fill me-2"></i>
                    <span className="text ml-2">Contact</span>
                  </Link>
                </>
              )}
            </div>
          </li>
        </ul>
      </div>
    </Dialog>
  );
}
