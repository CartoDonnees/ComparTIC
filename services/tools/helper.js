import { handleNumThousand } from "./convertions";

export const generateRandomString = (length) => {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  const charactersLength = characters.length;

  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }

  return result;
};

export const isBetweenDates = (startDate, endDate) => {
  if (startDate && endDate) {
    const today = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);

    // On compare les dates
    return today >= start && start <= end;
  } else {
    return false;
  }
};

export const handleGetReductionPrice = (pdt) => {
  if (pdt?.discountType == 1) {
    //% Reduction d'un montant
    if (
      pdt?.discountAmount &&
      Number(pdt?.discountAmount) < Number(pdt?.price)
    ) {
      const r = Number(pdt?.price) - Number(pdt?.discountAmount);
      return handleNumThousand(r);
    } else {
      return null;
    }
  } else if (pdt?.discountType == 2) {
    const r =
      Number(pdt?.price) -
      (Number(pdt?.price) * Number(pdt?.discountPercent)) / 100;
    return handleNumThousand(r);
  } else {
    return null;
  }
};

export const handleGetPromotionPrice = (pdt) => {
  if (pdt?.promotionType == 1) {
    //% Reduction d'un montant
    if (
      pdt?.promotionAmount &&
      Number(pdt?.promotionAmount) < Number(pdt?.price)
    ) {
      const r = Number(pdt?.price) - Number(pdt?.promotionAmount);
      return handleNumThousand(r);
    } else {
      return null;
    }
  } else if (pdt?.promotionType == 2) {
    const r =
      Number(pdt?.price) -
      (Number(pdt?.price) * Number(pdt?.promotionPercent)) / 100;
    return handleNumThousand(r);
  } else {
    return null;
  }
};

export const convertDateToFrench = (dateString) => {
  // Crée un objet Date à partir de la chaîne de date en anglais
  const date = new Date(dateString);

  // Définit les options pour formater la date en français
  const options = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  };

  // Utilise toLocaleDateString pour formater la date en français
  return date.toLocaleDateString("fr-FR", options);
};

export const getCookie = (name) => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(";").shift();
};

export const isCoordinates = (text) => {
  try {
    // Parser le texte en JSON
    const data = JSON.parse(text);

    // Vérifier que data est un tableau de tableaux
    if (!Array.isArray(data) || !Array.isArray(data[0])) {
      return false;
    }

    // Vérifier que chaque sous-tableau contient deux nombres
    for (const coord of data) {
      if (
        !Array.isArray(coord) || // Vérifier que c'est un tableau
        coord.length !== 2 || // Vérifier qu'il a deux éléments
        typeof coord[0] !== "number" || // Vérifier que le premier élément est un nombre
        typeof coord[1] !== "number" // Vérifier que le deuxième élément est un nombre
      ) {
        return false;
      }
    }

    return true; // Tout est conforme
  } catch (error) {
    return false; // Erreur de parsing JSON
  }
};

export const deleteFile = async (filePath) => {
  try {
    const response = await fetch("/api/files/deleteFile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filePath }),
    });

    const result = await response.json();
    if (response.ok) {
    } else {
      // console.error(result.message);
    }
  } catch (error) {
    // console.error('Erreur lors de la requête de suppression du fichier:', error);
  }
};

export function binarySearch(localities, searchTerm) {
  let left = 0;
  let right = localities.length - 1;

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    const guess = localities[mid]?.name;

    if (guess?.name?.includes(searchTerm)) {
      return mid; // Indice où se trouve la localité
    }
    if (guess < searchTerm) {
      left = mid + 1;
    } else {
      right = mid - 1;
    }
  }
  return -1; // Si la localité n'est pas trouvée
}

export const getDateOnly = (isoString) => {
  const date = new Date(isoString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0"); // `getMonth` retourne 0-11
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

export const generateSemesterDates = (startYear = 2021) => {
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1; // Mois actuel (1-12)
  const semesters = [];

  for (let year = startYear; year <= currentYear; year++) {
    let firstSemester = `${year}-06-30`;
    let secondSemester = `${year}-12-31`;

    if (year === currentYear) {
      // Si on est dans la première moitié de l'année, exclure "YYYY-06-30"
      if (currentMonth <= 6) break;
      // Sinon, exclure "YYYY-12-31"
      secondSemester = null;
    }

    semesters.push(firstSemester);
    if (secondSemester) semesters.push(secondSemester);
  }

  return semesters.reverse(); // Inverser le tableau pour avoir le plus récent en premier
};

export const generateSemesters = (startYear = 2020) => {
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const semesterDates = [];

  //   for (let year = startYear; year <= currentYear; year++) {
  //     // Ajouter S1 (premier semestre)
  //     semesterDates.push(`${year}-06-30`);

  //     // Ajouter S2 si on n'est pas en S1 de l'année en cours
  //     if (year < currentYear || currentMonth > 6) {
  //         semesterDates.push(`${year}-12-31`);
  //     }
  // }

  if (currentMonth > 6) {
    for (
      let year = currentYear;
      year > currentYear - (currentYear - 2020);
      year--
    ) {
      if (year != currentYear) {
        if (`${year}-12-31` != "2022-12-31") {
          semesterDates.push(`${year}-12-31`); // 31 décembre de l'année
        }
      }
      if (`${year}-06-30` != "2022-06-30") {
        semesterDates.push(`${year}-06-30`); // 30 juin de l'année
      }
    }
  } else {
    const _year = currentYear - 1;
    for (let year = _year; year > _year - (_year - 2020); year--) {
      if (year != _year) {
        if (`${year}-12-31` != "2022-12-31") {
          semesterDates.push(`${year}-12-31`); // 31 décembre de l'année
        }
      }
      if (`${year}-06-30` != "2022-06-30") {
        semesterDates.push(`${year}-06-30`); // 30 juin de l'année
      }
    }
  }

  return semesterDates;
};

export const getCurrentSemester = () => {
  const currentYear = new Date().getFullYear();
  const month = new Date().getMonth() + 1; // getMonth() renvoie 0 pour janvier
  let semester = null;
  if (month <= 6) {
    semester = `${currentYear}-06-30`;
  } else {
    semester = `${currentYear}-12-31`;
  }
  return semester;
};

export const getPreviousSemester = () => {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1; // Les mois commencent à 0

  let semester, year;

  if (currentMonth >= 1 && currentMonth <= 6) {
    semester = 2; // Le premier semestre de l'année actuelle → Retourner le deuxième semestre de l'année précédente
    year = currentYear - 1;
    return [`${year}-12-31`, 2, year];
  } else {
    semester = 1; // Le deuxième semestre de l'année actuelle → Retourner le premier semestre de la même année
    year = currentYear;
    return [`${year}-06-30`, 1, year];
  }
};

export const formatDateToFrench = (dateString) => {
  // Convertir la chaîne de date en objet Date
  const date = new Date(dateString);

  // Vérifier si la date est valide
  if (isNaN(date)) {
    // throw new Error('Date invalide');
    return;
  }

  // Formater la date au format français
  const formatter = new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return formatter.format(date);
};

export const isValidPhoneNumber = (phoneNumber) => {
  const pattern = /^(\+225)?[0-9]{10}$/;
  return pattern.test(phoneNumber);
};

export const getBase64ImageFromURL = async (url) => {
  const response = await fetch(url);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

export const convertMoToGo = (megaOcts, decimales = 2) => {
  if (megaOcts < 1024) {
    return megaOcts + " Mo";
  }
  const gigOcts = megaOcts / 1024;
  return parseFloat(gigOcts.toFixed(decimales)) + " Go";
};

export const addDaysDate = (date, days) => {
  const newDate = new Date(date);
  newDate.setDate(newDate.getDate() + days);
  return newDate;
};

export function extractHtmlText(html) {
  if (!html) return "";
  return html
    .replace(/<\/p>/g, "</p> ") // ajouter espace après </p>
    .replace(/<[^>]+>/g, "")
    .trim();
}

export const buildOfferText = (offer) => {
  const {
    title,
    billingType,
    category,
    operator,
    area,
    formulas,
    accessModes,
    desiredDate,
    updatedAt,
    notifiDate,
    description,
    target,
    specialPromotion,
  } = offer;

  const PROMO_TYPES = { FLASH: "flash", PERIOD: "périodique", SPECIAL: "spéciale", CUSTOMIZE: "personnalisée" };
  const baseOffer = specialPromotion
    ? `une offre promotionelle${PROMO_TYPES[specialPromotion.type] ? ` ${PROMO_TYPES[specialPromotion.type]}` : ""}`
    : "une offre de base";
  // Durée et fin de la promotion (sinon l'analyse la signale comme absente).
  const promoDuration = Number(specialPromotion?.duration);
  const promoText =
    specialPromotion && Number.isFinite(promoDuration) && promoDuration > 0
      ? `La promotion dure ${promoDuration} jour(s)${
          desiredDate
            ? ` et prend fin le ${formatDateToFrench(new Date(new Date(desiredDate).getTime() + promoDuration * 86400000))}`
            : ""
        }.`
      : "";

  const cleanHtml = (text = "") => String(text ?? "").replace(/<[^>]*>/g, "").trim();
  // Données partielles (brouillon, formule sans prix…) : pas d'exception.
  const _formulas = Array.isArray(formulas) ? formulas : [];

  const prices = _formulas.map((f) => Number(f?.price?.value)).filter((v) => Number.isFinite(v));
  const minPrice = prices.length ? Math.min(...prices) : null;
  const maxPrice = prices.length ? Math.max(...prices) : null;

  const formulasText = _formulas
    .map((f) => {
      const _servs = (f?.serviceDetail || [])
        .map((sd) => {
          if (sd?.service?.title == "VOIX") {
            return `${sd.quantity} minutes d'appels ${
              sd.comtype == "ALL_NET"
                ? "Tous réseaux"
                : sd.comtype == "ON_NET"
                  ? "On-net"
                  : "Off-net"
            } `;
          }
          if (sd?.service?.title == "SMS") {
            return `${sd.quantity} sms ${
              sd.comtype == "ALL_NET"
                ? "Tous réseaux"
                : sd.comtype == "ON_NET"
                  ? "On-net"
                  : "Off-net"
            } `;
          }
          if (sd?.service?.title == "DATA") {
            return `${convertMoToGo(sd.quantity)} d'internet`;
          }
        })
        .join(" , ");

      const advantages = f?.advantages?.length
        ? ` avec accès illimité à ${[
            ...new Set(f.advantages.map((a) => cleanHtml(a?.title))),
          ].join(", ")}`
        : "";

      return `${f?.price?.value ?? "prix non renseigné,"} FCFA incluant ${_servs} ${advantages}, valable pendant ${f.validity} jours après souscription `;
    })
    .join(" ; ");

  const accessText = accessModes?.length
    ? `L’offre est activable via ${accessModes
        .map((a) => cleanHtml(a?.content))
        .join(", ")}.`
    : "";

  const dateText = desiredDate
    ? `Elle a été enregistrée le  ${formatDateToFrench(
        updatedAt,
      )} et notifier à l'ARTCI le ${formatDateToFrench(
        notifiDate,
      )} et l'opérateur souhaite le rendre disponible à partir du ${formatDateToFrench(
        desiredDate,
      )}.`
    : "";

  return `
L’offre ${title} de l’opérateur ${operator?.name ?? ""} est ${baseOffer} ${category}
${
  billingType == "PREPAID" ? "prépayée" : "postpayée"
} valable sur toute la zone ${area?.title ?? "non renseignée"}. 

${prices.length ? `Elle propose des tarifs allant de ${minPrice} à ${maxPrice} FCFA.` : "Aucun tarif n'est renseigné."}
Cible de l'offre: ${target ? extractTextFiltered(target) : "non renseignée"}.

Les formules disponibles sont : ${formulasText}.
${accessText} ${dateText} ${promoText}
La description de l'offre est la suivante:${description ? extractTextFiltered(description) : " non renseignée"}
  `
    .replace(/\s+/g, " ")
    .trim();
};

export const formatWordLikeText = (text) => {
  let html = text;

  // Gras **texte**
  if (html) {
    html = html.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");

    // Titres numérotés **1. Titre :**
    html = html.replace(/<strong>(\d+\.\s.*?:)<\/strong>/g, "<h2>$1</h2>");

    // Listes à puces
    html = html.replace(/\n\* (.*?)(?=\n|$)/g, "<li>$1</li>");
    html = html.replace(/(<li>.*<\/li>)/gs, "<ul>$1</ul>");

    // Paragraphes
    html = html
      .split("\n\n")
      .map((p) => {
        if (p.startsWith("<h2>") || p.startsWith("<ul>")) {
          return p;
        }
        return `<p>${p.replace(/\n/g, "<br>")}</p>`;
      })
      .join("");

    return html;
  }
};

export const extractTextFiltered = (htmlString) => {
  // Côté serveur (analyse IA construite par l'API) : pas de DOM.
  if (typeof document === "undefined") {
    return String(htmlString ?? "")
      .replace(/<[^>]*>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;|&apos;/g, "'")
      .replace(/\s+/g, " ")
      .trim();
  }
  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = htmlString;
  return tempDiv.textContent?.trim() || "";
};

export const buildServices = (serviceDetails) => {
  const services = {};

  serviceDetails.forEach((detail) => {
    if (!detail.service) return;

    const key = detail.service.title;

    services[key] = true;
    services["quantity" + key] = String(detail.quantity || 0);
    services["comType" + key] = detail.comtype;

    if (detail.billingSteps) {
      services["bStep" + key] = String(detail.billingSteps);
    }
  });

  return services;
};
export const formatDate = (date) => {
  return date ? date.split("T")[0] : null;
};

/**
 * Organisations retenues pour une zone, au format attendu par l'étape 3 :
 *   { "AELE": { id, name, value: true }, ... }
 * L'organisation « Autres » (DEST-10000001000) est indexée sous la clé
 * `other`, conformément à l'interface.
 */
export const buildAreaOrganizations = (area) => {
  const out = {};
  (area?.areaOrganizations || []).forEach((ao) => {
    const org = ao?.organization;
    if (!org) return;
    const key = org.code === "DEST-10000001000" ? "other" : org.name;
    out[key] = { id: org.id, name: org.name, value: true };
  });
  return out;
};

/**
 * Pays retenus, au format attendu par l'étape 3 :
 *   { "Islande": { parentId: <organizationId>, id, name, value: true }, ... }
 * `parentId` est l'identifiant de l'ORGANISATION (et non de l'AreaOrganization),
 * car c'est ce que l'interface et `saveArea` manipulent.
 */
export const buildAreaCountries = (area) => {
  const out = {};
  (area?.areaOrganizations || []).forEach((ao) => {
    const organizationId = ao?.organization?.id;
    (ao?.organisationCountries || []).forEach((oc) => {
      const c = oc?.country;
      if (!c) return;
      out[c.name] = {
        parentId: organizationId,
        id: c.id,
        name: c.name,
        value: true,
      };
    });
  });
  return out;
};

export const transformOffer = (source) => {
  return {
    code: source.code,
    title: source.title,
    // BUGFIX: tout ce qui n etait pas PREPAID devenait 2 (postpaye). Une offre
    // HYBRID etait donc affichee comme postpayee, puis ENREGISTREE comme telle
    // a la moindre modification. 3 est reconnu par la route de mise a jour.
    billingType:
      source.billingType == "PREPAID"
        ? 1
        : source.billingType == "HYBRID" || source.billingType == "HYBRIDE"
          ? 3
          : 2,
    category: source.category == "MOBILE" ? 1 : 2,

    // BUGFIX: la promotion n etait pas reprise. Les pages de modification et de
    // monitoring decident pourtant du type d offre avec
    // `mOffer?.specialPromotion`, qui valait donc TOUJOURS undefined : toute
    // offre s ouvrait comme une offre de base, et l enregistrement envoyait
    // `offerType: 2`, ce qui SUPPRIMAIT sa promotion cote serveur.
    specialPromotion: source.specialPromotion || null,
    offerType: source.specialPromotion ? 1 : 2,
    target: source.target,
    description: source.description,
    partner: source.partner || null,

    operator: source.operator || null,

    // BUGFIX: l offre parente n etait jamais remontee au formulaire : a la
    // modification (et au monitoring), le champ « OFFRE PARENTE » repartait
    // systematiquement a vide, meme lorsque l offre en avait une.
    id: source.id ?? null,
    parentId: source.parentId ?? source.parent?.id ?? null,
    parentOffer: source.parent || null,

    // BUGFIX: `organizations` et `countries` étaient toujours renvoyés vides,
    // si bien qu'à la modification d'une offre internationale plus aucune
    // organisation ni aucun pays n'était coché. On reconstruit ici la forme
    // attendue par l'étape 3 à partir des données de l'API.
    area: {
      title: source.area ? source.area.title : null,
      organizations: buildAreaOrganizations(source.area),
      countries: buildAreaCountries(source.area),
    },

    notifDate: formatDate(source.notifiDate),
    startDate: formatDate(source.desiredDate),
    duration: source.specialPromotion
      ? String(source.specialPromotion.duration)
      : null,
    // BUGFIX: le type etait code en dur a « SPECIAL ». Une promotion FLASH,
    // PERIODIQUE ou PERSONALISEE s affichait donc comme SPECIALE, et la
    // modification la RE-ENREGISTRAIT en SPECIALE.
    promoType: source.specialPromotion?.type ?? null,

    accessModes: (source.accessModes || []).map((mode) => ({
      key: Date.now() + Math.random(),
      content: mode.content,
    })),

    formulas: (source.formulas || []).map((formula) => ({
      type: "price",
      key: formula.id,
      title: formula.title,
      isDetails: true,

      settlement: {
        price: formula.price ? String(formula.price.value) : "0",
        validity: String(formula.validity || 0),
        services: buildServices(formula.serviceDetail || []),
      },

      advantages: (formula.advantages || []).map((a) => ({
        key: a.id,
        name: a.title || a.name,
      })),
    })),

    document: source.document || {},
  };
};

export const transformOffers = (sources) => {
  return sources.map(transformOffer);
};

export const getDateMonthsBefore = (date,nbMonth = 3) => {
  const d = new Date(date); //xœ
  d.setMonth(d.getMonth() - nbMonth);
  return d;
}

export const formatToYYYYMMDD = (date) => {
  const d = new Date(date);

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export const getWeekNumber = (dateString) => {
  const date = new Date(dateString);

  // Copier la date et la passer en UTC
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));

  // ISO : semaine commence lundi, on ajuste au jeudi
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);

  // Début de l'année
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));

  // Calcul du numéro de semaine
  const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);

  return weekNo;
}

export const formatDateFr = (dateString) => {
  const date = new Date(dateString);

  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

export const isValidEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}