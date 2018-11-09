/**
 * A centered on the screen dialog
 *
 * Dialog that is showed always in the center of the screen
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

var fluid = require("infusion");
var gpii  = fluid.registerNamespace("gpii");

fluid.registerNamespace("gpii.app.dialog");

/**
 * A component representing a dialog which should be positioned in the center
 * of the screen.
 */
fluid.defaults("gpii.app.centeredDialog", {
    gradeNames: ["gpii.app.dialog"],

    invokers: {
        setPosition: {
            funcName: "gpii.app.centeredDialog.setBounds",
            args: [
                "{that}",
                "{that}.width",
                "{that}.height"
            ]
        },
        setBounds: {
            funcName: "gpii.app.centeredDialog.setBounds",
            args: [
                "{that}",
                "{arguments}.0", // width
                "{arguments}.1"  // height
            ]
        }
    }
});

/**
 * Sets the desired bounds (i.e. the coordinates and dimensions) of an
 * Electron `BrowserWindow` given its (possibly new) width and height
 * so that it is positioned centrally on the screen.
 * @param {Component} that - The `gpii.app.centeredDialog` instance.
 * @param {Number} width - The width of the `BrowserWindow`.
 * @param {Number} height - The height of the `BrowserWindow`.
 */
gpii.app.centeredDialog.setBounds = function (that, width, height) {
    width  = width || that.width;
    height = height || that.height;

    var position = gpii.browserWindow.computeCentralWindowPosition(width, height),
        bounds = gpii.browserWindow.computeWindowBounds(width, height, position.x, position.y);

    that.width = bounds.width;
    that.height = bounds.height;

    that.dialog.setBounds(bounds);
};
