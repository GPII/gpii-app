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

fluid.registerNamespace("gpii.tests.rulesEngine.testDefs");


var keyedInFactFixture = { keyedInBefore: 1000 };
var menuInteractionsFixture = { menuInteraction: { count: 10, last: "openPsp" }};
var surveyShownFixture = { surveyShownBefore: 1000 };
var multiFactsFixture = fluid.extend({},
    surveyShownFixture,
    menuInteractionsFixture);


/*
 * Simple condition fixtures
 */
var keyedInBeforeConditionsFixture = {
    all: [{
        fact: "keyedInBefore",
        operator: "greaterThanInclusive",
        value: 1000
    }]
};

var surveyShownBeforeConditionsFixture = {
    all: [{
        fact: "surveyShownBefore",
        operator: "greaterThanInclusive",
        value: 1000
    }]
};

var menuInteractionsCountConditionsFixture = {
    all: [{
        fact: "menuInteraction",
        path: ".count",
        operator: "equal",
        value: 10
    }]
};

var menuInteractionsLastConditionsFixture = {
    all: [{
        fact: "menuInteraction",
        path: ".last",
        operator: "notEqual",
        value: "activeSetChange"
    }]
};

/*
 * Complex conditions fixtures
 */
var multiFactsConditionsFixture = {
    any: [
        surveyShownBeforeConditionsFixture,
        menuInteractionsLastConditionsFixture
    ]
};


gpii.tests.rulesEngine.assertObjectEmpty = function (message, value) {
    jqUnit.assertTrue(message, !Object.keys(value).length);
};


/**
 * Fixes the prototype of all sub-arrays of the given object, including the sub-arrays of arrays' objects,
 * so that an `instanceof Array` works as expected. This is needed for two reasons:
 * - infusion somehow changes this prototype, in case an object is passed in `args`
 * - `json-rules-engine` uses `instanceof Array` check instead of the more convenient one - Arrays.isArray(), which
 *   without this fix cases check to fail.
 *   Ref: https://github.com/CacheControl/json-rules-engine/blob/master/src/condition.js#L13
 *
 * @param obj {Object} An object containing arrays as properties
 */
gpii.tests.rulesEngine.sanitizeSubArrays = function (obj) {
    fluid.values(obj)
        .filter(Array.isArray)
        .forEach(function (arr) {
            Object.setPrototypeOf(arr, Array.prototype);

            // apply recursively; assume that all array elements are objects
            arr.forEach(gpii.tests.rulesEngine.sanitizeSubArrays);
        });
};

/**
 * Simple wrapper needed in order sanitation to be made on the conditions object of a rule. Refer
 * to `sanitizeSubArrays` for further clarification.
 * @param rulesEngine {Component} A `gpii.app.rulesEngine` instance
 * @param ruleType {String} Type of the rule
 * @param conditions {Object} Corrupted conditions for the rule
 * @param payload {Object} The payload for the rule
 */
gpii.tests.rulesEngine.addRuleWrapper = function (rulesEngine, ruleType, conditions, payload) {
    gpii.tests.rulesEngine.sanitizeSubArrays(conditions);
    rulesEngine.addRule(ruleType, conditions, payload);
};


gpii.tests.rulesEngine.testDefs = {
    name: "Rules Engine integration tests",
    expect: 4,
    config: {
        configName: "gpii.tests.all.config",
        configPath: "tests/configs"
    },
    gradeNames: ["gpii.test.common.testCaseHolder"],
    sequence: [[
        /*
         * test simple rule check
         * - single fact condition
         * - all test
         */
        { // prepare rulesEngine
            funcName: "gpii.tests.rulesEngine.addRuleWrapper",
            args: [
                "{that}.app.rulesEngine",
                "SingleConditionRule",
                keyedInBeforeConditionsFixture,
                {
                    some: "payload"
                }
            ]
        }, {
            func: "{that}.app.rulesEngine.checkRules",
            args: [keyedInFactFixture]
        },

        {
            event: "{that}.app.rulesEngine.events.onRuleSatisfied",
            listener: "jqUnit.assertDeepEq",
            args: [
                "Single Condition Rule satisfied properly",
                ["SingleConditionRule", { some: "payload" }],
                ["{arguments}.0", "{arguments}.1"]
            ]
        }
    ], [
        /*
         * test reset
         */
        {
            funcName: "gpii.tests.rulesEngine.addRuleWrapper",
            args: [
                "{that}.app.rulesEngine",
                "SingleConditionRule",
                keyedInBeforeConditionsFixture,
                {
                    some: "payload"
                }
            ]
        }, {
            func: "{that}.app.rulesEngine.reset"
        },

        {
            funcName: "gpii.tests.rulesEngine.assertObjectEmpty",
            args: [
                "Rules Engine resets properly",
                "{that}.app.rulesEngine.registeredRulesMap"
            ]
        }
    ], [
        /*
         * test path on conditions & simultaneous rules
         * - all test
         * - two rules
         * - only one rule should pass
         */
        {
            funcName: "gpii.tests.rulesEngine.addRuleWrapper",
            args: [
                "{that}.app.rulesEngine",
                "SingleConditionRule",
                keyedInBeforeConditionsFixture,
                {
                    some: "payload"
                }
            ]
        }, {
            funcName: "gpii.tests.rulesEngine.addRuleWrapper",
            args: [
                "{that}.app.rulesEngine",
                "SingleConditionRuleWithPath",
                menuInteractionsCountConditionsFixture,
                {
                    some: "payload2"
                }
            ]
        }, {
            func: "{that}.app.rulesEngine.checkRules",
            args: [menuInteractionsFixture]
        },

        {
            event: "{that}.app.rulesEngine.events.onRuleSatisfied",
            listener: "jqUnit.assertDeepEq",
            args: [
                "Single Condition Rule with path satisfied properly",
                ["SingleConditionRuleWithPath", { some: "payload2" }],
                ["{arguments}.0", "{arguments}.1"]
            ]
        }
    ], {
        func: "{that}.app.rulesEngine.reset"
    }, [
        /*
         * test multi fact rules
         * - any & all
         * - two fact, single condition
         */
        {
            funcName: "gpii.tests.rulesEngine.addRuleWrapper",
            args: [
                "{that}.app.rulesEngine",
                "SingleConditionRuleWithPath",
                multiFactsConditionsFixture,
                {
                    some: "payload2"
                }
            ]
        }, {
            func: "{that}.app.rulesEngine.checkRules",
            args: [multiFactsFixture]
        },

        {
            event: "{that}.app.rulesEngine.events.onRuleSatisfied",
            listener: "jqUnit.assertDeepEq",
            args: [
                "Multi Facts Condition Rule with path satisfied properly",
                ["SingleConditionRuleWithPath", { some: "payload2" }],
                ["{arguments}.0", "{arguments}.1"]
            ]
        }
    ]
    ]
};
