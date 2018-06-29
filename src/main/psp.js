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

var BrowserWindow     = electron.BrowserWindow,
    ipcMain           = electron.ipcMain,
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
    if (isQssShown) {
        psp.options.heightOffset = qssHeight;
    } else {
        // reset the heightOffset
        psp.options.heightOffset = null;
    }

    console.log("Apply Offset & setBounds: ", psp.width, psp.height, psp.options.heightOffset);
    // in case it was shown, it will be also repositioned
    psp.setBounds(psp.width, psp.height);
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
    gradeNames: ["fluid.modelComponent", "gpii.app.blurrable", "gpii.app.resizable"],

    model:  {
        keyedInUserToken: null,
        isShown: false,
        theme: null,
        preferences: {}
    },

    /*
     * Raw options to be passed to the Electron `BrowserWindow` that is created.
     */
    config: {
        attrs: {
            width: 450,
            height: 600,
            show: true,
            frame: false,
            fullscreenable: false,
            resizable: false,
            skipTaskbar: true,
            backgroundColor: "transparent"
        }
    },

    // In case we want to have some heightOffset from the screen edge.
    // This is useful when we have QSS which should be below the PSP.
    heightOffset: null,
    offScreenHide: true,

    linkedWindowsGrades: ["gpii.app.qss", "gpii.app.qssWidget", "gpii.app.qssNotification", "gpii.app.qssMorePanel", "gpii.app.psp"],

    sounds: {
        keyedIn: "keyedIn.mp3",
        activeSetChanged: "activeSetChanged.mp3"
    },

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
    },

    members: {
        pspWindow: "@expand:gpii.app.psp.makePSPWindow({that}.options.config.attrs, {that}.options.params, {that}.options.gradeNames)"
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
            args: ["{that}.pspWindow"]
        },

        "onDestroy.cleanupElectron": {
            "this": "{that}.pspWindow",
            method: "destroy"
        },

        "onClosed.closePsp": {
            funcName: "gpii.app.psp.closePSP",
            args: ["{psp}", "{settingsBroker}"]
        }
    },

    modelListeners: {
        "{app}.model.locale": {
            funcName: "gpii.app.notifyWindow",
            args: [
                "{that}.pspWindow",
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
        show: {
            funcName: "gpii.app.psp.show",
            args: ["{that}"]
        },
        hide: {
            funcName: "gpii.app.psp.hide",
            args: ["{that}"]
        },
        notifyPSPWindow: {
            funcName: "gpii.app.notifyWindow",
            args: [
                "{that}.pspWindow",
                "{arguments}.0", // messageChannel
                "{arguments}.1"  // message
            ]
        },
        setSize: {
            funcName: "gpii.app.psp.setSize",
            args: [
                "{that}",
                "{arguments}.0",  // width
                "{arguments}.1",  // height
                "{that}.options.config.attrs.height",
                "{that}.options.heightOffset"
            ]
        },
        setBounds: {
            funcName: "gpii.app.psp.setBounds",
            args: [
                "{that}",
                "{arguments}.0",  // width
                "{arguments}.1",  // height
                "{that}.options.config.attrs.height",
                "{that}.options.heightOffset"
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
                "{that}.pspWindow",
                "onThemeChanged",
                "{that}.model.theme"
            ]
        },
        handleBlur: {
            funcName: "gpii.app.psp.handleBlur",
            args: ["{that}", "{settingsBroker}"]
        }
    }
});


/**
 * Shows the PSP window by moving it to the lower right part of the screen and changes
 * the `isShown` model property accordingly.
 * @param {Component} psp - The `gpii.app.psp` instance.
 */
gpii.app.psp.show = function (psp) {
    console.log("Show: ", psp.options.heightOffset);
    gpii.browserWindow.moveToScreen(psp.pspWindow, { y: psp.options.heightOffset });
    psp.pspWindow.focus();
    psp.applier.change("isShown", true);
};

/**
 * Handle PSPWindow's blur event which is fired when the window loses focus. The PSP
 * will be closed only if this is the user's preference and there is no pending change
 * for a setting whose liveness is "manualRestart".
 * @param {Component} psp - The `gpii.app.psp` instance.
 * @param {Component} settingsBroker - The `gpii.app.settingsBroker` instance.
 */
gpii.app.psp.handleBlur = function (psp, settingsBroker) {
    var isShown = psp.model.isShown,
        closePSPOnBlur = psp.model.preferences.closePSPOnBlur;
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
 * Hides the PSP window by moving it off the screen and changes the `isShown` model
 * property accordingly.
 * @param {Component} psp - The `gpii.app.psp` instance.
 */
gpii.app.psp.hide = function (psp) {
    gpii.browserWindow.moveOffScreen(psp.pspWindow);
    psp.applier.change("isShown", false);
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

gpii.app.psp.setSize = function (psp, width, height, minHeight, heightOffset) {
    var pspWindow = psp.pspWindow;

    height = Math.max(height, minHeight || 0);

    var size = gpii.browserWindow.computeWindowSize(width, height, 0, heightOffset);

    pspWindow.setSize(size.width, size.height);
};



/**
 * Resizes the PSP window and positions it appropriately based on the new height
 * of its content. Makes sure that the window is no higher than the available
 * height of the work area in the primary display.
 * @param {Object} psp - A `gpii.app.psp` instance.
 * @param {Number} width - The desired width of the BrowserWindow.
 * @param {Number} height - The new height of the BrowserWindow's content.
 * @param {Number} minHeight - The minimum height which the BrowserWindow must have.
 * @param {Number} heightOffset - The heightoffset that should be preserved after resizing.
 */
gpii.app.psp.setBounds = function (psp, width, height, minHeight, heightOffset) {
    var pspWindow = psp.pspWindow,
        wasShown = psp.model.isShown;

    height = Math.max(height, minHeight || 0);

    var bounds = gpii.browserWindow.computeWindowBounds(width, height, 0, heightOffset);

    if (wasShown) {
        // The coordinates and the dimensions of the PSP must be set with a single
        // call to setBounds instead of by invoking setBounds and setPosition in a
        // row. Due to https://github.com/electron/electron/issues/10862.
        pspWindow.setBounds(bounds);
    } else {
        // Setting only the size here because setting the bounds will actually
        // move the PSP `BrowserWindow` to the screen (i.e. make it visible).
        pspWindow.setSize(bounds.width, bounds.height);
    }
};

/**
 * Creates an Electron `BrowserWindow` that is to be used as the PSP window.
 * @param {Object} windowOptions - The raw `BrowserWindow` settings.
 * @param {Object} params - options that are to be supplied to the render process of
 * the newly created `BrowserWindow`.
 * @return {Object} The created Electron `BrowserWindow`
 */
gpii.app.psp.makePSPWindow = function (windowOptions, params) {
    var pspWindow = new BrowserWindow(windowOptions);

    var url = fluid.stringTemplate("file://%gpii-app/src/renderer/psp/index.html", fluid.module.terms());
    pspWindow.loadURL(url);
    pspWindow.params = params || {};

    gpii.browserWindow.moveOffScreen(pspWindow);

    return pspWindow;
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
        psp.pspWindow.on("focus", function () {
            psp.notifyPSPWindow("onAccentColorChanged", systemPreferences.getAccentColor());
        });

        systemPreferences.on("accent-color-changed", function (event, accentColor) {
            psp.notifyPSPWindow("onAccentColorChanged", accentColor);
        });
    }
};
