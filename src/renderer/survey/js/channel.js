/**
 * Channel for survey related IPC.
 *
 * A component responsible for IPC between the main and the renderer processes regarding
 * the surveys, as well as between the survey `BrowserWindow` and the webview embedding
 * the actual survey web page.
 * Copyright 2017 Raising the Floor - International
 *
 * Licensed under the New BSD license. You may not use this file except in
 * compliance with this License.
 * The research leading to these results has received funding from the European Union's
 * Seventh Framework Programme (FP7/2007-2013) under grant agreement no. 289016.
 * You may obtain a copy of the License at
 * https://github.com/GPII/universal/blob/master/LICENSE.txt
 */

/* global fluid */
"use strict";
(function (fluid) {
    var gpii = fluid.registerNamespace("gpii"),
        ipcRenderer = require("electron").ipcRenderer;

    /**
     * Responsible for communication between the main and the renderer
     * processes for survey related messages.
     */
    fluid.defaults("gpii.survey.channel", {
        gradeNames: ["fluid.component"],
        events: {
            onSurveyOpen: null,
            onExecuteCommand: null
        },
        listeners: {
            "onCreate.initChannel": {
                funcName: "gpii.survey.channel.initialize",
                args: ["{that}"]
            }
        },
        invokers: {
            sendMessage: {
                funcName: "gpii.survey.channel.sendMessage"
            }
        }
    });

    /**
     * Sends asynchronously a message to the main process.
     *
     * @param {String} channel - The channel via which the message will be sent.
     * @param {Any} message - The actual message that is to be sent.
     */
    gpii.survey.channel.sendMessage = function (channel, message) {
        ipcRenderer.send(channel, message);
    };

    /**
     * Initializes the component by registering listeners for survey
     * related messages sent by the main process.
     * @param {Component} that - The `gpii.survey.channel` instance.
     */
    gpii.survey.channel.initialize = function (that) {
        ipcRenderer.on("onSurveyOpen", function (event, surveyParams) {
            that.events.onSurveyOpen.fire(surveyParams);
        });

        ipcRenderer.on("onExecuteCommand", function (event, command) {
            that.events.onExecuteCommand.fire(command);
        });
    };
})(fluid);
