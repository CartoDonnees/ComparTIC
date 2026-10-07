import { Dialog } from 'primereact/dialog';
import React, { useEffect, useState } from 'react'

export const DeleteAreaDialog = ({ visible, setVisible, area, handleDeleteArea }) => {
    const [visibleMaximizable, setVisibleMaximizable] = useState(false);
    const [position, setPosition] = useState('center');

    const onClick = (position) => {
        setVisible(true)
        if (position) {
            setPosition(position);
        }
    }

    const onHide = (name) => {
        setVisible(false)
    }

    useEffect(() => {
        if (visible) {
            onClick()
        } else {
            onHide()
        }
    }, [visible]);

    return (
        <>
            <Dialog header="Confirmation de suppression !" visible={visible} modal style={{ width: '32rem' }} onHide={() => onHide('visibleMaximizable')} position="center">
                <div className="confirmation-content text-center">
                    <i className="pi pi-exclamation-triangle mr-3" style={{ fontSize: '2rem' }} />
                    {area && (
                        <span>
                            Etes-vous sûr que vous voulez supprimer la zone: <b>{area.title}</b> ?
                        </span>
                    )}
                </div>
                    <div className="modal-footer pt-3 d-flex justify-content-between">
                        <button type="button" className="btn btn-outline-primary my-0">Non</button>
                        <button type="submit" className="btn btn-danger my-0" onClick={() => handleDeleteArea()}>Oui</button>
                    </div>
            </Dialog>
        </>
    )
}

export const DeleteSelectedAreasDialog = ({ visible, setVisible, handleDeleteSelectedAreas }) => {
    const [position, setPosition] = useState('center');

    const onClick = (position) => {
        setVisible(true)
        if (position) {
            setPosition(position);
        }
    }

    const onHide = (name) => {
        setVisible(false)
    }

    useEffect(() => {
        if (visible) {
            onClick()
        } else {
            onHide()
        }
    }, [visible]);

    return (
        <>
            <Dialog header="Confirmation" visible={visible} modal style={{ width: '32rem' }} onHide={() => onHide('visibleMaximizable')} position="center">
                <div className="confirmation-content text-center">
                    <i className="pi pi-exclamation-triangle mr-3 text-danger" style={{ fontSize: '2rem' }} />
                        <div>
                            Etes-vous sûr que vous voulez supprimer le(s) zones selectionnée(s)?
                        </div>
                </div>
                    <div className="modal-footer pt-3 d-flex justify-content-between">
                        <button type="button" className="btn btn-outline-primary my-0">Nom</button>
                        <button type="submit" className="btn btn-danger my-0" onClick={() => handleDeleteSelectedAreas()}>Oui</button>
                    </div>
            </Dialog>
        </>
    )
}

export default DeleteAreaDialog;
