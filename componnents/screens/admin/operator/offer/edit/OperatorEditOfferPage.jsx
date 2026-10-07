import { useDirtyTracker } from "@/services/tools/useDirtyTracker";
// BUGFIX: toastSuccess/toastWarning étaient utilisés sans être importés
// -> ReferenceError à chaque notification (enregistrement, validations de formulaire).
import {
  toastSuccess,
  toastWarning,
} from "@/componnents/notification/notification";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useAdmin } from "@/services/providers/AdminProvider";
import { DataTable } from "primereact/datatable";
import { editOfffer, getOperatorOffers, getUnknownParentOffer } from "@/services/api/offers/offersApiServices";
import { Column } from "primereact/column";
import { formatDateToFrench, transformOffer } from "@/services/tools/helper";
import Link from "next/link";
import { useWindowWidth } from "../OperatorCreateOfferPage";
import { getAdminOrganizations } from "@/services/api/admin/organizations/organizationsApiServices";
import { getAreas } from "@/services/api/areas/areasApiServices";
import DefaultLoader from "@/componnents/Loader/DefaultLoader";
import AddFormulaModal from "@/componnents/screens/admin/admin/offer/AddFormulaDialog";
import ConfirmRemoveForula from "@/componnents/modal/confirm/ConfirmRemoveForula";
import AddAccessModeModal from "../AddAccessModeModal";
import EditStep1 from "./steps/EditStep1";
import EditStep3 from "./steps/EditStep3";
import EditStep4 from "./steps/EditStep4";
import EditStep5 from "./steps/EditStep5";
import EditStep2 from "./steps/EditStep2";

export default function OperatorEditOfferPage({
  goTo,
  setGoTo,
  offers,
  setOffers,
  offer,
  setOffer,
  operators,
  services,
  countries,
}) {
  const { user } = useAdmin();
  const [areas, setAreas] = useState();

  const [editOffer, setEditOffer] = useState(null);

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

  // Offre repere « Offre Inconnu ». La liste `offers` de cette page est
  // PARTAGEE avec le tableau des offres et chargee par une route qui exclut
  // l offre repere : elle n etait donc jamais proposee comme parente, et une
  // offre deja rattachee a elle s ouvrait avec le champ vide. On la charge a
  // part et on l ajoute aux SEULES options de l etape 1   l ajouter a `offers`
  // la ferait apparaitre dans le tableau.
  const [unknownParent, setUnknownParent] = useState(null);
  const parentOfferSource = useMemo(() => {
    const list = Array.isArray(offers) ? offers : [];
    if (!unknownParent || list.some((o) => o?.code === unknownParent.code)) {
      return list;
    }
    return [unknownParent, ...list];
  }, [offers, unknownParent]);

  // Pre-selection de l offre parente existante : sans cela le champ repartait
  // toujours a vide et un simple enregistrement effacait le rattachement.
  useEffect(() => {
    if (selectOffer) return;
    const parentId = editOffer?.parentId ?? editOffer?.parentOffer?.id;
    if (!parentId || parentOfferSource.length === 0) return;
    // BUGFIX: la seconde condition (`o?.parent...code === "OF-000000000000000"`)
    // retenait la PREMIERE offre dont la parente est l offre repere, et non
    // l offre repere elle-meme : le mauvais parent s affichait, puis etait
    // enregistre. On compare desormais l identifiant seul.
    const found = parentOfferSource.find((o) => o?.id === parentId);
    if (found) setSelectOffer(found);
  }, [parentOfferSource, editOffer?.parentId, editOffer?.parentOffer?.id]);
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
    if (goTo == 3) {
      init();
    }
  }, [goTo]);

  useEffect(() => {
    if (editOffer) {
      // init()
    }
  }, [editOffer]);

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
      _offer = { ...editOffer };
      _offer["code"] = "OF-" + Date.now();
      setEditOffer(_offer);
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
    // Les synchronisations automatiques du chargement ne comptent
    // pas comme des modifications de l'utilisateur.
    beginInit();
    const _offers = await getOperatorOffers(user?.focalPoint?.operatorId);
    setUnknownParent(await getUnknownParentOffer());
    const _dests = await getAdminOrganizations();
    const _areas = await getAreas();

    const mOffer = transformOffer(offer);

    const _offer = { ...mOffer };
    _offer["code"] = "OF-" + Date.now();
    // _offer["billingType"] = editOffer?.billingType == "PREPAID" ? 1 : 2;
    // _offer["category"] = editOffer?.category == "MOBILE" ? 1 : 2;
    // _offer["notifDate"] = new Date(editOffer?.notifiDate);
    // _offer["startDate"] = new Date(editOffer?.desiredDate);
    setEditOffer(_offer);

    const _targetTab = { ...targetTab };
    if (mOffer?.target?.toLowerCase().includes("tous les clients")) {
      _targetTab["allCient"] = true;
    }
    if (mOffer?.category == "MOBILE") {
      if (mOffer?.target?.toLowerCase().includes("hypbride")) {
        _targetTab["mobile"] = true;
        // BUGFIX: suppression d'un `s;` isolé (variable non définie) qui
        // provoquait un ReferenceError -> crash au chargement de l'édition
        // d'une offre mobile ciblant les "hybrides".
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

    if (
      mOffer?.target?.toLowerCase().includes("abonnés fixe (hypbride)")
    ) {
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

    // BUGFIX: la zone était forcée à "NATIONALE" au chargement, écrasant la
    // zone réelle de l'offre. On la reprend depuis l'offre (la base renvoie
    // l'énuméré "NATIONAL" / "INTERNATIONAL" / "ROAMING").
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

    // setEditOffer(offerTest);
    // Préremplit les organisations et les pays déjà retenus pour cette offre
    // (sinon rien n'était coché à l'étape 3 pour une offre internationale).
    setSelectOrgans(mOffer?.area?.organizations || null);
    setSelectCountries(mOffer?.area?.countries || {});
    // setArea(offerTest?.area);

    setOffers(_offers);
    setAreas(_areas);
    setDestinations(_dests);
    setLoading(false);
    // Fin du chargement : les modifications suivantes sont celles de l'utilisateur
    endInit();
  };

  const handleNextStep = () => {
    if (step < 5) {
      if (step == 1) {
        if (editOffer?.operator) {
          if (editOffer?.notifDate) {
            if (editOffer?.startDate) {
              if (offerType == 1) {
                if (editOffer?.duration) {
                  if (editOffer?.title) {
                    if (editOffer?.promoType) {
                      if (editOffer?.billingType) {
                        if (editOffer?.category) {
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
                if (editOffer?.title) {
                  if (editOffer?.category) {
                    if (editOffer?.billingType) {
                      if (editOffer?.category) {
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
        if (editOffer?.formulas?.length > 0) {
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

  // BUGFIX: cette fonction partait de `editOffer` capture au rendu courant.
  // Quand deux effets ecrivaient dans le meme cycle (offerType, area,
  // accessModes, target...), le second repartait d une base perimee et
  // ECRASAIT l ecriture du premier. `offerType` etait le plus expose : il n est
  // ecrit qu une fois, au montage, et n est jamais reecrit ensuite   une fois
  // perdu, la declaration partait sans son type et l offre promotionnelle etait
  // enregistree comme une offre de base. La forme fonctionnelle de `set...`
  // repart toujours de l etat le plus recent.
  const onInputChange = (name, value) => {
    setEditOffer((prev) => ({ ...prev, [name]: value }));
    // Marque le formulaire comme modifié (ignoré pendant le chargement)
    markDirty();
  };

  const onInputChangeArea = (value) => {
    let _area = { ...area };
    _area["title"] = value;
    setArea(_area);
    // BUGFIX: `selectArea` doit suivre la zone choisie, sinon l'effet qui
    // recalcule `area` à partir de `selectArea` écrase aussitôt le choix.
    setSelectArea(value);
    markDirty?.();
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

    if (editOffer?.formulas) {
      search(editOffer?.formulas);
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
                      const _fs = editOffer?.formulas
                        ? editOffer?.formulas
                        : [];
                      _fs.push(formula);
                      setShowFormulaModal(false);
                      setFormula(null);
                      setIsEdit(false);
                      onInputChange("formulas", _fs);
                      toastSuccess("Formule ajoutée avec succès");
                    } else {
                      const _frms = addChildrenToFormula(
                        editOffer?.formulas,
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
                      const _fs = editOffer?.formulas
                        ? editOffer?.formulas
                        : [];
                      _fs.push(formula);
                      setShowFormulaModal(false);
                      setFormula(null);
                      setIsEdit(false);
                      onInputChange("formulas", _fs);
                      toastSuccess("Formule ajoutée avec succès");
                    } else {
                      const _frms = addChildrenToFormula(
                        editOffer?.formulas,
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
          const _fs = editOffer?.formulas
            ? editOffer?.formulas
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
            editOffer?.formulas,
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
    const _frms = updateFormula(editOffer?.formulas, parentKey);
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
    if (!editOffer?.formulas) return editOffer?.formulas;

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

    const _newForms = removeByKey(editOffer?.formulas);

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
    if (editOffer?.accessModes?.length > 0) {
      const _accs = editOffer?.accessModes;

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
    const _accs = editOffer?.accessModes?.filter(
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

    let _offer = { ...editOffer };
    _offer["document"] = e.target.files[0];

    setEditOffer(_offer);
    markDirty();

    setDocument(e.target.files[0]);
  };

  /**
   * Retire le document : le fichier fraîchement choisi comme celui déjà
   * associé à l'offre (l'aperçu et l'état de l'offre sont remis à zéro).
   */
  const onRemoveDocument = () => {
    const _offer = { ...editOffer };
    _offer["document"] = null;
    setEditOffer(_offer);
    setDocument(null);
    setPreviewDocument(undefined);
    markDirty();
  };

  const handleAddAccessModes = (value) => {
    const _val = { ...value };
    _val["key"] = Date.now();

    let _offer = { ...editOffer };
    if (_offer?.accessModes) {
      _offer["accessModes"] = [..._offer?.accessModes, _val];
    } else {
      _offer["accessModes"] = [_val];
    }

    setEditOffer(_offer);
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
    setEditOffer(_offer);
  };

  const handleInitImportFromExcel = () => {
    setShowExcelImportModal(true);
  };

  const handleInitOffer = () => {
    setEditOffer(null);
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

  const handleCancelEdit = () => {
    setGoTo(1);
  };

  const handleSubmitEditOffer = async () => {
    // Garde anti double-soumission
    if (loading) return;
    // Rien n'a été modifié : on prévient l'utilisateur sans rien soumettre.
    if (!isDirty) {
      toastWarning(
        "Aucune modification n'a été apportée à cette offre. Modifiez au moins un élément avant d'enregistrer.",
      );
      return;
    }
    setLoading(true);
    try {
      // BUGFIX: on appelait `createOfffer`, ce qui CRÉAIT UN DOUBLON à chaque
      // modification. `editOfffer` met réellement l'offre à jour (et le serveur
      // vérifie les droits : l'opérateur ne peut plus modifier une offre statuée).
      // `offerType` est repris de l etat de la page, seule source fiable : la
      // copie portee par l offre a deja ete perdue par le passe, et une
      // declaration promotionnelle partait alors sans son type.
      const _res = await editOfffer({ ...editOffer, offerType, id: editOffer?.id ?? offer?.id });
      if (_res?.error == false) {
        toastSuccess("Offre modifiée avec succès");
        // Rafraîchit la page pour recharger les données à jour (liste des
        // offres, formules, statut...). Court délai pour laisser le message
        // de succès s'afficher avant le rechargement.
        // NB : on ne passe pas par `setSuccess(true)` ici   cet état affiche
        // l'écran « Enregistrer une nouvelle offre », hérité du flux de
        // création et hors sujet après une modification.
        setTimeout(() => {
          if (typeof window !== "undefined") window.location.reload();
        }, 1200);
        return;
      } else {
        toastWarning(
          _res?.message ||
            "Une erreur s'est produite lors de la modification de l'offre",
        );
      }
    } catch (e) {
      toastWarning("Une erreur s'est produite lors de la modification de l'offre");
    } finally {
      // BUGFIX: loading restait bloqué à true en cas d'erreur.
      setLoading(false);
    }
  };

  return (
    <>
      <div className="d-md-flex justify-content-between bg-info align-items-center px-2 py-2">
        <div>
          <div className="text-white" style={{ fontSize: 20 }}>
            <em>
              <b>
                <i className="bi bi-arrow-right me-2"></i> <b>Modification</b> de d'offre : <span className="px-2 bg-warning text-dark">{offer.title}</span> 
              </b>
            </em>
          </div>
        </div>
        <div>
          <button
            className="btn1 p-1 bg-dark text-white"
            onClick={() => handleCancelEdit()}
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
                    <div className="step-title text-primary">
                      <b>
                        Etape 1 :
                        <span className="step-description text-primary">
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
                    <EditStep1
                      operators={operators}
                      offer={editOffer}
                      offers={parentOfferSource}
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
                    <EditStep2
                      step={step}
                      offer={editOffer}
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
                              editOffer={editOffer}
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
                    <EditStep3
                              area={area}
                              offer={editOffer}
                              selectArea={selectArea}
                              setSelectArea={setSelectArea}
                              onInputChangeArea={onInputChangeArea}
                              onInputChangeOrganizations={
                                onInputChangeOrganizations
                              }
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
                    <EditStep4
                              previewDocument={previewDocument}
                              document={document}
                              offerDocument={editOffer?.document}
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
                    <EditStep5
                              step={step}
                              offer={editOffer}
                              offerType={offerType}
                              previewDocument={previewDocument}
                              document={document}
                              services={services}
                              destinations={destinations}
                              selectOrgans={selectOrgans}
                              selectCountries={selectCountries}
                              handlePreviousStep={handlePreviousStep}
                              handleNextStep={handleNextStep}
                              handleSubmitEditOffer={handleSubmitEditOffer}
                            />
                  </>
                )}

                <div className="card-footer">
                  {step == 1 && <>
                  <div className="d-flex justify-content-end">
                        <button
                          className="btn btn-sm btn-info me-2"
                          id="nextBtn"
                          onClick={() => handleNextStep()}
                        >
                          Suivant <i className="fa fa-arrow-right "></i>
                        </button>

                  </div>
                  </>}

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
                    {step != 5  && step != 1 && (
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
                <b>Offre enregistrée avec succès.</b>
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
                  onClick={() => handleInitOffer()}
                >
                  <i className="fa fa-plus"></i> Enregistrer une nouvelle offre
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
