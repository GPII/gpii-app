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
    model: {
        triggers: []
    },
    events: {
        onRuleSatisfied: null
    },
    dynamicComponents: {
        ruleHandler: {
            type: "gpii.app.ruleHandler",
            sources: "{that}.model.triggers",
            options: {
                rule: "{source}",
                model: {
                    conditions: "{that}.options.rule.conditions"
                },
                events: {
                    onRuleSatisfied: "{rulesEngine}.events.onRuleSatisfied"
                }
            }
        }
    }
});

fluid.defaults("gpii.app.ruleHandler", {
    gradeNames: ["fluid.modelComponent"],
    rule: {
        // the actual rule with all its conditions
    },
    model: {
        satisfiedCount: 0,
        conditions: []
    },
    events: {
        onConditionSatisfied: null,
        onRuleSatisfied: null
    },
    dynamicComponents: {
        conditionHandler: {
            type: "@expand:fluid.app.ruleHandler.getConditionHandlerType({source})",
            sources: "{that}.model.conditions",
            options: {
                condition: "{source}",
                model: {
                    value: "{that}.options.condition.value"
                },
                events: {
                    onConditionSatisfied: "{ruleHandler}.events.onConditionSatisfied"
                }
            }
        }
    },
    listeners: {
        onConditionSatisfied: {
            funcName: "fluid.app.ruleHandler.onConditionSatisfied",
            args: ["{that}"]
        }
    }
});

fluid.app.ruleHandler.getConditionHandlerType = function (condition) {
    if (condition.type === "keyedInBefore") {
        return "gpii.app.keyedInBeforeHandler";
    }
};

fluid.app.ruleHandler.onConditionSatisfied = function (that) {
    var satisfiedCount = that.model.satisfiedCount + 1;
    that.applier.change("satisfiedCount", satisfiedCount);
    if (satisfiedCount === that.model.conditions.length) {
        that.events.onRuleSatisfied.fire(that.options.rule);
    }
};

fluid.defaults("gpii.app.conditionHandler", {
    gradeNames: ["fluid.modelComponent"],
    condition: {
        // the actual condition with its type and value
    },
    model: {
        value: null
    },
    events: {
        onConditionSatisfied: null
    }
});

fluid.defaults("gpii.app.timedConditionHandler", {
    gradeNames: ["gpii.app.conditionHandler", "gpii.app.timer"],
    listeners: {
        onTimerFinished: "{that}.events.onConditionSatisfied.fire"
    }
});

fluid.defaults("gpii.app.keyedInBeforeHandler", {
    gradeNames: ["gpii.app.timedConditionHandler"],
    listeners: {
        "onCreate.startTimer": {
            funcName: "gpii.app.keyedInBeforeHandler.start",
            args: ["{that}", "{pspFacts}.model.keyedInTimestamp"]
        }
    }
});

gpii.app.keyedInBeforeHandler.start = function (that, keyedInTimestamp) {
    var offset = Date.now() - keyedInTimestamp;
    that.start(that.model.value - offset);
};
