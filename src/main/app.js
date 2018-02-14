/**
 * The PSP Main component
 *
 * A component that represents the whole PSP. It wraps all of the PSP's functionality and also provides information on whether there's someone keyIn or not.
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
var request = require("request");

require("./ws.js");
require("./factsManager.js");
require("./dialogManager.js");
require("./gpiiConnector.js");
require("./menu.js");
require("./psp.js");
require("./restartDialog.js");
require("./errorDialog.js");
require("./settingsBroker.js");
require("./surveys/surveyManager.js");
require("./tray.js");
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

/**
 * A component to manage the app. Each subcomponent of the app (except for the first
 * one) has a specified priority of creation. This is needed to ensure that every
 * component is created no sooner than all the components it depends on. Furthermore,
 * the `pspReady` subcomponent must be created last because its only purpose is to
 * send the `onPSPReady` event which indicates that the PSP application is fully
 * functional. This is useful especially when writing integration tests.
 */
fluid.defaults("gpii.app", {
    gradeNames: "fluid.modelComponent",
    model: {
        keyedInUserToken: null,
        snapsetName: null,
        preferences: {
            sets: [],
            activeSet: null
        }
    },
    errorsDescriptionMap: {
        "EADDRINUSE": {
            title:   "GPII can't start",
            subhead: "There is another application listening on port the same port",
            details: "Stop the other running application and try again. If the problem is still present, contact GPII Technical Support.",
            fatal: true
        },
        "EKEYINFAIL": {
            title:   "Cannot Key In",
            subhead: "There might be a problem with the user you are trying to use",
            details: "You can try keying in again. If the problem is still present, contact GPII Technical Support.",
            btnLabel1: "Ok",
            btnLabel2: "Cancel",
            btnLabel3: "Oh Nooooo",
            fatal: false
        }
    },
    // prerequisites
    members: {
        machineId: "@expand:{that}.installID.getMachineID()"
    },
    components: {
        installID: {
            type: "gpii.installID"
        },
        factsManager: {
            type: "gpii.app.factsManager"
        },
        surveyManager: {
            type: "gpii.app.surveyManager"
        },
        dialogManager: {
            type: "gpii.app.dialogManager",
            createOnEvent: "onPSPPrerequisitesReady",
            options: {
                model: {
                    keyedInUserToken: "{app}.model.keyedInUserToken"
                },
                listeners: {
                    "{surveyManager}.events.onSurveyRequired": {
                        func: "{that}.show",
                        args: ["survey", "{arguments}.0"] // the raw payload
                    }
                }
            }
        },
        gpiiConnector: {
            type: "gpii.app.gpiiConnector",
            createOnEvent: "onGPIIReady",
            priority: "after:dialogManager",
            options: {
                listeners: {
                    "onPreferencesUpdated.updateSets": "{app}.updatePreferences",
                    "onSnapsetNameUpdated.updateSnapsetName": "{app}.updateSnapsetName"
                },
                events: {
                    onConnected: "{app}.events.onPSPChannelConnected"
                }
            }
        },
        psp: {
            type: "gpii.app.psp",
            createOnEvent: "onPSPPrerequisitesReady",
            priority: "after:gpiiConnector",
            options: {
                model: {
                    keyedInUserToken: "{app}.model.keyedInUserToken"
                }
            }
        },
        waitDialog: {
            type: "gpii.app.waitDialog",
            createOnEvent: "onPSPPrerequisitesReady",
            priority: "after:psp",
            options: {
                modelListeners: {
                    "{lifecycleManager}.model.logonChange": {
                        changePath: "{that}.model.isShown",
                        value: "{change}.value.inProgress"
                    }
                }
            }
        },
        restartDialog: {
            type: "gpii.app.dialog.restartDialog",
            createOnEvent: "onPSPPrerequisitesReady",
            priority: "after:waitDialog"
        },
        settingsBroker: {
            type: "gpii.app.settingsBroker",
            createOnEvent: "onPSPPrerequisitesReady",
            priority: "after:restartDialog",
            options: {
                model: {
                    keyedInUserToken: "{app}.model.keyedInUserToken"
                },
                listeners: {
                    "{psp}.events.onSettingAltered": {
                        listener: "{that}.enqueue"
                    },
                    "{psp}.events.onActivePreferenceSetAltered": {
                        listener: "{that}.clearPendingChanges"
                    }
                }
            }
        },
        tray: {
            type: "gpii.app.tray",
            createOnEvent: "onPSPPrerequisitesReady",
            priority: "after:settingsBroker",
            options: {
                model: {
                    keyedInUserToken: "{gpii.app}.model.keyedInUserToken",
                    pendingChanges: "{settingsBroker}.model.pendingChanges"
                }
            }
        },
        /*
         * A helper component used as mediator for handling communication
         * between the PSP and gpiiConnector components.
         */
        channelMediator: {
            type: "fluid.component",
            createOnEvent: "onPSPPrerequisitesReady",
            priority: "after:tray",
            options: {
                listeners: {
                    "{settingsBroker}.events.onSettingApplied": [{
                        listener: "{gpiiConnector}.updateSetting",
                        args: ["{arguments}.0"], // setting
                        excludeSource: ["settingsBroker.undo"]
                    }, {
                        listener: "{psp}.notifyPSPWindow",
                        args: [
                            "onSettingUpdated",
                            "{arguments}.0" // message
                        ]
                    }],

                    "{psp}.events.onActivePreferenceSetAltered": {
                        listener: "{gpiiConnector}.updateActivePrefSet",
                        args: ["{arguments}.0"] // newPrefSet
                    },

                    "{gpiiConnector}.events.onPreferencesUpdated": {
                        listener: "{psp}.notifyPSPWindow",
                        args: [
                            "onPreferencesUpdated",
                            "{arguments}.0" // message
                        ]
                    },
                    "{gpiiConnector}.events.onSettingUpdated": {
                        listener: "{psp}.notifyPSPWindow",
                        args: [
                            "onSettingUpdated",
                            "{arguments}.0" // message
                        ]
                    }
                }
            }
        },
        /**
         * Responsible for toggling the "need restart" warnings both
         * in the psp or as a dialog.
         */
        restartWarningController: {
            type: "fluid.modelComponent",
            createOnEvent: "onPSPPrerequisitesReady",
            priority: "after:channelMediator",
            options: {
                model: {
                    isPspShown: "{psp}.model.isShown"
                },
                modelListeners: {
                    // Hide restart dialog whenever PSP is shown
                    "isPspShown": {
                        func: "{that}.hideRestartDialogIfNeeded",
                        args: "{change}.value"
                    }
                },

                listeners: {
                    "{psp}.events.onClosed": {
                        // show if possible
                        func: "{restartDialog}.showIfNeeded",
                        args: [
                            "{settingsBroker}.model.pendingChanges"
                        ]
                    },
                    "{psp}.events.onRestartNow": [{
                        changePath: "{restartDialog}.model.isShown",
                        args: false
                    }, {
                        listener: "{settingsBroker}.applyPendingChanges"
                    }],
                    "{psp}.events.onUndoChanges": [{
                        changePath: "{restartDialog}.model.isShown",
                        args: false
                    }, {
                        listener: "{settingsBroker}.undoPendingChanges"
                    }],
                    "{psp}.events.onRestartLater": {
                        changePath: "{restartDialog}.model.isShown",
                        args: false
                    },

                    "{restartDialog}.events.onClosed": {
                        changePath: "{restartDialog}.model.isShown",
                        args: false
                    },

                    // Handle setting interactions (undo, restart now, settings interaction)
                    "{settingsBroker}.events.onRestartRequired" : [{
                        func: "{that}.hideRestartDialogIfNeeded",
                        args: [
                            "{that}.model.isPspShown",
                            "{arguments}.0" // pendingChanges
                        ]
                    },{
                        func: "{that}.togglePspRestartWarning",
                        args: ["{arguments}.0"] // pendingChanges
                    }]
                },

                invokers: {
                    hideRestartDialogIfNeeded: {
                        funcName: "gpii.app.hideRestartDialogIfNeeded",
                        args: [
                            "{restartDialog}",
                            "{arguments}.0", // isPspShown
                            "{arguments}.1"  // pendingChanges
                        ]
                    },
                    togglePspRestartWarning: {
                        funcName: "gpii.app.togglePspRestartWarning",
                        args: [
                            "{psp}",
                            "{arguments}.0" // pendingChanges
                        ]
                    }
                }
            }
        },
        // This subcomponent must be the last one created.
        pspReady: {
            type: "fluid.component",
            createOnEvent: "onPSPPrerequisitesReady",
            priority: "after:channelMediator",
            options: {
                listeners: {
                    onCreate: "{app}.events.onPSPReady.fire"
                }
            }
        },
        errorDialog: {
            type: "gpii.app.errorDialog",
            createOnEvent: "onPSPPrerequisitesReady"
        }
    },
    events: {
        onPSPPrerequisitesReady: {
            events: {
                onGPIIReady: "onGPIIReady",
                onAppReady: "onAppReady",
                onPSPChannelConnected: "onPSPChannelConnected"
            }
        },
        onGPIIReady: null,
        onAppReady: null,
        onPSPChannelConnected: null,
        onPSPReady: null,

        onKeyedIn: null,
        onKeyedOut: null
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
        "{lifecycleManager}.events.onSessionStart": [{
            listener: "{that}.updateKeyedInUserToken",
            args: ["{arguments}.1"], // new token
            namespace: "onLifeCycleManagerUserKeyedIn"
        }, {
            listener: "{that}.events.onKeyedIn.fire",
            namespace: "notifyUserKeyedIn"
        }],
        "{lifecycleManager}.events.onSessionStop": [{
            listener: "gpii.app.handleSessionStop",
            args: ["{that}", "{arguments}.1.options.userToken"]
        }, {
            listener: "{that}.events.onKeyedOut.fire",
            namespace: "notifyUserKeyedOut"
        }],

        "onDestroy.beforeExit": {
            listener: "{that}.keyOut"
        }
    },
    invokers: {
        updateKeyedInUserToken: {
            changePath: "keyedInUserToken",
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
            args: ["{arguments}.0"] // token
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
            args: [
                "{that}",
                "{that}.options.errorsDescriptionMap",
                "{arguments}.0" // error
            ]
        }
    },
    distributeOptions: {
        target: "{flowManager requests stateChangeHandler}.options.listeners.onError",
        record: "gpii.app.onKeyInError"
    }
});

/**
 * Either hides or shows the warning in the PSP.
 *
 * @param psp {Component} The `gpii.app.psp` component
 * @param pendingChanges {Object[]} A list of the current state of pending changes
 */
gpii.app.togglePspRestartWarning = function (psp, pendingChanges) {

    if (pendingChanges.length === 0) {
        psp.hideRestartWarning();
    } else {
        psp.showRestartWarning(pendingChanges);
    }
};

/**
 * Closes "Restart Dialog" in one of the following cases:
 * - the PSP is being shown;
 * - there are no pending changes any more
 *
 * @param restartDialog {Component} The `gpii.app.restartDialog` component
 * @param isPspShown {Boolean} Whether the psp window is shown
 * @param pendingChanges {Object[]} A list of the current state of pending changes
 */
gpii.app.hideRestartDialogIfNeeded = function (restartDialog, isPspShown, pendingChanges) {
    if (isPspShown || (pendingChanges && pendingChanges.length === 0)) {
        // ensure the dialog is hidden
        // NOTE: this may have no effect in case the dialog is already hidden
        restartDialog.applier.change("isShown", false);
    }
};

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
 * @param errorsDescription {Object} Map with more detailed description for the errors.
 */
gpii.app.handleUncaughtException = function (that, errorsDescription, err) {
    var errCode = err && err.code;
    var errDetails = errorsDescription[errCode] || {};

    // Restore the state of the wait dialog
    that.waitDialog.applier.change("isShown", false);


    that.errorDialog.show({
        title:     errDetails.title,
        subhead:   errDetails.subhead,
        details:   errDetails.details,

        btnLabel1: errDetails.btnLabel1,
        btnLabel2: errDetails.btnLabel2,
        btnLabel3: errDetails.btnLabel3,

        errCode:   errCode
    });

    if (errDetails.fatal) {
        that.errorDialog.applier.modelChanged.addListener("isShown", that.exit);
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
