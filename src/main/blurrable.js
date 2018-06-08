/**
 * A simple WebSocket wrapper
 *
 * An Infusion component which manages a WebSocket connection.
 * Copyright 2017 Raising the Floor - International
 *
 * Licensed under the New BSD license. You may not use this file except in
 * compliance with this License.
 * The research leading to these results has received funding from the European Union's
 * Seventh Framework Programme (FP7/2007-2013) under grant agreement no. 289016.
 * You may obtain a copy of the License at
 * https://github.com/GPII/universal/blob/master/LICENSE.txt
 */
"use strict";

var fluid = require("infusion"),
    BrowserWindow = require("electron").BrowserWindow,
    gpii = fluid.registerNamespace("gpii");

fluid.defaults("gpii.app.blurrable", {
    gradeNames: ["fluid.component"],

    linkedWindowsGrades: [],

    events: {
        onBlur: "{app}.events.onBlur"
    },

    listeners: {
        onBlur: {
            funcName: "gpii.app.blurrable.onBlur",
            args: ["{that}", "{that}.options.linkedWindowsGrades"]
        }
    },

    invokers: {
        initBlurrable: {
            funcName: "gpii.app.blurrable.initBlurrable",
            args: [
                "{that}",
                "{arguments}.0" // targetWindow
            ]
        },
        handleBlur: {
            funcName: "gpii.app.blurrable.handleBlur",
            args: ["{that}"]
        }
    }
});

gpii.app.blurrable.initBlurrable = function (that, targetWindow) {
    if (targetWindow) {
        // Attach the grade names as window parameters
        targetWindow.gradeNames = that.options.gradeNames;
        // Initialize the listener
        targetWindow.on("blur", that.events.onBlur.fire);
    }


};

gpii.app.blurrable.onBlur = function (that, linkedWindowsGrades) {
    var focusedWindow = BrowserWindow.getFocusedWindow(),
        allowBlur = !linkedWindowsGrades.some(function (linkedWindowGrade) {
            if (focusedWindow && focusedWindow.gradeNames) {
                return focusedWindow.gradeNames.indexOf(linkedWindowGrade) >= 0;
            }
        });

    if (allowBlur) {
        that.handleBlur();
    }
};

gpii.app.blurrable.handleBlur = function (that) {
    if (that.hide) {
        that.hide();
    }
};
