import { Dialog } from 'primereact/dialog'
import React, { useEffect } from 'react'

export default function ConfirmRemoveForula({ visible, setVisible, handleRemoveFormula,cRFormKey }) {

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
            header={<h5>CONFIRMATION DE SUPPRESSION DE FORMULE </h5>}
            visible={visible}
            style={{ width: '40vw' }}
            onHide={() => onHide(false)}
            headerStyle={{
                background: '#FD0606FF', // Couleur de fond noire
                color: 'white', // Couleur du texte blanc (ou autre couleur de texte lisible)
                padding: 10
            }}
        >
            <div className='pt-4'>
                <div className='alert alert-warning'>
                    <div className='text-center' style={{ fontSize: 60 }}><i className='fa-solid fa-triangle-exclamation'></i></div>
                    <div className="text-center">
                        Confirmer la suppression de la formule !
                    </div>
                </div>
                <div className="d-flex justify-content-between">

                    <button
                        className='btn btn-dark '
                        onClick={() => onHide()} >
                        <i className="fa fa-xmark me-2"></i>Annuler</button>

                    <button
                        className='btn btn-danger'
                        onClick={() => handleRemoveFormula(cRFormKey)} >
                        <i className="fa fa-arrow-right me-2"></i>Confirmer</button>
                </div>
            </div>

        </Dialog>
    )
}
