/**
 * Initializes the QuickSetStrip widget window
 *
 * Creates the Quick Set Strip widget once the document has been loaded.
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

    fluid.defaults("gpii.psp.translatedQssWidget", {
        gradeNames: ["gpii.psp.messageBundles", "fluid.viewComponent"],

        components: {
            qssWidget: {
                type: "gpii.psp.qssWidget",
                container: "{translatedQssWidget}.container"
            }
        }
    });

    /**
     * Wrapper that enables translations for the `gpii.qss` component and
     * applies interception of all anchor tags on the page so that an external browser is used
     * for loading them.
     */
    fluid.defaults("gpii.psp.qssWidget", {
        gradeNames: ["fluid.viewComponent"],

        model: {
            setting: {}
        },

        selectors: {
            stepper: ".flc-qssStepperWidget",
            menu: ".flc-qssMenuWidget"
        },

        events: {
            onWidgetBlur: null,
            onSettingUpdated: null,
            onQssWidgetSettingAltered: null
        },

        components: {
            titlebar: {
                type: "gpii.psp.titlebar",
                container: ".flc-titlebar",
                options: {
                    events: {
                        onClose: "{channelNotifier}.events.onQssWidgetClosed"
                    }
                }
            },
            widget: {
                type: "@expand:gpii.psp.qssWidget.getWidgetType({arguments}.0)",
                createOnEvent: "onSettingUpdated",
                container: "{qssWidget}.container",
                options: {
                    model: {
                        setting: "{qssWidget}.model.setting",
                        messages: {
                            tipTitle: "To Change %settingTitle",
                            tipSubtitle: "Use mouse or Up/Down arrow keys, then press Enter to select."
                        }
                    },
                    modelRelay: {
                        "tipTitle": {
                            target: "messages.tipTitle",
                            singleTransform: {
                                type: "fluid.transforms.free",
                                func: "fluid.stringTemplate",
                                args: [
                                    "{that}.model.messages.tipTitle",
                                    {settingTitle: "{that}.model.setting.schema.title"}
                                ]
                            }
                        }
                    },
                    selectors: {
                        tipTitle: ".flc-tipTitle",
                        tipSubtitle: ".flc-tipSubtitle"
                    },
                    activationParams: "{arguments}.1",
                    listeners: {
                        "onCreate.processParams": {
                            funcName: "gpii.qssWidget.processParams",
                            args: ["{focusManager}", "{that}.options.activationParams"]
                        }
                    }
                }
            },
            focusManager: {
                type: "gpii.qss.verticalFocusManager",
                container: "{qssWidget}.container"
            },
            windowKeyListener: {
                type: "fluid.component",
                options: {
                    gradeNames: "gpii.qss.elementRepeater.keyListener",
                    target: {
                        expander: {
                            funcName: "jQuery",
                            args: [window]
                        }
                    },
                    events: {
                        onArrowLeftPressed: null,
                        onArrowRightPressed: null,
                        onEscapePressed: null
                    },
                    listeners: {
                        onArrowLeftPressed: "{that}.blur({arguments}.0)",
                        onArrowRightPressed: "{that}.blur({arguments}.0)",
                        onEscapePressed: "{that}.blur({arguments}.0)"
                    },
                    invokers: {
                        blur: {
                            funcName: "gpii.psp.qssWidget.blur",
                            args: [
                                "{qssWidget}",
                                "{arguments}.0" // KeyboardEvent
                            ]
                        }
                    }
                }
            },
            // TODO send data from the main process
            channelListener: {
                type: "gpii.psp.channelListener",
                options: {
                    events: {
                        // Add events from the main process to be listened for
                        onSettingUpdated: "{qssWidget}.events.onSettingUpdated"
                    }
                }
            },
            channelNotifier: {
                type: "gpii.psp.channelNotifier",
                options: {
                    events: {
                        // Add events the main process to be notified for
                        onQssWidgetClosed: null,
                        onQssWidgetSettingAltered: "{qssWidget}.events.onQssWidgetSettingAltered",
                        onQssWidgetBlur: "{qssWidget}.events.onWidgetBlur"
                    }
                }
            }
        },

        listeners: {
            onSettingUpdated: [{
                changePath: "setting",
                value: "{arguments}.0"
            }, {
                funcName: "gpii.psp.qssWidget.updateContainerVisibility",
                args: [
                    "{that}.dom.stepper",
                    "{that}.dom.menu",
                    "{arguments}.0" // setting
                ]
            }]
        }
    });

    gpii.psp.qssWidget.blur = function (qssWidget, KeyboardEvent) {
        qssWidget.events.onWidgetBlur.fire({
            setting: qssWidget.model.setting,
            key: KeyboardEvent.key
        });
    };

    gpii.psp.qssWidget.getWidgetType = function (setting) {
        return setting.schema.type === "number" ? "gpii.qssWidget.stepper" : "gpii.qssWidget.menu";
    };

    gpii.psp.qssWidget.updateContainerVisibility = function (stepperElement, menuElement, setting) {
        if (setting.schema.type === "number") {
            stepperElement.show();
            menuElement.hide();
        } else {
            stepperElement.hide();
            menuElement.show();
        }
    };

    gpii.qssWidget.processParams = function (focusManager, activationParams) {
        activationParams = activationParams || {};

        switch (activationParams.key) {
        case "ArrowUp":
            focusManager.focusLastElement(true);
            break;
        case "ArrowDown":
            focusManager.focus(1, true); // focus the first element after the close button
            break;
        case "Spacebar":
        case "Enter":
            focusManager.focusFirstElement(true); // focus the close button with a navigation highlight
            break;
        default:
            focusManager.focusFirstElement(false); // mouse/touch interaction - focus the close button without highlight
        }
    };
})(fluid);
