/**
 * PSP BrowserWindow dialog
 *
 * Introduces a component that manages the PSP's Electron BrowserWindow (the panel itself).
 * GPII Application
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

require("./resizable.js");
require("./utils.js");
require("./blurrable.js");


/**
 * Configuration for using the `gpii.app.psp` component in the App (the `gpii.app` component).
 * Note that this is an incomplete grade which references the App and other
 * App related components (subcomponents).
 */
fluid.defaults("gpii.app.pspInApp", {
    gradeNames: "gpii.app.psp",
    model: {
        keyedInUserToken: "{app}.model.keyedInUserToken"
    },

    modelListeners: {
        "{qss}.qss.model.isShown": {
            funcName: "gpii.app.pspInApp.applyOffset",
            args: ["{that}", "{qss}.qss.options.config.attrs.height", "{change}.value"],
            excludeSource: "init"
        }
    },

    listeners: {
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


        /*
         * Restart Warning related listeners
         */

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
 * Apply offset for the PSP window. Currently only the QSS requires
 * offsetting the PSP.
 *
 * @param {Component} psp - The `gpii.app.psp` instance
 * @param {Number} qssHeight - The height of the QSS
 * @param {Boolean} isQssShown - Whether the QSS is shown
 */
gpii.app.pspInApp.applyOffset = function (psp, qssHeight, isQssShown) {
    // TODO refactor
    if (isQssShown) {
        psp.model.offset.y = qssHeight;
    } else {
        // reset the heightOffset
        psp.model.offset.y = 0;
    }

    // in case it was shown, it will be also repositioned
    if (psp.model.isShown) {
        psp.setBounds(psp.width, psp.height, null, psp.model.offset.y);
    } else {
        psp.setRestrictedSize(psp.width, psp.height);
    }
};

/**
 * Either hides or shows the warning in the PSP.
 *
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
    gradeNames: ["gpii.app.dialog", "gpii.app.blurrable", "gpii.app.dialog.offScreenHidable"],

    model:  {
        keyedInUserToken: null,
        theme: null,
        preferences: {}
    },

    modelRelay: {
        hasSettings: {
            target: "hasSettings",
            singleTransform: {
                type: "fluid.transforms.free",
                func: "gpii.app.psp.getHasSettings",
                args: ["{that}.model.preferences"]
            }
        }
    },

    /*
     * Raw options to be passed to the Electron `BrowserWindow` that is created.
     */
    config: {
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
            }
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

        onContentHeightChanged: null
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
        "onCreate.initBlurrable": {
            func: "{that}.initBlurrable",
            args: ["{that}.dialog"]
        },

        "onDestroy.cleanupElectron": {
            "this": "{that}.dialog",
            method: "destroy"
        },

        "onClosed.closePsp": {
            funcName: "gpii.app.psp.closePSP",
            args: ["{psp}", "{settingsBroker}"]
        },

        "{gpiiConnector}.events.onPreferencesUpdated": {
            funcName: "gpii.app.psp.onPreferencesUpdated",
            args: ["{that}", "{that}.model.hasSettings"]
        }
    },

    modelListeners: {
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
        show: {
            funcName: "gpii.app.psp.show",
            args: [
                "{that}",
                "{arguments}.0" // forceShow
            ]
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
        }
    }
});

/**
 * Computes whether at least one setting group in the specified preferences has at least
 * 1 top level setting.
 * @param {Object} preferences - The current preferences object for the PSP (containing
 * the available preference sets, the currently active one and the setting groups)
 * @return {Boolean} `true` if at least one setting group has at least one setting and
 * `false` otherwise.
 */
gpii.app.psp.getHasSettings = function (preferences) {
    // Whether at least one setting group has at least 1 top level setting.
    var settingGroups = fluid.get(preferences, "settingGroups");
    return !!fluid.find_if(settingGroups, function (settingGroup) {
        return settingGroup.settings.length > 0;
    });
};

/**
 * Shows the PSP in the following cases:
 * 1. If the `forceShow` argument is true (regardless of whether there is a keyed in user
 * or not).
 * 2. If there is no keyed in user.
 * 3. If there is a keyed in user who has at least one setting specified.
 * @param {Component} that - The `gpii.app.psp` instance.
 * @param {Boolean} forceShow - Whether to show the PSP unconditionally.
 */
gpii.app.psp.show = function (that, forceShow) {
    if (forceShow || !that.model.keyedInUserToken || that.model.hasSettings) {
        that.applier.change("isShown", true);
    }
};

/**
 * Invoked whenever the `preferences` object in the PSP's model changes. Responsible for
 * hiding the PSP if there are no settings for the currently keyed in user.
 * @param {Component} that - The `gpii.app.psp` instance.
 */
gpii.app.psp.onPreferencesUpdated = function (that) {
    if (that.model.keyedInUserToken && !that.model.hasSettings) {
        that.hide();
    }
};

/**
 * Handle PSPWindow's blur event which is fired when the window loses focus. The PSP
 * will be closed only if this is the user's preference and there is no pending change
 * for a setting whose liveness is "manualRestart".
 * @param {Component} psp - The `gpii.app.psp` instance.
 * @param {Component} settingsBroker - The `gpii.app.settingsBroker` instance.
 */
gpii.app.psp.handleBlur = function (psp, settingsBroker, ignoreClosePreference) {
    var isShown = psp.model.isShown,
        closePSPOnBlur = psp.model.preferences.closePSPOnBlur || ignoreClosePreference;
    if (isShown && closePSPOnBlur && !settingsBroker.hasPendingChange("manualRestart")) {
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
    ipcMain.on("onPSPClose", function () {
        psp.events.onClosed.fire();
    });

    ipcMain.on("onKeyOut", function () {
        psp.hide();
        app.keyOut();
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
        // XXX currently sign in functionality is missing
        fluid.fail("Sign in is not possible with email - ", email,
            " and password: ", password);
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
