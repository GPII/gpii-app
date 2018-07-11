/**
 * Manager for gpii-app shortcuts
 *
 * A component that handles keyboard shortcut registration either for specific windows or global.
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
var globalShortcut = require("electron").globalShortcut;
var localshortcut = require("electron-localshortcut");


/**
 * TODO
 */
fluid.defaults("gpii.app.shortcutsManager", {
    gradeNames: ["fluid.modelComponent"],

    events: {},

    members: {
        // Record of all registered shortcuts
        // May be used for de-registration or re-registration of shortcuts
        shortcuts: {
            /*
             <name>: {
                command: <keys_combination>,
                event: <event_by_name_to_be_triggered>,
                targetWindows: [<window_grade1>, <window_grade2>]
             }
             */
        }
    },

    listeners: {
        "onDestroy.clearShortcuts": {
            funcName: "gpii.app.shortcutsManager.clearShortcuts"
        }
    },

    invokers: {
        registerGlobalShortcut: {
            funcName: "gpii.app.shortcutsManager.registerGlobalShortcut",
            args: [
                "{that}",
                "{arguments}.0",
                "{arguments}.1"
            ]
        },
        registerLocalShortcut: {
            funcName: "gpii.app.shortcutsManager.registerLocalShortcut",
            args: [
                "{that}",
                "{arguments}.0",
                "{arguments}.1",
                "{arguments}.2"
            ]
        }
    }
});


/**
 * Ensure global shortcuts are cleared after app destruction.
 */
gpii.app.shortcutsManager.clearShortcuts = function () {
    globalShortcut.unregisterAll();
};


gpii.app.shortcutsManager.registerGlobalShortcut = function (that, command, eventName) {
    var shortcutEvent = that.events[eventName];
    if (!shortcutEvent) {
        fluid.fail("ShortcutsManager: Missing shortcut event - ", eventName);
        return;
    }

    if (globalShortcut.isRegistered(command)) {
        // Check whether a shortcut is registered.
        fluid.fail("Global shortcut already exists:", command);
        return;
    }

    globalShortcut.register(command, shortcutEvent.fire);

    // Keep record of set shortcuts
    that.shortcuts[shortcutEvent] = {
        command: command
    };
};

gpii.app.shortcutsManager.registerLocalShortcut = function (that, command, eventName, targetWindows) {
    var shortcutEvent = that.events[eventName];
    var windows = targetWindows;

    if (!shortcutEvent) {
        fluid.fail("ShortcutsManager: Missing shortcut event - ", eventName);
        return;
    }
    if (!windows) {
        fluid.fail("ShortcutsManager: Missing shortcut event - ", eventName);
        return;
    }

    windows = Array.isArray(windows) ? windows : [windows];

    fluid.each(windows, function (winGrade) {
        var winCmp = fluid.queryIoCSelector(fluid.rootComponent, winGrade)[0];

        if (!winCmp || !winCmp.dialog) {
            fluid.fail("ShortcutsManager: Target window either missing or not of `gpii.app.dialog` grade - ", winGrade);
            return;
        }
        localshortcut.register(winCmp.dialog, command, shortcutEvent.fire);
    });

    // Keep record of set shortcuts
    that.shortcuts[shortcutEvent] = {
        command: command,
        targetWindows: targetWindows
    };
};
