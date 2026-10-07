import { useDirtyTracker } from "@/services/tools/useDirtyTracker";
import React, { useEffect, useRef, useState } from "react";
import AdminMainContainerPage from "../../../AdminMainContainerPage";
import { useAdmin } from "@/services/providers/AdminProvider";
import { DataTable } from "primereact/datatable";
import {
  getAdminOffers,
  monitoringOfffer,
} from "@/services/api/offers/offersApiServices";
import { Column } from "primereact/column";
import { formatDateToFrench, transformOffer } from "@/services/tools/helper";
import AdminOfferViewDialog from "../view/AdminOfferViewDialog";
import Link from "next/link";
import MonitoringStep1 from "./step/MonitoringStep1";
import { useWindowWidth } from "../AdminCreateOfferPage";
import { getAdminOrganizations } from "@/services/api/admin/organizations/organizationsApiServices";
import { getAreas } from "@/services/api/areas/areasApiServices";
import DefaultLoader from "@/componnents/Loader/DefaultLoader";
import MonitoringStep2 from "./step/MonitoringStep2";
import AlertChangerOfferTypeDialog from "../AlertChangerOfferTypeDialog";
import AdminCreateOfferByExcelFile from "../create/AdminOfferByExcelFile";
import AddFormulaModal from "@/componnents/screens/admin/admin/offer/AddFormulaDialog";
import ConfirmRemoveForula from "@/componnents/modal/confirm/ConfirmRemoveForula";
import AddAccessModeModal from "../AddAccessModeModal";
import MonitoringStep3 from "./step/MonitoringStep3";
import MonitoringStep4 from "./step/MonitoringStep4";
import MonitoringStep5 from "./step/MonitoringStep5";
import {
  toastError,
  toastSuccess,
  toastWarning,
} from "@/componnents/notification/notification";

export default function AdminMonitoringPage({
  goTo,
  // Source des offres : injectable pour réutiliser cette page côté
  // OPÉRATEUR (offres restreintes à son périmètre). Par défaut : admin.
  fetchOffers,
  setGoTo,
  offers,
  setOffers,
  offer,
  setOffer,
  operators,
  services,
  countries,
}) {
  const [areas, setAreas] = useState();

  const [monitoringOffer, setMonitoringOffer] = useState(null);

  const [step, setStep] = useState(1);
  const [offerType, setOfferType] = useState(null);
  const [confirmType, setConfirmType] = useState(null);
  const [showModeAccesModal, setShowModeAccesModal] = useState(false);
  const [showFormulaModal, setShowFormulaModal] = useState(false);
  const [showAlertDialog, setShowAlertDialog] = useState(false);
  const [showConfirmRemoveFormula, setShowConfirmRemoveFormula] =
    useState(false);
  const [showExcelImportModal, setShowExcelImportModal] = useState(false);

  const [cRFormKey, setCRFormKey] = useState(null);
  const [cRformula, setCRformula] = useState(false);

  const [confirm, setConfirm] = useState(null);

  const [keyForm, setKeyForm] = useState(null);
  const [formula, setFormula] = useState(null);
  const [accessModes, setAccessModes] = useState(null);
  const [acMode, setAcMode] = useState(null);
  const [imgUrl, setImgUrl] = useState();

  const [document, setDocument] = useState(null);
  const [previewDocument, setPreviewDocument] = useState(null);

  const [organizations, setOrganizations] = useState(null);
  const [destinations, setDestinations] = useState(null);

  const screnneWidth = useWindowWidth();

  const [selectOffer, setSelectOffer] = useState(null);

  // Pre-selection de l offre parente existante : sans cela le champ repartait
  // toujours a vide et un simple enregistrement effacait le rattachement.
  useEffect(() => {
    if (selectOffer) return;
    const parentId = monitoringOffer?.parentId ?? monitoringOffer?.parentOffer?.id;
    if (!parentId || !Array.isArray(offers)) return;
    const found = offers.find((o) => o?.id === parentId);
    if (found) setSelectOffer(found);
  }, [offers, monitoringOffer?.parentId, monitoringOffer?.parentOffer?.id]);
  const [selectDestinations, setSelectDestinations] = useState(null);
  const [selectOganizations, setSelectOganizations] = useState(null);
  const [usedOrganizations, setUsedOrganizations] = useState();

  const [searchOffers, setSearchOffers] = useState(null);

  const [isEdit, setIsEdit] = useState(false);

  const [selectArea, setSelectArea] = useState("INTERNATIONALE");
  const [area, setArea] = useState();

  const [success, setSuccess] = useState(false);

  const [selectOrgans, setSelectOrgans] = useState(null);
  const [selectCountries, setSelectCountries] = useState([]);

  const [targetTab, setTargetTab] = useState(null);
  const [otherTarget, setOtherTarget] = useState(null);
  const [target, setTarget] = useState(null);

  const [loading, setLoading] = useState(true);

  // Suit si l'utilisateur a réellement modifié quelque chose
  const { isDirty, markDirty, beginInit, endInit } = useDirtyTracker();

  useEffect(() => {}, []);

  useEffect(() => {
    if (offerType) {
      onInputChange("offerType", offerType);
    }
  }, [offerType]);

  useEffect(() => {
    if (selectArea) {
      const _area = { ...area };
      _area["title"] = selectArea;
      setArea(_area);
    }
  }, [selectArea]);

  useEffect(() => {
    if (selectOrgans) {
      const _organizations = { ...selectOrgans };

      const _area = { ...area };
      _area["title"] = selectArea;
      _area["organizations"] = _organizations;
      setArea(_area);
    }
  }, [selectOrgans]);

  useEffect(() => {
    if (selectCountries) {
      const _area = { ...area };
      _area["title"] = selectArea;
      _area["countries"] = selectCountries;
      setArea(_area);
    }
  }, [selectCountries]);

  useEffect(() => {
    if (area) {
      onInputChange("area", area);
    }
  }, [area]);

  useEffect(() => {
    if (goTo == 2) {
      init();
    }
  }, [goTo]);

  useEffect(() => {
    if (monitoringOffer) {
      // init()
    }
  }, [monitoringOffer]);

  useEffect(() => {
    if (accessModes) {
      onInputChange("accessModes", accessModes);
    }
  }, [accessModes]);

  // PREVIEW FILE
  useEffect(() => {
    if (!document) {
      setPreviewDocument(undefined);
      return;
    }

    const objectUrl = URL.createObjectURL(document);
    setPreviewDocument(objectUrl);

    // free memory when ever this component is unmounted
    return () => URL.revokeObjectURL(objectUrl);
  }, [document]);

  useEffect(() => {
    if (target) {
      onInputChange("target", target);
    }
  }, [target]);

  useEffect(() => {
    if (success == true) {
      setTargetTab(null);

      setLoading(false);
      let _offer = null;
      _offer = { ...monitoringOffer };
      _offer["code"] = "OF-" + Date.now();
      setMonitoringOffer(_offer);
    } else {
      // setLoading(true);
    }
  }, [success]);

  // //SUPRESSION D'UNE FORMULZ
  // useEffect(() => {
  //     if(cRformula === true){
  //         handleRemoveFormula(cRFormKey);
  //     }
  // }, [cRformula]);

  const init = async () => {
    // Les synchronisations automatiques du chargement ne comptent pas
    // comme des modifications de l'utilisateur.
    beginInit();
    const _offers = await (fetchOffers ? fetchOffers() : getAdminOffers());
    const _dests = await getAdminOrganizations();
    const _areas = await getAreas();

    const mOffer = transformOffer(offer);

    const _offer = { ...mOffer };
    _offer["code"] = "OF-" + Date.now();
    // _offer["billingType"] = monitoringOffer?.billingType == "PREPAID" ? 1 : 2;
    // _offer["category"] = monitoringOffer?.category == "MOBILE" ? 1 : 2;
    // _offer["notifDate"] = new Date(monitoringOffer?.notifiDate);
    // _offer["startDate"] = new Date(monitoringOffer?.desiredDate);
    setMonitoringOffer(_offer);

    const _targetTab = { ...targetTab };
    if (mOffer?.target?.toLowerCase().includes("tous les clients")) {
      _targetTab["allCient"] = true;
    }
    if (mOffer?.category == "MOBILE") {
      if (mOffer?.target?.toLowerCase().includes("hypbride")) {
        _targetTab["mobile"] = true;
        // BUGFIX: `s;` (variable non définie) -> ReferenceError au chargement
        // du monitoring d'une offre mobile ciblant les "hybrides".
      } else {
        if (mOffer?.target?.toLowerCase().includes("prépayés")) {
          _targetTab["mbPrepay"] = true;
        }
        if (mOffer?.target?.toLowerCase().includes("postpayé")) {
          _targetTab["mbPostpay"] = true;
        }
      }
    }

    if (mOffer?.category == "FIXE") {
      _targetTab["fix"] = true;
      if (mOffer?.target?.toLowerCase().includes("hypbride")) {
        _targetTab["fixPrepay"] = true;
        _targetTab["fixPostpay"] = true;
      } else {
        if (mOffer?.target?.toLowerCase().includes("prépayé")) {
          _targetTab["fixPrepay"] = true;
        }
        if (mOffer?.target?.toLowerCase().includes("postpayé")) {
          _targetTab["fixPostpay"] = true;
        }
      }
    }

    if (mOffer?.target?.toLowerCase().includes("abonnés fixe (hypbride)")) {
    }
    if (mOffer?.target?.toLowerCase().includes("entreprise")) {
      _targetTab["company"] = true;
    }
    if (
      mOffer?.target
        ?.toLowerCase()
        .includes("abonnés titulaires d'un compte mobile money")
    ) {
      _targetTab["nbMoney"] = true;
    }
    if (
      mOffer?.target
        ?.toLowerCase()
        .includes("fournisseurs de contenus et start-up")
    ) {
      _targetTab["provider"] = true;
    }

    if (mOffer?.specialPromotion) {
      setOfferType(1);
    } else {
      setOfferType(2);
    }
    setTargetTab(_targetTab);
    setOtherTarget(mOffer?.target);

    // BUGFIX: la zone était forcée à "NATIONALE", écrasant celle de l'offre.
    const _dbZone = (mOffer?.area?.title || "").toString().toUpperCase();
    const _zone = _dbZone.startsWith("INTERNATIONAL")
      ? "INTERNATIONALE"
      : _dbZone.startsWith("ROAMING")
        ? "ROAMING"
        : "NATIONALE";
    let _area = { ...area };
    _area["title"] = _zone;
    setArea(_area);
    setSelectArea(_zone);
    // Préremplit organisations et pays déjà retenus
    setSelectOrgans(mOffer?.area?.organizations || null);
    setSelectCountries(mOffer?.area?.countries || {});

    // setMonitoringOffer(offerTest);
    // setSelectOrgans(offerTest?.area?.organizations);
    // setSelectCountries(offerTest?.area?.countries);
    // setArea(offerTest?.area);

    setOffers(_offers);
    setAreas(_areas);
    setDestinations(_dests);
    setLoading(false);
    // Fin du chargement : les changements suivants viennent de l'utilisateur
    endInit();
  };

  const handleNextStep = () => {
    if (step < 5) {
      if (step == 1) {
        if (monitoringOffer?.operator) {
          if (monitoringOffer?.notifDate) {
            if (monitoringOffer?.startDate) {
              if (offerType == 1) {
                if (monitoringOffer?.duration) {
                  if (monitoringOffer?.title) {
                    if (monitoringOffer?.promoType) {
                      if (monitoringOffer?.billingType) {
                        if (monitoringOffer?.category) {
                          setStep(step + 1);
                        } else {
                          toastWarning("Veuillez choisir une catégorie !");
                        }
                      } else {
                        toastWarning(
                          "Veuillez choisir un type de client !",
                        );
                      }
                    } else {
                      toastWarning("Veuillez choisir un type de promotion !");
                    }
                  } else {
                    toastWarning("Veuillez renseigner le titre de l'offre !");
                  }
                } else {
                  toastWarning(
                    "Veuillez renseigner la durée de la promotion !",
                  );
                }
              } else if (offerType == 2) {
                if (monitoringOffer?.title) {
                  if (monitoringOffer?.category) {
                    if (monitoringOffer?.billingType) {
                      if (monitoringOffer?.category) {
                        setStep(step + 1);
                      } else {
                        toastWarning("Veuillez choisir une catégorie !");
                      }
                    } else {
                      toastWarning("Veuillez choisir un type de client !");
                    }
                  } else {
                    toastWarning(
                      "Veuillez renseigner un type de client !",
                    );
                  }
                } else {
                  toastWarning("Veuillez renseigner le titre de l'offre !");
                }
              }
            } else {
              toastWarning("Veuillez renseigner une date de lancement !");
            }
          } else {
            toastWarning("Veuillez renseigner une date de notification !");
          }
        } else {
          toastWarning("Veuillez renseigner un opérateur !");
        }
      } else if (step == 2) {
        if (monitoringOffer?.formulas?.length > 0) {
          const _r = verifyEmptyFormula();
          if (!(_r?.length > 0)) {
            setStep(step + 1);
          } else {
            toastWarning(
              "Une formule sigul!ère doit avoir des sous formules !",
            );
          }
        } else {
          toastWarning("Ajouter une formule !");
        }
      } else {
        setStep(step + 1);
      }
    }
  };

  // BUGFIX: cette fonction partait de `monitoringOffer` capture au rendu courant.
  // Quand deux effets ecrivaient dans le meme cycle (offerType, area,
  // accessModes, target...), le second repartait d une base perimee et
  // ECRASAIT l ecriture du premier. `offerType` etait le plus expose : il n est
  // ecrit qu une fois, au montage, et n est jamais reecrit ensuite   une fois
  // perdu, la declaration partait sans son type et l offre promotionnelle etait
  // enregistree comme une offre de base. La forme fonctionnelle de `set...`
  // repart toujours de l etat le plus recent.
  const onInputChange = (name, value) => {
    setMonitoringOffer((prev) => ({ ...prev, [name]: value }));
    markDirty();
  };

  const onInputChangeArea = (value) => {
    let _area = { ...area };
    _area["title"] = value;
    setArea(_area);
    // BUGFIX: sans cette synchronisation, l'effet qui recalcule `area` depuis
    // `selectArea` écrasait aussitôt la zone choisie.
    setSelectArea(value);
    markDirty();
  };

  const onChoiceOrganizations = (name, id, value) => {
    const _selectOrgans = { ...selectOrgans };
    _selectOrgans[name] = { id: id, name: name, value: value };
    setSelectOrgans(_selectOrgans);
  };
  const onChoiceCountries = (name, parentId, id, value) => {
    const _selectCountries = { ...selectCountries };
    _selectCountries[name] = {
      parentId: parentId,
      id: id,
      value: value,
      name: name,
    };
    setSelectCountries(_selectCountries);
  };

  const onInputChangeOrganizations = (parent, name, value) => {
    let _sOrganizations = selectOganizations;

    const isInList = _sOrganizations.filter((item) => item?.parent == parent);
    if (isInList?.length > 0) {
      const newOgs = {
        ...data,
        name: data?.[name].map((item) =>
          item.name === name ? { ...item, value: value } : item,
        ),
      };

      setUsedOrganizations(newOgs);
    } else {
      const newOgs = {
        ...data,
        name: [...data?.[name], { name: nae, value: value }],
      };
      setUsedOrganizations(newOgs);
    }
  };

  const verifyEmptyFormula = () => {
    const result = [];

    function search(list) {
      for (const item of list) {
        // On récupère les clés réelles de l’objet
        const keys = Object.keys(item).filter(
          (k) => item[k] !== undefined && item[k] !== null,
        );

        // Vérifie si les seules clés sont "title" et/ou "description"
        const allowedKeys = ["key", "title", "description", "isDetails"];
        const hasOnlyAllowedKeys = keys.every((k) => allowedKeys.includes(k));

        if (hasOnlyAllowedKeys && keys.length > 0) {
          result.push(item);
        }

        // Si des enfants existent → on continue la recherche
        if (item.children && item.children.length > 0) {
          search(item.children);
        }
      }
    }

    if (monitoringOffer?.formulas) {
      search(monitoringOffer?.formulas);
    }

    return result;
  };

  const handlePreviousStep = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSubmitFormula = (parentKey) => {
    if (formula?.title) {
      if (formula?.isDetails) {
        if (formula?.settlement) {
          if (formula?.type === "price") {
            if (formula?.settlement?.price) {
              if (formula?.settlement?.validity) {
                if (formula?.settlement?.services) {
                  let _rReng = true;
                  const _items = formula?.settlement?.services;
                  for (let i = 0; i < services.length; i++) {
                    if (_items?.[services[i]?.title] === true) {
                      if (
                        !(
                          Number(_items?.["quantity" + services[i]?.title]) >= 0
                        )
                      ) {
                        toastWarning(
                          "Veuillez renseigner la quantité de " +
                            services[i]?.title,
                        );
                        _rReng = false;
                        break;
                      }
                      if (
                        !_items?.["comType" + services[i]?.title] &&
                        services[i]?.code != "SER-100"
                      ) {
                        toastWarning(
                          "Veuillez choisir un type de communication pour le service " +
                            services[i]?.title,
                        );
                        _rReng = false;
                        break;
                      }
                    }
                  }
                  if (_rReng === true) {
                    if (!parentKey) {
                      const _fs = monitoringOffer?.formulas
                        ? monitoringOffer?.formulas
                        : [];
                      _fs.push(formula);
                      setShowFormulaModal(false);
                      setFormula(null);
                      setIsEdit(false);
                      onInputChange("formulas", _fs);
                      toastSuccess("Formule ajoutée avec succès");
                    } else {
                      const _frms = addChildrenToFormula(
                        monitoringOffer?.formulas,
                        parentKey,
                        formula,
                      );
                      setShowFormulaModal(false);
                      setFormula(null);
                      setIsEdit(false);
                      onInputChange("formulas", _frms);
                      toastSuccess("Formule ajoutée avec succès");
                    }
                  } else {
                    return;
                  }
                } else {
                  toastWarning(
                    "Vueillez renseigner les services concernés par formule !",
                  );
                }
              } else {
                toastWarning(
                  "Vueillez renseigner le champs validité de la formule !",
                );
              }
            } else {
              toastWarning(
                "Vueillez renseigner le champs prix de la formule !",
              );
            }
          } else if (formula?.type === "bill") {
            if (formula?.settlement?.service) {
              if (formula?.settlement?.validity) {
                if (formula?.settlement?.quantity) {
                  if (formula?.settlement?.comType) {
                    if (!parentKey) {
                      const _fs = monitoringOffer?.formulas
                        ? monitoringOffer?.formulas
                        : [];
                      _fs.push(formula);
                      setShowFormulaModal(false);
                      setFormula(null);
                      setIsEdit(false);
                      onInputChange("formulas", _fs);
                      toastSuccess("Formule ajoutée avec succès");
                    } else {
                      const _frms = addChildrenToFormula(
                        monitoringOffer?.formulas,
                        parentKey,
                        formula,
                      );
                      setShowFormulaModal(false);
                      setFormula(null);
                      setIsEdit(false);
                      onInputChange("formulas", _frms);
                      toastSuccess("Formule ajoutée avec succès");
                    }
                  } else {
                    toastWarning(
                      "VVeuillez choisir un type de communication du service",
                    );
                  }
                } else {
                  toastWarning(
                    "Vueillez renseigner le champs quantité de la formule !",
                  );
                }
              } else {
                toastWarning(
                  "Vueillez renseigner le champs validité de la formule !",
                );
              }
            } else {
              toastWarning(
                "Vueillez renseigner le service concerné par la formule !",
              );
            }
          }
        } else {
          toastWarning("Vueillez renseigner les champs liés au règlement !");
        }
      } else {
        if (!parentKey) {
          const _fs = monitoringOffer?.formulas
            ? monitoringOffer?.formulas
            : [];
          _fs.push({
            key: formula?.key,
            isDetails: formula?.isDetails,
            title: formula?.title,
            description: formula?.description,
          });
          setShowFormulaModal(false);
          setFormula(null);
          setIsEdit(false);
          onInputChange("formulas", _fs);
        } else {
          const _frms = addChildrenToFormula(
            monitoringOffer?.formulas,
            parentKey,
            {
              key: formula?.key,
              title: formula?.title,
              description: formula?.description,
            },
          );
          setShowFormulaModal(false);
          setFormula(null);
          setIsEdit(false);
          onInputChange("formulas", _frms);
        }
      }
    } else {
      toastWarning("Vueillez renseigner le titre de la formule !");
    }
  };

  const handleEdithFormula = (parentKey) => {
    const _frms = updateFormula(monitoringOffer?.formulas, parentKey);
    onInputChange("formulas", _frms);
    setShowFormulaModal(false);
    setIsEdit(true);
    setFormula(null);
  };

  const addChildrenToFormula = (frms, parentKey, newForm) => {
    if (frms?.length > 0) {
      return frms.map((frm) => {
        if (frm.key === parentKey) {
          const updatedChildren = frm.children
            ? [...frm.children, newForm]
            : [newForm];
          return { ...frm, children: updatedChildren };
        }

        if (frm.children && frm.children.length > 0) {
          return {
            ...frm,
            children: addChildrenToFormula(frm.children, parentKey, newForm), // récursion
          };
        }

        return frm;
      });
    }
  };

  const initEdiitFormula = (f) => {
    setFormula(f);
    setShowFormulaModal(true);
    setIsEdit(true);
  };

  const updateFormula = (forms, key) => {
    return forms.map((form) => {
      if (form?.key === formula?.key) {
        return { ...form, ...formula };
      } else if (form?.children) {
        updateFormula(form.children, key);
      }
      return form;
    });
  };

  const handleAddNewForm = (k) => {
    setKeyForm(k);
    setShowFormulaModal(true);
  };

  const handleConfirmRemoveFomula = (key) => {
    setShowConfirmRemoveFormula(true);
    setCRFormKey(key);
  };

  const handleRemoveFormula = (key) => {
    if (!monitoringOffer?.formulas) return monitoringOffer?.formulas;

    // Fonction récursive pour supprimer dans les formules ou enfants
    function removeByKey(list) {
      return list
        .filter((item) => item.key !== key) // garde ceux qui ne correspondent pas
        .map((item) => {
          if (item.children && item.children.length > 0) {
            return {
              ...item,
              children: removeByKey(item.children), // parcours récursif
            };
          }
          return item;
        });
    }

    const _newForms = removeByKey(monitoringOffer?.formulas);

    setCRFormKey(null);
    setCRformula(false);
    setShowConfirmRemoveFormula(false);
    onInputChange("formulas", _newForms);
    toastSuccess("Formule supprimer avec succès !");
  };

  const handleEditAccessMode = (ac) => {
    setAcMode(ac);
    setShowModeAccesModal(true);
  };

  const handleEditAcMode = (ac) => {
    if (monitoringOffer?.accessModes?.length > 0) {
      const _accs = monitoringOffer?.accessModes;

      for (let i = 0; i < _accs.length; i++) {
        if (_accs[i].key === ac.key) {
          _accs[i] = ac;
          setAccessModes(_accs);
          setShowModeAccesModal(false);
          toastSuccess("Mode d'accès Modifié");
          break;
        }
      }
    }
  };

  const handleDeleteAcMode = (ac) => {
    const _accs = monitoringOffer?.accessModes?.filter(
      (item) => item.key != ac.key,
    );
    setAccessModes(_accs);
    toastSuccess("Mode d'accès supprimer");
  };

  const onSelectDocument = (e) => {
    if (!e.target.files || e.target.files.length === 0) {
      setDocument(undefined);
      return;
    }

    let _offer = { ...monitoringOffer };
    _offer["document"] = e.target.files[0];

    setMonitoringOffer(_offer);
    markDirty();

    setDocument(e.target.files[0]);
  };

  /**
   * Retire le document : le fichier fraîchement choisi comme celui déjà
   * associé (aperçu et état remis à zéro).
   */
  const onRemoveDocument = () => {
    const _offer = { ...monitoringOffer };
    _offer["document"] = null;
    setMonitoringOffer(_offer);
    setDocument(null);
    setPreviewDocument(undefined);
    markDirty();
  };

  const handleAddAccessModes = (value) => {
    const _val = { ...value };
    _val["key"] = Date.now();

    let _offer = { ...monitoringOffer };
    if (_offer?.accessModes) {
      _offer["accessModes"] = [..._offer?.accessModes, _val];
    } else {
      _offer["accessModes"] = [_val];
    }

    setMonitoringOffer(_offer);
    markDirty();
    setShowModeAccesModal(false);
  };

  const handleChangeOfferType = (type) => {
    setShowAlertDialog(true);
    setConfirmType(type);
  };

  const handleConfirm = () => {
    markDirty();
    setOfferType(confirmType);
    setConfirm(false);
    setStep(1);
    setShowAlertDialog(false);
    setTargetTab(null);

    const __offer = null;
    const _offer = { ...__offer };
    _offer["code"] = "OF-" + Date.now();
    setMonitoringOffer(_offer);
  };

  const handleInitImportFromExcel = () => {
    setShowExcelImportModal(true);
  };

  const handleInitOffer = () => {
    setMonitoringOffer(null);
    setDocument(null);
    setPreviewDocument(null);
    setAccessModes(null);
    setAcMode(null);
    setArea(null);
    setStep(1);
    // BUGFIX: `Offer` n est defini nulle part dans ce fichier : l appel levait
    // un ReferenceError au clic sur « Enregistrer une nouvelle offre ». On
    // revient a l etat initial du composant.
    setOfferType(null);
    setSuccess(false);
  };

  const handleCancelMonitoring = () => {
    setOffer(null);
    setGoTo(1);
  };

  const handleSubmitMonitoringOffer = async () => {
    // Garde anti double-soumission
    if (loading) return;

    // BUGFIX: l'ancienne garde comparait `offer` (objet brut de l'API) a
    // `monitoringOffer` (objet transforme), champ par champ et avec `==`
    // sur des tableaux/objets : la comparaison n'avait aucun sens et
    // affichait « Erreur lors de l'enregistrement » alors qu'il s'agissait
    // d'une absence de modification. On s'appuie desormais sur le suivi des
    // modifications reellement effectuees par l'utilisateur.
    if (!isDirty) {
      toastWarning(
        "Aucune modification n'a été apportée. Modifiez au moins un élément avant d'enregistrer le monitoring.",
      );
      return;
    }

    setLoading(true);
    try {
      const _offerMonitoring = { ...monitoringOffer };
      _offerMonitoring["offerCode"] = offer?.code;
      // Offre validée d'origine : le serveur en crée une nouvelle version.
      _offerMonitoring["sourceOfferId"] = offer?.id;

      const _res = await monitoringOfffer(_offerMonitoring);

      if (_res?.error == false) {
        toastSuccess(
          `Monitoring enregistré : nouvelle version ${_res?.offer?.code || ""} soumise à validation, l'ancienne version est désactivée.`,
        );
        // Recharge les données à jour (liste des offres, suivi, statut...)
        setTimeout(() => {
          if (typeof window !== "undefined") window.location.reload();
        }, 1200);
        return;
      }
      toastWarning(
        _res?.message ||
          "Une erreur s'est produite lors de l'enregistrement du monitoring",
      );
    } catch (e) {
      toastWarning(
        "Une erreur s'est produite lors de l'enregistrement du monitoring",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="d-md-flex justify-content-between bg-dark align-items-center px-2 py-2">
        <div>
          <div className="text-white" style={{ fontSize: 20 }}>
            <em>
              <b>
                <i className="bi bi-arrow-right me-2"></i> Monitoring d'offre :{" "}
                <span className="px-2 bg-warning text-dark">{offer.title}</span>
              </b>
            </em>{" "}
          </div>
        </div>
        <div>
          <button
            className="btn1 p-1 bg-danger text-white"
            onClick={() => handleCancelMonitoring()}
          >
            <i className="fa fa-xmark me-2"></i> Abandonner
          </button>
        </div>
      </div>
      {!success ? (
        <>
          <div className="">
            {offerType == 1 && (
              <>
                <div className="w-100">
                  <button
                    className="w-100 btn-tab bg-white border text-primary w-100 rounded-0 p-5"
                    style={{ fontSize: 20 }}
                    onClick={() => handleChangeOfferType(2)}
                  >
                    <b>OFFRE PROMOTIONNELLE</b>
                  </button>
                </div>
              </>
            )}
            {offerType == 2 && (
              <>
                <div className="w-100">
                  <button
                    className="w-100 btn-tab bg-white border p-2 text-primary rounded-0 p-5"
                    style={{ fontSize: 20 }}
                  >
                    <b>OFFRE DE BASE</b>
                  </button>
                </div>
              </>
            )}
          </div>

          <div className="w-100 d-flex justify-content-center pt-5 bg-white">
            <div className="steps-horizontal d-flex justify-content-center">
              <div
                className={
                  step == 1
                    ? "step-horizontal active"
                    : "step-horizontal complete"
                }
              >
                <div className="step-icon">
                  <i className="fas fa-info"></i>
                </div>
                {step == 1 ? (
                  <>
                    <div className="step-title text-primary ">
                      <b>
                        Etape 1 :
                        <span className="step-description text-primary ">
                          Informations générales
                        </span>
                      </b>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="step-title">
                      Etape 1 :
                      <span className="step-description">
                        Informations générales
                      </span>
                    </div>
                  </>
                )}
              </div>
              <div
                className={
                  step == 2
                    ? "step-horizontal active"
                    : step > 2
                      ? "step-horizontal complete"
                      : "step-horizontal"
                }
              >
                <div className="step-icon">
                  <i className="fa-solid fa-briefcase"></i>
                </div>
                {step == 2 ? (
                  <>
                    <div className="step-title text-primary">
                      <b>
                        Etape 2 :
                        <span className="step-description text-primary">
                          Formules
                        </span>
                      </b>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="step-title">
                      Etape 2 :
                      <span className="step-description">Formules</span>
                    </div>
                  </>
                )}
              </div>
              <div
                className={
                  step == 3
                    ? "step-horizontal active"
                    : step > 3
                      ? "step-horizontal complete"
                      : "step-horizontal"
                }
              >
                <div className="step-icon">
                  <i className="fa-solid fa-key"></i>
                </div>
                {step == 3 ? (
                  <>
                    <div className="step-title text-primary">
                      <b>
                        Etape 3 :
                        <span className="step-description text-primary">
                          Mode d'accès
                        </span>
                      </b>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="step-title">
                      Etape 3 :
                      <span className="step-description">Mode d'accès</span>
                    </div>
                  </>
                )}
              </div>
              <div
                className={
                  step == 4
                    ? "step-horizontal active"
                    : step > 4
                      ? "step-horizontal complete"
                      : "step-horizontal"
                }
              >
                <div className="step-icon">
                  <i className="fa-solid fa-folder-open"></i>
                </div>
                {step == 4 ? (
                  <>
                    <div className="step-title text-primary">
                      <b>
                        Etape 4 :
                        <span className="step-description text-primary">
                          Documentation
                        </span>
                      </b>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="step-title">
                      Etape 4 :
                      <span className="step-description">Documentation</span>
                    </div>
                  </>
                )}
              </div>
              <div
                className={
                  step == 5 ? "step-horizontal active" : "step-horizontal"
                }
              >
                <div className="step-icon">
                  <i className="fa-solid fa-check-double"></i>
                </div>
                {step == 5 ? (
                  <>
                    <div className="step-title text-primary">
                      <b>
                        Etape 5 :
                        <span className="step-description text-primary">
                          Confirmation
                        </span>
                      </b>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="step-title">
                      Etape 5 :
                      <span className="step-description">Confirmation</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
          {loading ? (
            <>
              <DefaultLoader />
            </>
          ) : (
            <>
              <div className="p-2">
                {step == 1 && (
                  <>
                    <MonitoringStep1
                      operators={operators}
                      offer={monitoringOffer}
                      offers={offers}
                      onInputChange={onInputChange}
                      setSelectOffer={setSelectOffer}
                      setSearchOffers={setSearchOffers}
                      searchOffers={searchOffers}
                      offerType={offerType}
                      handlePreviousStep={handlePreviousStep}
                      handleNextStep={handleNextStep}
                      target={target}
                      setTarget={setTarget}
                      selectOffer={selectOffer}
                      targetTab={targetTab}
                      setTargetTab={setTargetTab}
                      otherTarget={otherTarget}
                      setOtherTarget={setOtherTarget}
                      step={step}
                    />
                  </>
                )}
                {step == 2 && (
                  <>
                    <MonitoringStep2
                      step={step}
                      offer={monitoringOffer}
                      setShowFormulaModal={setShowFormulaModal}
                      services={services}
                      handleAddNewForm={handleAddNewForm}
                      initEdiitFormula={initEdiitFormula}
                      handleConfirmRemoveFomula={handleConfirmRemoveFomula}
                      handlePreviousStep={handlePreviousStep}
                      handleNextStep={handleNextStep}
                    />

                    <AddFormulaModal
                      visible={showFormulaModal}
                      setVisible={setShowFormulaModal}
                      formula={formula}
                      setFormula={setFormula}
                      services={services}
                      handleSubmitFormula={handleSubmitFormula}
                      keyForm={keyForm}
                      setKeyForm={setKeyForm}
                      handleEdithFormula={handleEdithFormula}
                      isEdit={isEdit}
                      setIsEdit={setIsEdit}
                      monitoringOffer={monitoringOffer}
                    />

                    <ConfirmRemoveForula
                      visible={showConfirmRemoveFormula}
                      setVisible={setShowConfirmRemoveFormula}
                      handleRemoveFormula={handleRemoveFormula}
                      cRFormKey={cRFormKey}
                    />
                  </>
                )}
                {step == 3 && (
                  <>
                    <MonitoringStep3
                      area={area}
                      offer={monitoringOffer}
                      selectArea={selectArea}
                      setSelectArea={setSelectArea}
                      onInputChangeArea={onInputChangeArea}
                      onInputChangeOrganizations={onInputChangeOrganizations}
                      onChoiceOrganizations={onChoiceOrganizations}
                      onChoiceCountries={onChoiceCountries}
                      selectOrgans={selectOrgans}
                      selectCountries={selectCountries}
                      destinations={destinations}
                      organizations={organizations}
                      setShowModeAccesModal={setShowModeAccesModal}
                      handleEditAccessMode={handleEditAccessMode}
                      handleDeleteAcMode={handleDeleteAcMode}
                      handlePreviousStep={handlePreviousStep}
                      handleNextStep={handleNextStep}
                    />
                    <AddAccessModeModal
                      display={showModeAccesModal}
                      setDisplay={setShowModeAccesModal}
                      onInputChange={onInputChange}
                      handleAddAccessModes={handleAddAccessModes}
                      accessMode={acMode}
                      setAccessMode={setAcMode}
                      handleEditAccessMode={handleEditAcMode}
                    />
                  </>
                )}
                {step == 4 && (
                  <>
                    <MonitoringStep4
                      previewDocument={previewDocument}
                      document={document}
                      offerDocument={monitoringOffer?.document}
                      onSelectDocument={onSelectDocument}
                      onRemoveDocument={onRemoveDocument}
                      handlePreviousStep={handlePreviousStep}
                      handleNextStep={handleNextStep}
                      step={step}
                    />
                  </>
                )}
                {step == 5 && (
                  <>
                    <MonitoringStep5
                      step={step}
                      offer={monitoringOffer}
                      offerType={offerType}
                      previewDocument={previewDocument}
                      document={document}
                      services={services}
                      destinations={destinations}
                      selectOrgans={selectOrgans}
                      selectCountries={selectCountries}
                      handlePreviousStep={handlePreviousStep}
                      handleNextStep={handleNextStep}
                      handleSubmitMonitoringOffer={handleSubmitMonitoringOffer}
                    />
                  </>
                )}

                <div className="card-footer">
                  {step == 1 && (
                    <>
                      <div className="d-flex justify-content-end">
                        <button
                          className="btn btn-sm btn-info me-2"
                          id="nextBtn"
                          onClick={() => handleNextStep()}
                        >
                          Suivant <i className="fa fa-arrow-right "></i>
                        </button>
                      </div>
                    </>
                  )}

                  <div className="d-flex justify-content-between">
                    {step != 1 && (
                      <>
                        <button
                          className="btn btn-sm btn-dark me-2"
                          id="prevBtn"
                          onClick={() => handlePreviousStep()}
                        >
                          <i className="fa fa-arrow-left me-2"></i> Précédent
                        </button>
                      </>
                    )}
                    {step != 5 && step != 1 && (
                      <>
                        <button
                          className="btn btn-sm btn-info me-2"
                          id="nextBtn"
                          onClick={() => handleNextStep()}
                        >
                          Suivant <i className="fa fa-arrow-right "></i>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </>
      ) : (
        <>
          <hr />
          <div className="d-flex justify-content-center pt-5">
            <div>
              <div className="text-center">
                <b>Monitoring réalisé avec succès.</b>
              </div>
              <div>
                <img
                  src="/images/success.png"
                  alt=""
                  style={{ height: 250, width: 250 }}
                />
              </div>
              <div>
                <button
                  className="btn btn-dark"
                  onClick={() => handleCancelMonitoring()}
                >
                  <i className="fa fa-list"></i> Aller à la gestion des offres
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* <AlertChangerOfferTypeDialog
                visible={showAlertDialog}
                setVisible={setShowAlertDialog}
                handleConfirm={handleConfirm}
              />

              <AdminCreateOfferByExcelFile
                isOpen={showExcelImportModal}
                setIsOpen={setShowExcelImportModal}
              /> */}
    </>
  );
}
