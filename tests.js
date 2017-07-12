/* eslint-env node */
"use strict";

var fluid = require("universal"),
    jqUnit = fluid.require("node-jqunit");

require("gpii-windows/index.js");

//require("./node_modules/universal/tests/all-tests.js");
//require("./node_modules/gpii-windows/tests/UnitTests.js");

//    require("./tests/AppTests.js");
require("./tests/IntegrationTests.js");

jqUnit.onAllTestsDone.addListener(function (results) {
    process.exit(results.failed); // exits with 0 if no tests failed
});
