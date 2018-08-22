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
 * TODO why this and not their
 * @param message
 * @param expected
 * @param actual
 * @returns {undefined}
 */
gpii.test.assertLeftHandDeep = function (message, expected, actual) {
    function keysIntersection(object1, object2) {
        var actualSubset = fluid.filterKeys(object1, fluid.keys(object2));

        // intersect sub-keys
        fluid.each(object2, function (value, key) {
            if (fluid.isPlainObject(value, true) && fluid.isPlainObject(actualSubset[key], true)) {
                actualSubset[key] = keysIntersection(actualSubset[key], value);
            }
        });

        return actualSubset;
    }

    return jqUnit.assertDeepEq(message, expected, keysIntersection(actual, expected));
};
