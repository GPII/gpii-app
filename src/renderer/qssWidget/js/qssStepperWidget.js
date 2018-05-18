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


    fluid.defaults("gpii.qssWidget.stepperKeyListeners", {
        gradeNames: ["gpii.qss.elementRepeater.keyListener", "fluid.component"],

        // set listeners on the window object
        target: { expander: { funcName: "jQuery", args: [window] } },

        events: {
            onArrowDownPressed: null,
            onArrowUpPressed: null
        }
    });

    /**
     * TODO
     */
    fluid.defaults("gpii.qssWidget.stepper.contentHandler", {
        gradeNames: ["fluid.viewComponent", "gpii.psp.selectorsTextRenderer"],

        model: {
            messages: {
                incrementButton: "Larger",
                decrementButton: "Smaller",

                tipTitle: "To change Text Size",
                tipSubtitle: "Use mouse or Up/Down arrow keys",

                footerTip: "You can also use Ctrl - and Ctrl + on your keyboard in many applications"
            },
            setting: {}
        },

        selectors: {
            incButton: ".flc-qssStepperWidget-incBtn",
            decButton: ".flc-qssStepperWidget-decBtn",

            tipTitle: ".flc-tipTitle",
            tipSubtitle: ".flc-tipSubtitle",

            footerTip: ".flc-qssStepperWidget-footerTip"
        },

        invokers: {
            activateIncBtn: {
                funcName: "gpii.qssWidget.stepper.activateButton",
                args: [
                    "{that}.dom.incButton",
                    "{that}.model.setting.value",
                    "{that}.model.setting" // only restrictions will be used
                ]
            },
            activateDecBtn: {
                funcName: "gpii.qssWidget.stepper.activateButton",
                args: [
                    "{that}.dom.decButton",
                    "{that}.model.setting.value",
                    "{that}.model.setting"
                ]
            }
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
        gradeNames: ["gpii.qssWidget.baseStepper"],

        model: {
            messages: {
                titlebarAppName: "Change Text Size"
            },
            setting: {
                value:       5,
                divisibleBy: 3,
                min:         5,
                max:         15
            }, // the currently handled setting

            value: "{that}.model.setting.value",
            stepperParams: {
                divisibleBy: "{that}.model.setting.divisibleBy",
                min:         "{that}.model.setting.min",
                max:         "{that}.model.setting.max"
            }
        },

        events: {
            onSettingAltered: null
        },

        modelListeners: {
            // TODO use local event?
            "value": [{
                func: "{channelNotifier}.events.onQssSettingAltered.fire",
                args: ["{that}.model.setting"],
                includeSource: "settingAlter"
            }, { // XXX dev
                funcName: "console.log",
                args: ["{change}.value"]
            }]
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
                container: ".flc-qssStepperWidget",
                options: {
                    model: {
                        setting: "{stepper}.model.setting"
                    }
                }
            },
            // register window key listeners
            windowKeyListener: {
                type: "fluid.component",
                options: {
                    gradeNames: "gpii.qss.elementRepeater.keyListener",

                    // set listeners on the window object
                    target: { expander: { funcName: "jQuery", args: [window] } },

                    events: {
                        onArrowDownPressed: null,
                        onArrowUpPressed: null
                    },

                    listeners: {
                        onArrowUpPressed: [{
                            func: "{stepper}.increment"
                        }, {
                            func: "{contentHandler}.activateIncBtn"
                        }],
                        onArrowDownPressed: [{
                            func: "{stepper}.decrement"
                        }, {
                            func: "{contentHandler}.activateDecBtn"
                        }]
                    }
                }
            }
        }
    });
})(fluid);
