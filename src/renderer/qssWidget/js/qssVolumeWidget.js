/**
 * The QSS Volume adjust widget
 *
 * Represents the QSS menu widget which is used for adjust volune settings
 *
 * Copyright 2019 Raising the Floor - International
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
     * QSS Volume widget
     */
    fluid.defaults("gpii.qssWidget.volume", {
        gradeNames: ["fluid.viewComponent", "gpii.psp.heightObservable", "gpii.psp.selectorsTextRenderer"],

        selectors: {
            heightListenerContainer: ".flc-qssVolumeWidget-controls",
            controlsWrapper: ".flc-qssVolumeWidget-wrapper",
            stepper: ".flc-volumeStepper",
            switch: ".flc-volumeSwitch",
            switchTitle: ".flc-volumeWidget-switchTitle",
            helpImage: ".flc-qssVolumeWidget-helpImage",
            extendedTip: ".flc-qssVolumeWidget-extendedTip"
        },

        enableRichText: true,
        sounds: {},

        model: {
            setting: {},
            messages: {},
            value: "{that}.model.setting.value"
        },
        events: {
            onHeightChanged: null
        },
        listeners: {
            "onCreate": {
                this: "{that}.dom.helpImage",
                method: "attr",
                args: ["src", "{that}.model.setting.schema.helpImage"]
            }
        },
        modelListeners: {
            "setting.value": {
                func: "{channelNotifier}.events.onQssWidgetSettingAltered.fire",
                args: ["{that}.model.setting"],
                includeSource: "fromWidget"
            }
        },
        invokers: {
            calculateHeight: {
                funcName: "gpii.qssWidget.calculateHeight",
                args: [
                    "{qssWidget}.container",
                    "{that}.dom.controlsWrapper",
                    "{that}.dom.heightListenerContainer"
                ]
            }
        },
        components: {
            stepper: {
                type: "gpii.qssWidget.baseStepper",
                container: "{that}.dom.stepper",
                options: {
                    sounds: "{volume}.options.sounds",
                    model: {
                        messages: "{volume}.model.messages"
                    },
                    invokers: {
                        activateIncBtn: {
                            funcName: "gpii.qssWidget.volume.activateButton",
                            args: [
                                "up", // volume up
                                "{volume}",
                                "{channelNotifier}.events.onQssVolumeControl" // volume control event
                            ]
                        },
                        activateDecBtn: {
                            funcName: "gpii.qssWidget.volume.activateButton",
                            args: [
                                "down", // volume down
                                "{volume}",
                                "{channelNotifier}.events.onQssVolumeControl" // volume control event
                            ]
                        }
                    }
                }
            },
            switchButton: {
                type: "gpii.psp.widgets.switch",
                container: "{that}.dom.switch",
                options: {
                    model: {
                        enabled: "{volume}.model.value",
                        messages: {
                            on: "{volume}.model.messages.on",
                            off: "{volume}.model.messages.off"
                        }
                    },
                    invokers: {
                        toggleModel: {
                            funcName: "gpii.qssWidget.volume.toggleModel",
                            args: [
                                "{that}",
                                "{channelNotifier}.events.onQssVolumeControl" // volume control event
                            ]
                        }
                    }
                }
            }
        }
    });


    /**
     * Invoked whenever the either button is activated. Fires the onQssVolumeControl
     * with the appropriate action ("up", or "down"). This activates the windows control
     * for volume up or down
     * @param {String} action - it can be up or down.
     * @param {gpii.qssWidget.volume} volumeWidget - The `gpii.psp.widgets.volume.switchButton` instance.
     * @param {fluid.event} volumeControlEvent - the onQssVolumeControl event.
     */
    gpii.qssWidget.volume.activateButton = function (action, volumeWidget, volumeControlEvent) {
        volumeControlEvent.fire(action);

        // Switch mute toggle if already muted
        if (volumeWidget.model.value) {
            volumeWidget.applier.change("value", false, null, "fromWidget");
        }
    };

    /**
     * Invoked whenever the user has activated the "switch" UI element (either
     * by clicking on it or pressing "Space" or "Enter"). What this function
     * does is to change the `enabled` model property to its opposite value and update settings.
     * @param {gpii.qssWidget.volume.switchButton} that - The `gpii.psp.widgets.switch` instance.
     * @param {fluid.event} volumeControlEvent - the onQssVolumeControl event.
     */
    gpii.qssWidget.volume.toggleModel = function (that, volumeControlEvent) {
        // toggle the widget
        that.applier.change("enabled", !that.model.enabled, null, "fromWidget");

        // use the onQssVolumeControl event to send the mute event
        volumeControlEvent.fire("mute");
    };
})(fluid);
