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

require("../shared/channelUtils.js");
require("../shared/messageBundles.js");
require("../shared/utils.js");
require("./assetsManager.js");
require("./common/utils.js");
require("./common/ws.js");
require("./dialogs/dialogManager.js");
require("./dialogs/psp.js");
require("./storage.js");
require("./factsManager.js");
require("./gpiiConnector.js");
require("./menu.js");
require("./qss.js");
require("./settingsBroker.js");
require("./shortcutsManager.js");
require("./siteConfigurationHandler.js");
require("./surveys/surveyManager.js");
require("./tray.js");
require("./userErrorsHandler.js");
require("./metrics.js");

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
            gpiiKey: null,
            sets: [],
            activeSet: null,
            settingGroups: [],

            // user settings
            closePspOnBlur: null,
            closeQssOnBlur: null,
            disableRestartWarning: null
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
        }
    },
    defaultUserToken: "noUser",
    // prerequisites
    members: {
        machineId: "@expand:{that}.installID.getMachineID()"
    },
    components: {
        configurationHandler: {
            type: "gpii.app.siteConfigurationHandler"
        },
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
        settingsBroker: {
            type: "gpii.app.settingsBroker",
            options: {
                model: {
                    isKeyedIn: "{app}.model.isKeyedIn"
                }
            }
        },
        storage: {
            type: "gpii.app.storage"
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
        /*
         * Handles the App Zoom settings as it is processed by a separate
         * mechanism (meaning that it doesn't uses the normal setting change
         * approach through the PspChannel).
         */
        appZoomHandler: {
            type: "gpii.windows.appZoom",
            createOnEvent: "onPSPPrerequisitesReady"
        },
        systemLanguageListener: {
            type: "gpii.windows.language",
            options: {
                model: {
                    configuredLanguage: "{messageBundles}.model.locale"
                },
                modelListeners: {
                    configuredLanguage: {
                        funcName: "fluid.log",
                        args: ["Language change: ", "{change}.value"]
                    }
                }
            }
        },
        qssWrapper: {
            type: "gpii.app.qssWrapper",
            createOnEvent: "onPSPPrerequisitesReady",
            options: {
                appTextZoomPath: "appTextZoom",
                model: {
                    lastEnvironmentalLoginGpiiKey : "{lifecycleManager}.model.lastEnvironmentalLoginGpiiKey",
                    isKeyedIn: "{app}.model.isKeyedIn",
                    keyedInUserToken: "{app}.model.keyedInUserToken",

                    closeQssOnBlur: "{app}.model.preferences.closeQssOnBlur",
                    disableRestartWarning: "{app}.model.preferences.disableRestartWarning"
                },
                listeners: {
                    "{gpiiConnector}.events.onQssSettingsUpdate": {
                        funcName: "{that}.updateSettings"
                    },
                    // local sync with PSP
                    "{settingsBroker}.events.onSettingApplied": "{that}.events.onSettingUpdated"
                },
                modelListeners: {
                    "{systemLanguageListener}.model.installedLanguages": {
                        funcName: "{that}.updateLanguageSettingOptions"
                    },
                    "settings.*": {
                        funcName: "gpii.app.onQssSettingAltered",
                        args: [
                            "{settingsBroker}",
                            "{appZoomHandler}",
                            "{change}.value",
                            "{change}.oldValue",
                            "{that}.options.appTextZoomPath"
                        ],
                        includeSource: ["gpii.app.undoStack.undo", "qss", "qssWidget"]
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
        psp: {
            type: "gpii.app.pspInApp",
            createOnEvent: "onPSPPrerequisitesReady"
        },
        shortcutsManager: {
            type: "gpii.app.shortcutsManager",
            createOnEvent: "onPSPPrerequisitesReady",
            options: {
                shortcutAccelerators: {
                    qssUndo: "CmdOrCtrl+Z",
                    closeQssTooltip: "Esc"
                },
                events: {
                    onQssOpenShortcut: null,
                    onQssUndoShortcut: null,
                    onCloseQssTooltipShortcut: null
                },
                modelListeners: {
                    "{app}.model.preferences.gpiiAppShortcut": {
                        funcName: "gpii.app.changeGpiiAppShortcut",
                        args: [
                            "{that}",
                            "{change}.value",
                            "{change}.oldValue",
                            "onQssOpenShortcut"
                        ]
                    }
                },
                listeners: {
                    "onCreate.registerQssUndoShortcut": {
                        func: "{that}.registerLocalShortcut",
                        args: [
                            "{that}.options.shortcutAccelerators.qssUndo",
                            "onQssUndoShortcut",
                            ["gpii.app.qss", "gpii.app.qssWidget"]
                        ]
                    },
                    /*
                     * A local shortcut (registered for the QSS, QSS widget and PSP) isn't fully sufficient for handling
                     * the closing of the tooltip as but it's the best sane that can be done. For example,
                     * in case the QSS loses focus and neither of the related windows (PSP and qssWidget)
                     * is focused the tooltip will be hidden but hovering
                     * a button afterwards will show the tooltip again. In that case the tooltip won't be
                     * closable with "Esc" because we're using only a local shortcut.
                     * We're doing so because registering a global shortcut would "swallow" the "Esc" event, meaning
                     * that the "Escape" key won't work with other applications.
                     */
                    "onCreate.registerQssTooltipCloseShortcut": {
                        func: "{that}.registerLocalShortcut",
                        args: [
                            "{that}.options.shortcutAccelerators.closeQssTooltip",
                            "onCloseQssTooltipShortcut",
                            ["gpii.app.qss", "gpii.app.qssWidget", "gpii.app.psp"]
                        ]
                    },

                    onCloseQssTooltipShortcut: {
                        funcName: "{qssWrapper}.qssTooltip.hide"
                    },

                    "onQssUndoShortcut": {
                        funcName: "{qssWrapper}.undoStack.undo"
                    },
                    "onQssOpenShortcut": {
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
                        func: "{qssWrapper}.qss.toggle"
                    }
                }
            }
        },
        factsManager: {
            type: "gpii.app.factsManager",
            createOnEvent: "onPSPPrerequisitesReady",
            options: {
                model: {
                    interactionsCount: "{storage}.model.interactionsCount"
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

        "onCreate.systemShutdown": "{gpii.windows.messages}.start({that})",
        "onDestroy.systemShutdown": "{gpii.windows.messages}.stop({that})",
        "{gpii.windows.messages}.events.onMessage": {
            funcName: "gpii.app.windowMessage",
            // that, hwnd, msg, wParam, lParam, result
            args: [ "{that}", "{arguments}.0", "{arguments}.1", "{arguments}.2", "{arguments}.3", "{arguments}.4" ]
        },

        "onPSPPrerequisitesReady.notifyPSPReady": {
            this: "{that}.events.onPSPReady",
            method: "fire",
            priority: "last"
        }

        // Disabled per: https://github.com/GPII/gpii-app/pull/100#issuecomment-471778768
        //"{lifecycleManager}.events.onDestroy": {
        //    listener: "{that}.keyOut",
        //    priority: "first",
        //    namespace: "beforeExit"
        //}
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
            args: ["{lifecycleManager}", "{arguments}.0"] // token
        },
        keyOut: {
            funcName: "gpii.app.keyOut",
            args: ["{lifecycleManager}", "{that}.model.keyedInUserToken"]
        },
        resetAllToStandard: {
            funcName: "gpii.app.resetAllToStandard",
            args: ["{that}", "{psp}", "{qssWrapper}.qss"]
        },
        reApplyPreferences: {
            funcName: "gpii.app.reApplyPreferences",
            args: ["{lifecycleManager}"]
        },
        exit: {
            funcName: "gpii.app.exit",
            args: "{that}"
        }
    },
    defaultTheme: "white"
});

/**
 * Changes the keyboard shortcut for opening the GPII app. The previously registered
 * shortcut for this action (if any) is removed.
 * @param {Component} shortcutsManager - The `gpii.app.shortcutsManager` instance.
 * @param {String} shortcut - The new shortcut for opening the GPII app given as an
 * accelerator string (https://electronjs.org/docs/api/accelerator).
 * @param {String} oldShortcut - The previously used shortcut for opening the GPII
 * app given as an accelerator string.
 * @param {String} eventName - The name of the event which should be triggered when
 * the new GPII app opening shortcut is activated.
 */
gpii.app.changeGpiiAppShortcut = function (shortcutsManager, shortcut, oldShortcut, eventName) {
    if (oldShortcut) {
        shortcutsManager.deregisterGlobalShortcut(oldShortcut);
    }

    if (shortcut) {
        shortcutsManager.registerGlobalShortcut(shortcut, eventName);
    }
};

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
 * @param {Component} appZoom - The `gpii.windows.appZoom` instance.
 * @param {Object} setting - The setting which has been altered via the QSS or its
 * widget.
 * @param {Object} oldValue - The previous value of the altered setting.
 * @param {String} appTextZoomPath - The path of the "App / Text Zoom" setting.
 */
gpii.app.onQssSettingAltered = function (settingsBroker, appZoom, setting, oldValue, appTextZoomPath) {
    // Adds the previous value to the setting in order to enable reverting back to
    // it when needed.
    fluid.extend(true, setting, {
        oldValue: oldValue.value
    });

    // Special handling of the "App / Text Zoom" setting
    if (setting.path === appTextZoomPath) {
        var direction = setting.value > setting.oldValue ? "increase" : "decrease";
        appZoom.sendZoom(direction);
    } else {
        settingsBroker.applySetting(setting);
    }
};

/**
 * Returns whether there is an actual keyed in user, i.e. if the user token is
 * defined and is different from the token of the default (the so-called "no man")
 * user.
 * @param {String} keyedInUserToken - The user token of the currently keyed in user.
 * @param {String} defaultUserToken - The user token of the default user.
 * @return {Boolean} `true` if there is an actual keyed in user and `false` otherwise.
 */
gpii.app.getIsKeyedIn = function (keyedInUserToken, defaultUserToken) {
    return fluid.isValue(keyedInUserToken) && keyedInUserToken !== defaultUserToken && keyedInUserToken !== "restore";
};

/**
 * Fires the appropriate event based on whether there is an actual keyed in user or not.
 * @param {Component} that - The `gpii.app` instance.
 * @param {Boolean} isKeyedIn - whether there is an actual keyed in user or not.
 */
gpii.app.onIsKeyedInChanged = function (that, isKeyedIn) {
    if (isKeyedIn) {
        that.events.onKeyedIn.fire();
    } else {
        that.events.onKeyedOut.fire();
    }
};

/**
 * Invokes the passed function when the `gpii.app` component is created.
 * @param {Function} fireFn - The function to be invoked.
 */
gpii.app.fireAppReady = function (fireFn) {
    gpii.app.appReady.then(fireFn);
};

/**
  * Keys a user into the GPII.
  * @param {Component} lifecycleManager - The `gpii.lifecycleManager` instance.
  * @param {String} token - The token to key in with.
  * @return {Promise} A promise that will be resolved/rejected when the request is finished.
  */
gpii.app.keyIn = function (lifecycleManager, token) {
    return lifecycleManager.performLogin(token);
};

/**
  * Keys out of the GPII.
  * @param {Component} lifecycleManager - The `gpii.lifecycleManager` instance.
  * @param {String} token - The token to key out with.
  * @return {Promise} A promise that will be resolved/rejected when the request is finished.
  */
gpii.app.keyOut = function (lifecycleManager, token) {
    return lifecycleManager.performLogout(token);
};

/**
  * Re-apply the last environmental login.
  * @param {Component} lifecycleManager - The `gpii.lifecycleManager` instance.
  * @return {Promise} A promise that will be resolved/rejected when the request is finished.
  */
gpii.app.reApplyPreferences = function (lifecycleManager) {
    return lifecycleManager.replayEnvironmentalLogin();
};

/**
 * Performs a reset of all settings to their standard values. It also closes
 * the QSS in case it is open.
 * @param {Component} that - The `gpii.app` instance.
 * @param {Component} psp - The `gpii.app.psp` instance.
 * @param {Component} qss - The `gpii.app.qss` instance.
 * @return {Promise} A promise that will be resolved or rejected when the reset
 * all operation completes.
 */
gpii.app.resetAllToStandard = function (that, psp, qss) {
    psp.hide();
    qss.hide();
    return that.keyIn("reset");
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
        fluid.log("Warning: The keyed out user token does NOT match the current keyed in user token.");
    } else {
        that.updateKeyedInUserToken(null);
    }
};

/**
 * Handles the onMessage event of the gpii.windows.messages component.
 *
 * @param {Component} that An instance of gpii.app
 * @param {Number} hwnd Window handle.
 * @param {Number} msg The message.
 * @param {Number} wParam Message parameter.
 * @param {Number} lParam Message parameter.
 * @param {Object} result Set a 'value' field to specify a return value.
 */
gpii.app.windowMessage = function (that, hwnd, msg, wParam, lParam, result) {
    // https://msdn.microsoft.com/library/aa376889
    var WM_QUERYENDSESSION = 0x11;
    if (msg === WM_QUERYENDSESSION) {
        fluid.log(fluid.logLevel.FATAL, "System shutdown detected.");
        that.exit();
        result.value = 0;
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
