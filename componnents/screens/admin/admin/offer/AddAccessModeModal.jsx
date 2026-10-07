import { Dialog } from 'primereact/dialog';
import { Editor } from 'primereact/editor';
import React, { useEffect, useState } from 'react'

export default function AddAccessModeModal({
    display, setDisplay,
    handleAddAccessModes,
    accessMode, setAccessMode,
    handleEditAccessMode,
}) {

    useEffect(() => {
        if (display) {
            onClick();
        } else {
            onHide();
        }
    }, [display]);

    useEffect(() => {
    }, []);

    const onClick = (position) => {
        setDisplay(true);
    };

    const onHide = (name) => {
        setAccessMode(null);
        setDisplay(false);
        // handleInitVar()
    };

    const onInputChange = (name, value) => {
        const _accessMode = { ...accessMode };
        _accessMode[`${name}`] = value;

        setAccessMode(_accessMode);
    };

    const top = (<><h5>Ajouter un mode d'accès</h5></>)

    return (
        <Dialog 
        header={top} 
        visible={display} 
        style={{ width: '60vw' }} 
        onHide={() => onHide(false)}
            headerStyle={{
                background: '#343A3F', // Couleur de fond noire
                color: 'white', // Couleur du texte blanc (ou autre couleur de texte lisible)
                padding: 10
            }}
        >
            <div className="form-group  mb-2 mt-2">
                <label htmlFor="desc"> Saisir le mode d'accès :</label>
                <div className="bg-white">
                    <Editor
                        value={accessMode?.content}
                        onTextChange={(e) => onInputChange("content", e.htmlValue)}
                        style={{ height: '320px' }}
                        placeholder="Saisir le mode d'accès à l'offre ..."
                    />
                </div>
            </div>
            <div className="mt-3">
                {accessMode?.key ? <>
                    <button className='btn w-100 btn-primary' onClick={() => handleEditAccessMode(accessMode)} ><i className="fa fa-save me-2"></i>Enregistrer les modifications</button>
                </> : <>
                    <button className='btn w-100 btn-primary' onClick={() => handleAddAccessModes(accessMode)} ><i className="fa fa-save me-2"></i>Enregistrer</button>
                </>}
            </div>

        </Dialog>
    )
}
