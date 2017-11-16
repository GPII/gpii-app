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
var path    = require("path");
var request = require("request");


require("./gpiiConnector.js");
require("./menu.js"); // menuInApp, menuInAppDev
require("./tray.js");
require("./psp.js");
require("./waitDialog.js");

require("./networkCheck.js");


/**
 * Promise that resolves when the electron application is ready.
 * Required for testing multiple configs of the app.
 */
gpii.app.appReady = fluid.promise();

/**
 * Listens for the electron 'ready' event and resolves the promise accordingly.
 */
gpii.app.electronAppListener = function () {
    gpii.app.appReady.resolve(true);
};
require("electron").app.on("ready", gpii.app.electronAppListener);
// Override default behaviour - don't exit process once all windows are closed
require("electron").app.on("window-all-closed", fluid.identity);

/*
 ** Component to manage the app.
 */
fluid.defaults("gpii.app", {
    gradeNames: "fluid.modelComponent",
    model: {
        keyedInUserToken: null,
        snapsetName: null,
        showDialog: false,
        preferences: {
            sets: [],
            activeSet: null
        }
    },
    // prerequisites
    components: {
        psp: {
            type: "gpii.app.psp",
            createOnEvent: "onPrerequisitesReady",
            options: {
                model: {
                    keyedInUserToken: "{app}.model.keyedInUserToken"
                }
            }
        },
        gpiiConnector: {
            type: "gpii.app.gpiiConnector",
            createOnEvent: "onPrerequisitesReady",
            priority: "after:psp",
            options: {
                listeners: {
                    "onPreferencesUpdated.updateSets": "{app}.updatePreferences",
                    "onSnapsetNameUpdated.updateSnapsetName": "{app}.updateSnapsetName"
                }
            }
        },
        /*
         * A helper component used as mediator for handling communication
         * between the PSP and gpiiConnector components.
         */
        pspMediator: {
            type: "fluid.component",
            createOnEvent: "onPrerequisitesReady",
            priority: "after:gpiiConnector",
            options: {
                listeners: {
                    "{psp}.events.onSettingAltered": {
                        listener: "{gpiiConnector}.updateSetting",
                        args: ["{arguments}.0"]
                    },
                    "{psp}.events.onActivePreferenceSetAltered": {
                        listener: "{gpiiConnector}.updateActivePrefSet",
                        args: ["{arguments}.0"]
                    },

                    "{gpiiConnector}.events.onPreferencesUpdated": {
                        listener: "{psp}.notifyPSPWindow",
                        args: ["onPreferencesUpdated", "{arguments}.0"]
                    },
                    "{gpiiConnector}.events.onSettingUpdated": {
                        listener: "{psp}.notifyPSPWindow",
                        args: ["onSettingUpdated", "{arguments}.0"]
                    }
                }
            }
        },
        tray: {
            type: "gpii.app.tray",
            createOnEvent: "onPrerequisitesReady",
            options: {
                model: {
                    keyedInUserToken: "{gpii.app}.model.keyedInUserToken"
                }
            },
            // needed as the psp window is used by the tray
            priority: "after:psp"
        },
        dialog: {
            type: "gpii.app.dialog",
            createOnEvent: "onPrerequisitesReady",
            options: {
                model: {
                    showDialog: "{gpii.app}.model.showDialog"
                }
            }
        },
        networkCheck: { // Network check component to meet GPII-2349
            type: "gpii.app.networkCheck"
        }
    },
    events: {
        onPrerequisitesReady: {
            events: {
                onGPIIReady: "onGPIIReady",
                onAppReady: "onAppReady"
            }
        },
        onGPIIReady: null,
        onAppReady: null
    },
    modelListeners: {
        "{lifecycleManager}.model.logonChange": {
            funcName: "{that}.updateShowDialog",
            args: ["{change}.value.inProgress"]
        }
    },
    listeners: {
        "onCreate.appReady": {
            listener: "gpii.app.fireAppReady",
            args: ["{that}.events.onAppReady.fire"]
        },
        "{kettle.server}.events.onListen": {
            "this": "{that}.events.onGPIIReady",
            method: "fire"
        },
        "{lifecycleManager}.events.onSessionStart": {
            listener: "{that}.updateKeyedInUserToken",
            args: ["{arguments}.1"],
            namespace: "onLifeCycleManagerUserKeyedIn"
        },
        "{lifecycleManager}.events.onSessionStop": {
            listener: "gpii.app.handleSessionStop",
            args: ["{that}", "{arguments}.1.options.userToken"]
        },

        "onDestroy.beforeExit": {
            listener: "{that}.keyOut"
        }
    },
    invokers: {
        updateKeyedInUserToken: {
            changePath: "keyedInUserToken",
            value: "{arguments}.0"
        },
        updateShowDialog: {
            changePath: "showDialog",
            value: "{arguments}.0"
        },
        updatePreferences: {
            changePath: "preferences",
            value: "{arguments}.0"
        },
        updateSnapsetName: {
            changePath: "snapsetName",
            value: "{arguments}.0"
        },
        keyIn: {
            funcName: "gpii.app.keyIn",
            args: ["{arguments}.0"]
        },
        keyOut: {
            funcName: "gpii.app.keyOut",
            args: "{that}.model.keyedInUserToken"
        },
        exit: {
            funcName: "gpii.app.exit",
            args: "{that}"
        },
        "handleUncaughtException": {
            funcName: "gpii.app.handleUncaughtException",
            args: ["{that}", "{arguments}.0"]
        }
    },
    distributeOptions: {
        target: "{flowManager requests stateChangeHandler}.options.listeners.onError",
        record: "gpii.app.onKeyInError"
    }
});

/**
 * A function which is called whenever an error occurs while keying in. Note that a real error
 * would have its `isError` property set to true.
 * @param error {Object} The error which has occurred.
 */
gpii.app.onKeyInError = function (error) {
    if (error.isError) {
        fluid.onUncaughtException.fire({
            code: "EKEYINFAIL"
        });
    }
};

gpii.app.fireAppReady = function (fireFn) {
    gpii.app.appReady.then(fireFn);
};

/**
  * Keys into the GPII.
  * Currently uses an url to key in although this should be changed to use Electron IPC.
  * @param token {String} The token to key in with.
  */
gpii.app.keyIn = function (token) {
    request("http://localhost:8081/user/" + token + "/login", function (/* error, response */) {
        // empty
    });
};

/**
  * Keys out of the GPII.
  * Currently uses an url to key out although this should be changed to use Electron IPC.
  * @param token {String} The token to key out with.
  * @return {Promise} A promise that will be resolved/rejected when the request is finished.
  */
gpii.app.keyOut = function (token) {
    var togo = fluid.promise();
    request("http://localhost:8081/user/" + token + "/logout", function (error, response, body) {
        //TODO Put in some error logging
        if (error) {
            togo.reject(error);
            fluid.log(response);
            fluid.log(body);
        } else {
            togo.resolve();
        }
    });
    return togo;
};

/**
  * Stops the Electron Application.
  * @return {Promise} An already resolved promise.
  */
gpii.app.performQuit = function () {
    var app = require("electron").app;
    var togo = fluid.promise();

    gpii.stop();
    app.quit();

    togo.resolve();
    return togo;
};

/**
  * Handles the exit of the Electron Application.
  * @param that {Component} An instance of gpii.app
  */
gpii.app.exit = function (that) {
    if (that.model.keyedInUserToken) {
        fluid.promise.sequence([
            gpii.rejectToLog(that.keyOut(), "Couldn't logout current user"),
            gpii.app.performQuit
        ]);
    } else {
        gpii.app.performQuit();
    }
};

/**
 * Handles when a user token is keyed out through other means besides the task tray key out feature.
 * @param that {Component} An instance of gpii.app
 * @param keyedOutUserToken {String} The token that was keyed out.
 */
gpii.app.handleSessionStop = function (that, keyedOutUserToken) {
    var currentKeyedInUserToken = that.model.keyedInUserToken;

    if (keyedOutUserToken !== currentKeyedInUserToken) {
        console.log("Warning: The keyed out user token does NOT match the current keyed in user token.");
    } else {
        that.updateKeyedInUserToken(null);
    }
};

/**
 * Listen on uncaught exceptions and display it to the user is if it's interesting.
 * @param that {Component} An instance of gpii.app.
 */
gpii.app.handleUncaughtException = function (that, err) {
    var tray = that.tray.tray;
    var handledErrors = {
        "EADDRINUSE": {
            message: "There is another application listening on port " + err.port,
            fatal: true
        },
        "EKEYINFAIL": {
            message: "Unable to key in. Please try again.",
            fatal: false
        }
    };

    // Update the showDialog model in order for the dialog to show for the
    // next user who tries to key in.
    that.updateShowDialog(false);
    // Immediately hide the loading dialog.
    that.dialog.dialog.hide();

    if (err.code) {
        var error = handledErrors[err.code];
        if (error) {
            tray.displayBalloon({
                title: error.title || "GPII Error",
                content: error.message || err.message,
                icon: path.join(__dirname, "../icons/gpii-icon-balloon.png")
            });
            if (error.fatal) {
                var timeout;
                var quit = function () {
                    if (timeout) {
                        clearTimeout(timeout);
                        timeout = null;
                        that.exit();
                    }
                };
                // Exit when the balloon is dismissed.
                tray.on("balloon-closed", quit);
                tray.on("balloon-click", quit);
                // Also terminate after a timeout - sometimes the balloon doesn't show, or the event doesn't fire.
                // TODO: See GPII-2348 about this.
                timeout = setTimeout(quit, 12000);
            }
        }
    }
};

fluid.onUncaughtException.addListener(function (err) {
    var app = fluid.queryIoCSelector(fluid.rootComponent, "gpii.app");
    if (app.length > 0) {
        app[0].handleUncaughtException(err);
    }
}, "gpii.app", "last");


// A wrapper that wraps gpii.app as a subcomponent. This is the grade need by configs/app.json
// to distribute gpii.app as a subcomponent of GPII flow manager since infusion doesn't support
// broadcasting directly to "components" block which probably would destroy GPII.

fluid.defaults("gpii.appWrapper", {
    gradeNames: ["fluid.component"],
    components: {
        app: {
            type: "gpii.app"
        }
    }
});
