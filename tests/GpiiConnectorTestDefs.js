/*
 * GPII Connector Test Definitions
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
    gpii = fluid.registerNamespace("gpii");

require("../src/main/app.js");

fluid.registerNamespace("gpii.tests.gpiiConnector.testDefs");

var DPIScalePath = "http://registry\\.gpii\\.net/common/DPIScale";

gpii.tests.gpiiConnector.getSettingUpdateMessage = function (path, value) {
    return {
        "payload": {
            type: "ADD",
            path: ["settingControls", path, "value"],
            value: value
        }
    };
};

gpii.tests.gpiiConnector.testDefs = {
    name: "GPII connector integration tests",
    expect: 1,
    config: {
        configName: "gpii.tests.dev.config",
        configPath: "tests/configs"
    },
    gradeNames: ["gpii.test.common.testCaseHolder"],
    sequence: [{
        func: "{that}.app.keyIn",
        args: "snapset_1a"
    }, { // Wait for the key in process to complete
        event: "{that}.app.events.onKeyedIn",
        listener: "fluid.identity"
    }, {
        func: "{that}.app.gpiiConnector.events.onMessageReceived.fire",
        args: [
            gpii.tests.gpiiConnector.getSettingUpdateMessage(DPIScalePath, 2)
        ]
    }, {
        event: "{that}.app.gpiiConnector.events.onSettingUpdated",
        listener: "jqUnit.assertDeepEq",
        args: [
            "The setting which was updated in the PSP is correct",
            {
                path: DPIScalePath,
                value: 2
            },
            "{arguments}.0"
        ]
    }, {
        func: "{that}.app.keyOut"
    }, {
        event: "{that}.app.events.onKeyedOut",
        listener: "fluid.identity"
    }]
};
