import { BASE_IMG_URL, imageUrl } from "@/services/tools/constants";
import ExportButtons from "@/componnents/export/ExportButtons";
import { OPERATOR_EXPORT_COLUMNS } from "@/services/tools/exportData";
import { Column } from "primereact/column";
import { DataTable } from "primereact/datatable";
import React, { useState } from "react";

export default function AdminOperatorList({
  dt,
  operators,
  exportExcel,
  exportCSV,
  exportPDF,
  handleViewOperator,
  handleEditOperator,
  handleDeleteOperatorDialog,
  setSelectedOperators,
  setSelectedYear,
  selectedYear,
  years,
  selectedOperators,
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
              <ExportButtons rows={operators} selection={selectedOperators} columns={OPERATOR_EXPORT_COLUMNS} fileName="compartic_operateurs" title="Opérateurs" />
              <button
                className="btn btn-sm btn-danger mb-0"
                onClick={() => {
                  (selectedOperators && selectedOperators.length) > 0 &&
                    setShowDeleteSelected(true);
                }}
              >
                <i className="fa fa-trash mr-2"></i> Supprimer plusieurs
                sélections{" "}
              </button>
            </div>
            <div className="d-flex justify-content-between">
              <div className=" align-content-center pr-2">Annéé</div>
              <select
                id="year-select"
                className="form-control"
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
              >
                <option value={-1}>Toutes les années</option>
                {years?.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
            <div className="">
              <div className="rounded position-relative">
                <input
                  className="form-control bg-body"
                  type="search"
                  placeholder="Recherche..."
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
            className="btn btn-info btn-round me-2 mb-0"
            onClick={() => handleViewOperator(rowData)}
          >
            <i className="far fa-eye"></i>
          </button>
          <button
            className="btn btn-primary btn-round me-2 mb-0"
            onClick={() => handleEditOperator(rowData)}
          >
            <i className="far fa-edit"></i>
          </button>
          <button
            className="btn btn-danger btn-round mb-0"
            onClick={() => handleDeleteOperatorDialog(rowData)}
          >
            <i className="fas fa-trash"></i>
          </button>
        </div>
      </>
    );
  };

  const imageTemplate = (operator) => {
    return (
      <>
        <div>
          {operator?.imagePath ? (
            <>
              <div>
                <img
                  src={imageUrl(operator?.imagePath)}
                  height={50}
                  width={50}
                  alt=""
                />
              </div>
            </>
          ) : (
            <>
              <div>
                <img
                  src="images/default.png"
                  className="rounded"
                  height={50}
                  width={50}
                  alt=""
                />
              </div>
            </>
          )}
        </div>
      </>
    );
  };

  return (
    <DataTable
      emptyMessage="Aucun opérateur ne correspond à votre recherche."
      ref={dt}
      value={operators}
      selectionMode={"checkbox"}
      selection={selectedOperators}
      onSelectionChange={(e) => setSelectedOperators(e.value)}
      dataKey="code"
      paginator
      rows={10}
      rowsPerPageOptions={[5, 10, 25, 50]}
      paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
      currentPageReportTemplate="{first} à {last} sur {totalRecords}"
      globalFilter={globalFilter}
      header={header}
      tableStyle={{ minWidth: "50rem" }}
      globalFilterFields={["name"]}
      stripedRows
      size="small"
      style={{
        padding: 10,
        backgroundColor: "white",
      }}
    >
      <Column selectionMode="multiple" exportable={false}></Column>
      <Column style={{ width: "25%" }} body={imageTemplate}></Column>
      <Column field="code" header="Code" sortable style={{ width: "25%" }} />
      <Column field="name" header="Nom" sortable style={{ width: "25%" }} />
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
