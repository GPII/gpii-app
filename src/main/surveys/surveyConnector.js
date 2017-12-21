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
 *
 * All payloads sent to or received from the survey server conform to the
 * following format:
 *     {
 *         type: <payload_type>, // "surveyTrigger", "survey", "triggersRequest" or "triggerOccurred"
 *         value: <payload_value> // an object depending on the type of the payload
 *     }.
 *
 * When a user keyes in, the `surveyConnector` would send a payload that
 * would look like this:
 *     {
 *         type: "triggersRequest",
 *         value: {
 *             userId: <keyedInUserToken> // the token of the currently keyed in user
 *             machineId: <machineId> // the installation id of the OS
 *         }
 *     }
 *
 * When the server receives a "surveyTrigger" request, it will respond with
 * the following message:
 *     {
 *         type: "surveyTrigger",
 *         value: {
 *             conditions: {
 *                 // lists all conditions that need to be satisfied for this
 *                 // trigger. See the `rulesEngine` documentation for more info.
 *             }
 *         }
 *     }
 *
 * When the conditions for a survey trigger have been satisfied, the `surveyConnector`
 * would send the following message to the survey server:
 *     {
 *         type: "triggerOccurred",
 *         value: <triggerObject> // the same value from the "surveyTrigger" payload
 *     }
 *
 * Finally, the message that the survey server will send in order for the PSP to
 * show a survey would look like this:
 *    {
 *        type: "survey",
 *        value: {
 *            url: <the Qualtrics survey's URL>,
 *            closeOnSubmit: <true | false> // whether the survey should close automatically when completed
 *            window": { // parameters for the `BrowserWindow` in which the survey would open
 *                // Below are given some configuration parameters with their default values
 *                width: 800,
 *                height: 600,
 *                resizable: true,
 *                title: "GPII Auto-Personalization Survey",
 *                closable: true, // whether the survey can be closed via a button in the titlebar
 *                minimizable: false, // whether the survey can be minimized via a button in the titlebar
 *                maximizable: false // whether the survey can be maximied via a button in the titlebar
 *        }
 *    }
 * Any valid configuration option for the `BrowserWindow` can also be specified in the `window`
 * object of the payload above without the need for any further actions on the PSP's side.
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
        onTriggerDataReceived: null
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
        var type = message.type,
            value = message.value;

        switch (type) {
        case "survey":
            events.onSurveyRequired.fire(value);
            break;
        case "surveyTrigger":
            events.onTriggerDataReceived.fire(value);
            break;
        default:
            console.log("SurveyConnector - Unrecognized message type: ", message);
        }
    });
};

/**
 * TODO
 */
gpii.app.surveyConnector.requestTriggers = function (socket, keyedInData) {
    socket.send(JSON.stringify({
        type: "triggersRequest",
        value: keyedInData
    }));
};

/**
 * TODO
 */
gpii.app.surveyConnector.notifyTriggerOccurred = function (socket, trigger) {
    socket.send(JSON.stringify({
        type: "triggerOccurred",
        value: trigger
    }));
};
