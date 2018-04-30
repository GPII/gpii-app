/* eslint-env node */
"use strict";

require("gpii-universal");
require("gpii-windows/index.js");

// Run the GPII tests
require("./node_modules/gpii-universal/tests/all-tests.js");
require("./node_modules/gpii-windows/tests/UnitTests.js");

// Run the electron app tests
require("./tests/AppTests.js");
require("./tests/MessageBundlesTests.js");
require("./tests/MessageBundlesCompilerTests.js");
require("./tests/PreferencesGroupingTests.js");
require("./tests/PreferencesParsingTests.js");
require("./tests/IntegrationTests.js");
