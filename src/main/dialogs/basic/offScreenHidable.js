/**
 * Hides a `gpii.app.dialog` off screen
 *
 * An enhancement that replaces the original `show` and `hide`
 * `BrowserWindow` methods with ones that hide the component off screen.
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

/**
 * This mixin adds functionality that modifies the built-in `hide` method of the
 * `BrowserWindow` so that when it is invoked, the window will be moved off
 * screen instead of hidden. This may be useful in cases where the content of the
 * dialog needs to be changed even if the dialog is not visible (DOM manipulations
 * do not occur when a Chromium window is hidden).
 */
fluid.defaults("gpii.app.dialog.offScreenHidable", {
    offScreenPosition: {
        // Use a convenient position when moving it off the Primary display, so that
        // it doesn't overlap with another display.
        // It seems less likely to have a display bellow the primary display so position it there.
        // This would lower the chances of using the "safer" show method.
        x: 100, // ensure we're in the horizontal bounds of the primary display
        y: "@expand:Math.pow(2, 20)"
    },

    config: {
        positionOnInit: false,
        hideOffScreen: true
    },

    listeners: {
        "onCreate.prepareOffScreenWindow": {
            funcName: "gpii.app.dialog.offScreenHidable.init",
            args: ["{that}"]
        }
    },

    invokers: {
        showImpl: {
            funcName: "gpii.app.dialog.offScreenHidable.moveToScreen",
            args: [
                "{that}",
                "{arguments}.0" // showInactive
            ]
        },
        hideImpl: {
            funcName: "gpii.app.dialog.offScreenHidable.moveOffScreen",
            args: ["{that}"]
        },
        setPosition: {
            funcName: "gpii.app.dialog.offScreenHidable.setBounds",
            args: [
                "{that}",
                "{that}.options.config.restrictions",
                "{that}.model.width",
                "{that}.model.height",
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
 * Apply any additional options to the BrowserWindow that are related to the off-screen hiding mechanism.
 * @param {Component} that - The `gpii.app.dialog` instance
 */
gpii.app.dialog.offScreenHidable.init = function (that) {
    // use the move offscreen approach
    that.hideImpl();
    // to avoid flicker on creation, the dialog is hidden at first
    that.dialog.show();
};

/**
 * Shows the BrowserWindow more "safely".
 * This handles an issue that is related to the approach we are using to hide BrowserWindows offscreen
 * and is only present in the case when there are more than one displays with different scale factors.
 * Note that this approach resizes and positions the dialog correctly but results in flicker. On the other
 * hand it should be used rather rarely.
 *
 * In the current Electron version (3.0.2) the low level BrowserWindow
 * `setBounds` method updates the metrics of the dialog using the scaleFactor of the closest display.
 * As we're moving the BrowserWindow to some position away from the main display when hiding, it
 * might be the case that it becomes relative to a display that is different from the primary display (as
 * it is closer to the other display). In case the closes display is different from the main display
 * and both displays' scaleFactors differ, the BrowserWindow will be incorrectly resized and repositioned
 * to the Primary display as it's calculations would be based on the non-primary display.
 *
 * In order for the BrowserWindow to use correct scaling factor for resizing and repositioning, we first
 * move it to the primary display and after that update its bounds.
 * @param {Component} that - The `gpii.app.dialog` instance
 */
gpii.app.dialog.offScreenHidable.moveFromDifferentDisplay = function (that) {
    // At first we'd need to move the dialog to the primary display
    that.setBounds();
    // Then resize it according to the Main display scale factor
    that.setBounds();
};


/**
 * Shows the dialog and focuses it if necessary.
 * Note that in case the BrowserWindow is related to a display that has a scale factor different from
 * the one that the Main Display has, so we need to use a "safer" displaying mechanism.
 * Refer to "gpii.app.dialog.offScreenHidable.moveFromDifferentDisplay" for further details.
 * @param {Component} that - The `gpii.app.dialog.offScreenHidable` instance.
 * @param {Boolean} showInactive - Whether the window should be shown but
 * without giving focus to it.
 */
gpii.app.dialog.offScreenHidable.moveToScreen = function (that, showInactive) {
    var screen = require("electron").screen;
    var relativeToPrimaryDisplay =
        gpii.app.getPrimaryDisplay().scaleFactor === screen.getDisplayMatching(that.dialog.getBounds()).scaleFactor;

    if (relativeToPrimaryDisplay) {
        // trigger a simple show operation
        that.setPosition();
    } else {
        // Use the safer show mechanism
        fluid.log("offScreenHidable - using the safer show to primary display");
        gpii.app.dialog.offScreenHidable.moveFromDifferentDisplay(that);
    }

    if (!showInactive) {
        that.dialog.focus();
    }
};

/**
 * Moves the `BrowserWindow` to a non-visible part of the screen. This function in
 * conjunction with `gpii.app.dialog.offScreenHidable.moveToScreen` helps avoid the
 * flickering issue when the content of the dialog changes.
 * @param {Component} that - The `gpii.app.dialog` instance
 */
gpii.app.dialog.offScreenHidable.moveOffScreen = function (that) {
    // Move the BrowserWindow so far away that even if there is an additional screen attached,
    // it will not be visible. It appears that the min value for the `BrowserWindow`
    // position can be -Math.pow(2, 31). Any smaller values lead to an exception.
    var coordinate = that.options.offScreenPosition;
    // We might use `setBounds` instead to avoid resize of the window but the dialog will
    // be repositioned using `setBounds` which will restore its correct size
    that.dialog.setPosition(coordinate.x, coordinate.y);
};

/**
 * Resizes the current window and if it is visible on screen, positions it appropriately.
 * @param {Component} that - The `gpii.app.dialog` instance.
 * @param {Object} restrictions - Restrictions for resizing and positioning the window.
 * @param {Number} width - The new width for the window.
 * @param {Number} height - The new height for the window.
 * @param {Number} offsetX - The x offset from the right edge of the screen.
 * @param {Number} offsetY - The y offset from the bottom edge of the screen.
 */
gpii.app.dialog.offScreenHidable.setBounds = function (that, restrictions, width, height, offsetX, offsetY) {
    if (that.model.isShown) {
        // simply redirect to work as a normal dialog bounds change
        gpii.app.dialog.setBounds(that, restrictions, width, height, offsetX, offsetY);
    } else {
        // we don't want to move it to screen (visible area)
        that.setRestrictedSize(width, height);

        // only save the new offset without applying it
        offsetX  = fluid.isValue(offsetX) ? offsetX : that.model.offset.x;
        offsetY  = fluid.isValue(offsetY) ? offsetY : that.model.offset.y;
        that.applier.change("offset", { x: offsetX, y: offsetY });
    }
};
