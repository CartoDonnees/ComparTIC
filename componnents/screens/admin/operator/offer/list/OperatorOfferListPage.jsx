import React, { useEffect, useRef, useState } from "react";
import DataLoader from "@/componnents/Loader/DataLoader";
import ExportButtons from "@/componnents/export/ExportButtons";
import { OFFER_EXPORT_COLUMNS } from "@/services/tools/exportData";
import OfferFilterPanel from "@/componnents/filter/OfferFilterPanel";
import { DEFAULT_OFFER_FILTERS, applyOfferFilters, countByStatus } from "@/services/tools/offerFilters";
import AdminMainContainerPage from "../../../AdminMainContainerPage";
import { DataTable } from "primereact/datatable";
import {
  getAdminMonitorings,
  getOperatorOffers,
} from "@/services/api/offers/offersApiServices";
import { Column } from "primereact/column";
import { formatDateToFrench } from "@/services/tools/helper";
import AdminOfferViewDialog from "../view/OperatorOfferViewDialog";
import Link from "next/link";
import { Dropdown } from "primereact/dropdown";
import { MultiSelect } from "primereact/multiselect";
import { BASE_IMG_URL, imageUrl } from "@/services/tools/constants";
import AdminEditOfferPage from "../edit/OperatorEditOfferPage";
import OperatorMonitoringPage from "../monitoring/OperatorMonitoringPage";
import DefaultLoader from "@/componnents/Loader/DefaultLoader";
import { useOperator } from "@/services/providers/OperatorProvider";
import { useClient } from "@/services/providers/ClientProvider";
import { useRouter } from "next/router";
import OfferWorkflowActions from "@/componnents/workflow/OfferWorkflowActions";
import WorkflowStatusBadge from "@/componnents/workflow/WorkflowStatusBadge";
import OfferTypeBadge from "@/componnents/workflow/OfferTypeBadge";
import RowActionBar from "@/componnents/workflow/RowActionBar";
import useWorkflowActions from "@/componnents/workflow/useWorkflowActions";
import useTablePaging from "@/componnents/common/useTablePaging";

export default function OperatorOfferListPage() {
  const { operators, services, countries, user } = useClient();
  const router = useRouter();

  const dt = useRef(null);
  const [globalFilter, setGlobalFilter] = useState(null);
  const [grid, setGrid] = useState(false);

  const [offers, setOffers] = useState(null);
  const [monitoringData, setMonitoringData] = useState(null);
  const [offersToShow, setOffersToShow] = useState(null);
  // Filtres de la liste (voir services/tools/offerFilters.js) : la liste
  // affichée est recalculée à partir de la liste chargée.
  const [offerFilters, setOfferFilters] = useState(DEFAULT_OFFER_FILTERS);
  const [monitoringsToShow, setMonitoringsToShow] = useState(null);

  const [selectedOffer, setSelectedOffer] = useState(null);
  const [selectedMonitoring, setSelectedMonitoring] = useState();

  const [offer, setOffer] = useState(null);
  const [showViewOfferDialog, setShowViewOfferDialog] = useState(null);

  //FILTER
  const [filter, setFilter] = useState();
  const [selectedOperators, setSelectedOperators] = useState(null);
  const [operatorsToShow, setOperatorsToShow] = useState(null);

  const [startMonitoring, setStartMonitoring] = useState(false);
  const [step, setStep] = useState(1);

  const [showData, setShowData] = useState(1);

  useEffect(() => {
    init();
  }, []);

  // L'utilisateur est chargé de façon asynchrone : sans lui, `init` ne charge
  // rien et la liste resterait en attente indéfiniment.
  useEffect(() => {
    if (user?.id && offers === null) init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  useEffect(() => {
    if (filter?.category && operators) {
      setSelectedOperators(null);
      let ops = null;
      if (filter?.category == 1) {
        ops = operators.filter(
          (op) => op.type == "MOBILE" || op.type == "HYBRIDE",
        );
      } else if (filter?.category == 2) {
        ops = operators.filter(
          (op) => op.type == "FIXE" || op.type == "HYBRIDE",
        );
      } else {
        ops = operators;
      }
      setOperatorsToShow(ops);
    }
  }, [filter?.category]);

  const init = async () => {
    if (user) {
      // alert('OKSSS 111')
      const _offers = await getOperatorOffers(user?.focalPoint?.operatorId);
      setOffers(Array.isArray(_offers) ? _offers : []);
      setOffersToShow(_offers);

      let _filter = null;

      _filter = { ..._filter };

      // _filter["offerType"] = -1;
      _filter["category"] = -1;
      _filter["cTPrepay"] = true;
      _filter["cTPostpay"] = true;
      _filter["cTHybride"] = true;

      setFilter(_filter);
      setSelectedOperators(null);
    }
  };

  const handleShowData = async (nb) => {
    // Les onglets (offres / monitorings) partagent la sélection : on la vide
    // pour ne pas exporter des lignes de l'autre onglet.
    setSelectedOffer(null);
    // Onglet affiché immédiatement, avec l'indicateur de chargement.
    if (nb == 1) setOffers(null);
    else setMonitoringData(null);
    setShowData(nb);
    // BUGFIX: on restreint aux données de l'opérateur connecté (avant :
    // getAdminOffers()/getAdminMonitorings() renvoyaient TOUTES les offres,
    // fuite de données inter-opérateurs).
    const operatorId = user?.focalPoint?.operatorId;
    if (nb == 1) {
      const _offers = await getOperatorOffers(operatorId);
      setOffers(Array.isArray(_offers) ? _offers : []);
      setOffersToShow(_offers);
    } else {
      // Le filtrage est désormais fait par le serveur (voir getMonitorings)
      const _monitorings = await getAdminMonitorings(operatorId);
      setMonitoringData(Array.isArray(_monitorings) ? _monitorings : []);
      setMonitoringsToShow(_monitorings);
    }
    setShowData(nb);
  };

  // Actions de workflow possibles, calculées par le serveur (offres de
  // l'opérateur uniquement : l'API écarte toute autre offre).
  const { byId: workflowById, role: workflowRole, reload: reloadWorkflow, signature: workflowSignature } =
    useWorkflowActions(offers);
  // Page et nombre de lignes conservés quand le tableau est re-créé à
  // l'arrivée des actions (voir la clé `workflowSignature` du tableau).
  const offersPaging = useTablePaging(offersToShow?.length);
  const monitoringsPaging = useTablePaging(monitoringsToShow?.length);

  const refreshOffers = async () => {
    const _offers = await getOperatorOffers(user?.focalPoint?.operatorId);
    setOffers(Array.isArray(_offers) ? _offers : []);
    setOffersToShow(_offers);
    // L'onglet Monitoring liste des versions d'offres : il suit les mêmes actions.
    const _monitorings = await getAdminMonitorings(user?.focalPoint?.operatorId);
    setMonitoringData(Array.isArray(_monitorings) ? _monitorings : []);
    reloadWorkflow();
  };

  const handleViewOffer = (f) => {
    setOffer(f);
    setShowViewOfferDialog(true);
  };

  const handleInitMonitoring = (f) => {
    setOffer(f);
    setStep(2);
  };

  const handleEditOffer = (f) => {
    setOffer(f);
    setStep(3);
  };

  // Ouverture directe depuis la fiche de workflow : ?edit=<id> ou ?monitor=<id>.
  useEffect(() => {
    const editId = Number(router.query?.edit);
    const monitorId = Number(router.query?.monitor);
    const wanted = editId || monitorId;
    if (!wanted || !Array.isArray(offers)) return;
    const info = workflowById?.[wanted];
    if (!info) return;
    const target = offers.find((o) => o?.id === wanted);
    if (!target) return;
    if (editId && info.actions?.includes("EDIT")) handleEditOffer(target);
    if (monitorId && info.actions?.includes("MONITOR")) handleInitMonitoring(target);
    router.replace("/operator-list-offer", undefined, { shallow: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [offers, workflowById, router.query?.edit, router.query?.monitor]);

  const header = () => {
    return (
      <>
        <div className=" bg-light w-100">
          {/* Search and select START */}
          <div className=" d-flex justify-content-between">
            <div className="">
              <ExportButtons
                rows={showData == 1 ? offersToShow : monitoringsToShow}
                selection={selectedOffer}
                columns={OFFER_EXPORT_COLUMNS}
                fileName={showData == 1 ? "compartic_mes_offres" : "compartic_mes_monitorings"}
                title={showData == 1 ? "Mes offres" : "Mes offres en monitoring"}
              />
              <button
                className="btn  btn-danger mb-0"
                onClick={() => handleDeleteManyCountries()}
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
                  placeholder="Recherche par nom de l'offre..."
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

  /**
   * Actions CONTEXTUELLES (calculées par le serveur) : modification tant
   * qu'aucune décision n'est prise, soumission d'un brouillon (avec le code
   * reçu par e-mail), monitoring d'une offre validée, fiche de workflow.
   */
  const actionBodyTemplate = (rowData) => {
    if (showData != 1 && rowData?.monitoringKind !== "VERSION") {
      // Anciens monitorings (avant le workflow) : consultation seule.
      return (
        <RowActionBar
          ariaLabel={rowData?.title}
          view={{ onClick: () => handleViewOffer(rowData), title: "Aperçu" }}
          // Monitoring antérieur au workflow : suivi de l'offre concernée.
          circuit={rowData?.offerId ? { href: `/offer-workflow/${rowData.offerId}`, title: "Consulter le suivi de l'offre concernée", label: "Suivi", icon: "bi-clock-history" } : null}
        />
      );
    }
    return (
      <div style={{ padding: "4px 0" }}>
        <OfferWorkflowActions
          offer={rowData}
          info={workflowById?.[rowData?.id]}
          role={workflowRole || "FOCAL_POINT"}
          onView={handleViewOffer}
          onEdit={handleEditOffer}
          onMonitor={handleInitMonitoring}
          onChanged={refreshOffers}
        />
      </div>
    );
  };

  /** Type d'offre : de base ou promotionnelle. */
  const offerTypeBodyTemplate = (rowData) => <OfferTypeBadge offer={rowData} />;

  const codeTemplate = (rowData) => {
    return (
      <div>
        <small style={{ fontSize: 12 }}>{rowData.code} </small>
      </div>
    );
  };

  const dateNotifBodyTemplate = (rowData) => {
    return <div> {formatDateToFrench(rowData?.notifiDate)} </div>;
    <button
      className="btn btn-sm btn-primary btn-round me-2 mb-0"
      onClick={() => handleEditCountry(rowData)}
      disabled
    >
      <i className="bi bi-arrow-repeat"></i> Monitorer
    </button>;
  };
  const dateStartBodyTemplate = (rowData) => {
    return <div> {formatDateToFrench(rowData?.desiredDate)} </div>;
  };
  
    /** Onglet Monitoring : version et offre d'origine (lien vers son circuit). */
  const monitoringVersionTemplate = (rowData) => {
    if (rowData?.monitoringKind !== "VERSION") {
      return <span className="badge bg-light text-muted border">Ancien monitoring</span>;
    }
    return (
      <div>
        <span className="badge bg-primary-subtle text-primary">V{rowData?.version || 2}</span>
        {rowData?.sourceOffer && (
          <div>
            <Link href={`/offer-workflow/${rowData.sourceOffer.id}`} className="small" title="Suivi de la version d'origine">
              issue de {rowData.sourceOffer.code}
            </Link>
          </div>
        )}
      </div>
    );
  };

  const dateSaveTemplate = (rowData) => {
      return <div> {formatDateToFrench(rowData?.updatedAt)} </div>;
    };

  const statusBodyTemplate = (rowData) => {
    if (rowData?.status == "PENDING" || rowData?.status == null) {
      return <span className="text text-warning">En attente</span>;
    } else {
      return <span className="text text-success">Traitée</span>;
    }
  };

  /**
   * Décision de validation affichée en toutes lettres.
   *
   * Comme côté administrateur, l'ancienne version ne traitait que `DINIED` et
   * `ALLOW` : une offre SUSPENDED laissait la cellule VIDE, l'opérateur ne
   * pouvait donc pas voir que son offre avait été suspendue. La chaîne de
   * débogage « OOOOOO » était par ailleurs affichée.
   */
  const VALIDATION_LABEL = {
    ALLOW: { label: "Validée", cls: "bg-success-subtle text-success", icon: "bi-check-circle-fill" },
    DINIED: { label: "Refusée", cls: "bg-danger-subtle text-danger", icon: "bi-x-circle-fill" },
    SUSPENDED: { label: "Suspendue", cls: "bg-warning-subtle text-warning-emphasis", icon: "bi-pause-circle-fill" },
    PENDING: { label: "En attente", cls: "bg-secondary-subtle text-secondary", icon: "bi-hourglass-split" },
  };

  const validationBodyTemplate = (rowData) => {
    if (rowData?.workflowStatus) {
      return (
        <div className="text-center">
          {/* Opérateur : l'état de l'offre, sans le niveau de validation. */}
          <WorkflowStatusBadge offer={rowData} showLevel={false} published={workflowById?.[rowData?.id]?.published} />
        </div>
      );
    }
    const decision = rowData?.validation?.status;
    if (!decision) {
      return (
        <div className="text-center">
          <span className="badge bg-light text-muted border">Non statuée</span>
        </div>
      );
    }
    const v = VALIDATION_LABEL[decision] || VALIDATION_LABEL.PENDING;
    return (
      <div className="text-center">
        <span className={`badge ${v.cls}`}>
          <i className={`bi ${v.icon} me-1`}></i>
          {v.label}
        </span>
      </div>
    );
  };

  const operatorTemplate = (option) => {
    return (
      <div className="d-flex align-items-center">
        <img
          alt={option.name}
          src={imageUrl(option?.imagePath)}
          className={`mr-2 flag flag-${option.code.toLowerCase()}`}
          style={{ width: "20px" }}
        />{" "}
        <div>{option.name}</div>
      </div>
    );
  };

  const panelFooterTemplate = () => {
    const length = selectedOperators ? selectedOperators.length : 0;

    return (
      <div className="py-2 px-3 bg-light">
        <small>
          <b>{length}</b> opérateur(s){length > 1 ? "s" : ""} sélectionné(s).
        </small>
      </div>
    );
  };

  const filteredOffers = React.useMemo(() => applyOfferFilters(offers, offerFilters), [offers, offerFilters]);
  const filteredMonitorings = React.useMemo(
    () => applyOfferFilters(monitoringData, offerFilters),
    [monitoringData, offerFilters],
  );
  useEffect(() => {
    setOffersToShow(filteredOffers);
    setMonitoringsToShow(filteredMonitorings);
  }, [filteredOffers, filteredMonitorings]);

  return (
    <AdminMainContainerPage
      active="d-off"
      children={
        <>
          <div className="">
            <div className="">
              {step == 1 && (
                <>
                  <div>
                    <div
                      className="bg-dark p-2 mb-2 text-white d-flex justify-content-between"
                      style={{ fontSize: 20 }}
                    >
                      <div className=" align-content-center">
                        <em>
                          <b>
                            <i className="bi bi-arrow-right me-2"></i>{" "}
                            <i className="fa fa-star me-2 "></i>Gestion des
                            offres
                          </b>
                        </em>
                      </div>
                      <div>
                        <Link
                          href="/operator-create-offer"
                          className="btn btn-primary text-white me-2"
                          // onClick={() => handleAddArea()}
                        >
                          <i className="fa fa-plus me-2"></i> Ajouter une offre
                        </Link>
                      </div>
                    </div>
                  </div>

                  <hr className="m-1" />
                  <OfferFilterPanel
                    filters={offerFilters}
                    onChange={setOfferFilters}
                    operators={operators}
                    showOperators={false}
                    resultCount={(showData == 1 ? filteredOffers : filteredMonitorings)?.length ?? 0}
                    totalCount={(showData == 1 ? offers : monitoringData)?.length ?? 0}
                    statusCounts={countByStatus(showData == 1 ? offers : monitoringData, offerFilters)}
                    storageKey="filters-operator"
                  />
                  <hr className="m-1" />
                  <div>
                    <div className="d-flex justify-content-between">
                      {showData == 1 ? (
                        <>
                          <button
                            className="btn btn-light w-100 rounded-0 border border-2 border-primary"
                            onClick={() => handleShowData(1)}
                            style={{
                              backgroundColor: "#0AAD0A",
                              color: "white",
                            }}
                          >
                            Offres principales
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            className="btn btn-secondary w-100 rounded-0 border border-2"
                            onClick={() => handleShowData(1)}
                          >
                            Offres principales
                          </button>
                        </>
                      )}
                      {showData == 2 ? (
                        <>
                          <button
                            className="btn btn-light w-100 rounded-0"
                            onClick={() => handleShowData(2)}
                            style={{
                              backgroundColor: "#900AC7",
                              color: "white",
                              border: "2px solid #900AC7",
                            }}
                          >
                            Offres en monitoring
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            className="btn btn-secondary w-100 rounded-0 border border-2"
                            onClick={() => handleShowData(2)}
                          >
                            Offres en monitoring
                          </button>
                        </>
                      )}
                    </div>
                    <div>
                      {showData == 1 ? (
                        <>
                          <div
                            className="p-2 bg-white"
                            style={{
                              border: "3px solid #0AAD0A",
                            }}
                          >
                            {/* <div className="p-1 d-flex justify-content-center">
                            <img
                              src="images/base1.png"
                              style={{ height: 50 }}
                            />
                          </div> */}
                            {offersToShow == null ? (
                              <DataLoader label="Chargement de vos offres…" />
                            ) : offersToShow.length > 0 ? (
                              <>
                                {offersToShow ? (
                                  <>
                                    <DataTable
                                      key={workflowSignature}
                                      emptyMessage="Aucune offre ne correspond à vos critères."
                                      ref={dt}
                                      value={offersToShow}
                                      selectionMode={"checkbox"}
                                      selection={selectedOffer}
                                      onSelectionChange={(e) =>
                                        setSelectedOffer(e.value)
                                      }
                                      dataKey="code"
                                      paginator
                                      first={offersPaging.first}
                                      rows={offersPaging.rows}
                                      onPage={offersPaging.onPage}
                                      rowsPerPageOptions={[5, 10, 25, 50]}
                                      paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                                      currentPageReportTemplate="{first} à {last} sur {totalRecords}"
                                      globalFilter={globalFilter}
                                      header={header}
                                      // tableStyle={{ minWidth: '50rem' }}
                                      globalFilterFields={["title"]}
                                      stripedRows
                                      style={{
                                        padding: 10,
                                        backgroundColor: "white",
                                      }}
                                    >
                                      <Column
                                        selectionMode="multiple"
                                        exportable={false}
                                      ></Column>
                                      {/* <Column style={{ width: '25%' }} body={imageTemplate}></Column> */}
                                      {/* <Column field="code" header="Code" sortable style={{ padding: 10 }} /> */}
                                      <Column
                                        field="code"
                                        header="Code"
                                        body={codeTemplate}
                                        sortable
                                        style={{ padding: 10 }}
                                      />
                                      <Column
                                        field="title"
                                        header="Nom"
                                        sortable
                                        style={{ padding: 10 }}
                                      />
                                      <Column
                                        header="Type"
                                        style={{ padding: 10 }}
                                        body={offerTypeBodyTemplate}
                                      />
                                      {/* <Column  header="Date de notification" sortable style={{ padding: 10 }} body={dateNotifBodyTemplate} /> */}
                                      <Column
                                        field="updatedAt"
                                        header="Enregistrement"
                                        sortable
                                        style={{ padding: 10 }}
                                        body={dateSaveTemplate}
                                      />
                                      <Column
                                        field="desiredDate"
                                        header="Lancement souhaité"
                                        sortable
                                        style={{ padding: 10 }}
                                        body={dateStartBodyTemplate}
                                      />
                                      <Column
                                        field="status"
                                        header="Statut"
                                        sortable
                                        style={{ padding: 10 }}
                                        body={statusBodyTemplate}
                                      />
                                      <Column
                                        header="Validation"
                                        // sortable
                                        style={{ padding: 10 }}
                                        body={validationBodyTemplate}
                                      />
                                      {/* <Column field="description" header="Description" sortable style={{ padding: 10 }} /> */}
                                      {/* <Column body={yearTemplate} header="Année" sortable style={{ width: '25%' }} /> */}
                                      {/* <Column field="description" header="Description" sortable style={{ width: '25%' }} /> */}
                                      <Column
                                        style={{ width: 320, minWidth: 320 }}
                                        alignHeader={"right"}
                                        header="Actions"
                                        headerStyle={{ textAlign: "right" }}
                                        body={actionBodyTemplate}
                                      />
                                    </DataTable>
                                  </>
                                ) : (
                                  <>
                                    <div>
                                      <DefaultLoader color="black" />
                                    </div>
                                  </>
                                )}
                              </>
                            ) : (
                              <>
                                <div className="alert alert-warning text-center">
                                  <div className="">
                                    <i
                                      className="fa-solid fa-triangle-exclamation"
                                      style={{ fontSize: 40 }}
                                    ></i>
                                  </div>
                                  <div>Aucune Offre disponible.</div>
                                </div>
                              </>
                            )}
                          </div>
                        </>
                      ) : (
                        <>
                          <div
                            className=" p-2"
                            style={{
                              border: "3px solid #900AC7",
                            }}
                          >
                            {/* <div className="p-1 d-flex justify-content-center">
                            <img
                              src="images/monitoring2.png"
                              style={{ height: 50, width: 200 }}
                            />
                          </div> */}
                            {monitoringsToShow == null ? (
                              <DataLoader label="Chargement de vos offres en monitoring…" />
                            ) : monitoringsToShow.length > 0 ? (
                              <>
                                {offers?.length}
                                {offers && (
                                  <>
                                    <DataTable
                                      key={`m-${workflowSignature}`}
                                      emptyMessage="Aucune offre ne correspond à vos critères."
                                      ref={dt}
                                      value={monitoringsToShow}
                                      selectionMode={"checkbox"}
                                      selection={selectedOffer}
                                      onSelectionChange={(e) =>
                                        setSelectedOffer(e.value)
                                      }
                                      dataKey="code"
                                      paginator
                                      first={monitoringsPaging.first}
                                      rows={monitoringsPaging.rows}
                                      onPage={monitoringsPaging.onPage}
                                      rowsPerPageOptions={[5, 10, 25, 50]}
                                      paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                                      currentPageReportTemplate="{first} à {last} sur {totalRecords}"
                                      globalFilter={globalFilter}
                                      header={header}
                                      // tableStyle={{ minWidth: '50rem' }}
                                      globalFilterFields={["title"]}
                                      stripedRows
                                      size="small"
                                    >
                                      <Column
                                        selectionMode="multiple"
                                        exportable={false}
                                      ></Column>
                                      {/* <Column style={{ width: '25%' }} body={imageTemplate}></Column> */}
                                      {/* <Column field="code" header="Code" sortable style={{ padding: 10 }} /> */}
                                      <Column
                                        field="code"
                                        header="Code"
                                        body={codeTemplate}
                                        sortable
                                        style={{ padding: 10 }}
                                      />
                                      <Column
                                        field="title"
                                        header="Nom"
                                        sortable
                                        style={{ padding: 10 }}
                                      />
                                      <Column
                                        header="Version"
                                        style={{ padding: 10 }}
                                        body={monitoringVersionTemplate}
                                      />
                                      <Column
                                        header="Type"
                                        style={{ padding: 10 }}
                                        body={offerTypeBodyTemplate}
                                      />
                                      {/* <Column  header="Date de notification" sortable style={{ padding: 10 }} body={dateNotifBodyTemplate} /> */}
                                      <Column
                                        field="updatedAt"
                                        header="Enregistrement"
                                        sortable
                                        style={{ padding: 10 }}
                                        body={dateSaveTemplate}
                                      />
                                      <Column
                                        field="desiredDate"
                                        header="Lancement souhaité"
                                        sortable
                                        style={{ padding: 10 }}
                                        body={dateStartBodyTemplate}
                                      />
                                      <Column
                                        field="status"
                                        header="Statut"
                                        sortable
                                        style={{ padding: 10 }}
                                        body={statusBodyTemplate}
                                      />
                                      <Column
                                        header="Validation"
                                        // sortable
                                        style={{ padding: 10 }}
                                        body={validationBodyTemplate}
                                      />
                                      {/* <Column field="description" header="Description" sortable style={{ padding: 10 }} /> */}
                                      {/* <Column body={yearTemplate} header="Année" sortable style={{ width: '25%' }} /> */}
                                      {/* <Column field="description" header="Description" sortable style={{ width: '25%' }} /> */}
                                      <Column
                                        style={{ width: 320, minWidth: 320 }}
                                        alignHeader={"right"}
                                        header="Actions"
                                        headerStyle={{ textAlign: "right" }}
                                        body={actionBodyTemplate}
                                      />
                                    </DataTable>
                                  </>
                                )}
                              </>
                            ) : (
                              <>
                                <div className="alert alert-warning text-center">
                                  <div className="">
                                    <i
                                      className="fa-solid fa-triangle-exclamation"
                                      style={{ fontSize: 40 }}
                                    ></i>
                                  </div>
                                  <div>Aucune Offre disponible.</div>
                                </div>
                              </>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </>
              )}
              {/* Monitoring d'une offre : cette étape n'était pas rendue,
                  le bouton « Monitoring » menait à un écran vide. */}
              {step == 2 && (
                <>
                  <OperatorMonitoringPage
                    goTo={step}
                    setGoTo={setStep}
                    offers={offers}
                    setOffers={setOffers}
                    offer={offer}
                    setOffer={setOffer}
                    operators={operators}
                    services={services}
                    countries={countries}
                  />
                </>
              )}
              {step == 3 && (
                <>
                  <AdminEditOfferPage
                    goTo={step}
                    setGoTo={setStep}
                    offers={offers}
                    setOffers={setOffers}
                    offer={offer}
                    setOffer={setOffer}
                    operators={operators}
                    services={services}
                    countries={countries}
                  />
                </>
              )}
            </div>
          </div>
          <AdminOfferViewDialog
            visible={showViewOfferDialog}
            setVisible={setShowViewOfferDialog}
            offer={offer}
          />
        </>
      }
    />
  );
}
