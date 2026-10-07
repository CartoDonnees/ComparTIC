const { PrismaClient } = require("@prisma/client");
const { title } = require("process");

const prisma = new PrismaClient();

const baseOffers = [
  /// ====== OFFRES ORANGE ======= ///
  /// ====== OFFRES ORANGE ======= ///
  /// ====== OFFRES ORANGE ======= ///
  /// ====== OFFRES ORANGE ======= ///
  /// ====== OFFRES ORANGE ======= ///
  //OFFRE INCONNUE
  {
    code: "OF-000000000000000",
    operator: {
      code: "OPE-000",
    },
    notifDate: "2024-01-01",
    startDate: "2024-02-05",
    duration: "1000000",
    title: "Offre Inconnu",
    target: "",
    type: "2", //OFFRE DE BASE
    billingType: "1", //TYPE DE FACTURATION
    category: "1", //MOBILE
    link: null,
    description:
      "<p>Offre de réference pour les offre ayant des parents inconnus</p> ",
    status: "DONE",
    area: {
      title: "NATIONALE",
    },
  },

  //PASS INTERNET ORANGE
  {
    code: "OF-11111111111111",
    operator: {
      code: "OPE-001",
    },
    notifDate: "2024-01-01",
    startDate: "2024-02-05",
    duration: "365",
    title: "Pass Internet",
    target: "<p>Client orange Prépayés et community uniquement</p>",
    type: "2", //OFFRE DE BASE
    billingType: "1", //TYPE DE FACTURATION
    category: "1", //MOBILE
    link: null,
    description: "<p>Pass internet</p></p>",
    status: "PENDING",
    formulas: [
      // 2Jrs
      {
        type: "price",
        title: "Pass Internet 2jrs",
        description: "",
        settlement: {
          price: "200",
          validity: "2",
          services: {
            DATA: true,
            quantityDATA: "220",
            // "bStepVOIX": "3",
            // "comTypeVOIX": "ON_NET"
          },
        },
      },

      // 3Jrs
      {
        type: "price",
        title: "Pass Internet 3jrs",
        description: "",
        settlement: {
          price: "300",
          validity: "3",
          services: {
            DATA: true,
            quantityDATA: "340",
            // "bStepVOIX": "3",
            // "comTypeVOIX": "ON_NET"
          },
        },
      },
      {
        type: "price",
        title: "Pass Internet 3jrs",
        description: "",
        settlement: {
          price: "500",
          validity: "3",
          services: {
            DATA: true,
            quantityDATA: "750",
            // "bStepVOIX": "3",
            // "comTypeVOIX": "ON_NET"
          },
        },
      },

      // 7Jrs
      {
        type: "price",
        title: "Pass Internet semaine",
        description: "",
        settlement: {
          price: "1000",
          validity: "7",
          services: {
            DATA: true,
            quantityDATA: "1536",
            // "bStepVOIX": "3",
            // "comTypeVOIX": "ON_NET"
          },
        },
      },
      {
        type: "price",
        title: "Pass Internet Semaine",
        description: "",
        settlement: {
          price: "1500",
          validity: "7",
          services: {
            DATA: true,
            quantityDATA: "2560",
            // "bStepVOIX": "3",
            // "comTypeVOIX": "ON_NET"
          },
        },
      },

      // Social
      {
        type: "price",
        title: "Pass Internet Social",
        description: "",
        settlement: {
          price: "300",
          validity: "3",
          services: {
            DATA: true,
            quantityDATA: "450",
            // "bStepVOIX": "3",
            // "comTypeVOIX": "ON_NET"
          },
        },
      },

      // Tik Tok
      {
        type: "price",
        title: "Pass Internet Tik tok",
        description: "",
        settlement: {
          price: "300",
          validity: "7",
          services: {
            DATA: true,
            quantityDATA: "600",
            // "bStepVOIX": "3",
            // "comTypeVOIX": "ON_NET"
          },
        },
      },

      // Mois
      {
        type: "price",
        title: "Pass Internet Mois",
        description: "",
        settlement: {
          price: "2500",
          validity: "30",
          services: {
            DATA: true,
            quantityDATA: "3584",
            // "bStepVOIX": "3",
            // "comTypeVOIX": "ON_NET"
          },
        },
      },
      {
        type: "price",
        title: "Pass Internet Mois",
        description: "",
        settlement: {
          price: "5000",
          validity: "30",
          services: {
            DATA: true,
            quantityDATA: "7372.8",
            // "bStepVOIX": "3",
            // "comTypeVOIX": "ON_NET"
          },
        },
      },
      {
        type: "price",
        title: "Pass internet Mois",
        description: "",
        settlement: {
          price: "10000",
          validity: "30",
          services: {
            DATA: true,
            quantityDATA: "15360",
            // "bStepVOIX": "3",
            // "comTypeVOIX": "ON_NET"
          },
        },
      },
      {
        type: "price",
        title: "Pass Internet Mois",
        description: "",
        settlement: {
          price: "20000",
          validity: "30",
          services: {
            DATA: true,
            quantityDATA: "36864",
            // "bStepVOIX": "3",
            // "comTypeVOIX": "ON_NET"
          },
        },
      },
    ],
    area: {
      title: "NATIONALE",
    },
    accessModes: [
      {
        content: "<p>#111#</p>",
      },
    ],
  },

  // PASS MIX ORANGE
  {
    code: "OF-222222222222222",
    operator: {
      code: "OPE-001", //ORANGE
    },
    notifDate: "2024-01-01",
    startDate: "2024-02-05",
    duration: "365",
    title: "PASS MIX",
    target: "<p>Client orange Prépayés et community uniquement</p>",
    type: "2", //OFFRE DE BASE
    billingType: "1", //TYPE DE FACTURATION
    category: "1", //MOBILE
    link: null,
    description: "<p>Pass Pass mix",
    status: "PENDING",
    formulas: [
      // // 1jrs
      {
        type: "price",
        title: "Pass Mix jour",
        description: "",
        settlement: {
          price: "300",
          validity: "3",
          services: {
            VOIX: true,
            quantityVOIX: "27",
            comTypeVOIX: "ALL_NET",
            DATA: true,
            quantityDATA: "50",
            bStepVOIX: "3",
            comTypeVOIX: "ON_NET",
          },
        },
      },
      {
        type: "price",
        title: "Pass Mix Jour",
        description: "",
        settlement: {
          price: "400",
          validity: "3",
          services: {
            VOIX: true,
            quantityVOIX: "50",
            comTypeVOIX: "ALL_NET",
            DATA: true,
            quantityDATA: "100",
            bStepVOIX: "3",
            comTypeVOIX: "ON_NET",
          },
        },
      },

      // // Semaine
      {
        type: "price",
        title: "Pass Mix Semaine",
        description: "",
        settlement: {
          price: "500",
          validity: "7",
          services: {
            VOIX: true,
            quantityVOIX: "50",
            comTypeVOIX: "ALL_NET",
            SMS: true,
            quantitySMS: "300",
            comTypeSMS: "ALL_NET",
            DATA: true,
            quantityDATA: "250",
            bStepVOIX: "3",
          },
        },
      },
      {
        type: "price",
        title: "Pass Mix Semaine",
        description: "",
        settlement: {
          price: "1000",
          validity: "7",
          services: {
            VOIX: true,
            quantityVOIX: "100",
            comTypeVOIX: "ALL_NET",
            SMS: true,
            quantitySMS: "300",
            comTypeSMS: "ALL_NET",
            DATA: true,
            quantityDATA: "1024",
            bStepVOIX: "3",
          },
        },
      },
      {
        type: "price",
        title: "Pass Mix Semaine",
        description: "",
        settlement: {
          price: "1500",
          validity: "7",
          services: {
            VOIX: true,
            quantityVOIX: "200",
            comTypeVOIX: "ALL_NET",
            SMS: true,
            quantitySMS: "300",
            comTypeSMS: "ALL_NET",
            DATA: true,
            quantityDATA: "1536",
            bStepVOIX: "3",
          },
        },
      },

      // // Mois
      {
        type: "price",
        title: "Pass Mois",
        description: "",
        settlement: {
          price: "3000",
          validity: "30",
          services: {
            VOIX: true,
            quantityVOIX: "250",
            comTypeVOIX: "ALL_NET",
            SMS: true,
            quantitySMS: "500",
            comTypeSMS: "ALL_NET",
            DATA: true,
            quantityDATA: "2560",
            bStepVOIX: "3",
          },
        },
      },
      {
        type: "price",
        title: "Pass Mois",
        description: "",
        settlement: {
          price: "5000",
          validity: "30",
          services: {
            VOIX: true,
            quantityVOIX: "400",
            comTypeVOIX: "ALL_NET",
            SMS: true,
            quantitySMS: "500",
            comTypeSMS: "ALL_NET",
            DATA: true,
            quantityDATA: "5120",
            bStepVOIX: "3",
          },
        },
      },
      {
        type: "price",
        title: "Pass Mois",
        description: "",
        settlement: {
          price: "10000",
          validity: "30",
          services: {
            VOIX: true,
            quantityVOIX: "500",
            comTypeVOIX: "ALL_NET",
            SMS: true,
            quantitySMS: "500",
            comTypeSMS: "ALL_NET",
            DATA: true,
            quantityDATA: "10240",
            bStepVOIX: "3",
          },
        },
      },
      {
        type: "price",
        title: "Pass Mois",
        description: "",
        settlement: {
          price: "20000",
          validity: "30",
          services: {
            VOIX: true,
            quantityVOIX: "1200",
            comTypeVOIX: "ALL_NET",
            SMS: true,
            quantitySMS: "500",
            comTypeSMS: "ALL_NET",
            DATA: true,
            quantityDATA: "20480",
            bStepVOIX: "3",
          },
        },
      },
    ],
    area: {
      title: "NATIONALE",
    },
    accessModes: [
      {
        content: "<p>#111#</p>",
      },
    ],
  },

  // //PASS KDO ORANGE
  {
    code: "OF-333333333333333",
    operator: {
      code: "OPE-001", //ORANGE
    },
    notifDate: "2024-01-01",
    startDate: "2024-02-05",
    duration: "365",
    title: "Pass KDO",
    target: "<p>Client orange Prépayés et community uniquement</p>",
    type: "2", //OFFRE DE BASE
    billingType: "1", //TYPE DE FACTURATION
    category: "1", //MOBILE
    link: null,
    description: "<p>Pass KDO</p></p>",
    status: "PENDING",
    formulas: [
      // KDO
      {
        type: "price",
        title: "Pass KDO",
        description: "",
        settlement: {
          price: "500",
          validity: "3",
          services: {
            VOIX: true,
            quantityVOIX: "50",
            comTypeVOIX: "ALL_NET",
            // "DATA": true,
            // "quantityDATA": "50",
            // "bStepVOIX": "3",
            // "comTypeVOIX": "ON_NET"
          },
        },
      },
      // KDO Mois
      {
        type: "price",
        title: "Pass KDO Mois",
        description: "",
        settlement: {
          price: "3200",
          validity: "30",
          services: {
            VOIX: true,
            quantityVOIX: "250",
            comTypeVOIX: "ALL_NET",
            SMS: true,
            quantitySMS: "500",
            comTypeSMS: "ALL_NET",
            DATA: true,
            quantityDATA: "2560",
            // "bStepVOIX": "3",
            // "comTypeVOIX": "ON_NET"
          },
        },
      },
    ],
    area: {
      title: "NATIONALE",
    },
    accessModes: [
      {
        content: "<p>#111#</p>",
      },
    ],
  },

  // PASS DATA
  {
    code: "OF-444444444444444",
    operator: {
      code: "OPE-001", //ORANGE
    },
    notifDate: "2024-01-01",
    startDate: "2024-02-05",
    duration: "365",
    title: "Pass Data",
    target: "<p>Clients orange Prépayés</p>",
    type: "2", //OFFRE DE BASE
    billingType: "1", //TYPE DE FACTURATION
    category: "1", //MOBILE
    link: null,
    description: "<p>Pass Data. </p><p>Cumulable, non cumul de validité</p>",
    status: "PENDING",
    formulas: [
      // 2jrs
      //   {
      //     type: "price",
      //     title: "Pass Data",
      //     description: "",
      //     settlement: {
      //       price: "200",
      //       validity: "2",
      //       services: {
      //         // VOIX: true,
      //         // "quantityVOIX": "50",
      //         // "comTypeVOIX": "ALL_NET",
      //         DATA: true,
      //         quantityDATA: "220",
      //         // "bStepVOIX": "3",
      //         // "comTypeVOIX": "ON_NET"
      //       },
      //     },
      //   },

      // 3jrs
      {
        type: "price",
        title: "Pass Data",
        description: "",
        settlement: {
          price: "300",
          validity: "3",
          services: {
            // VOIX: true,
            // "quantityVOIX": "50",
            // "comTypeVOIX": "ALL_NET",
            DATA: true,
            quantityDATA: "340",
            // "bStepVOIX": "3",
            // "comTypeVOIX": "ON_NET"
          },
        },
      },
    ],
    area: {
      title: "NATIONALE",
    },
    accessModes: [
      {
        content: "<p>#111#</p>",
      },
      {
        content: "<p>App Max it</p>",
      },
    ],
  },

  //PASS AFRIQUE
  {
    code: "OF-0101010101",
    operator: {
      code: "OPE-001", //MOOV
    },
    notifDate: "2024-01-01",
    startDate: "2024-01-05",
    duration: "1",
    title: "Pass Afrique",
    target: "<p>Clients Orange prépayés et hybrides</p>",
    type: "1", //OFFRE DE BASE
    billingType: "1", //TYPE DE FACTURATION PRIX - TARIF
    category: "1", //MOBILE
    link: null,
    description: "<p>Minutes augmentées sur pass</p>",
    status: "PENDING",
    formulas: [
      //Jour
      {
        type: "price",
        title: "Pass Afrique",
        description: "Minutes augmentées sur pass Afrique 500F",
        settlement: {
          price: "500",
          validity: "1",
          services: {
            VOIX: true,
            quantityVOIX: "3",
            comTypeVOIX: "ON_NET",
            // "bStepVOIX": "3",
          },
        },
      },
      {
        type: "price",
        title: "Pass Afrique",
        description: "Minutes augmentées sur pass Afrique 1000F",
        settlement: {
          price: "1000",
          validity: "1",
          services: {
            VOIX: true,
            quantityVOIX: "7",
            comTypeVOIX: "ON_NET",
            // "bStepVOIX": "3",
          },
        },
      },
    ],
    area: {
      title: "INTERNATIONALE",
      organizations: [
        {
          code: "DEST-00001110",
          name: "Afrique",
          countries: [
            // { code: "PYS-002" }, // Afrique du Sud
            // { code: "PYS-004" }, // Algérie
            // { code: "PYS-007" }, // Angola
            // { code: "PYS-021" }, // Bénin
            { code: "PYS-031" }, // Burkina Faso //
            // { code: "PYS-032" }, // Burundi
            // { code: "PYS-034" }, // Cameroun
            // { code: "PYS-036" }, // Cap-Vert
            // { code: "PYS-041" }, // Comores
            // { code: "PYS-042" }, // Congo (Brazzaville)
            // { code: "PYS-043" }, // Congo (RDC)
            // { code: "PYS-047" }, // Côte d'Ivoire
            // { code: "PYS-051" }, // Djibouti
            // { code: "PYS-053" }, // Égypte
            // { code: "PYS-056" }, // Érythrée
            // { code: "PYS-061" }, // Éthiopie
            // { code: "PYS-065" }, // Gabon
            // { code: "PYS-066" }, // Gambie
            // { code: "PYS-068" }, // Ghana
            // { code: "PYS-101" }, // Libéria
            // { code: "PYS-102" }, // Libye
            // { code: "PYS-107" }, // Madagascar
            // { code: "PYS-109" }, // Malawi
            { code: "PYS-111" }, // Mali //
            // { code: "PYS-113" }, // Maroc
            // { code: "PYS-114" }, // Maurice
            // { code: "PYS-115" }, // Mauritanie
            // { code: "PYS-122" }, // Mozambique
            // { code: "PYS-123" }, // Namibie
            // { code: "PYS-127" }, // Niger
            // { code: "PYS-128" }, // Nigeria
            // { code: "PYS-145" }, // République centrafricaine
            // { code: "PYS-151" }, // Rwanda
            // { code: "PYS-158" }, // Sao Tomé-et-Principe
            { code: "PYS-159" }, // Sénégal //
            // { code: "PYS-161" }, // Seychelles
            // { code: "PYS-162" }, // Sierra Leone
            // { code: "PYS-166" }, // Somalie
            // { code: "PYS-167" }, // Soudan
            // { code: "PYS-168" }, // Soudan du Sud
            // { code: "PYS-174" }, // Tanzanie
            // { code: "PYS-175" }, // Tchad
            // { code: "PYS-178" }, // Togo
            // { code: "PYS-181" }, // Tunisie
            // { code: "PYS-192" }, // Zambie
            // { code: "PYS-193" }, // Zimbabwe
          ],
        },
      ],
    },
    accessModes: [
      {
        content: " ",
      },
    ],
  },

  //PASS cEDEAO
  {
    code: "OF-01010101102",
    operator: {
      code: "OPE-001", //MOOV
    },
    notifDate: "2024-01-01",
    startDate: "2024-01-05",
    duration: "1",
    title: "Pass CEDEAO",
    target: "<p>Clients Orange prépayés et hybrides</p>",
    type: "1", //OFFRE DE BASE
    billingType: "1", //TYPE DE FACTURATION PRIX - TARIF
    category: "1", //MOBILE
    link: null,
    description: "<p>Minutes augmentées sur pass CEDEAO</p>",
    status: "PENDING",
    formulas: [
      //Jour
      {
        type: "price",
        title: "Pass Afrique",
        description: "Minutes augmentées sur pass CDEAO 500F",
        settlement: {
          price: "500",
          validity: "1",
          services: {
            VOIX: true,
            quantityVOIX: "7",
            comTypeVOIX: "ON_NET",
            // "bStepVOIX": "3",
          },
        },
      },
      {
        type: "price",
        title: "Pass Afrique",
        description: "Minutes augmentées sur pass CDEAO 1000F",
        settlement: {
          price: "1000",
          validity: "1",
          services: {
            VOIX: true,
            quantityVOIX: "7",
            comTypeVOIX: "ON_NET",
            // "bStepVOIX": "3",
          },
        },
      },
    ],
    area: {
      title: "INTERNATIONALE",
      organizations: [
        {
          code: "DEST-00001110",
          name: "Afrique",
          countries: [
            // { code: "PYS-002" }, // Afrique du Sud
            // { code: "PYS-004" }, // Algérie
            // { code: "PYS-007" }, // Angola
            // { code: "PYS-021" }, // Bénin
            { code: "PYS-031" }, // Burkina Faso //
            // { code: "PYS-032" }, // Burundi
            // { code: "PYS-034" }, // Cameroun
            // { code: "PYS-036" }, // Cap-Vert
            // { code: "PYS-041" }, // Comores
            // { code: "PYS-042" }, // Congo (Brazzaville)
            // { code: "PYS-043" }, // Congo (RDC)
            // { code: "PYS-047" }, // Côte d'Ivoire
            // { code: "PYS-051" }, // Djibouti
            // { code: "PYS-053" }, // Égypte
            // { code: "PYS-056" }, // Érythrée
            // { code: "PYS-061" }, // Éthiopie
            // { code: "PYS-065" }, // Gabon
            // { code: "PYS-066" }, // Gambie
            // { code: "PYS-068" }, // Ghana
            // { code: "PYS-101" }, // Libéria
            // { code: "PYS-102" }, // Libye
            // { code: "PYS-107" }, // Madagascar
            // { code: "PYS-109" }, // Malawi
            { code: "PYS-111" }, // Mali //
            // { code: "PYS-113" }, // Maroc
            // { code: "PYS-114" }, // Maurice
            // { code: "PYS-115" }, // Mauritanie
            // { code: "PYS-122" }, // Mozambique
            // { code: "PYS-123" }, // Namibie
            // { code: "PYS-127" }, // Niger
            // { code: "PYS-128" }, // Nigeria
            // { code: "PYS-145" }, // République centrafricaine
            // { code: "PYS-151" }, // Rwanda
            // { code: "PYS-158" }, // Sao Tomé-et-Principe
            { code: "PYS-159" }, // Sénégal //
            // { code: "PYS-161" }, // Seychelles
            // { code: "PYS-162" }, // Sierra Leone
            // { code: "PYS-166" }, // Somalie
            // { code: "PYS-167" }, // Soudan
            // { code: "PYS-168" }, // Soudan du Sud
            // { code: "PYS-174" }, // Tanzanie
            // { code: "PYS-175" }, // Tchad
            // { code: "PYS-178" }, // Togo
            // { code: "PYS-181" }, // Tunisie
            // { code: "PYS-192" }, // Zambie
            // { code: "PYS-193" }, // Zimbabwe
          ],
        },
      ],
    },
    accessModes: [
      {
        content: " ",
      },
    ],
  },

  //BAISSE TARIFAIRE ORANGE FRANCE
  {
    code: "M_ORGS-200",
    name: "EUROPE",
    code: "OF-01010101022221",
    operator: {
      code: "OPE-001", //MOOV
    },
    notifDate: "2024-01-01",
    startDate: "2024-01-05",
    duration: "1",
    title: "Baisse tarifaire Orange France",
    target: "<p>Clients Orange prépayés et hybrides</p>",
    type: "1", //OFFRE DE BASE
    billingType: "1", //TYPE DE FACTURATION PRIX - TARIF
    category: "1", //MOBILE
    link: null,
    description: "<p>Minutes augmentées sur pass</p>",
    status: "PENDING",
    formulas: [
      //Jour
      {
        type: "price",
        title: "Pass Afrique",
        description: "Minutes augmentées sur pass Afrique 500F",
        settlement: {
          price: "500",
          validity: "1",
          services: {
            VOIX: true,
            quantityVOIX: "7",
            comTypeVOIX: "ON_NET",
            // "bStepVOIX": "3",
          },
        },
      },
      {
        type: "price",
        title: "Pass CEDEAO",
        description: "",
        settlement: {
          price: "200",
          validity: "1",
          services: {
            VOIX: true,
            quantityVOIX: "3",
            comTypeVOIX: "ON_NET",
            // "bStepVOIX": "3",
          },
        },
      },
    ],
    area: {
      title: "INTERNATIONALE",
      organizations: [
        {
          code: "DEST-000111100",
          name: "Europe",
          countries: [
            { code: "PYS-064" }, // France
          ],
        },
      ],
    },
    accessModes: [
      {
        content: " ",
      },
    ],
  },

  /// ====== FIN OFFRES ORANGE ======= ///
  /// ====== FIN OFFRES ORANGE ======= ///
  /// ====== FIN OFFRES ORANGE ======= ///

  /// ====== OFFRES MTN ======= ///
  /// ====== OFFRES MTN ======= ///
  /// ====== OFFRES MTN ======= ///

  // MTN C'CHIC
  {
    code: "OF-555555555555555",
    operator: {
      code: "OPE-010", //MTN
    },
    notifDate: "2024-01-01",
    startDate: "2024-02-05",
    duration: "365",
    title: "MTN C’Chic",
    target: "<p>Clients Mtn Prépayés</p>",
    type: "2", //OFFRE DE BASE
    billingType: "1", //TYPE DE FACTURATION
    category: "1", //MOBILE
    link: null,
    description: "<p>Moov Folie</p>",
    status: "PENDING",
    formulas: [
      //Semaine
      {
        type: "price",
        title: "MTN C’Chic",
        description: "",
        settlement: {
          price: "1000",
          validity: "7",
          services: {
            DATA: true,
            quantityDATA: "6144",
            // "bStepVOIX": "3",
          },
        },
        advantages: [
          {
            name: "Facebook ",
            description: "<p>Illimités (23h–07h)</p>",
          },
          {
            name: "<p>WhatsApp</p>",
            description: "<p>Illimités (23h–07h)</p>",
          },
          {
            name: "MTN Zik StarNews Vidéo",
            description: "",
          },
        ],
      },
      {
        type: "price",
        title: "MTN C’Chic",
        description: "",
        settlement: {
          price: "1500",
          validity: "7",
          services: {
            DATA: true,
            quantityDATA: "10240",
            // "bStepVOIX": "3",
          },
        },
        advantages: [
          {
            name: "Facebook ",
            description: "<p>Illimités (23h–07h)</p>",
          },
          {
            name: "<p>WhatsApp</p>",
            description: "<p>Illimités (23h–07h)</p>",
          },
          {
            name: "MTN Zik StarNews Vidéo",
            description: "",
          },
        ],
      },
      {
        type: "price",
        title: "MTN C’Chic",
        description: "",
        settlement: {
          price: "2500",
          validity: "10",
          services: {
            DATA: true,
            quantityDATA: "10240",
            // "bStepVOIX": "3",
          },
        },
        advantages: [
          {
            name: "Facebook ",
            description: "<p>Illimités (23h–07h)</p>",
          },
          {
            name: "<p>WhatsApp</p>",
            description: "<p>Illimités (23h–07h)</p>",
          },
          {
            name: " StarNews Vidéo Gaming",
            description: "",
          },
        ],
      },
      {
        type: "price",
        title: "MTN C’Chic",
        description: "",
        settlement: {
          price: "4000",
          validity: "15",
          services: {
            DATA: true,
            quantityDATA: "40960",
            // "bStepVOIX": "3",
          },
        },
        advantages: [
          {
            name: "Facebook ",
            description: "<p>Illimités (23h–07h)</p>",
          },
          {
            name: "<p>WhatsApp</p>",
            description: "<p>Illimités (23h–07h)</p>",
          },
          {
            name: " StarNews Vidéo Gaming",
            description: "",
          },
        ],
      },
    ],
    area: {
      title: "NATIONALE",
    },
    accessModes: [
      {
        content: "<p>*500#</p>",
      },
    ],
  },
  {
    code: "OF-666666666666666",
    operator: {
      code: "OPE-010", //MTN
    },
    notifDate: "2024-01-01",
    startDate: "2024-02-05",
    duration: "365",
    title: "Packs Appels",
    target: "<p>Clients Mtn Prépayés</p>",
    type: "2", //OFFRE DE BASE
    billingType: "1", //TYPE DE FACTURATION
    category: "1", //MOBILE
    link: null,
    description: "<p>Moov Folie</p>",
    status: "PENDING",
    formulas: [
      {
        type: "price",
        title: "Pack Appel",
        description: "",
        settlement: {
          price: "200",
          validity: "2",
          services: {
            VOIX: true,
            quantityVOIX: "20",
            comTypeVOIX: "ALL_NET",
            // SMS: true,
            // quantitySMS: "1000",
            // comTypeSMS: "ALL_NET",
            // DATA: true,
            // quantityDATA: "30720",
            // "bStepVOIX": "3",
            // "comTypeVOIX": "ON_NET"
          },
        },
      },
      {
        type: "price",
        title: "Pack Appel",
        description: "",
        settlement: {
          price: "300",
          validity: "2",
          services: {
            VOIX: true,
            quantityVOIX: "35",
            comTypeVOIX: "ALL_NET",
            // SMS: true,
            // quantitySMS: "1000",
            // comTypeSMS: "ALL_NET",
            // DATA: true,
            // quantityDATA: "30720",
            // "bStepVOIX": "3",
            // "comTypeVOIX": "ON_NET"
          },
        },
      },
      {
        type: "price",
        title: "Pack Appel",
        description: "",
        settlement: {
          price: "500",
          validity: "5",
          services: {
            VOIX: true,
            quantityVOIX: "70",
            comTypeVOIX: "ALL_NET",
            // SMS: true,
            // quantitySMS: "1000",
            // comTypeSMS: "ALL_NET",
            // DATA: true,
            // quantityDATA: "30720",
            // "bStepVOIX": "3",
            // "comTypeVOIX": "ON_NET"
          },
        },
      },
    ],
    area: {
      title: "NATIONALE",
    },
    accessModes: [
      {
        content: "<p>*105*3#</p>",
      },
    ],
  },
  /// ====== FIN OFFRES MTN ======= ///

  /// ====== OFFRES MOOV ======= ///

  // FORFAIT JOURNALIER
  {
    code: "OF-777777777777777",
    operator: {
      code: "OPE-011", //MOOV
    },
    notifDate: "2024-01-01",
    startDate: "2024-02-05",
    duration: "365",
    title: "Forfait Journalier",
    target: "<p>Clients MOOV Prépayés</p>",
    type: "2", //OFFRE DE BASE
    billingType: "1", //TYPE DE FACTURATION
    category: "1", //MOBILE
    link: null,
    description: "<p>Forfait Data</p>",
    status: "PENDING",
    formulas: [
      //Jour
      {
        type: "price",
        title: "Jour Mini",
        description: "",
        settlement: {
          price: "200",
          validity: "2",
          services: {
            // VOIX: true,
            // "quantityVOIX": "50",
            // "comTypeVOIX": "ALL_NET",
            DATA: true,
            quantityDATA: "220",
            // "bStepVOIX": "3",
            // "comTypeVOIX": "ON_NET"
          },
        },
      },
      {
        type: "price",
        title: "Jour Crystal",
        description: "",
        settlement: {
          price: "300",
          validity: "3",
          services: {
            // VOIX: true,
            // "quantityVOIX": "50",
            // "comTypeVOIX": "ALL_NET",
            DATA: true,
            quantityDATA: "340",
            // "bStepVOIX": "3",
            // "comTypeVOIX": "ON_NET"
          },
        },
      },
      {
        type: "price",
        title: "Jour",
        description: "",
        settlement: {
          price: "500",
          validity: "3",
          services: {
            // VOIX: true,
            // "quantityVOIX": "50",
            // "comTypeVOIX": "ALL_NET",
            DATA: true,
            quantityDATA: "750",
            // "bStepVOIX": "3",
            // "comTypeVOIX": "ON_NET"
          },
        },
      },
    ],
    area: {
      title: "NATIONALE",
    },
    accessModes: [
      {
        content: "<p>*303*3#</p>",
      },
    ],
  },

  // BUNDLE MYMIX
  {
    code: "OF-888888888888888",
    operator: {
      code: "OPE-011", //MOOV
    },
    notifDate: "2024-01-01",
    startDate: "2024-02-05",
    duration: "365",
    title: "Bundle MyMix",
    target: "<p>Clients Moov Prépayés</p>",
    type: "2", //OFFRE DE BASE
    billingType: "1", //TYPE DE FACTURATION
    category: "1", //MOBILE
    link: null,
    description: "<p>FAF illimité inclus</p>",
    status: "PENDING",
    formulas: [
      //Jour
      {
        type: "price",
        title: "Bundle MyMix 30jrs",
        description: "",
        settlement: {
          price: "23000",
          validity: "30",
          services: {
            VOIX: true,
            quantityVOIX: "900",
            comTypeVOIX: "ALL_NET",
            SMS: true,
            quantitySMS: "1000",
            comTypeSMS: "ALL_NET",
            DATA: true,
            quantityDATA: "30720",
            // "bStepVOIX": "3",
            // "comTypeVOIX": "ON_NET"
          },
        },
      },
      {
        type: "price",
        title: "Bundle MyMix 30jrs",
        description: "",
        settlement: {
          price: "32000",
          validity: "30",
          services: {
            VOIX: true,
            // "quantityVOIX": "50",
            // "comTypeVOIX": "ALL_NET",
            VOIX: true,
            quantityVOIX: "900",
            comTypeVOIX: "ALL_NET",
            SMS: true,
            quantitySMS: "1000",
            comTypeSMS: "ALL_NET",
            DATA: true,
            quantityDATA: "40960",
            // "bStepVOIX": "3",
            // "comTypeVOIX": "ON_NET"
          },
        },
      },
      {
        type: "price",
        title: "Bundle MyMix 30jrs",
        description: "",
        settlement: {
          price: "37000",
          validity: "30",
          services: {
            VOIX: true,
            quantityVOIX: "900",
            comTypeVOIX: "ALL_NET",
            SMS: true,
            quantitySMS: "1000",
            comTypeSMS: "ALL_NET",
            DATA: true,
            quantityDATA: "51200",
            // "bStepVOIX": "3",
            // "comTypeVOIX": "ON_NET"
          },
        },
      },
    ],
    area: {
      title: "NATIONALE",
    },
    accessModes: [
      {
        content: "<p>Application MyMoov</p>",
      },
    ],
  },

  //MOOV FOLIE
  {
    code: "OF-9999999999999",
    operator: {
      code: "OPE-011", //MOOV
    },
    notifDate: "2024-01-01",
    startDate: "2024-02-05",
    duration: "365",
    title: "Moov Folie",
    target: "<p>Clients Moov Prépayés</p>",
    type: "2", //OFFRE DE BASE
    billingType: "1", //TYPE DE FACTURATION
    category: "1", //MOBILE
    link: null,
    description: "<p>Moov Folie</p>",
    status: "PENDING",
    formulas: [
      //Jour
      {
        type: "price",
        title: "Moov Folie",
        description: "",
        settlement: {
          price: "150",
          validity: "1",
          services: {
            VOIX: true,
            quantityVOIX: "12",
            comTypeVOIX: "ON_NET",
            // "bStepVOIX": "3",
          },
        },
      },
      {
        type: "price",
        title: "Moov Folie",
        description: "",
        settlement: {
          price: "200",
          validity: "2",
          services: {
            VOIX: true,
            quantityVOIX: "20",
            comTypeVOIX: "ON_NET",
            // "bStepVOIX": "3",
          },
        },
      },
      {
        type: "price",
        title: "Moov Folie",
        description: "",
        settlement: {
          price: "300",
          validity: "2",
          services: {
            VOIX: true,
            quantityVOIX: "35",
            comTypeVOIX: "ON_NET",
            // "bStepVOIX": "3",
          },
        },
      },
      {
        type: "price",
        title: "Moov Folie",
        description: "",
        settlement: {
          price: "500",
          validity: "5",
          services: {
            VOIX: true,
            quantityVOIX: "120",
            comTypeVOIX: "ON_NET",
            // "bStepVOIX": "3",
          },
        },
      },
    ],
    area: {
      title: "NATIONALE",
    },
    accessModes: [
      {
        content: "<p>*303*2#</p>",
      },
    ],
  },
  // /// ====== FIN OFFRES MOOV ======= ///

  //PROMOTIONS
  //PROMOTIONS
  //PROMOTIONS
  //PROMOTIONS
  //PROMOTIONS
  //PROMOTIONS
  //PROMOTIONS
  //PROMOTIONS
  //PROMOTIONS
  //PROMOTIONS

  // //PASS AFRIQUE
  {
    code: "OF-0202020202",
    operator: {
      code: "OPE-001", //ORANGE
    },
    notifDate: "2024-01-01",
    startDate: "2024-01-05",
    duration: "1",
    title: "Pass Afrique",
    target: "<p>Clients Orange prépayés et hybrides</p>",
    type: "1", //OFFRE DE BASE
    billingType: "1", //TYPE DE FACTURATION PRIX - TARIF
    category: "1", //MOBILE
    link: null,
    description: "<p>Minutes augmentées sur pass</p>",
    status: "PENDING",
    parentCode: "OF-0101010101",
    formulas: [
      //Jour
      {
        type: "price",
        title: "Pass Afrique",
        description: "Minutes augmentées sur pass Afrique 500F",
        settlement: {
          price: "500",
          validity: "1",
          services: {
            VOIX: true,
            quantityVOIX: "7",
            comTypeVOIX: "ON_NET",
            // "bStepVOIX": "3",
          },
        },
      },
      {
        type: "price",
        title: "Pass Afrique",
        description: "",
        settlement: {
          price: "200",
          validity: "1",
          services: {
            VOIX: true,
            quantityVOIX: "20",
            comTypeVOIX: "ON_NET",
            // "bStepVOIX": "3",
          },
        },
      },
    ],
    area: {
      title: "INTERNATIONALE",
      organizations: [
        {
          code: "DEST-00001110",
          name: "Afrique",
          countries: [
            { code: "PYS-002" }, // Afrique du Sud
            { code: "PYS-004" }, // Algérie
            { code: "PYS-007" }, // Angola
            { code: "PYS-021" }, // Bénin
            { code: "PYS-031" }, // Burkina Faso
            { code: "PYS-032" }, // Burundi
            { code: "PYS-034" }, // Cameroun
            { code: "PYS-036" }, // Cap-Vert
            { code: "PYS-041" }, // Comores
            { code: "PYS-042" }, // Congo (Brazzaville)
            { code: "PYS-043" }, // Congo (RDC)
            { code: "PYS-047" }, // Côte d'Ivoire
            { code: "PYS-051" }, // Djibouti
            { code: "PYS-053" }, // Égypte
            { code: "PYS-056" }, // Érythrée
            { code: "PYS-061" }, // Éthiopie
            { code: "PYS-065" }, // Gabon
            { code: "PYS-066" }, // Gambie
            { code: "PYS-068" }, // Ghana
            { code: "PYS-101" }, // Libéria
            { code: "PYS-102" }, // Libye
            { code: "PYS-107" }, // Madagascar
            { code: "PYS-109" }, // Malawi
            { code: "PYS-111" }, // Mali
            { code: "PYS-113" }, // Maroc
            { code: "PYS-114" }, // Maurice
            { code: "PYS-115" }, // Mauritanie
            { code: "PYS-122" }, // Mozambique
            { code: "PYS-123" }, // Namibie
            { code: "PYS-127" }, // Niger
            { code: "PYS-128" }, // Nigeria
            { code: "PYS-145" }, // République centrafricaine
            { code: "PYS-151" }, // Rwanda
            { code: "PYS-158" }, // Sao Tomé-et-Principe
            { code: "PYS-159" }, // Sénégal
            { code: "PYS-161" }, // Seychelles
            { code: "PYS-162" }, // Sierra Leone
            { code: "PYS-166" }, // Somalie
            { code: "PYS-167" }, // Soudan
            { code: "PYS-168" }, // Soudan du Sud
            { code: "PYS-174" }, // Tanzanie
            { code: "PYS-175" }, // Tchad
            { code: "PYS-178" }, // Togo
            { code: "PYS-181" }, // Tunisie
            { code: "PYS-192" }, // Zambie
            { code: "PYS-193" }, // Zimbabwe
          ],
        },
      ],
    },
    accessModes: [
      {
        content: " ",
      },
    ],
    promoType: "SPECIAL",
  },
  // //PASS CEDEAO
  {
    code: "OF-0202020203",
    operator: {
      code: "OPE-001", //ORANGE
    },
    notifDate: "2024-01-01",
    startDate: "2024-01-05",
    duration: "1",
    title: "Pass CEDEAO",
    target: "<p>Clients Orange prépayés et hybrides</p>",
    type: "1", //OFFRE DE BASE
    billingType: "1", //TYPE DE FACTURATION PRIX - TARIF
    category: "1", //MOBILE
    link: null,
    description: "<p>Minutes augmentées sur pass</p>",
    status: "PENDING",
    parentCode: "OF-0101010101",
    formulas: [
      //Jour
      {
        type: "price",
        title: "Pass CEDEAO",
        description: "Minutes augmentées sur pass Afrique 500F",
        settlement: {
          price: "500",
          validity: "1",
          services: {
            VOIX: true,
            quantityVOIX: "7",
            comTypeVOIX: "ON_NET",
            // "bStepVOIX": "3",
          },
        },
      },
      {
        type: "price",
        title: "Pass CEDEAO",
        description: "",
        settlement: {
          price: "200",
          validity: "1",
          services: {
            VOIX: true,
            quantityVOIX: "20",
            comTypeVOIX: "ON_NET",
            // "bStepVOIX": "3",
          },
        },
      },
    ],
    area: {
      title: "INTERNATIONALE",
      organizations: [
        {
          code: "DEST-00001110",
          name: "Afrique",
          countries: [
            { code: "PYS-021" }, // Bénin
            { code: "PYS-036" }, // Cap-Vert
            { code: "PYS-047" }, // Côte d'Ivoire
            { code: "PYS-066" }, // Gambie
            { code: "PYS-068" }, // Ghana

            { code: "PYS-072" }, // Guinée

            { code: "PYS-173" }, // Guinée-Bissau
            { code: "PYS-101" }, // Libéria
            { code: "PYS-128" }, // Nigeria
            { code: "PYS-159" }, // Sénégale
            { code: "PYS-162" }, // Siera Leon
            { code: "PYS-178" }, // Togo
          ],
        },
      ],
    },
    accessModes: [
      {
        content: " ",
      },
    ],
    promoType: "SPECIAL",
  },
];

//PROMOTION

/**
 * État de workflow d'une offre du catalogue de démonstration.
 *
 * Ces offres représentent l'existant repris dans la plateforme : elles sont
 * PUBLIÉES (validées), sinon une base neuve donnait un comparateur vide, les
 * offres restant indéfiniment en attente du Validateur 1. Le circuit lui-même
 * se teste avec les offres OF-WFTEST-* du workflowSeeder, qui couvrent chaque
 * étape. Mettre SEED_DEMO_PENDING=1 pour les remettre « soumises ».
 */
const DEMO_PENDING = process.env.SEED_DEMO_PENDING === "1";

const workflowInitOf = (item) =>
  DEMO_PENDING && item.code !== "OF-000000000000000"
    ? { status: item.status, workflowStatus: "SUBMITTED", currentValidationLevel: 1, submittedAt: new Date() }
    : {
        // `status` (projection historique) suit le workflow : une offre
        // publiée n'est plus « PENDING » pour les écrans qui lisent ce champ.
        status: "DONE",
        workflowStatus: "VALIDATED",
        currentValidationLevel: null,
        submittedAt: new Date(item.notifDate || Date.now()),
        validatedAt: new Date(),
      };

/**
 * Reprise de l'existant : projection de validation (ALLOW) et trace au
 * journal, pour que l'offre publiée ne paraisse pas validée « sans personne ».
 */
const recordLegacyImport = async (offer, item) => {
  if (DEMO_PENDING && offer.code !== "OF-000000000000000") return;
  const admin = await prisma.user.findFirst({ where: { profile: { code: "PRF0-TEST" } }, select: { id: true } });
  await prisma.validation.upsert({
    where: { offerId: offer.id },
    update: { status: "ALLOW", launchDate: new Date(item.startDate) },
    create: {
      code: "VAL-" + offer.code,
      status: "ALLOW",
      launchDate: new Date(item.startDate),
      offer: { connect: { id: offer.id } },
    },
  });
  await prisma.auditLog.create({
    data: {
      action: "LEGACY_IMPORT",
      entityType: "OFFER",
      entityId: offer.id,
      offerId: offer.id,
      actorId: admin?.id ?? null,
      actorRole: "ADMIN",
      toStatus: "VALIDATED",
      comment: "Offre reprise de l'existant lors de l'initialisation de la plateforme (jeu de données).",
    },
  });
};

async function offerSeeder() {
  //PASSWORD Cedricaz@01

  //focalPoint admin
  try {
    for (const item of baseOffers) {
      let offer = null;
      if (!item?.parentCode) {
        offer = await prisma.offer.create({
          data: {
            code: item.code,
            title: item.title,
            description: item?.description,
            category: Number(item.category) === 1 ? "MOBILE" : "FIXE",
            notifiDate: new Date(item.notifDate),
            desiredDate: new Date(item.startDate),
            billingType: Number(item.billingType) == 1 ? "PREPAID" : "POSTPAID",
            target: item?.target,
            partner: item?.partner,
            user: {
              connect: {
                code: "USR0-TEST",
              },
            },
            operator: {
              connect: {
                code: item.operator.code,
              },
            },
            status: item.status,
            // Workflow : l'offre repère « Offre Inconnu » est validée d'office ;
            // les autres offres de démonstration attendent le Validateur 1.
            ...workflowInitOf(item),
          },
        });
      } else {
        offer = await prisma.offer.create({
          data: {
            code: item.code,
            title: item.title,
            description: item?.description,
            category: Number(item.category) === 1 ? "MOBILE" : "FIXE",
            notifiDate: new Date(item.notifDate),
            desiredDate: new Date(item.startDate),
            billingType: Number(item.billingType) == 1 ? "PREPAID" : "POSTPAID",
            target: item?.target,
            partner: item?.partner,
            parent: {
              connect: {
                code: item?.parentCode,
              },
            },
            user: {
              connect: {
                code: "USR0-TEST",
              },
            },
            operator: {
              connect: {
                code: item.operator.code,
              },
            },
            status: item.status,
            // Workflow : l'offre repère « Offre Inconnu » est validée d'office ;
            // les autres offres de démonstration attendent le Validateur 1.
            ...workflowInitOf(item),
          },
        });
      }

      if (offer && item?.area) {
        let _title = null
        if(item.area.title == "NATIONALE"){
          _title= "NATIONAL"
        }
        else if(item.area.title == "INTERNATIONALE"){
          _title= "INTERNATIONAL"
        }
        else if(item.area.title == "ROAMING"){
          _title= "ROAMING"
        }
        const area = await prisma.area.create({
          data: {
            code: "ARE-" + Date.now() + generateRandomString(15),
            title:_title,
            offers: {
              connect: [{ id: Number(offer.id) }],
            },
          },
        });

        if (item?.formulas) {
          const services = await prisma.service.findMany();

          for (const formula of item.formulas) {
            const form = await prisma.offerFormula.create({
              data: {
                code: "FORM-" + generateRandomString(15),
                title: formula?.title,
                validity: Number(formula?.settlement?.validity),
                offer: {
                  connect: { id: Number(offer.id) },
                },
              },
            });

            if (formula?.advantages) {
              for (const advan of formula?.advantages) {
                await prisma.formulaAdvantage.create({
                  data: {
                    code: "ADV-" + generateRandomString(15),
                    title: advan.name,
                    description: advan?.description,
                    formula: {
                      connect: { id: Number(form.id) },
                    },
                  },
                });
              }
            }

            await createDetailService(form?.id, formula, services);

            if (formula?.children) {
              await creatFromulaChild(formula, offer.id, services);
            }
          }

          for (const a of item.accessModes) {
            await prisma.accessMode.create({
              data: {
                code: "ACM-" + Date.now() + generateRandomString(15),
                content: a.content,
                offer: { connect: { id: Number(offer.id) } },
              },
            });
          }
        }
      }

      if (item.promoType == "SPECIAL") {
        await prisma.specialPromotion.create({
          data: {
            code: "PROMO-SPE" + Date.now(),
            type: item.promoType,
            duration: Number(item.duration),
            offer: {
              connect: {
                id: offer?.id,
              },
            },
          },
        });
      }

      if (offer) await recordLegacyImport(offer, item);

    }
  } catch (error) {
    /* erreur ignorée volontairement */
  }
}

module.exports = offerSeeder;

const createDetailService = async (formId, form, servs) => {
  if (form.type == "price") {
    await prisma.offerPrice.create({
      data: {
        code: "PRI-" + Date.now(),
        value: Number(form?.settlement?.price),
        formula: {
          connect: { id: Number(formId) },
        },
      },
    });
    await Promise.all(
      servs.map((s) => {

        let _on = "ALL_NET";
        if (form?.settlement?.services?.["comType" + s?.title] == "onNet") {
          _on = "ON_NET";
        } else if (
          form?.settlement?.services?.["comType" + s?.title] == "offNet"
        ) {
          _on = "OFF_NET";
        }

        if (form.settlement?.services?.[s?.title] === true) {
          //   "444444444444 555555 3 ======>",
          //   Number(form?.settlement?.services?.["quantity" + s?.title])
          // );
          return prisma.offerServiceDetail.create({
            data: {
              code: "OFF-SD-" + generateRandomString(15),
              quantity: Number(
                form?.settlement?.services?.["quantity" + s?.title],
              ),
              billingSteps: form?.settlement?.services?.["bStep" + s?.title]
                ? Number(form?.settlement?.services?.["bStep" + s?.title])
                : null,
              service: {
                connect: { id: Number(s?.id) },
              },
              formula: {
                connect: { id: Number(formId) },
              },
              comtype:_on,
            },
          });
        }
      }),
    );
  } else if (form.type == "bill") {
    await Promise.all(
      servs?.map((s) => {
        let _on = "ALL_NET";
        if (form?.settlement?.services?.["comType" + s?.title] == "onNet") {
          _on = "ON_NET";
        } else if (
          form?.settlement?.services?.["comType" + s?.title] == "offNet"
        ) {
          _on = "OFF_NET";
        }
        if (form?.settlement?.service == s.title) {
          const servD = prisma.offerServiceDetail.create({
            data: {
              code: "OFF-SD-" + generateRandomString(15),
              quantity: Number(form?.settlement?.quantity),
              billingSteps: form?.settlement?.billingStep
                ? Number(form?.settlement?.billingStep)
                : null,
              service: {
                connect: { id: Number(s?.id) },
              },
              formula: {
                connect: { id: Number(formId) },
              },
            },
          });

          prisma.offerRate.create({
            data: {
              code: "RAT-" + Date.now(),
              value: Number(formula?.settlement?.rateApplied),
              serviceDetail: {
                connect: { id: Number(servD.id) },
              },
            },
          });

          return servD;
        }
      }),
    );
  }
};

const creatFromulaChild = async (form, offerId, services) => {
  const children = form?.children;

  if (Array.isArray(children) && children.length > 0) {
    for (const child of children) {
      const f = await prisma.offerFormula.create({
        data: {
          code: "FORM-" + generateRandomString(15),
          title: child.title,
          validity: Number(child.settlement.validity),
          offer: {
            connect: { id: Number(offerId) },
          },
          parent: {
            connect: { id: Number(form?.id) },
          },
        },
      });

      createDetailService(f?.id, child, services);

      if (child?.children) {
        creatFromulaChild(child, offerId, services);
      }
    }
  }
};

const generateRandomString = (length) => {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  const charactersLength = characters.length;

  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }

  return result;
};
