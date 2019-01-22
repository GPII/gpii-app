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
    jqUnit = fluid.require("node-jqunit", require, "jqUnit"),
    gpii = fluid.registerNamespace("gpii");

fluid.registerNamespace("gpii.test");

/**
 * Simple utility to change an object array into a map with
 * keys - a specified objects' property that is unique for all elements.
 */

gpii.test.objectArrayToHash = function (array, key) {
    return fluid.isArrayable(array) && array.reduce(function (acc, value) {
        acc[value[key]] = value;
        return acc;
    }, {});
};


/**
 * Check whether the actual object is a superset in deep manner of the expected object - the actual object has
 * at least all of the properties and sub-properties of the expected object.
 * This function is slower than `jqUnit.assertLeftHand` but allows assertion on more then just the top-most properties.
 * @param {String} message - The message to be shown in case of error
 * @param {Object} expected - The subset of properties that are expected
 * @param {Object} actual - The superset of keys that are to be tested
 * @return {Boolean} - The success of the operation
 */
gpii.test.assertLeftHandDeep = function (message, expected, actual) {
    /**
     * Get an object that represents the interception of the keys of two objects.
     * It does a deep interception.
     * @param {Object} obj1 - The first object
     * @param {Object} obj2 - The second object
     * @return {Object} - The interception of the objects
     */
    function filterKeysDeep(obj1, obj2) {
        var subsetObject = fluid.filterKeys(obj1, fluid.keys(obj2));

        // intersect sub-keys
        fluid.each(obj2, function (value, key) {
            if (fluid.isPlainObject(value, true) && fluid.isPlainObject(subsetObject[key], true)) {
                subsetObject[key] = filterKeysDeep(subsetObject[key], value);
            }
        });

        return subsetObject;
    }

    return jqUnit.assertDeepEq(message, expected, filterKeysDeep(actual, expected));
};

/**
 * Returns a promise which will be resolved in `delayed` milliseconds. Can be
 * used in test sequences for debugging purposes. Example usage:
 * {
 *     task: "gpii.tests.qss.linger",
 *     args: [2000],
 *     resolve: "fluid.identity"
 * }
 * @param {Number} delay - The delay after which the JavaScript code should be
 * executed.
 * @return {Promise} - The promise to be resolved.
 */
gpii.test.linger = function (delay) {
    var promise = fluid.promise();

    setTimeout(function () {
        promise.resolve();
    }, delay);

    return promise;
};


/**
 * Creates an IIFE string version of the passed function. Currently this is used
 * for executing commands in the BrowserWindows.
 * @param {Function} func - The function that is to be "decorated"
 * @return {String} - The function wrapped in IIFE
 */
gpii.test.toIIFEString = function (func) {
    return fluid.stringTemplate("(%func)()", { func: func.toString() });
};


// For DEV purposes
/**
 * Add a blocking element to the sequence that can be resolved
 * by pressing "Space". This is useful if we want to pause tests
 * execution at some point and run diagnostics inside created
 * BrowserWindows.
 *
 * @return {Promise} The blocking task promise
 */
gpii.tests.blockTestsElement = function () {
    var _promise = fluid.promise();

    function resolveTaskOnSpacebar() {
        var electron = require("electron");
        // Restore tests running cycle
        electron.app.on("ready", function () {
            electron.globalShortcut.register("Space", function () {
                console.log("Go Go Go!");
                _promise.resolve();
            });
        });
    }

    resolveTaskOnSpacebar();

    return _promise;
};




/**
 * Executes a JavaScript snippet in the `BrowserWindow` of the given dialog.
 *
 * N.B. In order for this function to behave properly you should ensure that
 * the BrowserWindow's DOM is fully loaded. This could be achieved in two ways:
 * - either wait for the dialog's `onDialogReady` event, which should waits both for the js
 *   and the DOM of the dialog to load in case the dialog code is of the current pattern;
 * - or listen for the dom-ready event - https://github.com/electron/electron/blob/master/docs/api/web-contents.md#event-dom-ready
 * @param {BrowserWindow} dialog - The `BrowserWindow` in which the script is
 * to be executed.
 * @param {String} command - A string representing the JavaScript code to be
 * executed.
 * @return {Promise} - A promise which is resolved when the JavaScript code is
 * executed.
 */
gpii.test.executeJavaScriptInWebContents = function (dialog, command) {
    return dialog.webContents.executeJavaScript(command, true);
};


/**
 * Invokes a JavaScript function in the `BrowserWindow` of the given dialog.
 * It simply transforms the function and passes it to `gpii.test.executeJavaScriptInWebContents`
 * @param {BrowserWindow} dialog - The `BrowserWindow` in which the script is
 * to be executed.
 * @param {Function} func - The function that is to be invoked inside the BrowserWindow
 * @return {Promise} - A promise which is resolved when the JavaScript code is
 * executed.
 */
gpii.test.invokeFunctionInWebContents = function (dialog, func) {
    return gpii.test.executeJavaScriptInWebContents(dialog, gpii.test.toIIFEString(func));
};

/**
 * Invokes a JavaScript function in the `BrowserWindow` of the given dialog.
 * Similar to `executeJavaScriptInWebContentsDelayed` invokes the function with a delay.
 * @param {BrowserWindow} dialog - The `BrowserWindow` in which the script is
 * to be executed.
 * @param {Function} func - The function that is to be invoked inside the BrowserWindow
 * @param {Number} delay - The delay after which the function should be invoked
 * @return {Promise} - A promise which is resolved when the JavaScript code is
 * executed.
 */
gpii.test.invokeFunctionInWebContentsDelayed = function (dialog, func, delay) {
    var promise = fluid.promise();

    setTimeout(function () {
        gpii.test.invokeFunctionInWebContents(dialog, func).then(function (result) {
            promise.resolve(result);
        }, function (error) {
            promise.reject(error);
        });
    }, delay);

    return promise;
};

/**
 * Executes a JavaScript snippet in the `BrowserWindow` of the given dialog
 * after a certain delay has passed.
 * There might be the case that waiting for the `onDialogReady` is somehow insufficient. This
 * function could be used to ensure that the dialog if fully loaded before executing the script.
 * @param {BrowserWindow} dialog - The `BrowserWindow` in which the script is
 * to be executed.
 * @param {String} command - A string representing the JavaScript code to be
 * executed.
 * @param {Number} delay - The delay after which the JavaScript code should be
 * executed.
 * @return {Promise} - A promise which is resolved when the JavaScript code is
 * executed.
 */
gpii.test.executeJavaScriptInWebContentsDelayed = function (dialog, command, delay) {
    var promise = fluid.promise();

    setTimeout(function () {
        gpii.test.executeJavaScriptInWebContents(dialog, command).then(function (result) {
            promise.resolve(result);
        }, function (error) {
            promise.reject(error);
        });
    }, delay);

    return promise;
};
