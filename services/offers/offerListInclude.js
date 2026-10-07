/**
 * Relations chargées avec une offre pour les listes de gestion (Gestion des
 * offres, onglet Monitoring) : une seule définition, pour que les deux
 * onglets présentent exactement les mêmes informations.
 */
export const OFFER_LIST_INCLUDE = {
  // Necessaire a la pre-selection du champ « offre parente ».
  parent: { select: { id: true, code: true, title: true } },
  operator: {
    select: {
      id: true,
      code: true,
      name: true,
      color: true,
      imagePath: true,
    },
  },
  area: {
    select: {
      id: true,
      title: true,
      // Organisations et pays retenus pour cette offre : indispensables
      // pour recocher l'étape 3 lors d'une modification.
      areaOrganizations: {
        select: {
          id: true,
          organization: { select: { id: true, code: true, name: true } },
          organisationCountries: {
            select: {
              id: true,
              country: { select: { id: true, code: true, name: true } },
            },
          },
        },
      },
    },
  },
  document: {
    select: {
      id: true,
      path: true,
    },
  },
  profiles: true,
  accessModes: {
    select: {
      id: true,
      content: true,
    },
  },
  formulas: {
    include: {
      price: {
        select: {
          id: true,
          value: true,
        },
      },
      serviceDetail: {
        select: {
          id: true,
          quantity: true,
          billingSteps: true,
          comtype: true,
          service: {
            select: {
              id: true,
              code: true,
              title: true,
            },
          },
          offerRate: {
            select: {
              id: true,
              value: true,
            },
          },
        },
      },
      advantages: true,
    },
  },
  // validation: {
  //   comments:true
  // },
  specialPromotion: true,
  monitorings: true,
  validation:{
    include:{
      comments:true,
    }
  }
};

export default OFFER_LIST_INCLUDE;
