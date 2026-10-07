"use client";
import React, { useEffect, useRef, useState } from "react";
import DataLoader from "@/componnents/Loader/DataLoader";
import AdminOperatorDialog from "./AdminOperatorDialog";
import AdminOperatorList from "./AdminOperatorList";
import AdminOperatorViewDialog from "./AdminOperatorViewDialog";
import {
  toastError,
  toastSuccess,
  toastWarning,
} from "@/componnents/notification/notification";
import {
  DeleteOperatorDialog,
  DeleteSelectedOperatorsDialog,
} from "./AdminOperatorDeleteDialog";
import AdminMainContainerPage from "../../AdminMainContainerPage";
import EntityStatsPanel from "@/componnents/stats/EntityStatsPanel";
import { computeOperatorStats } from "@/services/tools/entityStats";
import {
  createOperatorApi,
  deleteOperatorApi,
  getAdminOperators,
  updateOperatorApi,
} from "@/services/api/admin/operator/operatorsApiServices";
import { BASE_IMG_URL, imageUrl } from "@/services/tools/constants";
import {
  srtSubDescription,
  srtSubDescription3,
} from "@/services/tools/convertions";

export default function AdminOperatorPage() {
  const dt = useRef(null);

  const [showOperatorDialog, setShowOperatorDialog] = useState(false);
  const [showOperatorExcelDialog, setShowOperatorExcelDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showDeleteSelected, setShowDeleteSelected] = useState(false);
  const [showOperatorViewDialog, setShowOperatorViewDialog] = useState(false);
  const [showExcelImportModal, setShowExcelImportModal] = useState(false);

  const [operators, setOperators] = useState(null);
  const operatorStats = React.useMemo(() => computeOperatorStats(operators), [operators]);

  const [operator, setOperator] = useState(null);

  //LIST
  const [selectedOperators, setSelectedOperators] = useState(null);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => currentYear - i);
  const [selectedYear, setSelectedYear] = useState(currentYear);

  const [dialogClose, setDialogClose] = useState(null);

  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    const _opers = await getAdminOperators();
    const _ops = operators?.filter(
      (item) => item?.type == "MOBILE" || item.type == "HYBRIDE",
    );
    setOperators(Array.isArray(_opers) ? _opers : []);
  };

  const reload = () => {};

  const exportCSV = () => {
    dt.current.exportCSV();
  };

  const cols = [
    { field: "code", header: "Code" },
    { field: "name", header: "Nom" },
    { field: "nb_locs", header: "Localités" },
    { field: "nb_locs_cov", header: "Localité couvertes" },
    { field: "nb_locs_not_cov", header: "Localités non couvertes" },
    { field: "nb_pop", header: "Population" },
    { field: "nb_cov_pop", header: "Population couverte" },
    { field: "nb_pop_not_cov", header: "Population non couverte" },
    { field: "description", header: "Description" },
  ];

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
        doc.autoTable(exportColumns, operators, {
          headStyles: { fillColor: [255, 140, 0] },
        });
        doc.save("artci-cartodonnees-extract-dist-optical.pdf");
      });
    });
  };

  const exportExcel = () => {
    import("xlsx").then((xlsx) => {
      const worksheet = xlsx.utils.json_to_sheet(operators);
      const workbook = { Sheets: { data: worksheet }, SheetNames: ["data"] };
      const excelBuffer = xlsx.write(workbook, {
        bookType: "xlsx",
        type: "array",
      });

      saveAsExcelFile(excelBuffer, "artci-cartodonnees-extract-operators");
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

  const reloadOperators = async () => {
    const _opers = await getAdminOperators();
    if (Array.isArray(_opers)) setOperators(_opers);
    else toastWarning("La liste des opérateurs n'a pas pu être rechargée.");
  };

  // CONSULTATION
  const handleViewOperator = (oper) => {
    setOperator(oper);
    setShowOperatorViewDialog(true);
  };

  // CRÉATION
  const handleAddOperator = () => {
    setOperator(null);
    setShowOperatorDialog(true);
  };

  // MODIFICATION
  const handleEditOperator = (oper) => {
    setOperator(oper);
    setShowOperatorDialog(true);
  };

  /** Enregistrement du formulaire (création ou modification). */
  const handleSaveOperator = async (form) => {
    const editing = !!operator?.id;
    const res = editing ? await updateOperatorApi({ ...form, id: operator.id }) : await createOperatorApi(form);
    if (!res?.error) {
      toastSuccess(editing ? `Opérateur ${res.data?.name || ""} modifié.` : `Opérateur ${res.data?.name || ""} créé.`);
      setShowOperatorDialog(false);
      setOperator(null);
      await reloadOperators();
    }
    return res;
  };

  // SUPPRESSION
  const handleDeleteOperatorDialog = (oper) => {
    setOperator(oper);
    setShowDeleteDialog(true);
  };

  const handleDeleteOperator = async () => {
    const res = await deleteOperatorApi(operator?.id);
    if (!res?.error) {
      toastSuccess(`Opérateur ${operator?.name || ""} supprimé.`);
      setShowDeleteDialog(false);
      setOperator(null);
      await reloadOperators();
    }
    return res;
  };

  /** Suppression groupée : une à une, en rapportant les refus. */
  const handleDeleteSelectedOperator = async () => {
    const list = Array.isArray(selectedOperators) ? selectedOperators : [];
    const refused = [];
    for (const oper of list) {
      const res = await deleteOperatorApi(oper.id);
      if (res?.error) refused.push(`${oper.name} : ${res.message}`);
    }
    const done = list.length - refused.length;
    if (done > 0) toastSuccess(`${done} opérateur(s) supprimé(s).`);
    setSelectedOperators(null);
    await reloadOperators();
    if (refused.length) return { error: true, message: refused.join(" · ") };
    setShowDeleteSelected(false);
    return { error: false };
  };

  return (
    <AdminMainContainerPage
    active='actor-2'
      children={
        <>
          <div>
            <div
              className="bg-dark p-2 mb-2 text-white d-flex justify-content-between mx-1"
              style={{ fontSize: 20 }}
            >
              <div className=" align-content-center">
                <em>
                  <b>
                    <i className="bi bi-align-start me-2"></i>Gestion des opérateurs
                  </b>
                </em>
              </div>
              <div>
                <button
                  className="btn btn-primary text-white me-2"
                  onClick={() => handleAddOperator()}
                >
                  <i className="fa fa-plus me-2"></i> Ajouter un opérateur
                </button>
              </div>
            </div>
          </div>
          <div className="px-2">
            <EntityStatsPanel
              storageKey="stats-operators"
              title="Statistiques des opérateurs"
              subtitle="Opérateurs par type de réseau, statut, offres déclarées et points focaux (ARTCI exclue)."
              loading={!operators}
              kpis={operatorStats.kpis}
              breakdowns={operatorStats.breakdowns}
              lists={operatorStats.lists}
            />
            {operators == null ? (
              <DataLoader label="Chargement des opérateurs…" variant="cards" rows={6} />
) : (
              <>
                <div className="row">
                  {operators.map((oper, i) => {
                    return (
                      <div className="col-md-4 mb-2" key={oper.id}>
                        <div
                          className="card flex-row p-8 card-product"
                          style={{ maxWidth: 390,  }}
                          // onClick={() =>handleViewOperator()}
                        >
                          <div>
                            {/* img */}
                            <img
                              src={imageUrl(oper?.imagePath)}
                              height={50}
                              width={50}
                              alt=""
                            />
                            <div className="">
                              <hr className="m-1" />
                              {oper?.type == "MOBILE" && (
                                <>
                                  <i
                                    className="bi bi-phone"
                                    style={{ fontSize: 30 }}
                                  ></i>{" "}
                                  Mobile
                                </>
                              )}
                              {oper?.type == "FIXE" && (
                                <>
                                  <i
                                    className="bi bi-geo-fill"
                                    style={{ fontSize: 30 }}
                                  ></i>{" "}
                                  Fixe
                                </>
                              )}
                              {oper?.type == "HYBRIDE" && (
                                <>
                                  <i className="bi bi-arrows-collapse-vertical"></i>
                                  Hybride
                                </>
                              )}
                            </div>
                          </div>
                          {/* content */}
                          <div className="ms-6">
                            <h5 className="mb-1 d-flex align-items-center gap-2">
                              <span
                                aria-hidden="true"
                                style={{ width: 10, height: 10, borderRadius: 3, background: oper?.color || "#cbd5e1", display: "inline-block" }}
                              ></span>
                              <span className="text-inherit">{oper?.name}</span>
                            </h5>
                            <div className="small mb-1">
                              <span className={`badge ${oper?.status === "ENABLE" ? "bg-success-subtle text-success" : "bg-secondary-subtle text-secondary"} me-1`}>
                                {({ ENABLE: "Actif", PENDING: "En attente", SUSPENDED: "Suspendu", DISABLE: "Désactivé" })[oper?.status] || "Statut non renseigné"}
                              </span>
                              <span className="text-muted">
                                {oper?._count?.offers ?? 0} offre(s) · {oper?._count?.focalPoints ?? 0} point(s) focal(aux)
                              </span>
                            </div>
                            <div className="small text-muted">
                              <span>
                                {srtSubDescription3(
                                  oper?.description,
                                  100,
                                )}{" "}
                              </span>
                            </div>
                            <div>
                              {/* badge */}
                              <div
                                className="btn btn-dark btn-sm p-0 px-1 badge  border me-1"
                                onClick={() => handleViewOperator(oper)}
                              >
                                <small>
                                  <i className="far fa-eye me-2"></i> Voir plus
                                </small>
                              </div>
                              <div
                                className="btn btn-info btn-sm p-0 px-1 badge border me-1"
                                onClick={() => handleEditOperator(oper)}
                              >
                                <small>
                                  <i className="far fa-edit me-2"></i>{" "}
                                  Modifier{" "}
                                </small>
                              </div>
                              {/* badge */}
                              <div
                                className="btn btn-danger btn-sm p-0 px-1 badge border"
                                onClick={() => handleDeleteOperatorDialog(oper)}
                              >
                                <small>
                                  <i className="fas fa-trash me-1"></i>{" "}
                                  Supprimer
                                </small>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* <AdminOperatorList
                  operators={operators}
                  exportCSV={exportCSV}
                  exportPDF={exportPdf}
                  exportExcel={exportExcel}
                  dt={dt}
                  handleViewOperator={handleViewOperator}
                  handleEditOperator={handleEditOperator}
                  handleDeleteOperatorDialog={handleDeleteOperatorDialog}
                  selectedOperators={selectedOperators}
                  setSelectedOperators={setSelectedOperators}
                  setSelectedYear={setSelectedYear}
                  selectedYear={selectedYear}
                  years={years}
                  setShowDeleteSelected={setShowDeleteSelected}
                /> */}
                <AdminOperatorViewDialog
                  visible={showOperatorViewDialog}
                  setVisible={setShowOperatorViewDialog}
                  operator={operator}
                />
                <DeleteOperatorDialog
                  visible={showDeleteDialog}
                  setVisible={setShowDeleteDialog}
                  handleDeleteOperator={handleDeleteOperator}
                  operator={operator}
                />
                <DeleteSelectedOperatorsDialog
                  visible={showDeleteSelected}
                  setVisible={setShowDeleteSelected}
                  count={selectedOperators?.length || 0}
                  handleDeleteSelectedOperator={handleDeleteSelectedOperator}
                />
              </>
            )}
          </div>

          <AdminOperatorDialog
            visible={showOperatorDialog}
            setVisible={setShowOperatorDialog}
            operator={operator}
            onSave={handleSaveOperator}
          />
        </>
      }
    />
  );
}
