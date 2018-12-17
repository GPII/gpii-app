/**
 * The QSS stepper widget
 *
 * Represents the quick set strip stepper widget. It is used for
 * incrementing/decrementing a setting.
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
     * Represents the QSS stepper widget.
     */
    fluid.defaults("gpii.qssWidget.stepper", {
        gradeNames: ["fluid.viewComponent", "gpii.psp.selectorsTextRenderer"],

        members: {
            boundReachedHits: 0
        },

        specialErrorBoundHitTries: 2,
        enableRichText: true,

        model: {
            messages: {
                incrementButton: "Larger",
                decrementButton: "Smaller",

                footerTip: "{that}.model.setting.widget.footerTip",

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
            steps: ".flc-qssStepperWidget-controls-steps",

            stepperButton: ".flc-qssStepperWidget-btn",
            incButton: ".flc-qssStepperWidget-incBtn",
            decButton: ".flc-qssStepperWidget-decBtn",

            tipTitle: ".flc-tipTitle",
            tipSubtitle: ".flc-tipSubtitle",

            footerTip: ".flc-qssStepperWidget-footerTip"
        },

        modelListeners: {
            // TODO use local event?
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
                funcName: "gpii.qssWidget.stepper.handleBoundReached",
                args: [
                    "{that}",
                    "{that}.model.messages.lowerBoundError"
                ]
            },
            onUpperBoundReached: {
                funcName: "gpii.qssWidget.stepper.handleBoundReached",
                args: [
                    "{that}",
                    "{that}.model.messages.upperBoundError"
                ]
            },

            "onCreate.attachAnimationClearer": {
                funcName: "gpii.qssWidget.stepper.clearElementsAnimation",
                args: [
                    "{that}.dom.stepperButton",
                    "{that}.options.styles"
                ]
            }
        },

        invokers: {
            activateIncBtn: {
                funcName: "gpii.qssWidget.stepper.activateIncButton",
                args: [
                    "{that}",
                    "{that}.dom.incButton",
                    "{that}.model.setting.schema" // only restrictions will be used
                ]
            },
            activateDecBtn: {
                funcName: "gpii.qssWidget.stepper.activateDecButton",
                args: [
                    "{that}",
                    "{that}.dom.decButton",
                    "{that}.model.setting.schema"
                ]
            },
            increment: {
                funcName: "gpii.qssWidget.stepper.makeRestrictedStep",
                args: [
                    "{that}",
                    "{that}.model.value",
                    "{that}.model.setting.schema"
                ]
            },
            decrement: {
                funcName: "gpii.qssWidget.stepper.makeRestrictedStep",
                args: [
                    "{that}",
                    "{that}.model.value",
                    "{that}.model.setting.schema",
                    true
                ]
            },
            animateButton: {
                funcName: "gpii.qssWidget.stepper.animateButton",
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
                        label: "{stepper}.model.messages.incrementButton"
                    },
                    invokers: {
                        activate: "{stepper}.activateIncBtn"
                    }
                }
            },
            decButton: {
                type: "gpii.qssWidget.button",
                container: "{that}.dom.decButton",
                options: {
                    model: {
                        label: "{stepper}.model.messages.decrementButton"
                    },
                    invokers: {
                        activate: "{stepper}.activateDecBtn"
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
                        onAddPressed:      "{stepper}.activateIncBtn",
                        onEqualsPressed:   "{stepper}.activateIncBtn",
                        onSubtractPressed: "{stepper}.activateDecBtn"
                    }
                }
            },
            steps: {
                type: "gpii.qssWidget.stepper.steps",
                container: "{that}.dom.steps",
                options: {
                    model: {
                        setting: "{stepper}.model.setting"
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
     * @param {Component} that - The `gpii.qssWidget.stepper` instance.
     * @param {String} errorMessage - The message to be displayed in the QSS
     * notification.
     */
    gpii.qssWidget.stepper.handleBoundReached = function (that, errorMessage) {
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
     * @param {Component} that - The `gpii.qssWidget.stepper` instance.
     * @param {jQuery} button - The jQuery object repesenting the increment button
     * in the QSS stepper widget.
     */
    gpii.qssWidget.stepper.activateIncButton = function (that, button) {
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
     * @param {Component} that - The `gpii.qssWidget.stepper` instance.
     * @param {jQuery} button - The jQuery object repesenting the decrement button
     * in the QSS stepper widget.
     */
    gpii.qssWidget.stepper.activateDecButton = function (that, button) {
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
     * @param {Component} that - The `gpii.qssWidget.stepper` instance.
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
    gpii.qssWidget.stepper.makeRestrictedStep = function (that, value, schema, shouldSubtract) {
        var step = (shouldSubtract ? -schema.divisibleBy : schema.divisibleBy);

        value += step;
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
    gpii.qssWidget.stepper.triggerCssAnimation = function (element, animationClass, animationClasses) {
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
    gpii.qssWidget.stepper.clearElementsAnimation = function (animatedElements, styles) {
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
    gpii.qssWidget.stepper.animateButton = function (styles, button, isError) {
        var triggerClass = isError ? styles.errorAnimation : styles.warningAnimation;

        gpii.qssWidget.stepper.triggerCssAnimation(
            button,
            triggerClass,
            [ styles.errorAnimation, styles.warningAnimation ]);
    };


    /**
     * Creates and manages the setting "steps" list.
     */
    fluid.defaults("gpii.qssWidget.stepper.steps", {
        gradeNames: "gpii.psp.repeater",

        //
        // Repeater stuff
        //
        dynamicContainerMarkup: {
            container: "<div role='radio' class='%containerClass fl-qssStepperWidget-step' tabindex='0'></div>",
            containerClassPrefix: "flc-qssStepperWidget-step-%id"
        },
        handlerType: "gpii.qssWidget.stepper.step.presenter",
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
                    func: "gpii.qssWidget.stepper.getStepItems",
                    args: [
                        "{gpii.qssWidget.stepper.steps}.model.setting"
                    ]
                }
            }
        },

        events: {
            onStepClicked: null
        },

        listeners: {
            "onStepClicked.updateValue": {
                changePath: "setting.value",
                value: "{arguments}.0",
                source: "settingAlter"
            }
        }
    });


    /**
     * Generates the different steps' data based on a setting .
     * Steps are generated using the setting's `min`, `max` and `divisibleBy` properties.
     * In case either of those is missing, no steps will be generated.
     * Note that items will be recomputed every time the setting changes but only items that
     * need to be re-rendered will do so (changeApplier merges the values).
     * @param {Object} setting - The setting for which steps must be created
     * @return {Object[]} - The list of data for each step element. In case no steps
     * can be generated an empty array is returned
     */
    gpii.qssWidget.stepper.getStepItems = function (setting) {
        if (!setting ||
                !Number.isInteger(setting.schema.min) ||
                !Number.isInteger(setting.schema.max)) {
            return [];
        }

        var schema = setting.schema;
        var stepsCount = ( schema.max - (schema.min - 1 ) ) / schema.divisibleBy;

        // min: -2, value: 1 -> value: 3
        // min: 1, value: 5 -> value: 4
        var normalizedValue = setting.value - schema.min,
            normalizedDefaultValue = (schema["default"] - schema.min);

        var steps = Array.apply(null, {length: stepsCount})
            .map(Number.call, Number) // generate array with n elements
            .reverse()
            .map(function (step) {
                // real value
                var stepValue = (step * schema.divisibleBy) + setting.schema.min;
                return {
                    stepValue: stepValue, // in case it is selected
                    isSelected: stepValue === normalizedValue,
                    isDefault: stepValue === normalizedDefaultValue
                };
            });

        console.log("Steps:", steps, setting);

        return steps;
    };

    /**
     * Handler for a single step element.
     *
     * Each step element has three states: normal, selected and default.
     * These three states are indicated ?разграничени using a custom html element
     * attribute - "data-type". Depending on the state of this attribute, different
     * styles are applied (refer to the CSS for more info).
     */
    fluid.defaults("gpii.qssWidget.stepper.step.presenter", {
        gradeNames: ["fluid.viewComponent", "gpii.app.clickable"],

        model: {
            item: {
                stepValue: null,
                isSelected: null,
                isDefault: null
            }
        },

        stateAttribute: {
            attrName: "data-type",
            values: {
                selected: "selected",
                default: "default"
            }
        },

        modelListeners: {
            item: {
                funcName: "gpii.qssWidget.stepper.step.updateState",
                args: [
                    "{that}.container",
                    "{that}.options.stateAttribute",
                    "{that}.model.item"
                ]
            }
        },

        listeners: {
            onClicked: {
                func: "{gpii.qssWidget.stepper.steps}.events.onStepClicked.fire",
                args: "{that}.model.item.stepValue"
            }
        }
    });

    /**
     * Alters the custom element attribute in order to change the styles applied to it.
     * @param {jQuery} stepContainer - The container for the step element
     * @param {Object} stateAttribute - Options for the state defining attribute
     * @param {Object} stepData - The condition data for the element
     */
    gpii.qssWidget.stepper.step.updateState = function (stepContainer, stateAttribute, stepData) {
        var type =
            ( stepData.isSelected && stateAttribute.values.selected )  ||
            ( stepData.isDefault && stateAttribute.values["default"] ) ||
            null;

        stepContainer.attr(stateAttribute.attrName, type);
    };

})(fluid);
