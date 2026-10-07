import OfferDocumentViewer from "@/componnents/document/OfferDocumentViewer";
import React, { useRef } from "react";

/**
 * Étape 4   Documents associés (MODIFICATION d'une offre).
 *
 * Corrections par rapport à la version précédente :
 *  - les boutons Précédent / Suivant étaient absents : on ne pouvait pas
 *    quitter l'étape ;
 *  - le document DÉJÀ ENREGISTRÉ sur l'offre n'était jamais affiché
 *    (`document` est le fichier fraîchement choisi, pas celui en base) ;
 *  - « Annuler la sélection » ne remettait pas l'offre à son état initial.
 */
export default function MonitoringStep4({
  previewDocument,
  document, // fichier nouvellement sélectionné (objet File)
  offerDocument, // document déjà enregistré sur l'offre { path }
  onSelectDocument,
  onRemoveDocument,
  handlePreviousStep,
  handleNextStep,
  step,
}) {
  const fileInputRef = useRef(null);
  const handleDocClick = () => fileInputRef.current?.click();

  // Un document existe soit parce qu'on vient d'en choisir un,
  // soit parce que l'offre en possède déjà un en base.
  const storedPath = offerDocument?.path;
  const hasNewFile = !!previewDocument;
  const hasDocument = hasNewFile || !!storedPath;

  return (
    <div>
      <div className="card mb-4">
        <div className="card-header bg-secondary d-flex justify-content-between align-items-center">
          <h5 className="p-0 m-0">
            <strong className="headings-color text-white">
              Etape 4: Documents associés
            </strong>
          </h5>
          {/* Navigation : ces boutons manquaient totalement */}
          <div className="text-center">
            <button
              className="btn btn-sm btn-secondary me-2"
              type="button"
              onClick={() => handlePreviousStep?.()}
            >
              <i className="fa fa-arrow-left me-2"></i> Précédent
            </button>
            <button
              className="btn btn-sm btn-dark"
              type="button"
              onClick={() => handleNextStep?.()}
            >
              Suivant <i className="fa fa-arrow-right ms-2"></i>
            </button>
          </div>
        </div>

        <div className="card-body">
          <div className="card mb-2">
            <div className="card-body bg-primary1 ">
              <div className="bg-white p-2">
                {hasDocument ? (
                  <div role="group">
                    <label className="mb-2">
                      {hasNewFile
                        ? "Nouveau document sélectionné"
                        : "Document actuellement associé à l'offre"}
                    </label>
                    <div className="w-100 mb-2 d-flex gap-2">
                      <button
                        className="btn btn-block btn-warning w-100"
                        type="button"
                        onClick={handleDocClick}
                      >
                        <i className="fa fa-rotate me-2"></i>
                        Remplacer le document
                      </button>
                      <button
                        className="btn btn-block btn-danger w-100"
                        type="button"
                        onClick={() => onRemoveDocument?.()}
                      >
                        {hasNewFile ? "Annuler la sélection" : "Retirer le document"}{" "}
                        <i className="fa fa-xmark"></i>
                      </button>
                    </div>
                    {/* Le champ reste monté pour permettre le remplacement */}
                    <input
                      type="file"
                      accept="*"
                      ref={fileInputRef}
                      style={{ display: "none" }}
                      onChange={onSelectDocument}
                    />
                  </div>
                ) : (
                  <>
                    <div className="d-flex justify-content-center mb-2">
                      <a
                        className="border border-dashed p-4"
                        style={{ borderRadius: 8, cursor: "pointer" }}
                        onClick={handleDocClick}
                      >
                        <img
                          src="/images/img-file.png"
                          alt=""
                          style={{ height: 200 }}
                        />
                      </a>
                    </div>
                    <div className="text-center p-5 mb-5 text-danger">
                      <b>Moins de 5MB</b>
                    </div>
                    <input
                      type="file"
                      accept="*"
                      ref={fileInputRef}
                      style={{ display: "none" }}
                      onChange={onSelectDocument}
                    />
                    <a
                      className="btn btn-sm w-100 btn-warning"
                      onClick={handleDocClick}
                    >
                      <i className="fa fa-plus me-2"></i> Ajouter un document
                    </a>
                  </>
                )}
              </div>

              {hasDocument && (
                <div>
                  <p className="mt-3">Aperçu du fichier joint</p>
                  <div className="position-relative">
                    {hasNewFile ? (
                      <iframe
                        src={previewDocument}
                        title="Aperçu du document"
                        frameBorder="0"
                        height="1000"
                        style={{ width: "100%" }}
                      ></iframe>
                    ) : (
                      // Document déjà stocké : message explicite s'il est introuvable
                      <OfferDocumentViewer
                        document={{ path: storedPath }}
                        height={1000}
                        title="Document joint"
                      />
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
