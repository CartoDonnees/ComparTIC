import { escapeHtml, sanitizeLetterHtml } from "@/services/letters/letterHtml";
import { ROLE_LABELS } from "@/services/rbac/roles";

/**
 * Modèle du courrier au soumissionnaire : composition pure, sans base ni réseau.
 *
 * Le courrier suit l'état de l'offre : validation, refus ou suspension (offre
 * désactivée). Chaque nature a son objet, son annonce de la décision, sa
 * rubrique de motif et sa conclusion ; l'en-tête, la synthèse, les
 * caractéristiques déclarées et la signature sont communs.
 *
 * Les données viennent de `loadLetterData` (`letterService.js`).
 */

export const dateLong = (d) => (d ? new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric", timeZone: "Africa/Abidjan" }) : "  ");
/** « le 6 octobre 2026 », ou rien si la date est inconnue (jamais de « le . »). */
const onDate = (d, word = "le") => (d ? ` ${word} ${dateLong(d)}` : "");
const money = (n) => `${Number(n).toLocaleString("fr-FR")} FCFA`;
export const fullName = (u) => [u?.firstName, u?.lastName].filter(Boolean).join(" ").trim();
const SERVICE = { VOIX: ["Appels", "min"], SMS: ["SMS", ""], DATA: ["Internet", "Mo"] };
const PROMO = { FLASH: "promotion flash", PERIOD: "promotion périodique", SPECIAL: "promotion spéciale", CUSTOMIZE: "promotion personnalisée" };
const BILLING = { PREPAID: "prépayé", POSTPAID: "postpayé", HYBRID: "hybride" };
/**
 * Nature du courrier, d'après l'état de l'offre :
 * VALIDATED (validation), REFUSED (refus), SUSPENDED (offre désactivée).
 */
export const letterKindOf = (offer) => ({ VALIDATED: "VALIDATED", REFUSED: "REFUSED", DEACTIVATED: "SUSPENDED" })[offer?.workflowStatus] || null;

/**
 * Formules sous forme de liste : l'éditeur de courrier (Quill) ne conserve pas
 * les tableaux, une liste reste modifiable, imprimable et lisible par e-mail.
 */
export const formulasList = (formulas) => {
  if (!formulas.length) return "<p>Aucune formule déclarée.</p>";
  const items = formulas
    .map((f) => {
      const services = f.serviceDetail
        .map((d) => {
          const [label, unit] = SERVICE[d.service?.title] || [d.service?.title || "Service", ""];
          const qty = Number(d.quantity) === -1 ? "illimité" : `${Number(d.quantity).toLocaleString("fr-FR")}${unit ? ` ${unit}` : ""}`;
          return `${label} ${qty}${d.offerRate ? ` (${money(d.offerRate.value)} l'unité)` : ""}`;
        })
        .join(", ");
      return `<li><strong>${escapeHtml(f.title)}</strong> : ${f.price ? money(f.price.value) : "tarif à l'acte"}, valable ${f.validity} jour(s)${services ? `    ${escapeHtml(services)}` : ""}</li>`;
    })
    .join("");
  return `<ul>${items}</ul>`;
};

const conformityRate = (text) => {
  const m = String(text || "").match(/(\d{1,3})\s*%/);
  const n = m ? Number(m[1]) : null;
  return n !== null && n >= 0 && n <= 100 ? n : null;
};

/** Points relevés par l'analyse IA (puces du texte), bornés. */
const analysisPoints = (text) =>
  String(text || "")
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => /^[-*•]\s+/.test(l))
    .map((l) => l.replace(/^[-*•]\s+/, "").replace(/[*_`#]/g, "").trim())
    .filter((l) => l.length > 8)
    .slice(0, 5);

/** Synthèse composée sans service d'analyse, à partir des mêmes éléments. */
export const fallbackSynthesis = ({ offer, kind, decisions, analysis, refusal, refusedAt, suspension }) => {
  const levels = decisions.filter((d) => d.decision === "VALIDATED").length;
  const examined = `L'offre « ${offer.title} » a été examinée par les services de l'ARTCI au regard de la réglementation applicable aux offres de services de communications électroniques.`;
  const parts = [];
  if (kind === "SUSPENDED") {
    parts.push(
      suspension.reason === "MONITORING"
        ? `L'offre « ${offer.title} » a fait l'objet d'une mise à jour dans le cadre de son suivi : une nouvelle version a été déclarée, et la version précédente est suspendue${onDate(suspension.at, "depuis le")}.`
        : `L'offre « ${offer.title} » a été suspendue${onDate(suspension.at)} par les services de l'ARTCI.`,
    );
    if (offer.validatedAt) parts.push(`Elle avait été validée le ${dateLong(offer.validatedAt)}.`);
    return parts.join(" ");
  }
  parts.push(examined);
  if (kind === "REFUSED") {
    parts.push(refusal?.level ? `Elle a été refusée au niveau ${refusal.level} de validation${refusedAt ? `, le ${dateLong(refusedAt)}` : ""}.` : "Elle a été refusée.");
  } else {
    parts.push(levels ? `Elle a été validée à l'issue de ${levels} niveau${levels > 1 ? "x" : ""} de validation.` : "Elle a été validée.");
  }
  const rate = analysis ? conformityRate(analysis.content) : null;
  if (rate !== null) parts.push(`L'analyse de conformité fait ressortir un taux de conformité estimé à ${rate} %.`);
  const points = analysis ? analysisPoints(analysis.content) : [];
  if (points.length) parts.push(`Points relevés lors de l'examen : ${points.join(" ; ")}.`);
  return parts.join(" ");
};

/** Décision à notifier, telle qu'elle est donnée au service d'analyse. */
export const decisionLine = ({ offer, kind, refusal, refusedAt, suspension }) => {
  if (kind === "REFUSED") return `décision finale : refusée${refusedAt ? ` le ${dateLong(refusedAt)}` : ""}${refusal?.comment ? `. Motif du refus : ${String(refusal.comment).slice(0, 800)}` : ""}`;
  if (kind === "SUSPENDED") {
    return (
      `situation : offre suspendue${suspension.at ? ` le ${dateLong(suspension.at)}` : ""}` +
      (suspension.reason === "MONITORING" ? ", remplacée par une nouvelle version déclarée lors de son suivi" : "") +
      (suspension.comment ? `. Motif de la suspension : ${String(suspension.comment).slice(0, 800)}` : "") +
      (offer.validatedAt ? `. Elle avait été validée le ${dateLong(offer.validatedAt)}` : "")
    );
  }
  return `décision finale : validée le ${dateLong(offer.validatedAt)}`;
};

/** Champs dynamiques proposés par l'éditeur (« Insérer »), déjà résolus pour l'offre. */
export const dynamicFields = ({ offer, kind: letterKind, decisions, submitter, analysis, submittedAt, refusal, refusedAt, suspension }, actor) => {
  const kind = offer.specialPromotion ? `${PROMO[offer.specialPromotion.type] || "promotion"} de ${offer.specialPromotion.duration} jour(s)` : "offre de base";
  const observations = decisions.filter((d) => d.comment).map((d) => `<li>Niveau ${d.level} : ${escapeHtml(d.comment)}</li>`).join("");
  return [
    { key: "offerTitle", group: "Offre", label: "Nom de l'offre", value: offer.title },
    { key: "offerCode", group: "Offre", label: "Code de l'offre", value: offer.code },
    { key: "operator", group: "Offre", label: "Opérateur", value: offer.operator?.name || "" },
    { key: "offerKind", group: "Offre", label: "Type d'offre", value: kind },
    { key: "clientType", group: "Offre", label: "Type de client", value: BILLING[offer.billingType] || "" },
    { key: "formulas", group: "Offre", label: "Liste des formules", html: formulasList(offer.formulas) },
    { key: "notifiDate", group: "Dates", label: "Date de notification", value: dateLong(offer.notifiDate) },
    { key: "submittedAt", group: "Dates", label: "Date de soumission", value: dateLong(submittedAt) },
    ...(offer.validatedAt ? [{ key: "validatedAt", group: "Dates", label: "Date de validation", value: dateLong(offer.validatedAt) }] : []),
    ...(letterKind === "REFUSED" && refusedAt ? [{ key: "refusedAt", group: "Dates", label: "Date du refus", value: dateLong(refusedAt) }] : []),
    ...(letterKind === "SUSPENDED" && suspension.at ? [{ key: "suspendedAt", group: "Dates", label: "Date de suspension", value: dateLong(suspension.at) }] : []),
    { key: "desiredDate", group: "Dates", label: "Date de lancement souhaitée", value: dateLong(offer.desiredDate) },
    { key: "today", group: "Dates", label: "Date du jour", value: dateLong(new Date()) },
    { key: "submitter", group: "Personnes", label: "Soumissionnaire", value: fullName(submitter) || "le point focal" },
    { key: "signatory", group: "Personnes", label: "Signataire (vous)", value: `${fullName(actor) || "[Nom du signataire]"}${ROLE_LABELS[actor.role] ? `, ${ROLE_LABELS[actor.role].split("   ")[0]}` : ""}` },
    ...(observations ? [{ key: "observations", group: "Examen", label: "Commentaires des validateurs", html: `<ul>${observations}</ul>` }] : []),
    ...(letterKind === "REFUSED" && refusal?.comment ? [{ key: "refusalReason", group: "Examen", label: "Motif du refus", value: refusal.comment }] : []),
    ...(letterKind === "SUSPENDED" && suspension.comment ? [{ key: "suspensionReason", group: "Examen", label: "Motif de la suspension", value: suspension.comment }] : []),
    ...(analysis ? [{ key: "analysisRate", group: "Examen", label: "Taux de conformité (analyse IA)", value: conformityRate(analysis.content) !== null ? `${conformityRate(analysis.content)} %` : "non chiffré" }] : []),
  ];
};

/** Objet, annonce de la décision et rubriques propres à chaque nature de courrier. */
const letterVariant = (data) => {
  const { offer, kind, decisions, refusal, refusedAt, suspension } = data;
  const label = `« ${offer.title} » (${offer.code})`;
  const thing = offer.specialPromotion ? "l'offre promotionnelle" : "l'offre";
  const title = `<strong>« ${escapeHtml(offer.title)} »</strong>`;
  const received = `<p>Nous accusons réception de la notification de ${thing} ${title}, soumise à l'examen de l'Autorité de Régulation des Télécommunications/TIC de Côte d'Ivoire (ARTCI)${data.submittedAt ? ` le ${dateLong(data.submittedAt)}` : ""}.</p>`;

  if (kind === "REFUSED") {
    return {
      subject: `Refus de l'offre ${label}`,
      opening: [
        received,
        `<p>Au terme de cet examen, nous vous informons que cette offre <strong>n'a pas été validée</strong>${refusedAt ? ` (décision du ${dateLong(refusedAt)})` : ""}. Elle ne peut donc pas être publiée sur le comparateur CompareTIC en l'état.</p>`,
      ],
      synthesisTitle: "Synthèse de l'examen",
      sections: refusal?.comment ? ["<h3>Motif du refus</h3>", `<p>${escapeHtml(refusal.comment)}</p>`] : ["<h3>Motif du refus</h3>", "<p>[Précisez ici le motif du refus.]</p>"],
      closing: "<p>Le circuit de validation de cette déclaration est clos. Vous avez la possibilité de soumettre une nouvelle déclaration tenant compte des observations ci-dessus.</p>",
    };
  }

  if (kind === "SUSPENDED") {
    const replaced = suspension.reason === "MONITORING";
    return {
      subject: `Suspension de l'offre ${label}`,
      opening: [
        `<p>Nous revenons vers vous au sujet de ${thing} ${title}, notifiée à l'Autorité de Régulation des Télécommunications/TIC de Côte d'Ivoire (ARTCI)${offer.notifiDate ? ` le ${dateLong(offer.notifiDate)}` : ""}.</p>`,
        replaced
          ? `<p>Nous vous informons que cette version de l'offre est <strong>suspendue${onDate(suspension.at, "depuis le")}</strong> : elle a été remplacée par une nouvelle version, déclarée dans le cadre du suivi de l'offre et soumise à son tour à l'examen de l'ARTCI.</p>`
          : `<p>Nous vous informons que cette offre a été <strong>suspendue${onDate(suspension.at)}</strong>. Elle n'est plus publiée sur le comparateur CompareTIC.</p>`,
      ],
      synthesisTitle: "Rappel de la situation",
      sections: replaced ? [] : suspension.comment ? ["<h3>Motif de la suspension</h3>", `<p>${escapeHtml(suspension.comment)}</p>`] : ["<h3>Motif de la suspension</h3>", "<p>[Précisez ici le motif de la suspension.]</p>"],
      closing: "<p>Pour toute question relative à cette suspension ou à la reprise de l'offre, nous vous invitons à vous rapprocher des services de l'ARTCI.</p>",
    };
  }

  const finalDecision = [...decisions].reverse().find((d) => d.final && d.decision === "VALIDATED") || decisions[decisions.length - 1] || null;
  return {
    subject: `Validation de l'offre ${label}`,
    opening: [
      received,
      `<p>Au terme de cet examen, nous vous informons que cette offre a été <strong>validée le ${dateLong(offer.validatedAt)}</strong>. Elle peut être commercialisée à compter du ${dateLong(offer.desiredDate)}, dans les conditions déclarées et rappelées ci-dessous.</p>`,
    ],
    synthesisTitle: "Synthèse de l'examen",
    sections: finalDecision?.comment ? ["<h3>Observations</h3>", `<p>${escapeHtml(finalDecision.comment)}</p>`] : [],
    closing: "<p>Nous vous rappelons que toute modification de cette offre (tarifs, contenu, durée, zone ou conditions d'accès) doit faire l'objet d'une nouvelle notification à l'ARTCI avant sa mise en œuvre.</p>",
  };
};

export const composeLetter = (data, actor, synthesis) => {
  const { offer, submitter } = data;
  const variant = letterVariant(data);
  const html = [
    `<p class="ql-align-right">Abidjan, le ${dateLong(new Date())}</p>`,
    `<p><br>À l'attention de ${escapeHtml(fullName(submitter) || "Madame, Monsieur le point focal")} de <strong>${escapeHtml(offer.operator?.name || "")}</strong></p>`,
    `<p><strong>Objet :</strong> ${escapeHtml(variant.subject)}</p>`,
    `<p><strong>Réf. :</strong> votre notification du ${dateLong(offer.notifiDate)}    offre ${escapeHtml(offer.code)}</p>`,
    "<p>Madame, Monsieur,</p>",
    ...variant.opening,
    `<h3>${variant.synthesisTitle}</h3>`,
    `<p>${escapeHtml(synthesis)}</p>`,
    ...variant.sections,
    "<h3>Caractéristiques déclarées</h3>",
    formulasList(offer.formulas),
    variant.closing,
    "<p>Nous vous prions d'agréer, Madame, Monsieur, l'expression de notre considération distinguée.</p>",
    `<p><br></p><p class="ql-align-right"><strong>${escapeHtml(fullName(actor) || "[Nom du signataire]")}</strong><br>${escapeHtml(ROLE_LABELS[actor.role] ? ROLE_LABELS[actor.role].split("   ").pop() : "[Qualité du signataire]")}<br>ARTCI</p>`,
  ].join("");
  return { subject: variant.subject, html: sanitizeLetterHtml(html) };
};
