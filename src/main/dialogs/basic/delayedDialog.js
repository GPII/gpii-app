/**
 * Show `a gpii.app.dialog` with delay
 *
 * An enhancement that adds a functionality for postponed displaying of a `BrowserWindow`
 * Copyright 2016 Steven Githens
 * Copyright 2016-2017 OCAD University
 *
 * Licensed under the New BSD license. You may not use this file except in
 * compliance with this License.
 * The research leading to these results has received funding from the European Union's
 * Seventh Framework Programme (FP7/2007-2013) under grant agreement no. 289016.
 * You may obtain a copy of the License at
 * https://github.com/GPII/universal/blob/master/LICENSE.txt
 */
"use strict";

var fluid = require("infusion");
var gpii  = fluid.registerNamespace("gpii");

require("./resizable.js");

fluid.registerNamespace("gpii.app.dialog");

/**
 * A component which adds the ability for a dialog to be shown with a delay.
 */
fluid.defaults("gpii.app.delayedDialog", {
    gradeNames: ["gpii.app.timer"],

    // the desired delay in milliseconds
    showDelay: null,

    listeners: {
        onTimerFinished: {
            func: "{that}.show"
            // arguments are passed with the event
        }
    },

    invokers: {
        showWithDelay: {
            funcName: "gpii.app.delayedDialog.showWithDelay",
            args: [
                "{that}",
                "{that}.options.showDelay",
                "{arguments}" // showArgs
            ]
        },
        hide: {
            funcName: "gpii.app.delayedDialog.hide",
            args: ["{that}"]
        }
    }
});

/**
 * Schedules the dialog to be shown in `delay` milliseconds.
 * @param {Component} that - The `gpii.app.delayedDialog` instance.
 * @param {Number} [delay] - The delay in milliseconds.
 * @param {Any[]} [showArgs] - An array of arguments which will be
 * provided to the `show` invoker when the `delay` is up.
 */
gpii.app.delayedDialog.showWithDelay = function (that, delay, showArgs) {
    // process raw arguments
    showArgs = fluid.values(showArgs);
    that.start(delay, showArgs);
};

/**
 * If the dialog is scheduled to be shown but has not been shown yet,
 * this function will discard the showing. Otherwise, if the dialog is
 * already visible on screen, it will be hidden.
 * @param {Component} that - The `gpii.app.delayedDialog` instance.
 */
gpii.app.delayedDialog.hide = function (that) {
    that.clear();

    that.applier.change("isShown", false);
};
