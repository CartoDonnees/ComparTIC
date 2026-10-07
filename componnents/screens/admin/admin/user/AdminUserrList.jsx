import { PROFILE_CODE_TO_ROLE, ROLE_LABELS } from "@/services/rbac/roles";
import ExportButtons from "@/componnents/export/ExportButtons";
import { USER_EXPORT_COLUMNS } from "@/services/tools/exportData";
import { BASE_IMG_URL } from "@/services/tools/constants";
import { Column } from "primereact/column";
import { DataTable } from "primereact/datatable";
import React, { useState } from "react";

export default function AdminUserList({
  dt,
  users,
  exportExcel,
  exportCSV,
  exportPDF,
  handleViewUser,
  handleEditUser,
  handleDeleteUserDialog,
  setSelectedUsers,
  setSelectedYear,
  selectedYear,
  years,
  selectedUsers,
  setShowDeleteSelected,
}) {
  const [globalFilter, setGlobalFilter] = useState(null);

  const [grid, setGrid] = useState(false);

  const header = () => {
    return (
      <>
        <div className=" bg-light w-100 p-2">
          {/* Search and select START */}
          <div className="d-flex justify-content-between">
            {/* Search bar */}
            <div className=" d-flex justify-content-between">
              <ExportButtons rows={users} selection={selectedUsers} columns={USER_EXPORT_COLUMNS} fileName="compartic_utilisateurs" title="Utilisateurs" />
              <button
                className="btn btn-sm btn-danger mb-0"
                onClick={() => {
                  (selectedUsers && selectedUsers.length) > 0 &&
                    setShowDeleteSelected(true);
                }}
              >
                <i className="fa fa-trash mr-2"></i> Supprimer plusieurs
                sélections{" "}
              </button>
            </div>
            <div className="">
              <div className="rounded position-relative">
                <input
                  className="form-control bg-body"
                  type="search"
                  placeholder="Rechercher un nom, un email, un profil..."
                  aria-label="Search"
                  onChange={(e) => setGlobalFilter(e.target.value)}
                />
              </div>
            </div>
          </div>
          {/* Search and select END */}
        </div>
      </>
    );
  };

  const actionBodyTemplate = (rowData) => {
    return (
      <>
        <div className="d-flex justify-content-end">
          <button
            className="btn btn-info btn-round me-2 mb-0 mb-1"
            onClick={() => handleViewUser(rowData)}
          >
            <i className="far fa-eye"></i>
          </button>
          <button
            className="btn btn-primary btn-round me-2 mb-1"
            onClick={() => handleEditUser(rowData)}
          >
            <i className="far fa-edit"></i>
          </button>
          <button
            className="btn btn-danger btn-round mb-0 mb-1"
            onClick={() => handleDeleteUserDialog(rowData)}
          >
            <i className="fas fa-trash"></i>
          </button>
        </div>
      </>
    );
  };

  const nameTemplate = (user) => {
    return (
      <>
        <div className="ml-2" style={{ marginLeft: 10 }}>
          {user?.firstName + " " + user?.lastName}
        </div>
      </>
    );
  };

  const roleTemplate = (user) => {
    return (
      <>
        <div>
          {ROLE_LABELS[PROFILE_CODE_TO_ROLE[user?.profile?.code]] || user?.profile?.name}
        </div>
      </>
    );
  };

  const statusTemplate = (user) => {
    return (
      <>
        <div>
          {user?.status == "ENABLE" && "ACTIVER"}
          {user?.status == "DISABLE" && "DESACTIVER"}
          {user?.status == "PENDING" && "EN ATTENTE"}
          {user?.status == "SUSPENDED" && "SUSPENDU"}
        </div>
      </>
    );
  };

  return (
    <DataTable
      ref={dt}
      value={users}
      selectionMode={"checkbox"}
      selection={selectedUsers}
      onSelectionChange={(e) => setSelectedUsers(e.value)}
      dataKey="code"
      paginator
      rows={10}
      rowsPerPageOptions={[5, 10, 25, 50]}
      paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
      currentPageReportTemplate="{first} à {last} sur {totalRecords}"
      globalFilter={globalFilter}
      header={header}
      tableStyle={{ minWidth: "50rem" }}
      // BUGFIX: on filtrait sur "name", champ inexistant chez un utilisateur :
      // la recherche ne renvoyait jamais rien. On couvre les champs réels.
      globalFilterFields={[
        "code",
        "lastName",
        "firstName",
        "email",
        "phone",
        "profile.name",
        "status",
      ]}
      emptyMessage="Aucun utilisateur ne correspond à votre recherche."
      stripedRows
      size="small"
      style={{
        padding: 10,
        backgroundColor: "white",
      }}
    >
      <Column selectionMode="multiple" exportable={false}></Column>
      <Column
        style={{ width: "25%" }}
        header="Nom et prénoms"
        headerStyle={{ paddingLeft: 10 }}
        body={nameTemplate}
      ></Column>
      <Column field="email" header="Email" sortable style={{ width: "25%" }} />
      <Column
        header="Profile"
        sortable
        body={roleTemplate}
        style={{ width: "25%" }}
      />
      <Column
        header="Status"
        sortable
        body={statusTemplate}
        style={{ width: "25%" }}
      />
      {/* <Column body={yearTemplate} header="Année" sortable style={{ width: '25%' }} /> */}
      {/* <Column field="description" header="Description" sortable style={{ width: '25%' }} /> */}
      <Column
        alignHeader={"right"}
        header="Actions"
        headerStyle={{ textAlign: "right" }}
        bodyStyle={{ textAlign: "end", overflow: "visible" }}
        body={actionBodyTemplate}
      />
    </DataTable>
  );
}
