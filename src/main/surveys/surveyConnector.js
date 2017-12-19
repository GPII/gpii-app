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

var fluid     = require("infusion");
var WebSocket = require("ws");

var gpii = fluid.registerNamespace("gpii");

// XXX TEST
require("./surveyServer.js");

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
        hostname: "localhost",
        port: 3333
    },

    members: {
        socket: "@expand:gpii.app.surveyConnector.connect({that}.options.config, {that}.events.onSocketOpened.fire)"
    },

    listeners: {
        "onSocketOpened.register": {
            funcName: "gpii.app.surveyConnector.register",
            args: ["{that}.socket", "{that}.events"]
        }
    },

    events: {
        onSocketOpened: null,
        /*
         * A survey payload is received.
         */
        onSurveyRequired: null,
        /*
         * A list of survey triggers that are to be registered
         */
        onTriggerReceived: null
    },

    invokers: {
        requestTriggers: {
            funcName: "gpii.app.surveyConnector.requestTriggers",
            args: [
                "{that}.socket",
                "{that}.model",
                "{that}.events"
            ]
        },
        notifyTriggerOccurred: {
            funcName: "gpii.app.surveyConnector.notifyTriggerOccurred",
            args: [
                "{that}.socket",
                "{arguments}.0"
            ]
        }
    }
});


/**
 * TODO
 */
gpii.app.surveyConnector.connect = function (config, callback) {
    var serverUrl = fluid.stringTemplate("ws://%hostname:%port", config),
        ws = new WebSocket(serverUrl);
    ws.on("open", callback);

    return ws;
};

/**
 * TODO
 */
gpii.app.surveyConnector.register = function (socket, events) {
    socket.on("message", function (message) {
        message = JSON.parse(message);
        // Single key payload
        var type = Object.keys(message)[0],
            payload = message[type];

        switch (type) {
        case "survey":
            events.onSurveyRequired.fire(payload);
            break;
        case "surveyTrigger":
            events.onTriggerReceived.fire(payload);
            break;
        default:
            console.log("SurveyConnector - Unrecognized message type: ", message);
        }
    });
};

/**
 * TODO
 */
gpii.app.surveyConnector.requestTriggers = function (socket, payload) {
     // send `machineId` & `userId`
    socket.send(JSON.stringify({
        type: "triggersRequest",
        payload: payload
    }));
};

/**
 * TODO
 */
gpii.app.surveyConnector.notifyTriggerOccurred = function (socket, trigger) {
    socket.send(JSON.stringify({
        type: "triggerOccurred",
        payload: trigger
    }));
};
