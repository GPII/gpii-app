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

require("./assetsManager.js");
require("./shortcutsManager.js");
require("./ws.js");
require("./factsManager.js");
require("./dialogManager.js");
require("./gpiiConnector.js");
require("./menu.js");
require("./psp.js");
require("./quickSetStrip/qss.js");
require("./settingsBroker.js");
require("./surveys/surveyManager.js");
require("./tray.js");
require("./utils.js");
require("./userErrorsHandler.js");
require("../common/messageBundles.js");
require("../common/utils.js");
require("../common/channelUtils.js");

// enhance the normal require to work with .json5 files
require("json5/lib/register");

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
 * A component to manage the app. When  the PSP application is fully functional,
 * the `onPSPReady` event will be fired.
 */
fluid.defaults("gpii.app", {
    gradeNames: ["fluid.modelComponent", "gpii.app.messageBundles"],
    model: {
        isKeyedIn: false,
        keyedInUserToken: null,
        snapsetName: null,
        preferences: {
            sets: [],
            activeSet: null,
            settingGroups: [],
            closePSPOnBlur: null
        },
        theme: "{that}.options.defaultTheme"
    },
    modelRelay: {
        "isKeyedIn": {
            target: "isKeyedIn",
            singleTransform: {
                type: "fluid.transforms.free",
                func: "gpii.app.getIsKeyedIn",
                args: [
                    "{that}.model.keyedInUserToken",
                    "{that}.options.defaultUserToken"
                ]
            }
        }
    },
    modelListeners: {
        isKeyedIn: {
            funcName: "gpii.app.onIsKeyedInChanged",
            args: ["{that}", "{change}.value"],
            excludeSource: "init"
        },
        keyedInUserToken: {
            func: "console.log",
            args: ["=======keyedInUserToken", "{change}.value"]
        }
    },
    defaultUserToken: "noUser",
    // prerequisites
    members: {
        machineId: "@expand:{that}.installID.getMachineID()"
    },
    components: {
        userErrorHandler: {
            type: "gpii.app.userErrorsHandler",
            options: {
                listeners: {
                    "{flowManager}.userErrors.events.userError": {
                        func: "{that}.handleUserError",
                        args: [
                            "{arguments}.0" // error
                        ]
                    }
                }
            }
        },
        installID: {
            type: "gpii.installID"
        },
        assetsManager: {
            type: "gpii.app.assetsManager"
        },
        factsManager: {
            type: "gpii.app.factsManager"
        },
        settingsBroker: {
            type: "gpii.app.settingsBroker",
            options: {
                model: {
                    isKeyedIn: "{app}.model.isKeyedIn"
                }
            }
        },
        gpiiConnector: {
            type: "gpii.app.gpiiConnector",
            createOnEvent: "onGPIIReady",
            options: {
                listeners: {
                    "onSnapsetNameUpdated.updateSnapsetName": "{app}.updateSnapsetName",
                    "onPreferencesUpdated.updateSets": "{app}.updatePreferences",

                    "{settingsBroker}.events.onSettingApplied": {
                        listener: "{that}.updateSetting",
                        args: ["{arguments}.0"], // setting
                        excludeSource: ["settingsBroker.undo"]
                    }
                },
                events: {
                    onConnected: "{app}.events.onPSPChannelConnected"
                }
            }
        },
        dialogManager: {
            type: "gpii.app.dialogManager",
            createOnEvent: "onPSPPrerequisitesReady",
            options: {
                model: {
                    isKeyedIn: "{app}.model.isKeyedIn"
                },
                modelListeners: {
                    "{lifecycleManager}.model.logonChange": {
                        func: "{that}.toggle",
                        args: ["waitDialog", "{change}.value.inProgress"],
                        excludeSource: "init"
                    }
                }
            }
        },
        surveyManager: {
            type: "gpii.app.surveyManager",
            createOnEvent: "onPSPPrerequisitesReady",
            options: {
                listeners: {
                    onSurveyRequired: {
                        func: "{dialogManager}.show",
                        args: ["survey", "{arguments}.0"]
                    }
                }
            }
        },
        appZoom: {
            type: "gpii.windows.appZoom",
            createOnEvent: "onPSPPrerequisitesReady"
        },
        qssWrapper: {
            type: "gpii.app.resetableQssWrapper",
            createOnEvent: "onPSPPrerequisitesReady",
            options: {
                appTextZoomPath: "appTextZoom",
                model: {
                    isKeyedIn: "{app}.model.isKeyedIn",
                    keyedInUserToken: "{app}.model.keyedInUserToken"
                },
                listeners: {
                    "{gpiiConnector}.events.onSettingUpdated":  "{that}.events.onSettingUpdated",
                    "{settingsBroker}.events.onSettingApplied": "{that}.events.onSettingUpdated",
                    "{gpiiConnector}.events.onPreferencesUpdated": "{that}.events.onPreferencesUpdated"
                },
                modelListeners: {
                    "settings.*": [{
                        // A funny way to decorate the new value with the old value
                        funcName: "fluid.extend",
                        args: [
                            true,
                            "{change}.value",
                            { oldValue: "{change}.oldValue.value" }
                        ],
                        includeSource: ["gpii.app.undoStack.undo", "qss", "qssWidget"]
                    }, {
                        funcName: "gpii.app.onQssSettingAltered",
                        args: [
                            "{settingsBroker}",
                            "{appZoom}",
                            "{change}.value",
                            "{that}.options.appTextZoomPath"
                        ],
                        includeSource: ["gpii.app.undoStack.undo", "qss", "qssWidget"]
                    }]
                }
            }
        },
        psp: {
            type: "gpii.app.pspInApp",
            createOnEvent: "onPSPPrerequisitesReady",
            options: {
                model: {
                    preferences: "{app}.model.preferences",
                    theme: "{app}.model.theme"
                },
                modelListeners: {
                    "{qssWrapper}.qss.model.isShown": {
                        funcName: "gpii.app.pspInApp.onQssToggled",
                        args: ["{that}", "{change}.value"]
                    }
                },
                listeners: {
                    "{qssWrapper}.events.onQssPspOpen": {
                        func: "{that}.show",
                        args: [true]
                    },
                    "{qssWrapper}.events.onQssPspClose": {
                        func: "{that}.handleBlur",
                        args: [true]
                    }
                }
            }
        },
        shortcutsManager: {
            type: "gpii.app.shortcutsManager",
            createOnEvent: "onPSPPrerequisitesReady",
            options: {
                events: {
                    onPspOpenShortcut: null,
                    onQssUndoShortcut: null
                },
                listeners: {
                    "onCreate.registerDefaultGlobalShortcut": {
                        func: "{that}.registerGlobalShortcut",
                        args: [
                            "Shift+CmdOrCtrl+Alt+Super+M",
                            "onPspOpenShortcut"
                        ]
                    },
                    "onCreate.registerDefaultLocalShortcut": {
                        func: "{that}.registerLocalShortcut",
                        args: [
                            "CmdOrCtrl+Z",
                            "onQssUndoShortcut",
                            ["gpii.app.qss", "gpii.app.qssWidget"]
                        ]
                    },

                    "onQssUndoShortcut": {
                        funcName: "{qssWrapper}.undoStack.undo"
                    },
                    "onPspOpenShortcut": {
                        func: "{qssWrapper}.qss.show",
                        args: [
                            {shortcut: true}
                        ]
                    }
                }
            }
        },
        tray: {
            type: "gpii.app.tray",
            createOnEvent: "onPSPPrerequisitesReady",
            options: {
                model: {
                    isKeyedIn: "{gpii.app}.model.isKeyedIn"
                },
                events: {
                    onActivePreferenceSetAltered: "{psp}.events.onActivePreferenceSetAltered"
                },
                listeners: {
                    onTrayIconClicked: {
                        func: "{qssWrapper}.qss.show",
                        args: [
                            {shortcut: false}
                        ]
                    }
                }
            }
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
        onKeyedOut: null,

        onBlur: null
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
            args: ["{arguments}.1"], // new token
            namespace: "onLifeCycleManagerUserKeyedIn"
        },
        "{lifecycleManager}.events.onSessionStop": {
            listener: "gpii.app.handleSessionStop",
            args: ["{that}", "{arguments}.1.model.gpiiKey"]
        },
        "onPSPPrerequisitesReady.notifyPSPReady": {
            this: "{that}.events.onPSPReady",
            method: "fire",
            priority: "last"
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
            args: ["{flowManager}", "{arguments}.0"] // token
        },
        keyOut: {
            funcName: "gpii.app.keyOut",
            args: "{that}.model.keyedInUserToken"
        },
        exit: {
            funcName: "gpii.app.exit",
            args: "{that}"
        }
    },
    defaultTheme: "white"
});

/**
 * Invoked when a QSS setting has been altered by the user either by changing the
 * value directly via the QSS (e.g. for toggle buttons), or by adjusting it using
 * the QSS widget (for "number" and "string" settings).
 * Note that the "App / Text Zoom" setting is different than the rest of the
 * settings. It is not applied by sending a command via the pspChannel but instead
 * the `gpii.windows.appZoom#sendZoom` invoker is called with an "increase" or
 * "decrease" string as a parameter in order to change the zoom level in the last
 * active application.
 * @param {Component} settingsBroker - The `gpii.app.settingsBroker` instance.
 * @param {Object} setting - The setting which has been altered via the QSS or its
 * widget.
 * @param {String} appTextZoomPath - The path of the "App / Text Zoom" setting.
 */
gpii.app.onQssSettingAltered = function (settingsBroker, appZoom, setting, appTextZoomPath) {
    // Special handling of the "App / Text Zoom" setting
    if (setting.path === appTextZoomPath) {
        var direction = setting.value > setting.oldValue ? "increase" : "decrease";
        appZoom.sendZoom(direction);
        return;
    }

    settingsBroker.applySetting(setting);
};

gpii.app.getIsKeyedIn = function (keyedInUserToken, defaultUserToken) {
    return fluid.isValue(keyedInUserToken) && keyedInUserToken !== defaultUserToken;
};

gpii.app.onIsKeyedInChanged = function (that, isKeyedIn) {
    if (isKeyedIn) {
        that.events.onKeyedIn.fire();
    } else {
        that.events.onKeyedOut.fire();
    }
};

gpii.app.pspInApp.onQssToggled = function (psp, isQssShown) {
    if (!isQssShown) {
        psp.hide();
    }
};

gpii.app.fireAppReady = function (fireFn) {
    gpii.app.appReady.then(fireFn);
};

/**
  * Keys into the GPII.
  * Currently uses an url to key in although this should be changed to use Electron IPC.
  * @param {String} token - The token to key in with.
  */
gpii.app.keyIn = function (flowManager, token) {
    request("http://localhost:8081/user/" + token + "/proximityTriggered", function (error, response, body) {

        // Try is needed as the response body has two formats:
        //  - success message - simple string (like message key of the object)
        //  - object - "{isError: Boolean, message: string}"
        try {
            /// XXX temporary way for triggering key in error
            if (typeof body === "string" && JSON.parse(body).isError) {
                flowManager.userErrors.events.userError.fire({
                    isError: true,
                    messageKey: "KeyInFail",
                    originalError: JSON.parse(response.body).message
                });
            }
        }
        // SyntaxError
        // Should be a success
        catch (e) { return; }
    });
};

/**
  * Keys out of the GPII.
  * Currently uses an url to key out although this should be changed to use Electron IPC.
  * @param {String} token - The token to key out with.
  * @return {Promise} A promise that will be resolved/rejected when the request is finished.
  */
gpii.app.keyOut = function (token) {
    var togo = fluid.promise();
    request("http://localhost:8081/user/" + token + "/proximityTriggered", function (error, response, body) {
        //TODO Put in some error logging
        // if (error) {
        //     togo.reject(error);
        //     fluid.log("Key out response:", response);
        //     fluid.log("Key out body:", body);
        // } else {
        //     togo.resolve();
        // }
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
  * @param {Component} that - An instance of gpii.app
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
 * @param {Component} that - An instance of gpii.app
 * @param {String} keyedOutUserToken - The token that was keyed out.
 */
gpii.app.handleSessionStop = function (that, keyedOutUserToken) {
    var currentKeyedInUserToken = that.model.keyedInUserToken;

    if (keyedOutUserToken !== currentKeyedInUserToken) {
        console.log("Warning: The keyed out user token does NOT match the current keyed in user token.");
    } else {
        that.updateKeyedInUserToken(null);
    }
};

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
