/**
 * Survey Trigger Manager Integration Test Definitions
 *
 * Test definitions for the surveyTriggerManager component.
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
    jqUnit = fluid.require("node-jqunit", require, "jqUnit"),
    gpii = fluid.registerNamespace("gpii");

require("./testUtils.js");
require("../src/main/app.js");

fluid.registerNamespace("gpii.tests.surveyTriggerManager.testDefs");

var sessionTimer = {
    id: "testTrigger_1",
    conditions: [
        {
            type: "sessionTimer",
            value: 1000,
            sessionModulus: 1
        }
    ]
};

var sessionTimerDuplicate = {
    id: "testTrigger_1",
    conditions: [
        {
            type: "sessionTimer",
            value: 3000,
            sessionModulus: 5
        }
    ]
};

gpii.tests.surveyTriggerManager.testHandlerCreated = function (surveyTriggerManager, triggerFixture) {
    var triggerId = triggerFixture.id,
        triggerHandler = surveyTriggerManager.registeredTriggerHandlers[triggerId],
        conditionHandler = triggerHandler.conditionHandler;
    jqUnit.assertTrue("There is a registered trigger handler for the given fixture",
        triggerHandler);
    jqUnit.assertDeepEq("The trigger of the registered trigger handler is correct",
        triggerFixture, triggerHandler.model.trigger);
    jqUnit.assertTrue("There is a condition handler for the first trigger condition",
        conditionHandler);
    jqUnit.assertFalse("There is exactly one condition handler for the trigger",
        triggerHandler["conditionHandler-1"]);
    jqUnit.assertDeepEq("The condition of the condition handler is correct",
        triggerFixture.conditions[0], conditionHandler.model.condition);
};

gpii.tests.surveyTriggerManager.testHandlerRemoved = function (surveyTriggerManager, triggerFixture) {
    var triggerId = triggerFixture.id,
        triggerHandler = surveyTriggerManager.registeredTriggerHandlers[triggerId];
    jqUnit.assertFalse("There is no registered trigger for the given fixture", triggerHandler);
};

gpii.tests.surveyTriggerManager.testDefs = {
    name: "Trigger Engine integration tests",
    expect: 14,
    config: {
        configName: "gpii.tests.all.config",
        configPath: "tests/configs"
    },
    gradeNames: ["gpii.test.common.testCaseHolder"],
    sequence: [{
    /**
     * The tests below seem to complete too fast and the GPII app (including the gpiiConnector and
     * its socket) is destroyed before the "noUser" preferences are delivered to the GPII app. When
     * the Core attempts to do so, the websocket on the PSP's end no longer exists and this causes
     * the socket on the Core's end to hang up and emit an error. This is probably an edge case
     * which is not handled and will probably be tackled in the future and for now it would be better
     * to delay the tests a bit.
     */
        task: "gpii.test.linger",
        args: [2000],
        resolve: "fluid.identity"
    }, [ // Testing basic trigger workflow
        {
            func: "{that}.app.surveyManager.surveyTriggerManager.registerTrigger",
            args: [sessionTimer]
        }, {
            func: "gpii.tests.surveyTriggerManager.testHandlerCreated",
            args: ["{that}.app.surveyManager.surveyTriggerManager", sessionTimer]
        }, {
            // Simulate a setting update via the QSS in order to fulfil the trigger
            func: "{that}.app.qssWrapper.qss.events.onQssSettingAltered.fire",
            args: {
                path: "http://registry\\.gpii\\.net/common/selfVoicing/enabled",
                value: true
            }
        }, {
            event: "{that}.app.surveyManager.surveyTriggerManager.events.onTriggerOccurred",
            listener: "jqUnit.assertDeepEq",
            args: ["The correct trigger has occurred", sessionTimer, "{arguments}.0"]
        }, {
            func: "gpii.tests.surveyTriggerManager.testHandlerRemoved",
            args: ["{that}.app.surveyManager.surveyTriggerManager", sessionTimer]
        }
    ], [ // Testing registration of triggers with the same id
        {
            func: "{that}.app.surveyManager.surveyTriggerManager.registerTrigger",
            args: [sessionTimer]
        }, {
            func: "{that}.app.surveyManager.surveyTriggerManager.registerTrigger",
            args: [sessionTimerDuplicate]
        }, {
            func: "gpii.tests.surveyTriggerManager.testHandlerCreated",
            args: ["{that}.app.surveyManager.surveyTriggerManager", sessionTimerDuplicate]
        }, {
            func: "{that}.app.surveyManager.surveyTriggerManager.removeTrigger",
            args: [sessionTimerDuplicate]
        }, {
            func: "gpii.tests.surveyTriggerManager.testHandlerRemoved",
            args: ["{that}.app.surveyManager.surveyTriggerManager", sessionTimerDuplicate]
        }
    ], [ // Testing resetting of the survey trigger manager
        {
            func: "{that}.app.surveyManager.surveyTriggerManager.registerTrigger",
            args: ["{that}.app.surveyManager.surveyTriggerManager", sessionTimerDuplicate]
        }, {
            func: "{that}.app.surveyManager.surveyTriggerManager.reset"
        }, {
            func: "gpii.tests.surveyTriggerManager.testHandlerRemoved",
            args: ["{that}.app.surveyManager.surveyTriggerManager", sessionTimerDuplicate]
        }
    ]]
};
