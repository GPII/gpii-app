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
    surveyTrigger: {
        conditions: [
            {
                "minutesSinceKeyIn": 1
            }
        ],
        id: "id",
        urlTriggerHandler: "URL of the survey server to handle the surveyTriggerEvent"
    }
};

var surveyFixture = {
    survey: {
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

gpii.tests.surveys.testTriggersRequestPayload = function (payload, keyedInUserToken) {
    jqUnit.assertEquals("The user token in the triggers request is correct",
        keyedInUserToken, payload.userId);
    jqUnit.assertTrue("The triggers request contains information about the machine id",
        payload.machineId);
};

gpii.tests.surveys.testTriggerOccurredPayload = function (payload, expectedPayload) {
    expectedPayload = fluid.censorKeys(expectedPayload.surveyTrigger, ["conditions"]);
    jqUnit.assertDeepEq("The triggers occurred payload contains the correct data",
        expectedPayload, payload);
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
        listener: "gpii.tests.surveys.testTriggersRequestPayload",
        args: ["{arguments}.0", "snapset_1a"]
    }, {
        func: "{that}.app.surveyManager.surveyServer.sendPayload",
        args: [surveyTriggersFixture]
    }, {
        event: "{that}.app.surveyManager.surveyServer.events.onTriggerOccurred",
        listener: "gpii.tests.surveys.testTriggerOccurredPayload",
        args: ["{arguments}.0", surveyTriggersFixture]
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
