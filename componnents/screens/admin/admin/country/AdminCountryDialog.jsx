import { Dialog } from 'primereact/dialog';
import React, { useEffect, useState } from 'react'

export default function AdminCountryDialog({
    visible,
    setVisible,
    country,
    setCountry,
    handleSumit,
}) {
    const [position, setPosition] = useState("center");

    useEffect(() => {
        if (visible) {
            onClick();
        } else {
            onHide();
        }
    }, [visible]);

    const onClick = () => {
        // setVisible(true);
    }
    const onHide = () => {
        // setVisible(false);
    }

    const onInputChange = (e, name) => {
        const val = (e.target && e.target.value) || "";

        let _country = { ...country };
        _country[`${name}`] = val;

        setCountry(_country);
    };

    const footer = (
    <div>
        <div className="modal-footer pt-3 d-flex justify-content-between">
            <button type="button" className="btn btn-danger my-0" onClick={() => onHide()}>Fermer</button>
            <button type="button" onClick={() => handleSumit()} className="btn btn-primary my-0" ><i className="fa fa-save mr-2"></i> Enregistrer le pays</button>
        </div>
    </div>
    );

    return (
        <Dialog
            header={<div className="">{country?.id ? 'MODIFIER UN PAYS ' : 'AJOUTER UN PAYS'}  </div>}
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
                background: '#343A3F', // Couleur de fond noire
                color: 'white', // Couleur du texte blanc (ou autre couleur de texte lisible)
                padding: 10,
            }}
        //   draggable={true}
        >
            <div className="pt-2">
                <div className="form-group mb-2">
                    <label className="form-label">
                        Nom du pays <span className="text-danger">*</span>
                    </label>
                    <input
                        value={country?.name}
                        type="text"
                        className="form-control"
                        required
                        onChange={(e) => onInputChange(e, "name")}
                    />
                </div>
                <div className="form-group mb-2">
                    <label className="form-label">
                        Description
                    </label>
                    <textarea name="" id="" cols="30" rows="5"
                        className="form-control"
                        value={country?.description}
                        placeholder="Entrer une description de la technologie"
                        onChange={(e) => onInputChange(e, "description")}></textarea>
                </div>
            </div>
        </Dialog>
    )
}
