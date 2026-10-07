import { Dialog } from "primereact/dialog";
import React, { useEffect, useState } from "react";

export default function AdminOrganizationDialog({
  visible,
  setVisible,
  organization,
  countries,
  setOrganization,
  handleSumit,
}) {
  const [position, setPosition] = useState("center");
  const [selectedCountries, setSelectedCountries] = useState([]);

  useEffect(() => {
    if (visible) {
      onClick();
    } else {
      onHide();
    }
  }, [visible]);

  useEffect(() => {
    if (selectedCountries) {
      const _organization = { ...organization };
      _organization["selectedCountries"] = selectedCountries;
      setOrganization(_organization);
    }
  }, [selectedCountries]);

  const onClick = () => {
    const _ctb = [];
    const _organization = { ...organization };
    _organization["area"] = 1;
    if (organization?.countries?.length > 0) {
      organization?.countries?.forEach((c) => {
        _ctb.push(c.id);
      });
      setSelectedCountries(_ctb);

    }
    setVisible(true);
  };
  const onHide = () => {
    setSelectedCountries(null);
    setVisible(false);
  };

  const onInputChange = (name, e) => {
    const val = (e.target && e.target.value) || "";

    let _organization = { ...organization };
    _organization[`${name}`] = val;

    setOrganization(_organization);
  };

  const handleSelected = (id, value, sl) => {
    if (value === true) {
      if (!sl?.includes(id)) {
        const _sc = sl || [];
        _sc.push(id);
        setSelectedCountries(_sc);
      }
      //   return true;
    } else {
      const _sc = sl?.filter((item) => item != id);
      setSelectedCountries(_sc);
      //   return false;
    }
  };

  const footer = (
    <div>
      <div className="modal-footer pt-3 d-flex justify-content-between">
        <button
          type="button"
          className="btn btn-danger my-0"
          onClick={() => onHide()}
        >
          Fermer
        </button>
        <button
          type="button"
          onClick={() => handleSumit()}
          className="btn btn-primary my-0"
        >
          <i className="fa fa-save mr-2"></i> Enregistrer la zone
        </button>
      </div>
    </div>
  );
  return (
    <Dialog
      header={
        <div className="">
          {organization?.id
            ? "MODIFIER UNE ORGANISATION "
            : "AJOUTER UNE ORGANISATION"}{" "}
        </div>
      }
      footer={footer}
      visible={visible}
      modal={true}
      onHide={() => {
        if (!visible) return;
        setVisible(false);
      }}
      style={{ width: "50vw", backgroundColor: "white" }}
      breakpoints={{ "960px": "75vw", "641px": "100vw" }}
      position={position}
      className="mb-5"
      maximizable
      headerStyle={{
        background: "#343A3F", // Couleur de fond noire
        color: "white", // Couleur du texte blanc (ou autre couleur de texte lisible)
        padding: 10,
      }}
      //   draggable={true}
    >
      <div className="pt-2">
        <div className="form-group mb-2">
          <label className="form-label">
            Zone de l'organisation <span className="text-danger">*</span>
          </label>
          <select
            name=""
            id=""
            className="form-control"
            onChange={(e) => onInputChange("area", e)}
            value={organization?.area}
          >
            <option value="" disabled>
              Veuillez sélectionner une zone
            </option>
            <option value={1}>NATIONALE</option>
            <option value={2}>INTERNATIONALE</option>
          </select>
        </div>
        <div className="form-group mb-2">
          <label className="form-label">
            Nom de l'organisation <span className="text-danger">*</span>
          </label>
          <input
            value={organization?.name}
            type="text"
            className="form-control"
            required
            onChange={(e) => onInputChange("name", e)}
          />
        </div>
        <div className="form-group mb-2">
          <label className="form-label">Description</label>
          <textarea
            name=""
            id=""
            cols="30"
            rows="5"
            className="form-control"
            value={organization?.description}
            placeholder="Entrer une description de la technologie"
            onChange={(e) => onInputChange("description", e)}
          ></textarea>
        </div>
        <hr />

        <div className="row">
          {countries &&
            countries.map((c, i) => {
              return (
                <div className=" form-group mb-2 col-md-4">
                  <input
                    id={"og1" + i}
                    className="me-2 cursor-hand"
                    type="checkbox"
                    name="sog"
                    checked={selectedCountries ? selectedCountries?.includes(c.id) : false}
                    onChange={(e) => {
                      if (!selectedCountries?.includes(c.id)) {
                        handleSelected(c.id, true, selectedCountries);
                      } else {
                        handleSelected(c.id, false, selectedCountries);
                      }
                    }}
                  />
                  <label
                    className="form-check-label d-inline "
                    htmlFor={"og1" + i}
                  >
                    <b>{c.name}</b>
                  </label>
                </div>
              );
            })}
        </div>
      </div>
    </Dialog>
  );
}
