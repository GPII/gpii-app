/**
 * A wrapper for the survey related functionality
 *
 * An Infusion component which simply wraps the `surveyConnector` and the
 * `surveyTriggerManager` and coordinates their interactions.
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

require("../common/utils.js");
require("./surveyTriggerManager.js");
require("./surveyConnector.js");

/**
 * This component serves as a mediator between the `surveyConnector`, the
 * `surveyTriggerManager` and the app itself.
 */
fluid.defaults("gpii.app.surveyManager", {
    gradeNames: ["fluid.modelComponent"],

    events: {
        onSurveyRequired: null
    },

    modelListeners: {
        "{app}.model.keyedInUserToken": {
            func: "{that}.requestTriggers",
            excludeSource: "init"
        }
    },

    components: {
        surveyConnector: {
            type: "gpii.app.surveyConnector",
            options: {
                model: {
                    machineId: "{app}.machineId",
                    keyedInUserToken: "{app}.model.keyedInUserToken"
                },
                events: {
                    onSurveyRequired: "{surveyManager}.events.onSurveyRequired"
                },
                listeners: {
                    onTriggerDataReceived: {
                        funcName: "gpii.app.surveyManager.registerTriggers",
                        args: [
                            "{surveyTriggerManager}",
                            "{arguments}.0" // triggers
                        ]
                    }
                }
            }
        },

        surveyTriggerManager: {
            type: "gpii.app.surveyTriggerManager",
            options: {
                listeners: {
                    onTriggerOccurred: {
                        func: "{surveyConnector}.notifyTriggerOccurred",
                        args: "{arguments}.0" // the trigger payload
                    }
                }
            }
        }
    },

    invokers: {
        requestTriggers: {
            funcName: "gpii.app.surveyManager.requestTriggers",
            args: [
                "{surveyTriggerManager}",
                "{surveyConnector}",
                "{app}.model.keyedInUserToken"
            ]
        }
    }
});

/**
 * Retrieves the survey triggers (which may differ depending on the keyed in user).
 * Any previously registered triggers and trigger handlers will be removed.
 * @param {Component} surveyTriggerManager - The `gpii.app.surveyTriggerManager` instance.
 * @param {Component} surveyConnector - The `gpii.app.surveyConnector` instance.
 * @param {String} keyedInUserToken - The token of the currently keyed in user (if any).
 */
gpii.app.surveyManager.requestTriggers = function (surveyTriggerManager, surveyConnector, keyedInUserToken) {
    surveyTriggerManager.reset();
    if (keyedInUserToken) {
        surveyConnector.requestTriggers();
    }
};

/**
 * Registers all survey triggers received via the `surveyConnector` with
 * the `surveyTriggerManager`.
 * @param {Component} surveyTriggerManager - The `gpii.app.surveyTriggerManager` instance.
 * @param {Array} triggers - An array representing the received triggers.
 */
gpii.app.surveyManager.registerTriggers = function (surveyTriggerManager, triggers) {
    fluid.each(triggers, function (trigger) {
        surveyTriggerManager.registerTrigger(trigger);
    });
};
