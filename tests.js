/* eslint-env node */
"use strict";

var app = require("electron").app;
var fluid = require("universal"),
    jqUnit = fluid.require("node-jqunit");

require("gpii-windows/index.js");

require("./node_modules/universal/tests/all-tests.js");
require("./node_modules/gpii-windows/tests/UnitTests.js");

app.on("ready", function () {
    jqUnit.onAllTestsDone.addListener(function (results) {
    	fluid.log("A total of ", results.total, " tests run, with ", results.failed, " failed tests. Exiting process with status ", results.failed);
    	process.exit(results.failed); // exits with 0 if no tests failed
    });
});
 
