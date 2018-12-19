/**
 * The Quick Set Strip notification dialog
 *
 * Introduces a component that uses an Electron BrowserWindow to represent the QSS
 * notification dialog.
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

var gpii = fluid.registerNamespace("gpii");

require("../basic/blurrable.js");
require("../basic/centeredDialog.js");

/**
 * A centered blurrable dialog which represents the QSS notification.
 * Used to signal setting changes that require a restart (e.g. Language
 * changes) or the status of the "Save" operation.
 */
fluid.defaults("gpii.app.qssNotification", {
    gradeNames: ["gpii.app.centeredDialog", "gpii.app.scaledDialog", "gpii.app.blurrable"],

    scaleFactor: 1,
    defaultWidth: 350,
    defaultHeight: 200,

    config: {
        attrs: {
            alwaysOnTop: true,
            transparent: false
        },
        fileSuffixPath: "qssNotification/index.html"
    },

    linkedWindowsGrades: ["gpii.app.qssNotification"],

    events: {
        onQssNotificationShown: null
    },

    components: {
        channelNotifier: {
            type: "gpii.app.channelNotifier",
            options: {
                events: {
                    onQssNotificationShown: "{qssNotification}.events.onQssNotificationShown"
                }
            }
        },
        channelListener: {
            type: "gpii.app.channelListener",
            options: {
                events: {
                    onQssNotificationClosed: null,
                    onQssNotificationHeightChanged: "{qssNotification}.events.onContentHeightChanged"
                },
                listeners: {
                    onQssNotificationClosed: {
                        funcName: "gpii.app.qssNotification.close",
                        args: ["{qssNotification}"]
                    }
                }
            }
        }
    },

    invokers: {
        show: {
            funcName: "gpii.app.qssNotification.show",
            args: [
                "{that}",
                "{arguments}.0" // notificationParams
            ]
        },
        handleBlur: {
            funcName: "gpii.app.qssNotification.handleBlur",
            args: ["{that}"]
        }
    }
});

/**
 * Hides the notification window and if specified, focuses a different
 * dialog.
 * @param {Component} qssNotification - The `gpii.app.qssNotification`
 * instance.
 */
gpii.app.qssNotification.close = function (qssNotification) {
    qssNotification.hide();

    var windowToFocus = qssNotification.focusOnClose;
    if (windowToFocus) {
        windowToFocus.focus();
    }
};

/**
 * Shows the QSS notification window and sends an IPC message with
 * details about what should be displayed in the notification.
 * @param {Component} that - The `gpii.app.qssNotification` instance.
 * @param {Object} notificationParams - The parameters for the notification
 * which is to be shown.
 */
gpii.app.qssNotification.show = function (that, notificationParams) {
    that.channelNotifier.events.onQssNotificationShown.fire(notificationParams);

    that.focusOnClose = notificationParams.focusOnClose;
    that.applier.change("closeOnBlur", notificationParams.closeOnBlur);

    that.applier.change("isShown", true);
};

/**
 * Handles the blur event for the QSS notification. The latter will be closed depending
 * on the value of the `closeOnBlur` model property.
 * @param {Component} that - The `gpii.app.qssNotification` instance.
 */
gpii.app.qssNotification.handleBlur = function (that) {
    if (that.model.closeOnBlur) {
        that.hide();
    }
};
