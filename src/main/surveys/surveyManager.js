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

require("../utils.js");
require("./surveyTriggerManager.js");
require("./surveyConnector.js");
require("./dialogManager.js");

fluid.defaults("gpii.app.surveyManager", {
    gradeNames: ["fluid.modelComponent"],

    model: {
        // TODO to be used with the survey
        machineId: null,
        userId: null
    },


    components: {
        surveyConnector: {
            type: "gpii.app.surveyConnector",
            options: {
                listeners: {
                    "{app}.events.onKeyedIn": {
                        func: "{that}.notifyKeyedIn"
                    },

                    onSurveyRequired: {
                        func: "{dialogManager}.show",
                        args: ["gpii.app.survey", "{arguments}.0"] // the raw payload
                    },

                    onTriggersReceived: {
                        func: "{surveyTriggersManager}.registerTrigger",
                        args: ["{arguments}.0"]
                    }
                }
            }
        },

        surveyTriggersManager: {
            type: "gpii.app.surveyTriggersManager",
            options: {
                listeners: {
                    onTriggerOccurred: {
                        func: "{surveyConnector}.notifyTriggerOccurred",
                        args: "{arguments}.0" // the trigger payload
                    }
                }
            }
        },

        dialogManager: {
            type: "gpii.app.dialogManager",
            options: {
                model: {
                    keyedInUserToken: "{app}.model.keyedInUserToken"
                },
                modelListeners: {
                    keyedInUserToken: {
                        this: "console",
                        method: "log",
                        args: ["keyedInUserToken", "{change}.value"]
                    }
                }
            }
        }
    }
});
