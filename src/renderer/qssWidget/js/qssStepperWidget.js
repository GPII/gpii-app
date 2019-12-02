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
        gradeNames: ["fluid.viewComponent", "gpii.psp.selectorsTextRenderer", "gpii.psp.heightObservable", "gpii.qssWidget.baseStepper"],
        model: {
            messages: {
                footerTip: "{that}.model.setting.widget.footerTip"
            },
            setting: "{that}.model.setting",
            value: "{that}.model.setting.value"
        },

        selectors: {
            heightListenerContainer: ".flc-qssStepperWidget-indicators",
            indicators: ".flc-qssStepperWidget-indicators"
        },

        events: {
            onNotificationRequired: "{that}.events.onQssWidgetNotificationRequired"
        },

        invokers: {
            calculateHeight: {
                funcName: "gpii.qssWidget.calculateHeight",
                args: [
                    "{that}.container",
                    "{that}.dom.indicators",
                    "{that}.dom.heightListenerContainer"
                ]
            }
        },

        components: {
            indicators: {
                type: "gpii.qssWidget.baseStepper.indicators",
                container: "{that}.dom.indicators",
                options: {
                    model: {
                        setting: "{stepper}.model.setting",
                        value: "{stepper}.model.value"
                    }
                }
            }
        }
    });
})(fluid);
