import { getAreas } from "@/services/api/areas/areasApiServices";
import ExportButtons from "@/componnents/export/ExportButtons";
import { AREA_EXPORT_COLUMNS } from "@/services/tools/exportData";
import { Column } from "primereact/column";
import { DataTable } from "primereact/datatable";
import React, { useEffect, useState } from "react";

export default function AdminAreaList({
  areas,
  selectedAreas,
  setSelectedAreas,
  exportExcel,
  exportCSV,
  exportPDF,
  dt,
  handleViewArea,
  handleEditArea,
  handleDeleteOneArea,
  handleDeleteManyAreas,
}) {
  const [globalFilter, setGlobalFilter] = useState(null);

  const [grid, setGrid] = useState(false);

  const header = () => {
    return (
      <>
        <div className=" bg-light w-100">
          {/* Search and select START */}
          <div className=" d-flex justify-content-between">
            <div className="">
              <ExportButtons rows={areas} selection={selectedAreas} columns={AREA_EXPORT_COLUMNS} fileName="compartic_zones" title="Zones géographiques" />
              <button
                className="btn  btn-danger mb-0"
                onClick={() => handleDeleteManyAreas()}
              >
                <i className="fa fa-trash mr-2"></i> Supprimer plusieurs
                sélections{" "}
              </button>
            </div>

            <div className="mt-2 w-50">
              <div className="rounded position-relative mb-0 pb-0">
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
        <div className="d-flex justify-content-end" style={{ padding: "10px" }}>
          <button
            className="btn btn-sm btn-info btn-round me-2 mb-0"
            // onClick={() => handleViewCountry(rowData)}
          >
            <i className="far fa-eye"></i>
          </button>
          <button
            className="btn btn-sm btn-primary text-center me-2 "
            // onClick={() => handleEditCountry(rowData)}
            style={{ width: 30, height: 30, padding: 0 }}
          >
            <i className="far fa-edit"></i>
          </button>
          <button
            className="btn btn-sm btn-danger btn-round mb-0"
            // onClick={() => handleDeleteOneCountry(rowData)}
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
      emptyMessage="Aucune zone ne correspond à votre recherche."
      ref={dt}
      value={areas}
      selectionMode={"checkbox"}
      selection={selectedAreas}
      onSelectionChange={(e) => setSelectedAreas(e.value)}
      dataKey="code"
      paginator
      rows={10}
      rowsPerPageOptions={[5, 10, 25, 50]}
      paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
      currentPageReportTemplate="{first} à {last} sur {totalRecords}"
      globalFilter={globalFilter}
      header={header}
      // tableStyle={{ minWidth: '50rem' }}
      globalFilterFields={["name"]}
      stripedRows
      style={{
        padding: 10,
        backgroundColor: "white",
      }}
    >
      <Column selectionMode="multiple" exportable={false}></Column>
      {/* <Column style={{ width: '25%' }} body={imageTemplate}></Column> */}
      <Column field="code" header="Code" sortable style={{ padding: 10 }} />
      <Column field="title" header="Nom" sortable style={{ padding: 10 }} />
      <Column
        field="description"
        header="Description"
        sortable
        style={{ padding: 10 }}
      />
      {/* <Column body={yearTemplate} header="Année" sortable style={{ width: '25%' }} /> */}
      {/* <Column field="description" header="Description" sortable style={{ width: '25%' }} /> */}
      <Column
        alignHeader={"right"}
        header="Actions"
        headerStyle={{ textAlign: "right" }}
        body={actionBodyTemplate}
      />
    </DataTable>
  );
}
