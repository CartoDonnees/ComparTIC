import { filterByZone } from "@/services/filter/zoneFilter";

export const handleInitFilter = (
  filters,
  formulas,
  selectedOperators,
  sideControl,
) => {

  let _formulas = [];

  if (filters?.offerType == 1) {
    _formulas = formulas.filter((o) => o.offer.specialPromotion == null);
  } else if (filters?.offerType == 2) {
    _formulas = formulas.filter((f) => f.offer.specialPromotion != null);

  }

  if (selectedOperators) {
    if (_formulas?.length === 0) {
      //FILTRER LES OPERATEURS EN CAS DE SELECTION
      selectedOperators.forEach((oper) => {
        formulas
          .filter((a) => a.offer.operator.id == oper.id)
          .map((o) => _formulas.push(o));
      });
    } else {
      //FILTRER LES OPERATEURS EN CAS DE SELECTION
      const __formula = _formulas;
      _formulas = [];

      selectedOperators.forEach((oper) => {
        __formula
          .filter((a) => a.offer.operator.id == oper.id)
          .map((o) => _formulas.push(o));
      });
    }
  } else {
    if (_formulas?.length === 0) {
      _formulas = formulas;
    }
  }

  // ---- ZONE : International / Roaming --------------------------------------
  // BUGFIX: l ancien bloc appliquait DEUX FOIS la même condition
  // (area.title == "INTERNATIONAL") : la zone géographique et le pays choisis
  // n étaient jamais pris en compte. Le Roaming, lui, n était pas filtré du
  // tout. Les deux passent désormais par `filterByZone`.
  if (sideControl?.internat) {
    _formulas = filterByZone(
      _formulas,
      "INTERNATIONAL",
      filters?.interMainorgs,
      filters?.interCountry,
    );
  } else if (sideControl?.roaming) {
    _formulas = filterByZone(
      _formulas,
      "ROAMING",
      filters?.roamMainorgs,
      filters?.roamCountry,
    );
  }
  // NB : le panneau National reste volontairement inchangé   il laisse remonter
  // toutes les zones, comme auparavant. Le restreindre modifierait l affichage
  // par défaut du comparateur, ce qui dépasse la correction demandée.

  if (filters?.category) {
    if (filters?.category == 1) {
      _formulas = _formulas.filter((o) => o.offer.category == "MOBILE");
    } else if (filters?.category == 2) {
      _formulas = _formulas.filter((o) => o.offer.category == "FIXE");
    }
  }

  if (filters?.cTPrepay && !filters?.cTPostpay && !filters?.cTHybride) {
    //PREPAID
    _formulas = _formulas.filter((o) => o.offer.billingType == "PREPAID");
  } else if (filters?.cTPostpay && !filters?.cTPrepay && !filters?.cTHybride) {
    //POSTPAID
    _formulas = _formulas.filter((o) => o.offer.billingType == "POSTPAID");
  } else if (filters?.cTHybride && !filters?.cTPrepay && !filters?.cTPostpay) {
    //HYBRID
    _formulas = _formulas.filter((o) => o?.offer.billingType == "HYBRID");
  } else if (filters?.cTPrepay && filters?.cTPostpay && !filters?.cTHybride) {
    //HYBRID EXCLUDED
    _formulas = _formulas.filter((o) => o?.offer.billingType != "HYBRID");
  } else if (filters?.cTPrepay && filters?.cTHybride && !filters?.cTPostpay) {
    //POSTPAID EXCLUDED
    _formulas = _formulas.filter((o) => o?.offer.billingType != "POSTPAID");
  } else if (filters?.cTPostpay && filters?.cTHybride && !filters?.cTPrepay) {
    //PREPAID EXCLUDED
    _formulas = _formulas.filter((o) => o?.offer.billingType != "PREPAID");
  }

  //NATIONAL
  if (sideControl?.national && !sideControl?.international) {
    if (sideControl?.need) {
      //VOICE
      if (
        (filters?.call_volume_min == 0 || filters?.call_volume_min) &&
        filters?.call_volume_max
      ) {
        _formulas = _formulas.filter((o) =>
          o?.serviceDetail.some((s) => s?.service.title === "VOIX"),
        );

        if (filters?.call_volume_max == -1) {
          _formulas = _formulas.filter((f) =>
            f.serviceDetail.some(
              (s) =>
                s?.service.title === "VOIX" &&
                s?.quantity >= filters?.call_volume_min,
            ),
          );
        } else {
          _formulas = _formulas.filter(
            (f) =>
              f.serviceDetail.some(
                (s) =>
                  s?.service.title === "VOIX" &&
                  s?.quantity >= filters?.call_volume_min,
              ) &&
              // BUGFIX : la borne haute ne vérifiait pas le service, donc un
              // SMS ou un volume internet sous la borne suffisait à retenir la
              // formule. Même contrôle que pour les SMS et l'internet.
              f.serviceDetail.some(
                (s) =>
                  s?.service.title === "VOIX" &&
                  s.quantity <= filters.call_volume_max,
              ),
          );
        }

      }

      if (
        (filters?.nb_sms_min == 0 || filters?.nb_sms_min) &&
        filters?.nb_sms_max
      ) {
        _formulas = _formulas.filter((o) =>
          o?.serviceDetail.some((s) => s.service.title === "SMS"),
        );

        if (filters?.nb_sms_max == -1) {
          _formulas = _formulas.filter((f) =>
            f.serviceDetail.some(
              (s) =>
                s?.service.title === "SMS" && s.quantity >= filters?.nb_sms_min,
            ),
          );
        } else {
          _formulas = _formulas.filter(
            (f) =>
              f.serviceDetail.some(
                (s) =>
                  s?.service.title === "SMS" &&
                  s?.quantity >= filters?.nb_sms_min,
              ) &&
              f.serviceDetail.some(
                (s) =>
                  s?.service.title === "SMS" &&
                  s.quantity <= filters.nb_sms_max,
              ),
          );
        }
      }

      if (
        (filters?.data_volume_min == 0 || filters?.data_volume_min) &&
        filters?.data_volume_max
      ) {
        _formulas = _formulas.filter((o) =>
          o?.serviceDetail.some((s) => s.service.title === "DATA"),
        );

        if (filters?.data_volume_max == -1) {
          _formulas = _formulas.filter((f) =>
            f.serviceDetail.some(
              (s) =>
                s?.service.title === "DATA" &&
                s?.quantity >= filters?.data_volume_min,
            ),
          );
        } else {
          _formulas = _formulas.filter(
            (f) =>
              f.serviceDetail.some(
                (s) =>
                  s?.service.title === "DATA" &&
                  s?.quantity >= filters?.data_volume_min,
              ) &&
              f.serviceDetail.some(
                (s) =>
                  s?.service.title === "DATA" &&
                  s?.quantity <= filters.data_volume_max,
              ),
          );
        }
      }
    } else if (sideControl?.budget) {
      if ((filters?.budg_min == 0 || filters?.budg_min) && filters?.budg_max) {
        _formulas = _formulas.filter(
          (f) =>
            f?.price?.value >= filters?.budg_min &&
            f?.price?.value <= filters?.budg_max,
        );
      }
      if (
        (filters?.period_min == 0 || filters?.period_min) &&
        filters?.period_max
      ) {
        _formulas = _formulas.filter(
          (f) =>
            f?.validity >= filters?.period_min &&
            f?.validity <= filters?.period_max,
        );
      }
    }
  } else if (!sideControl?.national && sideControl?.international) {
  }

  //INTERNATIONAL

  return _formulas;
};

export const sortOffers = (data, key, order = "asc") => {
  const sorted = [...data];

  sorted.sort((a, b) => {
    let valA, valB;

    switch (key) {
      case "price":
        valA = a.price?.value ?? 0;
        valB = b.price?.value ?? 0;
        break;

      case "validity":
        valA = a.validity ?? 0;
        valB = b.validity ?? 0;
        break;

      case "voice":
        valA =
          a.serviceDetail?.find((sd) => sd.service?.title === "VOIX")
            ?.quantity || 0;
        valB =
          b.serviceDetail?.find((sd) => sd.service?.title === "VOIX")
            ?.quantity || 0;
        break;

      case "sms":
        valA =
          a.serviceDetail?.find((sd) => sd.service?.title === "SMS")
            ?.quantity || 0;
        valB =
          b.serviceDetail?.find((sd) => sd.service?.title === "SMS")
            ?.quantity || 0;
        break;

      case "data":
        valA =
          a.serviceDetail?.find((sd) => sd.service?.title === "DATA")
            ?.quantity || 0;
        valB =
          b.serviceDetail?.find((sd) => sd.service?.title === "DATA")
            ?.quantity || 0;
        break;

      default:
        return 0;
    }
    if (order == "asc") {
      return valB - valA;
    } else {
      return valA - valB;
    }
  });

  return sorted;
};
