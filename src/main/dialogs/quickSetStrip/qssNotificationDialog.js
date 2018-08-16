/**
 * The Quick Set Strip widget pop-up
 *
 * Introduces a component that uses an Electron BrowserWindow to represent the QSS widget (menu or increment/decrement).
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

fluid.defaults("gpii.app.qssNotification", {
    gradeNames: ["gpii.app.centeredDialog", "gpii.app.blurrable"],

    config: {
        attrs: {
            width: 350,
            height: 200,
            alwaysOnTop: true
        },
        fileSuffixPath: "qssNotification/index.html"
    },

    linkedWindowsGrades: ["gpii.app.qss", "gpii.app.qssNotification"],

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
        }
    }
});


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
    that.applier.change("isShown", true);
    that.focusOnClose = notificationParams.focusOnClose;
};
