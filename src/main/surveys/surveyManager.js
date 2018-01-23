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

var fluid = require("infusion");

require("../utils.js");
require("./surveyTriggerManager.js");
require("./surveyConnector.js");

fluid.defaults("gpii.app.surveyManager", {
    gradeNames: ["fluid.component"],
    events: {
        onSurveyWSConnected: null,
        onSurveyRequired: null
    },

    components: {
        surveyConnector: {
            type: "gpii.app.surveyConnector",
            options: {
                model: {
                    machineId: "{app}.machineId",
                    userId: "{app}.model.keyedInUserToken"
                },
                events: {
                    onConnected: "{surveyManager}.events.onSurveyWSConnected",
                    onSurveyRequired: "{surveyManager}.events.onSurveyRequired"
                },
                listeners: {
                    "{app}.events.onKeyedIn": {
                        func: "{that}.requestTriggers"
                    },

                    onTriggerDataReceived: {
                        func: "{surveyTriggerManager}.registerTrigger",
                        args: ["{arguments}.0"] // triggerData
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
                },
                components: {
                    rulesEngine: "{rulesEngine}"
                }
            }
        }
    }
});
