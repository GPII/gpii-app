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

var os            = require("os");
var fluid         = require("infusion");
var electron      = require("electron"),
    BrowserWindow = electron.BrowserWindow;

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


fluid.registerNamespace("gpii.browserWindow");


gpii.browserWindow.computeWindowSize = function (width, height, offsetX, offsetY) {
    // ensure proper values are given
    offsetX = Math.max(0, (offsetX || 0));
    offsetY = Math.max(0, (offsetY || 0));

    var screenSize = electron.screen.getPrimaryDisplay().workAreaSize;
    // Restrict the size of the window according to its position
    // we want our windows to be fully visible
    var maxWidth = screenSize.width - offsetX;
    var maxHeight = screenSize.height - offsetY;

    var optimalWidth  = Math.min(width, maxWidth);
    var optimalHeight = Math.min(height, maxHeight);

    return {
        width:  Math.ceil(optimalWidth),
        height: Math.ceil(optimalHeight)
    };
};

/**
 * Compute the position of the given window from the bottom right corner.
 * It ensures that the window is not positioned outside of the screen.
 *
 * @param {Number} width - The width of the `BrowserWindow`.
 * @param {Number} height - The height of the `BrowserWindow`.
 * @param {Number} offsetY - The y bottom offset.
 * @param {Number} offsetX - The x right offset.
 * @return {{x: Number, y: Number}} The desired window position
 */
gpii.browserWindow.computeWindowPosition = function (width, height, offsetX, offsetY) {
    // ensure proper values are given
    offsetX = Math.max(0, (offsetX || 0));
    offsetY = Math.max(0, (offsetY || 0));

    var screenSize = electron.screen.getPrimaryDisplay().workAreaSize;
    var desiredX,
        desiredY;

    // position relatively to the bottom right corner
    // note that as offset is positive we're restricting window
    // from being position outside the screen to the right
    desiredX = Math.ceil(screenSize.width - (width + offsetX));
    desiredY = Math.ceil(screenSize.height - (height + offsetY));

    // restrict to the window to to exit from the left side
    desiredX = Math.max(desiredX, 0);
    desiredY = Math.max(desiredY, 0);

    return {
        x: desiredX,
        y: desiredY
    };
};

gpii.browserWindow.computeCentralWindowPosition = function (width, height) {
    var screenSize = electron.screen.getPrimaryDisplay().workAreaSize,
        desiredX = Math.ceil((screenSize.width - width) / 2),
        desiredY = Math.ceil((screenSize.height - height) / 2);

    desiredX = Math.max(desiredX, 0);
    desiredY = Math.max(desiredY, 0);

    return {
        x: desiredX,
        y: desiredY
    };
};


/**
 * Gets the desired bounds (i.e. the coordinates and the width and
 * height, the latter two being restricted by the corresponding
 * dimensions of the primary display) of an Electron `BrowserWindow`
 * given its width and height. If used in the `window.setBounds`
 * function of the `BrowserWindow`, the window will be positioned
 * in  the lower right corner of the primary display.
 * @param width {Number} The width of the `BrowserWindow`.
 * @param height {Number} The height of the `BrowserWindow`.
 * @param {Number} offsetX - The x right offset.
 * @param {Number} offsetY - The y bottom offset.
 * @return {{x: Number, y: Number, width: Number, height: Number}}
 */
gpii.browserWindow.computeWindowBounds = function (width, height, offsetX, offsetY) {
    // restrict offset to be positive
    var position = gpii.browserWindow.computeWindowPosition(width, height, offsetX, offsetY);
    var size = gpii.browserWindow.computeWindowSize(width, height, offsetX, offsetY);

    console.log("Desired Bounds: ", arguments, size, position);

    return {
        x:      position.x,
        y:      position.y,
        width:  size.width,
        height: size.height
    };
};

gpii.browserWindow.getCenterWindowBounds = function (width, height) {
    var position = gpii.browserWindow.computeCentralWindowPosition(width, height),
        size = gpii.browserWindow.computeWindowSize(width, height);
    return {
        x:      position.x,
        y:      position.y,
        width:  size.width,
        height: size.height
    };
};

/**
 * Positions an Electron `BrowserWindow` in the lower right corner of
 * the primary display.
 *
 * @param {BrowserWindow} dialogWindow - The window which is to be positioned.
 */
gpii.browserWindow.setPosition = function (dialogWindow, offsetX, offsetY) {
    var size = dialogWindow.getSize(),
        position = gpii.browserWindow.computeWindowPosition(size[0], size[1], offsetX, offsetY);

    dialogWindow.setPosition(position.x, position.y);
};

// gpii.browserWindow.setSize = function (dialogWindow, width, height) {
//     var size = gpii.browserWindow.computeWindowSize(width, height, 0, 0);

//     dialogWindow.setSize(size.width, size.height);
// };

// gpii.browserWindow.setBounds = function (dialogWindow, width, height, offsetX, offsetY) {
//     var size = gpii.browserWindow.computeWindowBounds(width, height, offsetX, offsetY);

//     dialogWindow.setBounds(size.width, size.height);
// };


/**
 * Moves the window back to the visible screen. This function in conjunction with `gpii.browserWindow.moveOffScreen`
 * help avoid the flickering issue when the content of the PSP window changes.
 *
 * @param {Object} window - An Electron `BrowserWindow`.
 * @param {Object} offset - The exact position the window to be moved to relative
 */
gpii.browserWindow.moveToScreen = function (window, offset) {
    // TODO fit window in screen
    gpii.browserWindow.setPosition(window, offset.x || 0, offset.y || 0);
};

/**
 * Moves the BrowserWindow to a non-visible part of the screen. This function in conjunction
 * with `gpii.browserWindow.moveToScreen` help avoid the flickering issue when the content
 * of the PSP window changes.
 * @param {Object} window - An Electron `BrowserWindow`.
 */
gpii.browserWindow.moveOffScreen = function (window) {
    // Move the BrowserWindow so far away that even if there is an additional screen attached,
    // it will not be visible. It appears that the min value for the `BrowserWindow`
    // position can be -Math.pow(2, 31). Any smaller values lead to an exception.
    var coordinate = -Math.pow(2, 20);
    window.setPosition(coordinate, coordinate);
};

gpii.browserWindow.isWindowFocused = function (grade) {
    var focusedWindow = BrowserWindow.getFocusedWindow();

    if (focusedWindow && focusedWindow.gradeNames) {
        return focusedWindow.gradeNames.slice(-1)[0] === grade;
    }
    return false;
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

/**
 * Checks if a hash is not empty, i.e. if it contains at least one key.
 * Note that the values are not examined.
 * @param {Object} hash - An arbitrary object.
 * @return {Boolean} `true` is the hash has at least one key and `false` otherwise.
 */
gpii.app.isHashNotEmpty = function (hash) {
    return hash && fluid.keys(hash).length > 0;
};

/**
 * Set proper context for arrays.
 * This is needed in order for arrays to pass the more strict
 * check of: `instanceof array`. In general such checks are to be avoided
 * in favor of the `fluid.isArray` function, but is useful when dealing with
 * third party dependencies.
 * Related to: https://github.com/electron/electron/issues/12698
 *
 * @param {Object|Array} object - The object/array that needs to have its contexts fixed.
 * @return {Object} The fixed object
 */
gpii.app.recontextualise = function (object) {
    if (!fluid.isPlainObject(object)) {
        return;
    }
    if (fluid.isArrayable(object)) {
        object = [].slice.call(object);
    }

    fluid.each(object, function (value, key) {
        if (fluid.isArrayable(object[key])) {
            object[key] = [].slice.call(object[key]);
        }
        gpii.app.recontextualise(object[key]);
    });

    return object;
};
