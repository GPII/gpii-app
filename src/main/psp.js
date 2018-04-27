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
        isShown: {
            funcName: "gpii.app.hideRestartDialogIfNeeded",
            args: ["{dialogManager}", "{change}.value"]
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

        "{gpiiConnector}.events.onSettingUpdated": {
            listener: "{that}.notifyPSPWindow",
            args: [
                "onSettingUpdated",
                "{arguments}.0" // message
            ]
        },

        "{settingsBroker}.events.onSettingApplied": [{
            listener: "{that}.notifyPSPWindow",
            args: [
                "onSettingUpdated",
                "{arguments}.0" // message
            ]
        }],

        /*
         * Restart Warning related listeners
         */

        onClosed: {
            funcName: "gpii.app.showRestartDialogIfNeeded",
            args: ["{dialogManager}", "{settingsBroker}.model.pendingChanges"]
        },

        onSettingAltered: {
            listener: "{settingsBroker}.enqueue"
        },

        onRestartNow: [{
            func: "{dialogManager}.hide",
            args: ["restartDialog"]
        }, {
            func: "{that}.hide"
        }, {
            listener: "{settingsBroker}.applyPendingChanges"
        }],

        onUndoChanges: [{
            func: "{dialogManager}.hide",
            args: ["restartDialog"]
        }, {
            listener: "{settingsBroker}.undoPendingChanges"
        }],

        onRestartLater: [{
            func: "{dialogManager}.hide",
            args: ["restartDialog"]
        }, {
            func: "{that}.hide"
        }],

        onActivePreferenceSetAltered: [{
            func: "{dialogManager}.hide",
            args: ["restartDialog"]
        }, {
            listener: "{settingsBroker}.clearPendingChanges"
        }],

        "{settingsBroker}.events.onRestartRequired": {
            funcName: "gpii.app.togglePspRestartWarning",
            args: [
                "{that}",
                "{arguments}.0" // pendingChanges
            ]
        }
    }
});


/**
 * Handles logic for the PSP window.
 * Creates an Electron `BrowserWindow` and manages it.
 */
fluid.defaults("gpii.app.psp", {
    gradeNames: ["fluid.modelComponent", "gpii.app.resizable"],

    model:  {
        keyedInUserToken: null,
        isShown: false
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
            alwaysOnTop: true,
            skipTaskbar: true,
            backgroundColor: "transparent"
        }
    },

    members: {
        pspWindow: "@expand:gpii.app.psp.makePSPWindow({that}.options.config.attrs)"
    },
    events: {
        onSettingAltered: null,
        onActivePreferenceSetAltered: null,

        onRestartNow: null,
        onUndoChanges: null,

        onClosed: null,
        onRestartLater: null,

        onContentHeightChanged: null,
        onPSPWindowFocusLost: null
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
        "onCreate.initBlurListener": {
            listener: "gpii.app.psp.initBlurListener",
            args: ["{that}"]
        },

        "onDestroy.cleanupElectron": {
            "this": "{that}.pspWindow",
            method: "destroy"
        },

        "onClosed.closePsp": {
            func: "{psp}.hide"
        },

        "onRestartLater.closePsp": {
            func: "{psp}.hide"
        },

        "onRestartNow.closePsp": {
            func: "{psp}.hide"
        },

        "onPSPWindowFocusLost": {
            funcName: "gpii.app.psp.handlePSPWindowFocusLost",
            args: "{that}"
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
        resize: {
            funcName: "gpii.app.psp.resize",
            args: [
                "{that}",
                "{arguments}.0", // width
                "{arguments}.1"  // height
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
        }
    }
});

/**
 * Shows the PSP window in the lower part of the primary display and focuses it.
 * Actually, the PSP window is always shown but it may be positioned off the screen.
 * This is a workaround for the flickering issue observed when the content displayed in
 * the PSP window changes. (Electron does not rerender web pages when the
 * `BrowserWindow` is hidden).
 * @param psp {Component} The `gpii.app.psp` instance.
 * @param pspWindow {Object} An Electron `BrowserWindow`.
 */

/**
 * Moves the PSP to the lower right part of the screen. This function in conjunction
 * with `gpii.app.psp.moveOffScreen` help avoid the flickering issue when the content
 * of the PSP window changes.
 * @param pspWindow {Object} An Electron `BrowserWindow`.
 */
gpii.app.psp.moveToScreen = function (pspWindow) {
    var screenSize = electron.screen.getPrimaryDisplay().workAreaSize,
        windowSize = pspWindow.getSize(),
        windowX = screenSize.width - windowSize[0],
        windowY = screenSize.height - windowSize[1];
    pspWindow.setPosition(windowX, windowY);
};

/**
 * Shows the PSP window by moving it to the lower right part of the screen and changes
 * the `isShown` model property accordingly.
 * @param psp {Component} The `gpii.app.psp` instance.
 */
gpii.app.psp.show = function (psp) {
    gpii.app.psp.moveToScreen(psp.pspWindow);
    psp.pspWindow.focus();
    psp.applier.change("isShown", true);
};

/**
 * Handle PSPWindow's blur event, which is fired when the window loses focus
 */
gpii.app.psp.handlePSPWindowFocusLost = function (psp) {
    if (psp.model.isShown) {
        psp.events.onClosed.fire();
    }
};

/**
 * A function which should be called to init the blur listener for the PSP.
 * @param psp {Component} The `gpii.app.psp` instance.
 */
gpii.app.psp.initBlurListener = function (psp) {
    var pspWindow = psp.pspWindow;

    // https://github.com/electron/electron/blob/master/docs/api/browser-window.md#event-blur
    pspWindow.on("blur", psp.events.onPSPWindowFocusLost.fire);
};

/**
 * Initialises the connection between the Electron process and
 * the PSP's `BrowserWindow` instance
 * @param app {Component} The `gpii.app` instance.
 * @param psp {Component} The `gpii.app.psp` instance.
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

    ipcMain.on("onRestartNow", function () {
        psp.events.onRestartNow.fire();
    });

    ipcMain.on("onRestartLater", function () {
        psp.events.onRestartLater.fire();
    });

    ipcMain.on("onUndoChanges", function () {
        psp.events.onUndoChanges.fire();
    });
};


/**
 * Moves the PSP to a non-visible part of the screen. This function in conjunction
 * with `gpii.app.psp.moveToScreen` help avoid the flickering issue when the content
 * of the PSP window changes.
 * @param pspWindow {Object} An Electron `BrowserWindow`.
 */
gpii.app.psp.moveOffScreen = function (pspWindow) {
    // Move the PSP so far away that even if there is an additional screen attached,
    // it will not be visible. It appears that the min value for the `BrowserWindow`
    // position can be -Math.pow(2, 31). Any smaller values lead to an exception.
    var coordinate = -Math.pow(2, 20);
    pspWindow.setPosition(coordinate, coordinate);
};

/**
 * Hides the PSP window by moving it off the screen and changes the `isShown` model
 * property accordingly.
 * @param psp {Component} The `gpii.app.psp` instance.
 */
gpii.app.psp.hide = function (psp) {
    gpii.app.psp.moveOffScreen(psp.pspWindow);
    psp.applier.change("isShown", false);
};

/**
 * Resizes the PSP window and positions it appropriately based on the new height
 * of its content. Makes sure that the window is no higher than the available
 * height of the work area in the primary display.
 * @param psp {Object} A `gpii.app.psp` instance.
 * @param width {Number} The desired width of the BrowserWindow.
 * @param contentHeight {Number} The new height of the BrowserWindow's content.
 * @param minHeight {Number} The minimum height which the BrowserWindow must have.
 */
gpii.app.psp.resize = function (psp, windowWidth, windowHeight) {
    var pspWindow = psp.pspWindow,
        wasShown = psp.model.isShown,
        minHeight = psp.options.config.attrs.height,
        bounds;

    windowHeight = Math.max(windowHeight, minHeight);
    bounds = gpii.app.getDesiredWindowBounds(windowWidth, windowHeight);

    if (wasShown) {
        // The coordinates and the dimensions of the PSP must be set with a single
        // call to setBounds instead of by invoking setSize and setPosition in a
        // row. Due to https://github.com/electron/electron/issues/10862.
        pspWindow.setBounds(bounds);
    } else {
        // Setting only the size here because setting the bounds will actually
        // move the PSP `BrowserWindow` to the screen (i.e. make it visible).
        pspWindow.setSize(bounds.width, bounds.height);
    }
};

/**
 * Creates an Electron `BrowserWindow` that is to be used as the PSP window
 *
 * @param {Object} windowOptions Raw options to be passed to the `BrowserWindow`
 * @return {Object} The created Electron `BrowserWindow`
 */
gpii.app.psp.makePSPWindow = function (windowOptions) {
    var pspWindow = new BrowserWindow(windowOptions);

    var url = fluid.stringTemplate("file://%gpii-app/src/renderer/psp/index.html", fluid.module.terms());
    pspWindow.loadURL(url);

    gpii.app.psp.moveOffScreen(pspWindow);

    return pspWindow;
};

/**
 * This function takes care of notifying the PSP window whenever the
 * user changes the accent color of the OS theme. Available only if
 * the application is used on Windows 10.
 * @param psp {Object} The `gpii.app.psp` instance
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
