/**
 * The QSS toggle widget
 *
 * Represents the quick set strip toggle widget. It is used for adjusting the
 * values of "boolean" settings.
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
     * Represents the QSS toggle widget.
     */
    fluid.defaults("gpii.qssWidget.mouse", {
        gradeNames: ["fluid.viewComponent", "gpii.psp.selectorsTextRenderer"],

        selectors: {
            // toggleButton: ".flc-toggleButton",
            // toggleButton: ".flc-toggleButton",
            // helpImage: ".flc-qssToggleWidget-helpImage",
            // extendedTip: ".flc-qssWidget-extendedTip",
            mouseSpeed: ".flc-qssMouseWidget-mouseSpeed",
            // TODO
            swapMouseButtons: ".flc-qssMouseWidget-mouseSpeed"
        },

        enableRichText: true,

        model: {
            setting: {
                settings: {
                    mouseSpeed: {
                        value: 0,
                        schema: {
                            title: null
                        }
                    },
                    swapMouseButtons: {
                        value: false,
                        schema: {
                            title: null
                        }
                    }
                }
            },
            messages: {
                // something i18n
            }
        },

        components: {
            mouseSpeed: {
                type: "gpii.qssWidget.baseStepper",
                container: "{that}.dom.mouseSpeed",
                options: {
                    model: {
                        setting: "{gpii.qssWidget.mouse}.model.setting.settings.mouseSpeed"
                    }
                }
            },
            swapMouseButtons: {
                type: "gpii.qssWidget.baseToggle",
                container: "{that}.dom.swapMouseButton",
                options: {
                    model: {
                        setting: "{gpii.qssWidget.mouse}.model.setting.settings.swapMouseButtons"
                    }
                }
            }
        }
    });
})(fluid);
