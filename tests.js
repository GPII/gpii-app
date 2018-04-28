/* eslint-env node */
"use strict";

var fs = require("fs");
var path = require("path");
var jqUnit = require("node-jqunit");

require("gpii-universal");
require("gpii-windows/index.js");
require("./index");

// Code coverage harness, hooks into the jqUnit lifecycle and saves tests whenever the `onAllTestsDone` event is fired.
// Must be hooked in before requiring any actual tests.
jqUnit.onAllTestsDone.addListener(function () {
    if (global.__coverage__) {
        var filename = fluid.stringTemplate("coverage-tests-%timestamp.json", { timestamp: (new Date()).toISOString() });
        var coverageFilePath = path.resolve(__dirname, "../coverage", filename);
        try {
            fs.writeFileSync(coverageFilePath, JSON.stringify(global.__coverage__, null, 2));
            fluid.log("Coverage data saved.");
        }
        catch (error) {
            fluid.log("Error saving coverage data:", error);
        }
    }
    else {
        fluid.log("No code coverage data to save.");
    }
});

// Run the electron app tests with code coverage.
require("./tests/AppTests.js");
require("./tests/MessageBundlesTests.js");
require("./tests/MessageBundlesCompilerTests.js");
require("./tests/PreferencesParsingTests.js");
require("./tests/IntegrationTests.js");

// Run the GPII tests
fluid.require("%gpii-universal/tests/all-tests.js");
fluid.require("%gpii-windows/tests/UnitTests.js");
