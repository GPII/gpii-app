/**
 * Spinner BrowserWindow Dialog
 *
 * Introduces a component that uses an Electron BrowserWindow to represent a "please wait" spinner.
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

require("./dialog.js");

/**
 * Component that contains an Electron Dialog.
 */

fluid.defaults("gpii.app.waitDialog", {
    gradeNames: ["gpii.app.dialog"],

    config: {
        attrs: {
            width: 800,
            height: 600
        },
        fileSuffixPath: "waitDialog/index.html"
    },
    model: {
        dialogMinDisplayTime: 2000, // minimum time to display dialog to user in ms
        dialogStartTime: 0, // timestamp recording when the dialog was displayed to know when we can dismiss it again
        timeout: 0
    },
    modelListeners: {
        isShown: {
            funcName: "gpii.app.waitDialog.toggle",
            args: ["{that}", "{change}.value"],
            namespace: "impl"
        }
    },
    listeners: {
        "onDestroy.clearTimers": "gpii.app.waitDialog.clearTimers({that})"
    }
});


gpii.app.waitDialog.clearTimers = function (that) {
    clearTimeout(that.dismissWaitTimeout);
    clearInterval(that.displayWaitInterval);
};

/**
 * Either shows or hides the wait dialog, depending on the `isShown` flag state
 *
 * @param that {Component} The `gpii.app.waitDialog` instance
 * @param isShown {Boolean} The state of the dialog
 */
gpii.app.waitDialog.toggle = function (that, isShown) {
    if (isShown) {
        gpii.app.waitDialog.show(that);
    } else {
        gpii.app.waitDialog.hide(that);
    }
};

/**
 * Shows the dialog on users screen with the message passed as parameter.
 * Records the time it was shown in `dialogStartTime` which we need when
 * dismissing it (checking whether it's been displayed for the minimum amount of time)
 *
 * @param that {Component} the gpii.app instance
 */
gpii.app.waitDialog.show = function (that) {
    that.positionWindow();
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

    that.model.waitDialogStartTime = Date.now();
};

/**
 * Dismisses the dialog. If less than `that.dialogMinDisplayTime` ms have passed since we first displayed
 * the window, the function waits until `dialogMinDisplayTime` has passed before dismissing it.
 *
 * @param that {Component} the gpii.app instance
 */
gpii.app.waitDialog.hide = function (that) {
    if (that.dismissWaitTimeout) {
        clearTimeout(that.dismissWaitTimeout);
        that.dismissWaitTimeout = null;
    }

    // ensure we have displayed for a minimum amount of `dialogMinDisplayTime` secs to avoid confusing flickering
    var remainingDisplayTime = (that.model.waitDialogStartTime + that.model.dialogMinDisplayTime) - Date.now();

    if (remainingDisplayTime > 0) {
        that.dismissWaitTimeout = setTimeout(function () {
            that.dialog.hide();
        }, remainingDisplayTime);
    } else {
        that.dialog.hide();
    }
};
