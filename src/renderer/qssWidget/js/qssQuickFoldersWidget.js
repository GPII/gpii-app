/**
 * The QSS Quick folders widget
 *
 * Represents the QSS Quick folders widget. Shows input and button and on
 * submit tries to find if there is a folder with that name (contained in
 * siteconfig's morphicQuickFolderPath folder) and if there is one opens it.
 *
 * Copyright 2019 Raising the Floor - International
 *
 * Licensed under the New BSD license. You may not use this file except in
 * compliance with this License.
 * The research leading to these results has received funding from the European Union's
 * Seventh Framework Programme (FP7/2007-2013) under grant agreement no. 289016.
 * You may obtain a copy of the License at
 * https://github.com/GPII/universal/blob/master/LICENSE.txt
 */

/* global fluid */

"use strict";
(function (fluid) {
    var gpii = fluid.registerNamespace("gpii");

    /**
     * QSS Quick folders widget
     */
    fluid.defaults("gpii.qssWidget.quickFolders", {
        gradeNames: ["fluid.viewComponent", "gpii.psp.selectorsTextRenderer"],

        selectors: {
            folderSearch: ".flc-qssQuickFoldersWidget-folderSearch",
            settingTitle: ".flc-qssSearchWidget-settingTitle",
            searchField: ".flc-search",
            searchButton: ".flc-searchButton",
            labelTitle: ".flc-qssSearchWidget-label",
            errorMessage: ".flc-qssSearchWidget-errorMessage"
        },

        enableRichText: true,

        model: {
            setting: {},
            value: "{that}.model.setting.value",
            messages: {
                labelTitle: "{quickFolders}.model.messages.label",
                searchButtonLabel: "{quickFolders}.model.messages.searchButtonLabel",
                alertLabel: "{quickFolders}.model.messages.alertLabel"
            },
            errorMessageSelector: "{that}.options.selectors.errorMessage",
        },

        listeners: {
            onCreate: {
                func: "{that}.onCreate"
            }
        },
        invokers: {
            onCreate: {
                funcName: "gpii.qssWidget.quickFolders.onCreate",
                args: ["{gpii.qssWidget.quickFolders}.errorMessage"] // sending the errorMessage component
            }
        },

        components: {
            searchField: {
                type: "gpii.psp.widgets.textfield",
                container: "{that}.dom.searchField",
                options: {
                    model: {
                        value: "{gpii.qssWidget.quickFolders}.model.value"
                    },
                    invokers: {
                        onSearch: {
                            funcName: "gpii.qssWidget.quickFolders.onSearch",
                            args: [
                                "{that}.model.value", // search field value
                                "{gpii.qssWidget.quickFolders}.errorMessage", //errorMessage component
                                "{gpii.qssWidget.quickFolders}.options.siteConfig.morphicQuickFolderPath" // siteConfig's base folder
                            ]
                        }
                    }
                }
            },
            searchButton: {
                type: "gpii.psp.widgets.button",
                container: "{that}.dom.searchButton",
                options: {
                    model: {
                        label: "{gpii.qssWidget.quickFolders}.model.messages.searchButtonLabel"
                    },
                    invokers: {
                        onClick: "{gpii.qssWidget.quickFolders}.searchField.onSearch"
                    }
                }
            },
            errorMessage: {
                type: "gpii.psp.widgets.alert",
                container: "{that}.dom.errorMessage",
                options: {
                    model: {
                        label: "{gpii.qssWidget.quickFolders}.model.messages.alertLabel"
                    },
                    styles: {
                        alertHidden: "fl-qssSearchWidget-alert-hidden"
                    },
                    invokers: {
                        onError: {
                            funcName: "gpii.qssWidget.quickFolders.onError",
                            args: [
                                "{that}.container", // errorMessage element
                                "{that}.options.styles" // styles list
                            ]
                        },
                        onSuccess: {
                            funcName: "gpii.qssWidget.quickFolders.onSuccess",
                            args: [
                                "{that}.container", // errorMessage element
                                "{that}.options.styles" // styles list
                            ]
                        }
                    }
                }
            }
        }
    });

    /**
     * Invoked on create of the component; by default hides the alert
     * @param {Component} errorMessage
     */
    gpii.qssWidget.quickFolders.onCreate = function (errorMessage) {
        errorMessage.onSuccess();
    };

    /**
     * Invoked on the submit button, looks if the folder exists and open it
     * @param {String} folderValue
     * @param {Component} errorMessage
     * @param {String} morphicQuickFolderPath
     */
    gpii.qssWidget.quickFolders.onSearch = function (folderValue, errorMessage, morphicQuickFolderPath) {
        let directory = morphicQuickFolderPath + folderValue;

        if (gpii.psp.checkIfDirectoryExists(directory)) {
            // hides the alert (if shown before)
            errorMessage.onSuccess();
            // tries to open explorer on this folder
            gpii.psp.openFileExplorer(directory);
        } else {
            // shows the alert
            errorMessage.onError();
        }
    };

    /**
     * Shows the alert on error
     * @param {jQuery} element - DOM element of the alert
     * @param {Object} styles - A hash containing mapping between CSS class
     */
    gpii.qssWidget.quickFolders.onError = function (element, styles) {
        element.removeClass(styles.alertHidden);
    };

    /**
     * Shows the alert on error
     * @param {jQuery} element - DOM element of the alert
     * @param {Object} styles - A hash containing mapping between CSS class
     */
    gpii.qssWidget.quickFolders.onSuccess = function (element, styles) {
        element.addClass(styles.alertHidden);
    };

})(fluid);
