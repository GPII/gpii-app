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
            onSettingUpdated: null
        },

        components: {
            widget: {
                type: "@expand:gpii.psp.qssWidget.getWidgetType({arguments}.0)",
                createOnEvent: "onSettingUpdated",
                container: "{qssWidget}.container",
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
                        onQssWidgetClosed: null,
                        onQssSettingAltered: null
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

    gpii.psp.qssWidget.getWidgetType = function (setting) {
        return setting.type === "number" ? "gpii.qssWidget.stepper" : "gpii.qssWidget.menu";
    };

    gpii.psp.qssWidget.updateContainerVisibility = function (stepperElement, menuElement, setting) {
        if (setting.type === "number") {
            stepperElement.show();
            menuElement.hide();
        } else {
            stepperElement.hide();
            menuElement.show();
        }
    };
})(fluid);
