/**
 * Manage blurring of Electron windows
 *
 * 
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

    // the list of windows that should not cause blur of the
    // current one; The current window should also be supplied
    linkedWindowsGrades: [],

    events: {
        onBlur: null
    },

    listeners: {
        onBlur: {
            funcName: "console.log",
            args: ["Lost: ", "{arguments}.0"]
        },
        "onCreate.initBlurListener": {
            funcName: "gpii.app.blurrable.initBlurListener",
            args: ["{that}", "{that}.options.linkedWindowsGrades"]
        }
    },

    invokers: {
        initComplexBlurListener: {
            funcName: "gpii.app.blurrable.initComplexBlurListener",
            args: [
                "{that}",
                "{that}.options.linkedWindowsGrades"
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
gpii.app.blurrable.initBlurListener = function (that, relatedGrades) {
    if (relatedGrades && relatedGrades.length > 0) {
        that.initComplexBlurListener();
    }
};

/**
 * If the focused window is not any of the related notify.
 *
 * @param that
 * @param relatedGrades
 */
gpii.app.blurrable.initComplexBlurListener = function (that, relatedGrades) {
    // Initialize the listener
    var linkedWindows = BrowserWindow.getAllWindows()
        .filter(gpii.app.blurrable.isWindowRelated.bind(null, relatedGrades));

    fluid.each(linkedWindows, function (window) {
        window.on("blur", function () {
            // the newly focused electron window
            var focusedWindow = BrowserWindow.getFocusedWindow();

            if (!focusedWindow || !gpii.app.blurrable.isWindowRelated(relatedGrades, focusedWindow)) {
                // XXX dev fired arg
                that.events.onBlur.fire(that.options.gradeNames.slice(-1));
            }
        });
    });
};
