/**
 * Hide `gpii.app.dialog` off screen
 *
 * An enhancement that replaces the original `show` and `hide`
 * BrowserWindow methods with ones that hide the component off screen.
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

fluid.registerNamespace("gpii.app.dialog.offScreenHidable");


// Mixin
fluid.defaults("gpii.app.dialog.offScreenHidable", {
    config: {
        positionOnInit: false,
        offScreenHide: true
    },

    invokers: {
        _show: {
            funcName: "gpii.app.dialog.offScreenHidable.moveOnScreen",
            args: [
                "{that}",
                "{arguments}.0" // showInactive
            ]
        },
        _hide: {
            funcName: "gpii.app.dialog.offScreenHidable.moveOffScreen",
            args: ["{that}.dialog"]
        },
        setPosition: {
            funcName: "gpii.app.dialog.offScreenHidable.setBounds",
            args: [
                "{that}",
                "{that}.options.config.restrictions",
                "{that}.width",
                "{that}.height",
                "{arguments}.0", // offsetX
                "{arguments}.1"  // offsetY
            ]
        },
        setBounds: {
            funcName: "gpii.app.dialog.offScreenHidable.setBounds",
            args: [
                "{that}",
                "{that}.options.config.restrictions",
                "{arguments}.0", // width
                "{arguments}.1", // height
                "{arguments}.2", // offsetX
                "{arguments}.3"  // offsetY
            ]
        }
    }
});

/**
 * Shows the PSP window by moving it to the lower right part of the screen and changes
 * the `isShown` model property accordingly.
 * @param {Component} psp - The `gpii.app.psp` instance.
 */
gpii.app.dialog.offScreenHidable.moveOnScreen = function (that, showInactive) {
    // Move to screen
    that.setPosition();
    if (!showInactive) {
        that.dialog.focus();
    }
};

/**
 * Moves the BrowserWindow to a non-visible part of the screen. This function in conjunction
 * with `gpii.browserWindow.moveToScreen` help avoid the flickering issue when the content
 * of the PSP window changes.
 * @param {Object} window - An Electron `BrowserWindow`.
 */
gpii.app.dialog.offScreenHidable.moveOffScreen = function (dialog) {
    // Move the BrowserWindow so far away that even if there is an additional screen attached,
    // it will not be visible. It appears that the min value for the `BrowserWindow`
    // position can be -Math.pow(2, 31). Any smaller values lead to an exception.
    var coordinate = -Math.pow(2, 20);
    var size = dialog.getSize();
    // XXX using `setBounds` because of a related Electron issue https://github.com/electron/electron/issues/9477
    dialog.setBounds({
        width:  size[0],
        height: size[1],
        x:      coordinate,
        y:      coordinate
    });
};

gpii.app.dialog.offScreenHidable.setBounds = function (that, restrictions, width, height, offsetX, offsetY) {
    if (that.model.isShown) {
        // simply redirect to work as a normal dialog bounds change
        gpii.app.dialog.setBounds(that, restrictions, width, height, offsetX, offsetY);
    } else {
        // we don't want to move it to screen (visible area)
        that.setRestrictedSize(width, height);

        // only save the new position without applying it
        offsetX  = fluid.isValue(offsetX) ? offsetX : that.model.offset.x;
        offsetY  = fluid.isValue(offsetY) ? offsetY : that.model.offset.y;
        that.applier.change("offset", { x: offsetX, y: offsetY });
    }
};
