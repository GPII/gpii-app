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
                        messages: "{volume}.model.messages"
                    },
                    events: {
                        onNotificationRequired: "{volume}.events.onNotificationRequired"
                    },
                    invokers: {
                        increment: {
                            funcName: "gpii.qssWidget.volume.makeRestrictedStep",
                            args: [
                                "{that}",
                                "{that}.model.setting.value",
                                "{that}.model.setting.schema",
                                1, // step multiplier, no effect of the step itself
                                "{volume}.model.previousValue"
                            ]
                        },
                        decrement: {
                            funcName: "gpii.qssWidget.volume.makeRestrictedStep",
                            args: [
                                "{that}",
                                "{that}.model.setting.value",
                                "{that}.model.setting.schema",
                                -1, // step multiplier to reverse the step
                                "{volume}.model.previousValue"
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
     * does is to change the `enabled` model property to its opposite value and update settings.
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
            volumeWidget.model.setting.previousValue = volumeWidget.model.setting.value;
            that.applier.change("previousValue", volumeWidget.model.setting.value, null, "fromWidget");
        }

        if (!that.model.enabled && volumeWidget.model.setting.value !== 0) {
            volumeWidget.model.setting.value = 0;
            volumeWidget.model.value = 0;
        } else {
            volumeWidget.model.setting.value = volumeWidget.model.setting.previousValue;
            volumeWidget.model.value = volumeWidget.model.setting.previousValue;
        }

        // update the volume setting
        event.fire(volumeWidget.model.setting);

        that.applier.change("enabled", !that.model.enabled, null, "fromWidget");
        volumeWidget.applier.change("value", volumeWidget.model.value, null, "fromWidget");
    };

    /**
     * Either increases or decreases the current setting's value (depending on the
     * `shouldSubtract` parameter) with the `divisibleBy` amount specified in the
     * setting's schema. It also takes care that the new value of the setting does
     * not become bigger/smaller than the maximum/minimum allowed value for the
     * setting.
     * @param {Component} that - The `gpii.qssWidget.volumeStepper` instance.
     * @param {Number} value - The initial value of the setting before the operation.
     * @param {Object} schema - Describes the schema of the setting.
     * @param {Number} schema.min - The minimum possible value for the setting.
     * @param {Number} schema.max - The maximum possible value for the setting.
     * @param {Number} schema.divisibleBy - The amount which is added or subtracted
     * from the setting's value every time this function is invoked.
     * @param {Number} stepMultiplier - a basic numeric step multiplier, if its 1 there
     * will be no change in the step size, -1 will reverse it, and everything else
     * will act as a real multiplier (2 for 2x as an example)
     * subtracted from or added to the setting's value.
     * @param {Number} previousValue - The value before the mute button is activated
     * @return {Boolean} Whether there was a change in the setting's value.
     */
    gpii.qssWidget.volume.makeRestrictedStep = function (that, value, schema, stepMultiplier, previousValue) {
        var restrictedValue;
        if (value === 0 && previousValue !== undefined) {
            restrictedValue = previousValue;
        } else {
            var step = schema.divisibleBy * stepMultiplier;

            value = parseFloat( (value + step).toPrecision(3) );
            // Handle not given min and max
            restrictedValue = value;

            if (fluid.isValue(schema.max)) {
                restrictedValue = Math.min(restrictedValue, schema.max);
            }

            if (fluid.isValue(schema.min)) {
                restrictedValue = Math.max(restrictedValue, schema.min);
            }
        }

        that.applier.change("value", restrictedValue, null, "fromWidget");

        // Whether a bound was hit
        return value !== restrictedValue;
    };
})(fluid);
