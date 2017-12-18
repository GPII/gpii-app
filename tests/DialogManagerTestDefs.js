/*
 * GPII App Integration Test Definitions
 *
 * Copyright 2017 OCAD University
 *
 * Licensed under the New BSD license. You may not use this file except in
 * compliance with this License.
 *
 * The research leading to these results has received funding from the European Union's
 * Seventh Framework Programme (FP7/2007-2013)
 * under grant agreement no. 289016.
 *
 * You may obtain a copy of the License at
 * https://github.com/GPII/universal/blob/master/LICENSE.txt
 */

"use strict";

var fluid = require("infusion"),
    jqUnit = fluid.require("node-jqunit", require, "jqUnit"),
    gpii = fluid.registerNamespace("gpii");

require("../node_modules/kettle/lib/test/KettleTestUtils.http.js");
require("../src/main/app.js");

fluid.registerNamespace("gpii.tests.dialogManager.testDefs");

var surveyDialogFixture = {
    url: "https://fluidproject.org/",
    window: {
        width: 500,
        height: 700,
        resizable: true,
        closable: true,
        minimizable: false,
        maximizable: true
    }
};

gpii.tests.dialogManager.receiveApp = function (testCaseHolder, app) {
    testCaseHolder.app = app;
};

gpii.tests.dialogManager.testManagerWithNoKeyedInUser = function (dialogManager) {
    jqUnit.assertFalse("There is no keyed in user for the dialog manager",
        dialogManager.model.keyedInUserToken);
    gpii.tests.dialogManager.testSurveyDialogClosed(dialogManager);
};

gpii.tests.dialogManager.testManagerAfterKeyIn = function (dialogManager, expectedUserToken) {
    jqUnit.assertEquals("The keyed in user token matches the token of the user",
        expectedUserToken, dialogManager.model.keyedInUserToken);
};

gpii.tests.dialogManager.testSurveyDialogShown = function (dialogManager, surveyDialogFixture) {
    var dialog = dialogManager.survey.surveyDialog.dialog,
        windowAttrs = surveyDialogFixture.window,
        dialogSize = dialog.getSize();

    jqUnit.assertTrue("Survey dialog is visible", dialog.isVisible());
    jqUnit.assertDeepEq("Survey dialog has correct dimensions",
        [windowAttrs.width, windowAttrs.height],
        dialogSize);
    jqUnit.assertEquals("Survey dialog resizable state is correct",
        windowAttrs.resizable,
        dialog.isResizable());
    jqUnit.assertDeepEq("Survey dialog has correct state of toolbar buttons",
        [windowAttrs.minimizable, windowAttrs.maximizable, windowAttrs.closable],
        [dialog.isMinimizable(), dialog.isMaximizable(), dialog.isClosable()]
    );
};

gpii.tests.dialogManager.testSurveyDialogHidden = function (dialogManager) {
    var dialog = dialogManager.survey.surveyDialog.dialog;
    jqUnit.assertFalse("Survey dialog is hidden", dialog.isVisible());
};

gpii.tests.dialogManager.testSurveyDialogClosed = function (dialogManager) {
    jqUnit.assertFalse("There is no survey dialog available",
        dialogManager.survey.surveyDialog);
};

gpii.tests.dialogManager.testDefs = {
    name: "Dialog manager integration tests",
    expect: 11,
    config: {
        configName: "app.dev",
        configPath: "configs"
    },
    gradeNames: ["gpii.test.common.testCaseHolder"],
    distributeOptions: {
        record: {
            funcName: "gpii.tests.dialogManager.receiveApp",
            args: ["{testCaseHolder}", "{arguments}.0"]
        },
        target: "{that flowManager gpii.app}.options.listeners.onCreate"
    },
    sequence: [{
        event: "{that gpii.app.surveyManager}.events.onCreate",
        listener: "gpii.tests.dialogManager.testManagerWithNoKeyedInUser",
        args: ["{that}.app.surveyManager.dialogManager"]
    }, {
        func: "{that}.app.keyIn",
        args: ["snapset_1a"]
    }, {
        changeEvent: "{that}.app.surveyManager.dialogManager.applier.modelChanged",
        path: "keyedInUserToken",
        listener: "gpii.tests.dialogManager.testManagerAfterKeyIn",
        args: ["{that}.app.surveyManager.dialogManager", "snapset_1a"]
    }, {
        func: "{that}.app.surveyManager.dialogManager.show",
        args: ["survey", surveyDialogFixture]
    }, {
        event: "{that gpii.app.surveyDialog}.events.onSurveyCreated",
        listener: "gpii.tests.dialogManager.testSurveyDialogShown",
        args: ["{that}.app.surveyManager.dialogManager", surveyDialogFixture]
    }, { // Test hiding of a dialog via the manager
        func: "{that}.app.surveyManager.dialogManager.hide",
        args: ["survey"]
    }, {
        func: "gpii.tests.dialogManager.testSurveyDialogHidden",
        args: ["{that}.app.surveyManager.dialogManager"]
    }, {
        func: "{that}.app.surveyManager.dialogManager.show",
        args: ["survey", surveyDialogFixture]
    }, {
        event: "{that gpii.app.surveyDialog}.events.onSurveyCreated",
        listener: "fluid.identity"
    }, { // Test closing of a dialog via the manager
        func: "{that}.app.surveyManager.dialogManager.close",
        args: ["survey"]
    }, {
        func: "gpii.tests.dialogManager.testSurveyDialogClosed",
        args: ["{that}.app.surveyManager.dialogManager"]
    }, {
        func: "{that}.app.surveyManager.dialogManager.show",
        args: ["survey", surveyDialogFixture]
    }, {
        event: "{that gpii.app.surveyDialog}.events.onSurveyCreated",
        listener: "fluid.identity"
    }, {
        func: "{that}.app.keyOut"
    }, { // Test that the survey dialog is closed when the user keys out
        changeEvent: "{that}.app.surveyManager.dialogManager.applier.modelChanged",
        path: "keyedInUserToken",
        listener: "gpii.tests.dialogManager.testManagerWithNoKeyedInUser",
        args: ["{that}.app.surveyManager.dialogManager"]
    }]
};
