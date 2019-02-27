/**
 * The QSS Quick folders widget
 *
 * Represents the QSS menu widget ... TODO add description
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
     * Represents the QSS Quick folders widget.
     */
    fluid.defaults("gpii.qssWidget.quickFolders", {
        gradeNames: ["fluid.viewComponent", "gpii.psp.selectorsTextRenderer"],

        selectors: {
            // helpImage: ".flc-qssQuickFoldersWidget-helpImage",
            // extendedTip: ".flc-qssQuickFoldersWidget-extendedTip",
            folderSearch: ".flc-qssQuickFoldersWidget-folderSearch"
        },

        enableRichText: true,

        model: {
            setting: {
                settings: {
                    folderSearch: {
                        value: "",
                        schema: {
                            title: null
                        }
                    }
                }
            },
            morphicQuickFolderPath: null
        },

        listeners: {
            onCreate: {
                func: "{that}.log"
            }
        },
        invokers: {
            log: {
                funcName: "gpii.qssWidget.quickFolders.log",
                args: ["{that}"]
            }
        },

        components: {
            folderSearch: {
                type: "gpii.qssWidget.search",
                container: "{that}.dom.folderSearch",
                options: {
                    model: {
                        setting: "{gpii.qssWidget.quickFolders}.model.setting.settings.folderSearch",
                        // setting: "{gpii.qssWidget.quickFolders}.model",
                        morphicQuickFolderPath: "{gpii.qssWidget.quickFolders}.model.morphicQuickFolderPath"
                    }
                }
            }
        }
    });

    gpii.qssWidget.quickFolders.log = function (that) {
        // console.log(that);
    };
})(fluid);
