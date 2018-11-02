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
require("gpii-express");

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


var surveyTriggersUrl = "http://localhost:8083/surveys/triggers.json";

fluid.defaults("gpii.tests.app.simpleTriggersServer", {
    gradeNames: ["gpii.express"],
    port: 8083,
    components: {
        contentRouter: {
            type: "gpii.express.router.serveContentAndIndex",
            options: {
                path:    "/surveys",
                content: "%gpii-app/tests/fixtures/survey/"
            }
        }
    }
});

fluid.defaults("gpii.tests.app.simpleTriggersServerWrapper", {
    components: {
        surveyTriggersServer: {
            type: "gpii.tests.app.simpleTriggersServer"
        }
    }
});

gpii.tests.surveys.assertSurveyFixture = function (expected, actual) {
    jqUnit.assertTrue("The url of the received survey is correct", actual.url.startsWith(expected.url));
    jqUnit.assertLeftHand("The properties of the survey BrowserWindow are correct", expected.window, actual.window);
};


// uses the sessionTimer trigger for the tests
var noUserTriggersSequence = [
    { // Survey triggers are received with key in
        event: "{that}.app.surveyManager.surveyConnector.events.onTriggerDataReceived",
        listener: "jqUnit.assertDeepEq",
        args: [
            "The trigger fixture is correctly received",
            "@expand:fluid.require(%gpii-app/tests/fixtures/survey/triggers.json)",
            "{arguments}.0"
        ]
    },
    { // ... make it a lucky session
        func: "{that}.app.qssWrapper.qss.show"
    },
    { // ... simulate change happening from the QSS
        func: "{that}.app.qssWrapper.qss.events.onQssSettingAltered.fire",
        args: [
            {
                path: "http://registry\\.gpii\\.net/common/selfVoicing/enabled",
                value: true // change to a new value
            }
        ]
    },
    { // ... survey for "sessionTimer" should appear
        event: "{that}.app.surveyManager.surveyConnector.events.onSurveyRequired",
        // Note that the argument (passed by the event) will have some extra
        // fields as a side effect of a component creation
        listener: "gpii.tests.surveys.assertSurveyFixture",
        args: [
            "@expand:fluid.require(%gpii-app/tests/fixtures/survey/survey1.json)",
            "{arguments}.0"
        ]
    }
];

// uses the keyedInFor trigger for the tests
var keyedInTriggersSequence = [
    {
        func: "{that}.app.keyIn",
        args: ["snapset_1a"]
    }, { // Survey triggers are received with key in
        event: "{that}.app.surveyManager.surveyConnector.events.onTriggerDataReceived",
        listener: "jqUnit.assertDeepEq",
        args: [
            "The trigger fixture is correctly received",
            "@expand:fluid.require(%gpii-app/tests/fixtures/survey/triggers.json)",
            "{arguments}.0"
        ]
    }, { // we should get the survey after a second for the "keyedIn" trigger
        event: "{that}.app.surveyManager.surveyConnector.events.onSurveyRequired",
        // Note that the argument (passed by the event) will have some extra
        // fields as a side effect of a component creation
        listener: "gpii.tests.surveys.assertSurveyFixture",
        args: [
            "@expand:fluid.require(%gpii-app/tests/fixtures/survey/survey2.json)",
            "{arguments}.0"
        ]
    },
    {
        func: "{that}.app.keyOut"
    }, {
        event: "{that}.app.events.onKeyedOut",
        listener: "fluid.identity"
    }
];

gpii.tests.surveys.testTriggersFailCases = function (surveyConnector) {
    gpii.app.dynamicSurveyConnector.requestTriggers(surveyConnector, null);
    jqUnit.assert("requestTriggers should not throw exception if no URL is given");


    jqUnit.expectFrameworkDiagnostic("handleTriggersResponse: Should log error when missing url is given", function () {
        gpii.app.dynamicSurveyConnector.handleTriggersResponse(surveyConnector, null, {statusCode: 404}, null);
    }, "Survey connector: Cannot get trigger data");

    jqUnit.expectFrameworkDiagnostic("handleTriggersResponse: Should log error when error in request", function () {
        gpii.app.dynamicSurveyConnector.handleTriggersResponse(surveyConnector, "Something bad had happened", {statusCode: 500}, null);
    }, "Survey connector: Cannot get trigger data");

    jqUnit.expectFrameworkDiagnostic("handleTriggersResponse: Should log error when incorrect json returned", function () {
        gpii.app.dynamicSurveyConnector.handleTriggersResponse(surveyConnector, null, {statusCode: 200}, "Almost success");
    }, "Survey connector: Error parsing trigger data");
};


gpii.tests.surveys.testSurveysFailCases = function (surveyConnector) {
    gpii.app.dynamicSurveyConnector.requestSurvey(surveyConnector, { surveyUrl: null });
    jqUnit.assert("requestSurvey should not throw exception if no URL is given");

    jqUnit.expectFrameworkDiagnostic("handleSurveyResponse: Should log error when missing url is given", function () {
        gpii.app.dynamicSurveyConnector.handleSurveyResponse(surveyConnector, null, null, {statusCode: 404}, null);
    }, "Survey connector: Cannot get survey data");

    jqUnit.expectFrameworkDiagnostic("handleSurveyResponse: Should log error when error in request", function () {
        gpii.app.dynamicSurveyConnector.handleSurveyResponse(surveyConnector, null, "Something bad had happened", {statusCode: 500}, null);
    }, "Survey connector: Cannot get survey data");

    jqUnit.expectFrameworkDiagnostic("handleSurveyResponse: Should log error when incorrect json returned", function () {
        gpii.app.dynamicSurveyConnector.handleSurveyResponse(surveyConnector, null, null, {statusCode: 200}, "Almost success");
    }, "Survey connector: Error parsing survey data");
};


/**
 * Because of https://issues.fluidproject.org/browse/FLUID-5502, it is not possible to
 * add separate sequence elements to test the consecutive occurring of the
 * `onTriggerOccurred`, `onSurveyRequired` and the `onSurveyCreated` events.
 */
gpii.tests.surveys.dynamicSurveyConnectorTestDefs = {
    name: "Surveys connector integration tests",
    expect: 8,
    config: {
        configName: "gpii.tests.dynamicSurveyConnector.config",
        configPath: "tests/configs"
    },
    gradeNames: ["gpii.test.common.testCaseHolder"],
    distributeOptions: {
        "distributeTestTriggerUrl": {
            // apply test triggers URL
            // NOTE that this should be distributed after any other
            // distributions such as the `siteconfig` one
            record: surveyTriggersUrl,
            target: "{that surveyConnector}.options.config.triggersUrl",
            priority: "last"
        }
    },
    sequence: [
        {
            event: "{that gpii.app.qss}.events.onDialogReady",
            listener: "fluid.identity"
        },
        keyedInTriggersSequence,
        noUserTriggersSequence,
        {
            funcName: "gpii.tests.surveys.testTriggersFailCases",
            args: ["{that}.app.surveyManager.surveyConnector"]
        },
        {
            funcName: "gpii.tests.surveys.testSurveysFailCases",
            args: ["{that}.app.surveyManager.surveyConnector"]
        }
    ]
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

fluid.defaults("gpii.tests.surveys.staticSurveyConnector", {
    gradeNames: ["gpii.app.staticSurveyConnector"],
    config: {
        triggersFixture: triggersFixture,
        surveysFixture: surveysFixture
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
gpii.tests.surveys.staticSurveyConnectorTestDefs = {
    name: "Surveys connector integration tests",
    expect: 3,
    config: {
        configName: "gpii.tests.dev.config",
        configPath: "tests/configs"
    },
    gradeNames: ["gpii.test.common.testCaseHolder"],
    distributeOptions: {
        distributeSurveyConnector: {
            record: "gpii.tests.surveys.staticSurveyConnector",
            target: "{that surveyConnector}.options.gradeNames"
        }
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
    }, { // Test failing cases
        // do more of a Unit test to check fail behaviour...
        func: "jqUnit.expectFrameworkDiagnostic",
        args: [
            "Should log error when missing survey fixture",
            {
                expander: {
                    funcName: "gpii.tests.utils.funcBinder",
                    args: [
                        // func
                        gpii.app.staticSurveyConnector.notifyTriggerOccurred,
                        // args
                        "{that}.app.surveyManager.surveyConnector",
                        {}, // surveyFixture
                        triggersFixture[0]
                    ]
                }
            },
            "Missing survey for trigger: " + triggersFixture[0].id
        ]
    }]
};

