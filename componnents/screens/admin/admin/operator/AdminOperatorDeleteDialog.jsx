import React, { useEffect, useState } from "react";
import { Dialog } from "primereact/dialog";

/**
 * Confirmations de suppression d'opérateur(s).
 *
 * Corrige l'ancienne version : le nom de la fonction attendue ne correspondait
 * pas à celui transmis par la page (le clic sur « Oui » ne faisait rien), le
 * bouton « Non » ne fermait pas la fenêtre, et aucun état d'attente ni motif
 * de refus n'était affiché.
 */

const useConfirm = (visible, onConfirm) => {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  useEffect(() => {
    if (visible) {
      setBusy(false);
      setError(null);
    }
  }, [visible]);
  const confirm = async () => {
    setBusy(true);
    setError(null);
    const res = await onConfirm?.();
    setBusy(false);
    if (res?.error) setError(res.message);
  };
  return { busy, error, confirm };
};

const Footer = ({ busy, onCancel, onConfirm, label }) => (
  <div className="d-flex justify-content-between gap-2">
    <button type="button" className="btn btn-outline-secondary" onClick={onCancel} disabled={busy}>
      Annuler
    </button>
    <button type="button" className="btn btn-danger" onClick={onConfirm} disabled={busy}>
      {busy && <span className="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>}
      {label}
    </button>
  </div>
);

export const DeleteOperatorDialog = ({ visible, setVisible, operator, handleDeleteOperator }) => {
  const { busy, error, confirm } = useConfirm(visible, handleDeleteOperator);
  const close = () => !busy && setVisible(false);
  const inUse = (operator?._count?.offers || 0) + (operator?._count?.focalPoints || 0) > 0;
  return (
    <Dialog
      header="Supprimer l'opérateur"
      visible={!!visible}
      modal
      style={{ width: "min(34rem, 96vw)" }}
      onHide={close}
      footer={<Footer busy={busy} onCancel={close} onConfirm={confirm} label="Supprimer définitivement" />}
    >
      {error && (
        <div className="alert alert-danger py-2" role="alert">
          {error}
        </div>
      )}
      <p className="mb-2">
        Voulez-vous supprimer l'opérateur <b>{operator?.name}</b> ({operator?.code}) ?
      </p>
      {inUse ? (
        <div className="alert alert-warning py-2 mb-0">
          Cet opérateur porte {operator?._count?.offers || 0} offre(s) et {operator?._count?.focalPoints || 0} point(s)
          focal(aux) : la suppression sera refusée. Pour le retirer, passez son statut à « Désactivé ».
        </div>
      ) : (
        <p className="text-muted small mb-0">Cette action est définitive et sera enregistrée dans le journal.</p>
      )}
    </Dialog>
  );
};

export const DeleteSelectedOperatorsDialog = ({ visible, setVisible, count = 0, handleDeleteSelectedOperator }) => {
  const { busy, error, confirm } = useConfirm(visible, handleDeleteSelectedOperator);
  const close = () => !busy && setVisible(false);
  return (
    <Dialog
      header="Supprimer les opérateurs sélectionnés"
      visible={!!visible}
      modal
      style={{ width: "min(34rem, 96vw)" }}
      onHide={close}
      footer={<Footer busy={busy} onCancel={close} onConfirm={confirm} label={`Supprimer (${count})`} />}
    >
      {error && (
        <div className="alert alert-danger py-2" role="alert">
          {error}
        </div>
      )}
      <p className="mb-0">
        Voulez-vous supprimer les {count} opérateur(s) sélectionné(s) ? Ceux qui portent des offres ou des points focaux
        seront conservés.
      </p>
    </Dialog>
  );
};

export default DeleteSelectedOperatorsDialog;
