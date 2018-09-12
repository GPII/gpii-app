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
        id: "testTrigger_1",
        conditions: [
            {
                type: "sessionTimer",
                value: 2000,
                sessionModulus: 2
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

gpii.tests.surveys.testDefs = {
    name: "Surveys integration tests",
    expect: 12,
    config: {
        configName: "gpii.tests.dev.config",
        configPath: "tests/configs"
    },
    gradeNames: ["gpii.test.common.testCaseHolder"],
    distributeOptions: {
        record: "gpii.tests.surveys.surveyConnector",
        target: "{that surveyConnector}.options.gradeNames"
    },
    sequence: [{ // Wait for the "noUser" triggers
        event: "{that gpii.app.surveyConnector}.events.onTriggerDataReceived",
        listener: "jqUnit.assertDeepEq",
        args: ["The trigger fixture is correctly received", triggerFixture, "{arguments}.0"]
    }, { // When the tray icon is clicked and the QSS is shown...
        func: "{that}.app.tray.events.onTrayIconClicked.fire"
    }, { // ...the session is no longer lucky because the interactions count is 1
         // and it is not divisible by the `sessionModulus` from the trigger payload
        func: "jqUnit.assertFalse",
        args: [
            "After opening the QSS initially the session is no longer lucky",
            "{that}.app.surveyManager.surveyTriggerManager.triggerHandler.conditionHandler.model.isLuckySession"
        ]
    }, { // Simulate closing of the QSS
        func: "{that}.app.qssWrapper.qss.hide"
    }, { // When the QSS is opened again...
        func: "{that}.app.tray.events.onTrayIconClicked.fire"
    }, { // ...the session becomes lucky because the interactions count is 2 which is
         // divisible by the `sessionModulus` from the trigger payload
        func: "jqUnit.assertTrue",
        args: [
            "After opening the QSS for the second time the session is now lucky",
            "{that}.app.surveyManager.surveyTriggerManager.triggerHandler.conditionHandler.model.isLuckySession"
        ]
    }, { // Simulate a setting update via the QSS...
        func: "{that}.app.qssWrapper.qss.events.onQssSettingAltered.fire",
        args: {
            path: "http://registry\\.gpii\\.net/common/selfVoicing/enabled",
            value: true
        }
    }, { // ...after which the timer will be started because the current session is lucky
        func: "jqUnit.assertTrue",
        args: [
            "The timer is started when a QSS setting has been adjusted",
            "@expand:{that}.app.surveyManager.surveyTriggerManager.triggerHandler.conditionHandler.isActive()"
        ]
    }, { // Perform another setting change via the QSS.
        func: "{that}.app.qssWrapper.qss.events.onQssSettingAltered.fire",
        args: {
            path: "http://registry\\.gpii\\.net/common/selfVoicing/enabled",
            value: false
        }
    }, { // If the change that has just been made is undone...
        func: "{that}.app.qssWrapper.undoStack.undo"
    }, { // ...the timer continues to be active.
        func: "jqUnit.assertTrue",
        args: [
            "The timer is still active is there are more QSS changes to be undone",
            "@expand:{that}.app.surveyManager.surveyTriggerManager.triggerHandler.conditionHandler.isActive()"
        ]
    }, { // If the last change is undone and thus the QSS is in its initial state...
        func: "{that}.app.qssWrapper.undoStack.undo"
    }, { // ...the timer is stopped
        func: "jqUnit.assertFalse",
        args: [
            "The timer is stopped once there are no more QSS changes to be undone",
            "@expand:{that}.app.surveyManager.surveyTriggerManager.triggerHandler.conditionHandler.isActive()"
        ]
    }, { // Simulate a setting update via the QSS...
        func: "{that}.app.qssWrapper.qss.events.onQssSettingAltered.fire",
        args: {
            path: "http://registry\\.gpii\\.net/common/selfVoicing/enabled",
            value: true
        }
    }, {
        func: "jqUnit.assertTrue",
        args: [
            "The timer is started again as a result of a QSS setting modification",
            "@expand:{that}.app.surveyManager.surveyTriggerManager.triggerHandler.conditionHandler.isActive()"
        ]
    }, { // Closing the QSS...
        func: "{that}.app.qssWrapper.qss.hide"
    }, { // ...and opening it again...
        func: "{that}.app.tray.events.onTrayIconClicked.fire"
    }, { // ...will make the session no longer lucky (as the interactions count becomes 3)...
        func: "jqUnit.assertFalse",
        args: [
            "After opening the QSS for the third time the session is no longer lucky",
            "{that}.app.surveyManager.surveyTriggerManager.triggerHandler.conditionHandler.model.isLuckySession"
        ]
    }, { // ...and consequently the survey timer will be stopped.
        func: "jqUnit.assertFalse",
        args: [
            "The timer is started again as a result of a QSS setting modification",
            "@expand:{that}.app.surveyManager.surveyTriggerManager.triggerHandler.conditionHandler.isActive()"
        ]
    }, { // Showing the PSP...
        func: "{that}.app.psp.show"
    }, { // ...will make the session lucky again (as the interactions count becomes 4)
        func: "jqUnit.assertTrue",
        args: [
            "Opening the PSP will make the session lucky",
            "{that}.app.surveyManager.surveyTriggerManager.triggerHandler.conditionHandler.model.isLuckySession"
        ]
    }, { // Update a setting in the QSS
        func: "{that}.app.qssWrapper.qss.events.onQssSettingAltered.fire",
        args: {
            path: "http://registry\\.gpii\\.net/common/selfVoicing/enabled",
            value: false
        }
    }, { // ...and wait for the survey to be shown
        event: "{that}.app.surveyManager.surveyConnector.events.onSurveyRequired",
        listener: "jqUnit.assert",
        args: ["The survey fixture is received"]
    }, {
        func: "jqUnit.assertFalse",
        args: [
            "The survey trigger handler no longer exists after a survey is shown",
            "{that}.app.surveyManager.surveyTriggerManager.triggerHandler"
        ]
    }]
};
