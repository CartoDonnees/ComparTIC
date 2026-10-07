import { formatDateToFrench } from "./helper";

export const handleNumThousand = (nombre) => {
  nombre = Math.round(nombre * 100) / 100;
  nombre += "";
  var sep = " ";
  var reg = /(\d+)(\d{3})/;
  while (reg.test(nombre)) {
    nombre = nombre.replace(reg, "$1" + sep + "$2");
  }
  return nombre;
};

export const convertFromStringToDate = (responseDate) => {
  let dateComponents = responseDate.split("T");
  let datePieces = dateComponents[0].split("-");
  let timePieces = dateComponents[1].split(":");
  return new Date(
    datePieces[0],
    datePieces[1] - 1,
    datePieces[2],
    timePieces[0],
    timePieces[1],
    timePieces[2]
  );
};

export const strLcFirst = (a) => {
  if (a?.length > 0) {
    return (a + "").charAt(0).toLowerCase() + a.substr(1);
  }
};

export const strLowerCase = (a) => {
  if (a?.length > 0) {
    a = a.toLowerCase();
    return a;
  }
};

export const strNLetter = (a, i, j) => {
  a = a.substring(i, j);
  a = a.toLowerCase(a);
  return a;
};

export const strUppercCaase = (a) => {
  if (a?.length > 0) {
    a = a.toUpperCase();

    return a;
  }
  return;
};

export const srtSubDescription = (a) => {
  if (a?.length > 0) {
    a = a.substr(0, 30);

    return a + "...";
  } else {
    return;
  }
};

export const srtSubDescription2 = (a) => {
  if (a?.length > 0) {
    a = a.substr(0, 150);

    return a + "...";
  } else {
    return;
  }
};

export const srtSubDescription3 = (a, i = 10) => {
  if (a?.length > 0) {
    a = a.substr(0, i);

    return a + "...";
  } else {
    return;
  }
};

export const strDate = (d) => {
  if (d?.length > 0) {
    let _da = d.split("-");

    return _da[2].substr(0, 2) + "/" + _da[1] + "/" + _da[0];
  }
};
export const strUcFirst = (a) => {
  a = a.toLowerCase();
  return (a + "").charAt(0).toUpperCase() + a.substr(1);
};

export const searchWithoutAccents = (text, word) => {
  // Normaliser le texte et le mot de recherche
  const texteNormalise = text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  const motRechercheNormalise = word
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  // Utiliser une expression régulière pour effectuer la recherche sans tenir compte des accents
  const regex = new RegExp(motRechercheNormalise, "g");
  const correspondances = texteNormalise.match(regex);

  return correspondances ? true : false;
};

export const addDays = (date, nbDays, isDate = -1) => {
  let newDate = null;
  if (date instanceof Date) {
    newDate = date;
  } else {
    newDate = new Date(date);
  }
  newDate.setDate(newDate.getDate() + Number(nbDays));
  if(isDate != -1){
    return newDate;
  }
  return formatDateToFrench(newDate.toDateString());
};

export const convertDays = (n) => {
  if (n < 7) {
    // Moins d'une semaine -> jours seulement
    return `${n} jour${n > 1 ? "s" : ""}`;
  }

  if (n >= 7 && n < 30) {
    // Conversion en semaines + jours
    const weeks = Math.floor(n / 7);
    const days = n % 7;

    if (days === 0) {
      return `${weeks} semaine${weeks > 1 ? "s" : ""}`;
    } else {
      return `${weeks} semaine${weeks > 1 ? "s" : ""} ${days} jour${
        days > 1 ? "s" : ""
      }`;
    }
  }

  // Conversion en mois + semaines
  const months = Math.floor(n / 30);
  const remainingDays = n % 30;

  if (remainingDays === 0) {
    return `${months} mois`;
  }

  const weeks = Math.floor(remainingDays / 7);

  if (weeks === 0) {
    return `${months} mois`;
  } else {
    return `${months} mois ${weeks} semaine${weeks > 1 ? "s" : ""}`;
  }
};
