/**
 * Dialog that is showed always in the center of the screen
 *
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

var fluid = require("infusion");
var gpii  = fluid.registerNamespace("gpii");

require("./resizable.js");

fluid.registerNamespace("gpii.app.dialog");


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

gpii.app.centeredDialog.setBounds = function (that, width, height) {
    width  = width || that.width;
    height = height || that.height;
    that.width = width;
    that.heigh = height;

    var position = gpii.browserWindow.computeCentralWindowPosition(width, height),
        bounds = gpii.browserWindow.computeWindowBounds(width, height, position.x, position.y);

    that.dialog.setBounds(bounds);
};
