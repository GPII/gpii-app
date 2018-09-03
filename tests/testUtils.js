/*
 * Useful functions for tests
 *
 * Copyright 2017 OCAD University
 *
 * Licensed under the New BSD license. You may not use this file except in
 * compliance with this License.
 *
 * The research leading to these results has received funding from the European Union's
 * Seventh Framework Programme (FP7/2007-2013)
 * under grant agreement no. 289016.
 *
 * You may obtain a copy of the License at
 * https://github.com/GPII/universal/blob/master/LICENSE.txt
 */

"use strict";

var fluid = require("infusion"),
    gpii = fluid.registerNamespace("gpii");

fluid.registerNamespace("gpii.test");

/**
 * Executes a JavaScript snippet in the `BrowserWindow` of the given dialog.
 * @param {BrowserWindow} dialog - The `BrowserWindow` in which the script is
 * to be executed.
 * @param {String} command - A string representing the JavaScript code to be
 * executed.
 * @return {Promise} - A promise which is resolved when the JavaScript code is
 * executed.
 */
gpii.test.executeCommand = function (dialog, command) {
    return dialog.webContents.executeJavaScript(command, true);
};

/**
 * Executes a JavaScript snippet in the `BrowserWindow` of the given dialog
 * after a certain delay has passed.
 * @param {BrowserWindow} dialog - The `BrowserWindow` in which the script is
 * to be executed.
 * @param {String} command - A string representing the JavaScript code to be
 * executed.
 * @param {Number} delay - The delay after which the JavaScript code should be
 * executed.
 * @return {Promise} - A promise which is resolved when the JavaScript code is
 * executed.
 */
gpii.test.executeCommandDelayed = function (dialog, command, delay) {
    var promise = fluid.promise();

    promise.then(function () {
        return gpii.test.executeCommand(dialog, command);
    });

    setTimeout(function () {
        promise.resolve();
    }, delay);

    return promise;
};
