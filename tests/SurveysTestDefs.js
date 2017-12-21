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
require("./SurveyServerMock.js");

fluid.registerNamespace("gpii.tests.surveys.testDefs");

var surveyTriggersFixture = {
    type: "surveyTrigger",
    value: {
        conditions: {
            all: [{
                fact: "keyedInBefore",
                operator: "greaterThanInclusive",
                value: 1000 * 1 // 1 sec
            }]
        },
        triggerId: "id",
        urlTriggerHandler: "URL of the survey server to handle the surveyTriggerEvent"
    }
};

var surveyFixture = {
    type: "survey",
    value: {
        "url": "https://fluidproject.org/",
        "closeOnSubmit": false,
        "window": {
            "width": 800,
            "height": 600
        }
    }
};

gpii.tests.surveys.receiveApp = function (testCaseHolder, app) {
    testCaseHolder.app = app;
};

gpii.tests.surveys.testTriggersRequestValue = function (value, keyedInUserToken) {
    jqUnit.assertEquals("The user token in the triggers request is correct",
        keyedInUserToken, value.userId);
    jqUnit.assertTrue("The triggers request contains information about the machine id",
        value.machineId);
};

gpii.tests.surveys.testTriggerOccurredValue = function (value, expectedValue) {
    jqUnit.assertDeepEq("The triggers occurred payload contains the correct data",
        expectedValue, value);
};

gpii.tests.surveys.testDefs = {
    name: "Surveys integration tests",
    expect: 4,
    config: {
        configName: "app.dev",
        configPath: "configs"
    },
    gradeNames: ["gpii.test.common.testCaseHolder"],
    distributeOptions: {
        receiveApp: {
            record: {
                funcName: "gpii.tests.surveys.receiveApp",
                args: ["{testCaseHolder}", "{arguments}.0"]
            },
            target: "{that flowManager gpii.app}.options.listeners.onCreate"
        },
        mockSurveyServer: {
            record: "gpii.tests.mocks.surveyServerWrapper",
            target: "{that gpii.app.surveyManager}.options.gradeNames"
        }
    },
    sequence: [{ // Wait for the survey manager to be created before doing anything else
        event: "{that gpii.app.surveyManager}.events.onCreate",
        listener: "fluid.identity"
    }, {
        func: "{that}.app.keyIn",
        args: ["snapset_1a"]
    }, {
        event: "{that}.app.surveyManager.surveyServer.events.onTriggersRequested",
        listener: "gpii.tests.surveys.testTriggersRequestValue",
        args: ["{arguments}.0", "snapset_1a"]
    }, {
        func: "{that}.app.surveyManager.surveyServer.sendPayload",
        args: [surveyTriggersFixture]
    }, {
        event: "{that}.app.surveyManager.surveyServer.events.onTriggerOccurred",
        listener: "gpii.tests.surveys.testTriggerOccurredValue",
        args: ["{arguments}.0", surveyTriggersFixture.value]
    }, {
        func: "{that}.app.surveyManager.surveyServer.sendPayload",
        args: [surveyFixture]
    }, {
        event: "{that gpii.app.surveyDialog}.events.onSurveyCreated",
        listener: "jqUnit.assert",
        args: ["Survey dialog is created successfully"]
    }, {
        func: "{that}.app.keyOut"
    }, {
        func: "{that}.app.surveyManager.surveyServer.close"
    }, {
        event: "{that}.app.surveyManager.surveyServer.events.onServerClosed",
        listener: "fluid.identity"
    }]
};
