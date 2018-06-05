/**
 * Manage blurring of Electron windows
 *
 * Defines mechanism to blur browser windows only when not interacted
 * with a window in a specific group of linked windows.
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


/**
 * Blurrable mixin
 */
fluid.defaults("gpii.app.blurrable", {
    // the list of windows that should not cause blur of the
    // current one; The current window should also be supplied
    linkedWindowsGrades: [],

    events: {
        onBlur: null
    },

    modelListeners: {
        isShown: {
            func: "{that}.initComplexBlurListener",
            args: "{arguments}.0"
        }
    },

    listeners: {
        // XXX dev
        onBlur: {
            funcName: "console.log",
            args: ["Lost: ", "{arguments}.0"]
        }
    },

    invokers: {
        initComplexBlurListener: {
            funcName: "gpii.app.blurrable.initComplexBlurListener",
            args: [
                "{that}",
                "{that}.options.linkedWindowsGrades",
                "{arguments}.0" // isDialogShown
            ]
        }
    }
});


gpii.app.blurrable.isWindowRelated = function (linkedGrades, window) {
    return linkedGrades && linkedGrades.some(function (linkedWindowGrade) {
        if (window && window.gradeNames) {
            return window.gradeNames.indexOf(linkedWindowGrade) >= 0;
        }
    });
};


/**
 * Set blur listeners if blur targets exist.
 *
 * @param that
 * @param relatedGrades
 * @returns {undefined}
 */
gpii.app.blurrable.initComplexBlurListener = function (that, relatedGrades, isDialogShown) {
    if (isDialogShown && relatedGrades && relatedGrades.length > 0) {
        gpii.app.blurrable.attachComplexBlurListener(that, that.dialog || that.pspWindow, relatedGrades);
    }
};

/**
 * If the focused window is not any of the related notify.
 *
 * @param that
 * @param relatedGrades
 */
gpii.app.blurrable.attachComplexBlurListener = function (that, window, relatedGrades) {
    // Initialize the listener
    window.once("blur", function () {
        // the newly focused electron window
        var focusedWindow = BrowserWindow.getFocusedWindow();

        if (focusedWindow || gpii.app.blurrable.isWindowRelated(relatedGrades, focusedWindow)) {
            gpii.app.blurrable.attachComplexBlurListener(that, focusedWindow, relatedGrades);
        } else {
            // XXX dev fired arg
            that.events.onBlur.fire(that.options.gradeNames.slice(-1));
        }
    });
};
