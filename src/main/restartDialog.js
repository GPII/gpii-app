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

var fluid   = require("infusion");
var gpii    = fluid.registerNamespace("gpii");
var ipcMain = require("electron").ipcMain;

require("./dialog.js");

/**
 * A component that serves as simple interface for communication with the
 * electron `BrowserWindow` restart dialog.
 */
fluid.defaults("gpii.app.dialog.restartDialog.channel", {
    gradeNames: ["fluid.component"],

    events: {
        // onRestartNow: null,
        // onClosed: null,
        // onRestartLater: null
    },

    listeners: {
        "onCreate.registerChannel": {
            funcName: "gpii.app.dialog.restartDialog.channel.register",
            args: ["{that}.events"]
        }
    },

    invokers: {
        updatePendingChanges: {
            funcName: "gpii.app.notifyWindow",
            args: [
                "{dialog}.dialog",
                "onRestartRequired", // rethink channel name
                "{arguments}.0"
            ]
        }
    }
});

/**
 * Register for events from the managed Electron `BrowserWindow` (the renderer process).
 */
gpii.app.dialog.restartDialog.channel.register = function (events) {
    // TODO unite with PSP channel?
    ipcMain.on("onRestartNow", function (/*event, message*/) {
        // XXX currently handled by the PSP handler
        // events.onRestartNow.fire();
    });

    ipcMain.on("onUndoChanges", function (/*event, message*/) {
        // XXX currently handled by the PSP handler
        // events.onUndoChanges.fire();
    });

    ipcMain.on("onRestartLater", function (/*event, message*/) {
        events.onClosed.fire();
    });

    ipcMain.on("onClosed", function (/*event, message*/) {
        events.onClosed.fire();
    });
};


/**
 * Handles logic for the dialog popup for the "Restart required" functionality.
 * Creates an Electron `BrowserWindow` and manages it.
 */
fluid.defaults("gpii.app.dialog.restartDialog", {
    gradeNames: ["gpii.app.dialog", "fluid.modelComponent"],

    model: {
        pendingChanges: []
    },

    invokers: {
        showIfNeeded: {
            funcName: "gpii.app.dialog.restartDialog.showIfNeeded",
            args: ["{that}", "{arguments}.0"]
        },
        isShown: {
            this: "{that}.dialog",
            method: "isVisible"
        }
    },

    config: {
        attrs: {
            width: 500,
            height: 400
        },
        fileSuffixPath: "restartDialog/index.html"
    },

    events: {
        onRestartNow: null,
        onClosed: null,
        onRestartLater: null,
        onUndoChanges: null
    },

    components: {
        dialogChannel: {
            type: "gpii.app.dialog.restartDialog.channel",
            options: {
                events: {
                    onRestartNow: "{restartDialog}.events.onRestartNow",
                    onClosed: "{restartDialog}.events.onClosed",
                    onRestartLater: "{restartDialog}.events.onRestartLater",
                    onUndoChanges: "{restartDialog}.events.onUndoChanges"
                }
            }
        }
    }
});

/**
 * Defines the logic for showing the "Restart required" warning dialog.
 * @param restartDialog {Component} The `gpii.app.restartDialog` component.
 * @param pendingChanges {Object[]} The list of pending changes that are to be listed.
 */
gpii.app.dialog.restartDialog.showIfNeeded = function (restartDialog, pendingChanges) {
    if (pendingChanges.length > 0) {
        // change according to the new solutions
        restartDialog.dialogChannel.updatePendingChanges(pendingChanges);
        restartDialog.dialog.focus();

        // finally, show the dialog
        restartDialog.show();
    }
};
