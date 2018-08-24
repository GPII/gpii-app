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
 * Executes a JavaScript snippet in the `BrowserWindow` of the given dialog.
 * @param {BrowserWindow} dialog - The `BrowserWindow` in which the script is
 * to be executed.
 * @param {String} command - A string representing the JavaScript code to be
 * executed.
 * @return {Promise} - A promise which is resolved when the JavaScript code is
 * executed.
 */
gpii.test.executeJavascript = function (dialog, command) {
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
gpii.test.executeJavascriptDelayed = function (dialog, command, delay) {
    var promise = fluid.promise();

    promise.then(function () {
        return gpii.test.executeJavascript(dialog, command);
    });

    setTimeout(function () {
        promise.resolve();
    }, delay);

    return promise;
};
