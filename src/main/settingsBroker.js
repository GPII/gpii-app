/**
 * Settings Broker - Postpone settings applying
 *
 * Introduces component that serves as a "broker" for the communication bettween the PcpChannel and the PSP itself. It postpones sending of a setting change, in case the later requires OS or Application restart. It provides mechanism for undo as well as applying of all such "pending" setting changes.
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
require("./utils.js");

var fluid = require("infusion");
var gpii  = fluid.registerNamespace("gpii");

/**
 * A component which orchestrates the modification of user settings. There are two
 * groups of settings - the first consists of settings for which value changes are
 * immediately reflected. They have "liveness" which is either "live" or "liveRestart".
 * The second group houses settings whose value modifications will be applied in the
 * future after an explicit user confirmation. They have liveness which is either
 * "manualRestart" (i.e. the corresponding application must be restarted in order for
 * the setting to be applied) or "OSRestart" (the whole OS must be restarted).
 *
 * The `pendingChanges` array in the component's model contains descriptors of settings
 * from the second group (i.e. whose application is delayed).
 */
fluid.defaults("gpii.app.settingsBroker", {
    gradeNames: ["fluid.modelComponent"],
    model: {
        keyedInUserToken: null,
        pendingChanges: []
    },
    modelListeners: {
        keyedInUserToken: {
            func: "{that}.clearPendingChanges",
            excludeSource: ["init"]
        },
        pendingChanges: {
            this: "{that}.events.onRestartRequired",
            method: "fire",
            args: ["{change}.value"],
            excludeSource: ["init"]
        }
    },
    invokers: {
        enqueue: {
            funcName: "gpii.app.settingsBroker.enqueue",
            args: [
                "{that}",
                "{arguments}.0" // setting
            ]
        },
        applySetting: {
            this: "{that}.events.onSettingApplied",
            method: "fire",
            args: ["{arguments}.0"] // setting
        },
        undoSetting: {
            this: "{that}.events.onSettingApplied",
            method: "fire",
            args: [
                "{arguments}.0", // setting
                null,
                "settingsBroker.undo"
            ]
        },
        applyPendingChanges: {
            funcName: "gpii.app.settingsBroker.applyPendingChanges",
            args: ["{that}", "{that}.model.pendingChanges"]
        },
        clearPendingChanges: {
            changePath: "pendingChanges",
            value: []
        },
        undoPendingChanges: {
            funcName: "gpii.app.settingsBroker.undoPendingChanges",
            args: ["{that}", "{that}.model.pendingChanges"]
        },
        hasPendingChange: {
            funcName: "gpii.app.settingsBroker.hasPendingChange",
            args: [
                "{that}.model.pendingChanges",
                "{arguments}.0" // liveness
            ]
        }
    },
    events: {
        onSettingApplied: null,
        onRestartRequired: null
    }
});

/**
 * Queues a setting to be applied in the future. If the setting does not
 * require an application or OS restart, it will be applied immediately.
 * Otherwise, all queued settings will be applied once an explicit user
 * instruction is received.
 * @param settingsBroker {Component} An instance of `gpii.app.settingsBroker`.
 * @param setting {Object} A descriptor of the setting which is to be applied.
 */
gpii.app.settingsBroker.enqueue = function (settingsBroker, setting) {
    // Apply the setting immediately, without queuing if it is live.
    if (setting.liveness === "live" || setting.liveness === "liveRestart") {
        settingsBroker.applySetting(setting);
        return;
    }

    var pendingChanges = fluid.copy(settingsBroker.model.pendingChanges),
        pendingChange = fluid.find_if(pendingChanges, function (change) {
            return change.path === setting.path;
        });

    if (pendingChange) {
        // If the new setting's value is simply the initial value for the setting,
        // remove the pending changes for this setting altogether.
        if (fluid.model.diff(pendingChange.oldValue, setting.value)) {
            pendingChanges = fluid.remove_if(pendingChanges, function (change) {
                return change.path === setting.path;
            });
        } else {
            // If this setting has already been queued, swap its value
            pendingChange.value = setting.value;
        }
    } else {
        // The setting has been changed for the first time - queue it.
        pendingChanges.push(setting);
    }

    settingsBroker.applier.change("pendingChanges", pendingChanges);
};

/**
 * Applies all pending setting changes and clears the queue.
 * @param settingsBroker {Component} An instance of `gpii.app.settingsBroker`.
 * @param pendingChanges {Array} An array containing all pending setting changes.
 */
gpii.app.settingsBroker.applyPendingChanges = function (settingsBroker, pendingChanges) {
    fluid.each(pendingChanges, function (pendingChange) {
        settingsBroker.applySetting(pendingChange);
    });
    settingsBroker.clearPendingChanges();
};

/**
 * Cancels the application of pending changes and clears the queue. This
 * function is responsible for firing the appropriate events so that the PSP
 * interface can restore to its original state before the queueing of the
 * setting changes.
 * @param settingsBroker {Component} An instance of `gpii.app.settingsBroker`.
 * @param pendingChanges {Array} An array containing all pending setting changes.
 */
gpii.app.settingsBroker.undoPendingChanges = function (settingsBroker, pendingChanges) {
    fluid.each(pendingChanges, function (pendingChange) {
        pendingChange = fluid.extend(true, pendingChange, {
            value: pendingChange.oldValue
        });
        settingsBroker.undoSetting(pendingChange);
    });
    settingsBroker.clearPendingChanges();
};

gpii.app.settingsBroker.hasPendingChange = function (pendingChanges, liveness) {
    if (!fluid.isValue(liveness)) {
        return pendingChanges.length > 0;
    }

    return fluid.find_if(pendingChanges, function (change) {
        return change.liveness === liveness;
    });
};
