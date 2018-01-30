/**
 * The survey trigger manager
 *
 * A component for registering (and deregistering) survey triggers. It also notifies
 * when a trigger has been satisfied.
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

var gpii = fluid.registerNamespace("gpii");

/**
 * Responsible for notifying when a certain survey trigger rule is satisfied.
 * It uses the `gpii.app.rulesEngine` engine to watch for the completion of
 * trigger's conditions.
 * Currently single type of trigger is present, but this may change.
 */
fluid.defaults("gpii.app.surveyTriggerManager", {
    gradeNames: ["fluid.modelComponent"],
    members: {
        registeredTriggerHandlers: {}
    },
    conditionHandlerGrades: {
        keyedInBefore: "gpii.app.keyedInBeforeHandler"
    },
    events: {
        onTriggerAdded: null,
        onTriggerOccurred: null
    },
    dynamicComponents: {
        triggerHandler: {
            type: "gpii.app.triggerHandler",
            createOnEvent: "onTriggerAdded",
            options: {
                trigger: "{arguments}.0",
                model: {
                    trigger: "{that}.options.trigger"
                },
                events: {
                    onTriggerOccurred: "{surveyTriggerManager}.events.onTriggerOccurred"
                },
                listeners: {
                    onCreate: {
                        funcName: "gpii.app.surveyTriggerManager.registerTriggerHandler",
                        args: ["{surveyTriggerManager}", "{that}"]
                    }
                }
            }
        }
    },
    listeners: {
        onTriggerOccurred: {
            func: "{that}.removeTrigger",
            args: [
                "{arguments}.0" // trigger
            ]
        }
    },
    invokers: {
        registerTriggers: {
            funcName: "gpii.app.surveyTriggerManager.registerTriggers",
            args: [
                "{that}",
                "{arguments}.0" // triggers
            ]
        },
        removeTrigger: {
            funcName: "gpii.app.surveyTriggerManager.removeTrigger",
            args: [
                "{that}",
                "{arguments}.0" // trigger
            ]
        },
        reset: {
            funcName: "gpii.app.surveyTriggerManager.reset",
            args: ["{that}"]
        }
    }
});

gpii.app.surveyTriggerManager.registerTriggers = function (that, triggers) {
    fluid.each(triggers, function (trigger) {
        that.removeTrigger(trigger);
        that.events.onTriggerAdded.fire(trigger);
    });
};

gpii.app.surveyTriggerManager.removeTrigger = function (that, trigger) {
    if (trigger && fluid.isValue(trigger.id)) {
        var triggerHandler = that.registeredTriggerHandlers[trigger.id];
        if (triggerHandler) {
            triggerHandler.destroy();
        }
    }
};

gpii.app.surveyTriggerManager.reset = function (that) {
    var triggerHandlers = fluid.values(that.registeredTriggerHandlers);
    fluid.each(triggerHandlers, function (triggerHandler) {
        triggerHandler.destroy();
    });
};

gpii.app.surveyTriggerManager.registerTriggerHandler = function (surveyTriggerManager, triggerHandler) {
    var triggerId = triggerHandler.model.trigger.id;
    surveyTriggerManager.registeredTriggerHandlers[triggerId] = triggerHandler;
};

fluid.defaults("gpii.app.triggerHandler", {
    gradeNames: ["fluid.modelComponent"],
    model: {
        satisfiedCount: 0,
        trigger: {
            // the actual trigger with all its conditions
        }
    },
    events: {
        onConditionSatisfied: null,
        onTriggerOccurred: null
    },
    dynamicComponents: {
        conditionHandler: {
            type: {
                expander: {
                    funcName: "gpii.app.triggerHandler.getConditionHandlerType",
                    args: ["{source}", "{surveyTriggerManager}.options.conditionHandlerGrades"]
                }
            },
            sources: "{that}.model.trigger.conditions",
            options: {
                condition: "{source}",
                model: {
                    condition: "{that}.options.condition"
                },
                events: {
                    onConditionSatisfied: "{triggerHandler}.events.onConditionSatisfied"
                }
            }
        }
    },
    listeners: {
        onConditionSatisfied: {
            funcName: "gpii.app.triggerHandler.onConditionSatisfied",
            args: ["{that}"]
        }
    }
});

gpii.app.triggerHandler.getConditionHandlerType = function (condition, conditionHandlerGrades) {
    var type = condition.type;
    if (conditionHandlerGrades[type]) {
        return conditionHandlerGrades[type];
    } else {
        fluid.fail("No grade name found for a condition with type ", type);
    }
};

gpii.app.triggerHandler.onConditionSatisfied = function (that) {
    that.applier.change("satisfiedCount", that.model.satisfiedCount + 1);
    if (that.model.satisfiedCount === that.model.trigger.conditions.length) {
        that.events.onTriggerOccurred.fire(that.model.trigger);
    }
};

fluid.defaults("gpii.app.conditionHandler", {
    gradeNames: ["fluid.modelComponent"],
    model: {
        condition: {
            // the actual condition with its type and value
        }
    },
    events: {
        onConditionSatisfied: null
    },
    invokers: {
        handleSuccess: {
            funcName: "gpii.app.conditionHandler.handleSuccess",
            args: ["{that}"]
        }
    }
});

gpii.app.conditionHandler.handleSuccess = function (that) {
    that.events.onConditionSatisfied.fire(that.model.condition);
    if (!fluid.isDestroyed(that)) {
        that.destroy();
    }
};

fluid.defaults("gpii.app.timedConditionHandler", {
    gradeNames: ["gpii.app.conditionHandler", "gpii.app.timer"],
    listeners: {
        onTimerFinished: "{that}.handleSuccess()"
    }
});

fluid.defaults("gpii.app.keyedInBeforeHandler", {
    gradeNames: ["gpii.app.timedConditionHandler"],
    listeners: {
        "onCreate.startTimer": {
            funcName: "gpii.app.keyedInBeforeHandler.start",
            args: ["{that}", "{factsManager}.model.keyedInTimestamp"]
        }
    }
});

gpii.app.keyedInBeforeHandler.start = function (that, keyedInTimestamp) {
    var offset = Date.now() - keyedInTimestamp;
    that.start(that.model.condition.value - offset);
};
