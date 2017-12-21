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
 * It uses the `gpii.app.rulesEngine` engine to watch for the completion of
 * trigger's conditions.
 * Currently single type of trigger is present, but this may change.
 */
fluid.defaults("gpii.app.surveyTriggerManager", {
    gradeNames: ["fluid.modelComponent"],

    events: {
        /*
         * Fired with the payload of the trigger
         */
        onTriggerOccurred: null
    },

    triggerTypes: {
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
                "{that}.options.triggerTypes.surveyTrigger",
                "{rulesEngine}",
                "{arguments}.0"
            ]
        }
    }
});

/**
 * Clears any registered triggers.
 * @param that {Component} The `gpii.app.surveyTriggerManger` component
 */
gpii.app.surveyTriggerManager.reset = function (that) {
    var triggerTypes = fluid.values(that.options.triggerTypes);

    triggerTypes.forEach(function (triggerType) {
        that.rulesEngine.removeRule(triggerType);
    });
};

/**
 * Registers a listener for once the specified rule is completed with success.
 * @param that {Component} The `gpii.app.surveyTriggerManger` component
 * @param ruleType {String} The trigger, for which a rule is registered
 * @param payload {Object} The data to be sent with trigger's success event
 */
gpii.app.surveyTriggerManager.handleRuleSuccess = function (that, triggerType, payload) {
    if (triggerType === that.options.triggerTypes.surveyTrigger) {
        that.events.onTriggerOccurred.fire(payload);
        that.rulesEngine.removeRule(triggerType);
    }
};

/**
 * Registers a watcher for the specified trigger conditions
 * @param triggerType {String} The type of trigger for which watcher to be registered
 * @param rulesEngine {Component} A `gpii.app.rulesEngine` instace
 * @param triggerData {Object} The data for the trigger
 * @param triggerData.conditions {Object} The coditions to be watcher for
 */
gpii.app.surveyTriggerManager.registerTrigger = function (triggerType, rulesEngine, triggerData) {
    rulesEngine.addRule(triggerType, triggerData.conditions, triggerData);
};
