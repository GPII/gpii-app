/**
 * Utils for the qss stepper widget
 *
 * Contains Base stepper component and other common elements related to the QSS stepper widget.
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
     * Simple base component for stepper functionality
     */
    fluid.defaults("gpii.qssWidget.baseStepper", {
        gradeNames: ["fluid.modelComponent"],

        model: {
            value: null,
            stepperParams: {
                divisibleBy: null,
                min: null,
                max: null
            }
        },

        invokers: {
            increment: {
                changePath: "value",
                value: {
                    expander: {
                        funcName: "gpii.qssWidget.stepper.restrictedStep",
                        args: [
                            "{that}.model.value",
                            "{that}.model.stepperParams"
                        ]
                    }
                },
                source: "settingAlter"
            },
            decrement: {
                changePath: "value",
                value: {
                    expander: {
                        funcName: "gpii.qssWidget.stepper.restrictedStep",
                        args: [
                            "{that}.model.value",
                            "{that}.model.stepperParams",
                            true
                        ]
                    }
                },
                source: "settingAlter"
            }
        }
    });

    fluid.registerNamespace("gpii.qssWidget.stepper");
    /**
     * Either add or subtract two values.
     *
     * @param {Number} value - The initial value
     * @param {Object} options TODO
     * @param {Number} options.min TODO
     * @param {Number} options.max TODO
     * @param {Number} options.divisibleBy - The that is to be done
     * @param {Boolean} shouldSubtract - Whether subtraction to be done
     * @returns {Number} The summed value.
     */
    gpii.qssWidget.stepper.restrictedStep = function (value, options, shouldSubtract) {
        var step = options.divisibleBy;
        value += (shouldSubtract ? -step : step);

        // Handle not given min and max
        value = Math.min(value, options.max || value);
        value = Math.max(value, options.min || value);

        return value;
    };


    gpii.qssWidget.stepper.triggerCssAnimation = function (element, animationClass, animationClasses) {
        console.log("Animation: ", animationClass);

        element.removeClass(animationClasses.join(" "));
        // Avoid browser optimization
        // inspired by https://stackoverflow.com/a/30072037/2276288
        element[0].offsetWidth;

        element.addClass(animationClass);
    };

    /**
     * TODO
     */
    gpii.qssWidget.stepper.animateButton = function (button, value, restrictions) {
        var triggerClass;

        var animationClasses = {
            error: "fl-qssStepperWidgetBtn-stepperErrorActivation",
            warning: "fl-qssStepperWidgetBtn-stepperActivation"
        };

        var isError = value === restrictions.max ||
                      value === restrictions.min;

        if (isError) {
            triggerClass = animationClasses.error;
        } else {
            triggerClass = animationClasses.warning;
        }

        gpii.qssWidget.stepper.triggerCssAnimation(button, triggerClass, fluid.values(animationClasses));
    };


})(fluid);
