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

var os       = require("os");
var fluid    = require("infusion");
var electron = require("electron");

var app = fluid.registerNamespace("gpii.app");


/**
 * Returns whether the underlying OS is Windows 10 or not.
 * @return {Boolean} `true` if the underlying OS is Windows 10 or
 * `false` otherwise.
 */
app.isWin10OS = function () {
    var osRelease = os.release(),
        delimiter = osRelease.indexOf("."),
        majorVersion = osRelease.slice(0, delimiter);
    return majorVersion === "10";
};

/**
* Get the position of `Electron` `BrowserWindows`
* @param width {Number} The current width of the window
* @param height {Number} The current height of the window
* @return {{x: Number, y: Number}}
*/
app.getWindowPosition = function (width, height) {
    var screenSize = electron.screen.getPrimaryDisplay().workAreaSize;
    return {
        x: screenSize.width - width,
        y: screenSize.height - height
    };
};

/**
 * Set the position of the Electorn `BrowserWindow` element.
 * @param dialogWindow {BrowserWindow} The window which is to be positioned
 * @param position {Object} The position where the window to be placed
 * @param position.x {Number}
 * @param position.y {Number}
 */
app.setWindowPosition = function (dialogWindow, position) {
    dialogWindow.setPosition(position.x, position.y);
};

/**
 * A function which capitalizes its input text. It does nothing
 * if the provided argument is `null` or `undefined`.
 * @param text {String} The input text.
 * @return {String} the capitalized version of the input text.
 */
app.capitalize = function (text) {
    if (fluid.isValue(text)) {
        return text.charAt(0).toUpperCase() + text.slice(1);
    }
};

/**
 * Sends a message to the given Electron `BrowserWindow`
 *
 * @param window {Object} An Electron `BrowserWindow` object
 * @param messageChannel {String} The channel to which the message to be sent
 * @param message {String}
 */
app.notifyWindow = function (browserWindow, messageChannel, message) {
    if (browserWindow) {
        browserWindow.webContents.send(messageChannel, message);
    }
};

/**
 * Checks whether two objects are equal by using `JSON.stringify` internally.
 * This  means that if the compared values are arrays or objects, the ordering
 * of the elements/properties within them matters.
 * @return {Boolean} `true` if the values are equal and `false` otherwise.
 */
app.equalsAsJSON = function (obj1, obj2) {
    return JSON.stringify(obj1) === JSON.stringify(obj2);
};


/**
 * Collect all subcomponents for the given component
 * @param that {Component} The components holder
 * @return {Component[]} The list of subcomponents
 */
app.getSubcomponents = function (that) {
    return fluid
        .values(that)
        .filter(fluid.isComponent);
};


/*
 * A simple wrapper for the native timeout. Responsible for clearing the interval
 * upon component destruction.
 */
fluid.defaults("gpii.app.timer", {
    gradeNames: ["fluid.modelComponent"],

    model: {
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
            funcName: "timer",
            args: [
                "@expand:setTimeout({that}.events.onTimerFinished.fire, {arguments}.0)"
            ]
        },
        clear: {
            funcName: "clearTimeout",
            args: "{that}.model.timer"
        }
    }
});


/*
 * A simple wrapper for the native interval. Responsible for clearing the interval
 * upon component destruction.
 */
fluid.defaults("gpii.app.interval", {
    gradeNames: ["fluid.modelComponent"],

    model: {
        interval: null
    },

    listeners: {
        "onDestroy.clearInterval": "{that}.clear"
    },

    events: {
        onIntervalTick: null
    },

    invokers: {
        start: {
            changePath: "interval",
            value: "@expand:setInterval({that}.events.onIntervalTick.fire, {arguments}.0)"
        },
        clear: {
            funcName: "clearInterval",
            args: "{that}.model.interval"
        }
    }
});
