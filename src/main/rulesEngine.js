/**
 * A custom rules engine implementation
 *
 * A component which checks if a registered rule has been satisfied against a set of
 * provided facts. Provides means for registering/degeristering rules and for
 * notifying that a rule has been satisfied.
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

var fluid = require("infusion");
var RulesEngine = require("json-rules-engine").Engine;

var gpii = fluid.registerNamespace("gpii");


/**
 * A component that, having facts provided, supports checks on whether a list of
 * rules (their conditions) are satisfied and notifies by firing an event with the `ruleId`
 * once a rule's conditions are met. A rule is represented as a set of conditions and in
 * order for the rule to be checked it needs to be registered. Multiple rules
 * could be registered and they'll be checked simultaneously.
 * Every rule requires a list of conditions and a unique `ruleId` to be given to it.
 * In case a rule with such id is already registered, it will be OVERRIDDEN with the newly added.
 *
 * Facts are supplied by the `gpii.app.factsManager` and represent pieces of information
 * that are used for the various checks in the dependent conditions. Each condition
 * specifies the name of the fact which it is dependent on. Here's a simple example:
 * Given the condition
 * ```
 * all: [{
 *   fact: "keyedInBefore,
 *   operator: "equal",
 *   value: 3000
 * }]
 * ```
 * It requires the fact "keyedInBefore" for its check. Facts are supplied as a
 * map and are expected to follow the format: `{ "factName": factValue, ... }`
 *
 * Removal of rules is also supported. For example, it could be the case that once a rule's
 * conditions are met, the rule should be removed (de-registered), as notifications are no more
 * required, but this is delegated to the user of the component to decide.
 *
 *
 * For a user of this rules engine it is most likely to follow this workflow:
 * - register for `onRuleSatisfied` event and watch for specific `ruleId`
 * - registering a rule  that is to be tested, using the `addRule` method
 * - removing the rule once the rule succeeds, using the `removeRule` method
 *
 * N.B.! Only one rule can be registered for with given id at time.
 *
 * Note: A strange implementation detail is that currently each rule is run in dedicated `json-rule-engine` engine
 * in order to support removal (de-registration) of rules. Although it this seems like a strange hack to be used,
 * using this module adds flexibility and currently seems sufficient.
 */
fluid.defaults("gpii.app.rulesEngine", {
    gradeNames: ["fluid.modelComponent"],

    /*
     * A map of currently registered rules.
     * As we want to have control over registered rules
     * (remove or change a rule by an id) using the
     * third-party dependency `json-rules-engine` necessitates
     * that we keep them in the following manner:
     * { ruleId: <Single Ruled ruleEngine>,... }
     * where `ruleEngine` is of type `json-rules-engine` engine
     * In other words, every rule is kept in a dedicated ruleEngine
     * (a `json-rules-engine` engine).
     */
    members: {
        registeredRulesMap: {}
    },

    events: {
        /*
         * Fired once any rule is satisfied.
         * Fired with arguments:
         * <ruleId>       - the successful rule's id,
         * <rule_payload> - the payload which is provided with rule registration
         */
        onRuleSatisfied: null
    },

    invokers: {
        checkRules: {
            funcName: "gpii.app.rulesEngine.checkRules",
            // the new facts
            args: [
                "{that}.registeredRulesMap",
                "{arguments}.0"
            ]
        },
        addRule: {
            funcName: "gpii.app.rulesEngine.addRule",
            args: [
                "{that}",
                "{that}.registeredRulesMap",
                "{arguments}.0",
                "{arguments}.1",
                "{arguments}.2"
            ]
        },
        removeRule: {
            funcName: "gpii.app.rulesEngine.removeRule",
            args: [
                "{that}.registeredRulesMap",
                "{arguments}.0"
            ]
        },
        reset: {
            funcName: "gpii.app.rulesEngine.reset",
            args: [
                "{that}",
                "{that}.events"
            ]
        },

        // Could be overwritten to provide different success handling
        registerSuccessListener: {
            funcName: "gpii.app.rulesEngine.registerSuccessListener",
            args: [
                "{arguments}.0",
                "{arguments}.1",
                "{that}.events"
            ]
        }
    }
});

/**
 * Registers a success listener for the given rule. Once the rule is satisfied an
 * event is fired with `ruleId` and  `payload` as parameters.
 * @param registeredRulesMap {Object} The map of all registered rules
 * @param ruleId {String} The id for the that is to be removed
 * @param events {Object} A map of events that could be used (events that are part
 * of `gpii.app.rulesEngine` signature`)
 */
gpii.app.rulesEngine.registerSuccessListener = function (registeredRulesMap, ruleId, events) {
    // Register listener for once the specified rule is successful
    registeredRulesMap[ruleId].on("success", function (event) {
        events.onRuleSatisfied.fire(ruleId, event.params);
    });
};

/**
 * Remove all registered rules for the engine.
 * @param that {Component} The `gpii.app.rulesEngine` component
 */
gpii.app.rulesEngine.reset = function (that) {
    that.registeredRulesMap = {};
};

/**
 * Removes a rule from the rule engine. For example this could wanted for
 * once the rule is satisfied, but this logic is delegated to the user of the
 * component.
 * @param registeredRulesMap {Object} The map of all registered rules
 * @param ruleId {String} The id for the that is to be removed
 */
gpii.app.rulesEngine.removeRule = function (registeredRulesMap, ruleId) {
    // just let garbage collection do its work for the old rule
    registeredRulesMap[ruleId] = null;
};

/**
 * Registers a rule to the engine which is to be tested with the next `checkRules` call.
 * A rule's conditions follow this schema https://github.com/CacheControl/json-rules-engine/blob/72d0d2abe46ae95c730ac5ccbe7cb0f6cf28d784/docs/rules.md#conditions,
 * where a `fact` by this name is registered in the `gpii.app.factsManager`.
 *
 * @param that {Component} The `gpii.app.rulesEngine` component
 * @param registeredRulesMap {Object} The map of all registered rules
 * @param ruleId {String} The unique id for the rule being added. N.B. In case a rule with
 * such id already exists, it will be overridden.
 * @param conditions {Object} The list of conditions for the rules
 * @param payload {Object} The payload to be sent with the event once the rule succeeds
 */
gpii.app.rulesEngine.addRule = function (that, registeredRulesMap, ruleId, conditions, payload) {
    /*
     * This approach is needed by the current dependent rule engine module (`json-rules-engine`), which doesn't
     * support removal of already added rules. But we want to use its extensive conditions checking functionality.
     */
    registeredRulesMap[ruleId] = new RulesEngine([{
        conditions: conditions,
        event: {
            type: ruleId,
            params: payload
        }
    }]);

    that.registerSuccessListener(registeredRulesMap, ruleId);
};

/**
 * Runs an async check whether any of the registered rules is satisfied
 * against the supplied facts. In case a rule's conditions are met, the
 * registered "success" listener will be fired.
 *
 * @param registeredRulesMap {Object} The map of registered rules
 * @param facts {Object} A map of all facts to be used for the checking.
 * Follows the schema { factName: factValue, ... }.
 */
gpii.app.rulesEngine.checkRules = function (registeredRulesMap, facts) {
    var ruleEngines = fluid
        .values(registeredRulesMap)
        .filter(fluid.isValue);

    ruleEngines.forEach(function (engine) {
        engine.run(facts);
    });
};
