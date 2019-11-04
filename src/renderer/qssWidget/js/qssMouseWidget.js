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
                        setting: "{mouse}.model.setting.settings.mouseSpeed"
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
                                true
                            ]
                        },
                        decrement: {
                            funcName: "gpii.qssWidget.mouse.makeRestrictedStep",
                            args: [
                                "{that}",
                                "{that}.model.setting.value",
                                "{that}.model.setting.schema",
                                false
                            ]
                        }
                    },
                    components: {
                        indicators: {
                            type: "gpii.qssWidget.mouse.indicators",
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
     * Either increases or decreases the current setting's value (depending on the
     * `shouldSubtract` parameter) with the `divisibleBy` amount specified in the
     * setting's schema. It also takes care that the new value of the setting does
     * not become bigger/smaller than the maximum/minimum allowed value for the
     * setting.
     * @param {Component} that - The `gpii.qssWidget.mouseSpeedStepper` instance.
     * @param {Number} value - The initial value of the setting before the operation.
     * @param {Object} schema - Describes the schema of the setting.
     * @param {Number} schema.min - The minimum possible value for the setting.
     * @param {Number} schema.max - The maximum possible value for the setting.
     * @param {Number} schema.divisibleBy - The amount which is added or subtracted
     * from the setting's value every time this function is invoked.
     * @param {Boolean} shouldSubtract - Whether the `divisibleBy` amount should be
     * subtracted from or added to the setting's value.
     * @return {Boolean} Whether there was a change in the setting's value.
     */
    gpii.qssWidget.mouse.makeRestrictedStep = function (that, value, schema, shouldSubtract) {
        var step = (shouldSubtract ? -schema.divisibleBy : schema.divisibleBy);
        var restrictedValue;

        if (value === schema.min && shouldSubtract) {
            // handle edge case specific only to mouse speed steppper
            restrictedValue = 2;
        } else {
            value = parseFloat( (value - step).toPrecision(2) );

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

    /**
     * Creates and manages the setting "indicators" list.
     */
    fluid.defaults("gpii.qssWidget.mouse.indicators", {
        gradeNames: "gpii.psp.repeater",

        //
        // Repeater stuff
        //
        dynamicContainerMarkup: {
            container: "<div role='radio' class='%containerClass fl-qssStepperWidget-indicator' tabindex='-1'></div>",
            containerClassPrefix: "flc-qssStepperWidget-indicator"
        },
        handlerType: "gpii.qssWidget.mouse.indicator.presenter",
        markup: null,

        //
        // Custom
        //
        model: {
            setting: {}
        },
        // Build the repeater items
        modelRelay: {
            items: {
                target: "items",
                singleTransform: {
                    type: "fluid.transforms.free",
                    func: "gpii.qssWidget.mouse.getIndicatorsList",
                    args: [
                        "{gpii.qssWidget.mouse.indicators}.model.setting"
                    ]
                }
            }
        },

        events: {
            onIndicatorClicked: null
        },

        listeners: {
            "onIndicatorClicked.updateValue": {
                changePath: "setting.value",
                value: "{arguments}.0",
                source: "fromWidget"
            }
        }
    });

    /**
     * Generates the different indicators' data based on a setting .
     * indicators are generated using the setting's `min`, `max` and `divisibleBy` properties.
     * In case either of those is missing, no indicators will be generated.
     * Note that items will be recomputed every time the setting changes but only items that
     * need to be re-rendered will do so (changeApplier merges the values).
     * @param {Object} setting - The setting for which indicators must be created
     * @return {Object[]} - The list of data for each indicator element. In case no indicators
     * can be generated an empty array is returned
     */
    gpii.qssWidget.mouse.getIndicatorsList = function (setting) {
        if (fluid.isValue(setting)) {
            if (!Number.isInteger(setting.schema.min) || !Number.isInteger(setting.schema.max)) {
                return [];
            }

            var indicators = [];

            for (
                var indicatorValue = 0;
                indicatorValue <= setting.schema.max;
                indicatorValue = parseFloat((indicatorValue + setting.schema.divisibleBy).toPrecision(2))
            ) {
                if (indicatorValue === 0) {
                    indicators.push({
                        indicatorValue: setting.schema.min, // value cannot be 0, instead use setting minimum value
                        isSelected: setting.schema.min === setting.value,
                        isRecommended: setting.schema.min === setting.schema["default"]
                    });
                } else {
                    indicators.push({
                        indicatorValue: indicatorValue, // what value to be applied when selected
                        isSelected: indicatorValue === setting.value,
                        isRecommended: indicatorValue === setting.schema["default"]
                    });
                }
            }
            return indicators;
        }
    };

    /**
     * Handler for a single indicator element.
     *
     * Each indicator element has three states: normal, selected and default.
     * These three states are indicated using a custom html element
     * attribute - "data-type". Depending on the state of this attribute, different
     * styles are applied (refer to the CSS for more info).
     */
    fluid.defaults("gpii.qssWidget.mouse.indicator.presenter", {
        gradeNames: ["fluid.viewComponent", "gpii.app.clickable"],

        model: {
            item: {
                indicatorValue: null,
                isSelected: null,
                isRecommended: null
            }
        },

        stateAttribute: {
            attrName: "data-type",
            values: {
                selected: "selected",
                recommended: "recommended"
            }
        },

        modelListeners: {
            item: {
                funcName: "gpii.qssWidget.mouse.indicator.updateState",
                args: [
                    "{that}.container",
                    "{that}.options.stateAttribute",
                    "{that}.model.item"
                ]
            }
        },

        listeners: {
            onClicked: {
                func: "{gpii.qssWidget.mouse.indicators}.events.onIndicatorClicked.fire",
                args: "{that}.model.item.indicatorValue"
            }
        }
    });

    /**
     * Alters the custom element attribute in order to change the styles applied to it.
     * @param {jQuery} indicatorContainer - The container for the indicator element
     * @param {Object} stateAttribute - Options for the state defining attribute
     * @param {Object} indicatorData - The condition data for the element
     */
    gpii.qssWidget.mouse.indicator.updateState = function (indicatorContainer, stateAttribute, indicatorData) {
        var type =
            ( indicatorData.isSelected && stateAttribute.values.selected )  ||
            ( indicatorData.isRecommended && stateAttribute.values.recommended ) ||
            null;

        indicatorContainer.attr(stateAttribute.attrName, type);
    };
})(fluid);
