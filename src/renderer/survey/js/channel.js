/*!
Copyright 2017 Raising the Floor - International

Licensed under the New BSD license. You may not use this file except in
compliance with this License.
The research leading to these results has received funding from the European Union's
Seventh Framework Programme (FP7/2007-2013) under grant agreement no. 289016.
You may obtain a copy of the License at
https://github.com/GPII/universal/blob/master/LICENSE.txt
*/

/* global fluid */

"use strict";
(function (fluid) {
    var gpii = fluid.registerNamespace("gpii"),
        ipcRenderer = require("electron").ipcRenderer;

    fluid.defaults("gpii.survey.channel", {
        gradeNames: ["fluid.component"],
        events: {
            openSurvey: null
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

    gpii.survey.channel.sendMessage = function (channel, message) {
        ipcRenderer.send(channel, message);
    };

    gpii.survey.channel.initialize = function (channel) {
        ipcRenderer.on("openSurvey", function (event, surveyParams) {
            channel.events.openSurvey.fire(surveyParams);
        });
    };
})(fluid);
