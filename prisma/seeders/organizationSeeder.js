const { PrismaClient } = require("@prisma/client");
const { connect } = require("http2");

const prisma = new PrismaClient();

async function organizationSeeder() {
  const mainOrganizations = [
    {
      code: "M_ORGS-100",
      name: "AFRIQUE",
      description: "",
    },
    {
      code: "M_ORGS-200",
      name: "EUROPE",
      description: "",
    },
    {
      code: "M_ORGS-300",
      name: "AMERIQUE",
      description: "",
    },
    {
      code: "M_ORGS-400",
      name: "ASIE",
      description: "",
    },
    {
      code: "M_ORGS-500",
      name: "AUTRE",
      description: "",
    },
  ];

  const organizations = [
    {
      code: "DEST-10000001000",
      name: "Autres",
      description: "",
      area: {
        connect: { code: "ARE-01" },
      },
      parentOrgs: {
        connect: [{ code: "M_ORGS-500" }],
      },
      countries: {
        connect: [
          { code: "PYS-001" },
          { code: "PYS-002" },
          { code: "PYS-003" },
          { code: "PYS-004" },
          { code: "PYS-005" },
          { code: "PYS-006" },
          { code: "PYS-007" },
          { code: "PYS-008" },
          { code: "PYS-009" },
          { code: "PYS-010" },
          { code: "PYS-011" },
          { code: "PYS-012" },
          { code: "PYS-013" },
          { code: "PYS-014" },
          { code: "PYS-015" },
          { code: "PYS-016" },
          { code: "PYS-017" },
          { code: "PYS-018" },
          { code: "PYS-019" },
          { code: "PYS-020" },
          { code: "PYS-021" },
          { code: "PYS-022" },
          { code: "PYS-023" },
          { code: "PYS-024" },
          { code: "PYS-025" },
          { code: "PYS-026" },
          { code: "PYS-027" },
          { code: "PYS-028" },
          { code: "PYS-029" },
          { code: "PYS-030" },
          { code: "PYS-031" },
          { code: "PYS-032" },
          { code: "PYS-033" },
          { code: "PYS-034" },
          { code: "PYS-035" },
          { code: "PYS-036" },
          { code: "PYS-037" },
          { code: "PYS-038" },
          { code: "PYS-039" },
          { code: "PYS-040" },
          { code: "PYS-041" },
          { code: "PYS-042" },
          { code: "PYS-043" },
          { code: "PYS-044" },
          { code: "PYS-045" },
          { code: "PYS-046" },
          { code: "PYS-047" },
          { code: "PYS-048" },
          { code: "PYS-049" },
          { code: "PYS-050" },
          { code: "PYS-051" },
          { code: "PYS-052" },
          { code: "PYS-053" },
          { code: "PYS-054" },
          { code: "PYS-055" },
          { code: "PYS-056" },
          { code: "PYS-057" },
          { code: "PYS-058" },
          { code: "PYS-059" },
          { code: "PYS-060" },
          { code: "PYS-061" },
          { code: "PYS-062" },
          { code: "PYS-063" },
          { code: "PYS-064" },
          { code: "PYS-065" },
          { code: "PYS-066" },
          { code: "PYS-067" },
          { code: "PYS-068" },
          { code: "PYS-069" },
          { code: "PYS-070" },
          { code: "PYS-071" },
          { code: "PYS-072" },
          { code: "PYS-073" },
          { code: "PYS-074" },
          { code: "PYS-075" },
          { code: "PYS-076" },
          { code: "PYS-077" },
          { code: "PYS-078" },
          { code: "PYS-079" },
          { code: "PYS-080" },
          { code: "PYS-081" },
          { code: "PYS-082" },
          { code: "PYS-083" },
          { code: "PYS-084" },
          { code: "PYS-085" },
          { code: "PYS-086" },
          { code: "PYS-087" },
          { code: "PYS-088" },
          { code: "PYS-089" },
          { code: "PYS-090" },
          { code: "PYS-091" },
          { code: "PYS-092" },
          { code: "PYS-093" },
          { code: "PYS-094" },
          { code: "PYS-095" },
          { code: "PYS-096" },
          { code: "PYS-098" },
          { code: "PYS-099" },
          { code: "PYS-100" },
          { code: "PYS-101" },
          { code: "PYS-102" },
          { code: "PYS-103" },
          { code: "PYS-104" },
          { code: "PYS-105" },
          { code: "PYS-106" },
          { code: "PYS-107" },
          { code: "PYS-109" },
          { code: "PYS-110" },
          { code: "PYS-111" },
          { code: "PYS-112" },
          { code: "PYS-113" },
          { code: "PYS-114" },
          { code: "PYS-115" },
          { code: "PYS-116" },
          { code: "PYS-117" },
          { code: "PYS-118" },
          { code: "PYS-119" },
          { code: "PYS-120" },
          { code: "PYS-121" },
          { code: "PYS-122" },
          { code: "PYS-123" },
          { code: "PYS-124" },
          { code: "PYS-125" },
          { code: "PYS-126" },
          { code: "PYS-127" },
          { code: "PYS-128" },
          { code: "PYS-129" },
          { code: "PYS-130" },
          { code: "PYS-131" },
          { code: "PYS-132" },
          { code: "PYS-133" },
          { code: "PYS-134" },
          { code: "PYS-135" },
          { code: "PYS-136" },
          { code: "PYS-137" },
          { code: "PYS-138" },
          { code: "PYS-139" },
          { code: "PYS-140" },
          { code: "PYS-141" },
          { code: "PYS-142" },
          { code: "PYS-143" },
          { code: "PYS-144" },
          { code: "PYS-145" },
          { code: "PYS-146" },
          { code: "PYS-147" },
          { code: "PYS-148" },
          { code: "PYS-149" },
          { code: "PYS-150" },
          { code: "PYS-151" },
          { code: "PYS-152" },
          { code: "PYS-153" },
          { code: "PYS-154" },
          { code: "PYS-155" },
          { code: "PYS-156" },
          { code: "PYS-157" },
          { code: "PYS-158" },
          { code: "PYS-159" },
          { code: "PYS-160" },
          { code: "PYS-161" },
          { code: "PYS-162" },
          { code: "PYS-163" },
          { code: "PYS-164" },
          { code: "PYS-165" },
          { code: "PYS-166" },
          { code: "PYS-167" },
          { code: "PYS-168" },
          { code: "PYS-169" },
          { code: "PYS-170" },
          { code: "PYS-171" },
          { code: "PYS-172" },
          { code: "PYS-173" },
          { code: "PYS-174" },
          { code: "PYS-175" },
          { code: "PYS-176" },
          { code: "PYS-177" },
          { code: "PYS-178" },
          { code: "PYS-179" },
          { code: "PYS-180" },
          { code: "PYS-181" },
          { code: "PYS-182" },
          { code: "PYS-183" },
          { code: "PYS-184" },
          { code: "PYS-185" },
          { code: "PYS-186" },
          { code: "PYS-187" },
          { code: "PYS-188" },
          { code: "PYS-189" },
          { code: "PYS-190" },
          { code: "PYS-191" },
          { code: "PYS-192" },
          { code: "PYS-193" },
          { code: "PYS-194" },
          { code: "PYS-195" },
        ],
      },
    },
    {
      code: "DEST-100000010",
      name: "Local",
      description: "En Côte d'Ivoire",
      area: {
        connect: { code: "ARE-01" },
      },
      parentOrgs: {
        connect: [{ code: "M_ORGS-100" }],
      },
      countries: {
        connect: [{ code: "PYS-047" }],
      },
    },

    /////////AMERIQUE////////////
    {
      code: "DEST-00000001",
      name: "Amérique",
      description: "",
      area: {
        connect: { code: "ARE-10" },
      },
      parentOrgs: {
        connect: [{ code: "M_ORGS-300" }],
      },
      countries: {
        connect: [
          { code: "PYS-008" }, // Antigua-et-Barbuda
          { code: "PYS-010" }, // Argentine
          { code: "PYS-020" }, // Belize
          { code: "PYS-025" }, // Bolivie
          { code: "PYS-028" }, // Brésil
          { code: "PYS-035" }, // Canada
          { code: "PYS-037" }, // Chili
          { code: "PYS-040" }, // Colombie
          { code: "PYS-046" }, // Costa Rica
          { code: "PYS-049" }, // Cuba
          { code: "PYS-071" }, // Guatemala
          { code: "PYS-076" }, // Haïti
          { code: "PYS-077" }, // Honduras
          { code: "PYS-116" }, // Mexique
          { code: "PYS-126" }, // Nicaragua
          { code: "PYS-138" }, // Paraguay
          { code: "PYS-140" }, // Pérou
          { code: "PYS-156" }, // Salvador
          { code: "PYS-172" }, // Suriname
          { code: "PYS-180" }, // Trinité-et-Tobago
          { code: "PYS-186" }, // Uruguay
          { code: "PYS-189" }, // Venezuela
          { code: "PYS-052" }, // Dominique
          { code: "PYS-154" }, // Saint-Vincent-et-les-Grenadines
          { code: "PYS-155" }, // Sainte-Lucie
          { code: "PYS-152" }, // Saint-Christophe-et-Niévès
          { code: "PYS-015" }, // Bahamas
          { code: "PYS-018" }, // Barbade
          { code: "PYS-089" }, // Jamaïque
          { code: "PYS-001" }, // Afghanistan (à exclure, pas en Amérique)
        ],
      },
    },
    {
      code: "DEST-00000010",
      name: "Amérique du Nord",
      description: "",
      area: {
        connect: { code: "ARE-10" },
      },
      parentOrgs: {
        connect: [{ code: "M_ORGS-300" }],
      },
      countries: {
        connect: [
          { code: "PYS-035" }, // Canada
          { code: "PYS-116" }, // Mexique
          { code: "PYS-189" }, // USA (à ajouter dans la liste des 195 pays si pas encore)
        ],
      },
      parent: {
        connect: { code: "DEST-00000001" },
      },
    },
    {
      code: "DEST-00000011",
      name: "Amérique du Sud",
      description: "",
      area: {
        connect: { code: "ARE-10" },
      },
      parentOrgs: {
        connect: [{ code: "M_ORGS-300" }],
      },
      countries: {
        connect: [
          { code: "PYS-010" }, // Argentine
          { code: "PYS-025" }, // Bolivie
          { code: "PYS-028" }, // Brésil
          { code: "PYS-037" }, // Chili
          { code: "PYS-040" }, // Colombie
          { code: "PYS-138" }, // Paraguay
          { code: "PYS-140" }, // Pérou
          { code: "PYS-186" }, // Uruguay
          { code: "PYS-189" }, // Venezuela
          { code: "PYS-172" }, // Suriname
        ],
      },
      parent: {
        connect: { code: "DEST-00000001" },
      },
    },
    {
      code: "DEST-00000101",
      name: "Amérique de l'Ouest",
      description: "",
      area: {
        connect: { code: "ARE-10" },
      },
      parentOrgs: {
        connect: [{ code: "M_ORGS-300" }],
      },
      countries: {
        connect: [
          { code: "PYS-008" }, // Antigua-et-Barbuda
          { code: "PYS-015" }, // Bahamas
          { code: "PYS-018" }, // Barbade
          { code: "PYS-020" }, // Belize
          { code: "PYS-049" }, // Cuba
          { code: "PYS-052" }, // Dominique
          { code: "PYS-070" }, // Grenade
          { code: "PYS-071" }, // Guatemala
          { code: "PYS-076" }, // Haïti
          { code: "PYS-077" }, // Honduras
          { code: "PYS-126" }, // Nicaragua
          { code: "PYS-136" }, // Panama
          { code: "PYS-154" }, // Saint-Vincent-et-les-Grenadines
          { code: "PYS-155" }, // Sainte-Lucie
          { code: "PYS-152" }, // Saint-Christophe-et-Niévès
          { code: "PYS-180" }, // Trinité-et-Tobago
          { code: "PYS-156" }, // Salvador
        ],
      },
      parent: {
        connect: { code: "DEST-00000001" },
      },
    },
    {
      code: "DEST-00000110",
      name: "Amérique Latine",
      description: "Amérique du Sud et une partie de l’Amérique centrale.",
      area: {
        connect: { code: "ARE-10" },
      },
      parentOrgs: {
        connect: [{ code: "M_ORGS-300" }],
      },
      countries: {
        connect: [
          // Amérique centrale
          { code: "PYS-020" }, // Belize
          { code: "PYS-046" }, // Costa Rica
          { code: "PYS-071" }, // Guatemala
          { code: "PYS-077" }, // Honduras
          { code: "PYS-126" }, // Nicaragua
          { code: "PYS-136" }, // Panama
          { code: "PYS-156" }, // Salvador

          // Amérique du Sud
          { code: "PYS-010" }, // Argentine
          { code: "PYS-025" }, // Bolivie
          { code: "PYS-028" }, // Brésil
          { code: "PYS-037" }, // Chili
          { code: "PYS-040" }, // Colombie
          { code: "PYS-055" }, // Équateur
          { code: "PYS-075" }, // Guyana
          { code: "PYS-138" }, // Paraguay
          { code: "PYS-140" }, // Pérou
          { code: "PYS-172" }, // Suriname
          { code: "PYS-189" }, // Venezuela

          // Caraïbes hispanophones/francophones
          { code: "PYS-049" }, // Cuba
          { code: "PYS-076" }, // Haïti
          { code: "PYS-146" }, // République dominicaine
          { code: "PYS-180" }, // Trinité-et-Tobago (selon définition de latine, parfois inclus)
        ],
      },
      parent: {
        connect: { code: "DEST-00000001" },
      },
    },
    {
      code: "DEST-00000111",
      name: "MERCOSUR",
      description:
        "Marché commun du Sud (Argentine, Brésil, Uruguay, Paraguay, etc.)",
      area: {
        connect: { code: "ARE-10" },
      },
      parentOrgs: {
        connect: [{ code: "M_ORGS-300" }],
      },
      countries: {
        connect: [
          { code: "PYS-010" }, // Argentine
          { code: "PYS-028" }, // Brésil
          { code: "PYS-138" }, // Paraguay
          { code: "PYS-192" }, // Uruguay
          // Ajouter les membres associés si besoin, par exemple : Bolivie
          { code: "PYS-025" }, // Bolivie (membre associé)
        ],
      },
      parent: {
        connect: { code: "DEST-00000001" },
      },
    },
    {
      code: "DEST-00001000",
      name: "ALENA / USMCA",
      description: "Accord États-Unis–Mexique–Canada",
      area: {
        connect: { code: "ARE-10" },
      },
      parentOrgs: {
        connect: [{ code: "M_ORGS-300" }],
      },
      countries: {
        connect: [
          { code: "PYS-060" }, // États-Unis
          { code: "PYS-116" }, // Mexique
          { code: "PYS-035" }, // Canada
        ],
      },
      parent: {
        connect: { code: "DEST-00000001" },
      },
    },
    {
      code: "DEST-0001001",
      name: "CARICOM",
      description: "Communauté des Caraïbes",
      area: {
        connect: { code: "ARE-10" },
      },
      parentOrgs: {
        connect: [{ code: "M_ORGS-300" }],
      },
      countries: {
        connect: [
          { code: "PYS-008" }, // Antigua-et-Barbuda
          { code: "PYS-015" }, // Bahamas
          { code: "PYS-018" }, // Barbade
          { code: "PYS-049" }, // Cuba
          { code: "PYS-089" }, // Jamaïque
          { code: "PYS-152" }, // Saint-Christophe-et-Niévès
          { code: "PYS-154" }, // Saint-Vincent-et-les-Grenadines
          { code: "PYS-155" }, // Sainte-Lucie
          { code: "PYS-180" }, // Trinité-et-Tobago
          { code: "PYS-046" }, // Costa Rica (membre associé)
        ],
      },
      parent: {
        connect: { code: "DEST-00000001" },
      },
    },
    {
      code: "DEST-000010000",
      name: "ALBA",
      description: "Alliance bolivarienne pour les Amériques",
      area: {
        connect: { code: "ARE-10" },
      },
      parentOrgs: {
        connect: [{ code: "M_ORGS-300" }],
      },
      countries: {
        connect: [
          { code: "PYS-010" }, // Argentine
          { code: "PYS-025" }, // Bolivie
          { code: "PYS-049" }, // Cuba
          { code: "PYS-136" }, // Panama
          { code: "PYS-189" }, // Venezuela
          { code: "PYS-126" }, // Nicaragua
        ],
      },
      parent: {
        connect: { code: "DEST-00000001" },
      },
    },
    {
      code: "DEST-0001010",
      name: "CAN",
      description: "Communauté andine (Bolivie, Colombie, Équateur, Pérou)",
      area: {
        connect: { code: "ARE-10" },
      },
      parentOrgs: {
        connect: [{ code: "M_ORGS-300" }],
      },
      countries: {
        connect: [
          { code: "PYS-025" }, // Bolivie
          { code: "PYS-040" }, // Colombie
          { code: "PYS-055" }, // Équateur
          { code: "PYS-140" }, // Pérou
        ],
      },
      parent: {
        connect: { code: "DEST-00000001" },
      },
    },
    {
      code: "DEST-0001011",
      name: "OEA",
      description: "Organisation des États Américains",
      area: {
        connect: { code: "ARE-10" },
      },
      parentOrgs: {
        connect: [{ code: "M_ORGS-300" }],
      },
      countries: {
        connect: [
          { code: "PYS-002" }, // Afrique du Sud
          { code: "PYS-010" }, // Argentine
          { code: "PYS-020" }, // Belize
          { code: "PYS-028" }, // Brésil
          { code: "PYS-036" }, // Cap-Vert
          { code: "PYS-040" }, // Colombie
          { code: "PYS-046" }, // Costa Rica
          { code: "PYS-047" }, // Côte d'Ivoire
          { code: "PYS-049" }, // Cuba
          { code: "PYS-071" }, // Guatemala
          { code: "PYS-076" }, // Haïti
          { code: "PYS-077" }, // Honduras
          { code: "PYS-116" }, // Mexique
          { code: "PYS-126" }, // Nicaragua
          { code: "PYS-136" }, // Panama
          { code: "PYS-138" }, // Paraguay
          { code: "PYS-140" }, // Pérou
          { code: "PYS-156" }, // Salvador
          { code: "PYS-159" }, // Sénégal
          { code: "PYS-162" }, // Sierra Leone
          { code: "PYS-186" }, // Uruguay
          { code: "PYS-189" }, // Venezuela
          { code: "PYS-180" }, // Trinité-et-Tobago
          { code: "PYS-152" }, // Saint-Christophe-et-Niévès
          { code: "PYS-154" }, // Saint-Vincent-et-les-Grenadines
          { code: "PYS-155" }, // Sainte-Lucie
        ],
      },
      parent: {
        connect: { code: "DEST-00000001" },
      },
    },
    /////////////AFRIQUE/////////////////
    {
      code: "DEST-00001110",
      name: "Afrique",
      description: "Tout le continent africain, y compris l’Égypte.",
      area: {
        connect: { code: "ARE-10" },
      },
      parentOrgs: {
        connect: [{ code: "M_ORGS-100" }],
      },
      countries: {
        connect: [
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
          { code: "PYS-072" }, // Guinée
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
    },
    {
      code: "DEST-00010000",
      name: "Afrique du Nord",
      description: "",
      area: {
        connect: { code: "ARE-10" },
      },
      parentOrgs: {
        connect: [{ code: "M_ORGS-100" }],
      },
      countries: {
        connect: [
          { code: "PYS-004" }, // Algérie
          { code: "PYS-053" }, // Égypte
          { code: "PYS-102" }, // Libye
          { code: "PYS-113" }, // Maroc
          { code: "PYS-167" }, // Soudan
          { code: "PYS-181" }, // Tunisie
          { code: "PYS-115" }, // Mauritanie
        ],
      },
      parent: {
        connect: { code: "DEST-00001110" },
      },
    },
    {
      code: "DEST-00010001",
      name: "Afrique du l'Est",
      description: "",
      area: {
        connect: { code: "ARE-10" },
      },
      parentOrgs: {
        connect: [{ code: "M_ORGS-100" }],
      },
      countries: {
        connect: [
          { code: "PYS-051" }, // Djibouti
          { code: "PYS-056" }, // Érythrée
          { code: "PYS-061" }, // Éthiopie
          { code: "PYS-093" }, // Kenya
          { code: "PYS-132" }, // Ouganda
          { code: "PYS-166" }, // Somalie
          { code: "PYS-167" }, // Soudan
          { code: "PYS-168" }, // Soudan du Sud
          { code: "PYS-174" }, // Tanzanie
          { code: "PYS-151" }, // Rwanda
          { code: "PYS-032" }, // Burundi
        ],
      },
      parent: {
        connect: { code: "DEST-00001110" },
      },
    },
    {
      code: "DEST-00010010",
      name: "Afrique du l'Ouest",
      description: "",
      area: {
        connect: { code: "ARE-10" },
      },
      parentOrgs: {
        connect: [{ code: "M_ORGS-100" }],
      },
      countries: {
        connect: [
          { code: "PYS-021" }, // Bénin
          { code: "PYS-031" }, // Burkina Faso
          { code: "PYS-036" }, // Cap-Vert
          { code: "PYS-047" }, // Côte d'Ivoire
          { code: "PYS-066" }, // Gambie
          { code: "PYS-068" }, // Ghana
          { code: "PYS-072" }, // Guinée
          { code: "PYS-073" }, // Guinée-Bissau
          { code: "PYS-101" }, // Libéria
          { code: "PYS-111" }, // Mali
          { code: "PYS-115" }, // Mauritanie
          { code: "PYS-127" }, // Niger
          { code: "PYS-128" }, // Nigeria
          { code: "PYS-159" }, // Sénégal
          { code: "PYS-162" }, // Sierra Leone
          { code: "PYS-178" }, // Togo
        ],
      },
      parent: {
        connect: { code: "DEST-00001110" },
      },
    },
    {
      code: "DEST-00010011",
      name: "Afrique du Centre",
      description: "",
      area: {
        connect: { code: "ARE-10" },
      },
      parentOrgs: {
        connect: [{ code: "M_ORGS-100" }],
      },
      countries: {
        connect: [
          { code: "PYS-034" }, // Cameroun
          { code: "PYS-145" }, // République centrafricaine
          { code: "PYS-175" }, // Tchad
          { code: "PYS-042" }, // Congo (Brazzaville)
          { code: "PYS-043" }, // RDC
          { code: "PYS-074" }, // Guinée équatoriale
          { code: "PYS-065" }, // Gabon
          { code: "PYS-158" }, // Sao Tomé-et-Principe
        ],
      },
      parent: {
        connect: { code: "DEST-00001110" },
      },
    },
    {
      code: "DEST-00010100",
      name: "CEDEAO (ECOWAS)",
      description: "Communauté Économique des États de l’Afrique de l’Ouest",
      area: {
        connect: { code: "ARE-10" },
      },
      parentOrgs: {
        connect: [{ code: "M_ORGS-100" }],
      },
      countries: {
        connect: [
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
      parent: {
        connect: { code: "DEST-00001110" },
      },
    },
    {
      code: "DEST-00010101",
      name: "UEMOA",
      description: "Union Économique et Monétaire Ouest-Africaine",
      area: {
        connect: { code: "ARE-10" },
      },
      parentOrgs: {
        connect: [{ code: "M_ORGS-100" }],
      },
      countries: {
        connect: [
          { code: "PYS-021" }, // Bénin
          { code: "PYS-031" }, // Burkina Faso
          { code: "PYS-047" }, // Côte d’Ivoire
          { code: "PYS-073" }, // Guinée-Bissau
          { code: "PYS-111" }, // Mali
          { code: "PYS-127" }, // Niger
          { code: "PYS-159" }, // Sénégal
          { code: "PYS-178" }, // Togo
        ],
      },
      parent: {
        connect: { code: "DEST-00001110" },
      },
    },
    {
      code: "DEST-00010110",
      name: "CEMAC",
      description: "Communauté Économique et Monétaire de l’Afrique Centrale",
      area: {
        connect: { code: "ARE-10" },
      },
      parentOrgs: {
        connect: [{ code: "M_ORGS-100" }],
      },
      countries: {
        connect: [
          { code: "PYS-021" }, // Bénin
          { code: "PYS-031" }, // Burkina Faso
          { code: "PYS-047" }, // Côte d’Ivoire
          { code: "PYS-073" }, // Guinée-Bissau
          { code: "PYS-111" }, // Mali
          { code: "PYS-127" }, // Niger
          { code: "PYS-159" }, // Sénégal
          { code: "PYS-178" }, // Togo
        ],
      },
      parent: {
        connect: { code: "DEST-00001110" },
      },
    },
    {
      code: "DEST-00010111",
      name: "CEEAC",
      description: "Communauté Économique des États de l’Afrique Centrale",
      area: {
        connect: { code: "ARE-10" },
      },
      parentOrgs: {
        connect: [{ code: "M_ORGS-100" }],
      },
      countries: {
        connect: [
          { code: "PYS-007" }, // Angola
          { code: "PYS-032" }, // Burundi
          { code: "PYS-034" }, // Cameroun
          { code: "PYS-145" }, // République centrafricaine
          { code: "PYS-042" }, // Congo (Brazzaville)
          { code: "PYS-043" }, // RDC
          { code: "PYS-065" }, // Gabon
          { code: "PYS-074" }, // Guinée équatoriale
          { code: "PYS-158" }, // Sao Tomé-et-Principe
          { code: "PYS-175" }, // Tchad
        ],
      },
      parent: {
        connect: { code: "DEST-00001110" },
      },
    },
    {
      code: "DEST-00011000",
      name: "SADC",
      description: "Communauté de Développement d’Afrique Australe",
      area: {
        connect: { code: "ARE-10" },
      },
      parentOrgs: {
        connect: [{ code: "M_ORGS-100" }],
      },
      countries: {
        connect: [
          { code: "PYS-007" }, // Angola
          { code: "PYS-027" }, // Botswana
          { code: "PYS-123" }, // Namibie
          { code: "PYS-192" }, // Zambie
          { code: "PYS-193" }, // Zimbabwe
          { code: "PYS-122" }, // Mozambique
          { code: "PYS-059" }, // Eswatini
          { code: "PYS-109" }, // Malawi
          { code: "PYS-032" }, // Burundi
          { code: "PYS-174" }, // Tanzanie
        ],
      },
      parent: {
        connect: { code: "DEST-00001110" },
      },
    },
    {
      code: "DEST-00011001",
      name: "COMESA",
      description: "Marché commun de l’Afrique orientale et australe",
      area: {
        connect: { code: "ARE-10" },
      },
      parentOrgs: {
        connect: [{ code: "M_ORGS-100" }],
      },
      countries: {
        connect: [
          { code: "PYS-032" }, // Burundi
          { code: "PYS-041" }, // Comores
          { code: "PYS-043" }, // RDC
          { code: "PYS-051" }, // Djibouti
          { code: "PYS-053" }, // Égypte
          { code: "PYS-056" }, // Érythrée
          { code: "PYS-059" }, // Eswatini
          { code: "PYS-061" }, // Éthiopie
          { code: "PYS-093" }, // Kenya
          { code: "PYS-102" }, // Libye
          { code: "PYS-107" }, // Madagascar
          { code: "PYS-109" }, // Malawi
          { code: "PYS-114" }, // Maurice
          { code: "PYS-151" }, // Rwanda
          { code: "PYS-161" }, // Seychelles
          { code: "PYS-167" }, // Soudan
          { code: "PYS-174" }, // Tanzanie
          { code: "PYS-132" }, // Ouganda
          { code: "PYS-192" }, // Zambie
          { code: "PYS-193" }, // Zimbabwe
          { code: "PYS-145" }, // République centrafricaine
        ],
      },
      parent: {
        connect: { code: "DEST-00001110" },
      },
    },
    {
      code: "DEST-00011010",
      name: "UMA",
      description: "Union du Maghreb Arabe",
      area: {
        connect: { code: "ARE-10" },
      },
      parentOrgs: {
        connect: [{ code: "M_ORGS-100" }],
      },
      countries: {
        connect: [
          { code: "PYS-004" }, // Algérie
          { code: "PYS-102" }, // Libye
          { code: "PYS-113" }, // Maroc
          { code: "PYS-115" }, // Mauritanie
          { code: "PYS-181" }, // Tunisie
        ],
      },
      parent: {
        connect: { code: "DEST-00001110" },
      },
    },
    {
      code: "DEST-00011011",
      name: "IGAD",
      description:
        "Autorité intergouvernementale pour le développement (Afrique de l’Est)",
      area: {
        connect: { code: "ARE-10" },
      },
      parentOrgs: {
        connect: [{ code: "M_ORGS-100" }],
      },
      countries: {
        connect: [
          { code: "PYS-051" }, // Djibouti
          { code: "PYS-056" }, // Érythrée
          { code: "PYS-061" }, // Éthiopie
          { code: "PYS-093" }, // Kenya
          { code: "PYS-166" }, // Somalie
          { code: "PYS-167" }, // Soudan
          { code: "PYS-168" }, // Soudan du Sud
          { code: "PYS-132" }, // Ouganda
        ],
      },
      parent: {
        connect: { code: "DEST-00001110" },
      },
    },
    {
      code: "DEST-00011100",
      name: "UA",
      description:
        "Union Africaine, organisation panafricaine regroupant tous les pays d’Afrique",
      area: {
        connect: { code: "ARE-10" },
      },
      parentOrgs: {
        connect: [{ code: "M_ORGS-100" }],
      },
      countries: {
        connect: [
          { code: "PYS-002" }, // Afrique du Sud
          { code: "PYS-004" }, // Algérie
          { code: "PYS-007" }, // Angola
          { code: "PYS-021" }, // Bénin
          { code: "PYS-031" }, // Burkina Faso
          { code: "PYS-034" }, // Cameroun
          { code: "PYS-036" }, // Cap-Vert
          { code: "PYS-041" }, // Comores
          { code: "PYS-042" }, // Congo (Brazzaville)
          { code: "PYS-043" }, // Congo (RDC)
          { code: "PYS-047" }, // Côte d'Ivoire
          { code: "PYS-051" }, // Djibouti
          { code: "PYS-053" }, // Égypte
          { code: "PYS-065" }, // Gabon
          { code: "PYS-066" }, // Gambie
          { code: "PYS-068" }, // Ghana
          { code: "PYS-072" }, // Guinée
          { code: "PYS-073" }, // Guinée-Bissau
          { code: "PYS-074" }, // Guinée équatoriale
          { code: "PYS-101" }, // Libéria
          { code: "PYS-102" }, // Libye
          { code: "PYS-113" }, // Maroc
          { code: "PYS-115" }, // Mauritanie
          { code: "PYS-114" }, // Maurice
          { code: "PYS-111" }, // Mali
          { code: "PYS-127" }, // Niger
          { code: "PYS-128" }, // Nigeria
          { code: "PYS-159" }, // Sénégal
          { code: "PYS-178" }, // Togo
          { code: "PYS-175" }, // Tchad
          { code: "PYS-181" }, // Tunisie
          { code: "PYS-122" }, // Mozambique
          { code: "PYS-192" }, // Zambie
          { code: "PYS-193" }, // Zimbabwe
          { code: "PYS-162" }, // Sierra Leone
          { code: "PYS-151" }, // Rwanda
          { code: "PYS-166" }, // Somalie
          { code: "PYS-167" }, // Soudan
          { code: "PYS-168" }, // Soudan du Sud
        ],
      },
      parent: {
        connect: { code: "DEST-00001110" },
      },
    },
    //////////////EUROPE////////////////
    {
      code: "DEST-000111100",
      name: "Europe",
      description: "Région regroupant tous les pays d'Europe",
      area: {
        connect: { code: "ARE-10" },
      },
      parentOrgs: {
        connect: [{ code: "M_ORGS-200" }],
      },
      countries: {
        connect: [
          { code: "PYS-003" }, // Albanie
          { code: "PYS-005" }, // Allemagne
          { code: "PYS-006" }, // Andorre
          { code: "PYS-013" }, // Autriche
          { code: "PYS-019" }, // Belgique
          { code: "PYS-023" }, // Biélorussie
          { code: "PYS-026" }, // Bosnie-Herzégovine
          { code: "PYS-030" }, // Bulgarie
          { code: "PYS-039" }, // Chypre
          { code: "PYS-048" }, // Croatie
          { code: "PYS-050" }, // Danemark
          { code: "PYS-058" }, // Estonie
          { code: "PYS-063" }, // Finlande
          { code: "PYS-064" }, // France
          { code: "PYS-069" }, // Grèce
          { code: "PYS-078" }, // Hongrie
          { code: "PYS-085" }, // Irlande
          { code: "PYS-086" }, // Islande
          { code: "PYS-088" }, // Italie
          { code: "PYS-099" }, // Lettonie
          { code: "PYS-103" }, // Liechtenstein
          { code: "PYS-104" }, // Lituanie
          { code: "PYS-105" }, // Luxembourg
          { code: "PYS-106" }, // Macédoine du Nord
          { code: "PYS-112" }, // Malte
          { code: "PYS-118" }, // Moldavie
          { code: "PYS-119" }, // Monaco
          { code: "PYS-121" }, // Monténégro
          { code: "PYS-129" }, // Norvège
          { code: "PYS-139" }, // Pays-Bas
          { code: "PYS-142" }, // Pologne
          { code: "PYS-143" }, // Portugal
          { code: "PYS-147" }, // République tchèque
          { code: "PYS-148" }, // Roumanie
          { code: "PYS-149" }, // Royaume-Uni
          { code: "PYS-150" }, // Russie
          { code: "PYS-153" }, // Saint-Marin
          { code: "PYS-160" }, // Serbie
          { code: "PYS-164" }, // Slovaquie
          { code: "PYS-165" }, // Slovénie
          { code: "PYS-170" }, // Suède
          { code: "PYS-171" }, // Suisse
          { code: "PYS-185" }, // Ukraine
          { code: "PYS-188" }, // Vatican
          { code: "PYS-194" }, // Åland
        ],
      },
    },
    {
      code: "DEST-00011101",
      name: "UE",
      description: "Union Européenne.",
      area: {
        connect: { code: "ARE-10" },
      },
      parentOrgs: {
        connect: [{ code: "M_ORGS-200" }],
      },
      countries: {
        connect: [
          { code: "PYS-005" }, // Allemagne
          { code: "PYS-013" }, // Autriche
          { code: "PYS-019" }, // Belgique
          { code: "PYS-030" }, // Bulgarie
          { code: "PYS-048" }, // Croatie
          { code: "PYS-057" }, // Espagne
          { code: "PYS-064" }, // France
          { code: "PYS-069" }, // Grèce
          { code: "PYS-078" }, // Hongrie
          { code: "PYS-086" }, // Islande (non membre officiel, peut retirer)
          { code: "PYS-088" }, // Italie
          { code: "PYS-099" }, // Lettonie
          { code: "PYS-104" }, // Lituanie
          { code: "PYS-105" }, // Luxembourg
          { code: "PYS-106" }, // Macédoine du Nord (pas UE officiellement)
          { code: "PYS-142" }, // Pologne
          { code: "PYS-143" }, // Portugal
          { code: "PYS-147" }, // République tchèque
          { code: "PYS-148" }, // Roumanie
          { code: "PYS-149" }, // Royaume-Uni (Brexit)
          { code: "PYS-164" }, // Slovaquie
          { code: "PYS-165" }, // Slovénie
          { code: "PYS-171" }, // Suisse (non UE)
        ],
      },
      parent: {
        connect: { code: "DEST-000111100" },
      },
    },
    {
      code: "DEST-00011110",
      name: "AELE",
      description: "Association Européenne de Libre-Échange.",
      area: {
        connect: { code: "ARE-10" },
      },
      parentOrgs: {
        connect: [{ code: "M_ORGS-200" }],
      },
      countries: {
        connect: [
          { code: "PYS-086" }, // Islande
          { code: "PYS-103" }, // Liechtenstein
          { code: "PYS-129" }, // Norvège
          { code: "PYS-171" }, // Suisse
        ],
      },
      parent: {
        connect: { code: "DEST-000111100" },
      },
    },
    {
      code: "DEST-00100000",
      name: "OTAN (NATO)",
      description: "Indonésie, Australie, Nouvelle-Zélande, Philippines, etc.",
      area: {
        connect: { code: "ARE-10" },
      },
      parentOrgs: {
        connect: [{ code: "M_ORGS-200" }],
      },
      countries: {
        connect: [
          { code: "PYS-160" }, // États-Unis
          { code: "PYS-035" }, // Canada
          { code: "PYS-174" }, // Royaume-Uni
          { code: "PYS-005" }, // Allemagne
          { code: "PYS-013" }, // Autriche (non-membre OTAN) -> remplacer par France
          { code: "PYS-064" }, // France
          { code: "PYS-048" }, // Croatie
          { code: "PYS-004" }, // Algérie (non-membre, remplacer par Italie)
          { code: "PYS-088" }, // Italie
          { code: "PYS-050" }, // Danemark
          { code: "PYS-019" }, // Belgique
          { code: "PYS-020" }, // Pays-Bas
          { code: "PYS-006" }, // Andorre (non-membre OTAN) -> remplacer par Luxembourg
          { code: "PYS-105" }, // Luxembourg
          { code: "PYS-010" }, // Argentine (non-membre OTAN) -> remplacer par Espagne
          { code: "PYS-057" }, // Espagne
          { code: "PYS-014" }, // Azerbaïdjan (non-membre) -> remplacer par Turquie
          { code: "PYS-183" }, // Turquie
          { code: "PYS-030" }, // Bulgarie
          { code: "PYS-026" }, // Bosnie-Herzégovine (non-membre) -> remplacer par Hongrie
          { code: "PYS-078" }, // Hongrie
          { code: "PYS-023" }, // Biélorussie (non-membre) -> remplacer par République tchèque
          { code: "PYS-147" }, // République tchèque
          { code: "PYS-048" }, // Croatie
          { code: "PYS-048" }, // Slovaquie (ajouter code correspondant)
          { code: "PYS-048" }, // Slovénie (ajouter code correspondant)
          { code: "PYS-003" }, // Albanie
          { code: "PYS-121" }, // Monténégro (ajouter code correspondant)
          { code: "PYS-106" }, // Macédoine du Nord (ajouter code correspondant)
          { code: "PYS-018" }, // Grèce
          { code: "PYS-050" }, // Portugal
          { code: "PYS-040" }, // Colombie (non-membre) -> à retirer
          { code: "PYS-050" }, // Danemark
          { code: "PYS-010" }, // Espagne
          { code: "PYS-019" }, // Belgique
        ],
      },
      parent: {
        connect: { code: "DEST-000111100" },
      },
    },
    ///////////////ASIE///////////////
    {
      code: "DEST-001101000",
      name: "Asie",
      description: "Région regroupant tous les pays d'Asie",
      area: {
        connect: { code: "ARE-10" },
      },
      parentOrgs: {
        connect: [{ code: "M_ORGS-400" }],
      },
      countries: {
        connect: [
          { code: "PYS-001" }, // Afghanistan
          { code: "PYS-011" }, // Arménie
          { code: "PYS-014" }, // Azerbaïdjan
          { code: "PYS-016" }, // Bahreïn
          { code: "PYS-017" }, // Bangladesh
          { code: "PYS-022" }, // Bhoutan
          { code: "PYS-024" }, // Birmanie (Myanmar)
          { code: "PYS-029" }, // Brunei
          { code: "PYS-033" }, // Cambodge
          { code: "PYS-038" }, // Chine
          { code: "PYS-044" }, // Corée du Nord
          { code: "PYS-045" }, // Corée du Sud
          { code: "PYS-054" }, // Émirats arabes unis
          { code: "PYS-067" }, // Géorgie
          { code: "PYS-081" }, // Inde
          { code: "PYS-082" }, // Indonésie
          { code: "PYS-084" }, // Iran
          { code: "PYS-083" }, // Irak
          { code: "PYS-087" }, // Israël
          { code: "PYS-090" }, // Japon
          { code: "PYS-091" }, // Jordanie
          { code: "PYS-092" }, // Kazakhstan
          { code: "PYS-094" }, // Kirghizistan
          { code: "PYS-096" }, // Koweït
          { code: "PYS-097" }, // Laos
          { code: "PYS-100" }, // Liban
          { code: "PYS-108" }, // Malaisie
          { code: "PYS-110" }, // Maldives
          { code: "PYS-120" }, // Mongolie
          { code: "PYS-125" }, // Népal
          { code: "PYS-131" }, // Oman
          { code: "PYS-133" }, // Ouzbékistan
          { code: "PYS-134" }, // Pakistan
          { code: "PYS-141" }, // Philippines
          { code: "PYS-144" }, // Qatar
          { code: "PYS-009" }, // Arabie Saoudite
          { code: "PYS-163" }, // Singapour
          { code: "PYS-169" }, // Sri Lanka
          { code: "PYS-173" }, // Tadjikistan
          { code: "PYS-176" }, // Thaïlande
          { code: "PYS-177" }, // Timor oriental
          { code: "PYS-183" }, // Turquie
          { code: "PYS-182" }, // Turkménistan
          { code: "PYS-190" }, // Viêt Nam
          { code: "PYS-191" }, // Yémen
        ],
      },
    },
    {
      code: "DEST-00100001",
      name: "ASEAN",
      description: "Association des Nations de l’Asie du Sud-Est.",
      area: {
        connect: { code: "ARE-10" },
      },
      parentOrgs: {
        connect: [{ code: "M_ORGS-400" }],
      },
      countries: {
        connect: [
          { code: "PYS-024" }, // Birmanie (Myanmar)
          { code: "PYS-033" }, // Cambodge
          { code: "PYS-038" }, // Chine (membre associé)
          { code: "PYS-108" }, // Malaisie
          { code: "PYS-097" }, // Laos
          { code: "PYS-141" }, // Philippines
          { code: "PYS-176" }, // Thaïlande
          { code: "PYS-190" }, // Viêt Nam
          { code: "PYS-029" }, // Brunei
          { code: "PYS-177" }, // Timor oriental
        ],
      },
      parent: {
        connect: {
          code: "DEST-001101000",
        },
      },
    },
    {
      code: "DEST-00100010",
      name: "SAARC",
      description: "Association sud-asiatique pour la coopération régionale",
      area: {
        connect: { code: "ARE-10" },
      },
      parentOrgs: {
        connect: [{ code: "M_ORGS-400" }],
      },
      countries: {
        connect: [
          { code: "PYS-001" }, // Afghanistan
          { code: "PYS-017" }, // Bangladesh
          { code: "PYS-022" }, // Bhoutan
          { code: "PYS-134" }, // Pakistan
          { code: "PYS-125" }, // Népal
          { code: "PYS-190" }, // Sri Lanka
          { code: "PYS-090" }, // Japon (observateur)
          { code: "PYS-092" }, // Kazakhstan (observateur)
          { code: "PYS-120" }, // Mongolie (observateur)
        ],
      },
      parent: {
        connect: { code: "DEST-001101000" },
      },
    },
    {
      code: "DEST-00100100",
      name: "CCG (GCC)",
      description: "Conseil de Coopération du Golfe",
      area: {
        connect: { code: "ARE-10" },
      },
      parentOrgs: {
        connect: [{ code: "M_ORGS-400" }],
      },
      countries: {
        connect: [
          { code: "PYS-001" }, // Afghanistan
          { code: "PYS-017" }, // Bangladesh
          { code: "PYS-022" }, // Bhoutan
          { code: "PYS-134" }, // Pakistan
          { code: "PYS-125" }, // Népal
          { code: "PYS-190" }, // Sri Lanka
          { code: "PYS-090" }, // Japon (observateur)
          { code: "PYS-092" }, // Kazakhstan (observateur)
          { code: "PYS-120" }, // Mongolie (observateur)
        ],
      },
      parent: {
        connect: { code: "DEST-001101000" },
      },
    },
    {
      code: "DEST-00100101",
      name: "SCO",
      description: "Organisation de Coopération de Shanghai",
      area: {
        connect: { code: "ARE-10" },
      },
      parentOrgs: {
        connect: [{ code: "M_ORGS-400" }],
      },
      countries: {
        connect: [
          { code: "PYS-038" }, // Chine
          { code: "PYS-108" }, // Inde
          { code: "PYS-123" }, // Kazakhstan
          { code: "PYS-134" }, // Kirghizistan
          { code: "PYS-125" }, // Pakistan
          { code: "PYS-175" }, // Tadjikistan
          { code: "PYS-143" }, // Russie
          { code: "PYS-120" }, // Ouzbékistan
          { code: "PYS-001" }, // Afghanistan (observateur)
          { code: "PYS-090" }, // Mongolie (observateur)
          { code: "PYS-088" }, // Iran (observateur, si inclus)
        ],
      },
      parent: {
        connect: { code: "DEST-001101000" },
      },
    },
    {
      code: "DEST-0010110",
      name: "APEC",
      description: "Coopération Économique Asie-Pacifique",
      area: {
        connect: { code: "ARE-10" },
      },
      parentOrgs: {
        connect: [{ code: "M_ORGS-400" }],
      },
      countries: {
        connect: [
          { code: "PYS-012" }, // Australie
          { code: "PYS-029" }, // Brunei
          { code: "PYS-037" }, // Chili
          { code: "PYS-038" }, // Chine
          { code: "PYS-045" }, // Corée du Sud
          { code: "PYS-060" }, // États-Unis
          { code: "PYS-038" }, // Chine
          { code: "PYS-082" }, // Indonésie
          { code: "PYS-090" }, // Japon
          { code: "PYS-108" }, // Malaisie
          { code: "PYS-116" }, // Mexique
          { code: "PYS-130" }, // Nouvelle-Zélande
          { code: "PYS-137" }, // Papouasie-Nouvelle-Guinée
          { code: "PYS-140" }, // Pérou
          { code: "PYS-141" }, // Philippines
          { code: "PYS-150" }, // Russie
          { code: "PYS-163" }, // Singapour
          { code: "PYS-176" }, // Thaïlande
          { code: "PYS-190" }, // Vietnam
          { code: "PYS-035" }, // Canada
        ],
      },
      parent: {
        connect: { code: "DEST-001101000" },
      },
    },
    {
      code: "DEST-0010111",
      name: "ECO",
      description:
        "Organisation de Coopération Économique (Asie Centrale, Moyen-Orient)",
      area: {
        connect: { code: "ARE-10" },
      },
      parentOrgs: {
        connect: [{ code: "M_ORGS-400" }],
      },
      countries: {
        connect: [
          { code: "PYS-001" }, // Afghanistan
          { code: "PYS-014" }, // Azerbaïdjan
          { code: "PYS-084" }, // Iran
          { code: "PYS-092" }, // Kazakhstan
          { code: "PYS-194" }, // Kirghizistan
          { code: "PYS-134" }, // Pakistan
          { code: "PYS-173" }, // Tadjikistan
          { code: "PYS-183" }, // Turquie
          { code: "PYS-182" }, // Turkménistan (ajouter code correspondant)
          { code: "PYS-133" }, // Ouzbékistan
        ],
      },
      parent: {
        connect: { code: "DEST-001101000" },
      },
    },

    ///////OCEAN PACIFIQUE/////
    {
      code: "DEST-00110000",
      name: "Océanie - Pacifique",
      description: "États insulaires d’Océanie",
      area: {
        connect: { code: "ARE-10" },
      },
      parentOrgs: {
        connect: [{ code: "M_ORGS-500" }],
      },
      countries: {
        connect: [
          { code: "PYS-012" }, // Australie
          { code: "PYS-062" }, // Fidji
          { code: "PYS-195" }, // Fidji (détail supplémentaire)
          { code: "PYS-079" }, // Îles Marshall
          { code: "PYS-080" }, // Îles Salomon
          { code: "PYS-095" }, // Kiribati
          { code: "PYS-117" }, // Micronésie
          { code: "PYS-124" }, // Nauru
          { code: "PYS-130" }, // Nouvelle-Zélande
          { code: "PYS-135" }, // Palaos
          { code: "PYS-137" }, // Papouasie-Nouvelle-Guinée
          { code: "PYS-157" }, // Samoa
          { code: "PYS-179" }, // Tonga
          { code: "PYS-184" }, // Tuvalu
          { code: "PYS-187" }, // Vanuatu
        ],
      },
    },
    {
      code: "DEST-0011000",
      name: "PIF (FIP)",
      description: "Forum des Îles du Pacifique",
      area: {
        connect: { code: "ARE-10" },
      },
      parentOrgs: {
        connect: [{ code: "M_ORGS-500" }],
      },
      countries: {
        connect: [
          { code: "PYS-012" }, // Australie
          { code: "PYS-130" }, // Nouvelle-Zélande
          { code: "PYS-187" }, // Vanuatu
          { code: "PYS-137" }, // Papouasie-Nouvelle-Guinée
          { code: "PYS-157" }, // Samoa
          { code: "PYS-179" }, // Tonga
          { code: "PYS-184" }, // Tuvalu
          { code: "PYS-124" }, // Nauru
          { code: "PYS-135" }, // Palaos
          { code: "PYS-117" }, // Micronésie
          { code: "PYS-188" }, // Îles Cook (si présentes dans la liste des 195 pays)
        ],
      },
      parent: {
        connect: { code: "DEST-00110000" },
      },
    },
    {
      code: "DEST-0011001",
      name: "SPC",
      description:
        "Communauté du Pacifique (anciennement Commission du Pacifique Sud)",
      area: {
        connect: { code: "ARE-10" },
      },
      parentOrgs: {
        connect: [{ code: "M_ORGS-500" }],
      },
      countries: {
        connect: [
          { code: "PYS-012" }, // Australie
          { code: "PYS-187" }, // Vanuatu
          { code: "PYS-137" }, // Papouasie-Nouvelle-Guinée
          { code: "PYS-157" }, // Samoa
          { code: "PYS-179" }, // Tonga
          { code: "PYS-184" }, // Tuvalu
          { code: "PYS-124" }, // Nauru
          { code: "PYS-135" }, // Palaos
          { code: "PYS-117" }, // Micronésie
          { code: "PYS-188" }, // Nouvelle-Calédonie (si incluse dans la liste des 195 pays)
          { code: "PYS-130" }, // Nouvelle-Zélande
          { code: "PYS-079" }, // Îles Marshall (ajouter le code correspondant si défini)
          { code: "PYS-080" }, // Îles Salomon (ajouter le code correspondant si défini)
          { code: "PYS-095" }, // Kiribati (ajouter le code correspondant si défini)
        ],
      },
      parent: {
        connect: { code: "DEST-00110000" },
      },
    },
    {
      code: "DEST-0011010",
      name: "MSG",
      description: "Groupe Mélanésien Fer de Lance",
      area: {
        connect: { code: "ARE-10" },
      },
      parentOrgs: {
        connect: [{ code: "M_ORGS-500" }],
      },
      countries: {
        connect: [
          { code: "PYS-187" }, // Vanuatu
          { code: "PYS-137" }, // Papouasie-Nouvelle-Guinée
          { code: "PYS-187" }, // Fidji
          { code: "PYS-080" }, // Îles Salomon (ajouter le code correspondant si défini)
          { code: "PYS-188" }, // Nouvelle-Calédonie (si incluse dans la liste des 195 pays)
        ],
      },
      parent: {
        connect: { code: "DEST-00110000" },
      },
    },
  ];

  for (const mOrg of mainOrganizations) {
    try {
      await prisma.mainOrganization.create({
        data: mOrg,
      });
    } catch (error) {
    /* erreur ignorée volontairement */
  }
  }

  for (const org of organizations) {
    await prisma.organization.create({
      data: org,
    });
  }

}

module.exports = organizationSeeder;
