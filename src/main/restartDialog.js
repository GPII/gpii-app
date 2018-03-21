/**
 * Dialog for the "Restart Needed" functionality
 *
 * Introduces an Electron BrowserWindow component that manages the "Restart Needed" pop-up, which includes the creation and connection of the dialog.
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
        onClosed: null, // provided by parent component
        onContentHeightChanged: null
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
                "onRestartRequired",
                "{arguments}.0" // message
            ]
        }
    }
});

/**
 * Register for events from the managed Electron `BrowserWindow` (the renderer process).
 * @param events {Object} Events that are to be mapped to dialog actions.
 */
gpii.app.dialog.restartDialog.channel.register = function (events) {
    /*
     * NOTE: all other dialog events - onRestartNow, onRestartLater, onUndoChnages
     * are handled by the `gpii.app.psp` IPC handler as they share both share the same
     * functionality and ipcMain channel.
     */

    ipcMain.on("onClosed", function (/*event, message*/) {
        events.onClosed.fire();
    });

    ipcMain.on("onRestartDialogHeightChanged", function (event, height) {
        events.onContentHeightChanged.fire(height);
    });
};


/**
 * Handles logic for the dialog popup for the "Restart required" functionality.
 * Creates an Electron `BrowserWindow` and manages it.
 */
fluid.defaults("gpii.app.dialog.restartDialog", {
    gradeNames: ["gpii.app.dialog"],

    invokers: {
        show: {
            funcName: "gpii.app.dialog.restartDialog.show",
            args: [
                "{that}",
                "{arguments}.0" // pendingChanges
            ]
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
        onClosed: null
    },

    listeners: {
        onClosed: {
            func: "{that}.hide"
        }
    },

    components: {
        dialogChannel: {
            type: "gpii.app.dialog.restartDialog.channel",
            options: {
                events: {
                    onContentHeightChanged: "{restartDialog}.events.onContentHeightChanged",
                    onClosed: "{restartDialog}.events.onClosed"
                }
            }
        }
    }
});

/**
 * Defines the logic for showing the "Restart required" dialog.
 * @param restartDialog {Component} The `gpii.app.restartDialog` component.
 * @param pendingChanges {Object[]} The list of pending changes that are to be listed.
 */
gpii.app.dialog.restartDialog.show = function (that, pendingChanges) {
    // change according to the new solutions
    that.dialogChannel.updatePendingChanges(pendingChanges);

    // finally, show the dialog
    that.applier.change("isShown", true);
};
