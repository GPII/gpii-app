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

fluid.registerNamespace("gpii.tests");

/**
 * Simple utility to change an object array into a map with
 * keys - a specified objects' property that is unique for all elements.
 */

gpii.tests.objectArrayToHash = function (array, key) {
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
gpii.tests.assertLeftHandDeep = function (message, expected, actual) {
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
 * Execute Javascipt code in a given Electron BrowserWindow.
 * @param {BrowserWindow} dialog - The dialog in which the code will be executed
 * @param {String} script - The JS code to be executed inside the BrowserWindow
 * @return {Promise} - A promise for the code execution
 */
gpii.tests.executeScriptInDialog = function (dialog, script) {
    return dialog.webContents.executeJavaScript(script, true);
};

