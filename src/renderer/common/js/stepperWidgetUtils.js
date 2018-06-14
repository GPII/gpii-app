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


        buttonSelector: ".fl-qssStepperWidget-btn",
        styles: {
            errorAnimation: "fl-qssStepperWidgetBtn-stepperErrorActivation",
            warningAnimation: "fl-qssStepperWidgetBtn-stepperActivation"
        },

        listeners: {
            "onCreate.attachAnimationClearer": {
                funcName: "gpii.qssWidget.stepper.addElementAnimationClearer",
                args: [
                    "{that}.options.buttonSelector",
                    [
                        "{that}.options.styles.errorAnimation",
                        "{that}.options.styles.warningAnimation"
                    ]
                ]
            }
        },

        invokers: {
            increment: {
                funcName: "gpii.qssWidget.stepper.makeRestrictedStep",
                args: [
                    "{that}",
                    "{that}.model.value",
                    "{that}.model.stepperParams"
                ]
            },
            decrement: {
                funcName: "gpii.qssWidget.stepper.makeRestrictedStep",
                args: [
                    "{that}",
                    "{that}.model.value",
                    "{that}.model.stepperParams",
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
    gpii.qssWidget.stepper.makeRestrictedStep = function (that, value, options, shouldSubtract) {
        var step = (shouldSubtract ? -options.divisibleBy : options.divisibleBy);

        value += step;
        // Handle not given min and max
        var restrcitedValue = Math.min(value, options.max || value);
        restrcitedValue     = Math.max(restrcitedValue, options.min || restrcitedValue);

        that.applier.change("value", restrcitedValue, null, "settingAlter");

        // Whether a bound was hit
        return value !== restrcitedValue;
    };


    gpii.qssWidget.stepper.triggerCssAnimation = function (element, animationClass, animationClasses) {
        // ensure animations are cleared (button may be activated before animation's end)
        element.removeClass(animationClasses.join(" "));
        // Avoid browser optimization
        // inspired by https://stackoverflow.com/a/30072037/2276288
        element[0].offsetWidth;

        element.addClass(animationClass);
    };

    gpii.qssWidget.stepper.addElementAnimationClearer = function (animatedElementsSelector, animationClasses) {
        $(animatedElementsSelector).on("animationend webkitAnimationEnd", function (e) {
            $(e.target).removeClass(animationClasses.join(" "));
        });
    };


    /**
     * TODO
     */
    gpii.qssWidget.stepper.animateButton = function (styles, button, isError) {
        var triggerClass = isError ? styles.errorAnimation : styles.warningAnimation;

        gpii.qssWidget.stepper.triggerCssAnimation(
            button,
            triggerClass,
            [ styles.errorAnimation, styles.warningAnimation ]);
    };


})(fluid);
