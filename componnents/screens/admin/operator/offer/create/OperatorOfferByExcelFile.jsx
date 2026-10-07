import React, { useEffect, useState } from 'react'
import { ReactSpreadsheetImport } from "react-spreadsheet-import";

export default function OperatorOfferByExcelFile({ isOpen, setIsOpen, handleSumitByExcel }) {
    const [fields, setfields] = useState([]);

    useEffect(() => {
        let _fields = []

            _fields.push(
                {
                    // Visible in table header and when matching columns.
                    label: "Code",
                    // This is the key used for this field when we call onSubmit.
                    key: "code",
                    // Allows for better automatic column matching. Optional.
                    alternateMatches: ["code localité", "code", "CODE LOCALITE", "CODE_LOCALITE"],
                    // Used when editing and validating information.
                    fieldType: {
                        // There are 3 types - "input" / "checkbox" / "select".
                        type: "input",
                    },
                    // Used in the first step to provide an example of what data is expected in this field. Optional.
                    example: "CI00001",
                    // Can have multiple validations that are visible in Validation Step table.
                    validations: [
                        {
                            // Can be "required" / "unique" / "regex"
                            rule: "required",
                            errorMessage: "Le code est obligatoire",
                            // There can be "info" / "warning" / "error" levels. Optional. Default "error".
                            level: "error",
                        },
                    ],
                },)
        // if(technologies && operators){
        //     operators.forEach(oper => {
        //         technologies.forEach(tech => {
        //             _fields.push(
        //                 {
        //                     // Visible in table header and when matching columns.
        //                     label: "Couverture " + tech?.name + " " + oper?.name,
        //                     // This is the key used for this field when we call onSubmit.
        //                     key: "cov" + tech?.name + oper?.name,
        //                     // Allows for better automatic column matching. Optional.
        //                     alternateMatches: ["COUVERTURE " + tech?.name + " " + oper?.name, "COUVERTURE_" + tech?.name + "_" + oper?.name],
        //                     // Used when editing and validating information.
        //                     fieldType: {
        //                         // There are 3 types - "input" / "checkbox" / "select".
        //                         type: "input",
        //                     },
        //                     // Used in the first step to provide an example of what data is expected in this field. Optional.
        //                     example: "1",
        //                 },
        //             );
        
        //             _fields.push(
        //                 {
        //                     // Visible in table header and when matching columns.
        //                     label: "Presence " + tech?.name + " " + oper?.name,
        //                     // This is the key used for this field when we call onSubmit.
        //                     key: "pres" + tech?.name + oper?.name,
        //                     // Allows for better automatic column matching. Optional.
        //                     alternateMatches: [
        //                         "PRESENCE " + tech?.name + " " + oper?.name, 
        //                         "PRESENCE_" + tech?.name + "_" + oper?.name,
        //                         "PRESENCE COUVERTURE " + tech?.name + " " + oper?.name, 
        //                         "PRESENCE_" + tech?.name + "_" + oper?.name],
        //                     // Used when editing and validating information.
        //                     fieldType: {
        //                         // There are 3 types - "input" / "checkbox" / "select".
        //                         type: "input",
        //                     },
        //                     // Used in the first step to provide an example of what data is expected in this field. Optional.
        //                     example: "1",
        //                 },
        //             );
        //             _fields.push(
        //                 {
        //                     // Visible in table header and when matching columns.
        //                     label: "Prévision " + tech?.name + " " + oper?.name,
        //                     // This is the key used for this field when we call onSubmit.
        //                     key: "prev" + tech?.name + oper?.name,
        //                     // Allows for better automatic column matching. Optional.
        //                     alternateMatches: [
        //                         "PREVISION " + tech?.name + " " + oper?.name,
        //                         "PREVISION DE " + tech?.name + " " + oper?.name,
        //                         "PREVISION DE COUVERTURE " + tech?.name + " " + oper?.name, 
        //                         "PREVISION_" + tech?.name + "_" + oper?.name
        //                     ],
        //                     // Used when editing and validating information.
        //                     fieldType: {
        //                         // There are 3 types - "input" / "checkbox" / "select".
        //                         type: "input",
        //                     },
        //                     // Used in the first step to provide an example of what data is expected in this field. Optional.
        //                     example: "1",
        //                 },
        //             );
        //         });
        //         _fields.push(
        //             {
        //                 // Visible in table header and when matching columns.
        //                 label: "Couverture data " + oper?.name,
        //                 // This is the key used for this field when we call onSubmit.
        //                 key: "covData" + oper?.name,
        //                 // Allows for better automatic column matching. Optional.COUVERTURE EN SERVICE DE TELEPHONIE MOOV
        //                 alternateMatches: [
        //                     "COUVERTURE DATA " + oper?.name, 
        //                     "COUVERTURE_DATA_" + oper?.name,
        //                     "COUVERTURE SERVICE DATA " + oper?.name,
        //                 ],
        //                 // Used when editing and validating information.
        //                 fieldType: {
        //                     // There are 3 types - "input" / "checkbox" / "select".
        //                     type: "input",
        //                 },
        //                 // Used in the first step to provide an example of what data is expected in this field. Optional.
        //                 example: "1",
        //             },
        //         );
        //         _fields.push(
        //             {
        //                 // Visible in table header and when matching columns.
        //                 label: "Couverture telephonie " + oper?.name,
        //                 // This is the key used for this field when we call onSubmit.
        //                 key: "covTel" + oper?.name,
        //                 // Allows for better automatic column matching. Optional.
        //                 alternateMatches: [
        //                     "COUVERTURE TELEPHONIE " + oper?.name, 
        //                     "COUVERTURE_TELEPHONIE_" + oper?.name,
        //                     "COUVERTURE EN SERVICE DE TELEPHONIE " + oper?.name, 
        //                 ],
        //                 // Used when editing and validating information.
        //                 fieldType: {
        //                     // There are 3 types - "input" / "checkbox" / "select".
        //                     type: "input",
        //                 },
        //                 // Used in the first step to provide an example of what data is expected in this field. Optional.
        //                 example: "1",
        //             },
        //         );
        //     });
        //     setfields(_fields);
        // }

    }, []);

    return (<ReactSpreadsheetImport
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onSubmit={(data) => {
            handleSumitByExcel(data.validData)
        }}
        fields={fields}
        autoMapSelectValues={true}
        isNavigationEnabled={true}
        translations={{
            uploadStep: {
                title: "Selectionné un fichier",
                manifestTitle: "Données attendues :",
                manifestDescription: "",
                dropzone: {
                    title: "Glisser deposer un fichier .xlsx, .xls ou .csv",
                    buttonTitle: "Selectionner un fichier",
                    errorToastDescription: "Erreur, le type de fichier doit être .xlsx, .xls ou .csv",
                    loadingTitle: "Chargement...",
                },
            },
            selectHeaderStep: {
                title: "Sélectionner l'en-tête ",
                nextButtonTitle: "Suivant",
                backButtonTitle: "Retour",
            },
            matchColumnsStep: {
                title: 'Colonnes de correspondance',
                nextButtonTitle: "Suivant",
                userTableTitle: "Votre tableeau",
                templateTitle: "Deviendra",
                selectPlaceholder: "Selectionner une colonne",
                duplicateColumnWarningTitle: "Vous tentez de dupliquer une colonne",
                duplicateColumnWarningDescription: "Les colonnes ne peuvent pas être dupliquées",
                backButtonTitle: "Retour",
            },
            validationStep: {
                title: "Valider les données",
                nextButtonTitle: "Suivant",
                noRowsMessage: "Aucune donnée",
                discardButtonTitle: "Rejeter la ligne sélectionnée",
                filterSwitchTitle: "Afficher uniquement les erreurs de lignes",
                backButtonTitle: "Retour",
            },
            alerts: {
                confirmClose: {
                    headerTitle: "Quitter le flux d'importation",
                    bodyText: "Vous êtes sûr de vous ? Vos informations actuelles ne seront pas sauvegardées.",
                    cancelButtonTitle: "Annuler",
                    exitButtonTitle: "Sortir",
                },
                submitIncomplete: {
                    headerTitle: "Erreurs détectées",
                    bodyText: "Certaines lignes contiennent encore des erreurs. Les lignes contenant des erreurs seront ignorées lors de la soumission.",
                    bodyTextSubmitForbidden: "Certaines lignes contiennent encore des erreurs.",
                    cancelButtonTitle: "Annuler",
                    finishButtonTitle: "Envoyer",
                },
                submitError: {
                    title: "Erreur",
                    defaultMessage: "Une erreur s'est produite lors de l'envoi des données",
                },
                unmatchedRequiredFields: {
                    headerTitle: "Toutes les colonnes ne correspondent pas",
                    bodyText: "Certaines colonnes obligatoires ne sont pas prises en compte ou sont ignorées. Voulez-vous continuer ?",
                    listTitle: "Les colonnes ne correspondent pas :",
                    cancelButtonTitle: "Annuler",
                    continueButtonTitle: "Continuer",
                },
                toast: {
                    error: "Erreur",
                },
            },

        }}
        customTheme={{
            components: {
                Button: {
                    baseStyle: {
                        borderRadius: "10px",
                    },
                    defaultProps: {
                        colorScheme: "orange",
                    },
                },
                UploadStep: {
                    baseStyle: {
                        heading: {
                            fontSize: "3xl",
                            color: "textColor",
                            mb: "2rem",
                        },
                        title: {
                            fontSize: "2xl",
                            lineHeight: 0,
                            fontWeight: "semibold",
                            color: "textColor",
                        },
                        subtitle: {
                            fontSize: "md",
                            lineHeight: 6,
                            color: "blue",
                            mb: "1rem",
                        },
                        tableWrapper: {
                            mb: "0.5rem",
                            position: "relative",
                            h: "85px",
                        },
                        dropzoneText: {
                            size: "lg",
                            lineHeight: 7,
                            fontWeight: "semibold",
                            color: "textColor",
                        },
                        dropZoneBorder: "rsi.500",
                        dropzoneButton: {
                            mt: "1rem",
                        },
                    },
                },
            },
        }}
    />
    )
}
