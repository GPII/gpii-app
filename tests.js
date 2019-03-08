/* eslint-env node */
"use strict";

var fluid = require("infusion");

var fs = require("graceful-fs");
var jqUnit = require("node-jqunit");

var gpii = fluid.registerNamespace("gpii");

/*
 * Load all the code that is to be tested. Using relative path
 * as this can either be the instrumented "app" or not.
 */
require("./src/main/app");


fluid.registerNamespace("gpii.tests.app");
// In case the "instrumented" source is loaded the `__coverage` variable will be present.
gpii.tests.app.isInstrumented = fluid.isValue(global.__coverage__);


// Code coverage harness, hooks into the jqUnit lifecycle and saves tests whenever the `onAllTestsDone` event is fired.
// Must be hooked in before requiring any actual tests.
jqUnit.onAllTestsDone.addListener(function () {
    if (gpii.tests.app.isInstrumented) {
        var filename = fluid.stringTemplate("coverage-tests-%timestamp.json", { timestamp: (new Date()).toISOString().replace(/:/g, "-") });
        var coverageFilePath = fluid.module.resolvePath("%gpii-app/coverage/" + filename);
        try {
            var coverageData = JSON.stringify(global.__coverage__, null, 2);
            fs.writeFileSync(coverageFilePath, coverageData);
            fluid.log("Saved ", coverageData.length, " bytes of coverage data to '", coverageFilePath, "'.");
        }
        catch (error) {
            fluid.log("Error saving coverage data:", error);
        }
    }
    else {
        fluid.log("No code coverage data to save.");
    }
});

// Run the electron app tests with code coverage if possible.
//require("./tests/AppTests.js");
//require("./tests/MessageBundlesTests.js");
//require("./tests/MessageBundlesCompilerTests.js");
//require("./tests/PreferencesGroupingTests.js");
//require("./tests/PreferencesParsingTests.js");
require("./tests/IntegrationTests.js");
