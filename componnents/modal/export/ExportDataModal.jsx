import ExportButtons from "@/componnents/export/ExportButtons";
import { exportToPdf, FORMULA_EXPORT_COLUMNS } from "@/services/tools/exportData";
import { Button } from "primereact/button";
import { Column } from "primereact/column";
import { DataTable } from "primereact/datatable";
import { Dialog } from "primereact/dialog";
import React, { useEffect, useRef } from "react";

export default function ExportDataModal({ display, setDisplay, data }) {
  const dt = useRef(null);

  const cols = [
    { field: "code", header: "Code" },
    { field: 'title', header: 'Nom' },
    { field: 'category', header: 'Categorie' },
    { field: 'operator', header: 'Operateur' },
    { field: 'type', header: "Type d'offre" },
    { field: 'validity', header: 'Validité' },
    { field: 'price', header: 'Prix' },
    { field: 'service', header: 'Service' },
  ];

  const exportColumns = cols.map((col) => ({
    title: col.header,
    dataKey: col.field,
  }));

  useEffect(() => {
    if (display) {
      onClick();
    } else {
      onHide();
    }
  }, [display]);

  const onClick = (position) => {
    setDisplay(true);
  };

  const onHide = (name) => {
    setDisplay(false);
  };

  const exportPdf = () =>
    exportToPdf({
      rows: data || [],
      columns: FORMULA_EXPORT_COLUMNS,
      fileName: "compartic_offres",
      title: "ComparTIC   Offres de services",
    }).catch((error) => console.error("Export PDF impossible :", error));

  const servicesTemplate = (rowData) => {
    return (
      <table className="table table-bordered">
        {rowData?.serviceDetail?.map((sd) => {
          return (
            <tr>
              <td>
                {sd?.service?.title == "VOIX" && "Appel"}
                {sd?.service?.title == "SMS" && "SMS"}
                {sd?.service?.title == "DATA" && "Internet"}
              </td>
              <td>{sd?.quantity} </td>
            </tr>
          );
        })}
      </table>
    );
  };

  return (
    <Dialog
      header="EXPORTATION"
      visible={display}
      style={{ width: "80vw" }}
      onHide={() => onHide(false)}
      footer={
        <ExportButtons
          rows={data || []}
          columns={FORMULA_EXPORT_COLUMNS}
          fileName="compartic_offres"
          title="ComparTIC   Offres de services"
        />
      }
    >
      <div className="">
        <DataTable ref={dt} value={data} size="small">
          <Column field="code" header="Code" />
          <Column field="title" header="Nom" />
          <Column field="offer.operator.name" header="Opérateur" />
          <Column field="offer.billingType" header="Type d'offre" />
          <Column field="offer.category" header="Catégorie" />
          <Column field="validity" header="Validité" />
          <Column field="price.value" header="Prix" />
          <Column body={servicesTemplate} header="Service" />
        </DataTable>
      </div>
    </Dialog>
  );
}
