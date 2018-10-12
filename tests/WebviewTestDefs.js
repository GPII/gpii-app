/**
 * PSP Survey Integration Test Definitions
 *
 * Test definitions for survey related functionalities. Check whether a trigger message
 * is interpreted correctly as well as whether a survey is shown when necessary.
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
    gpii  = fluid.registerNamespace("gpii");

require("../src/main/app.js");

fluid.registerNamespace("gpii.tests.webview.testDefs");

var surveyDialogFixture = {
    url: "%gpii-app/tests/fixtures/webview.html",
    closeOnSubmit: true,
    window: {
        width: 800,
        height: 600,
        resizable: true,
        closable: true,
        minimizable: false,
        maximizable: true
    }
};

// JavaScript commands to be executed in the webview
var clickBreakOutLink     = "document.querySelector(\"a.flc-breakOut[target=_blank]\").click()",
    clickNonBreakOutLink  = "document.querySelector(\"a.flc-nonBreakOut\").click()",
    clickCloseButton      = "document.querySelector(\".flc-closeBtn\").click()",
    addEndOfSurveyElement =
        "var elem = document.createElement(\"div\");" +
        "elem.id = \"EndOfSurvey\";" +
        "document.body.appendChild(elem);";

/**
 * Returns a survey fixtute whose url is resolved to a path on the local file
 * system. The predefined values of the fixture can be overridden further by
 * specifying an `options` argument.
 *
 * @param {Object} options - An object with additional options which will be added to the survey payload.
 * @return {Object} - The survey fixture.
 */
gpii.tests.webview.getSurveyFixture = function (options) {
    var fixture = fluid.extend(true, {}, surveyDialogFixture, options);
    fixture.url = fluid.module.resolvePath(fixture.url);
    return fixture;
};

gpii.tests.webview.testDefs = {
    name: "Webview integration tests",
    expect: 5,
    config: {
        configName: "gpii.tests.dev.config",
        configPath: "tests/configs"
    },
    distributeOptions: {
        target: "{that surveyDialog}.options.listeners",
        record: {
            // Hide the `BrowserWindow` when the survey is closed because otherwise
            // the testing framework cannot intercept the `onSurveyClose` event.
            "onSurveyClose.closeSurvey": {
                changePath: "isShown",
                value: false
            }
        }
    },
    gradeNames: ["gpii.test.common.testCaseHolder"],
    sequence: [
        {
            func: "{that}.app.keyIn",
            args: ["snapset_1a"]
        }, {
            event: "{that}.app.events.onKeyedIn",
            listener: "fluid.identity"
        },
        [ // Test closing the survey using the break-out link
            {
                func: "{that}.app.dialogManager.show",
                args: ["survey", gpii.tests.webview.getSurveyFixture()]
            }, {
                event: "{that gpii.app.surveyDialog}.events.onSurveyCreated",
                listener: "fluid.identity"
            }, {
                func: "{that}.app.dialogManager.survey.dialog.executeJavaScript",
                args: [clickBreakOutLink]
            }, {
                event: "{that}.app.dialogManager.survey.dialog.events.onSurveyClose",
                listener: "jqUnit.assert",
                args: ["Survey was closed by clicking on the break-out link"]
            }
        ],
        [ // Test that the survey will not close when clicking on a non-break-out link
            {
                func: "{that}.app.dialogManager.show",
                args: ["survey", gpii.tests.webview.getSurveyFixture()]
            }, {
                event: "{that gpii.app.surveyDialog}.events.onSurveyCreated",
                listener: "fluid.identity"
            }, {
                func: "{that}.app.dialogManager.survey.dialog.executeJavaScript",
                args: [clickNonBreakOutLink]
            }, {
                func: "jqUnit.assertTrue",
                args: [
                    "Survey was not closed by clicking on a non-break-out link",
                    "{that}.app.dialogManager.survey.dialog.model.isShown"
                ]
            }
        ],
        [ // Test closing the survey using a close button within the content of the survey
            {
                func: "{that}.app.dialogManager.show",
                args: ["survey", gpii.tests.webview.getSurveyFixture()]
            }, {
                event: "{that gpii.app.surveyDialog}.events.onSurveyCreated",
                listener: "fluid.identity"
            }, {
                func: "{that}.app.dialogManager.survey.dialog.executeJavaScript",
                args: [clickCloseButton]
            }, {
                event: "{that}.app.dialogManager.survey.dialog.events.onSurveyClose",
                listener: "jqUnit.assert",
                args: ["Survey was closed by clicking on the close button within the content"]
            }
        ],
        [ // Test closing the survey when a DOM element with id "EndOfSurvey" element appears in the survey.
            {
                func: "{that}.app.dialogManager.show",
                args: ["survey", gpii.tests.webview.getSurveyFixture()]
            }, {
                event: "{that gpii.app.surveyDialog}.events.onSurveyCreated",
                listener: "fluid.identity"
            }, {
                func: "{that}.app.dialogManager.survey.dialog.executeJavaScript",
                args: [addEndOfSurveyElement]
            }, {
                event: "{that}.app.dialogManager.survey.dialog.events.onSurveyClose",
                listener: "jqUnit.assert",
                args: ["Survey was closed automatically when its end has been reached"]
            }
        ],
        [ // Test that the survey will not close if it does not need to close on submit
            {
                func: "{that}.app.dialogManager.show",
                args: ["survey", gpii.tests.webview.getSurveyFixture({closeOnSubmit: false})]
            }, {
                event: "{that gpii.app.surveyDialog}.events.onSurveyCreated",
                listener: "fluid.identity"
            }, {
                func: "{that}.app.dialogManager.survey.dialog.executeJavaScript",
                args: [addEndOfSurveyElement]
            }, {
                func: "jqUnit.assertTrue",
                args: [
                    "Survey was not closed when its end has been reached as it is not configured to closeOnSubmit",
                    "{that}.app.dialogManager.survey.dialog.model.isShown"
                ]
            }
        ],
        {
            func: "{that}.app.keyOut"
        }, {
            event: "{that}.app.events.onKeyedOut",
            listener: "fluid.identity"
        }
    ]
};
