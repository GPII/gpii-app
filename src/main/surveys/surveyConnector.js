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
var ws    = require("ws");

var gpii = fluid.registerNamespace("gpii");


/**
 * Send/receive survey data to/from the survey server
 * occurred
 */
fluid.defaults("gpii.app.surveyConnector", {
    gradeNames: ["fluid.modelComponent"],

    model: {
        machineId: null,
        userId: null
    },

    config: {
        // {1} - survey server implementation
        // TODO update when survey server is implemented
        surveyServerUrl: null
    },

    members: {
        // TODO update when survey server is implemented
        socket: null // "@expand:gpii.app.surveyConnector.connect({that}.options.config)"
    },

    listeners: {
        "onCreate.register": {
            funcName: "gpii.app.surveyConnector.register",
            args: ["{that}.socket", "{that}.events"]
        }
    },

    events: {
        /*
         * A survey payload is received.
         */
        onSurveyRequired: null,
        /*
         * A list of survey triggers that are to be registered
         */
        onTriggersReceived: null
    },

    invokers: {
        requestTriggers: {
            funcName: "gpii.app.surveyConnector.requestTriggers",
            args: [
                "{that}.socket",
                "{that}.model"
            ]
        },
        notifyTriggerOccurred: {
            funcName: "gpii.app.surveyConnector.notifyTriggerOccurred",
            args: [
                "{that}.socket",
                "{arguments}.0",
                // XXX {1}
                "{that}"
            ]
        },
        notifyKeyedIn: {
            funcName: "gpii.app.surveyConnector.notifyKeyedIn",
            args: ["{that}.socket", "{that}.model", "{that}.events"]
        }
    }
});


gpii.app.surveyConnector.connect = function (config) {
    return new ws(config.surveyServerUrl); // eslint-disable-line new-cap
};

/**
 * XXX {1} Placeholder
 */
gpii.app.surveyConnector.requestTriggers = function (socket, payload) {
    // socket.send("keyedIn", payload); // send `machineId` & `userId`
};

/**
 * XXX {1} Placeholder
 */
gpii.app.surveyConnector.register = function (socket, events) {
    // socket.on("surveyPayload", events.onSurveyRequired.fire); // JSON.parse
    // socket.on("surveyTriggers", events.onTriggersReceived.fire);
};


gpii.app.surveyConnector.notifyTriggerOccurred = function (socket, trigger, that) {
    // XXX {1} Posible implementation
    // socket.send("surveyTrigger", { triggerId: trigger.id });

    console.log("Survey Trigger Occured: ", trigger);
    // XXX mocked behaviour
    var surveyRawPayloadFixture = {
        survey: {
            "url": "https://www.example.com/surveyA/?safeid=longcodeA",
            "window": {
                "height": 600,  //optional
                "width": 800,   //optional
                "userResizable": true,
                "titleBar": {
                    "title": "GPII Auto-Personalization Survey",
                    // "icon": "icon asset", //use gear-cloud icon by default
                    "closeButton": true,     //default
                    "minimizeButton": false, //default
                    "maximizeButton": false  //default
                }
            }
        }
    };
    that.events.onSurveyRequired.fire(surveyRawPayloadFixture);
};


gpii.app.surveyConnector.notifyKeyedIn  = function (socket, payload, events) {
    // socket.send("keyedIn", payload);

    var triggerFixture = {
        surveyTrigger: {
            conditions: [
                {
                    "minutesSinceKeyIn": 3
                }
            ],
            id: "id",
            urlTriggerHandler: "URL of the survey server to handle the surveyTriggerEvent"
        }
    };
    events.onTriggersReceived.fire(triggerFixture.surveyTrigger);
};
