import React, { useState } from "react";
import { Dialog } from "primereact/dialog";

/**
 * Dialogues de confirmation de suppression d'utilisateur.
 *
 * Corrections apportées :
 *  - le bouton « Non » n'avait AUCUN `onClick` : impossible d'annuler ;
 *  - `DeleteSelectedUsersDialog` attendait la prop `handleDeleteSelectedUsers`
 *    alors que la page transmet `handleDeleteSelectedUser` (sans « s ») :
 *    la suppression multiple ne se déclenchait jamais ;
 *  - le nom affiché lisait `user.name`, champ inexistant (un utilisateur a
 *    `firstName` / `lastName`) : la confirmation était vide ;
 *  - aucune protection contre le double-clic ;
 *  - faute de frappe « Nom » au lieu de « Non ».
 */

const fullName = (user) =>
  [user?.lastName, user?.firstName].filter(Boolean).join(" ") ||
  user?.email ||
  user?.code ||
  "cet utilisateur";

export const DeleteUserDialog = ({
  visible,
  setVisible,
  user,
  handleDeleteUser,
}) => {
  const [busy, setBusy] = useState(false);

  const onHide = () => {
    setBusy(false);
    setVisible(false);
  };

  const confirm = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await handleDeleteUser?.();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog
      header="Confirmation de suppression"
      visible={visible}
      modal
      style={{ width: "32rem" }}
      onHide={onHide}
      position="center"
      className="user-dialog"
      dismissableMask
      draggable={false}
    >
      <div className="confirmation-content d-flex align-items-start">
        <i
          className="pi pi-exclamation-triangle me-3 text-danger"
          style={{ fontSize: "2rem" }}
        />
        <div>
          <div>
            Êtes-vous sûr de vouloir supprimer l'utilisateur{" "}
            <b>{fullName(user)}</b> ?
          </div>
          <small className="text-muted">
            Cette action est définitive. Si l'utilisateur est rattaché à des
            offres, préférez la désactivation de son compte.
          </small>
        </div>
      </div>
      <div className="modal-footer pt-3 d-flex justify-content-between">
        <button
          type="button"
          className="btn btn-outline-secondary my-0"
          onClick={onHide}
          disabled={busy}
        >
          Non
        </button>
        <button
          type="button"
          className="btn btn-danger my-0"
          onClick={confirm}
          disabled={busy || !user}
        >
          {busy ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" />
              Suppression…
            </>
          ) : (
            "Oui, supprimer"
          )}
        </button>
      </div>
    </Dialog>
  );
};

export const DeleteSelectedUsersDialog = ({
  visible,
  setVisible,
  count = 0,
  // On accepte les deux noms de prop pour rester compatible avec l'existant.
  handleDeleteSelectedUser,
  handleDeleteSelectedUsers,
}) => {
  const [busy, setBusy] = useState(false);
  const run = handleDeleteSelectedUser || handleDeleteSelectedUsers;

  const onHide = () => {
    setBusy(false);
    setVisible(false);
  };

  const confirm = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await run?.();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog
      header="Confirmation de suppression"
      visible={visible}
      modal
      style={{ width: "32rem" }}
      onHide={onHide}
      position="center"
      className="user-dialog"
      dismissableMask
      draggable={false}
    >
      <div className="confirmation-content d-flex align-items-start">
        <i
          className="pi pi-exclamation-triangle me-3 text-danger"
          style={{ fontSize: "2rem" }}
        />
        <div>
          <div>
            Êtes-vous sûr de vouloir supprimer{" "}
            <b>
              {count > 0
                ? count > 1
                  ? `les ${count} utilisateurs sélectionnés`
                  : "l'utilisateur sélectionné"
                : "le(s) utilisateur(s) sélectionné(s)"}
            </b>{" "}
            ?
          </div>
          <small className="text-muted">
            Cette action est définitive. Les comptes rattachés à des offres ne
            pourront pas être supprimés.
          </small>
        </div>
      </div>
      <div className="modal-footer pt-3 d-flex justify-content-between">
        <button
          type="button"
          className="btn btn-outline-secondary my-0"
          onClick={onHide}
          disabled={busy}
        >
          Non
        </button>
        <button
          type="button"
          className="btn btn-danger my-0"
          onClick={confirm}
          disabled={busy}
        >
          {busy ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" />
              Suppression…
            </>
          ) : (
            "Oui, supprimer"
          )}
        </button>
      </div>
    </Dialog>
  );
};

export default DeleteSelectedUsersDialog;
