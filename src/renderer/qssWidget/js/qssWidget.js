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
        gradeNames: ["gpii.psp.messageBundles", "fluid.viewComponent", "gpii.psp.linksInterceptor"],

        // may be given from the main process
        params: {
            sounds: null
        },

        components: {
            qssWidget: {
                type: "gpii.psp.qssWidget",
                container: "{translatedQssWidget}.container",
                options: "{translatedQssWidget}.options.params"
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
            menu: ".flc-qssMenuWidget",
            learnMoreLink: ".flc-qssWidget-learnMoreLink"
        },

        events: {
            onWidgetBlur: null,
            onSettingUpdated: null,
            onQssWidgetSettingAltered: null,
            onQssWidgetNotificationRequired: null,
            onQssWidgetCreated: null
        },

        sounds: {},

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
                    sounds: "{qssWidget}.options.sounds",
                    events: {
                        onNotificationRequired: "{qssWidget}.events.onQssWidgetNotificationRequired",
                        onQssWidgetCreated: "{qssWidget}.events.onQssWidgetCreated"
                    },
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
                    },
                    invokers: {
                        notifyCreated: {
                            func: "{that}.events.onQssWidgetCreated.fire",
                            args: [null]
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
            learnMoreLink: {
                type: "gpii.psp.qssWidget.learnMoreLink",
                container: "{that}.dom.learnMoreLink",
                options: {
                    model: {
                        setting: "{qssWidget}.model.setting"
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
                        onQssWidgetClosed:               null,
                        onQssWidgetSettingAltered:       "{qssWidget}.events.onQssWidgetSettingAltered",
                        onQssWidgetBlur:                 "{qssWidget}.events.onWidgetBlur",
                        onQssWidgetNotificationRequired: "{qssWidget}.events.onQssWidgetNotificationRequired",
                        onQssWidgetCreated:              "{qssWidget}.events.onQssWidgetCreated"
                    }
                }
            }
        },

        listeners: {
            onSettingUpdated: {
                funcName: "gpii.app.applier.replace",
                args: [
                    "{that}.applier",
                    "setting",
                    "{arguments}.0"
                ]
            },
            onQssWidgetCreated: {
                funcName: "gpii.psp.qssWidget.updateContainerVisibility",
                args: [
                    "{that}.dom.stepper",
                    "{that}.dom.menu",
                    "{that}.model.setting"
                ],
                priority: "last"
            }
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
        if (activationParams.key) {
            // If the widget is show via the keyboard, focus the first element after the close button.
            focusManager.focus(1, true);
        } else {
            // Otherwise there will be no focused element and any remaining highlight will be removed.
            focusManager.removeHighlight(true);
        }
    };

    fluid.defaults("gpii.psp.qssWidget.learnMoreLink", {
        gradeNames: [
            "fluid.viewComponent",
            "gpii.qss.elementRepeater.keyListener",
            "gpii.qss.elementRepeater.clickable"
        ],

        model: {
            setting: null,
            messages: {
                learnMore: "Learn more..."
            }
        },

        modelListeners: {
            "messages.learnMore": {
                this: "{that}.container",
                method: "text",
                args: ["{change}.value"]
            }
        },

        events: {
            onSpacebarPressed: null,
            onEnterPressed: null
        },

        listeners: {
            onClicked: "{that}.activate",
            onSpacebarPressed: "{that}.activate",
            onEnterPressed: "{that}.activate"
        },

        invokers: {
            activate: {
                funcName: "gpii.psp.qssWidget.learnMoreLink.activate",
                args: ["{that}.model.setting"]
            }
        }
    });

    gpii.psp.qssWidget.learnMoreLink.activate = function (setting) {
        if (setting && setting.learnMoreLink) {
            gpii.psp.openUrlExternally(setting.learnMoreLink);
        }
    };
})(fluid);
