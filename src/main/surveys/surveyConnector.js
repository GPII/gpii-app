/**
 * A connector for communication with the survey server
 *
 * Responsible for establishing a WebSocket connection to the survey server and for
 * sending/receiving messages to/from it.
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
 * A component which is responsible for sending/receiving survey data to/from the survey server.
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
 * When the server receives a "triggersRequest" message, it will respond with
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
 *            window: { // parameters for the `BrowserWindow` in which the survey would open
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
    gradeNames: ["fluid.modelComponent", "gpii.app.ws"],

    model: {
        machineId: null,
        userId: null
    },
    ignoreErrors: true,

    listeners: {
        "onCreate.connect": "{that}.connect",
        "onMessageReceived.parseMessage": {
            funcName: "gpii.app.surveyConnector.parseMessage",
            args: [
                "{that}.events",
                "{arguments}.0" // message
            ]
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
        onTriggerDataReceived: null
    },

    invokers: {
        requestTriggers: {
            funcName: "gpii.app.surveyConnector.requestTriggers",
            args: ["{that}", "{that}.model"]
        },
        notifyTriggerOccurred: {
            funcName: "gpii.app.surveyConnector.notifyTriggerOccurred",
            args: [
                "{that}",
                "{arguments}.0" // trigger
            ]
        }
    }
});

/**
 * Responsible for parsing messages received via the ws member of the component.
 * @param events {Object} Map of events to be used for the various server requests
 * @param message {Object} The received message
 */
gpii.app.surveyConnector.parseMessage = function (events, message) {
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
        fluid.log(fluid.logLevel.WARN, "SurveyConnector - Unrecognized message type:", message);
    }
};

/**
 * Notify the survey server that a user have keyed in.
 * @param that {Component} The `gpii.app.surveyConnector` instance
 * @param keyedInData {Object} Data that is to be sent over the socket
 * @param keyedInData.userId {String} The id of the keyed in user
 * @param keyedInData.machineId {String} The id of the keyed in user's machine
 */
gpii.app.surveyConnector.requestTriggers = function (that, keyedInData) {
    that.send({
        type: "triggersRequest",
        value: keyedInData
    });
};

/**
 * Notify the survey server that a trigger's conditions are met.
 * @param that {Component} The `gpii.app.surveyConnector` instance
 * @param trigger {Object} Data corresponding to the successful trigger
 */
gpii.app.surveyConnector.notifyTriggerOccurred = function (that, trigger) {
    that.send({
        type: "triggerOccurred",
        value: trigger
    });
};
