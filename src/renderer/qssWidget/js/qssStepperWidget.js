/**
 * The quick set strip widget
 *
 * Represents the quick set strip stepper widget. It is used for
 * incrementing/decrementing a setting.
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


    fluid.defaults("gpii.qssWidget.stepper.contentHandler", {
        gradeNames: ["fluid.viewComponent", "gpii.psp.selectorsTextRenderer"],

        model: {
            messages: {
                incrementButton: "Larger",
                decrementButton: "Smaller",

                tipTitle: "To change Text Size",
                tipSubtitle: "Use mouse or Up/Down arrow keys",

                footerTip: "You can also use Ctrl - and Ctrl + on your keyboard in many applications"
            }
        },

        selectors: {
            incButton: ".flc-qssStepperWidget-incBtn",
            decButton: ".flc-qssStepperWidget-decBtn",

            tipTitle: ".flc-tipTitle",
            tipSubtitle: ".flc-tipSubtitle",

            footerTip: ".flc-qssStepperWidget-footerTip"
        },

        components: {
            incButton: {
                type: "gpii.psp.widgets.button",
                container: "{that}.dom.incButton",
                options: {
                    model: {
                        label: "{contentHandler}.model.messages.incrementButton"
                    },
                    invokers: {
                        onClick: "{stepper}.increment"
                    }
                }
            },
            decButton: {
                type: "gpii.psp.widgets.button",
                container: "{that}.dom.decButton",
                options: {
                    model: {
                        label: "{contentHandler}.model.messages.decrementButton"
                    },
                    invokers: {
                        onClick: "{stepper}.decrement"
                    }
                }
            }
        }
    });

    /**
     * Represents the QSS stepper widget.
     */
    fluid.defaults("gpii.qssWidget.stepper", {
        gradeNames: ["fluid.modelComponent"],

        model: {
            messages: {
                titlebarAppName: "Change Text Size"
            },
            // XXX dev
            setting: {
                value: 10,
                divisibleBy: 1
            } // the currently handled setting
        },

        modelListeners: {
            setting: {
                func: "{channelNotifier}.events.onQssSettingAltered.fire",
                args: ["{change}.value"],
                includeSource: "settingAlter"
            }
        },

        invokers: {
            increment: {
                changePath: "setting.value",
                value: {
                    expander: {
                        funcName: "gpii.qssWidget.stepper.sum",
                        args: [
                            "{that}.model.setting.value",
                            "{that}.model.setting.divisibleBy"
                        ]
                    }
                },
                source: "settingAlter"
            },
            decrement: {
                changePath: "setting.value",
                value: {
                    expander: {
                        funcName: "gpii.qssWidget.stepper.sum",
                        args: [
                            "{that}.model.setting.value",
                            "{that}.model.setting.divisibleBy",
                            true
                        ]
                    }
                },
                source: "settingAlter"
            }
        },


        components: {
            titlebar: {
                type: "gpii.psp.titlebar",
                container: ".flc-titlebar",
                options: {
                    model: {
                        messages: {
                            title: "{stepper}.model.messages.titlebarAppName"
                        }
                    },
                    events: {
                        onClose: "{channelNotifier}.events.onQssWidgetClosed"
                    }
                }
            },

            contentHandler: {
                type: "gpii.qssWidget.stepper.contentHandler",
                container: ".flc-qssWidget"
            },


            // TODO send data from the main process
            channelListener: {
                type: "gpii.psp.channelListener",
                options: {
                    events: {
                        // Add events from the main process to be listened for
                        onSettingUpdated: null
                    },
                    // XXX dev
                    listeners: {
                        onSettingUpdated: {
                            funcName: "console.log",
                            args: ["Settings updated: ", "{arguments}.0"]
                        }
                    }
                }
            },
            channelNotifier: {
                type: "gpii.psp.channelNotifier",
                options: {
                    events: {
                        // Add events the main process to be notified for
                        onQssWidgetClosed: null,
                        onQssSettingAltered: null
                    }
                }
            }
        }
    });


    /**
     * Either add or subtract two values.
     *
     * @param {Number} a - The initial value
     * @param {Number} b - The that is to be added or subtracted
     * @param {Boolean} shouldSubtract - Whether subtraction to be done
     * @returns {Number} The summed value.
     */
    gpii.qssWidget.stepper.sum = function (a, b, shouldSubtract) {
        return a + (shouldSubtract ? -b : b);
    };
})(fluid);
