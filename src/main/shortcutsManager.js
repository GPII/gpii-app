/**
 * Manager for gpii-app shortcuts
 *
 * A component that handles keyboard shortcut registration either for specific windows or globally.
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
 * A component responsible for registering global and local (i.e. related to a
 * particular `BrowserWindow`) shortcuts. Takes care of deregistering the
 * global shortcuts when the component is destroyed. Whenever a keyboard shortcut
 * is activated, the corresponding component's event will be fired.
 */
fluid.defaults("gpii.app.shortcutsManager", {
    gradeNames: ["fluid.modelComponent"],

    events: {},

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
                "{arguments}.0", // command
                "{arguments}.1"  // eventName
            ]
        },
        deregisterGlobalShortcut: {
            funcName: "gpii.app.shortcutsManager.deregisterGlobalShortcut",
            args: [
                "{arguments}.0" // command
            ]
        },
        registerLocalShortcut: {
            funcName: "gpii.app.shortcutsManager.registerLocalShortcut",
            args: [
                "{that}",
                "{arguments}.0", // command
                "{arguments}.1", // eventName
                "{arguments}.2"  // targetWindows
            ]
        },
        deregisterLocalShortcut: {
            funcName: "gpii.app.shortcutsManager.deregisterLocalShortcut",
            args: [
                "{arguments}.0", // command
                "{arguments}.1"  // targetWindows
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

/**
 * Registers a global shortcut, i.e. a shortcut which is triggered if the app
 * is running but not necessarily focused.
 * @param {Component} that - The `gpii.app.shortcutsManager` instance.
 * @param {String} command - The global shortcut string. For further information,
 * see https://electronjs.org/docs/api/accelerator.
 * @param {String} eventName - The name of the event which should be triggered when
 * the shortcut is activated.
 */
gpii.app.shortcutsManager.registerGlobalShortcut = function (that, command, eventName) {
    var shortcutEvent = that.events[eventName];
    if (!shortcutEvent) {
        fluid.fail("ShortcutsManager: Missing shortcut event - ", eventName);
    }

    if (globalShortcut.isRegistered(command)) {
        // Check whether a shortcut is registered.
        fluid.fail("ShortcutsManager: Global shortcut already exists - ", command);
    }

    globalShortcut.register(command, shortcutEvent.fire);
};

/**
 * Deregisters a global shortcut.
 * @param {String} command - The global shortcut string.
 */
gpii.app.shortcutsManager.deregisterGlobalShortcut = function (command) {
    if (globalShortcut.isRegistered(command)) {
        globalShortcut.unregister(command);
    } else {
        fluid.fail("ShortcutsManager: Cannot unregister an unexisting global shortcut - ", command);
    }
};

/**
 * Registers a local shortcut, i.e. a shortcut which is triggered only if the
 * given `BrowserWindow` is visible and has focus.
 * @param {Component} that - The `gpii.app.shortcutsManager` instance.
 * @param {String} command - The local shortcut string. It has the same format
 * as the global shortcut string.
 * @param {String} eventName - The name of the event which should be triggered when
 * the shortcut is activated.
 * @param {BrowserWindow[]} targetWindows - An array of windows for which the
 * shortcut has to be registered.
 */
gpii.app.shortcutsManager.registerLocalShortcut = function (that, command, eventName, targetWindows) {
    var shortcutEvent = that.events[eventName];
    var windows = targetWindows;

    if (!shortcutEvent) {
        fluid.fail("ShortcutsManager: Missing shortcut event - ", eventName);
    }
    if (!windows) {
        fluid.fail("ShortcutsManager: Local shortcuts require windows to be attached to - ", eventName);
    }

    windows = Array.isArray(windows) ? windows : [windows];

    fluid.each(windows, function (winGrade) {
        var winCmp = fluid.queryIoCSelector(fluid.rootComponent, winGrade)[0];

        if (!winCmp || !winCmp.dialog) {
            fluid.fail("ShortcutsManager: Target window either missing or not of `gpii.app.dialog` grade - ", winGrade);
        }
        localshortcut.register(winCmp.dialog, command, shortcutEvent.fire);
    });
};

/**
 * Deregisters a local shortcut.
 * @param {String} command - The local shortcut string.
 * @param {BrowserWindow[]} targetWindows - An array of windows for which the
 * shortcut has to be deregistered.
 */
gpii.app.shortcutsManager.deregisterLocalShortcut = function (command, targetWindows) {
    var windows = targetWindows;
    windows = Array.isArray(windows) ? windows : [windows];

    fluid.each(windows, function (winGrade) {
        var winCmp = fluid.queryIoCSelector(fluid.rootComponent, winGrade)[0];

        if (!winCmp || !winCmp.dialog) {
            fluid.fail("ShortcutsManager: Target window either missing or not of `gpii.app.dialog` grade - ", winGrade);
        }

        localshortcut.unregister(winCmp.dialog, command);
    });
};
