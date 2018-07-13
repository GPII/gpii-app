/**
 * PSP utility functions
 *
 * A set of utility function used throughout the components used in the main process of the PSP.
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

var gpii = fluid.registerNamespace("gpii");
fluid.registerNamespace("gpii.app");

/*
 * A simple wrapper for the native timeout. Responsible for clearing the interval
 * upon component destruction.
 */
fluid.defaults("gpii.app.timer", {
    gradeNames: ["fluid.modelComponent"],

    members: {
        timer: null
    },

    listeners: {
        "onDestroy.clearTimer": "{that}.clear"
    },

    events: {
        onTimerFinished: null
    },

    invokers: {
        start: {
            funcName: "gpii.app.timer.start",
            args: [
                "{that}",
                "{arguments}.0", // timeoutDuration
                "{arguments}.1"  // eventArguments
            ]
        },
        clear: {
            funcName: "gpii.app.timer.clear",
            args: ["{that}"]
        }
    }
});

/**
 * Starts a timer. In `timeoutDuration` milliseconds, the `onTimerFinished` event will be fired. Any previously
 * registered timers will be cleared upon the invokation of this function.
 *
 * @param {Component} that -The `gpii.app.timer` instance.
 * @param {Number} timeoutDuration -The timeout duration in milliseconds.
 * @param {Any[]} eventArguments - Events to be passed with the fired event.
 */
gpii.app.timer.start = function (that, timeoutDuration, eventArguments) {
    var timeoutArgs = [
        that.events.onTimerFinished.fire,
        timeoutDuration
    ]
        .concat(eventArguments);

    that.clear();
    that.timer = setTimeout.apply(null, timeoutArgs);
};

/**
 * Clears the timer.
 *
 * @param {Component} that -The `gpii.app.timer` instance.
 */
gpii.app.timer.clear = function (that) {
    if (that.timer) {
        clearTimeout(that.timer);
        that.timer = null;
    }
};

fluid.registerNamespace("gpii.app.applier");

gpii.app.applier.replace = function (applier, path, value, source) {
    var transaction = applier.initiate();

    // Remove the previous value at the given path
    transaction.fireChangeRequest({
        path: path,
        type: "DELETE",
        source: source
    });

    // Add the new value for the corresponding path
    transaction.fireChangeRequest({
        path: path,
        value: value,
        type: "ADD",
        source: source
    });

    transaction.commit();
};
