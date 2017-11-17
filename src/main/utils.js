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
 * Sends a message to the given window
 *
 * @param window {Object} An Electron `BrowserWindow` object
 * @param messageChannel {String} The channel to which the message to be sent
 * @param message {String}
 */
app.notifyWindow = function (window, messageChannel, message) {
    if (window) {
        window.webContents.send(messageChannel, message);
    }
};
