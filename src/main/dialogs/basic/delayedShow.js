/**
 * Show `gpii.app.dialog` with delay
 *
 * An enhancement that add functionality for
 * postponed displaying of a BrowserWindow
 * GPII Application
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
 * TODO
 */
fluid.defaults("gpii.app.dialog.delayedShow", {
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
        // _show: null, // expected from implementor
        // _hide: null,
        delayedShow: {
            funcName: "gpii.app.dialog.delayedShow.delayedShow",
            args: [
                "{that}",
                "{that}.options.showDelay",
                "{arguments}" // showArgs
            ]
        },
        delayedHide: {
            funcName: "gpii.app.dialog.delayedShow.delayedHide",
            args: ["{that}"]
        }
    }
});

gpii.app.dialog.delayedShow.delayedShow = function (that, delay, showArgs) {
    // process raw arguments
    showArgs = fluid.values(showArgs);

    if (!fluid.isValue(delay)) {
        // simply trigger a show synchronously
        that.events.onTimerFinished.fire.apply(that.events.onTimerFinished, showArgs);
    } else if (Number.isInteger(delay)) {
        that.start(delay, showArgs);
    } else {
        fluid.fail("Dialog's delay must be a number.");
    }
};

gpii.app.dialog.delayedShow.delayedHide = function (that) {
    // clear any existing timer
    that.clear();

    that.hide();
};


