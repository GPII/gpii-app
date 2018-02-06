/**
 * PSP Survey Integration Test Definitions
 *
 * Test definitions for survey related functionalities. Check whether a trigger message
 * is interpreted correctly as well as whether a survey is shown when necessary.
 * Copyright 2017 Raising the Floor - International
 *
 * Licensed under the New BSD license. You may not use this file except in
 * compliance with this License.
 * The research leading to these results has received funding from the European Union's
 * Seventh Framework Programme (FP7/2007-2013) under grant agreement no. 289016.
 * You may obtain a copy of the License at
 * https://github.com/GPII/universal/blob/master/LICENSE.txt
 */
"use strict";

var fluid = require("infusion"),
    gpii = fluid.registerNamespace("gpii");

require("../src/main/app.js");

fluid.registerNamespace("gpii.tests.surveys.testDefs");

var triggerFixture = [
    {
        id: "trigger_1",
        conditions: [
            {
                type: "keyedInFor",
                value: 1000
            }
        ]
    }
];

var surveyFixture = {
    "url": "https://fluidproject.org/",
    "closeOnSubmit": false,
    "window": {
        "width": 800,
        "height": 600
    }
};

fluid.defaults("gpii.tests.surveys.surveyConnector", {
    gradeNames: ["gpii.app.staticSurveyConnector"],
    config: {
        triggerFixture: triggerFixture,
        surveyFixture: surveyFixture
    },
    mergePolicy: {
        config: "replace"
    }
});

/**
 * Because of https://issues.fluidproject.org/browse/FLUID-5502, it is not possible to
 * add separate sequence elements to test the consecutive occurring of the
 * `onTriggerOccurred`, `onSurveyRequired` and the `onSurveyCreated` events.
 */
gpii.tests.surveys.testDefs = {
    name: "Surveys integration tests",
    expect: 2,
    config: {
        configName: "gpii.tests.dev.config",
        configPath: "tests/configs"
    },
    gradeNames: ["gpii.test.common.testCaseHolder"],
    distributeOptions: {
        record: "gpii.tests.surveys.surveyConnector",
        target: "{that surveyConnector}.options.gradeNames"
    },
    sequence: [{
        func: "{that}.app.keyIn",
        args: ["snapset_1a"]
    }, {
        event: "{that}.app.surveyManager.surveyConnector.events.onTriggerDataReceived",
        listener: "jqUnit.assertDeepEq",
        args: ["The trigger fixture is correctly received", triggerFixture, "{arguments}.0"]
    }, {
        event: "{that}.app.surveyManager.surveyConnector.events.onSurveyRequired",
        listener: "jqUnit.assert",
        args: ["The survey fixture is received"]
    }, {
        func: "{that}.app.keyOut"
    }]
};
