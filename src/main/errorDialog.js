/**
 * Base BrowserWindow dialog component
 *
 * A base component for all Electron BrowserWindow dialogs.
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

var fluid   = require("infusion");
var gpii    = fluid.registerNamespace("gpii");
var ipcMain = require("electron").ipcMain;

require("./utils.js");

/**
 * A component that serves as simple interface for communication with the
 * electron `BrowserWindow` restart dialog.
 */
fluid.defaults("gpii.app.errorDialog.channel", {
    gradeNames: ["fluid.component"],

    events: {
        onClosed: null
    },

    listeners: {
        "onCreate.registerChannel": {
            funcName: "gpii.app.errorDialog.channel.register",
            args: ["{that}.events"]
        }
    },

    invokers: {
        update: {
            funcName: "gpii.app.notifyWindow",
            args: [
                "{dialog}.dialog",
                "onErrorUpdate",
                "{arguments}.0"
            ]
        }
    }
});

/**
 * Register for events from the managed Electron `BrowserWindow` (the renderer process).
 * @param events {Objects} Events that are to be mapped to dialog actoins
 */
gpii.app.errorDialog.channel.register = function (events) {
    ipcMain.on("onErrorDialogClosed", function (/*event, message*/) {
        events.onClosed.fire();
    });
};



fluid.defaults("gpii.app.errorDialog", {
    gradeNames: ["gpii.app.dialog"],

    config: {
        attrs: {
            width: 400,
            height: 350
        },
        fileSuffixPath: "errorDialog/index.html"
    },

    listeners: {
        // close the dialog
        "{dialogChannel}.events.onClosed": {
            changePath: "isShown",
            value: false
        }
    },

    components: {
        dialogChannel: {
            type: "gpii.app.errorDialog.channel"
        }
    },

    invokers: {
        show: {
            funcName: "gpii.app.errorDialog.show",
            args: ["{that}", "{arguments}.0"]
        }
    }
});

gpii.app.errorDialog.show = function (that, config) {
    that.dialogChannel.update(config);
    that.applier.change("isShown", true);
};
