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

    // TODO use in about dialog
    fluid.defaults("gpii.psp.textHolder", {
        modelListeners: {
            // Any change means that the whole view should be re-rendered
            "messages": {
                funcName: "gpii.psp.renderText",
                args: [
                    "{that}",
                    "{that}.options.selectors",
                    "{that}.model.messages"
                ]
            }
        }
    });

    gpii.psp.renderText = function (that, selectors, messages) {
        fluid.each(selectors, function (value, key) {
            var element = that.dom.locate(key);
            if (element && messages[key]) {
                element.text(messages[key]);
            }
        });
    };


    fluid.defaults("gpii.qssWidget.stepper.contentHandler", {
        gradeNames: ["fluid.viewComponent", "gpii.psp.textHolder"],

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
                        onClick: "{stepper}.events.onIncButtonClicked.fire"
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
                        onClick: "{stepper}.events.onDecButtonClicked.fire"
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
                titlebarAppName: "This is programmable"
            },
            setting: null // the currently handled setting
        },

        events: {
            onIncButtonClicked: null,
            onDecButtonClicked: null
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
                        onQssWidgetClosed: null
                    }
                }
            }
        }
    });
})(fluid);
