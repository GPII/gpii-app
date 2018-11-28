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


/**
 * Negate the given condition.
 * @param {Boolean|Any} condition - The condition to be negated
 * @return {Boolean} The negated value
 */
fluid.negate = function (condition) {
    return !condition;
};


/*
 * A simple wrapper for the native timeout. Responsible for clearing the interval
 * upon component destruction.
 */
fluid.defaults("gpii.app.timer", {
    gradeNames: ["fluid.modelComponent"],

    defaultTimeoutDuration: 0,

    members: {
        timer: null
    },

    listeners: {
        "onTimerFinished.clearState": "{that}.clear",
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
        notifyTimerFinished: {
            funcName: "gpii.app.timer.notifyTimerFinished",
            args: [
                "{that}",
                "{arguments}.0" // eventArguments
            ]
        },
        clear: {
            funcName: "gpii.app.timer.clear",
            args: ["{that}"]
        },
        isActive: {
            funcName: "fluid.isValue",
            args: "{that}.timer"
        }
    }
});

/**
 * Starts a timer. In `timeoutDuration` milliseconds the `onTimerFinished`
 * event will be fired. If the `timeoutDuration` is not specified, the
 * `defaultTimeoutDuration` will be used instead. In case the `timeoutDuration`
 * is not an integer, an error will be thrown. Any previously registered timers
 * will be cleared upon the invocation of this function.
 * @param {Component} that -The `gpii.app.timer` instance.
 * @param {Number} [timeoutDuration] -The timeout duration in milliseconds.
 * In case it is not specified, the `onTimerFinished` event will be fired
 * immediately.
 * @param {Any[]} [eventArguments] - Events to be passed with the fired event.
 */
gpii.app.timer.start = function (that, timeoutDuration, eventArguments) {
    timeoutDuration = fluid.isValue(timeoutDuration) ? timeoutDuration : that.options.defaultTimeoutDuration;

    if (Number.isInteger(timeoutDuration)) {
        that.clear();
        that.timer = setTimeout(function () {
            that.notifyTimerFinished(eventArguments);
        }, timeoutDuration);
    } else {
        fluid.fail("Timer's delay must be a number.");
    }
};

/**
 * Fires the `onTimerFinished` event for the current `gpii.app.timer` instance.
 * @param {Component} that -The `gpii.app.timer` instance.
 * @param {Any[]} [eventArguments] - Events to be passed with the fired event.
 */
gpii.app.timer.notifyTimerFinished = function (that, eventArguments) {
    that.events.onTimerFinished.fire.apply(that.events.onTimerFinished, eventArguments);
};

/**
 * Clears the timer (if any).
 * @param {Component} that -The `gpii.app.timer` instance.
 */
gpii.app.timer.clear = function (that) {
    if (that.timer) {
        clearTimeout(that.timer);
        that.timer = null;
    }
};

fluid.registerNamespace("gpii.app.applier");

/**
 * Replaces the value at a given path in a component's model in a single
 * transaction. Useful because the default behavior when invoking an
 * `applier.change` function is to merge the new object with the value of
 * the old object at the specified model path which may not always be
 * appropriate for all situations.
 * @param {ChangeApplier} applier - The change applier for a model component.
 * @param {String} path - The path in the component's model.
 * @param {Any} value - The new value which should be set at the specified
 * `path`.
 * @param {String} [source] - The source of the model change.
 */
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

/**
 * A namespace for utility functions related to setting groups.
 */
fluid.registerNamespace("gpii.app.settingGroups");

/**
 * Determines if there is at least one setting group in the provided array of
 * setting groups which contains at least one setting.
 * @param {module:gpiiConnector.SettingGroup[]} settingGroups - An array of
 * setting groups.
 * @return {Boolean} `true` - if there is at least one setting group with at
 * least one setting in it.
 */
gpii.app.settingGroups.hasSettings = function (settingGroups) {
    return !!fluid.find_if(settingGroups, function (settingGroup) {
        return settingGroup.settings.length > 0;
    });
};

/*
 * Scales a number by a particular scale factor. A simple multiplication.
 * @param {Number} scaleFactor - The scale factor.
 * @param {Number} num - The number to be scaled.
 * @return {Number} - The scaled number.
 */
gpii.app.scale = function (scaleFactor, num) {
    return scaleFactor * num;
};

