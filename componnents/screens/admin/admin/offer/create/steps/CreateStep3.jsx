import React from "react";

/**
 * Étape 3   Éléments complémentaires : zone d'usage, modes d'accès,
 * organisations et pays concernés.
 *
 * Corrections apportées :
 *  - les boutons Précédent / Suivant étaient absents (props reçues mais
 *    jamais utilisées) : on restait bloqué sur l'étape ;
 *  - la zone d'usage n'était jamais cochée au chargement d'une offre : la
 *    base renvoie l'énuméré ("NATIONAL"), l'interface comparait la forme
 *    française ("NATIONALE") -> normalisation ;
 *  - la case à cocher d'un pays ne se décochait pas (on inversait l'objet
 *    au lieu de son champ `value`) ;
 *  - le bloc "organisations" hérité appelait un handler avec une signature
 *    incomplète -> neutralisé.
 */

// Normalise l'énuméré base de données et la forme française utilisée par l'API
const zoneOf = (title) => {
  const v = (title || "").toString().toUpperCase();
  if (v.startsWith("INTERNATIONAL")) return "INTERNATIONALE";
  if (v.startsWith("NATIONAL")) return "NATIONALE";
  if (v.startsWith("ROAMING")) return "ROAMING";
  return "";
};

const ZONES = [
  { value: "NATIONALE", label: "NATIONALE", id: "national" },
  { value: "INTERNATIONALE", label: "INTERNATIONALE", id: "international" },
  { value: "ROAMING", label: "ROAMING", id: "roaming" },
];

export default function CreateStep3({
  offer,
  onInputChangeArea,
  selectArea,
  selectOrgans,
  selectCountries,
  destinations,
  onChoiceOrganizations,
  onChoiceCountries,
  setShowModeAccesModal,
  handleEditAccessMode,
  handleDeleteAcMode,
  handlePreviousStep,
  handleNextStep,
}) {
  // La zone courante vient de l'état en cours d'édition, sinon de l'offre
  const currentZone = zoneOf(selectArea || offer?.area?.title);
  const needsOrganizations =
    currentZone === "INTERNATIONALE" || currentZone === "ROAMING";

  return (
    <div>
      <div className="card rounded-0 mb-4 ">
        <div className="card-header bg-secondary rounded-0 d-flex justify-content-between align-items-center">
          <h5 className="p-0 m-0">
            <strong className="headings-color text-white">
              Etape 3: Complementaires
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

        <div className="card-body bg-light">
          <div className="row">
            {/* ---------------- Colonne gauche ---------------- */}
            <div className="col-md-4">
              {/* Zone d'usage */}
              <div className="card mb-2">
                <div className="card-header bg-light4">
                  <b>ZONE D'USAGE</b> <span className="text-danger">*</span>
                </div>
                <div className="card-body bg-primary1 ">
                  <div className="border p-2 mx-2">
                    {ZONES.map((z) => (
                      <div className="mb-2" key={z.id}>
                        <input
                          type="radio"
                          name="area"
                          className="form-check-input me-2"
                          id={z.id}
                          checked={currentZone === z.value}
                          onChange={() => onInputChangeArea(z.value)}
                        />
                        <label
                          className="form-check-label d-inline"
                          htmlFor={z.id}
                          style={{ fontSize: 20 }}
                        >
                          <b> {z.label} </b>
                        </label>
                      </div>
                    ))}
                  </div>
                  {!currentZone && (
                    <div className="alert alert-warning mt-2 mb-0 py-2">
                      <small>Veuillez sélectionner une zone d'usage.</small>
                    </div>
                  )}
                </div>
              </div>

              {/* Modes d'accès */}
              <div className="card mb-2">
                <div className="card-header bg-light4">
                  <b>MODE D'ACCES</b>
                </div>
                <div className="card-body bg-primary1 ">
                  <div className=" w-100">
                    {offer?.accessModes?.length > 0 ? (
                      offer.accessModes.map((a, i) => (
                        <React.Fragment key={"acK" + (a?.key ?? a?.id ?? i)}>
                          <div className="d-flex justify-content-between">
                            <div
                              className="card p-1 mb-0 pb-0 w-100"
                              style={{ paddingLeft: 20 }}
                            >
                              <table className="table table-bordered w-100 pb-1 mb-1">
                                <tbody>
                                  <tr>
                                    <td className="p-1 bg-primary1 align-content-center">
                                      <b>{i + 1}</b>
                                    </td>
                                    <td>
                                      <div
                                        dangerouslySetInnerHTML={{
                                          __html: a.content,
                                        }}
                                      />
                                    </td>
                                    <td style={{ width: 110 }}>
                                      <button
                                        className="btn btn-sm btn-info me-2 mb-2"
                                        type="button"
                                        title="Modifier ce mode d'accès"
                                        onClick={() => handleEditAccessMode?.(a)}
                                      >
                                        <i className="fa fa-edit"></i>
                                      </button>
                                      <button
                                        className="btn btn-sm btn-danger"
                                        type="button"
                                        title="Supprimer ce mode d'accès"
                                        onClick={() => handleDeleteAcMode?.(a)}
                                      >
                                        <i className="fa fa-trash"></i>
                                      </button>
                                    </td>
                                  </tr>
                                </tbody>
                              </table>
                            </div>
                          </div>
                          <hr className="m-1" />
                        </React.Fragment>
                      ))
                    ) : (
                      <div className="alert alert-warning text-center">
                        <div>
                          <i
                            className="fa-solid fa-triangle-exclamation"
                            style={{ fontSize: 40 }}
                          ></i>
                        </div>
                        <div>Aucun mode d'accès défini !</div>
                      </div>
                    )}

                    <button
                      className="btn btn-sm btn-warning w-100"
                      type="button"
                      onClick={() => setShowModeAccesModal(true)}
                    >
                      <i className="fa fa-plus me-2"></i>Ajouter
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* ---------------- Colonne droite ---------------- */}
            <div className="col-md-8">
              <div className="card mb-2">
                <div className="card-header bg-light4">
                  <b>ORGANISATIONS CONCERNEES</b>
                  {needsOrganizations && <span className="text-danger">*</span>}
                </div>
                <div className="card-body bg-primary1 ">
                  {!needsOrganizations ? (
                    <div className="alert alert-warning text-center mb-0">
                      <div>
                        <i
                          className="fa-solid fa-triangle-exclamation"
                          style={{ fontSize: 40 }}
                        ></i>
                      </div>
                      <div>
                        Pour sélectionner une organisation, la zone d'usage doit
                        être <b>Internationale</b> ou <b>Roaming</b>.
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="alert alert-info text-center">
                        <small>
                          Sélectionnez une ou plusieurs organisations. La liste
                          des pays correspondants s'affiche juste en dessous de
                          chaque organisation cochée.
                        </small>
                      </div>

                      {/* Organisations "classiques" */}
                      {!selectOrgans?.other?.value && (
                        <>
                          <hr />
                          <div className="row">
                            {destinations
                              ?.filter((org) => org.code !== "DEST-10000001000")
                              .map((org, i) => (
                                <div key={"og1" + i} className="col-md-3 mb-4">
                                  <div className="form-group mb-2">
                                    <input
                                      id={"og1" + i}
                                      className="me-2"
                                      type="checkbox"
                                      name="sog"
                                      checked={!!selectOrgans?.[org.name]?.value}
                                      onChange={() =>
                                        onChoiceOrganizations(
                                          org.name,
                                          org.id,
                                          !selectOrgans?.[org.name]?.value,
                                        )
                                      }
                                    />
                                    <label
                                      className="form-check-label d-inline"
                                      htmlFor={"og1" + i}
                                    >
                                      <b>{org.name}</b>
                                    </label>
                                  </div>

                                  {selectOrgans?.[org.name]?.value && (
                                    <div
                                      className="scrollspy-example bg-white p-2 scroll-container"
                                      style={{ height: 200 }}
                                    >
                                      {org?.countries?.map((c, ii) => (
                                        <div key={"ccc1" + org.id + "-" + ii}>
                                          <div className="form-group mb-2">
                                            <input
                                              id={"cont1" + org.id + "-" + ii}
                                              className="me-2"
                                              type="checkbox"
                                              name="scc"
                                              checked={
                                                !!selectCountries?.[c.name]?.value
                                              }
                                              onChange={() =>
                                                onChoiceCountries(
                                                  c?.name,
                                                  org.id,
                                                  c.id,
                                                  // BUGFIX: on inversait l'objet
                                                  // et non son champ `value` :
                                                  // la case ne se décochait jamais
                                                  !selectCountries?.[c?.name]
                                                    ?.value,
                                                )
                                              }
                                            />
                                            <label
                                              className="form-check-label d-inline"
                                              htmlFor={
                                                "cont1" + org.id + "-" + ii
                                              }
                                            >
                                              {c.name}
                                            </label>
                                          </div>
                                        </div>
                                      ))}
                                      {!org?.countries?.length && (
                                        <small className="text-muted">
                                          Aucun pays rattaché à cette
                                          organisation.
                                        </small>
                                      )}
                                    </div>
                                  )}
                                </div>
                              ))}
                          </div>
                        </>
                      )}

                      {/* Organisation "Autres pays" */}
                      <hr />
                      {destinations
                        ?.filter((org) => org.code === "DEST-10000001000")
                        .map((org, i) => (
                          <div key={"ogOther" + i}>
                            {selectOrgans?.other?.value && (
                              <div className="bg-white p-2">
                                <div className="row">
                                  {org?.countries?.map((c, ii) => (
                                    <div
                                      key={"cccOther" + ii}
                                      className="col-md-3"
                                    >
                                      <div className="form-group mb-2">
                                        <input
                                          id={"contOther" + ii}
                                          className="me-2"
                                          type="checkbox"
                                          name="scc"
                                          checked={
                                            !!selectCountries?.[c.name]?.value
                                          }
                                          onChange={() =>
                                            onChoiceCountries(
                                              c?.name,
                                              org.id,
                                              c.id,
                                              !selectCountries?.[c?.name]?.value,
                                            )
                                          }
                                        />
                                        <label
                                          className="form-check-label d-inline"
                                          htmlFor={"contOther" + ii}
                                        >
                                          {c.name}
                                        </label>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            <div className="form-group mb-2">
                              <input
                                id={"ogOtherCheck" + i}
                                className="me-2"
                                type="checkbox"
                                name="sog"
                                checked={!!selectOrgans?.other?.value}
                                onChange={() =>
                                  onChoiceOrganizations(
                                    "other",
                                    org.id,
                                    !selectOrgans?.other?.value,
                                  )
                                }
                              />
                              <label
                                className="form-check-label d-inline"
                                htmlFor={"ogOtherCheck" + i}
                              >
                                <b>{org.name}</b>
                              </label>
                            </div>
                          </div>
                        ))}

                      {/* Récapitulatif des pays retenus */}
                      {selectCountries &&
                        Object.values(selectCountries).filter((c) => c?.value)
                          .length > 0 && (
                          <div className="mt-3 p-2 bg-white border rounded">
                            <small className="text-muted">
                              Pays sélectionnés (
                              {
                                Object.values(selectCountries).filter(
                                  (c) => c?.value,
                                ).length
                              }
                              ) :
                            </small>
                            <div className="mt-1">
                              {Object.values(selectCountries)
                                .filter((c) => c?.value)
                                .map((c) => (
                                  <span
                                    key={"selc" + c.id}
                                    className="badge bg-secondary me-1 mb-1"
                                  >
                                    {c.name}
                                  </span>
                                ))}
                            </div>
                          </div>
                        )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
