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

var sessionTimerTrigger = {
    id: "sessionTimerTrigger_1",
    conditions: [
        {
            type: "sessionTimer",
            value: 2000,
            sessionModulus: 2
        }
    ]
};

var sessionTimerDuplicate = {
    id: "sessionTimerTrigger_1",
    conditions: [
        {
            type: "sessionTimer",
            value: 3000,
            sessionModulus: 5
        }
    ]
};

var keyedInForTrigger = {
    id: "testTrigger_2",
    conditions: [
        {
            type: "keyedInFor",
            value: 1000
        }
    ]
};

var firstSaveTrigger = {
    id: "firstSaveTrigger_1",
    conditions: [
        {
            type: "firstSave"
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

gpii.tests.surveyTriggerManager.satisfyTrigger = function (surveyTriggerManager, triggerFixture) {
    surveyTriggerManager.registeredTriggerHandlers[triggerFixture.id].events.onConditionSatisfied.fire();
};

var firstSaveTriggerHandlerSequence = [
    { // Simulate a key in...
        func: "{that}.app.applier.change",
        args: ["keyedInUserToken", "snapset_1a"]
    }, { // ... with an empty preference set.
        func: "{that}.app.applier.change",
        args: ["preferences", {settingGroups: []}]
    }, { // Register the "firstSave" trigger.
        func: "{that}.app.surveyManager.surveyTriggerManager.registerTrigger",
        args: [firstSaveTrigger]
    }, { // Then simulate pressing of the "Save" button in the QSS.
        func: "{that}.app.qssWrapper.events.onSaveRequired.fire",
        args: ["Your settings were saved to the Morphic Cloud."]
    }, {
        event: "{that}.app.surveyManager.surveyTriggerManager.events.onTriggerOccurred",
        listener: "jqUnit.assertDeepEq",
        args: ["The first key in trigger has occurred", firstSaveTrigger, "{arguments}.0"]
    }
];

var keyedInForTriggerHandlersSequence = [
    {
        func: "{that}.app.surveyManager.surveyTriggerManager.registerTrigger",
        args: [keyedInForTrigger]
    }, {
        func: "{that}.app.factsManager.applier.change",
        args: ["keyedInTimestamp", 1000]
    }, { // make use of the 5000 ms timeout of the jqUnit
        event: "{that}.app.surveyManager.surveyTriggerManager.events.onTriggerOccurred",
        listener: "jqUnit.assertDeepEq",
        args: ["The keyed in trigger has occurred", keyedInForTrigger, "{arguments}.0"]
    }
];

var sessionTimerTriggerHandlersSequence = [
    {
        func: "{that}.app.surveyManager.surveyTriggerManager.registerTrigger",
        args: [sessionTimerTrigger]
    }, { // When the tray icon is clicked and the QSS is shown...
        func: "{that}.app.tray.events.onTrayIconClicked.fire"
    }, { // ...the session is no longer lucky because the interactions count is 1
        // and it is not divisible by the `sessionModulus` from the trigger payload
        changeEvent: "{that}.app.factsManager.applier.modelChanged",
        path: "interactionsCount",
        listener: "jqUnit.assertFalse",
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
        changeEvent: "{that}.app.factsManager.applier.modelChanged",
        path: "interactionsCount",
        listener: "jqUnit.assertTrue",
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
        event: "{that}.app.surveyManager.surveyTriggerManager.events.onTriggerOccurred",
        listener: "jqUnit.assert",
        args: ["The survey fixture is received"]
    }, {
        func: "jqUnit.assertFalse",
        args: [
            "The survey trigger handler no longer exists after a survey is shown",
            "{that}.app.surveyManager.surveyTriggerManager.triggerHandler"
        ]
    }
];

var triggerHandlersSequence = [].concat(
    sessionTimerTriggerHandlersSequence,
    keyedInForTriggerHandlersSequence,
    firstSaveTriggerHandlerSequence
);

var triggersApiSequence = [
    [ // Test registration of triggers with the same id
        {
            func: "{that}.app.surveyManager.surveyTriggerManager.registerTrigger",
            args: [sessionTimerTrigger]
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
    ], [ // Test resetting of the survey trigger manager
        {
            func: "{that}.app.surveyManager.surveyTriggerManager.registerTrigger",
            args: [sessionTimerDuplicate]
        }, {
            func: "{that}.app.surveyManager.surveyTriggerManager.reset"
        }, {
            func: "gpii.tests.surveyTriggerManager.testHandlerRemoved",
            args: ["{that}.app.surveyManager.surveyTriggerManager", sessionTimerDuplicate]
        }
    ], [
        // Test basic trigger workflow
        {
            func: "{that}.app.surveyManager.surveyTriggerManager.registerTrigger",
            args: [sessionTimerTrigger]
        }, {
            func: "gpii.tests.surveyTriggerManager.testHandlerCreated",
            args: ["{that}.app.surveyManager.surveyTriggerManager", sessionTimerTrigger]
        }, {
            // Simulate a setting update via the QSS in order to fulfil the trigger
            func: "gpii.tests.surveyTriggerManager.satisfyTrigger",
            args: [
                "{that}.app.surveyManager.surveyTriggerManager",
                sessionTimerTrigger
            ]
        }, {
            event: "{that}.app.surveyManager.surveyTriggerManager.events.onTriggerOccurred",
            listener: "jqUnit.assertDeepEq",
            args: ["The correct trigger has occurred", sessionTimerTrigger, "{arguments}.0"]
        }, {
            func: "gpii.tests.surveyTriggerManager.testHandlerRemoved",
            args: ["{that}.app.surveyManager.surveyTriggerManager", sessionTimerTrigger]
        }
    ]
];

gpii.tests.surveyTriggerManager.testDefs = {
    name: "Trigger Engine integration tests",
    expect: 27,
    config: {
        configName: "gpii.tests.dev.config",
        configPath: "tests/configs"
    },
    gradeNames: ["gpii.test.common.testCaseHolder"],

    sequence: [].concat(
        {
        /**
         * The tests below seem to complete too fast and the GPII app (including the gpiiConnector and
         * its socket) is destroyed before the "noUser" preferences are delivered to the GPII app. When
         * the Core attempts to do so, the websocket on the PSP's end no longer exists and this causes
         * the socket on the Core's end to hang up and emit an error. This is probably an edge case
         * which is not handled and will probably be tackled in the future and for now it would be better
         * to delay the tests a bit.
         */
            task: "gpii.test.linger",
            args: [4000],
            resolve: "fluid.identity"
        },
        triggerHandlersSequence,
        triggersApiSequence
    )
};
