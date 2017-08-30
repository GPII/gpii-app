/* eslint-env node */
"use strict";

var fluid = require("universal"),
    jqUnit = fluid.require("node-jqunit");

require("gpii-windows/index.js");

// Run the GPII tests
// require("./node_modules/universal/tests/all-tests.js");
// require("./node_modules/gpii-windows/tests/UnitTests.js");

// Run the electron app tests
// require("./tests/AppTests.js");
require("./tests/IntegrationTests.js");

// var app = require("electron").app;
//
// app.on("ready", function () {
//     jqUnit.onAllTestsDone.addListener(function (results) {
//         process.exit(results.failed); // exits with 0 if no tests failed
//     });
// });
