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

var fluid         = require("infusion");
var BrowserWindow = require("electron").BrowserWindow;

var gpii  = fluid.registerNamespace("gpii");

require("./utils.js");

/**
 * Component that contains an Electron Dialog.
 */

fluid.defaults("gpii.app.dialog", {
    gradeNames: "fluid.modelComponent",


    config: {
        attrs: {
            width: 800,
            height: 600,
            show: false,
            frame: false,
            transparent: true,
            alwaysOnTop: true,
            skipTaskBar: true
        },
        url: {
            expander: {
                funcName: "fluid.stringTemplate",
                args: [
                    "file://%gpii-app/src/renderer/waitDialog/index.html",
                    "@expand:fluid.module.terms()"
                ]
            }
        }
    },
    model: {
        showDialog: false,
        dialogMinDisplayTime: 2000, // minimum time to display dialog to user in ms
        dialogStartTime: 0, // timestamp recording when the dialog was displayed to know when we can dismiss it again
        timeout: 0
    },
    members: {
        dialog: {
            expander: {
                funcName: "gpii.app.dialog.makeWaitDialog",
                args: [
                    "{that}.options.config.attrs",
                    "@expand:{that}.getWindowPosition()",
                    "{that}.options.config.url"
                ]
            }
        }
    },
    modelListeners: {
        "showDialog": {
            funcName: "gpii.app.dialog.showHideWaitDialog",
            args: ["{that}", "{change}.value"]
        }
    },
    listeners: {
        "onDestroy.clearTimers": "gpii.app.dialog.clearTimers({that})",
        "onDestroy.cleanupElectron": {
            this: "{that}.dialog",
            method: "destroy"
        }
    },
    invokers: {
        getWindowPosition: {
            funcName: "gpii.app.getWindowPosition",
            args: [
                "{that}.options.config.attrs.width",
                "{that}.options.config.attrs.height"
            ]
        }
    }
});

gpii.app.dialog.clearTimers = function (that) {
    clearTimeout(that.dismissWaitTimeout);
    clearInterval(that.displayWaitInterval);
};

/**
 * Creates a dialog. This is done up front to avoid the delay from creating a new
 * dialog every time a new message should be displayed.
 */
gpii.app.dialog.makeWaitDialog = function (windowOptions, position, url) {
    var dialog = new BrowserWindow(windowOptions);
    dialog.setPosition(position.x, position.y);

    dialog.loadURL(url);
    return dialog;
};


gpii.app.dialog.showHideWaitDialog = function (that, showDialog) {
    console.log("HERE: ", showDialog);
    showDialog ? gpii.app.dialog.displayWaitDialog(that) : gpii.app.dialog.dismissWaitDialog(that);
};

/**
 * Shows the dialog on users screen with the message passed as parameter.
 * Records the time it was shown in `dialogStartTime` which we need when
 * dismissing it (checking whether it's been displayed for the minimum amount of time)
 *
 * @param that {Component} the gpii.app instance
 */
gpii.app.dialog.displayWaitDialog = function (that) {
    that.dialog.show();
    // Hack to ensure it stays on top, even as the GPII autoconfiguration starts applications, etc., that might
    // otherwise want to be on top
    // see amongst other: https://blogs.msdn.microsoft.com/oldnewthing/20110310-00/?p=11253/
    // and https://github.com/electron/electron/issues/2097
    if (that.displayWaitInterval) {
        clearInterval(that.displayWaitInterval);
        that.displayWaitInterval = 0;
    }
    that.displayWaitInterval = setInterval(function () {
        if (!that.dialog.isVisible()) {
            clearInterval(that.displayWaitInterval);
        };
        that.dialog.setAlwaysOnTop(true);
    }, 100);

    that.model.dialogStartTime = Date.now();
};

/**
 * Dismisses the dialog. If less than `that.dialogMinDisplayTime` ms have passed since we first displayed
 * the window, the function waits until `dialogMinDisplayTime` has passed before dismissing it.
 *
 * @param that {Component} the gpii.app instance
 */
gpii.app.dialog.dismissWaitDialog = function (that) {
    if (that.dismissWaitTimeout) {
        clearTimeout(that.dismissWaitTimeout);
        that.dismissWaitTimeout = null;
    }

    // ensure we have displayed for a minimum amount of `dialogMinDisplayTime` secs to avoid confusing flickering
    var remainingDisplayTime = (that.model.dialogStartTime + that.model.dialogMinDisplayTime) - Date.now();

    if (remainingDisplayTime > 0) {
        that.dismissWaitTimeout = setTimeout(function () {
            that.dialog.hide();
        }, remainingDisplayTime);
    } else {
        that.dialog.hide();
    }
};
