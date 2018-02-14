/**
 * Error dialog component
 *
 * An Electron BrowserWindow dialog that presents errors to the user.
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
 * electron `BrowserWindow` error dialog.
 */
fluid.defaults("gpii.app.errorDialog.channel", {
    gradeNames: ["fluid.component"],

    events: {
        onClosed: null,
        onContentHeightChanged: null
    },

    listeners: {
        "onCreate.registerChannel": {
            funcName: "gpii.app.errorDialog.channel.register",
            args: ["{errorDialog}", "{that}.events"]
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
gpii.app.errorDialog.channel.register = function (that, events) {
    ipcMain.on("onErrorDialogClosed", function (/*event, message*/) {
        events.onClosed.fire();
    });

    ipcMain.on("onErrorDialogHeightChanged", function (event, height) {
        events.onContentHeightChanged.fire(height);
    });
};


/**
 * A component that represent an error dialog
 * and is used to display error messages to the user.
 * In order for an error to be properly displayed it requires the following attributes:
 * title, subheader, details and error code
 */
fluid.defaults("gpii.app.errorDialog", {
    gradeNames: ["gpii.app.dialog"],

    config: {
        attrs: {
            width: 400,
            height: 100 // This is to be changed with respect to the content needs
        },
        fileSuffixPath: "errorDialog/index.html"
    },

    defaultDialogConfig: {
        title:   null,
        subhead: null,
        details: null,
        errCode: null,

        btnLabel1: null,
        btnLabel2: null,
        btnLabel3: null
    },

    components: {
        dialogChannel: {
            type: "gpii.app.errorDialog.channel",
            options: {
                listeners: {
                    "onContentHeightChanged": {
                        func: "{dialog}.resize",
                        args: [
                            "{errorDialog}.options.config.attrs.width", // only the height is dynamic
                            "{arguments}.0" // windowHeight
                        ]
                    },
                    "onClosed": {
                        func: "{errorDialog}.hide"
                    }
                }
            }
        }
    },

    invokers: {
        show: {
            funcName: "gpii.app.errorDialog.show",
            args: [
                "{that}",
                "{arguments}.0" // errorConfig
            ]
        },
        hide: {
            funcName: "gpii.app.errorDialog.hide",
            args: ["{that}"]
        }
    }
});


/**
 * Update the current state of the error dialog, and show it.
 * Update is required as we're using a single Electron `BrowserWindow`
 *
 * @param that {Component} The `gpii.app.errorDialog` component
 * @param errorConfig         {Object} Options for error dialog
 * @param errorConfig.title   {String} The error title
 * @param errorConfig.subhead {String} The error subheader
 * @param errorConfig.details {String} The details for the error
 * @param errorConfig.errCode {String} The error code
 */
gpii.app.errorDialog.show = function (that, errorConfig) {
    that.dialogChannel.update(errorConfig);

    that.applier.change("isShown", true);
};

/**
 * Hides and resets the state of the dialog, clearing any set
 * properties.
 *
 * @param that {Component} The `gpii.app.errorDialog` component
 */
gpii.app.errorDialog.hide = function (that) {
    that.applier.change("isShown", false);

    that.dialogChannel.update(that.options.defaultDialogConfig);
};
