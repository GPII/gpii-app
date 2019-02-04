/* eslint-env node */
"use strict";

var fluid = require("infusion");

require("gpii-windows/index.js");

// This needs to be invoked when gpii-windows is included.
require("./tests/TrayButtonTests.js");

// Run the gpii-windows tests
fluid.require("%gpii-windows/tests/UnitTests.js");
