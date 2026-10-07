const { PrismaClient } = require("@prisma/client");
const { data } = require("jquery");
const prisma = new PrismaClient();

const data = [
  {
    "offerType":"1",
    "verskth":"2xskudCkmxSLHRCbCG5YwauyDZq3XkOOx9eqhDUEkMYeurPr63vQwFURrRZBC4Fd",
    "userId":"1",
    //"parentOfferId":1,
    "operatorId":"1",
    "code" : "OF-001",
    "title": "MTN C'est chic ",
    "billingType":"1", //1 = PRE-PAYE  2 = POST-PAYE
    "category": "1",  //1 = MOBILE, 2 = FIXE
    "promoType":"SPECIAL",
    "notifiDate":"2024-10-10",
    "startDate":"2024-10-10",
    "duration":"4",
    "target": "Cible test de l'offre",
    "formulas":[
        {
            "title" :"Test F1",
            "description": "Description test Formule simple",
            "children":[
                {
                    "type": "price",
                    "title" :"Child A",
                    "description": "Description test",
                    "settlement": {
                        "price": "322", 
                        "validity": "3",
                        "services": {
                            "DATA": true, 
                            "quantityDATA":"23", 
                            "bStepDATA": "12", 
                            "SMS": true, 
                            "quantitySMS":"12", 
                            "bStepSMS": "6", 
                            "VOIX": true, 
                            "quantityVOIX":"43", 
                            "bStepVOIX": "7"
                        }
                    }
                }
            ]
        },
        {
            "type": "price",
            "title" :"AZZ",
            "description": "Description test",
            "settlement": {
                "price": "12", 
                "validity": "10",
                "services": {
                    "VOIX": true, 
                    "quantityVOIX":"23", 
                    "bStepVOIX": "12", 
                    "SMS": true, 
                    "quantitySMS": "11",
                    "bStepSMS": "20"
                }
            }
        },
        {
            "type": "price",
            "title" :"AZZ",
            "description": "Description test",
            "settlement": {
                "price": "12", 
                "validity": "10",
                "services": {
                    "SMS": true, 
                    "quantitySMS":"23", 
                    "bStepSMS": "12"
                }
            }
        }
    ],
    "area":{
        "countries": {
            "Islande": {
                "parentId": 29,
                "id": 86,
                "value": true,
                "name": "Islande"
            },
            "Liechtenstein": {
                "parentId": 29,
                "id": 103,
                "value": true,
                "name": "Liechtenstein"
            },
            "Cuba": {
                "parentId": 10,
                "id": 49,
                "value": true,
                "name": "Cuba"
            },
            "Panama": {
                "parentId": 10,
                "id": 136,
                "value": true,
                "name": "Panama"
            },
            "Argentine": {
                "parentId": 10,
                "id": 10,
                "value": true,
                "name": "Argentine"
            }
        },
        "title": "INTERNATIONAL",
        "organizations": {
            "AELE": {
                "id": 29,   
                "name": "AELE",
                "value": true
            },
            "ALBA": {
                "id": 10,
                "name": "ALBA",
                "value": true
            }
        }
    },
    "documentPath":"test_gel_ppp_iututuuu",
    "description":"Bienvenue !",
    "rateApplied":null,
    "accessModes":[
        {"content": "Access Mode pour des tests"}
    ]
},
{
    "offerType":"1",
    "verskth":"2xskudCkmxSLHRCbCG5YwauyDZq3XkOOx9eqhDUEkMYeurPr63vQwFURrRZBC4Fd",
    "userId":"1",
    //"parentOfferId":1,
    "operatorId":"1",
    "code" : "OF-00000321211346",
    "title": "Offre de l'ARTCI Test",
    "billingType":"1", //1 = PRE-PAYE  2 = POST-PAYE
    "category": "1",  //1 = MOBILE, 2 = FIXE
    "promoType":"SPECIAL",
    "notifiDate":"2024-10-10",
    "startDate":"2024-10-10",
    "duration":"4",
    "target": "Cible test de l'offre",
    "formulas":[
        {
            "title" :"Test F1",
            "description": "Description test Formule simple",
            "children":[
                {
                    "type": "price",
                    "title" :"Child A",
                    "description": "Description test",
                    "settlement": {
                        "price": "322", 
                        "validity": "3",
                        "services": {
                            "DATA": true, 
                            "quantityDATA":"23", 
                            "bStepDATA": "12", 
                            "SMS": true, 
                            "quantitySMS":"12", 
                            "bStepSMS": "6", 
                            "VOIX": true, 
                            "quantityVOIX":"43", 
                            "bStepVOIX": "7"
                        }
                    }
                }
            ]
        },
        {
            "type": "price",
            "title" :"AZZ",
            "description": "Description test",
            "settlement": {
                "price": "12", 
                "validity": "10",
                "services": {
                    "VOIX": true, 
                    "quantityVOIX":"23", 
                    "bStepVOIX": "12", 
                    "SMS": true, 
                    "quantitySMS": "11",
                    "bStepSMS": "20"
                }
            }
        },
        {
            "type": "price",
            "title" :"AZZ",
            "description": "Description test",
            "settlement": {
                "price": "12", 
                "validity": "10",
                "services": {
                    "SMS": true, 
                    "quantitySMS":"23", 
                    "bStepSMS": "12"
                }
            }
        }
    ],
    "area":{
        "countries": {
            "Islande": {
                "parentId": 29,
                "id": 86,
                "value": true,
                "name": "Islande"
            },
            "Liechtenstein": {
                "parentId": 29,
                "id": 103,
                "value": true,
                "name": "Liechtenstein"
            },
            "Cuba": {
                "parentId": 10,
                "id": 49,
                "value": true,
                "name": "Cuba"
            },
            "Panama": {
                "parentId": 10,
                "id": 136,
                "value": true,
                "name": "Panama"
            },
            "Argentine": {
                "parentId": 10,
                "id": 10,
                "value": true,
                "name": "Argentine"
            }
        },
        "title": "INTERNATIONAL",
        "organizations": {
            "AELE": {
                "id": 29,   
                "name": "AELE",
                "value": true
            },
            "ALBA": {
                "id": 10,
                "name": "ALBA",
                "value": true
            }
        }
    },
    "documentPath":"test_gel_ppp_iututuuu",
    "description":"Bienvenue !",
    "rateApplied":null,
    "accessModes":[
        {"content": "Access Mode pour des tests"}
    ]
}
]

async function offerTypeSeeder() {
  const types = [
    { 
      code: "OF-T1", 
      name: "NATIONALE", 
      description: "",
    },
    { 
      code: "OF-T2", 
      name: "INTERNATIONALE", 
      description: "",
    },
    { 
      code: "OF-T3", 
      name: "ROAMING", 
      description: "",
    },
  ];
  
  for (const type of types) {
    await prisma.offerType.create({
        data:type,
    });
  }
}

module.exports = offerTypeSeeder;
