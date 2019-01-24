/**
 * The QSS Mouse widget
 *
 * Represents the QSS menu widget which is used for adjust mouse settings that have a list
 * of predefined values.
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
     * Represents the QSS mouse widget.
     */
    fluid.defaults("gpii.qssWidget.mouse", {
        gradeNames: ["fluid.viewComponent", "gpii.psp.selectorsTextRenderer"],

        selectors: {
            // toggleButton: ".flc-toggleButton",
            // toggleButton: ".flc-toggleButton",
            // helpImage: ".flc-qssToggleWidget-helpImage",
            // extendedTip: ".flc-qssWidget-extendedTip",
            mouseSpeed: ".flc-qssMouseWidget-mouseSpeed",
            swapMouseButtons: ".flc-qssMouseWidget-swapMouseButtons",
            easierDoubleClick: ".flc-qssMouseWidget-easierDoubleClick",
            largerMousePointer: ".flc-qssMouseWidget-largerMousePointer"
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
                    },
                    easierDoubleClick: {
                        value: false,
                        schema: {
                            title: null
                        }
                    },
                    largerMousePointer: {
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
                container: "{that}.dom.swapMouseButtons",
                options: {
                    model: {
                        setting: "{gpii.qssWidget.mouse}.model.setting.settings.swapMouseButtons"
                    }
                }
            },
            easierDoubleClick: {
                type: "gpii.qssWidget.baseToggle",
                container: "{that}.dom.easierDoubleClick",
                options: {
                    model: {
                        setting: "{gpii.qssWidget.mouse}.model.setting.settings.easierDoubleClick"
                    }
                }
            },
            largerMousePointer: {
                type: "gpii.qssWidget.baseToggle",
                container: "{that}.dom.largerMousePointer",
                options: {
                    model: {
                        setting: "{gpii.qssWidget.mouse}.model.setting.settings.largerMousePointer"
                    }
                }
            }
        }
    });
})(fluid);
