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

var fluid = require("infusion"),
    gpii = fluid.registerNamespace("gpii");

/**
 * A component responsible for creating trigger handlers when the PSP receives
 * the survey triggers and sending the appropriate event (`onTriggerOccurred`)
 * whenever a trigger has occurreded (i.e. all of its conditions have been
 * satisfied).
 *
 * If a survey trigger already exists in the PSP and then a trigger with the
 * same id is registered, the latter will override the former. For this purpose
 * the `surveyTriggerManager` keeps track of the currently registered trigger
 * handlers. Once a trigger has occurred, its handler is destroyed and removed
 * from the handlers map.
 */
fluid.defaults("gpii.app.surveyTriggerManager", {
    gradeNames: ["fluid.modelComponent"],
    members: {
        registeredTriggerHandlers: {}
    },
    conditionHandlerGrades: {
        keyedInFor: "gpii.app.keyedInForHandler",
        sessionTimer: "gpii.app.sessionTimerHandler"
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
                    "onCreate.registerTriggerHandler": {
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
        registerTrigger: {
            funcName: "gpii.app.surveyTriggerManager.registerTrigger",
            args: [
                "{that}",
                "{arguments}.0" // trigger
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

/**
 * Registers a survey trigger with the `surveyTriggerManager` by creating a
 * trigger handler for it. Any trigger handlers for previously registered
 * triggers that have the same id as the current trigger will be destroyed
 * and will no longer be tracked.
 * @param {Component} that - The `gpii.app.surveyTriggerManager` instance.
 * @param {Object} trigger - The survey trigger which is to be registered.
 */
gpii.app.surveyTriggerManager.registerTrigger = function (that, trigger) {
    that.removeTrigger(trigger);
    that.events.onTriggerAdded.fire(trigger);
};

/**
 * Removes a trigger from the `surveyTriggerManager` by destroying its corresponding trigger handler.
 *
 * @param {Component} that - The `gpii.app.surveyTriggerManager` instance.
 * @param {Object} trigger - The survey trigger which is to be removed.
 */
gpii.app.surveyTriggerManager.removeTrigger = function (that, trigger) {
    var triggerId = trigger.id;
    if (fluid.isValue(triggerId)) {
        var triggerHandler = that.registeredTriggerHandlers[triggerId];
        if (triggerHandler) {
            triggerHandler.destroy();
            delete that.registeredTriggerHandlers[triggerId];
        }
    }
};

/**
 * Resets the `surveyTriggerManager` by destroying and removing all registered
 * trigger handlers.
 * @param {Component} that - The `gpii.app.surveyTriggerManager` instance.
 */
gpii.app.surveyTriggerManager.reset = function (that) {
    var triggerHandlers = fluid.values(that.registeredTriggerHandlers);
    fluid.each(triggerHandlers, function (triggerHandler) {
        triggerHandler.destroy();
    });
    that.registeredTriggerHandlers = {};
};

/**
 * Registers a dynamic `triggerHandler` component with its parent `surveyTriggerManager` component. Necessary in order
 * to be able to remove handlers when they are no longer needed.
 *
 * @param {Component} surveyTriggerManager - The `gpii.app.surveyTriggerManager` instance.
 * @param {Component} triggerHandler - The `gpii.app.triggerHandler` instance.
 */
gpii.app.surveyTriggerManager.registerTriggerHandler = function (surveyTriggerManager, triggerHandler) {
    var triggerId = triggerHandler.model.trigger.id;
    surveyTriggerManager.registeredTriggerHandlers[triggerId] = triggerHandler;
};

/**
 * A component which is in charge of determining if a trigger has occurred. For each of
 * the trigger’s conditions the trigger handler will delegate the responsibility of
 * ascertaining whether this condition is satisfied to a specific condition handler. The
 * condition handlers are dynamic subcomponents of the trigger handler.
 */
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

/**
 * Retrieves the `gradeName` for a condition handler based on the condition's type. An error will be thrown if there is
 * no condition handler for the given type.
 *
 * @param {Object} condition - The condition for whose handler the type is to be retrieved.
 * @param {Object} conditionHandlerGrades - A hash whose keys represent all available
 * condition types and the values are the corresponding gradeNames.
 * @return {String} - The `gradeName` which corresponds to the condition.
 */
gpii.app.triggerHandler.getConditionHandlerType = function (condition, conditionHandlerGrades) {
    var type = condition.type;
    if (conditionHandlerGrades[type]) {
        return conditionHandlerGrades[type];
    } else {
        fluid.fail("No grade name found for a condition with type ", type);
    }
};

/**
 * A function of the `triggerHandler` which is invoked when a `conditionHandler` has
 * been satisfied. Its purpose is to determine if the whole trigger has occurred now
 * that one more condition is satisfied.
 * @param {Component} that - The `gpii.app.triggerHandler` instance.
 */
gpii.app.triggerHandler.onConditionSatisfied = function (that) {
    that.applier.change("satisfiedCount", that.model.satisfiedCount + 1);
    if (that.model.satisfiedCount === that.model.trigger.conditions.length) {
        that.events.onTriggerOccurred.fire(that.model.trigger);
    }
};

/**
 * A component which is responsible for determining when a given trigger condition has
 * been satisfied. Depending on the nature of the condition’s fact, the condition
 * handler can schedule a timer or wait to be notified that the value of the fact has
 * changed. Whenever a condition is satisfied, the `onConditionSatisfied` is fired and
 * the condition handler is destroyed.
 */
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

/**
 * A function which is called when a condition handler determines that its condition has been satisfied. Responsible for
 * firing the `onConditionSatisfied` event and destroying the condition handler.
 *
 * @param {Component} that - The `gpii.app.conditionHandler` instance.
 */
gpii.app.conditionHandler.handleSuccess = function (that) {
    that.events.onConditionSatisfied.fire(that.model.condition);
    if (!fluid.isDestroyed(that)) {
        that.destroy();
    }
};

/**
 * An extension of the `gpii.app.conditionHandler` which schedules a timer. When the
 * time is up, the condition is considered to be satisfied.
 */
fluid.defaults("gpii.app.timedConditionHandler", {
    gradeNames: ["gpii.app.conditionHandler", "gpii.app.timer"],
    listeners: {
        onTimerFinished: "{that}.handleSuccess()"
    }
});

/**
 * A `timedConditionHandler` for the `keyedInFor` fact. It determines whether a
 * given amount of time has passed since the user has keyed in.
 */
fluid.defaults("gpii.app.keyedInForHandler", {
    gradeNames: ["gpii.app.timedConditionHandler"],
    listeners: {
        "onCreate.startTimer": {
            funcName: "gpii.app.keyedInForHandler.start",
            args: ["{that}", "{factsManager}.model.keyedInTimestamp"]
        }
    }
});

/**
 * Starts the `keyedInForHandler` timer.
 * @param {Component} that - The `keyedInForHandler` instance.
 * @param {Number} keyedInTimestamp - The timestamp when the user has keyed in.
 */
gpii.app.keyedInForHandler.start = function (that, keyedInTimestamp) {
    var offset = Date.now() - keyedInTimestamp;
    that.start(that.model.condition.value - offset);
};

fluid.defaults("gpii.app.sessionTimerHandler", {
    gradeNames: ["gpii.app.timedConditionHandler"],

    defaultSessionModulus: 1,

    modelRelay: {
        "hasSettings": {
            target: "hasSettings",
            singleTransform: {
                type: "fluid.transforms.free",
                func: "gpii.app.sessionTimerHandler.hasSettings",
                args: [
                    "{app}.model.isKeyedIn",
                    "{app}.model.preferences.settingGroups"
                ]
            }
        }
    },

    listeners: {
        "{qssWrapper}.qss.events.onQssSettingAltered": {
            func: "{that}.startTimer"
        },
        "{psp}.events.onSettingAltered": {
            func: "{that}.startTimer"
        }
    },

    invokers: {
        startTimer: {
            funcName: "gpii.app.sessionTimerHandler.startTimer",
            args: ["{that}", "{factsManager}.model.interactionsCount"]
        }
    }
});

gpii.app.sessionTimerHandler.hasSettings = function (isKeyedIn, settingGroups) {
    return !isKeyedIn || !!fluid.find_if(settingGroups, function (settingGroup) {
        return settingGroup.settings.length > 0;
    });
};

gpii.app.sessionTimerHandler.startTimer = function (that, interactionsCount) {
    var hasSettings = that.model.hasSettings,
        condition = that.model.condition,
        sessionModulus = condition.sessionModulus || that.options.defaultSessionModulus;

    // The timer can be started only during the "lucky session", i.e. if the
    // interactionsCount is a multiple of the sessionModulus.
    if (hasSettings && interactionsCount % sessionModulus === 0 && !that.isActive()) {
        console.log("======starting timer", hasSettings, that.model.condition.value);
        that.start(that.model.condition.value);
    } else {
        console.log("======not starting timer, not a lucky session", hasSettings, interactionsCount, !that.isActive());
    }
};
