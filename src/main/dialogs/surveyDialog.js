/**
 * The survey dialog component
 *
 * Contains a component for initializing the survey `BrowserWindow` based on the
 * instructions of the `dialogManager`.
 * Copyright 2017 Raising the Floor - International
 *
 * Licensed under the New BSD license. You may not use this file except in
 * compliance with this License.
 * The research leading to these results has received funding from the European Union's
 * Seventh Framework Programme (FP7/2007-2013) under grant agreement no. 289016.
 * You may obtain a copy of the License at
 * https://github.com/GPII/universal/blob/master/LICENSE.txt
 */
"use strict";

var fluid = require("infusion"),
    electron = require("electron"),
    ipcMain = electron.ipcMain,
    gpii = fluid.registerNamespace("gpii");

require("./basic/dialogWrapper.js");

/**
 * A component which extends the base `gpii.app.dialog` by registering additional
 * listeners. As the html markup of the loaded page within the `BrowserWindow`
 * contains a webview tag, the component notifies the webview via the IPC mechanism
 * about the survey URL which is to be loaded. This can happen only after the html
 * file has been completely loaded (otherwise the IPC message will most probably be
 * lost as there will be noone to handle it). On the other hand, the component
 * can be notified by the webview if it needs to be closed. Once the `BrowserWindow`
 * is closed, it cannot be interacted with and thus the component itself will also
 * be destroyed.
 *
 * Please note that the communication between the Infusion component and the webview
 * is not direct. The `BrowserWindow` acts as an itermediary and is responsible for
 * forwarding the corresponding IPC messages.
 */
fluid.defaults("gpii.app.surveyDialog", {
    gradeNames: ["gpii.app.dialog"],
    config: {
        showInactive: true, // not focused when shown

        attrs: {
            icon: {
                expander: {
                    funcName: "fluid.module.resolvePath",
                    args: ["%gpii-app/src/icons/Morphic-Desktop-Icon.ico"]
                }
            },

            show: false,
            skipTaskbar: false,
            type: null,
            frame: true,
            transparent: false, // needs to be false to enable resizing and maximizing
            fullscreenable: true,
            movable: true,

            width: 800,
            height: 600,
            resizable: true,
            closable: true,
            minimizable: false,
            maximizable: false,

            alwaysOnTop: false
        },
        fileSuffixPath: "survey/index.html"
    },
    events: {
        onSurveyCreated: null,
        onSurveyClose: null
    },
    listeners: {
        "onCreate.hideMenu": {
            this: "{that}.dialog",
            method: "setMenu",
            args: [null]
        },
        "onCreate.initSurveyWindowIPC": {
            listener: "gpii.app.surveyDialog.initSurveyWindowIPC",
            args: ["{that}"]
        },
        "onSurveyCreated.openSurvey": {
            listener: "gpii.app.surveyDialog.openSurvey",
            args: ["{that}", "{that}.options.config"]
        },
        "onSurveyClose.closeSurvey": {
            funcName: "{that}.close"
        },
        "onDestroy.removeSurveyWindowIPC": {
            listener: "gpii.app.surveyDialog.removeSurveyWindowIPC"
        }
    },
    invokers: {
        notifySurveyWindow: {
            funcName: "gpii.app.notifyWindow",
            args: [
                "{that}.dialog",
                "{arguments}.0", // messageChannel
                "{arguments}.1"  // message
            ]
        },
        executeJavaScript: {
            funcName: "gpii.app.notifyWindow",
            args: [
                "{that}.dialog",
                "onExecuteJavaScript",
                "{arguments}.0" // message
            ]
        }
    }
});

/**
 * Initializes the IPC listeners needed for the communication with the `BrowserWindow`.
 * @param {Component} that - The `gpii.app.surveyDialog` instance.
 */
gpii.app.surveyDialog.initSurveyWindowIPC = function (that) {
    // We need to ensure that the `BrowserWindow` has been completely created before
    // trying to load a page in the webview element. It turned out that opening the
    // survey when the built-in `ready-to-show` listener for the `BrowserWindow` is
    // called is not sufficient as the webcontents object is sporadically not created.
    // Thus it is better to rely on a message passed by the renderer process in order
    // to determine when the actual survey content can be loaded.
    ipcMain.once("onSurveyCreated", function () {
        that.events.onSurveyCreated.fire();
    });

    // Messages via this channel are sent to the `surveyDialog` component whenever the
    // user clicks on the 'break out' link within the survey.
    ipcMain.once("onSurveyClose", function () {
        that.events.onSurveyClose.fire();
    });
};

/**
 * Notifies the survey pop-up that `surveyUrl` should be loaded in the webview.
 * @param {Component} that - The `gpii.app.surveyDialog` instance.
 * @param {Object} config - An object containing the configuration options for the
 * survey to be shown.
 */
gpii.app.surveyDialog.openSurvey = function (that, config) {
    that.notifySurveyWindow("onSurveyOpen", config);
    that.applier.change("isShown", true);
};

/**
 * Removes the IPC listeners needed for the communication with the `BrowserWindow`
 * when the latter is about to be destroyed.
 */
gpii.app.surveyDialog.removeSurveyWindowIPC = function () {
    ipcMain.removeAllListeners("onSurveyCreated");
    ipcMain.removeAllListeners("onSurveyClose");
};

/**
 * A wrapper for the creation of survey dialogs. See the documentation of the
 * `gpii.app.dialogWrapper` grade for more information.
 */
fluid.defaults("gpii.app.survey", {
    gradeNames: "gpii.app.dialogWrapper",

    components: {
        dialog: {
            type: "gpii.app.surveyDialog",
            options: {
                config: {
                    destroyOnClose: true,
                    surveyUrl: "{arguments}.0",
                    closeOnSubmit: "{arguments}.1",
                    attrs: "{arguments}.2"
                }
            }
        }
    },

    invokers: {
        show: {
            funcName: "gpii.app.survey.show",
            args: [
                "{that}",
                "{arguments}.0" // options
            ]
        }
    }
});

/**
 * Responsible for firing the `onDialogCreate` event which in turn creates the
 * wrapped `surveyDialog` component.
 * @param {Component} that - The `gpii.app.survey` instance.
 * @param {Object} options - An object containing the various properties for the
 * `surveyDialog` which is to be created.
 */
gpii.app.survey.show = function (that, options) {
    that.events.onDialogCreate.fire(options.url, options.closeOnSubmit, options.window);
};
