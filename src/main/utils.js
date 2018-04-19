/**
 * PSP utility functions
 *
 * A set of utility function used throughout the components used in the main process of the PSP.
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

var os       = require("os");
var fluid    = require("infusion");
var electron = require("electron");

var gpii = fluid.registerNamespace("gpii");
fluid.registerNamespace("gpii.app");

/**
 * Returns whether the underlying OS is Windows 10 or not.
 * @return {Boolean} `true` if the underlying OS is Windows 10 or
 * `false` otherwise.
 */
gpii.app.isWin10OS = function () {
    var osRelease = os.release(),
        delimiter = osRelease.indexOf("."),
        majorVersion = osRelease.slice(0, delimiter);
    return majorVersion === "10";
};

/**
 * Gets the desired bounds (i.e. the coordinates and the width and height, the latter two being restricted by the
 * corresponding dimensions of the primary display) of an Electron `BrowserWindow` given its width and height. If used
 * in the `window.setBounds` function of the `BrowserWindow`, the window will be positioned in  the lower right corner
 * of the primary display.
 *
 * @param {Number} width - The width of the `BrowserWindow`.
 * @param {Number} height - The height of the `BrowserWindow`.
 * @return {{x: Number, y: Number, width: Number, height: Number}} - The bounds represented as an object.
*/
gpii.app.getDesiredWindowBounds = function (width, height) {
    var screenSize = electron.screen.getPrimaryDisplay().workAreaSize;
    width = Math.ceil(Math.min(width, screenSize.width));
    height = Math.ceil(Math.min(height, screenSize.height));
    return {
        x: Math.ceil(screenSize.width - width),
        y: Math.ceil(screenSize.height - height),
        width: width,
        height: height
    };
};

/**
 * Positions an Electron `BrowserWindow` in the lower right corner of
 * the primary display.
 *
 * @param {BrowserWindow} dialogWindow - The window which is to be positioned.
 */
gpii.app.positionWindow = function (dialogWindow) {
    var size = dialogWindow.getSize(),
        bounds = gpii.app.getDesiredWindowBounds(size[0], size[1]);
    dialogWindow.setPosition(bounds.x, bounds.y);
};

/**
 * A function which capitalizes its input text. It does nothing if the provided argument is `null` or `undefined`.
 *
 * @param {String} text - The input text.
 * @return {String} the capitalized version of the input text.
 */
gpii.app.capitalize = function (text) {
    if (fluid.isValue(text)) {
        return text.charAt(0).toUpperCase() + text.slice(1);
    }
};

/**
 * Sends a message to the given Electron `BrowserWindow`
 *
 * @param {Object} browserWindow - An Electron `BrowserWindow` object
 * @param {String} messageChannel - The channel to which the message to be sent
 * @param {String} message - The message to be sent.
 */
gpii.app.notifyWindow = function (browserWindow, messageChannel, message) {
    if (browserWindow) {
        browserWindow.webContents.send(messageChannel, message);
    }
};

/*
 * A simple wrapper for the native timeout. Responsible for clearing the interval
 * upon component destruction.
 */
fluid.defaults("gpii.app.timer", {
    gradeNames: ["fluid.modelComponent"],

    members: {
        timer: null
    },

    listeners: {
        "onDestroy.clearTimer": "{that}.clear"
    },

    events: {
        onTimerFinished: null
    },

    invokers: {
        start: {
            funcName: "gpii.app.timer.start",
            args: [
                "{that}",
                "{arguments}.0" // timeoutDuration
            ]
        },
        clear: {
            funcName: "gpii.app.timer.clear",
            args: ["{that}"]
        }
    }
});

/**
 * Starts a timer. In `timeoutDuration` milliseconds, the `onTimerFinished` event will be fired. Any previously
 * registered timers will be cleared upon the invokation of this function.
 *
 * @param {Component} that -The `gpii.app.timer` instance.
 * @param {Number} timeoutDuration -The timeout duration in milliseconds.
 */
gpii.app.timer.start = function (that, timeoutDuration) {
    that.clear();
    that.timer = setTimeout(that.events.onTimerFinished.fire, timeoutDuration);
};

/**
 * Clears the timer.
 *
 * @param {Component} that -The `gpii.app.timer` instance.
 */
gpii.app.timer.clear = function (that) {
    if (that.timer) {
        clearTimeout(that.timer);
        that.timer = null;
    }
};
