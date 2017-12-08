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
        shell = require("electron").shell;

    fluid.defaults("gpii.survey.popup", {
        gradeNames: ["fluid.viewComponent"],
        selectors: {
            webview: ".flc-surveyContent"
        },
        events: {
            onIPCMessage: null
        },
        invokers: {
            openSurvey: {
                funcName: "gpii.survey.popup.openSurvey",
                args: ["{that}.dom.webview.0", "{arguments}.0"]
            }
        },
        listeners: {
            "onCreate.initIPCListener": {
                funcName: "gpii.survey.popup.initIPCListener",
                args: ["{that}", "{that}.dom.webview.0"]
            },
            "onCreate.initNewWindowListener": {
                funcName: "gpii.survey.popup.initNewWindowListener",
                args: ["{that}.dom.webview.0"]
            }
        }
    });

    gpii.survey.popup.openSurvey = function (webview, surveyParams) {
        webview.src = surveyParams.url;
    };

    gpii.survey.popup.initIPCListener = function (that, webview) {
        webview.addEventListener("ipc-message", function (event) {
            that.events.onIPCMessage.fire(event.channel, event.args);
        });
    };

    gpii.survey.popup.initNewWindowListener = function (webview) {
        webview.getWebContents().on("new-window", function (event, url) {
            shell.openExternal(url);
        });
    };
})(fluid);
