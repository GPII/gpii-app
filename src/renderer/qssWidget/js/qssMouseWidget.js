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
            mouseSpeed: ".flc-qssMouseWidget-mouseSpeed",
            indicators: ".flc-qssMouseSpeedStepperWidget-indicators",
            swapMouseButtons: ".flc-qssMouseWidget-swapMouseButtons",
            easierDoubleClick: ".flc-qssMouseWidget-easierDoubleClick",
            largerMousePointer: ".flc-qssMouseWidget-largerMousePointer"
        },

        events: {
            onQssWidgetNotificationRequired: null,
            onQssWidgetSettingAltered: null
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

        sounds: {},

        components: {
            mouseSpeed: {
                type: "gpii.qssWidget.baseStepper",
                container: "{that}.dom.mouseSpeed",
                options: {
                    sounds: "{mouse}.options.sounds",
                    model: {
                        messages: "{mouse}.model.messages",
                        setting: "{mouse}.model.setting.settings.mouseSpeed",
                        value: "{mouse}.model.setting.settings.mouseSpeed.value"
                    },
                    events: {
                        onNotificationRequired: "{mouse}.events.onQssWidgetNotificationRequired"
                    },
                    invokers: {
                        increment: {
                            funcName: "gpii.qssWidget.mouse.makeRestrictedStep",
                            args: [
                                "{that}",
                                "{that}.model.setting.value",
                                "{that}.model.setting.schema",
                                -1
                            ]
                        },
                        decrement: {
                            funcName: "gpii.qssWidget.mouse.makeRestrictedStep",
                            args: [
                                "{that}",
                                "{that}.model.setting.value",
                                "{that}.model.setting.schema",
                                1
                            ]
                        }
                    },
                    components: {
                        indicators: {
                            type: "gpii.qssWidget.baseStepper.indicators",
                            container: "{mouse}.dom.indicators",
                            options: {
                                model: {
                                    setting: "{mouseSpeed}.model.setting"
                                }
                            }
                        }
                    }
                }
            },
            swapMouseButtons: {
                type: "gpii.qssWidget.mouseWidgetToggle",
                container: "{that}.dom.swapMouseButtons",
                options: {
                    model: {
                        setting: "{mouse}.model.setting.settings.swapMouseButtons"
                    }
                }
            },
            easierDoubleClick: {
                type: "gpii.qssWidget.mouseWidgetToggle",
                container: "{that}.dom.easierDoubleClick",
                options: {
                    model: {
                        setting: "{mouse}.model.setting.settings.easierDoubleClick"
                    }
                }
            },
            largerMousePointer: {
                type: "gpii.qssWidget.mouseWidgetToggle",
                container: "{that}.dom.largerMousePointer",
                options: {
                    model: {
                        setting: "{mouse}.model.setting.settings.largerMousePointer"
                    }
                }
            },
            channelNotifier: {
                type: "gpii.psp.channelNotifier",
                options: {
                    events: {
                        // Add events the main process to be notified for
                        onQssWidgetSettingAltered:       "{mouse}.events.onQssWidgetSettingAltered",
                        onQssWidgetNotificationRequired: "{mouse}.events.onQssWidgetNotificationRequired"
                    }
                }
            }
        }
    });

    /**
     * A custom function specific only for the mouse speed stepper.
     * Either increases or decreases the current setting's value (depending on the
     * `stepMultiplier` parameter) with the `divisibleBy` amount specified in the
     * setting's schema. It also takes care that the new value of the setting does
     * not become bigger/smaller than the maximum/minimum allowed value for the
     * setting.
     * The difference from the original one (gpii.qssWidget.baseStepper.makeRestrictedStep)
     * is that handle the edge case in which the windows pointer speed cannot accept a value of 0.
     * @param {Component} that - The `gpii.qssWidget.mouseSpeedStepper` instance.
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
     * @return {Boolean} Whether there was a change in the setting's value.
     */
    gpii.qssWidget.mouse.makeRestrictedStep = function (that, value, schema, stepMultiplier) {
        var step = schema.divisibleBy * stepMultiplier,
            restrictedValue;

        if (value === schema.min && stepMultiplier === -1) {
            // handle edge case specific only to mouse speed steppper
            restrictedValue = 2;
        } else {
            value = parseFloat( (value - step).toPrecision(3) );

            // Handle not given min and max
            restrictedValue = value;
        }

        if (fluid.isValue(schema.max)) {
            restrictedValue = Math.min(restrictedValue, schema.max);
        }

        if (fluid.isValue(schema.min)) {
            restrictedValue = Math.max(restrictedValue, schema.min);
        }

        that.applier.change("value", restrictedValue, null, "fromWidget");

        // Whether a bound was hit
        return value < 0 || value > schema.max;
    };

    /**
     * Represents the QSS mouse toggle widget.
     */
    fluid.defaults("gpii.qssWidget.mouseWidgetToggle", {
        gradeNames: ["fluid.viewComponent", "gpii.psp.selectorsTextRenderer"],

        selectors: {
            toggleButton: ".flc-toggleButton",
            settingTitle: ".flc-qssMouseWidgetToggle-settingTitle"
        },

        enableRichText: true,

        model: {
            setting: {},
            value: "{that}.model.setting.value",
            messages: {
                settingTitle: "{that}.model.setting.schema.title"
            }
        },

        components: {
            toggleButton: {
                type: "gpii.psp.widgets.switch",
                container: "{that}.dom.toggleButton",
                options: {
                    model: {
                        enabled: {
                            expander: {
                                funcName: "gpii.qssWidget.mouseWidgetToggle.transformValue",
                                args: ["{mouseWidgetToggle}.model.value", "{mouseWidgetToggle}.model.setting.schema"]
                            }
                        }
                    },
                    invokers: {
                        toggleModel: {
                            funcName: "gpii.qssWidget.mouseWidgetToggle.toggleModel",
                            args: ["{that}", "{mouseWidgetToggle}", "{channelNotifier}.events.onQssWidgetSettingAltered"]
                        }
                    }
                }
            }
        }
    });

    /**
     * Transforms a number value to boolean.
     * @param {Number} value - The value of the setting.
     * @param {Object} schema - Describes the schema of the setting.
     * @return {Boolean} The modified value.
     */
    gpii.qssWidget.mouseWidgetToggle.transformValue = function (value, schema) {
        if (value === schema.mapOff) {
            return false;
        } else if (value === schema.mapOn) {
            return true;
        } else {
            return value;
        }
    };

    /**
     * Invoked whenever the user has activated the "switch" UI element (either
     * by clicking on it or pressing "Space" or "Enter"). What this function
     * does is to change the `enabled` model property to its opposite value.
     * @param {Component} that - The `gpii.psp.widgets.switch` instance.
     * @param {Component} toggleWidget - The `gpii.qssWidget.mouseWidgetToggle` instance.
     * @param {fluid.event} event - onQssWidgetSettingAltered event
     */
    gpii.qssWidget.mouseWidgetToggle.toggleModel = function (that, toggleWidget, event) {
        if (toggleWidget.model.setting.schema.mapOff || toggleWidget.model.setting.schema.mapOn) {
            if (that.model.enabled) {
                toggleWidget.model.setting.value = toggleWidget.model.setting.schema.mapOff;
            } else {
                toggleWidget.model.setting.value = toggleWidget.model.setting.schema.mapOn;
            }
        } else {
            toggleWidget.model.setting.value = !that.model.enabled;
        }

        event.fire(toggleWidget.model.setting);
        that.applier.change("enabled", !that.model.enabled, null, "fromWidget");
    };

})(fluid);
