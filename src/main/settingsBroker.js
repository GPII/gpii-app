/*!
GPII Application
Copyright 2016 Steven Githens
Copyright 2016-2017 OCAD University

Licensed under the New BSD license. You may not use this file except in
compliance with this License.
The research leading to these results has received funding from the European Union's
Seventh Framework Programme (FP7/2007-2013) under grant agreement no. 289016.
You may obtain a copy of the License at
https://github.com/GPII/universal/blob/master/LICENSE.txt
*/
"use strict";

var fluid = require("infusion");
var gpii  = fluid.registerNamespace("gpii");

fluid.defaults("gpii.app.settingsBroker", {
    gradeNames: ["fluid.modelComponent"],
    model: {
        keyedInUserToken: null,
        pendingChanges: []
    },
    modelListeners: {
        keyedInUserToken: {
            funcName: "gpii.app.settingsBroker.onUserTokenChanged",
            args: ["{that}", "{change}.value"],
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
            args: ["{that}", "{arguments}.0"]
        },
        applySetting: {
            this: "{that}.events.onSettingApplied",
            method: "fire",
            args: ["{arguments}.0"]
        },
        flushPendingChanges: {
            funcName: "gpii.app.settingsBroker.flushPendingChanges",
            args: ["{that}", "{that}.model.pendingChanges"]
        },
        clearPendingChanges: {
            funcName: "gpii.app.settingsBroker.clearPendingChanges",
            args: ["{that}"]
        },
        undoPendingChanges: {
            funcName: "gpii.app.settingsBroker.undoPendingChanges",
            args: ["{that}", "{that}.model.pendingChanges"]
        },
        hasPendingChanges: {
            funcName: "gpii.app.settingsBroker.hasPendingChanges",
            args: ["{that}.model.pendingChanges"]
        }
    },
    events: {
        onSettingApplied: null,
        onRestartRequired: null
    }
});

/**
 * Checks whether the old value and new value for a given setting are equal.
 * Relies on the usage of `JSON.stringify` which means that if the values
 * are arrays, the ordering of the objects within them matters.
 * @param oldValue {Any} The old value for the setting.
 * @param newValue {Any} The new value for the setting.
 * @return `true` if the values are equal and `false` otherwise.
 */
gpii.app.settingsBroker.equals = function (oldValue, newValue) {
    return JSON.stringify(oldValue) === JSON.stringify(newValue);
};

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
        if (gpii.app.settingsBroker.equals(pendingChange.oldValue, setting.value)) {
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

gpii.app.settingsBroker.clearPendingChanges = function (settingsBroker) {
    settingsBroker.applier.change("pendingChanges", []);
};

gpii.app.settingsBroker.flushPendingChanges = function (settingsBroker, pendingChanges) {
    fluid.each(pendingChanges, function (pendingChange) {
        settingsBroker.applySetting(pendingChange);
    });
    settingsBroker.clearPendingChanges();
};

gpii.app.settingsBroker.undoPendingChanges = function (settingsBroker, pendingChanges) {
    fluid.each(pendingChanges, function (pendingChange) {
        pendingChange = fluid.extend(true, pendingChange, {
            value: pendingChange.oldValue
        });
        settingsBroker.applySetting(pendingChange);
    });
    settingsBroker.clearPendingChanges();
};

gpii.app.settingsBroker.onUserTokenChanged = function (settingsBroker, keyedInUserToken) {
    if (!fluid.isValue(keyedInUserToken)) {
        settingsBroker.clearPendingChanges();
    }
};

gpii.app.settingsBroker.hasPendingChanges = function (pendingChanges) {
    return fluid.isArrayable(pendingChanges) && pendingChanges.length > 0;
};
