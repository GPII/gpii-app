/**
 * The QSS search widget
 *
 * Represents the quick set strip search widget.
 * TODO add description
 * Copyright 2017 Raising the Floor - International
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
     * Represents the QSS search widget.
     */
    fluid.defaults("gpii.qssWidget.search", {
        gradeNames: ["fluid.viewComponent", "gpii.psp.selectorsTextRenderer"],

        selectors: {
            searchField: ".flc-search",
            searchButton: ".flc-searchButton",
            settingTitle: ".flc-qssSearchWidget-settingTitle",
            errorMessage: ".flc-qssSearchWidget-errorMessage"
        },

        enableRichText: true,

        model: {
            setting: {},
            value: "{that}.model.setting.value",
            messages: {
                searchButtonLabel: "{that}.model.setting.schema.searchButtonLabel",
                alertLabel: "{that}.model.setting.schema.alertLabel"
            },
            errorMessageSelector: "{that}.options.selectors.errorMessage",
            morphicFolder: null
        },

        components: {
            searchField: {
                type: "gpii.psp.widgets.textfield",
                container: "{that}.dom.searchField",
                options: {
                    model: {
                        value: "{gpii.qssWidget.search}.model.value",
                        morphicFolder: "{gpii.qssWidget.search}.model.morphicFolder"
                    },
                    invokers: {
                        onSearch: {
                            funcName: "gpii.qssWidget.search.onSearch",
                            args: ["{that}", "{gpii.qssWidget.search}.errorMessage"]
                        }
                    }
                }
            },
            searchButton: {
                type: "gpii.psp.widgets.button",
                container: "{that}.dom.searchButton",
                options: {
                    model: {
                        label: "{gpii.qssWidget.search}.model.messages.searchButtonLabel"
                    },
                    invokers: {
                        onClick: "{gpii.qssWidget.search}.searchField.onSearch"
                    }
                }
            },
            errorMessage: {
                type: "gpii.psp.widgets.alert",
                container: "{that}.dom.errorMessage",
                options: {
                    model: {
                        label: "{gpii.qssWidget.search}.model.messages.alertLabel"
                    },
                    styles: {
                        alertHidden: "fl-qssSearchWidget-alert-hidden"
                    },
                    invokers: {
                        onError: {
                            funcName: "gpii.qssWidget.search.onError",
                            args: [
                                "{that}.container",
                                "{that}.options.styles"
                            ]
                        },
                        onSuccess: {
                            funcName: "gpii.qssWidget.search.onSuccess",
                            args: [
                                "{that}.container",
                                "{that}.options.styles"
                            ]
                        }
                    }
                }
            }
        }
    });

    /** TODO
     * Invoked whenever the user has clicked the "search" button (either
     * by clicking on it or pressing "Enter"). What this function
     * does is to change call a function that open Windows file explorer.
     * @param {Component} that - The `gpii.psp.widgets.textfield` instance.
     */

     // TODO navigation through tab and enter
    gpii.qssWidget.search.onSearch = function (that, errorMessage) {
        let directory = "C:\\Morphic QuickFolders\\" + that.model.value;

        if (gpii.psp.checkIfDirectoryExists(directory)) {
            errorMessage.onSuccess();
            gpii.psp.openFileExplorer(directory);
        } else {
            errorMessage.onError();
        }
    };

    gpii.qssWidget.search.onError = function (element, styles) {
        console.log('============= onError');
        element.removeClass(styles.alertHidden);
    };

    gpii.qssWidget.search.onSuccess = function (element, styles) {
        console.log('============= onSuccess');
        element.addClass(styles.alertHidden);
    };

})(fluid);
