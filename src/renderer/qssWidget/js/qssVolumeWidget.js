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
            value: "{that}.model.setting.value",
            previousValue: "{that}.model.setting.schema.previousValue",
            messageChannel: "volumeMessageChannel" // Channel listening for messages related volume/mute functionality
        },
        events: {
            onHeightChanged: null
        },
        listeners: {
            "onCreate": {
                this: "{that}.dom.helpImage",
                method: "attr",
                args: ["src", "{that}.model.setting.schema.helpImage"]
            },
            "onCreate.registerIpcListener": {
                funcName: "gpii.psp.registerIpcListener",
                args: ["{that}.model.messageChannel", "{volume}.loadActualValue"]
            },
            "onCreate.sendGetVolumeRequest": {
                funcName: "{channelNotifier}.events.onQssGetVolumeRequested.fire",
                args: ["{that}.model.messageChannel"]
            }
        },
        modelListeners: {
            value: {
                funcName: "gpii.qssWidget.volume.updateSwitchState",
                args: ["{switchButton}", "{change}.value"]
            }
        },
        invokers: {
            loadActualValue: {
                funcName: "gpii.qssWidget.volume.loadActualValue",
                args: ["{volume}", "{arguments}.0"]
            },
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
                        setting: "{volume}.model.setting",
                        messages: "{volume}.model.messages",
                        previousValue: "{volume}.model.previousValue",
                        value: "{volume}.model.setting.value"
                    },
                    events: {
                        onNotificationRequired: "{volume}.events.onNotificationRequired"
                    }
                }
            },
            switchButton: {
                type: "gpii.psp.widgets.switch",
                container: "{that}.dom.switch",
                options: {
                    model: {
                        enabled: {
                            expander: {
                                funcName: "gpii.qssWidget.volume.transformValue",
                                args: ["{volume}.model.setting.value"]
                            }
                        },
                        messages: {
                            on: "{volume}.model.messages.on",
                            off: "{volume}.model.messages.off"
                        }
                    },
                    invokers: {
                        toggleModel: {
                            funcName: "gpii.qssWidget.volume.toggleModel",
                            args: ["{that}", "{volume}", "{stepper}", "{channelNotifier}.events.onQssWidgetSettingAltered"]
                        }
                    }
                }
            }
        }
    });

    /**
     * Set the actual volume value in the case the volume is changed through the Windows itself
     * @param {Component} that - The `gpii.psp.widgets.volume` instance.
     * @param {Number} value - The value of the setting.
     */
    gpii.qssWidget.volume.loadActualValue = function (that, value) {
        that.applier.change("value", value, null, "fromWidget");
    };

    /**
     * Invoked whenever the volume value is changed and updating the state of the
     * volume switch button.
     * @param {Component} switchButton - The `gpii.psp.widgets.volume.switchButton` instance.
     * @param {Number} value - The value of the setting.
     */
    gpii.qssWidget.volume.updateSwitchState = function (switchButton, value) {
        if (!value !== switchButton.model.enabled) {
            switchButton.applier.change("enabled", !switchButton.model.enabled, null, "fromWidget");
        } else if (value !== 0 && switchButton.model.enabled) {
            switchButton.applier.change("enabled", !switchButton.model.enabled, null, "fromWidget");
        }
    };

    /**
     * Transforms a number value to boolean.
     * @param {Number} value - The value of the setting
     * @return {Boolean} The modified value.
     */
    gpii.qssWidget.volume.transformValue = function (value) {
        return !value;
    };

    /**
     * Invoked whenever the user has activated the "switch" UI element (either
     * by clicking on it or pressing "Space" or "Enter"). What this function
     * does is to update model value and update settings.
     * @param {Component} that - The `gpii.psp.widgets.volume.switchButton` instance.
     * @param {Component} volumeWidget - The `gpii.psp.widgets.volume` instance.
     * @param {Component} stepper - The `gpii.psp.widgets.volumeStepper instance.
     * @param {EventListener} event - onQssWidgetSettingAltered event
     */
    gpii.qssWidget.volume.toggleModel = function (that, volumeWidget, stepper, event) {
        if (!volumeWidget.model.setting.value && !that.model.enabled) {
            return;
        }

        if (volumeWidget.model.setting.value !== 0) {
            volumeWidget.applier.change("previousValue", volumeWidget.model.setting.value, null, "fromWidget");
            stepper.applier.change("previousValue", volumeWidget.model.setting.value, null, "fromWidget");
            that.applier.change("previousValue", volumeWidget.model.setting.value, null, "fromWidget");
        }

        if (!that.model.enabled && volumeWidget.model.setting.value !== 0) {
            volumeWidget.applier.change("value", 0, null, "fromWidget");
            stepper.applier.change("value", 0, null, "fromWidget");

        } else {
            volumeWidget.applier.change("value", volumeWidget.model.previousValue, null, "fromWidget");
            stepper.applier.change("value", volumeWidget.model.previousValue, null, "fromWidget");

        }

        // update the volume setting
        event.fire(volumeWidget.model.setting);
    };
})(fluid);
