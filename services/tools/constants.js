export const FKTND_H = "2xskudCkmxSLHRCbCG5YwauyDZq3XkOOx9eqhDUEkMYeurPr63vQwFURrRZBC4Fd"
export const USER = process.env.USER
export const JWT_TOKEN ='Jt'
export const AUTH_TOKEN = process.env.AUTH_TOKEN
export const TOKEN_USER = process.env.USER_TOKEN
export const TOKEN_ADMIN = process.env.ADMIN_TOKEN

// BUGFIX: le mot-clé `export` avait été perdu lors d'une résolution de conflit
// de fusion. La constante restait locale au module alors que assistantApiService
// et chatbotApiService l'importent : `SERVER_ADRESS` y valait `undefined` et le
// build échouait ("Attempted import error").
export const SERVER_ADRESS = "http://172.16.0.81:8001/"
// export const SERVER_ADRESS = "http://localhost:8001/"
// export const SERVER_ADRESS = "http://192.168.108.101:8000/"

// Bien noté

//Local
// export const BASE_URL ="http://localhost:3000"; // URL DE BASEpm2 stop next-app
// export const BASE_URL_BK ="http://localhost:8000"; // URL DE BASE

// // SERVER
export const BASE_URL ="http://localhost:3001"; // URL DE BASEpm2 stop next-app
// export const BASE_URL = "http://172.16.0.81:3001"; // URL DE BASEpm2 stop next-app

// // LOCAL DEV PHONE
// // export const BASE_URL = process.env.BASE_URL; // URL DE BASEpm2 stop next-app
// export const API_BASE_URL = "http://localhost:3000/api/"; // URL DE BASE pm2 stop next-app

//Local
// export const BASE_URL ="http:///192.168.1.104:3000"; // URL DE BASEpm2 stop next-app
// export const BASE_URL_BK ="http:///192.168.1.104:8000"; // URL DE BASE

// SERVER
// export const BASE_URL ="http://172.16.0.81:3000"; // URL DE BASEpm2 stop next-app
// export const BASE_URL_BK ="http://172.16.0.81:8000"; // URL DE BASEpm2 stop next-app

// LOCAL DEV PHONE
// export const BASE_URL = process.env.BASE_URL; // URL DE BASEpm2 stop next-app
// URL RELATIVE : les appels partent vers le serveur qui a servi la page, quel
// que soit son port ou son adresse. Codée en dur sur http://localhost:3001,
// elle interrogeait un autre serveur (donc une autre base) ou échouait dès que
// l'application tournait ailleurs : opérateurs, services et offres ne se
// chargeaient plus.
export const API_BASE_URL = "/api/";
// export const API_BASE_URL = "http://172.16.0.81:3001/api/"; // URL DE BASE pm2 stop next-app
// export const API_BASE_URL = "http://92.168.1.117:3000/api/"; // URL DE BASE pm2 stop next-app

// Alias historique : même route que BASE_IMG_URL (URL relative -> indépendante
// de l'hôte/port sur lequel l'application tourne).
export const BASE_IMG_API = '/api/files/downloads/images?name=';

//M.Toure Phone
// export const BASE_URL = "http://10.90.196.168:3000"; // URL DE BASEpm2 stop next-app
// export const BASE_URL_BK = "http://10.90.196.168:8000"; // URL DE BASEpm2 stop next-app

// exp://192.168.137.4:8081

//SEMI-SERVER
// export const BASE_URL ="http://localhost:3000"; // URL DE BASEpm2 stop next-app
// export const BASE_URL_BK ="http://172.16.0.81:8000"; // URL DE BASE

//SEMI-SERVER LOCAL
// export const BASE_URL ="http://localhost:3000"; // URL DE BASEpm2 stop next-app
// export const BASE_URL_BK ="http://192.168.8.103:8000"; // URL DE BASEpm2 stop next-app

// export const BASE_URL ="http://172.16.0.81:3000"; // URL DE BASE
// export const BASE_URL_BK ="http://192.168.137.183:8000"; // URL DE BASE
// export const BASE_URL_BK ="http://192.168.137.27:8000"; // URL DE BASE LOCAL

// SERVEUR
// export const BASE_URL_BK ="http://176.16.0.81:8000"; // URL DE BASE
// export const BASE_URL_BK ="http://192.168.194.17:8000"; // URL DE BASE

// const BASE_URL_BK ="http://172.16.0.81:8000"; // URL DE BAS

// export const BASE_IMG_URL = 'http://172.16.0.81:3000/uploads/images/';
// export const BASE_FILE_URL = 'http://172.16.0.81:3000/uploads/files/';
// export const BASE_URL = 'http://172.16.0.81:3000/';
// export const BASE_URL_TEST = 'http://192.168.137.27:8000/';
// export const BASE_GOEJSON_URL = "http://172.16.0.81:3000/api/files/geojson";
// export const BASE_BACKEND_URL = "http://172.16.0.81:8000/"
// export const BASE_BACKEND_URL_NETWORK = "http://172.16.0.81:8000/"

// Le dossier `uploads/` est à la RACINE du projet (plus dans `public/`) : il
// n'est donc plus servi en statique. Les images et documents passent
// obligatoirement par les routes API ci-dessous.
// URLs RELATIVES : elles fonctionnent quel que soit l'hôte/port sur lequel
// l'application est servie (évite toute désynchronisation avec BASE_URL).
export const BASE_IMG_URL = '/api/files/downloads/images?name=';
export const BASE_FILE_URL = '/api/files/downloads/documents?name=';
export const BASE_GOEJSON_URL = BASE_URL + "/api/files/geojson";

// export const BASE_IMG_URL = 'http://localhost:3000/uploads/images/';
// export const BASE_FILE_URL = 'http://localhost:3000/uploads/files/';
// export const BASE_URL = 'http://localhost:3000/';
// export const BASE_URL_TEST = 'http://192.168.137.27:8000/';
// export const BASE_GOEJSON_URL = "http://localhost:3000/api/files/geojson";
// export const BASE_BACKEND_URL = "http://172.16.0.81:8000/"
// export const BASE_BACKEND_URL_NETWORK = "http://172.16.0.81:8000/"

export const LOCALITY_YEAR = 2024;

// export const BASE_IMG_URL = 'http://172.16.0.81/uploads/images/';
// export const BASE_URL = 'http://172.16.0.81/'
// export const BASE_GOEJSON_URL = "http://172.16.0.81/api/files/geojson"

export const generaleStats = "general-stasts"
export const tokenKey = "access_token_carto"
export const localStorePrefix = "carto"
export const secretKeyValue = "secret-key-value"
export const tokenAdminJwt = "token-admin"
export const tokenUserJwt = "token-user"
export const tokenOperatorJwt = "token-user-operator"
export const tokenActuatorJwt = "token-actuator"
export const newItemValue = "veaw-item"
export const userAdmin = "admin-user"
export const user = "user"
export const userOperator = "operator"
export const userActuator = "actuator-user"
export const showOnAdminBar = "show-a"

// export const httpRequestFileBase = "http://localhost:3333/"
// export const apiRequestBase = "http://localhost:3333/api/"

// export const apiRequestBase = "http://localhost:8000/api/"
// export const baseGeojsonUrl = "http://localhost:8000/api/get-data-file/geojson/"
// export const baseImagesUrl = "http://localhost:8000/api/get-file/"
// export const baseFileUrl = "http://localhost:8000/api/get-file/"

//SOURCES
export const sources = {
    map: {
        stateId: "stateid",
        districtId: "districts",
        regionId: "regions",
        departmentId: "departement",
        subPrefectureId: "sousprefecture",
        localityId: 'locality',
        cityId: "cities",
        railways: "railways",
        road: "raod",
    },
    fiber: {
        ansut: "fiber-ansut",
        awale: 'fiber-awale',
        mtn: 'fiber-mtn',
        orange: 'fiber-orange',
    },
    qos:
    {
        orange: {
            voice: "orangeVoice",
            sms: 'orangeSms',
            data: 'orangeData',
        },
        mtn: {
            voice: "ntmVoice",
            sms: 'mtnSms',
            data: 'data',
        },
        moov: {
            voice: "moovVoice",
            sms: 'moovSms',
            data: 'moovData',
        }
    }

}
//END SOURCES

//LAYERS
export const layers = {
    fill: {
        districtId: "district-fills",
        regionId: "region-fills",
        departmentId: "department-fills",
        subPrefectureId: "sub-prefecture-fills",
    },
    line: {
        stateId: "state-fill",
        districtId: "district-line",
        regionId: "region-line",
        departmentId: "department-line",
        subPrefectureId: "sub-prefecture-line",
        fiberAnsut: "fiber-line",
        fiberAwaler: "awale-line",
        fiberMTN: "mtn-line",
        fiberORANGE: "orange-line",
        fiberMOOV: "moov-line",
        railways: "railways-line",
        road: "raod-line",
    },
    circle: {
        localityId: "locality",
        covId: "cov",
        cov2GId: "cov2G",
        cov3GId: "cov3G",
        cov4GId: "cov4G",
        covNo2GId: "covNo2G",
        covNo3GId: "covNo3G",
        covNo4GId: "covNo4G",
        covOrangeId: "covOrange",
        orange2GId: "orange2G",
        orange3GId: "orange3G",
        orange4GId: "orange4G",
        covMtnId: "covMtn",
        mtn2GId: "mtn2G",
        mtn3GId: "mtn3G",
        mtn4GId: "mtn4G",
        covMoovId: "covMoov",
        moov2GId: "moov2G",
        moov3GId: "moov3G",
        moov4GId: "moov4G",
        noCovId: "noCov",
        whiteAreaId: "areaWhite",
        data: 'data',
        phone: 'phone',
        present: 'present',
        qos: {
            orange: {
                voice: 'orangeLayerVoice',
                sms: 'orangeLayerSms',
                data: 'orangeLayerData',
            },
            mtn: {
                voice: 'mtnLayerVoice',
                sms: 'mtnLayerSms',
                data: 'mtnLayerData',
            },
            moov: {
                voice: 'orangeLayerVoice',
                sms: 'mtnLayerVoice',
                data: 'mtnLayerData',
            }
        }
    },
    label: {
        districtId: "district-label",
        regionId: "region-label",
        departmentId: "department-label",
        subPrefectureId: "sub-prefecture-label",
        locality: "locality-label",
    },
}

//COLOR
export const colors = {
    map: {
        line: {
            stateId: "#000000",
            districtId: "#000000",
            regionId: "#933902",
            departmentId: "#7400FF",
            subPrefectureId: "#F905B6",
            railways: '#000000',
            road: "#C69373FF",
        },
        fill: {
            districtId: "rgba(7, 2, 88,0.5)",
            regionId: "rgba(147,57, 2, 0.3)",
            departmentId: "rgba(116,0,225,0.2)",
            subPrefectureId: "rgba(249,5,182,0.1)",
        },
        fiber: {
            ansut: "#FF0000",
            awale: "#15813B",
            orange: "#FF7901",
            mtn: "#FECE1F",
            moov: "#075BF7",
        }
    },
    coverage: {
        covLoc: "#00b09b",
        popCov: "#000000",
        present: '#8A4A25FF',
        noCovLoc: "red",
        orange: "#FF7901",
        mtn: "#FECE1F",
        moov: "#075bf7",
        whiteLoc: "white",
        _2G: '#4eda03',
        _3G: '#E21273',
        _4G: 'purple',
        none: '#FFFFFF',
    },
    qos: '#800001'
}

//
export const exportDataId = 'data-export-id';

export const chartDataLocCovOption = {
    aspectRatio: 1,
    title: {
        display: false,
        text: "Localités couvertes par technologie",
    },
    responsive: true,
    plugins: {
        legend: {
            labels: {
                boxWidth: 5,
                fontSize: 5,
                color: "white",
            },
            position: "bottom",
        },
        tooltip: {
            enabled: true,
            callbacks: {
                title: (tooltipItems) => `${tooltipItems[0].label}`,
                label: (tooltipItem) => {
                    const dataset = tooltipItem.dataset;
                    const value = tooltipItem.raw;
                    return ` ${dataset.label}:\n${value}`;
                },
            },
            backgroundColor: '#000000AF',
            titleColor: '#FFF',
            bodyColor: '#FFF',
            footerColor: '#666',
            borderWidth: 1,
            borderColor: '#ddd',
            zIndex: 20000,
        },
        datalabels: {
            display: false,
        },
    },
    scales: {
        x: {
            ticks: {
                display: true,
                font: {
                    size: 10,
                },
                color: "white",
            },
            grid: {
                color: "#9D9B9A",
            }
        },
        y: {
            ticks: {
                display: true,
                font: {
                    size: 10,
                },
                color: "white",
            },
            grid: {
                color: "#9D9B9A"
            }
        },
    },
}

export const chartDataPopCovOption = {
    aspectRatio: 1,
    title: {
        display: true,
        text: "Population couverte par technologie",
    },
    responsive: true,
    plugins: {
        legend: {
            labels: {
                boxWidth: 10,
                fontSize: 6,
                color: "white",
            },
            position: "bottom",
        },
        tooltip: {
            enabled: true,
            callbacks: {
                title: (tooltipItems) => `${tooltipItems[0].label}`,
                label: (tooltipItem) => {
                    const dataset = tooltipItem.dataset;
                    const value = tooltipItem.raw;
                    return ` ${dataset.label}:\n${value}`;
                },
            },
            backgroundColor: '#000000AF',
            titleColor: '#FFF',
            bodyColor: '#FFF',
            footerColor: '#666',
            borderWidth: 1,
            borderColor: '#ddd',
            zIndex: 20000,
        },
        datalabels: {
            display: false,
        },
    },
    scales: {
        x: {
            ticks: {
                display: true,
                font: {
                    size: 10,
                },
                color: "white",
            },
            grid: {
                color: "#9D9B9A"
            }
        },
        y: {
            ticks: {
                display: true,
                font: {
                    size: 10,
                },
                color: "white",
            },
            grid: {
                color: "#9D9B9A"
            }
        },
    },
}

export const chartSumDataOption = {
    tooltips: {
        mode: "index",
        intersect: false,
    },
    responsive: true,
    plugins: {
        legend: {
            labels: {
                boxWidth: 10,
                fontSize: 6,
                color: "white",
            },
            position: "bottom",
            color: "white"
        },
        tooltip: {
            enabled: true,
            callbacks: {
                title: (tooltipItems) => `${tooltipItems[0].label}`,
                label: (tooltipItem) => {
                    const dataset = tooltipItem.dataset;
                    const value = tooltipItem.raw;
                    return ` ${dataset.label}:\n${value}`;
                },
            },
            backgroundColor: '#000000AF',
            titleColor: '#FFF',
            bodyColor: '#FFF',
            footerColor: '#666',
            borderWidth: 1,
            borderColor: '#ddd',
            zIndex: 20000,
        },
        datalabels: {
            color: "#fff",
            font: {
                weight: "bold",
                size: 14,
            },
            formatter: (value, context) => {
                const total = context.dataset.data.reduce((acc, val) => acc + val, 0);
                const percentage = ((value / total) * 100).toFixed(2);
                return `${percentage}%`;
            },
        },
        // Ajout des pourcentages directement sur les segments
        // afterDatasetDraw(chart) {
        //     const { ctx } = chart;
        //     const dataset = chart.data.datasets[0];
        //     const total = dataset.data.reduce((sum, value) => sum + value, 0);

        //     chart.getDatasetMeta(0).data.forEach((dataPoint, index) => {
        //         const value = dataset.data[index];
        //         const percentage = ((value / total) * 100).toFixed(1);

        //         // Position de l'étiquette
        //         const { x, y } = dataPoint.tooltipPosition();
        //         ctx.fillStyle = "#fff";
        //         ctx.font = "bold 14px Arial";
        //         ctx.textAlign = "center";
        //         ctx.fillText(`${percentage}%`, x, y);
        //     });
        // },
    }
}

export const chartSumDataOptionLight = {
    tooltips: {
        mode: "index",
        intersect: false,
    },
    responsive: true,
    plugins: {
        legend: {
            labels: {
                boxWidth: 10,
                fontSize: 6,
                color: "black",
                font: {
                    size: 8,
                    family: 'Lato', // Appliquer "Lato" avec poids Black
                    weight: 900,    // Poids 900 pour "Lato Black"
                },
            },
            position: "top",
            color: "black",
            font: {
                family: 'Lato', // Appliquer "Lato" avec poids Black
                weight: 900,    // Poids 900 pour "Lato Black"
                size: 10,       // Taille de la police de la légende
            },
        },
        tooltip: {
            enabled: true,
            callbacks: {
                title: (tooltipItems) => `${tooltipItems[0].label}`,
                label: (tooltipItem) => {
                    const dataset = tooltipItem.dataset;
                    const value = tooltipItem.raw;
                    return ` ${dataset.label}:\n${value}`;
                },
            },
            backgroundColor: '#000000AF',
            titleColor: '#FFF',
            bodyColor: '#FFF',
            footerColor: '#666',
            borderWidth: 1,
            borderColor: '#ddd',
            cornerRadius: 4,  // Rayon des coins du tooltip
            z: 200000
        },
        datalabels: {
            color: "#fff",
            font: {
                family: 'Lato', // Appliquer "Lato" avec poids Black
                weight: 900,    // Poids 900 pour "Lato Black"
                size: 10,       // Taille de la police de la légende
            },
            formatter: (value, context) => {
                const total = context.dataset.data.reduce((acc, val) => acc + val, 0);
                const percentage = ((value / total) * 100).toFixed(2);
                return `${percentage}%`;
            },
        },
        // Ajout des pourcentages directement sur les segments
        // afterDatasetDraw(chart) {
        //     const { ctx } = chart;
        //     const dataset = chart.data.datasets[0];
        //     const total = dataset.data.reduce((sum, value) => sum + value, 0);

        //     chart.getDatasetMeta(0).data.forEach((dataPoint, index) => {
        //         const value = dataset.data[index];
        //         const percentage = ((value / total) * 100).toFixed(1);

        //         // Position de l'étiquette
        //         const { x, y } = dataPoint.tooltipPosition();
        //         ctx.fillStyle = "#fff";
        //         ctx.font = "bold 14px Arial";
        //         ctx.textAlign = "center";
        //         ctx.fillText(`${percentage}%`, x, y);
        //     });
        // },
    }
}

export const SingleDoughnutOption = {
    cutout: "75%", // Ajuste l'épaisseur du donut
    responsive: true,
    plugins: {
        legend: {
            labels: {
                boxWidth: 10,
                fontSize: 6,
                color: "black",
                font: {
                    family: 'Lato', // Appliquer "Lato" avec poids Black
                    weight: 900,    // Poids 900 pour "Lato Black"
                    size: 10,       // Taille de la police de la légende
                },
            },
            position: "top",
            color: "black",
            font: {
                family: 'Lato', // Appliquer "Lato" avec poids Black
                weight: 900,    // Poids 900 pour "Lato Black"
                size: 10,       // Taille de la police de la légende
            },
        datalabels: {
            display: true,
            color: "#fff",
            fontSize: 10,
            font: {
                family: 'Lato', // Appliquer "Lato" avec poids Black
                weight: 900,    // Poids 900 pour "Lato Black"
                size: 14,       // Taille de la police de la légende
            },
        },
        },
        tooltip: {
            enabled: true,
            callbacks: {
                title: (tooltipItems) => `${tooltipItems[0].label}`,
                label: (tooltipItem) => {
                    const dataset = tooltipItem.dataset;
                    const value = tooltipItem.raw;
                    return ` ${dataset.label}:\n${value}`;
                },
            },
            backgroundColor: '#000000AF',
            titleColor: '#FFF',
            bodyColor: '#FFF',
            footerColor: '#666',
            borderWidth: 1,
            borderColor: '#ddd',
            zIndex: 20000,
            font: {
                size: 8
            }
        },
    },
    elements: {
        arc: {
            roundedCornersFor: "end", // Arrondi sur la fin
        },
    },
}

export const notifsTests = [
    {
        "titre": "Mise à jour du réseau 5G",
        "description": "La mise à jour majeure du réseau 5G est désormais déployée dans plusieurs régions. Profitez de meilleures performances de connexion.",
        "categorie": "Mise à jour"
    },
    {
        "titre": "Maintenance du réseau prévue",
        "description": "Une maintenance du réseau sera effectuée ce week-end entre 2h et 4h du matin. Des interruptions temporaires sont possibles.",
        "categorie": "Mise à jour"
    },
    {
        "titre": "Amélioration de la couverture 4G",
        "description": "De nouvelles antennes 4G ont été installées pour améliorer la couverture dans les zones rurales.",
        "categorie": "Mise à jour"
    },
    {
        "titre": "Nouveaux équipements sur le réseau fibre",
        "description": "Le déploiement des nouveaux équipements sur le réseau fibre optique a commencé dans les grandes villes.",
        "categorie": "Mise à jour"
    },
    {
        "titre": "Mise à jour de sécurité sur le réseau",
        "description": "Une mise à jour de sécurité a été appliquée pour protéger les utilisateurs contre les cyberattaques potentielles sur le réseau mobile.",
        "categorie": "Mise à jour"
    },
    {
        "titre": "Lancement de la 6G : nouvelle ère des télécommunications",
        "description": "L'initiative mondiale pour le lancement de la 6G a été officiellement annoncée. Elle pourrait révolutionner la communication sans fil.",
        "categorie": "Actualité"
    },
    {
        "titre": "Une nouvelle norme pour la 5G",
        "description": "Une nouvelle norme pour la 5G a été adoptée, permettant des vitesses de connexion encore plus rapides et une latence réduite.",
        "categorie": "Actualité"
    },
    {
        "titre": "Accord entre opérateurs pour l'extension du réseau",
        "description": "Un nouvel accord entre les principaux opérateurs permettra d'étendre la couverture du réseau mobile dans les zones reculées.",
        "categorie": "Actualité"
    },
    {
        "titre": "L'impact de la 5G sur les villes intelligentes",
        "description": "Une étude montre que la 5G aura un impact majeur sur le développement des villes intelligentes et l'Internet des objets.",
        "categorie": "Actualité"
    },
    {
        "titre": "Evolution des tarifs pour l'Internet haut débit",
        "description": "Les opérateurs télécoms ajustent leurs tarifs pour l'Internet haut débit afin de rendre la fibre optique plus accessible.",
        "categorie": "Actualité"
    }
]


/**
 * URL d'une image stockée, ou image de remplacement si le chemin est absent.
 *
 * Les écrans construisaient `BASE_IMG_URL + operator?.imagePath` : quand le
 * chemin manquait, le navigateur demandait « …/images?name=undefined » et
 * affichait une image cassée. Un pixel transparent est renvoyé à la place,
 * sans aucune requête.
 */
const BLANK_IMAGE =
  "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

export const imageUrl = (name) =>
  name && String(name) !== "undefined" && String(name) !== "null"
    ? BASE_IMG_URL + encodeURIComponent(name)
    : BLANK_IMAGE;
