import { Dialog } from "primereact/dialog";
import React from "react";
import { BASE_IMG_URL, imageUrl } from "@/services/tools/constants";
import { convertDays, handleNumThousand } from "@/services/tools/convertions";
import { convertMoToGo, extractHtmlText } from "@/services/tools/helper";

/**
 * Comparaison de plusieurs offres côte à côté (retour de présentation ARTCI :
 * « ajout d'une fonctionnalité de comparaison de plusieurs offres » selon prix,
 * volume de données, durée, avantages, etc.).
 *
 * - 1 colonne par offre sélectionnée, 1 ligne par critère.
 * - Mise en évidence de la « meilleure » valeur par critère (prix le plus bas,
 *   plus grande validité / voix / SMS / data).
 */

// Quantité d'un service (par code) dans une formule
const svcQty = (formula, code) => {
  const sd = formula?.serviceDetail?.find((s) => s?.service?.code === code);
  return sd ? Number(sd.quantity) : null;
};

const billingLabel = (t) =>
  t === "PREPAID" ? "Prépayé" : t === "POSTPAID" ? "Postpayé" : t === "HYBRID" ? "Hybride" : "-";

const areaLabel = (t) => {
  if (t === "NATIONAL") return "Nationale";
  if (t === "INTERNATIONNAL" || t === "INTERNATIONAL") return "Internationale";
  if (t === "ROAMING") return "Roaming";
  return t || "-";
};

export default function CompareOffersModal({ visible, setVisible, formulas = [], onRemove }) {
  const items = Array.isArray(formulas) ? formulas : [];

  // Valeurs par offre pour déterminer les "meilleures"
  const prices = items.map((f) => (f?.price?.value != null ? Number(f.price.value) : null));
  const validities = items.map((f) => (f?.validity != null ? Number(f.validity) : null));
  const voix = items.map((f) => svcQty(f, "SER-001"));
  const sms = items.map((f) => svcQty(f, "SER-010"));
  const data = items.map((f) => svcQty(f, "SER-100"));

  const minOf = (arr) => {
    const v = arr.filter((x) => x != null && !Number.isNaN(x));
    return v.length ? Math.min(...v) : null;
  };
  const maxOf = (arr) => {
    const v = arr.filter((x) => x != null && !Number.isNaN(x));
    // -1 = illimité => considéré comme le maximum
    return v.includes(-1) ? -1 : v.length ? Math.max(...v) : null;
  };
  const bestPrice = minOf(prices);
  const bestValidity = maxOf(validities);
  const bestVoix = maxOf(voix);
  const bestSms = maxOf(sms);
  const bestData = maxOf(data);

  const isBest = (val, best) => val != null && best != null && val === best && items.length > 1;
  const fmtQty = (v, unit) =>
    v == null ? "-" : v === -1 ? "Illimité" : `${handleNumThousand(v)} ${unit}`;

  const cellClass = (best) => (best ? "cmp-cmp-cell cmp-cmp-cell--best" : "cmp-cmp-cell");

  return (
    <Dialog
      header={<h5 className="m-0">Comparaison des offres ({items.length})</h5>}
      visible={visible}
      onHide={() => setVisible(false)}
      className="cmp-compare"
      style={{ width: "min(1000px, 96vw)" }}
      dismissableMask
      draggable={false}
      maximizable
    >
      {items.length < 2 ? (
        <div className="cmp-cmp-empty">
          Sélectionnez au moins 2 offres pour les comparer.
        </div>
      ) : (
        <div className="cmp-cmp-scroll">
          <table className="cmp-cmp-table">
            <thead>
              <tr className="">
                <th></th>
                {items.map((f, i) => (
                  <th key={"h" + i} className="cmp-cmp-offerhead" style={{ borderColor: "1px solid black !important",borderBottom:"0px !important" }}>
                    <button
                      type="button"
                      className="cmp-cmp-remove"
                      title="Retirer de la comparaison"
                      aria-label="Retirer cette offre"
                      onClick={() => onRemove && onRemove(f)}
                    >
                      ×
                    </button>
                    <img
                      className="cmp-cmp-logo"
                      src={imageUrl(f?.offer?.operator?.imagePath)}
                      alt={f?.offer?.operator?.name || ""}
                    />
                    <div className="cmp-cmp-title">{f?.title}</div>
                    <div className="cmp-cmp-oper">{f?.offer?.operator?.name}</div>
                  </th>
                ))}
              </tr>
              <tr className="" style={{  }}>
                <th className="cmp-cmp-corner" style={{fontSize: "1.25rem", fontWeight: "bold"}}>CRITERES</th>
                <th></th>
                <th></th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {/* Prix */}
              <tr>
                <td className="cmp-cmp-label"><em><i class="bi bi-cash-coin me-1"></i> Prix</em></td>
                {items.map((f, i) => (
                  <td key={"p" + i} className={cellClass(isBest(prices[i], bestPrice))}>
                    <b>{prices[i] != null ? handleNumThousand(prices[i]) + " F" : "-"}</b>
                    {isBest(prices[i], bestPrice) && <span className="cmp-cmp-badge">Le moins cher</span>}
                  </td>
                ))}
              </tr>
              {/* Validité */}
              <tr>
                <td className="cmp-cmp-label"><i class="bi bi-stopwatch-fill me-1"></i> <em>Validité</em></td>
                {items.map((f, i) => (
                  <td key={"v" + i} className={cellClass(isBest(validities[i], bestValidity))}>
                    {validities[i] != null ? convertDays(validities[i]) : "-"}
                    {isBest(validities[i], bestValidity) && <span className="cmp-cmp-badge">La plus longue</span>}
                  </td>
                ))}
              </tr>
              {/* Voix */}
              <tr>
                <td className="cmp-cmp-label"><i className="bi bi-telephone-fill me-2"></i><em>Voix</em></td>
                {items.map((f, i) => (
                  <td key={"vo" + i} className={cellClass(isBest(voix[i], bestVoix))}>
                    {fmtQty(voix[i], "min")}
                    {isBest(voix[i], bestVoix) && <span className="cmp-cmp-badge">Le plus</span>}
                  </td>
                ))}
              </tr>
              {/* SMS */}
              <tr>
                <td className="cmp-cmp-label"><i className="bi bi-chat-left-text-fill me-2"></i><em>SMS</em></td>
                {items.map((f, i) => (
                  <td key={"sm" + i} className={cellClass(isBest(sms[i], bestSms))}>
                    {fmtQty(sms[i], "SMS")}
                    {isBest(sms[i], bestSms) && <span className="cmp-cmp-badge">Le plus</span>}
                  </td>
                ))}
              </tr>
              {/* Internet */}
              <tr>
                <td className="cmp-cmp-label"><i className="bi bi-globe me-2"></i><em>Internet</em></td>
                {items.map((f, i) => (
                  <td key={"da" + i} className={cellClass(isBest(data[i], bestData))}>
                    {data[i] == null ? "-" : data[i] === -1 ? "Illimité" : convertMoToGo(data[i], 1)}
                    {isBest(data[i], bestData) && <span className="cmp-cmp-badge">Le plus</span>}
                  </td>
                ))}
              </tr>
              {/* Type de facturation */}
              <tr>
                <td className="cmp-cmp-label"><em>Type de client</em></td>
                {items.map((f, i) => (
                  <td key={"b" + i} className="cmp-cmp-cell">{billingLabel(f?.offer?.billingType)}</td>
                ))}
              </tr>
              {/* Zone */}
              <tr>
                <td className="cmp-cmp-label"><em>Zone</em></td>
                {items.map((f, i) => (
                  <td key={"z" + i} className="cmp-cmp-cell">{areaLabel(f?.offer?.area?.title)}</td>
                ))}
              </tr>
              {/* Promotion */}
              <tr>
                <td className="cmp-cmp-label"><em>Promotion</em></td>
                {items.map((f, i) => (
                  <td key={"pr" + i} className="cmp-cmp-cell">
                    {f?.offer?.specialPromotion ? (
                      <span className="cmp-cmp-promo">Oui</span>
                    ) : (
                      "Non"
                    )}
                  </td>
                ))}
              </tr>
              {/* Avantages */}
              <tr>
                <td className="cmp-cmp-label"><em>Avantages</em></td>
                {items.map((f, i) => (
                  <td key={"av" + i} className="cmp-cmp-cell cmp-cmp-cell--adv">
                    {f?.advantages?.length > 0 ? (
                      <ul className="cmp-cmp-advlist">
                        {f.advantages.slice(0, 4).map((a, k) => (
                          <li key={k}>{extractHtmlText(a.title)}</li>
                        ))}
                      </ul>
                    ) : (
                      "-"
                    )}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </Dialog>
  );
}
