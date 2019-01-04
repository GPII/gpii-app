/*
 * GPII Storage Integration Test Definitions
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
    fs = require("fs"),
    jqUnit = fluid.require("node-jqunit", require, "jqUnit"),
    gpii = fluid.registerNamespace("gpii");

require("../src/main/app.js");

fluid.registerNamespace("gpii.tests.storage");

/**
 * No need to persist any GPII app data for most of the integration tests
 */
fluid.defaults("gpii.tests.storage.mockedStorage", {
    gradeNames: ["fluid.modelComponent"],

    invokers: {
        persistData: {
            funcName: "fluid.identity"
        },
        retrieveData: {
            funcName: "fluid.identity"
        }
    }
});

fluid.defaults("gpii.tests.storage.mockedStorageWrapper", {
    components: {
        storage: {
            type: "gpii.tests.storage.mockedStorage"
        }
    }
});

gpii.tests.storage.unlink = function (path) {
    var togo = fluid.promise();

    fs.unlink(path, function (error) {
        if (error) {
            fluid.log(fluid.logLevel.WARN, "Storage test defs: Cannot unlink file", error);
        }

        // Resolve the promise even if there is an error
        togo.resolve();
    });

    return togo;
};

gpii.tests.storage.writeFileSync = function (path, data) {
    fs.writeFileSync(path, JSON.stringify(data));
};

gpii.tests.storage.checkPersistedData = function (path, expectedData) {
    var data = fs.readFileSync(path);
    jqUnit.assertDeepEq("The data is successfully persisted", expectedData, JSON.parse(data));
};

var storageFilePath = "tests-storage.json",
    testData = {
        interactionsCount: 256
    },
    anotherTestData = {
        isKeyedIn: true,
        keyedInUserToken: "snapset_1a",
        interactionsCount: 1024
    };

gpii.tests.storage.testDefs = {
    name: "Storage integration tests",
    expect: 3,
    config: {
        configName: "gpii.tests.all.config",
        configPath: "tests/configs"
    },
    distributeOptions: {
        mockedSettings: {
            record: storageFilePath,
            target: "{that gpii.app.storage}.options.storageFilePath"
        }
    },
    gradeNames: ["gpii.test.common.testCaseHolder"],
    sequence: [{ // Make sure there are no remains from previous tests
        task: "gpii.tests.storage.unlink",
        args: ["{that}.app.storage.options.absoluteStorageFilePath"],
        resolve: "fluid.identity"
    }, { // Try to read from a storage file which does not exist
        task: "{that}.app.storage.retrieveData",
        reject: "jqUnit.assert",
        rejectArgs: [
            "Cannot retrieve data from a non-existent location"
        ]
    }, { // Test for the persisting operation
        task: "{that}.app.storage.persistData",
        args: [testData],
        resolve: "gpii.tests.storage.checkPersistedData",
        resolveArgs: [
            "{that}.app.storage.options.absoluteStorageFilePath",
            testData
        ]
    }, { // Test for the retrieval operation
        func: "gpii.tests.storage.writeFileSync",
        args: [
            "{that}.app.storage.options.absoluteStorageFilePath",
            anotherTestData
        ]
    }, {
        task: "{that}.app.storage.retrieveData",
        resolve: "jqUnit.assertDeepEq",
        resolveArgs: [
            "The retrieved data is correct",
            anotherTestData,
            "{arguments}.0"
        ]
    }, { // Perform a final clean-up
        task: "gpii.tests.storage.unlink",
        args: ["{that}.app.storage.options.absoluteStorageFilePath"],
        resolve: "fluid.identity"
    }]
};
