/**
 * PSP BrowserWindow dialog
 *
 * Introduces a component that manages the PSP's Electron BrowserWindow (the panel itself).
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

var fluid    = require("infusion");
var electron = require("electron");

var ipcMain           = electron.ipcMain,
    systemPreferences = electron.systemPreferences;
var gpii              = fluid.registerNamespace("gpii");

require("../common/utils.js");

require("./basic/dialog.js");
require("./basic/blurrable.js");
require("./basic/resizable.js");
require("./basic/offScreenHidable.js");


/**
 * Configuration for using the `gpii.app.psp` component in the App (the `gpii.app` component).
 * Note that this is an incomplete grade which references the App and other App related
 * components (subcomponents).
 */
fluid.defaults("gpii.app.pspInApp", {
    gradeNames: "gpii.app.psp",
    model: {
        isKeyedIn: "{app}.model.isKeyedIn",

        preferences: "{app}.model.preferences",
        theme: "{app}.model.theme"
    },
    events: {
        onActivePreferenceSetAltered: "{qssWrapper}.events.onActivePreferenceSetAltered"
    },
    modelListeners: {
        isKeyedIn: {
            func: "{that}.notifyPSPWindow",
            args: [
                "onIsKeyedInUpdated",
                "{change}.value"
            ],
            excludeSource: "init"
        }
    },

    listeners: {
        "{qssWrapper}.qss.events.onDialogShown": {
            func: "{that}.hide"
        },

        "{qssWrapper}.events.onQssPspToggled": {
            func: "{that}.toggle"
        },
        "{qssWrapper}.events.onQssPspClose": {
            func: "{that}.handleBlur",
            args: [true]
        },

        "onActivePreferenceSetAltered.notifyChannel": {
            listener: "{gpiiConnector}.updateActivePrefSet",
            args: ["{arguments}.0"] // newPrefSet
        },

        "{gpiiConnector}.events.onPreferencesUpdated": {
            listener: "{that}.notifyPSPWindow",
            args: [
                "onPreferencesUpdated",
                "{arguments}.0" // message
            ]
        },

        // link setting update events
        "{gpiiConnector}.events.onSettingUpdated":  "{that}.events.onSettingUpdated.fire",
        "{settingsBroker}.events.onSettingApplied": "{that}.events.onSettingUpdated.fire",

        onSettingUpdated: {
            listener: "{that}.notifyPSPWindow",
            args: [
                "onSettingUpdated",
                "{arguments}.0" // message
            ]
        },

        onSettingAltered: {
            listener: "{settingsBroker}.enqueue"
        },

        onRestartNow: [{
            listener: "{settingsBroker}.applyPendingChanges"
        }, {
            func: "{that}.events.onClosed.fire"
        }],

        onUndoChanges: {
            listener: "{settingsBroker}.undoPendingChanges"
        },

        onActivePreferenceSetAltered: {
            listener: "{settingsBroker}.reset"
        },

        "{settingsBroker}.events.onRestartRequired": {
            funcName: "gpii.app.pspInApp.togglePspRestartWarning",
            args: [
                "{that}",
                "{arguments}.0" // pendingChanges
            ]
        }
    }
});


/**
 * Either hides or shows the restart warning in the PSP.
 * @param {Component} psp - The `gpii.app.psp` component
 * @param {Object[]} pendingChanges - A list of the current state of pending changes
 */
gpii.app.pspInApp.togglePspRestartWarning = function (psp, pendingChanges) {
    if (pendingChanges.length === 0) {
        psp.hideRestartWarning();
    } else {
        psp.showRestartWarning(pendingChanges);
    }
};

/**
 * Handles logic for the PSP window.
 * Creates an Electron `BrowserWindow` and manages it.
 */
fluid.defaults("gpii.app.psp", {
    gradeNames: [
        "gpii.app.dialog",
        "gpii.app.blurrable",
        "gpii.app.dialog.offScreenHidable"
    ],

    siteConfig: {
        scaleFactor: 1,
        urls: {
            help: "http://pmt.gpii.org/help"
        }
    },

    model:  {
        isKeyedIn: false,
        theme: null,
        preferences: {},
        scaleFactor: "{that}.options.siteConfig.scaleFactor"
    },

    modelRelay: {
        hasSettings: {
            target: "hasSettings",
            singleTransform: {
                type: "fluid.transforms.free",
                func: "gpii.app.settingGroups.hasSettings",
                args: ["{that}.model.preferences.settingGroups"]
            }
        }
    },

    /*
     * Raw options to be passed to the Electron `BrowserWindow` that is created.
     */
    config: {
        destroyOnClose: false,

        restrictions: {
            minHeight: 600
        },

        attrs: {
            width: 450,
            height: 600
        },

        fileSuffixPath: "psp/index.html",

        params: {
            theme: "{that}.model.theme",
            sounds: {
                keyedIn: {
                    expander: {
                        funcName: "{assetsManager}.resolveAssetPath",
                        args: ["{that}.options.sounds.keyedIn"]
                    }
                },
                activeSetChanged: {
                    expander: {
                        funcName: "{assetsManager}.resolveAssetPath",
                        args: ["{that}.options.sounds.activeSetChanged"]
                    }
                }
            },
            urls: "{that}.options.siteConfig.urls"
        }
    },

    linkedWindowsGrades: ["gpii.app.qss", "gpii.app.qssWidget", "gpii.app.qssNotification", "gpii.app.qssMorePanel", "gpii.app.psp"],

    sounds: {
        keyedIn: "keyedIn.mp3",
        activeSetChanged: "activeSetChanged.mp3"
    },

    events: {
        onSettingUpdated: null,

        onSettingAltered: null,
        onActivePreferenceSetAltered: null,

        onRestartNow: null,
        onUndoChanges: null,

        onClosed: null,

        onContentHeightChanged: null,

        onSignInRequested: null
    },
    listeners: {
        "onCreate.initPSPWindowIPC": {
            listener: "gpii.app.initPSPWindowIPC",
            args: ["{app}", "{that}", "{gpiiConnector}"]
        },
        "onCreate.registerAccentColorListener": {
            listener: "gpii.app.psp.registerAccentColorListener",
            args: ["{that}"]
        },

        "onDestroy.cleanupElectron": {
            "this": "{that}.dialog",
            method: "destroy"
        },

        "onClosed.closePsp": {
            funcName: "gpii.app.psp.closePSP",
            args: ["{psp}", "{settingsBroker}"]
        },
        "onClosed.giveFocusToQss": {
            funcName: "gpii.app.psp.giveFocusToQss",
            args: [
                "{qssWrapper}",
                "{arguments}.0" // params
            ]
        },

        // XXX currently sign in functionality is missing
        "onSignInRequested.disable": {
            funcName: "fluid.fail",
            args: ["Signing is not currently supported."]
        },

        "{gpiiConnector}.events.onPreferencesUpdated": {
            funcName: "gpii.app.psp.onPreferencesUpdated",
            args: ["{that}", "{that}.model.hasSettings"]
        }
    },

    modelListeners: {
        "{qssWrapper}.qss.model.height": {
            func: "{that}.setPosition",
            args: [
                "{that}.model.offset.x",
                "{change}.value"
            ]
        },
        "{app}.model.locale": {
            funcName: "gpii.app.notifyWindow",
            args: [
                "{that}.dialog",
                "onLocaleChanged",
                "{app}.model.locale"
            ]
        },
        "{app}.model.theme": {
            func: "{that}.onThemeChanged",
            excludeSource: "init"
        }
    },

    invokers: {
        // TODO use channel
        notifyPSPWindow: {
            funcName: "gpii.app.notifyWindow",
            args: [
                "{that}.dialog",
                "{arguments}.0", // messageChannel
                "{arguments}.1"  // message
            ]
        },
        showRestartWarning: {
            func: "{psp}.notifyPSPWindow",
            args: [
                "onRestartRequired",
                "{arguments}.0" // message
            ]
        },
        hideRestartWarning: {
            func: "{psp}.notifyPSPWindow",
            args: ["onRestartRequired", []]
        },
        onThemeChanged: {
            funcName: "gpii.app.notifyWindow",
            args: [
                "{that}.dialog",
                "onThemeChanged",
                "{that}.model.theme"
            ]
        },
        handleBlur: {
            funcName: "gpii.app.psp.handleBlur",
            args: [
                "{that}",
                "{settingsBroker}",
                "{arguments}.0" // ignoreClosePreference
            ]
        },
        getScaledOffset: {
            funcName: "fluid.identity",
            args: {
                y: "{qssWrapper}.qss.model.height"
            }
        }
    }
});

/**
 * Invoked whenever the `preferences` object in the PSP's model changes. Responsible for
 * hiding the PSP if there are no settings for the currently keyed in user.
 * @param {Component} that - The `gpii.app.psp` instance.
 */
gpii.app.psp.onPreferencesUpdated = function (that) {
    if (that.model.isKeyedIn && !that.model.hasSettings) {
        that.hide();
    }
};

/**
 * Handle PSPWindow's blur event which is fired when the window loses focus. The PSP
 * will be closed only if this is the user's preference and there is no pending change
 * for a setting whose liveness is "manualRestart".
 * @param {Component} psp - The `gpii.app.psp` instance.
 * @param {Component} settingsBroker - The `gpii.app.settingsBroker` instance.
 * @param {Boolean} ignoreClosePreference - If `true`, the user's preference for closing
 * the PSP won't matter.
 */
gpii.app.psp.handleBlur = function (psp, settingsBroker, ignoreClosePreference) {
    var isShown = psp.model.isShown,
        closePspOnBlur = psp.model.preferences.closePspOnBlur || ignoreClosePreference;
    if (isShown && closePspOnBlur && !settingsBroker.hasPendingChange("manualRestart")) {
        psp.events.onClosed.fire();
    }
};

/**
 * Initialises the connection between the Electron process and
 * the PSP's `BrowserWindow` instance
 * @param {Component} app - The `gpii.app` instance.
 * @param {Component} psp - The `gpii.app.psp` instance.
 */
gpii.app.initPSPWindowIPC = function (app, psp) {
    ipcMain.on("onPSPClose", function (event, params) {
        psp.events.onClosed.fire(params);
    });

    ipcMain.on("onKeyOut", function () {
        psp.hide();
        app.resetAllToStandard();
    });

    ipcMain.on("onSettingAltered", function (event, setting) {
        psp.events.onSettingAltered.fire(setting);
    });

    ipcMain.on("onActivePreferenceSetAltered", function (event, activeSet) {
        psp.events.onActivePreferenceSetAltered.fire(activeSet);
    });

    ipcMain.on("onContentHeightChanged", function (event, contentHeight) {
        psp.events.onContentHeightChanged.fire(contentHeight);
    });

    /*
     * "Restart Required" functionality events
     */
    ipcMain.on("onRestartNow", function (event, pendingChanges) {
        psp.events.onRestartNow.fire({
            pendingChanges: pendingChanges
        });
    });

    ipcMain.on("onUndoChanges", function (event, pendingChanges) {
        psp.events.onUndoChanges.fire({
            pendingChanges: pendingChanges
        });
    });

    ipcMain.on("onSignInRequested", function (event, email, password) {
        psp.events.onSignInRequested.fire(email, password);
    });
};

/**
 * Invoked whenever the user presses the close button in the upper right corner of
 * the PSP `BrowserWindow`, clicks outside of it or confirms the application of
 * given settings. The function takes care of hiding the PSP, applying pending
 * changes which require application restarts and undoing setting changes that
 * necessitate the OS to be restarted.
 * @param {Component} psp - The `gpii.app.psp` instance.
 * @param  {Component} settingsBroker - The `gpii.app.settingsBroker` instance.
 */
gpii.app.psp.closePSP = function (psp, settingsBroker) {
    psp.hide();

    settingsBroker.applyPendingChanges({
        liveness: "manualRestart"
    });
    settingsBroker.undoPendingChanges({
        liveness: "OSRestart"
    });
};

/**
 * Focuses back the QSS when the PSP is closed. Note that if the PSP has been closed
 * as a result of a keyboard interaction, the "Sign in" button in the QSS should be
 * highlighted. Thus, this function should internally use `qss.show` instead of
 * `qss.focus`.
 * @param {Component} qssWrapper - The `gpii.app.qssWrapper` instance.
 * @param {Object} params - Parameters specifying how the `onClosed` event was
 * triggered (e.g. which keyboard key if any resulted in it).
 */
gpii.app.psp.giveFocusToQss = function (qssWrapper, params) {
    var qss = qssWrapper.qss;
    if (qss.model.isShown) {
        var settingPath = qssWrapper.options.settingOptions.settingPaths.psp,
            setting = qssWrapper.getSetting(settingPath);

        params = fluid.extend({}, params, {
            setting: setting
        });
        qss.show(params);
    }
};

/**
 * This function takes care of notifying the PSP window whenever the
 * user changes the accent color of the OS theme. Available only if
 * the application is used on Windows 10.
 * @param {Object} psp - The `gpii.app.psp` instance
 */
gpii.app.psp.registerAccentColorListener = function (psp) {
    if (gpii.app.isWin10OS()) {
        // Ideally when the PSP window is created, it should be notified about
        // the current accent color. Possible events which can be used for this
        // purpose are "ready-to-show" or "show". However, as the window is drawn
        // off screen, registering the listeners will happen after the corresponding
        // event has been fired. That is why the PSP window should be notified every
        // time it is focused (only the first time is insufficient because showing
        // the window (even off screen) automatically focuses it).
        psp.dialog.on("focus", function () {
            psp.notifyPSPWindow("onAccentColorChanged", systemPreferences.getAccentColor());
        });

        systemPreferences.on("accent-color-changed", function (event, accentColor) {
            psp.notifyPSPWindow("onAccentColorChanged", accentColor);
        });
    }
};
