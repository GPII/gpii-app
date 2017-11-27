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

var fluid    = require("infusion");
var electron = require("electron");

var BrowserWindow     = electron.BrowserWindow,
    ipcMain           = electron.ipcMain,
    systemPreferences = electron.systemPreferences;
var gpii              = fluid.registerNamespace("gpii");

require("./utils.js");

/**
 * Handles logic for the PSP window.
 * Creates an Electron `BrowserWindow` and manages it.
 */
fluid.defaults("gpii.app.psp", {
    gradeNames: "fluid.modelComponent",

    model:  {
        keyedInUserToken: null,
        isShown: false
    },

    /*
     * Raw options to be passed to the Electron `BrowserWindow` that is created.
     */
    attrs: {
        width: 500,
        height: 600,
        show: true,
        frame: false,
        fullscreenable: false,
        resizable: false,
        alwaysOnTop: true,
        skipTaskbar: true,
        backgroundColor: "transparent"
    },

    members: {
        pspWindow: "@expand:gpii.app.psp.makePSPWindow({that}.options.attrs)"
    },
    events: {
        onSettingAltered: null,
        onActivePreferenceSetAltered: null,

        onRestartNow: null,
        onUndoChanges: null,

        onClosed: null,
        onRestartLater: null
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
        "onCreate.initPSPWindowListeners": {
            listener: "gpii.app.psp.initPSPWindowListeners",
            args: ["{that}"]
        },

        "onDestroy.cleanupElectron": {
            this: "{that}.pspWindow",
            method: "destroy"
        },

        "onClosed.closePsp": {
            func: "{psp}.hide"
        }
    },
    invokers: {
        show: {
            funcName: "gpii.app.psp.showPSPWindow",
            args: ["{that}", "{that}.pspWindow"]
        },
        hide: {
            funcName: "gpii.app.psp.hidePSPWindow",
            args: ["{that}", "{that}.pspWindow"]
        },
        notifyPSPWindow: {
            funcName: "gpii.app.notifyWindow",
            args: ["{that}.pspWindow", "{arguments}.0", "{arguments}.1"]
        },
        getWindowPosition: {
            funcName: "gpii.app.getWindowPosition",
            args: ["{that}.options.attrs.width", "{that}.options.attrs.height"]
        },
        resize: {
            funcName: "gpii.app.psp.resize",
            args: ["{that}", "{arguments}.0", "{that}.options.attrs.height", "{arguments}.1"]
        },
        showRestartWarning: {
            func: "{psp}.notifyPSPWindow",
            args: ["onRestartRequired", "{arguments}.0"]
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
gpii.app.psp.showPSPWindow = function (psp, pspWindow) {
    var screenSize = electron.screen.getPrimaryDisplay().workAreaSize,
        windowSize = pspWindow.getSize(),
        windowX = screenSize.width - windowSize[0],
        windowY = screenSize.height - windowSize[1];
    pspWindow.setPosition(windowX, windowY);
    pspWindow.focus();
    psp.applier.change("isShown", true);
};


/**
 * A function which should be called to init various listeners related to
 * the PSP window.
 * @param psp {Component} The `gpii.app.psp` instance.
 */
gpii.app.psp.initPSPWindowListeners = function (psp) {
    var pspWindow = psp.pspWindow;
    pspWindow.on("blur", function () {
        if (psp.model.isShown) {
            psp.events.onClosed.fire();
        }
    });

    electron.screen.on("display-metrics-changed", function (event, display, changedMetrics) {
        if (changedMetrics.indexOf("workArea") > -1) {
            var windowSize = pspWindow.getSize(),
                contentHeight = windowSize[1];
            psp.resize(contentHeight, true);
        }
    });
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

    ipcMain.on("onSettingAltered", function (event, arg) {
        psp.events.onSettingAltered.fire(arg);
    });

    ipcMain.on("onActivePreferenceSetAltered", function (event, arg) {
        psp.events.onActivePreferenceSetAltered.fire(arg);
    });

    ipcMain.on("onContentHeightChanged", function (event, contentHeight) {
        psp.resize(contentHeight);
    });

    ipcMain.on("onRestartNow", function () {
        psp.hide();
        psp.events.onRestartNow.fire();
    });

    ipcMain.on("onRestartLater", function () {
        psp.hide();
    });

    ipcMain.on("onUndoChanges", function () {
        psp.events.onUndoChanges.fire();
    });
};


/**
 * Hides the PSP window by moving it to a non-visible part of the screen. This function
 * in conjunction with `gpii.app.psp.showPSPWindow` help avoid the flickering issue when
 * the content of the PSP window changes.
 * @param psp {Component} The `gpii.app.psp` instance.
 * @param pspWindow {Object} An Electron `BrowserWindow`.
 */
gpii.app.psp.hidePSPWindow = function (psp, pspWindow) {
    var windowSize = pspWindow.getSize(),
        width = windowSize[0],
        height = windowSize[1];
    pspWindow.setPosition(-width, -height);

    // TODO: Find a way around this.
    if (psp) {
        psp.applier.change("isShown", false);
    }
};

/**
 * Resizes the PSP window and positions it appropriately based on the new height
 * of its content. Makes sure that the window is no higher than the available
 * height of the work area in the primary display. The window will not be resized
 * if its current height is the same as the new height. This behaviour can be
 * overridden using the `forceResize` parameter.
 * @param psp {Object} A `gpii.app.psp` instance.
 * @param contentHeight {Number} The new height of the BrowserWindow's content.
 * @param minHeight {Number} The minimum height which the BrowserWindow must have.
 * @param forceResize {Boolean} Whether to resize the window even if the current
 * height of the `BrowserWindow` is the same as the new one. Useful when screen
 * DPI is changed as a result of the application of a user's preferences.
 */
gpii.app.psp.resize = function (psp, contentHeight, minHeight, forceResize) {
    var pspWindow = psp.pspWindow,
        wasShown = psp.model.isShown,
        screenSize = electron.screen.getPrimaryDisplay().workAreaSize,
        windowSize = pspWindow.getSize(),
        windowWidth = windowSize[0],
        initialHeight = windowSize[1],
        windowHeight = Math.min(screenSize.height, Math.max(contentHeight, minHeight));

    if (initialHeight === windowHeight && !forceResize) {
        return;
    }

    pspWindow.setSize(windowWidth, windowHeight);

    if (wasShown) {
        psp.show();
    }
};

/**
 * Creates an Electron `BrowserWindow` that is to be used as the PSP window
 *
 * @param {Object} windowOptions Raw options to be passed to the `BrowserWindow`
 * @returns {Object} The created Electron `BrowserWindow`
 */
gpii.app.psp.makePSPWindow = function (windowOptions) {
    var pspWindow = new BrowserWindow(windowOptions);

    var url = fluid.stringTemplate("file://%gpii-app/src/renderer/psp/index.html", fluid.module.terms());
    pspWindow.loadURL(url);

    gpii.app.psp.hidePSPWindow(null, pspWindow);

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
