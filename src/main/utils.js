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
