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


fluid.defaults("gpii.app.surveyTriggersManager", {
    gradeNames: ["fluid.modelComponent"],

    model: {
        activeTimer: null
    },


    events: {
        onTriggerOccurred: null
    },

    invokers: {
        registerTrigger: {
            funcName: "gpii.app.surveyTriggersManager.registerTrigger",
            args: ["{that}", "{arguments}.0"]
        },
        clearTriggers: {
            funcName: "gpii.app.surveyTriggersManager.clearTriggers",
            args: ["{that}"]
        }
    }
});


gpii.app.surveyTriggersManager.registerTrigger = function (that, triggerData) {
    that.clearTriggers();

    if (!triggerData || !triggerData.conditions) {
        return;
    }

    var conditions = triggerData.conditions;
    if (conditions.length !== 1) {
        console.log("SurveyTriggerManager: Unsoported number of conditions: ", conditions.length);
        return;
    }

    // XXX mock
    var timer;
    if (conditions[0].minutesSinceKeyIn) {
        timer = setTimeout(
            function () {
                console.log("SurveyTriggerManager: KeyedIn Timer triggered!");

                delete triggerData.conditions;
                that.events.onTriggerOccurred.fire(triggerData);
            },
            conditions[0].minutesSinceKeyIn * 1000
        );
        that.applier.change("activeTimer", timer);
    }
};


gpii.app.surveyTriggersManager.clearTriggers = function (that) {
    if (that.model.activeTimer) {
        clearTimeout(that.model.activeTimer);
        that.applier.change("activeTimer", null, "DELETE");
    }
};
