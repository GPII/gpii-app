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
                type: "gpii.qssWidget.mouseSpeedStepper",
                container: "{that}.dom.mouseSpeed",
                options: {
                    sounds: "{mouse}.options.sounds",
                    model: {
                        setting: "{gpii.qssWidget.mouse}.model.setting.settings.mouseSpeed"
                    },
                    events: {
                        onNotificationRequired: "{mouse}.events.onQssWidgetNotificationRequired"
                    }
                }
            },
            swapMouseButtons: {
                type: "gpii.qssWidget.mouseWidgetToggle",
                container: "{that}.dom.swapMouseButtons",
                options: {
                    model: {
                        setting: "{gpii.qssWidget.mouse}.model.setting.settings.swapMouseButtons"
                    }
                }
            },
            easierDoubleClick: {
                type: "gpii.qssWidget.mouseWidgetToggle",
                container: "{that}.dom.easierDoubleClick",
                options: {
                    model: {
                        setting: "{gpii.qssWidget.mouse}.model.setting.settings.easierDoubleClick"
                    }
                }
            },
            largerMousePointer: {
                type: "gpii.qssWidget.mouseWidgetToggle",
                container: "{that}.dom.largerMousePointer",
                options: {
                    model: {
                        setting: "{gpii.qssWidget.mouse}.model.setting.settings.largerMousePointer"
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
     * The QSS stepper widget for Mouse button
     *
     * Represents the quick set strip stepper widget. It is used for
     * incrementing/decrementing a setting.
    */
    fluid.defaults("gpii.qssWidget.mouseSpeedStepper", {
        gradeNames: ["fluid.viewComponent", "gpii.psp.selectorsTextRenderer"],

        members: {
            boundReachedHits: 0
        },

        specialErrorBoundHitTries: 2,
        enableRichText: true,

        model: {
            messages: {
                settingTitle: "{that}.model.setting.schema.title",
                incrementButton: "Slower",
                decrementButton: "Faster",
                upperBoundError: "This is highest setting",
                lowerBoundError: "This is lowest setting"
            },
            setting: {},

            value: "{that}.model.setting.value"
        },

        styles: {
            errorAnimation: "fl-qssStepperWidgetBtn-stepperErrorActivation",
            warningAnimation: "fl-qssStepperWidgetBtn-stepperActivation"
        },

        selectors: {
            settingTitle: ".flc-qssMouseSpeedStepperWidget-settingTitle",
            indicators: ".flc-qssMouseSpeedStepperWidget-indicators",
            stepperButton: ".flc-qssMouseSpeedStepperWidget-btn",
            incButton: ".flc-qssMouseSpeedStepperWidget-incBtn",
            decButton: ".flc-qssMouseSpeedStepperWidget-decBtn"
        },

        modelListeners: {
            "setting.value": {
                func: "{channelNotifier}.events.onQssWidgetSettingAltered.fire",
                args: ["{that}.model.setting"],
                includeSource: "settingAlter"
            }
        },

        events: {
            onLowerBoundReached: null,
            onUpperBoundReached: null
        },

        listeners: {
            onLowerBoundReached: {
                funcName: "gpii.qssWidget.mouseSpeedStepper.handleBoundReached",
                args: [
                    "{that}",
                    "{that}.model.messages.lowerBoundError"
                ]
            },
            onUpperBoundReached: {
                funcName: "gpii.qssWidget.mouseSpeedStepper.handleBoundReached",
                args: [
                    "{that}",
                    "{that}.model.messages.upperBoundError"
                ]
            },

            "onCreate.attachAnimationClearer": {
                funcName: "gpii.qssWidget.mouseSpeedStepper.clearElementsAnimation",
                args: [
                    "{that}.dom.stepperButton",
                    "{that}.options.styles"
                ]
            }
        },

        invokers: {
            activateIncBtn: {
                funcName: "gpii.qssWidget.mouseSpeedStepper.activateIncButton",
                args: [
                    "{that}",
                    "{that}.dom.incButton",
                    "{that}.model.setting.schema" // only restrictions will be used
                ]
            },
            activateDecBtn: {
                funcName: "gpii.qssWidget.mouseSpeedStepper.activateDecButton",
                args: [
                    "{that}",
                    "{that}.dom.decButton",
                    "{that}.model.setting.schema"
                ]
            },
            increment: {
                funcName: "gpii.qssWidget.mouseSpeedStepper.makeRestrictedStep",
                args: [
                    "{that}",
                    "{that}.model.value",
                    "{that}.model.setting.schema"
                ]
            },
            decrement: {
                funcName: "gpii.qssWidget.mouseSpeedStepper.makeRestrictedStep",
                args: [
                    "{that}",
                    "{that}.model.value",
                    "{that}.model.setting.schema",
                    true
                ]
            },
            animateButton: {
                funcName: "gpii.qssWidget.mouseSpeedStepper.animateButton",
                args: [
                    "{that}.options.styles",
                    "{arguments}.0",
                    "{arguments}.1"
                ]
            }
        },

        components: {
            incButton: {
                type: "gpii.qssWidget.button",
                container: "{that}.dom.incButton",
                options: {
                    model: {
                        label: "{mouseSpeedStepper}.model.messages.incrementButton"
                    },
                    invokers: {
                        activate: "{mouseSpeedStepper}.activateIncBtn"
                    }
                }
            },
            decButton: {
                type: "gpii.qssWidget.button",
                container: "{that}.dom.decButton",
                options: {
                    model: {
                        label: "{mouseSpeedStepper}.model.messages.decrementButton"
                    },
                    invokers: {
                        activate: "{mouseSpeedStepper}.activateDecBtn"
                    }
                }
            },
            // similar to qssWidget component
            windowKeyListener: {
                type: "fluid.component",
                options: {
                    gradeNames: "gpii.app.keyListener",
                    target: {
                        expander: {
                            funcName: "jQuery",
                            args: [window]
                        }
                    },
                    events: {
                        onSubtractPressed: null,
                        onEqualsPressed:   null,
                        onAddPressed:      null
                    },
                    listeners: {
                        onAddPressed:      "{mouseSpeedStepper}.activateIncBtn",
                        onEqualsPressed:   "{mouseSpeedStepper}.activateIncBtn",
                        onSubtractPressed: "{mouseSpeedStepper}.activateDecBtn"
                    }
                }
            },
            indicators: {
                type: "gpii.qssWidget.mouseSpeedStepper.indicators",
                container: "{that}.dom.indicators",
                options: {
                    model: {
                        setting: "{mouseSpeedStepper}.model.setting"
                    }
                }
            }
        }
    });

    /**
     * Invoked whenever the value of the setting has reached its upper or lower
     * bound and an attempt is made to go beyond that bound. In that case an
     * error tone is played. If at least `specialErrorBoundHitTries` number of
     * times this has happened, in addition to the error tone, a notification
     * is shown to the user.
     * @param {Component} that - The `gpii.qssWidget.mouseSpeedStepper` instance.
     * @param {String} errorMessage - The message to be displayed in the QSS
     * notification.
     */
    gpii.qssWidget.mouseSpeedStepper.handleBoundReached = function (that, errorMessage) {
        gpii.psp.playSound(that.options.sounds.boundReached);

        if (that.boundReachedHits >= that.options.specialErrorBoundHitTries) {
            that.events.onNotificationRequired.fire({
                description: errorMessage,
                closeOnBlur: true
            });
        }
    };

    /**
     * Invoked whenever the increment button is activated. Takes care of
     * increasing the setting's value with the amount specified in the setting's
     * schema, animating the button appropriately and/or firing an event if
     * an attempt is made to increase value above the maximum allowed value.
     * @param {Component} that - The `gpii.qssWidget.mouseSpeedStepper` instance.
     * @param {jQuery} button - The jQuery object repesenting the increment button
     * in the QSS stepper widget.
     */
    gpii.qssWidget.mouseSpeedStepper.activateIncButton = function (that, button) {
        var boundReached = that.increment();
        that.animateButton(button, boundReached);
        if (boundReached) {
            // register bound hit
            that.boundReachedHits += 1;

            that.events.onUpperBoundReached.fire();
        } else {
            that.boundReachedHits = 0;
        }
    };

    /**
     * Invoked whenever the decrement button is activated. Takes care of
     * decreasing the setting's value with the amount specified in the setting's
     * schema, animating the button appropriately and/or firing an event if
     * an attempt is made to decrease value below the minimum allowed value.
     * @param {Component} that - The `gpii.qssWidget.mouseSpeedStepper` instance.
     * @param {jQuery} button - The jQuery object repesenting the decrement button
     * in the QSS stepper widget.
     */
    gpii.qssWidget.mouseSpeedStepper.activateDecButton = function (that, button) {
        var boundReached = that.decrement();
        that.animateButton(button, boundReached);
        if (boundReached) {
            // register bound hit
            that.boundReachedHits += 1;

            that.events.onLowerBoundReached.fire();
        } else {
            that.boundReachedHits = 0;
        }
    };

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
    gpii.qssWidget.mouseSpeedStepper.makeRestrictedStep = function (that, value, schema, shouldSubtract) {
        var step = (shouldSubtract ? -schema.divisibleBy : schema.divisibleBy);

        value = parseFloat( (value + step).toPrecision(2) );
        // Handle not given min and max
        var restrcitedValue = value;

        if (fluid.isValue(schema.max)) {
            restrcitedValue = Math.min(restrcitedValue, schema.max);
        }

        if (fluid.isValue(schema.min)) {
            restrcitedValue = Math.max(restrcitedValue, schema.min);
        }

        that.applier.change("value", restrcitedValue, null, "settingAlter");

        // Whether a bound was hit
        return value !== restrcitedValue;
    };

    /**
     * A utility function for triggering a CSS animation by adding the CSS class
     * containing the animation description and removing any previously added CSS
     * classes that may contain animations.
     * @param {jQuery} element - The jQuery object representing the DOM element that
     * is to be animated.
     * @param {String} animationClass - The CSS class of the animation to be triggered.
     * @param {String[]} animationClasses - An array of CSS animation classes that are
     * to be removed before the new animation is applied.
     */
    gpii.qssWidget.mouseSpeedStepper.triggerCssAnimation = function (element, animationClass, animationClasses) {
        // ensure animations are cleared (button may be activated before animation's end)
        element.removeClass(animationClasses.join(" "));
        // Avoid browser optimization
        // inspired by https://stackoverflow.com/a/30072037/2276288
        element[0].offsetWidth;

        element.addClass(animationClass);
    };

    /**
     * Removes any CSS classes associated with an animation from the `animatedElements`.
     * @param {jQuery} animatedElements - A jQuery object representing the items from
     * which the animation classes have to be removed.
     * @param {Object} styles - An object whose values are the CSS classes to be removed.
     */
    gpii.qssWidget.mouseSpeedStepper.clearElementsAnimation = function (animatedElements, styles) {
        var animationClasses = fluid.values(styles);
        animatedElements.removeClass(animationClasses.join(" "));
    };

    /**
     * Applies an animation to an increase/decrease button. The type of animation depends
     * on whether the value was increased properly or a lower/upper bound has been reached.
     * @param {Object} styles - An object whose values are the CSS animation classes.
     * @param {jQuery} button - A jQuery object representing the items to be animated.
     * @param {Boolean} isError - Whether the upper/lower bound has been reached or not.
     */
    gpii.qssWidget.mouseSpeedStepper.animateButton = function (styles, button, isError) {
        var triggerClass = isError ? styles.errorAnimation : styles.warningAnimation;

        gpii.qssWidget.mouseSpeedStepper.triggerCssAnimation(
            button,
            triggerClass,
            [ styles.errorAnimation, styles.warningAnimation ]);
    };


    /**
     * The QSS toggle widget for Mouse button
     *
     * Represents the quick set strip toggle widget. It is used for adjusting the
     * values of "boolean" settings.
    */
    fluid.defaults("gpii.qssWidget.mouseSpeedStepper.indicators", {
        gradeNames: "gpii.psp.repeater",

        //
        // Repeater stuff
        //
        dynamicContainerMarkup: {
            container: "<div role='radio' class='%containerClass fl-qssStepperWidget-indicator' tabindex='-1'></div>",
            containerClassPrefix: "flc-qssMouseSpeedStepperWidget-indicator"
        },
        handlerType: "gpii.qssWidget.mouseSpeedStepper.indicator.presenter",
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
                    func: "gpii.qssWidget.mouseSpeedStepper.getIndicatorsList",
                    args: [
                        "{gpii.qssWidget.mouseSpeedStepper.indicators}.model.setting"
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
                source: "settingAlter"
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
    gpii.qssWidget.mouseSpeedStepper.getIndicatorsList = function (setting) {
        if (!Number.isInteger(setting.schema.min) || !Number.isInteger(setting.schema.max)) {
            return [];
        }

        var indicators = [];

        for (
            var indicatorValue = setting.schema.max;
            indicatorValue >= setting.schema.min;
            indicatorValue = parseFloat((indicatorValue - setting.schema.divisibleBy).toPrecision(2))
        ) {
            indicators.push({
                indicatorValue: indicatorValue, // what value to be applied when selected
                isSelected: indicatorValue === setting.value,
                isRecommended: indicatorValue === setting.schema["default"]
            });
        }
        return indicators;
    };

    /**
     * Handler for a single indicator element.
     *
     * Each indicator element has three states: normal, selected and default.
     * These three states are indicated using a custom html element
     * attribute - "data-type". Depending on the state of this attribute, different
     * styles are applied (refer to the CSS for more info).
     */
    fluid.defaults("gpii.qssWidget.mouseSpeedStepper.indicator.presenter", {
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
                funcName: "gpii.qssWidget.mouseSpeedStepper.indicator.updateState",
                args: [
                    "{that}.container",
                    "{that}.options.stateAttribute",
                    "{that}.model.item"
                ]
            }
        },

        listeners: {
            onClicked: {
                func: "{gpii.qssWidget.mouseSpeedStepper.indicators}.events.onIndicatorClicked.fire",
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
    gpii.qssWidget.mouseSpeedStepper.indicator.updateState = function (indicatorContainer, stateAttribute, indicatorData) {
        var type =
            ( indicatorData.isSelected && stateAttribute.values.selected )  ||
            ( indicatorData.isRecommended && stateAttribute.values.recommended ) ||
            null;

        indicatorContainer.attr(stateAttribute.attrName, type);
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

        modelListeners: {
            "setting.value": {
                func: "{channelNotifier}.events.onQssWidgetSettingAltered.fire",
                args: ["{that}.model.setting"],
                includeSource: "settingAlter"
            }
        },

        components: {
            toggleButton: {
                type: "gpii.psp.widgets.switch",
                container: "{that}.dom.toggleButton",
                options: {
                    model: {
                        enabled: "{gpii.qssWidget.mouseWidgetToggle}.model.value"
                    },
                    invokers: {
                        toggleModel: {
                            funcName: "gpii.qssWidget.mouseWidgetToggle.toggleModel",
                            args: ["{that}"]
                        }
                    }
                }
            }
        }
    });

    /**
     * Invoked whenever the user has activated the "switch" UI element (either
     * by clicking on it or pressing "Space" or "Enter"). What this function
     * does is to change the `enabled` model property to its opposite value.
     * @param {Component} that - The `gpii.psp.widgets.switch` instance.
     */
    gpii.qssWidget.mouseWidgetToggle.toggleModel = function (that) {
        that.applier.change("enabled", !that.model.enabled, null, "settingAlter");
    };

})(fluid);