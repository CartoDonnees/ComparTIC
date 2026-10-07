"use client";
import React, { useEffect, useRef, useState } from "react";
import DataLoader from "@/componnents/Loader/DataLoader";
import AdminUserDialog from "./AdminUserDialog";
import AdminUserList from "./AdminUserrList";
import AdminUserViewDialog from "./AdminUserViewDialog";
import {
  toastError,
  toastSuccess,
  toastWarning,
} from "@/componnents/notification/notification";
import {
  DeleteUserDialog,
  DeleteSelectedUsersDialog,
} from "./AdminUserDeleteDialog";
import AdminMainContainerPage from "../../AdminMainContainerPage";
import {
  createUser,
  deleteUser,
  editUser,
  getUsers,
} from "@/services/api/admin/user/usersApiService";
import { isValidEmail } from "@/services/tools/helper";
import EntityStatsPanel from "@/componnents/stats/EntityStatsPanel";
import { computeUserStats } from "@/services/tools/entityStats";

export default function AdminUserPage() {
  const dt = useRef(null);

  const [showUserDialog, setShowUserDialog] = useState(false);
  const [showUserExcelDialog, setShowUserExcelDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showDeleteSelected, setShowDeleteSelected] = useState(false);
  const [showUserViewDialog, setShowUserViewDialog] = useState(false);
  const [showExcelImportModal, setShowExcelImportModal] = useState(false);

  const [users, setUsers] = useState(null);
  const userStats = React.useMemo(() => computeUserStats(users), [users]);

  const [user, setUser] = useState(null);

  //LIST
  const [selectedUsers, setSelectedUsers] = useState(null);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => currentYear - i);
  const [selectedYear, setSelectedYear] = useState(currentYear);

  const [dialogClose, setDialogClose] = useState(null);

  const [loader, setLoader] = useState(null);
  const [response, setResponse] = useState(null);

  useEffect(() => {
    init();
  }, []);

  useEffect(() => {
    if (response?.error === false) {
      setShowUserDialog(false);
      toastSuccess("Enregistrement effectué avec succès");
      // Si la messagerie est indisponible, on affiche le mot de passe
      // provisoire pour que l'administrateur puisse le transmettre.
      const _pwd = response?.data?.temporaryPassword;
      if (_pwd) {
        // On indique aussi la CAUSE de l'échec d'envoi, pour que
        // l'administrateur sache quoi corriger (et non seulement quoi faire).
        const _reason = response?.data?.mail?.reason;
        toastWarning(
          "Compte créé, mais l'e-mail n'a pas pu être envoyé" +
            (_reason ? " (" + _reason + ")" : "") +
            ". Mot de passe provisoire à communiquer : " + _pwd,
          20000,
        );
      }
      init();
    } else if (response?.error === true) {
      toastError(response?.message || "Échec de l'enregistrement");
    }
    // BUGFIX: `loader` restait à true après la réponse (succès comme
    // échec), laissant le formulaire bloqué en chargement.
    if (response) setLoader(false);
  }, [response]);

  const init = async () => {
    const _users = await getUsers();
    setUsers(Array.isArray(_users) ? _users : []);
  };

  // Recharge la liste depuis le serveur
  const reload = () => {
    setSelectedYear(currentYear);
    init();
  };

  const exportCSV = () => {
    dt.current.exportCSV();
  };

  // BUGFIX: ces colonnes provenaient du module cartographie (localités,
  // population...) : les exports sortaient donc vides. On décrit ici les
  // véritables champs d'un utilisateur.
  const cols = [
    { field: "code", header: "Code" },
    { field: "lastName", header: "Nom" },
    { field: "firstName", header: "Prénom" },
    { field: "email", header: "Email" },
    { field: "phone", header: "Téléphone" },
    { field: "profile", header: "Profil" },
    { field: "operator", header: "Opérateur" },
    { field: "status", header: "Statut" },
  ];

  /**
   * Lignes exportables : on ne sort QUE des champs métier.
   * Le mot de passe (haché) et le jeton de confirmation ne doivent jamais
   * se retrouver dans un fichier téléchargé.
   */
  const buildExportRows = () =>
    (users || []).map((u) => ({
      code: u?.code ?? "",
      lastName: u?.lastName ?? "",
      firstName: u?.firstName ?? "",
      email: u?.email ?? "",
      phone: u?.phone ?? "",
      profile: u?.profile?.name ?? "",
      operator: u?.focalPoint?.operator?.name ?? "",
      status: u?.status === "ENABLE" ? "Activé" : "Désactivé",
    }));

  const exportColumns = cols.map((col) => ({
    title: col.header,
    dataKey: col.field,
  }));

  const exportPdf = () => {
    import("jspdf").then((jsPDF) => {
      import("jspdf-autotable").then(() => {
        const doc = new jsPDF.default({
          format: "a4",
          orientation: "landscape",
          unit: "cm",
          compressPdf: true,
        });
        doc.text("COMPARTIC ARTCI - LISTE DES UTILISATEURS", 1, 1);
        doc.autoTable(exportColumns, buildExportRows(), {
          headStyles: { fillColor: [255, 140, 0] },
          styles: { fontSize: 8 },
        });
        doc.save("artci_compartic_utilisateurs.pdf");
      });
    });
  };

  const exportExcel = () => {
    import("xlsx").then((xlsx) => {
      // BUGFIX: on exportait les objets bruts, mot de passe haché et jeton
      // de confirmation inclus. On n'exporte plus que les champs métier.
      const worksheet = xlsx.utils.json_to_sheet(buildExportRows());
      const workbook = { Sheets: { data: worksheet }, SheetNames: ["data"] };
      const excelBuffer = xlsx.write(workbook, {
        bookType: "xlsx",
        type: "array",
      });

      saveAsExcelFile(excelBuffer, "artci_compartic_utilisateurs");
    });
  };

  const saveAsExcelFile = (buffer, fileName) => {
    import("file-saver").then((module) => {
      if (module && module.default) {
        let EXCEL_TYPE =
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8";
        let EXCEL_EXTENSION = ".xlsx";
        const data = new Blob([buffer], {
          type: EXCEL_TYPE,
        });

        module.default.saveAs(
          data,
          fileName + "_export_" + new Date().getTime() + EXCEL_EXTENSION,
        );
      }
    });
  };

  //VISUALISATION
  const handleViewUser = (dist) => {
    setUser(dist);
    setShowUserViewDialog(true);
  };

  const handleAddOrganization = () => {
    setUser(null);
    setShowUserDialog(true);
  };

  //MODIFICATION
  const handleEditUser = (dist) => {
    setUser(dist);
    setShowUserDialog(true);
  };

  //SUPPRESSION
  const handleDeleteUserDialog = (dist) => {
    setUser({ ...dist });
    setShowDeleteDialog(true);
  };

  const handleDeleteUser = async () => {
    // BUGFIX: `user.id` était lu sans garde -> TypeError « Cannot read
    // properties of null » si la confirmation était déclenchée alors qu'aucun
    // utilisateur n'était sélectionné (double-clic, dialogue rouvert...).
    if (!user?.id) {
      toastWarning("Aucun utilisateur sélectionné.");
      setShowDeleteDialog(false);
      return;
    }

    const res = await deleteUser(user.id);
    if (res?.error === false) {
      toastSuccess("Utilisateur supprimé avec succès");
      setUser(null);
      setShowDeleteDialog(false);
      await init();
    } else {
      toastError(
        res?.message || "La suppression de l'utilisateur a échoué",
      );
    }
  };
  const handleDeleteSelectedUser = async () => {
    // BUGFIX: `forEach(async ...)` n'attendait aucune suppression : le
    // try/catch ne captait rien, un toast s'affichait par utilisateur et la
    // liste n'était pas rafraîchie de façon fiable.
    if (!selectedUsers?.length) {
      toastWarning("Aucun utilisateur sélectionné.");
      return;
    }

    let ok = 0;
    const failed = [];
    for (const u of selectedUsers) {
      try {
        const res = await deleteUser(u.id);
        if (res?.error === false) ok++;
        else failed.push(u?.email || u?.code);
      } catch (e) {
        failed.push(u?.email || u?.code);
      }
    }

    if (ok > 0) {
      toastSuccess(
        ok > 1
          ? ok + ' utilisateurs supprimés avec succès'
          : '1 utilisateur supprimé avec succès',
      );
    }
    if (failed.length > 0) {
      toastError(
        "Échec de la suppression pour : " + failed.join(", "),
      );
    }

    setSelectedUsers(null);
    setUser(null);
    setShowDeleteSelected(false);
    await init();
  };

  const handleSubmit = async () => {
    if (user?.code) {
      if (user?.firstName && user?.firstName?.trim()) {
        if (isValidEmail(user?.email)) {
          if (user?.profileId) {
            if (user?.status) {
              if (user?.profileId == 3) {
                if (
                  user?.focalPoint?.serialNumber &&
                  user?.focalPoint?.serialNumber?.trim()
                ) {
                  if (user?.focalPoint?.operatorId) {
                    if (!user?.id) {
                      setLoader(true);
                      const _res = await createUser(user);
                      setResponse(_res);
                    } else {
                      setLoader(true);
                      const _res = await editUser(user);
                      setResponse(_res);
                    }
                  } else {
                    toastWarning(
                      "Veuillez sélectionner l'opérateur du point focal ",
                    );
                  }
                } else {
                  toastWarning(
                    "Veuillez indiquer un identifiant ou le matricule du point focal ",
                  );
                }
              } else {
                if (!user?.id) {
                  setLoader(true);
                  const _res = await createUser(user);
                  setResponse(_res);
                } else {
                  setLoader(true);
                  const _res = await editUser(user);
                  setResponse(_res);
                }
              }
            } else {
              toastWarning("Veuillez sélectionner un statut ");
            }
          } else {
            toastWarning("Veuillez sélectionner un profil ");
          }
        } else {
          toastWarning("Veuillez entrer un email valide ");
        }
      } else {
        toastWarning("Veuillez entrer un prénom ");
      }
    } else {
      toastWarning("Code invalide ");
    }
  };
  return (
    <AdminMainContainerPage
    active='actor-1'
      children={
        <>
          <div
            className="bg-dark p-2 mb-2 text-white d-flex justify-content-between mx-1"
            style={{ fontSize: 20 }}
          >
            <div className=" align-content-center">
              <em>
                <b>
                  <i className="bi bi-arrow-right me-2"></i>Gestion des utilisateurs
                </b>
              </em>
            </div>
            <div>
              <button
                className="btn btn-primary text-white me-2"
                onClick={() => handleAddOrganization()}
              >
                <i className="fa fa-plus me-2"></i> Ajouter un utilisateur
              </button>
            </div>
          </div>
          <div className="">
            <EntityStatsPanel
              storageKey="stats-users"
              title="Statistiques des comptes"
              subtitle="Répartition des comptes par profil, statut et opérateur."
              loading={!users}
              kpis={userStats.kpis}
              breakdowns={userStats.breakdowns}
              lists={userStats.lists}
            />
              <div className="container-fluid">
                {users == null ? (
                  <DataLoader label="Chargement des utilisateurs…" />
) : (
                  <>
                    <AdminUserList
                      users={users}
                      exportCSV={exportCSV}
                      exportPDF={exportPdf}
                      exportExcel={exportExcel}
                      dt={dt}
                      handleViewUser={handleViewUser}
                      handleEditUser={handleEditUser}
                      handleDeleteUserDialog={handleDeleteUserDialog}
                      selectedUsers={selectedUsers}
                      setSelectedUsers={setSelectedUsers}
                      setSelectedYear={setSelectedYear}
                      selectedYear={selectedYear}
                      years={years}
                      setShowDeleteSelected={setShowDeleteSelected}
                    />
                    <AdminUserViewDialog
                      visible={showUserViewDialog}
                      setVisible={setShowUserViewDialog}
                      user={user}
                    />
                    <DeleteUserDialog
                      visible={showDeleteDialog}
                      setVisible={setShowDeleteDialog}
                      handleDeleteUser={handleDeleteUser}
                      user={user}
                    />
                    <DeleteSelectedUsersDialog
                      visible={showDeleteSelected}
                      setVisible={setShowDeleteSelected}
                      count={selectedUsers?.length || 0}
                      handleDeleteSelectedUser={handleDeleteSelectedUser}
                    />
                  </>
                )}
              </div>
          </div>

          <AdminUserDialog
            visible={showUserDialog}
            setVisible={setShowUserDialog}
            user={user}
            setUser={setUser}
            handleSubmit={handleSubmit}
            close={dialogClose}
            setClose={setDialogClose}
            init={init}
            loader={loader}
            setLoader={setLoader}
          />
        </>
      }
    />
  );
}
