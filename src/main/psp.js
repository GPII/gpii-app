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

        onSettingAltered: {
            listener: "{settingsBroker}.enqueue"
        },

        onRestartNow: [{
            func: "{that}.hide"
        }, {
            listener: "{settingsBroker}.applyPendingChanges"
        }],

        onUndoChanges: {
            listener: "{settingsBroker}.undoPendingChanges"
        },

        onActivePreferenceSetAltered: {
            listener: "{settingsBroker}.clearPendingChanges"
        },

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
        width: 450,
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

        onDisplayMetricsChanged: null,
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
        "onCreate.initPSPWindowListeners": {
            listener: "gpii.app.psp.initPSPWindowListeners",
            args: ["{that}"]
        },

        "onDestroy.cleanupElectron": {
            "this": "{that}.pspWindow",
            method: "destroy"
        },

        "onClosed.closePsp": {
            funcName: "gpii.app.psp.closePSP",
            args: ["{psp}", "{settingsBroker}"]
        },

        "onRestartNow.closePsp": {
            func: "{psp}.hide"
        },

        "onDisplayMetricsChanged": {
            funcName: "gpii.app.psp.handleDisplayMetricsChange",
            args: [
                "{that}",
                "{arguments}.0", // event
                "{arguments}.1", // display
                "{arguments}.2"  // changedMetrics
            ]
        },

        "onPSPWindowFocusLost": {
            funcName: "gpii.app.psp.handlePSPWindowFocusLost",
            args: ["{that}", "{settingsBroker}"]
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
                "{that}.options.attrs.width",
                "{arguments}.0", // contentHeight
                "{that}.options.attrs.height",
                "{arguments}.1"  // forceResize
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
    psp.notifyPSPWindow("onPSPOpen");
};

/**
 * Handle electron's display-metrics-changed event, by resizing the PSP when necessary.
 * @param psp {Component} The `gpii.app.psp` instance.
 * @param event {event} An Electron `event`.
 * @param display {Object} The Electron `Display` object.
 * @param changedMetrics {Array} An array of strings that describe the changes. Possible
 * changes are `bounds`, `workArea`, `scaleFactor` and `rotation`
 */
gpii.app.psp.handleDisplayMetricsChange = function (psp, event, display, changedMetrics) {
    // In older versions of Electron (e.g. 1.4.1) whenever the DPI was changed, one
    // `display-metrics-changed` event was fired. In newer versions (e.g. 1.8.1) the
    // `display-metrics-changed` event is fired multiple times. The change of the DPI
    // appears to be applied at different times on different machines. On some as soon
    // as the first `display-metrics-changed` event is fired, the DPI changes are
    // applied. On others, this is not the case until the event is fired again. That is
    // why the resizing should happen only the second (or third) time the
    // `display-metrics-changed` event is fired in which case the changedMetrics argument
    // will not include the `scaleFactor` string. For more information please take a look
    // at https://issues.gpii.net/browse/GPII-2890.
    if (!changedMetrics.includes("scaleFactor")) {
        // Use the initial size of the PSP when the DPI is changed. The PSP will resize
        // one more time when the heightChangeListener kicks in.
        psp.resize(psp.options.attrs.height);
    }
};

/**
 * Handle PSPWindow's blur event, which is fired when the window loses focus
 */
gpii.app.psp.handlePSPWindowFocusLost = function (psp, settingsBroker) {
    // The PSP cannot be hidden by clicking outside of it if there is an application
    // which requires a restart.
    if (psp.model.isShown && !settingsBroker.hasPendingChange("manualRestart")) {
        psp.hide();
    }
};

/**
 * A function which should be called to init various listeners related to
 * the PSP window.
 * @param psp {Component} The `gpii.app.psp` instance.
 */
gpii.app.psp.initPSPWindowListeners = function (psp) {
    var pspWindow = psp.pspWindow;

    // https://github.com/electron/electron/blob/master/docs/api/browser-window.md#event-blur
    pspWindow.on("blur", psp.events.onPSPWindowFocusLost.fire);

    // https://github.com/electron/electron/blob/master/docs/api/screen.md#event-display-metrics-changed
    electron.screen.on("display-metrics-changed", psp.events.onDisplayMetricsChanged.fire);
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
        psp.resize(contentHeight);
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
 * Resizes the PSP window and positions it appropriately based on the new height
 * of its content. Makes sure that the window is no higher than the available
 * height of the work area in the primary display.
 * @param psp {Object} A `gpii.app.psp` instance.
 * @param width {Number} The desired width of the BrowserWindow.
 * @param contentHeight {Number} The new height of the BrowserWindow's content.
 * @param minHeight {Number} The minimum height which the BrowserWindow must have.
 */
gpii.app.psp.resize = function (psp, width, contentHeight, minHeight) {
    var pspWindow = psp.pspWindow,
        wasShown = psp.model.isShown,
        height = Math.max(contentHeight, minHeight),
        bounds = gpii.app.getDesiredWindowBounds(width, height);

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
