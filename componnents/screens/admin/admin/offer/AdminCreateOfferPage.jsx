"use client";
import React, { useEffect, useRef, useState } from "react";
import AdminMainContainerPage from "../../AdminMainContainerPage";
import Link from "next/link";
import { getOperators } from "@/services/api/client/operators/operatorsApiServices";
import Image from "next/image";
import AddFormulaModal from "@/componnents/screens/admin/admin/offer/AddFormulaDialog";
import { Taviraj } from "next/font/google";
import {
  toastSuccess,
  toastWarning,
} from "@/componnents/notification/notification";
import AddAccessModeModal from "./AddAccessModeModal";
import AlertChangerOfferTypeDialog from "./AlertChangerOfferTypeDialog";
import { getAreas } from "@/services/api/areas/areasApiServices";
import ConfirmRemoveForula from "@/componnents/modal/confirm/ConfirmRemoveForula";
import {
  createOfffer,
  getAdminOffers,
  getAdminOffersWithUnknow,
} from "@/services/api/offers/offersApiServices";
import { useAdmin } from "@/services/providers/AdminProvider";
import OfferExcelImport from "@/componnents/offers/import/OfferExcelImport";
import CreateStep1 from "./create/steps/CreateStep1";
import CreateStep5 from "./create/steps/CreateStep5";
import CreateStep4 from "./create/steps/CreateStep4";
import CreateStep2 from "./create/steps/CreateStep2";
import DefaultLoader from "@/componnents/Loader/DefaultLoader";
import CreateStep3 from "./create/steps/CreateStep3";
import { getAdminOrganizations } from "@/services/api/admin/organizations/organizationsApiServices";

const offerTest = {
  code: "OF-" + Date.now(),
  operator: {
    id: "3",
    code: "OPE-011",
    name: "MOOV",
    color: "#005CAA",
    imagePath: "1730988968100_blob.png",
    status: "ENABLE",
    description:
      "Opérateur de télécommunications, filiale du groupe Maroc Télécom lancé en côte d’ivoire depuis 2006 sous le nom de Etisalat",
    createdAt: "2025-10-14T10:07:29.173Z",
    updatedAt: "2025-10-14T10:07:29.173Z",
  },
  notifDate: "2025-10-21",
  startDate: "2025-10-23",
  duration: "20",
  title: "GBAIRAI EST CHICC",
  target:
    "<p>Lorem, ipsum dolor sit amet consectetur adipisicing elit. Commodi dolorem ab aliquid ducimus. Adipisci, dicta. Temporibus, ipsum repellat omnis reprehenderit ullam tempora aliquam, expedita, dolor maxime exercitationem assumenda mollitia quidem!</p>",
  promoType: "SPECIAL",
  type: "1",
  billingType: "1",
  category: "1",
  link: "Lien test",
  description:
    "<p>Lorem, ipsum dolor sit amet consectetur adipisicing elit. Nulla explicabo a officia animi tempora fuga ea minima distinctio nihil facilis, tempore cupiditate quae dolorum maxime debitis voluptas culpa. Nobis, beatae!</p>",
  formulas: [
    {
      isDetails: true,
      type: "price",
      key: 1760504350661,
      title: "Test",
      description:
        "<p>Lorem, ipsum dolor sit amet consectetur adipisicing elit. Nulla explicabo a officia animi tempora fuga ea minima distinctio nihil facilis, tempore cupiditate quae dolorum maxime debitis voluptas culpa. Nobis, beatae!</p>",
      settlement: {
        price: "45",
        validity: "10",
        services: {
          VOIX: true,
          quantityVOIX: "20",
          bStepVOIX: "3",
          comTypeVOIX: "onNet",
        },
      },
    },
    {
      type: "price",
      key: 1761497615976,
      isDetails: true,
      title: "Formules test",
      settlement: {
        price: "123",
        validity: "10",
        services: {
          VOIX: true,
          quantityVOIX: "10",
          bStepVOIX: "23",
          comTypeVOIX: "allNet",
          SMS: true,
          quantitySMS: "120",
          bStepSMS: "4",
          comTypeSMS: "onNet",
          DATA: true,
          quantityDATA: "1024",
          bStepDATA: "10",
        },
      },
      advantages: [
        {
          name: "Facebook illimité",
          description: "<p>Un test</p>",
          key: 1761608701721,
        },
        {
          description: "<p>Un nouveau test</p>",
          name: "Tiktok illimié",
          key: 1761608715488,
        },
      ],
    },
    {
      type: "bill",
      key: 1761613554297,
      title: "Formule en test",
      isDetails: true,
      settlement: {
        service: "VOIX",
        comType: "onNet",
        quantity: "10",
        validity: "20",
        rateApplied: "2",
        billingStep: "10",
      },
    },
  ],
  area: {
    title: "INTERNATIONALE",
    countries: {
      Bolivie: {
        parentId: 11,
        id: 25,
        value: true,
        name: "Bolivie",
      },
      Cuba: {
        parentId: 11,
        id: 49,
        value: true,
        name: "Cuba",
      },
      Nicaragua: {
        parentId: 11,
        id: 126,
        value: true,
        name: "Nicaragua",
      },
      Liechtenstein: {
        parentId: 30,
        id: 103,
        value: true,
        name: "Liechtenstein",
      },
      Norvège: {
        parentId: 30,
        id: 129,
        value: true,
        name: "Norvège",
      },
    },
    organizations: {
      ALBA: {
        id: 11,
        name: "ALBA",
        value: true,
      },
      AELE: {
        id: 30,
        name: "AELE",
        value: true,
      },
    },
  },
  accessModes: [
    {
      content:
        "<p>Lorem, ipsum dolor sit amet consectetur adipisicing elit. Commodi dolorem ab aliquid ducimus. Adipisci, dicta. Temporibus, ipsum repellat omnis reprehenderit ullam tempora aliquam, expedita, dolor maxime exercitationem assumenda mollitia quidem!</p>",
      key: 1760505609909,
    },
    {
      content: "<p>Un tes de mod'accès!</p>",
      key: 1760505609909,
    },
  ],
};

export const useWindowWidth = () => {
  const [windowWidth, setWindowWidth] = useState(0);

  useEffect(() => {
    // Ensure window object is available (client-side)
    if (typeof window !== "undefined") {
      setWindowWidth(window.innerWidth);

      const handleResize = () => {
        setWindowWidth(window.innerWidth);
      };

      window.addEventListener("resize", handleResize);

      // Cleanup function to remove event listener
      return () => {
        window.removeEventListener("resize", handleResize);
      };
    }
  }, []); // Empty dependency array ensures this runs once on mount

  return windowWidth;
};

export default function AdminCreateOfferPage() {
  const { operators, services, countries } = useAdmin();

  const [areas, setAreas] = useState();

  const [step, setStep] = useState(1);
  const [offerType, setOfferType] = useState(1);
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

  const [offers, setOffers] = useState(null);
  const [offer, setOffer] = useState(null);
  const [accessModes, setAccessModes] = useState(null);
  const [acMode, setAcMode] = useState(null);
  const [imgUrl, setImgUrl] = useState();

  const [document, setDocument] = useState(null);
  const [previewDocument, setPreviewDocument] = useState(null);

  const [organizations, setOrganizations] = useState(null);
  const [destinations, setDestinations] = useState(null);

  const screnneWidth = useWindowWidth();

  const [selectOffer, setSelectOffer] = useState(null);
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

  useEffect(() => {
    init();
  }, []);

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
    if (offer) {
    }
  }, [offer]);

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
      _offer = { ...offer };
      _offer["code"] = "OF-" + Date.now();
      setOffer(_offer);
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
    const _offers = await getAdminOffersWithUnknow();
    const _dests = await getAdminOrganizations();
    const _areas = await getAreas();

    const _offer = { ...offer };
    _offer["code"] = "OF-" + Date.now();
    setOffer(_offer);

    let _area = { ...area };
    _area["title"] = "NATIONALE";
    setArea(_area);

    setOffer(offerTest);
    // setSelectOrgans(offerTest?.area?.organizations);
    // setSelectCountries(offerTest?.area?.countries);
    // setArea(offerTest?.area);

    setOffers(_offers);
    setAreas(_areas);
    setDestinations(_dests);
    setLoading(false);
  };

  const handleNextStep = () => {
    if (step < 5) {
      if (step == 1) {
        if (offer?.operator) {
          if (offer?.notifDate) {
            if (offer?.startDate) {
              if (offerType == 1) {
                if (offer?.duration) {
                  if (offer?.title) {
                    if (offer?.promoType) {
                      if (offer?.billingType) {
                        if (offer?.category) {
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
                if (offer?.title) {
                  if (offer?.category) {
                    if (offer?.billingType) {
                      if (offer?.category) {
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
        if (offer?.formulas?.length > 0) {
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

  // BUGFIX: cette fonction partait de `offer` capture au rendu courant.
  // Quand deux effets ecrivaient dans le meme cycle (offerType, area,
  // accessModes, target...), le second repartait d une base perimee et
  // ECRASAIT l ecriture du premier. `offerType` etait le plus expose : il n est
  // ecrit qu une fois, au montage, et n est jamais reecrit ensuite   une fois
  // perdu, la declaration partait sans son type et l offre promotionnelle etait
  // enregistree comme une offre de base. La forme fonctionnelle de `set...`
  // repart toujours de l etat le plus recent.
  const onInputChange = (name, value) => {
    setOffer((prev) => ({ ...prev, [name]: value }));
  };

  const onInputChangeArea = (value) => {
    let _area = { ...area };
    _area["title"] = value;
    setArea(_area);
    // BUGFIX: `selectArea` doit suivre la zone choisie, sinon l'effet qui
    // recalcule `area` à partir de `selectArea` écrase aussitôt le choix.
    setSelectArea(value);
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

    if (offer?.formulas) {
      search(offer?.formulas);
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
                      const _fs = offer?.formulas ? offer?.formulas : [];
                      _fs.push(formula);
                      setShowFormulaModal(false);
                      setFormula(null);
                      setIsEdit(false);
                      onInputChange("formulas", _fs);
                      toastSuccess("Formule ajoutée avec succès");
                    } else {
                      const _frms = addChildrenToFormula(
                        offer?.formulas,
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
                      const _fs = offer?.formulas ? offer?.formulas : [];
                      _fs.push(formula);
                      setShowFormulaModal(false);
                      setFormula(null);
                      setIsEdit(false);
                      onInputChange("formulas", _fs);
                      toastSuccess("Formule ajoutée avec succès");
                    } else {
                      const _frms = addChildrenToFormula(
                        offer?.formulas,
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
          const _fs = offer?.formulas ? offer?.formulas : [];
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
          const _frms = addChildrenToFormula(offer?.formulas, parentKey, {
            key: formula?.key,
            title: formula?.title,
            description: formula?.description,
          });
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
    const _frms = updateFormula(offer?.formulas, parentKey);
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
    if (!offer?.formulas) return offer?.formulas;

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

    const _newForms = removeByKey(offer?.formulas);

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
    if (offer?.accessModes?.length > 0) {
      const _accs = offer?.accessModes;

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
    const _accs = offer?.accessModes?.filter((item) => item.key != ac.key);
    setAccessModes(_accs);
    toastSuccess("Mode d'accès supprimer");
  };

  const onSelectDocument = (e) => {
    if (!e.target.files || e.target.files.length === 0) {
      setDocument(undefined);
      return;
    }

    let _offer = { ...offer };
    _offer["document"] = e.target.files[0];

    setOffer(_offer);

    setDocument(e.target.files[0]);
  };

  /**
   * Retire le document : le fichier fraîchement choisi comme celui déjà
   * associé à l'offre (l'aperçu et l'état de l'offre sont remis à zéro).
   */
  const onRemoveDocument = () => {
    const _offer = { ...offer };
    _offer["document"] = null;
    setOffer(_offer);
    setDocument(null);
    setPreviewDocument(undefined);
  };

  const handleAddAccessModes = (value) => {
    const _val = { ...value };
    _val["key"] = Date.now();

    let _offer = { ...offer };
    if (_offer?.accessModes) {
      _offer["accessModes"] = [..._offer?.accessModes, _val];
    } else {
      _offer["accessModes"] = [_val];
    }

    setOffer(_offer);
    setShowModeAccesModal(false);
  };

  const handleChangeOfferType = (type) => {
    setShowAlertDialog(true);
    setConfirmType(type);
  };

  const handleConfirm = () => {
    setOfferType(confirmType);
    setConfirm(false);
    setStep(1);
    setShowAlertDialog(false);
    setTargetTab(null);

    const __offer = null;
    const _offer = { ...__offer };
    _offer["code"] = "OF-" + Date.now();
    setOffer(_offer);
  };

  const handleInitImportFromExcel = () => {
    setShowExcelImportModal(true);
  };

  const handleInitOffer = () => {
    setOffer(null);
    setDocument(null);
    setPreviewDocument(null);
    setAccessModes(null);
    setAcMode(null);
    setArea(null);
    setStep(1);
    setOfferType(1);
    setSuccess(false);
  };

  const [savingDraft, setSavingDraft] = useState(false);

  /**
   * Enregistrement : soumise (circuit de validation V1 → V4/V3) ou brouillon.
   * `offerType` est repris de l etat de la page, seule source fiable : la
   * copie portee par l offre a deja ete perdue par le passe, et une
   * declaration promotionnelle partait alors sans son type.
   */
  const saveOffer = async (draft) => {
    const _res = await createOfffer({ ...offer, offerType }, null, { draft });
    if (_res?.error == false) {
      setSuccess(true);
      toastSuccess(
        draft
          ? "Brouillon enregistré : il pourra être soumis depuis « Gérer les offres »."
          : "Offre enregistrée et soumise au Validateur 1.",
      );
    } else {
      // Motif exact renvoyé par l API (droits, champs manquants...).
      toastWarning(
        _res?.message || "Une erreur s'est produite lors de l'enregistrement de l'offre",
      );
    }
  };

  const handleSubmitOffer = async () => {
    setLoading(true);
    try {
      await saveOffer(false);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDraft = async () => {
    setSavingDraft(true);
    try {
      await saveOffer(true);
    } finally {
      setSavingDraft(false);
    }
  };

  return (
    <AdminMainContainerPage
      active="c-off"
      children={
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
                    <i className="fa fa-plus me-2 "></i>Enregistrement d'une
                    offre
                  </b>
                </em>
              </div>
              <div>
                <button className="btn btn-success text-white me-2" onClick={() => handleInitImportFromExcel()}>
                  <i className="fa fa-file-excel me-2"></i> Importer depuis Excel
                </button>
              </div>
            </div>
          </div>
          {!success ? (
            <>
              <div className="d-flex justify-content-between">
                {offerType == 1 ? (
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
                ) : (
                  <>
                    <div className="w-100">
                      <button
                        className="w-100 btn-tab bg-secondary text-white btn"
                        onClick={() => handleChangeOfferType(1)}
                        style={{
                          borderBottomLeftRadius: 8,
                          borderBottomRightRadius: 8,
                          borderTopLeftRadius: 0,
                          borderTopRightRadius: 0,
                        }}
                      >
                        OFFRE PROMOTIONNELLE
                      </button>
                    </div>
                  </>
                )}
                {offerType == 2 ? (
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
                ) : (
                  <>
                    <div className="w-100">
                      <button
                        className="w-100  btn-tab bg-secondary text-white btn"
                        onClick={() => handleChangeOfferType(2)}
                        style={{
                          borderBottomLeftRadius: 8,
                          borderBottomRightRadius: 8,
                          borderTopLeftRadius: 0,
                          borderTopRightRadius: 0,
                        }}
                      >
                        OFFRE DE BASE
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
                          <span className="step-description">
                            Documentation
                          </span>
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
                  <DefaultLoader color="black" size={50} />
                </>
              ) : (
                <>
                  <div className="p-2">
                    {step == 1 && (
                      <>
                        <CreateStep1
                          operators={operators}
                          offer={offer}
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
                        <CreateStep2
                          step={step}
                          offer={offer}
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
                          offer={offer}
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
                        <CreateStep3
                          area={area}
                          offer={offer}
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
                        <CreateStep4
                          previewDocument={previewDocument}
                          document={document}
                          offerDocument={offer?.document}
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
                        <CreateStep5
                          step={step}
                          offer={offer}
                          offerType={offerType}
                          previewDocument={previewDocument}
                          document={document}
                          services={services}
                          destinations={destinations}
                          selectOrgans={selectOrgans}
                          selectCountries={selectCountries}
                          handlePreviousStep={handlePreviousStep}
                          handleNextStep={handleNextStep}
                          handleSubmitOffer={handleSubmitOffer}
                          handleSaveDraft={handleSaveDraft}
                          savingDraft={savingDraft}
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
                              <i className="fa fa-arrow-left me-2"></i>{" "}
                              Précédent
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
                      <i className="fa fa-plus"></i> Enregistrer une nouvelle
                      offre
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}

          <AlertChangerOfferTypeDialog
            visible={showAlertDialog}
            setVisible={setShowAlertDialog}
            handleConfirm={handleConfirm}
          />

          <OfferExcelImport
            isOpen={showExcelImportModal}
            setIsOpen={setShowExcelImportModal}
            listHref="/admin-offer-list"
          />
        </>
      }
    />
  );
}
