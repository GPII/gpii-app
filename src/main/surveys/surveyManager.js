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

require("../utils.js");
require("./surveyTriggerManager.js");
require("./surveyConnector.js");

/**
 * This component serves as a mediator between the `surveyConnector`, the
 * `surveyTriggerManager` and the app itself.
 */
fluid.defaults("gpii.app.surveyManager", {
    gradeNames: ["fluid.component"],
    events: {
        onSurveyRequired: null
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
                    "{app}.events.onKeyedIn": {
                        func: "{that}.requestTriggers"
                    },

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
                    "{app}.events.onKeyedOut": "{that}.reset",
                    onTriggerOccurred: {
                        func: "{surveyConnector}.notifyTriggerOccurred",
                        args: "{arguments}.0" // the trigger payload
                    }
                }
            }
        }
    }
});

/**
 * Registers all survey triggers received via the `surveyConnector` with
 * the `surveyTriggerManager`.
 * @param surveyTriggerManager {Component} The `gpii.app.surveyTriggerManager` instance.
 * @param triggers {Array} An array representing the received triggers.
 */
gpii.app.surveyManager.registerTriggers = function (surveyTriggerManager, triggers) {
    fluid.each(triggers, function (trigger) {
        surveyTriggerManager.registerTrigger(trigger);
    });
};
