/**
 * The QSS base stepper widget
 *
 * Grade creates to be used in QSS stepper widget and every other use case.
 * It’s used to increase/decrease a setting's value in steps.
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
     * Represents the QSS base stepper widget.
     */
    fluid.defaults("gpii.qssWidget.baseStepper", {
        gradeNames: ["fluid.viewComponent", "gpii.psp.selectorsTextRenderer"],

        members: {
            boundReachedHits: 0
        },

        specialErrorBoundHitTries: 2,
        enableRichText: true,

        model: {
            messages: {},
            setting: {},

            value: "{that}.model.setting.value"
        },

        styles: {
            errorAnimation: "fl-qssStepperWidgetBtn-stepperErrorActivation",
            warningAnimation: "fl-qssStepperWidgetBtn-stepperActivation"
        },

        selectors: {
            settingTitle: ".flc-qssStepperWidget-settingTitle",
            indicators: ".flc-qssStepperWidget-indicators",
            stepperButton: ".flc-qssStepperWidget-btn",
            incButton: ".flc-qssStepperWidget-incBtn",
            decButton: ".flc-qssStepperWidget-decBtn",
            footerTip: ".flc-qssStepperWidget-footerTip"
        },

        modelListeners: {
            "setting.value": {
                func: "{channelNotifier}.events.onQssWidgetSettingAltered.fire",
                args: ["{that}.model.setting"],
                includeSource: "fromWidget"
            }
        },

        events: {
            onLowerBoundReached: null,
            onUpperBoundReached: null
        },

        listeners: {
            onLowerBoundReached: {
                funcName: "gpii.qssWidget.baseStepper.handleBoundReached",
                args: [
                    "{that}",
                    "{that}.model.messages.lowerBoundError"
                ]
            },
            onUpperBoundReached: {
                funcName: "gpii.qssWidget.baseStepper.handleBoundReached",
                args: [
                    "{that}",
                    "{that}.model.messages.upperBoundError"
                ]
            },

            "onCreate.attachAnimationClearer": {
                funcName: "gpii.qssWidget.baseStepper.clearElementsAnimation",
                args: [
                    "{that}.dom.stepperButton",
                    "{that}.options.styles"
                ]
            }
        },

        invokers: {
            activateIncBtn: {
                funcName: "gpii.qssWidget.baseStepper.activateButton",
                args: [
                    "{that}",
                    "{that}.dom.incButton",
                    "{that}.increment", // the proper function to be executed
                    "{that}.events.onUpperBoundReached" // the proper event to be fired
                ]
            },
            activateDecBtn: {
                funcName: "gpii.qssWidget.baseStepper.activateButton",
                args: [
                    "{that}",
                    "{that}.dom.decButton",
                    "{that}.decrement", // the proper function to be executed
                    "{that}.events.onLowerBoundReached" // the proper event to be fired
                ]
            },
            increment: {
                funcName: "gpii.qssWidget.baseStepper.makeRestrictedStep",
                args: [
                    "{that}",
                    "{that}.model.value",
                    "{that}.model.setting.schema",
                    1, // step multiplier, no effect of the step itself
                    "{that}.model.previousValue"
                ]
            },
            decrement: {
                funcName: "gpii.qssWidget.baseStepper.makeRestrictedStep",
                args: [
                    "{that}",
                    "{that}.model.value",
                    "{that}.model.setting.schema",
                    -1, // step multiplier to reverse the step
                    "{that}.model.previousValue"
                ]
            },
            animateButton: {
                funcName: "gpii.qssWidget.baseStepper.animateButton",
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
                        label: "{baseStepper}.model.messages.incrementButton"
                    },
                    invokers: {
                        activate: "{baseStepper}.activateIncBtn"
                    }
                }
            },
            decButton: {
                type: "gpii.qssWidget.button",
                container: "{that}.dom.decButton",
                options: {
                    model: {
                        label: "{baseStepper}.model.messages.decrementButton"
                    },
                    invokers: {
                        activate: "{baseStepper}.activateDecBtn"
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
                        onAddPressed:      "{baseStepper}.activateIncBtn",
                        onEqualsPressed:   "{baseStepper}.activateIncBtn",
                        onSubtractPressed: "{baseStepper}.activateDecBtn"
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
     * @param {Component} that - The `gpii.qssWidget.baseStepper` instance.
     * @param {String} errorMessage - The message to be displayed in the QSS
     * notification.
     */
    gpii.qssWidget.baseStepper.handleBoundReached = function (that, errorMessage) {
        gpii.psp.playSound(that.options.sounds.boundReached);

        if (that.boundReachedHits >= that.options.specialErrorBoundHitTries) {
            that.events.onNotificationRequired.fire({
                description: errorMessage,
                closeOnBlur: true
            });
        }
    };

    /**
     * Invoked whenever the either button is activated. Takes care of
     * changing the setting's value with the amount specified in the setting's
     * schema, animating the button appropriately and/or firing an event if
     * an attempt is made to increase/decrease value above or below the
     * maximum or minimum allowed value.
     * @param {Component} that - The `gpii.qssWidget.baseStepper` instance.
     * @param {jQuery} button - The jQuery object representing the inc/dev buttons
     * @param {Function} actionFunc - Uses the provided function to change the value
     * button is pressed in the QSS baseStepper widget.
     * @param {fluid.event} boundEvent - a handle to the event to be fired when
     * bound is reached
     */
    gpii.qssWidget.baseStepper.activateButton = function (that, button, actionFunc, boundEvent) {
        var boundReached = actionFunc();

        that.animateButton(button, boundReached);
        if (boundReached) {
            // register bound hit
            that.boundReachedHits += 1;
            // fire the event
            boundEvent.fire();
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
     * @param {Component} that - The `gpii.qssWidget.baseStepper` instance.
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
    gpii.qssWidget.baseStepper.makeRestrictedStep = function (that, value, schema, stepMultiplier, previousValue) {
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
    gpii.qssWidget.baseStepper.triggerCssAnimation = function (element, animationClass, animationClasses) {
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
    gpii.qssWidget.baseStepper.clearElementsAnimation = function (animatedElements, styles) {
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
    gpii.qssWidget.baseStepper.animateButton = function (styles, button, isError) {
        var triggerClass = isError ? styles.errorAnimation : styles.warningAnimation;

        gpii.qssWidget.baseStepper.triggerCssAnimation(
            button,
            triggerClass,
            [ styles.errorAnimation, styles.warningAnimation ]);
    };

    /**
     * Creates and manages the setting "indicators" list.
     */
    fluid.defaults("gpii.qssWidget.baseStepper.indicators", {
        gradeNames: "gpii.psp.repeater",

        //
        // Repeater stuff
        //
        dynamicContainerMarkup: {
            container: "<div role='radio' class='%containerClass fl-qssStepperWidget-indicator' tabindex='-1'></div>",
            containerClassPrefix: "flc-qssStepperWidget-indicator"
        },
        handlerType: "gpii.qssWidget.baseStepper.indicator.presenter",
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
                    func: "gpii.qssWidget.baseStepper.getIndicatorsList",
                    args: [
                        "{gpii.qssWidget.baseStepper.indicators}.model.setting"
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
    gpii.qssWidget.baseStepper.getIndicatorsList = function (setting) {
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
    fluid.defaults("gpii.qssWidget.baseStepper.indicator.presenter", {
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
                funcName: "gpii.qssWidget.baseStepper.indicator.updateState",
                args: [
                    "{that}.container",
                    "{that}.options.stateAttribute",
                    "{that}.model.item"
                ]
            }
        },

        listeners: {
            onClicked: {
                func: "{gpii.qssWidget.baseStepper.indicators}.events.onIndicatorClicked.fire",
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
    gpii.qssWidget.baseStepper.indicator.updateState = function (indicatorContainer, stateAttribute, indicatorData) {
        var type =
            ( indicatorData.isSelected && stateAttribute.values.selected )  ||
            ( indicatorData.isRecommended && stateAttribute.values.recommended ) ||
            null;

        indicatorContainer.attr(stateAttribute.attrName, type);
    };

})(fluid);
