import { Dialog } from "primereact/dialog";
import React from "react";
import { BASE_IMG_URL, imageUrl } from "@/services/tools/constants";
import { addDays, convertDays, handleNumThousand } from "@/services/tools/convertions";
import { convertMoToGo, extractHtmlText } from "@/services/tools/helper";
import OfferCoverage from "@/componnents/comparator/OfferCoverage";

/**
 * Modal de détail d'une formule.
 *
 * Réécriture complète : l'ancienne version affichait un contenu factice codé
 * en dur ("C'CHIC OKALAMAR…") et ignorait la prop `formula`. Le composant est
 * désormais entièrement piloté par les données de l'offre sélectionnée et
 * adopte le style moderne du comparateur (cf. styles/comparator.css).
 */

// Métadonnées d'affichage par code de service (icône + unité)
const SERVICE_META = {
  "SER-001": { icon: "bi-telephone-fill", unit: "mins", label: "Appels" },
  "SER-010": { icon: "bi-chat-left-text-fill", unit: "sms", label: "SMS" },
  "SER-100": { icon: "bi-globe", unit: null, label: "Internet" },
};

const billingLabel = (type) =>
  type === "PREPAID" ? "Prépayé" : type === "POSTPAID" ? "Postpayé" : "Hybride";

const areaLabel = (title) => {
  if (title === "NATIONAL") return "Nationale";
  if (title === "INTERNATIONNAL" || title === "INTERNATIONAL") return "Internationale";
  if (title === "ROAMING") return "Roaming";
  return title || "";
};

export default function DetailFomulaModal({ visible, setVisible, formula, services }) {
  const onHide = () => setVisible(false);

  const offer = formula?.offer;
  const promo = offer?.specialPromotion;

  // En-tête personnalisé (logo opérateur + titre de la formule)
  const header = (
    <div className="cmp-detail__header">
      {offer?.operator?.imagePath && (
        <img
          className="cmp-detail__logo"
          src={imageUrl(offer.operator.imagePath)}
          alt={offer?.operator?.name || "Opérateur"}
        />
      )}
      <div>
        <div className="cmp-detail__title">{formula?.title || "Détail de l'offre"}</div>
        {offer?.operator?.name && (
          <div className="cmp-detail__operator">{offer.operator.name}</div>
        )}
      </div>
    </div>
  );

  return (
    /* Modale agrandie (680 px -> 1040 px) : la section « Pays concernés » peut
       compter plusieurs dizaines de pastilles, très à l étroit auparavant. */
    <Dialog
      header={header}
      visible={visible}
      onHide={onHide}
      dismissableMask
      draggable={false}
      className="cmp-detail"
      style={{ width: "min(1040px, 96vw)" }}
      contentClassName="cmp-detail__content"
    >
      {!formula ? (
        <div className="cmp-detail__empty">Aucune formule sélectionnée.</div>
      ) : (
        <>
          {/* Badges : type de paiement, zone, promotion */}
          <div className="cmp-detail__badges">
            <span className="cmp-detail__badge cmp-detail__badge--info">
              <i className="bi bi-credit-card-2-back" aria-hidden="true"></i>
              {billingLabel(offer?.billingType)}
            </span>
            {offer?.area?.title && (
              <span className="cmp-detail__badge cmp-detail__badge--zone">
                <i className="bi bi-geo-alt-fill" aria-hidden="true"></i>
                {areaLabel(offer.area.title)}
              </span>
            )}
            {promo && (
              <span className="cmp-detail__badge cmp-detail__badge--promo">
                <i className="bi bi-stars" aria-hidden="true"></i>
                Promotion
              </span>
            )}
          </div>

          {/* Prix + validité */}
          <div className="cmp-detail__price-row">
            <div className="cmp-detail__price">
              {formula?.price?.value != null ? (
                <>
                  <span className="cmp-detail__price-value">
                    {handleNumThousand(formula.price.value)}
                  </span>
                  <span className="cmp-detail__price-currency">FCFA</span>
                </>
              ) : (
                <span className="cmp-detail__price-currency">Prix non communiqué</span>
              )}
            </div>
            <div className="cmp-detail__validity">
              <i className="bi bi-calendar-check" aria-hidden="true"></i>
              <span>{convertDays(formula?.validity)}</span>
            </div>
          </div>

          {/* Services inclus (Voix / SMS / Internet) */}
          {formula?.serviceDetail?.length > 0 && (
            <div className="cmp-detail__services">
              {(services && services.length > 0
                ? services
                    .map((s) =>
                      formula.serviceDetail.find((sd) => sd.service?.id === s.id),
                    )
                    .filter(Boolean)
                : formula.serviceDetail
              ).map((sd, i) => {
                const meta = SERVICE_META[sd.service?.code] || {};
                return (
                  <div className="cmp-detail__service" key={"sd" + i}>
                    <i className={`bi ${meta.icon || "bi-box"}`} aria-hidden="true"></i>
                    <div className="cmp-detail__service-qty">
                      {sd.service?.code === "SER-100"
                        ? convertMoToGo(sd.quantity, 1)
                        : `${handleNumThousand(sd.quantity)} ${meta.unit || ""}`}
                    </div>
                    <div className="cmp-detail__service-label">{meta.label}</div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Promotion : date limite */}
          {promo && offer?.desiredDate && (
            <div className="cmp-detail__promo">
              <i className="bi bi-clock-history" aria-hidden="true"></i>
              Offre promotionnelle valable jusqu'au{" "}
              <strong>{addDays(offer.desiredDate, promo.duration)}</strong>
            </div>
          )}

          {/* Couverture géographique (offres internationales et roaming) :
              zones concernées et pays couverts. L information figurait en base
              mais n était présentée nulle part côté public. */}
          <OfferCoverage offer={offer} variant="full" />

          {/* Modes d'accès */}
          {offer?.accessModes?.length > 0 && (
            <div className="cmp-detail__section">
              <h4 className="cmp-detail__section-title">Modes d'accès</h4>
              <div className="cmp-detail__chips">
                {offer.accessModes.map((am) => (
                  <span className="cmp-detail__chip" key={"am" + am.id}>
                    {extractHtmlText(am?.content)}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Autres avantages */}
          {formula?.advantages?.length > 0 && (
            <div className="cmp-detail__section">
              <h4 className="cmp-detail__section-title">Autres avantages</h4>
              <ul className="cmp-detail__advantages">
                {formula.advantages.map((adv, i) => (
                  <li key={"adv" + i}>
                    {extractHtmlText(adv.title)} {extractHtmlText(adv.description)}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </Dialog>
  );
}
