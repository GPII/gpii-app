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

var jqUnit = fluid.require("node-jqunit");

require("../src/main/app.js");

fluid.registerNamespace("gpii.tests.surveys.testDefs");


fluid.registerNamespace("gpii.tests.utils");

/**
 * Simply binds arguments to a function.
 * @param {Function} func - The function that is to be bound
 * @param {...Any} args  - Arguments for binding
 * @return {Function} the binded function
 */
gpii.tests.utils.funcBinder = function (func /*, ...args */) {
    var args = [].slice.call(arguments, 1);
    return func.bind.apply(func, [null].concat(args));
};



var triggersFixture = [
    {
        id: "trigger_2",
        conditions: [
            {
                type: "keyedInFor",
                value: 1000
            }
        ]
    }
];

var surveysFixture = {
    "trigger_2": {
        "url": "https://fluidproject.org",
        "closeOnSubmit": false,
        "window": {
            "width": 300,
            "height": 200
        }
    }
};

fluid.defaults("gpii.tests.surveys.surveyConnector", {
    gradeNames: ["gpii.app.staticSurveyConnector"],
    config: {
        triggersFixture: triggersFixture,
        surveysFixture: surveysFixture
    },
    mergePolicy: {
        config: "replace"
    }
});

fluid.defaults("gpii.tests.surveys.negativeSurveyConnector", {
    gradeNames: ["gpii.app.staticSurveyConnector"],
    config: {
        triggersFixture: triggersFixture,
        surveysFixture: {}
    },
    mergePolicy: {
        config: "replace"
    }
});


gpii.tests.surveys.assertSurveyFixture = function (expected, actual) {
    jqUnit.assertTrue("The url of the received survey is correct", actual.url.startsWith(expected.url));
    jqUnit.assertLeftHand("The properties of the survey BrowserWindow are correct", expected.window, actual.window);
};

/**
 * Because of https://issues.fluidproject.org/browse/FLUID-5502, it is not possible to
 * add separate sequence elements to test the consecutive occurring of the
 * `onTriggerOccurred`, `onSurveyRequired` and the `onSurveyCreated` events.
 */
gpii.tests.surveys.surveyConnectorTestDefs = {
    name: "Surveys connector integration tests",
    expect: 3,
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
    }, { // Survey triggers are received with key in
        event: "{that}.app.surveyManager.surveyConnector.events.onTriggerDataReceived",
        listener: "jqUnit.assertDeepEq",
        args: ["The trigger fixture is correctly received", triggersFixture, "{arguments}.0"]
    }, {
        event: "{that}.app.surveyManager.surveyConnector.events.onSurveyRequired",
        // Note that the argument (passed by the event) will have some extra
        // fields as a side effect of a component creation
        listener: "gpii.tests.surveys.assertSurveyFixture",
        args: [surveysFixture[triggersFixture[0].id], "{arguments}.0"]
    }, {
        func: "{that}.app.keyOut"
    }, {
        event: "{that}.app.events.onKeyedOut",
        listener: "fluid.identity"
    }]
};

gpii.tests.surveys.surveyConnectorNegativeTestDefs = {
    name: "Surveys connector negative integration tests",
    expect: 0,
    config: {
        configName: "gpii.tests.dev.config",
        configPath: "tests/configs"
    },
    gradeNames: ["gpii.test.common.testCaseHolder"],
    distributeOptions: {
        record: "gpii.tests.surveys.negativeSurveyConnector",
        target: "{that surveyConnector}.options.gradeNames"
    },
    sequence: [{
        // do more of a Unit test to check fail behaviour...
        func: "jqUnit.expectFrameworkDiagnostic",
        args: [
            "Should log error when missing survey fixture",
            {
                expander: {
                    funcName: "gpii.tests.utils.funcBinder",
                    args: [
                        gpii.app.staticSurveyConnector.notifyTriggerOccurred,
                        "{that}.app.surveyManager.surveyConnector",
                        triggersFixture[0]
                    ]
                }
            },
            "Missing survey for trigger: " + triggersFixture[0].id
        ]
    }]
};
