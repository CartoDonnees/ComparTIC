import { generateRandomString, isValidEmail } from "@/services/tools/helper";
import { Dialog } from "primereact/dialog";
import React, { useEffect, useState } from "react";
import imageCompression from "browser-image-compression";
import { BASE_IMG_API, BASE_IMG_URL } from "@/services/tools/constants";
import CircleLoader from "@/componnents/Loader/CircleLoader";
import { getOperators } from "@/services/api/client/operators/operatorsApiServices";
import { getProfile } from "@/services/api/admin/profile/profileApiService";
import { toastWarning } from "@/componnents/notification/notification";
import {
  createUser,
  editUser,
} from "@/services/api/admin/user/usersApiService";
import DefaultLoader from "@/componnents/Loader/DefaultLoader";

export default function AdminUserDialog({
  visible,
  setVisible,
  user,
  setUser,
  handleSubmit,
  close,
  setClose,
  loader,
  setLoader,
}) {
  const [position, setPosition] = useState("center");

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => currentYear - i);

  const [imageFile, setImageFile] = useState();
  const [previewImageFile, setPreviewImageFile] = useState();
  const [imgUrl, setImgUrl] = useState();
  const [loadImage, setLoadImage] = useState(false);

  const [operators, setOperators] = useState(null);
  const [profiles, setProfiles] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (user) {
    }
  }, [user]);

  useEffect(() => {
    if (visible) {
      onClick();
    } else {
      onHide();
    }
  }, [visible]);

  useEffect(() => {
    if (!close) {
      onHide();
      setClose(true);
    }
  }, [close]);

  const onClick = async () => {
    const _operators = await getOperators();
    const _profiles = await getProfile();
    setOperators(_operators);
    setProfiles(_profiles);
    setVisible(true);
    let _user = { ...user };
    if (user?.id) {
      // setLocalCoords() = JSON.stringify(user?.coordinates[0].coords);
    } else {
      const _code = generateRandomString(10);

      _user["code"] = ("US-" + Date.now()).toUpperCase();
    }
    setUser(_user);
  };
  const onHide = () => {
    // setUser(null);
    setVisible(false);
    setPreviewImageFile(null);
    setImageFile(null);
    setImgUrl(null);
    setLoader(false);
    setSuccess(false);
  };

  const onInputChange = (name, value) => {
    const _user = { ...user };
    if (name == "serialNumber") {
      const _focalPoint = { ...null };

      _focalPoint["operatorId"] = user?.focalPoint?.operatorId;
      _focalPoint["serialNumber"] = value;
      
      _user["focalPoint"] = _focalPoint;
    } else if (name == "operatorId") {
      const _focalPoint = { ...null };
      const _profile = { ...null };

      _focalPoint["operatorId"] = value;
      _focalPoint["serialNumber"] = user?.focalPoint?.serialNumber;

      _user["focalPoint"] = _focalPoint;
    } else {
      _user[`${name}`] = value;
    }

    setUser(_user);
  };

  // PREVIEW IMAGE
  useEffect(() => {
    if (!imageFile) {
      setPreviewImageFile(undefined);
      return;
    }

    const objectUrl = URL.createObjectURL(imageFile);
    setPreviewImageFile(objectUrl);

    // free memory when ever this component is unmounted
    setLoadImage(false);
    return () => URL.revokeObjectURL(objectUrl);
  }, [imageFile]);

  const onSelectImageFile = async (e) => {
    try {
      if (!e.target.files || e.target.files.length === 0) {
        setImageFile(undefined);
        return;
      }

      const selectedFile = e.target.files?.[0];

      const options = {
        maxSizeMB: 1, // Maximum size in MB
        maxWidthOrHeight: 1024, // Maximum width or height in pixels
        useWebWorker: true, // Use a web worker for compression
      };
      setLoadImage(true);

      const compressedFile = await imageCompression(selectedFile, options);

      let _user = { ...user };
      _user["imageFile"] = compressedFile;

      setImgUrl(e.target.files[0].filename);

      setUser(_user);

      setImageFile(compressedFile);
    } catch (error) {
    /* erreur ignorée volontairement */
  }
  };

  const handleEditImage = (event) => {
    setPreviewImageFile(null);
    setImageFile(null);
    setImgUrl(null);
    let _user = { ...user };
    _user["imagePath"] = null;

    setUser(_user);
  };

  const top = (
    <h3 className="bg-light">
      {user?.id ? "MODIFIER UN UTILISATEUR" : "AJOUTER UN UTILISATEUR"}{" "}
    </h3>
  );

  const footer = (
    <div>
      {!loader && !success && (
        <>
          <div className="modal-footer pt-3 d-flex justify-content-between">
            <button
              type="button"
              className="btn btn-dark my-0"
              onClick={() => onHide()}
            >
              Fermer
            </button>
            <button
              type="button"
              onClick={() => handleSubmit()}
              className="btn btn-primary my-0"
            >
              <i className="fa fa-save mr-2"></i> Enregistrer le user
            </button>
          </div>
        </>
      )}
    </div>
  );

  return (
    <Dialog
      header={top}
      footer={footer}
      visible={visible}
      modal={true}
      onHide={() => {
        if (!visible) return;
        setVisible(false);
      }}
      style={{ width: "70vw", backgroundColor: "white" }}
      breakpoints={{ "960px": "75vw", "641px": "100vw" }}
      position={position}
      className="mb-5"
      maximizable
      //   draggable={true}
    >
      {!loader ? (
        <>
          {!success ? (
            <>
              <div className="row">
                <div className="col-md-8">
                  <div className="border p-2">
                    <div className="form-group mb-2">
                      <label className="form-label">
                        Code : <span className="text-danger">*</span>
                      </label>
                      <div className="input-group mb-3">
                        <input
                          value={user?.code}
                          type="text"
                          className="form-control"
                          required
                          disabled
                          onChange={(e) => onInputChange("code".e.target.value)}
                          aria-label="Sizing example input"
                          aria-describedby="code"
                        />
                      </div>
                    </div>
                    <div className="row">
                      <div className="col-md-8">
                        <div className="form-group mb-2">
                          <label className="form-label">
                            Prénoms : <span className="text-danger">*</span>
                          </label>
                          <input
                            value={user?.firstName}
                            type="text"
                            className="form-control"
                            required
                            onChange={(e) =>
                              onInputChange("firstName", e.target.value)
                            }
                          />
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="form-group mb-2">
                          <label className="form-label">Nom :</label>
                          <input
                            value={user?.lastName}
                            type="text"
                            className="form-control"
                            required
                            onChange={(e) =>
                              onInputChange("lastName", e.target.value)
                            }
                          />
                        </div>
                      </div>
                    </div>
                    <div className="form-group mb-2">
                      <label className="form-label">
                        Email : <span className="text-danger">*</span>
                      </label>
                      <div className="input-group mb-3">
                        <input
                          value={user?.email}
                          type="email"
                          className="form-control"
                          required
                          onChange={(e) =>
                            onInputChange("email", e.target.value)
                          }
                          aria-label="Sizing example input"
                        />
                      </div>
                    </div>
                    <div className="form-group mb-2">
                      <label className="form-label">
                        Profil : <span className="text-danger">*</span>
                      </label>
                      <div className="input-group mb-3">
                        <select
                          id="year-select"
                          className="form-control"
                          value={user?.profileId}
                          onChange={(e) =>
                            onInputChange("profileId", e.target.value)
                          }
                        >
                          <option value="">Sélectionner un profil</option>
                          {profiles &&
                            profiles
                              // Profils attribuables par l'utilisateur connecté
                              // (le profil actuel reste affiché, verrouillé).
                              ?.filter(
                                (prof) =>
                                  prof?.assignable !== false ||
                                  Number(prof?.id) === Number(user?.profileId),
                              )
                              .map((prof, i) => {
                              return (
                                <React.Fragment key={"prof" + (prof?.id ?? i)}>
                                  <option
                                    value={prof?.id}
                                    disabled={prof?.assignable === false}
                                  >
                                    {prof?.label || prof?.name}
                                  </option>
                                </React.Fragment>
                              );
                            })}
                        </select>
                      </div>
                    </div>
                    <div className="form-group mb-2">
                      <label className="form-label">
                        Statut : <span className="text-danger">*</span>
                      </label>
                      <div className="input-group mb-3">
                        <select
                          id="year-select"
                          className="form-control"
                          value={user?.status}
                          onChange={(e) =>
                            onInputChange("status", e.target.value)
                          }
                        >
                          <option value="">Sélectionner un status</option>
                          <option value="ENABLE">ACTIVER</option>
                          <option value="PENDING">EN ATTENTE</option>
                          <option value="SUSPENDED">SUSPENDU</option>
                          <option value="DISABLE">DESACTIVER</option>
                        </select>
                      </div>
                    </div>
                    <div className="form-group mb-2">
                      <label className="form-label">Description :</label>
                      <textarea
                        name=""
                        id=""
                        cols="30"
                        rows="5"
                        className="form-control"
                        value={user?.description}
                        placeholder="Entrer une description de la technologie"
                        onChange={(e) =>
                          onInputChange("description", e.target.value)
                        }
                      ></textarea>
                    </div>
                  </div>
                </div>
                <div className="col-md-4 p-2">
                  {profiles?.find((p) => Number(p?.id) === Number(user?.profileId))?.code === "PRF2-TEST" && (
                    <>
                      <div className="border rounded p-2 bg-light-subtle mb-2">
                        {/* <div className="form-check mb-2">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    value={user?.isFocalPoint}
                    id="focalPoint"
                    onChange={(e) =>
                      onInputChange("isFocalPoint", e.target.checked)
                    }
                  />
                  <label className="form-check-label" for="focalPoint">
                    Est un point focal ?
                  </label>
                </div> */}
                        <div className="form-group mb-2">
                          <label className="form-label">
                            Identifant (Matricule) :{" "}
                            <span className="text-danger">*</span>
                          </label>
                          <div className="input-group mb-3">
                            <input
                              value={user?.focalPoint?.serialNumber}
                              type="text"
                              className="form-control"
                              required
                              onChange={(e) =>
                                onInputChange("serialNumber", e.target.value)
                              }
                              aria-label="Sizing example input"
                            />
                          </div>
                        </div>

                        <div className="form-group mb-2">
                          <label className="form-label">
                            Opérateur : <span className="text-danger">*</span>
                          </label>
                          <div className="input-group mb-3">
                            <select
                              id="year-select"
                              className="form-control"
                              //   disabled={user?.isFocalPoint ? false : true}
                              value={user?.focalPoint?.operatorId}
                              onChange={(e) =>
                                onInputChange("operatorId", e.target.value)
                              }
                            >
                              <option value="">
                                Sélectionner un opérateur
                              </option>
                              {operators &&
                                operators?.map((oper, i) => {
                                  return (
                                    <React.Fragment key={"oper" + (oper?.id ?? i)}>
                                      <option value={oper?.id}>
                                        {" "}
                                        {oper?.name}{" "}
                                      </option>
                                    </React.Fragment>
                                  );
                                })}
                            </select>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                  <div className="border p-2 rounded">
                    {(previewImageFile || user?.imagePath) && (
                      <>
                        <div className="d-flex justify-content-end">
                          <button onClick={() => handleEditImage()}>
                            <i className="fa fa-xmark"></i>
                          </button>
                        </div>
                      </>
                    )}
                    <h6 className="form-label text-center">
                      IMAGE DE L'UTILISATEUR
                    </h6>
                    {!loadImage ? (
                      <>
                        {previewImageFile || user?.imagePath ? (
                          <>
                            <img
                              src={
                                previewImageFile
                                  ? previewImageFile
                                  : BASE_IMG_API + user?.imagePath
                              }
                              className="user-img-prev"
                              alt="User image"
                              style={{ height: 250, width: "100%" }}
                            />
                          </>
                        ) : (
                          <>
                            <img
                              src="images/default.png"
                              className="user-img-prev"
                              alt="User image"
                              style={{ height: 250, width: "100%" }}
                            />
                          </>
                        )}
                      </>
                    ) : (
                      <>
                        <div
                          style={{ height: 250 }}
                          className=" d-flex justify-content-center"
                        >
                          <CircleLoader height={70} width={70} />
                        </div>
                      </>
                    )}

                    <input
                      type="file"
                      className="form-control"
                      name="image"
                      accept="image/*"
                      value={imgUrl}
                      onChange={onSelectImageFile}
                    />
                  </div>
                  {user?.id == null && (
                    <>
                      <div className="card-shadow-warning mb-3 widget-chart widget-chart2 text-left card mt-4 alert alert-warning ">
                        <div className="">
                          <h6 className="widget-subheading">Notez bien:</h6>
                          <div className="widget-chart-flex">
                            <div className="widget-numbers mb-0 w-100">
                              <div className="widget-chart-flex">
                                <div className="fsize-4">
                                  {/* <small className="opacity-5">$</small> */}
                                  Le <b>mot de passe par défaut</b> sera envoyé
                                  à l’adresse e-mail renseignée.
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </>
          ) : (
            <>
              <>
                <hr />
                <div className="d-flex justify-content-center pt-5">
                  <div>
                    <div className="text-center">
                      <b>Utilisateur enregistré avec succès.</b>
                    </div>
                    <div>
                      <img
                        src="/images/success.png"
                        alt=""
                        style={{ height: 250, width: 250 }}
                      />
                    </div>
                  </div>
                </div>
              </>
            </>
          )}
        </>
      ) : (
        <>
          <DefaultLoader
            color="orange"
            size={80}
            title="Veuillez patienter, enregistrment de l'utilisateur ..."
          />
        </>
      )}
    </Dialog>
  );
}
