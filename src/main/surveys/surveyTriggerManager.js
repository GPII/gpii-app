/*!
GPII Application
Copyright 2016 Steven Githens
Copyright 2016-2017 OCAD University

Licensed under the New BSD license. You may not use this file except in
compliance with this License.
The research leading to these results has received funding from the European Union's
Seventh Framework Programme (FP7/2007-2013) under grant agreement no. 289016.
You may obtain a copy of the License at
https://github.com/GPII/universal/blob/master/LICENSE.txt
*/
"use strict";

var fluid = require("infusion");

var gpii = fluid.registerNamespace("gpii");

/**
 * Responsible for notifying when a certain survey trigger rule is satisfied.
 * It uses the `gpii.app.rulesEngine` engine to watch for the conditions' completion.
 */
fluid.defaults("gpii.app.surveyTriggerManager", {
    gradeNames: ["fluid.modelComponent"],

    events: {
        onTriggerOccurred: null
    },

    ruleIds: {
        surveyTrigger: "surveyTrigger"
    },

    listeners: {
        "{rulesEngine}.events.onRuleSatisfied": {
            func: "{surveyTriggerManager}.handleRuleSuccess",
            args: [
                "{arguments}.0",
                "{arguments}.1"
            ]
        }

    },
    components: {
        rulesEngine: null
    },

    invokers: {
        reset: {
            funcName: "gpii.app.surveyTriggerManager.reset",
            args: "{that}"
        },

        handleRuleSuccess: {
            funcName: "gpii.app.surveyTriggerManager.handleRuleSuccess",
            args: [
                "{that}",
                "{arguments}.0",
                "{arguments}.1"
            ]
        },

        registerTrigger: {
            funcName: "gpii.app.surveyTriggerManager.registerTrigger",
            args: [
                "{that}.options.ruleIds.surveyTrigger",
                "{rulesEngine}",
                "{arguments}.0"
            ]
        }
    }
});

/**
 * TODO
 */
gpii.app.surveyTriggerManager.reset = function (that) {
    var ruleIds = fluid.values(that.options.ruleIds);

    ruleIds.forEach( function (ruleId) {
        that.rulesEngine.removeRule(ruleId);
    });
};

gpii.app.surveyTriggerManager.handleRuleSuccess = function (that, ruleId, payload) {
    if (ruleId === that.options.ruleIds.surveyTrigger) {
        that.events.onTriggerOccurred.fire(payload);
        that.rulesEngine.removeRule(ruleId);
    }
};

/**
 * TODO
 */
gpii.app.surveyTriggerManager.registerTrigger = function (triggerRuleId, rulesEngine, triggerData) {
    rulesEngine.addRule(triggerRuleId, triggerData.conditions, triggerData);
};
