/**
 * PSP Rules Engine Integration Test Definitions
 *
 * Test definitions for the rules engine. Checks whether a single or multiple rules are
 * satisfied when necessary against provided mock facts.
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

require("../src/main/app.js");

fluid.registerNamespace("gpii.tests.surveyTriggerManager.testDefs");

var keyedInForTrigger = {
    id: "trigger_1",
    conditions: [{
        type: "keyedInFor",
        value: 1000
    }]
};

var keyedInForTriggerDuplicate = {
    id: "trigger_1",
    conditions: [{
        type: "keyedInFor",
        value: 30000
    }]
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
        func: "{that}.app.factsManager.applier.change",
        args: ["keyedInTimestamp", Date.now()]
    }, [ // Testing basic trigger workflow
        {
            func: "{that}.app.surveyManager.surveyTriggerManager.registerTrigger",
            args: [keyedInForTrigger]
        }, {
            func: "gpii.tests.surveyTriggerManager.testHandlerCreated",
            args: ["{that}.app.surveyManager.surveyTriggerManager", keyedInForTrigger]
        }, {
            event: "{that}.app.surveyManager.surveyTriggerManager.events.onTriggerOccurred",
            listener: "jqUnit.assertDeepEq",
            args: ["The correct trigger has occurred", keyedInForTrigger, "{arguments}.0"]
        }, {
            func: "gpii.tests.surveyTriggerManager.testHandlerRemoved",
            args: ["{that}.app.surveyManager.surveyTriggerManager", keyedInForTrigger]
        }
    ], [ // Testing registration of triggers with the same id
        {
            func: "{that}.app.surveyManager.surveyTriggerManager.registerTrigger",
            args: [keyedInForTrigger]
        }, {
            func: "{that}.app.surveyManager.surveyTriggerManager.registerTrigger",
            args: [keyedInForTriggerDuplicate]
        }, {
            func: "gpii.tests.surveyTriggerManager.testHandlerCreated",
            args: ["{that}.app.surveyManager.surveyTriggerManager", keyedInForTriggerDuplicate]
        }, {
            func: "{that}.app.surveyManager.surveyTriggerManager.removeTrigger",
            args: [keyedInForTriggerDuplicate]
        }, {
            func: "gpii.tests.surveyTriggerManager.testHandlerRemoved",
            args: ["{that}.app.surveyManager.surveyTriggerManager", keyedInForTriggerDuplicate]
        }
    ], [ // Testing resetting of the survey trigger manager
        {
            func: "{that}.app.surveyManager.surveyTriggerManager.registerTrigger",
            args: ["{that}.app.surveyManager.surveyTriggerManager", keyedInForTriggerDuplicate]
        }, {
            func: "{that}.app.surveyManager.surveyTriggerManager.reset"
        }, {
            func: "gpii.tests.surveyTriggerManager.testHandlerRemoved",
            args: ["{that}.app.surveyManager.surveyTriggerManager", keyedInForTriggerDuplicate]
        }
    ]]
};
