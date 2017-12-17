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

require("../node_modules/kettle/lib/test/KettleTestUtils.http.js");
require("../src/main/app.js");

fluid.registerNamespace("gpii.tests.dialogManager.testDefs");

gpii.tests.dialogManager.receiveApp = function (testCaseHolder, app) {
    testCaseHolder.app = app;
};

gpii.tests.dialogManager.testManagerBeforeKeyIn = function (dialogManager) {
    jqUnit.assertFalse("There is no keyed in user for the dialog manager before key in",
        dialogManager.model.keyedInUserToken);
};

gpii.tests.settingsBroker.testManagerAfterKeyIn = function (dialogManager, expectedUserToken) {
    jqUnit.assertEquals("The keyed in user token matches the token of the user",
        expectedUserToken, dialogManager.model.keyedInUserToken);
};

gpii.tests.settingsBroker.testManagerAfterKeyOut = function (dialogManager) {
    jqUnit.assertFalse("There is no keyed in user for the dialog manager after key out",
        dialogManager.model.keyedInUserToken);
};

gpii.tests.dialogManager.testDefs = {
    name: "Dialog manager integration tests",
    expect: 3,
    config: {
        configName: "app.dev",
        configPath: "configs"
    },
    gradeNames: ["gpii.test.common.testCaseHolder"],
    distributeOptions: {
        record: {
            funcName: "gpii.tests.dialogManager.receiveApp",
            args: ["{testCaseHolder}", "{arguments}.0"]
        },
        target: "{that flowManager gpii.app}.options.listeners.onCreate"
    },
    sequence: [{
        event: "{that gpii.app.surveyManager}.events.onCreate",
        listener: "gpii.tests.dialogManager.testManagerBeforeKeyIn",
        args: ["{that}.app.surveyManager.dialogManager"]
    }, {
        func: "{that}.app.keyIn",
        args: ["snapset_1a"]
    }, {
        changeEvent: "{that}.app.surveyManager.dialogManager.applier.modelChanged",
        path: "keyedInUserToken",
        listener: "gpii.tests.settingsBroker.testManagerAfterKeyIn",
        args: ["{that}.app.surveyManager.dialogManager", "snapset_1a"]
    }, {
        func: "{that}.app.keyOut"
    }, {
        changeEvent: "{that}.app.surveyManager.dialogManager.applier.modelChanged",
        path: "keyedInUserToken",
        listener: "gpii.tests.settingsBroker.testManagerAfterKeyOut",
        args: ["{that}.app.surveyManager.dialogManager"]
    }]
};
