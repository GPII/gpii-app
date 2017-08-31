/* eslint-env node */
"use strict";

var fluid = require("universal");

require("gpii-windows/index.js");

// Run the GPII tests
require("./node_modules/universal/tests/all-tests.js");
require("./node_modules/gpii-windows/tests/UnitTests.js");

// Run the electron app tests
require("./tests/AppTests.js");
require("./tests/IntegrationTests.js");
