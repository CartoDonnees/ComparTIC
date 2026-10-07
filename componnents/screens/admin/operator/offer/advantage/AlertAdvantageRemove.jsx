import { Dialog } from 'primereact/dialog'
import React, { useEffect, useState } from 'react'

export default function AlertAdvantageRemove({ visible, setVisible, advantage, handleConfirm }) {

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
            header={<h5>ALERTE </h5>}
            visible={visible}
            style={{ width: '40vw' }}
            onHide={() => onHide(false)}
            headerStyle={{
                background: '#343A3F', // Couleur de fond noire
                color: 'white', // Couleur du texte blanc (ou autre couleur de texte lisible)
                padding: 10
            }}
        >
            <div className='pt-4'>
                <div className='alert alert-danger'>
                    <div className='text-center' style={{ fontSize: 60 }}><i className='fa-solid fa-triangle-exclamation'></i></div>
                    <div className="text-center">
                        Confirmez-vous la suppression de l'avantage {advantage?.name} !
                    </div>
                </div>
                <div className="d-flex justify-content-between">

                    <button
                        className='btn btn-dark '
                        onClick={() => onHide()} >
                        <i className="fa fa-xmark me-2"></i>Annuler</button>

                    <button
                        className='btn btn-danger'
                        onClick={() => handleConfirm(advantage?.key)} >
                        <i className="fa fa-arrow-right me-2"></i>Confirmer</button>
                </div>
            </div>

        </Dialog>
    )
}
