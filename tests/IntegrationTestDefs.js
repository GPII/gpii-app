/*
 * GPII App Integration Test Definitions
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
require("../src/app.js");
    // TEST MENU IN APP & MENU IN APP DEV

fluid.registerNamespace("gpii.tests.app");

gpii.tests.app.testCreateMenuInApp = function (data) {
    jqUnit.assert("Got here");
    console.log("+++++++++++++++++++++++++++++++++");
    console.log(data);
};

fluid.registerNamespace("gpii.tests.app.testDefs");

gpii.tests.app.testDefs = [{
    name: "GPII application integration tests",
    expect: 1,
    config: {
        configName: "app.dev",
        configPath: "configs"
    },
    gradeNames: ["gpii.test.common.testCaseHolder"],
    sequence: [{
        event: "{gpii.app}.events.onAppReady",
        listener: "{gpii.tests.app.testCreateMenuInApp}"
    }]
}];
