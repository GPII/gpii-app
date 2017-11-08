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
 * Handles logic for the PCP window.
 * Creates an Electron `BrowserWindow` and manages it
 */
fluid.defaults("gpii.app.pcp", {
    gradeNames: "fluid.modelComponent",

    model:  {
        keyedInUserToken: null
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
        pcpWindow: "@expand:gpii.app.pcp.makePCPWindow({that}.options.attrs)"
    },
    events: {
        onSettingAltered: null,
        onActivePreferenceSetAltered: null
    },
    listeners: {
        "onCreate.initPCPWindowIPC": {
            listener: "gpii.app.initPCPWindowIPC",
            args: ["{app}", "{that}", "{gpiiConnector}"]
        },
        "onCreate.registerAccentColorListener": {
            listener: "gpii.app.pcp.registerAccentColorListener",
            args: ["{that}"]
        },
        "onCreate.initPCPWindowListeners": {
            listener: "gpii.app.pcp.initPCPWindowListeners",
            args: ["{that}"]
        }
    },
    invokers: {
        show: {
            funcName: "gpii.app.pcp.showPCPWindow",
            args: ["{that}.pcpWindow"]
        },
        hide: {
            funcName: "gpii.app.pcp.hidePCPWindow",
            args: ["{that}.pcpWindow"]
        },
        isShown: {
            funcName: "gpii.app.pcp.isPCPWindowShown",
            args: ["{that}.pcpWindow"]
        },
        notifyPCPWindow: {
            funcName: "gpii.app.pcp.notifyPCPWindow",
            args: ["{that}.pcpWindow", "{arguments}.0", "{arguments}.1"]
        },
        getWindowPosition: {
            funcName: "gpii.app.getWindowPosition",
            args: ["{that}.options.attrs.width", "{that}.options.attrs.height"]
        },
        resize: {
            funcName: "gpii.app.pcp.resize",
            args: ["{that}", "{arguments}.0", "{that}.options.attrs.height", "{arguments}.1"]
        }
    }
});

/**
 * This function checks whether the PCP window is shown.
 * @param pcpWindow {Object} An Electron `BrowserWindow`
 * @return {Boolean} `true` if the PCP window is shown and `false` otherwise.
 */
gpii.app.pcp.isPCPWindowShown = function (pcpWindow) {
    var position = pcpWindow.getPosition(),
        x = position[0],
        y = position[1];
    return x >= 0 && y >= 0;
};

/**
 * Shows the PCP window in the lower part of the primary display and focuses it.
 * Actually, the PCP window is always shown but it may be positioned off the screen.
 * This is a workaround for the flickering issue observed when the content displayed in
 * the PCP window changes. (Electron does not rerender web pages when the
 * `BrowserWindow` is hidden).
 * @param pcpWindow {Object} An Electron `BrowserWindow`.
 */
gpii.app.pcp.showPCPWindow = function (pcpWindow) {
    var screenSize = electron.screen.getPrimaryDisplay().workAreaSize,
        windowSize = pcpWindow.getSize(),
        windowX = screenSize.width - windowSize[0],
        windowY = screenSize.height - windowSize[1];
    pcpWindow.setPosition(windowX, windowY);
    pcpWindow.focus();
};


/**
 * A function which should be called to init various listeners related to
 * the PCP window.
 * @param pcp {Object} The `gpii.app.pcp` instance
 */
gpii.app.pcp.initPCPWindowListeners = function (pcp) {
    var pcpWindow = pcp.pcpWindow;
    pcpWindow.on("blur", function () {
        pcp.hide();
    });

    electron.screen.on("display-metrics-changed", function (event, display, changedMetrics) {
        if (changedMetrics.indexOf("workArea") > -1) {
            var windowSize = pcpWindow.getSize(),
                contentHeight = windowSize[1];
            pcp.resize(contentHeight, true);
        }
    });
};

/**
 * Initialises the connection between the Electron process and
 * the PCP's `BrowserWindow` instance
 *
 * @param pcp {Object} A `gpii.app.pcp` instance
 */
gpii.app.initPCPWindowIPC = function (app, pcp) {
    ipcMain.on("onPCPClose", function () {
        pcp.hide();
    });

    ipcMain.on("onKeyOut", function () {
        pcp.hide();
        app.keyOut();
    });

    ipcMain.on("onSettingAltered", function (event, arg) {
        pcp.events.onSettingAltered.fire(arg);
    });

    ipcMain.on("onActivePreferenceSetAltered", function (event, arg) {
        pcp.events.onActivePreferenceSetAltered.fire(arg.value);
    });

    ipcMain.on("onContentHeightChanged", function (event, contentHeight) {
        pcp.resize(contentHeight);
    });
};


/**
 * Hides the PCP window by moving it to a non-visible part of the screen. This function
 * in conjunction with `gpii.app.pcp.showPCPWindow` help avoid the flickering issue when
 * the content of the PCP window changes.
 * @param pcpWindow {Object} An Electron `BrowserWindow`.
 */
gpii.app.pcp.hidePCPWindow = function (pcpWindow) {
    var windowSize = pcpWindow.getSize(),
        width = windowSize[0],
        height = windowSize[1];
    pcpWindow.setPosition(-width, -height);
};

/**
 * Resizes the PCP window and positions it appropriately based on the new height
 * of its content. Makes sure that the window is no higher than the available
 * height of the work area in the primary display. The window will not be resized
 * if its current height is the same as the new height. This behaviour can be
 * overridden using the `forceResize` parameter.
 * @param pcp {Object} A `gpii.app.pcp` instance.
 * @param contentHeight {Number} The new height of the BrowserWindow's content.
 * @param minHeight {Number} The minimum height which the BrowserWindow must have.
 * @param forceResize {Boolean} Whether to resize the window even if the current
 * height of the `BrowserWindow` is the same as the new one. Useful when screen
 * DPI is changed as a result of the application of a user's preferences.
 */
gpii.app.pcp.resize = function (pcp, contentHeight, minHeight, forceResize) {
    var pcpWindow = pcp.pcpWindow,
        wasShown = pcp.isShown(),
        screenSize = electron.screen.getPrimaryDisplay().workAreaSize,
        windowSize = pcpWindow.getSize(),
        windowWidth = windowSize[0],
        initialHeight = windowSize[1],
        windowHeight = Math.min(screenSize.height, Math.max(contentHeight, minHeight));

    if (initialHeight === windowHeight && !forceResize) {
        return;
    }

    pcpWindow.setSize(windowWidth, windowHeight);

    if (wasShown) {
        pcp.show();
    }
};

/**
 * Sends a message to the given window
 *
 * @param pcpWindow {Object} An Electron `BrowserWindow` object
 * @param messageChannel {String} The channel to which the message to be sent
 * @param message {String}
 */
gpii.app.pcp.notifyPCPWindow = function (pcpWindow, messageChannel, message) {
    if (pcpWindow) {
        pcpWindow.webContents.send(messageChannel, message);
    }
};

/**
 * Creates an Electron `BrowserWindow` that is to be used as the PCP window
 *
 * @param {Object} windowOptions Raw options to be passed to the `BrowserWindow`
 * @returns {Object} The created Electron `BrowserWindow`
 */
gpii.app.pcp.makePCPWindow = function (windowOptions) {
    // TODO Make window size relative to the screen size
    var pcpWindow = new BrowserWindow(windowOptions);

    var url = fluid.stringTemplate("file://%gpii-app/src/pcp/index.html", fluid.module.terms());
    pcpWindow.loadURL(url);

    gpii.app.pcp.hidePCPWindow(pcpWindow);

    return pcpWindow;
};

/**
 * This function takes care of notifying the PCP window whenever the
 * user changes the accent color of the OS theme. Available only if
 * the application is used on Windows 10.
 * @param pcp {Object} The `gpii.app.pcp` instance
 */
gpii.app.pcp.registerAccentColorListener = function (pcp) {
    if (gpii.app.isWin10OS()) {
        // Ideally when the PCP window is created, it should be notified about
        // the current accent color. Possible events which can be used for this
        // purpose are "ready-to-show" or "show". However, as the window is drawn
        // off screen, registering the listeners will happen after the corresponding
        // event has been fired. That is why the PCP window should be notified every
        // time it is focused (only the first time is insufficient because showing
        // the window (even off screen) automatically focuses it).
        pcp.pcpWindow.on("focus", function () {
            pcp.notifyPCPWindow("onAccentColorChanged", systemPreferences.getAccentColor());
        });

        systemPreferences.on("accent-color-changed", function (event, accentColor) {
            pcp.notifyPCPWindow("onAccentColorChanged", accentColor);
        });
    }
};
