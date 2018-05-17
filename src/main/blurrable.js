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
        onBlur: null
    },

    listeners: {
        onBlur: {
            funcName: "console.log",
            args: ["Lost: ", "{arguments}.0"]
        }
    },

    invokers: {
        setBlurTarget: {
            funcName: "gpii.app.blurrable.setBlurTarget",
            args: [
                "{that}",
                "{that}.options.linkedWindowsGrades",
                "{arguments}.0" // targetWindow
            ]
        }
    }
});


gpii.app.blurrable.isWindowRelated = function (window, linkedGrades) {
    return linkedGrades.some(function (linkedWindowGrade) {
        if (window && window.gradeNames) {
            return window.gradeNames.indexOf(linkedWindowGrade) >= 0;
        }
    });
}


/**
 * If the focused window is not any of the related notify. 
 *
 * @param targetWindow
 * @param relatedGrades
 * @param onFocusLost
 */
gpii.app.blurrable.setBlurTarget = function (that, relatedGrades, targetWindow) {
    // Initialize the listener
    targetWindow.once("blur", function () {
        // the focused electron window
        var focusedWindow = BrowserWindow.getFocusedWindow();

        if (focusedWindow && gpii.app.blurrable.isWindowRelated(focusedWindow, relatedGrades)) {
            // init with a different window
            that.setBlurTarget(focusedWindow);
        } else {
            // XXX dev fired arg
            that.events.onBlur.fire(that.options.gradeNames.slice(-1));
        }
    });
};
