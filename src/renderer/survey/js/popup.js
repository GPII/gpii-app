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

    /**
     * A wrapper component for the webview. Provides means for setting the
     * URL of the page which should be loaded in the webview, as well as
     * handles messages sent by the webview and opens links in the OS
     * browser if the corresponding event is triggered on the webview.
     */
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
                args: ["{that}.dom.webview", "{arguments}.0"]
            }
        },
        listeners: {
            "onCreate.notifySurveyCreated": {
                funcName: "{that}.events.onIPCMessage.fire",
                args: ["onSurveyCreated"]
            },
            "onCreate.addIPCListener": {
                funcName: "gpii.survey.popup.addIPCListener",
                args: ["{that}", "{that}.dom.webview"]
            },
            "onCreate.addNewWindowListener": {
                funcName: "gpii.survey.popup.addNewWindowListener",
                args: ["{that}.dom.webview"]
            }
        }
    });

    /**
     * Changes the URL of the page which is to be loaded in the webview.
     * @params webview {jQuery} The jQuery object corresponding to the
     * webview element.
     * @params surveyUrl {String} The URL of the page to be loaded.
     */
    gpii.survey.popup.openSurvey = function (webview, surveyUrl) {
        webview.attr("src", surveyUrl);
    };

    /**
     * Registers a callback to be invoked whenever the webview sends
     * a message to the host `BrowserWindow`. What this function does
     * is to simply fire the `onIPCMessage` event (which will in fact
     * forward the message via the corresponding channel to the main
     * process).
     * @param that {Component} The `gpii.survey.popup` instance.
     * @params webview {jQuery} The jQuery object corresponding to the
     * webview element.
     */
    gpii.survey.popup.addIPCListener = function (that, webview) {
        webview[0].addEventListener("ipc-message", function (event) {
            that.events.onIPCMessage.fire(event.channel, event.args);
        });
    };

    /**
     * Responsible for opening a link in the OS browser if the webview
     * fires the `new-window` event. The latter happens when the user
     * clicks on an anchor tag whose target is `_blank`.
     * @params webview {jQuery} The jQuery object corresponding to the
     * webview element.
     */
    gpii.survey.popup.addNewWindowListener = function (webview) {
        webview.one("dom-ready", function () {
            this.getWebContents().on("new-window", function (event, url) {
                shell.openExternal(url);
            });
        });
    };
})(fluid);
