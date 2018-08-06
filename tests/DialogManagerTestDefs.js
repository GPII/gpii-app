/*
 * GPII Dialog Manager Integration Test Definitions
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

require("../src/main/app.js");

fluid.registerNamespace("gpii.tests.dialogManager.testDefs");

var surveyDialogFixture = {
    url: "https://fluidproject.org/",
    window: {
        resizable: true,
        closable: true,
        minimizable: false,
        maximizable: true
    }
};

gpii.tests.dialogManager.testManagerWithNoKeyedInUser = function (dialogManager) {
    jqUnit.assertFalse("There is no keyed in user for the dialog manager",
        dialogManager.model.isKeyedIn);
    gpii.tests.dialogManager.testSurveyDialogClosed(dialogManager);
};

gpii.tests.dialogManager.testSurveyDialogShown = function (dialogManager, surveyDialogFixture) {
    var dialog = dialogManager.survey.dialog.dialog,
        windowAttrs = surveyDialogFixture.window;

    jqUnit.assertTrue("Survey dialog is visible", dialog.isVisible());
    jqUnit.assertEquals("Survey dialog resizable state is correct",
        windowAttrs.resizable,
        dialog.isResizable());
    jqUnit.assertDeepEq("Survey dialog has correct state of toolbar buttons",
        [windowAttrs.minimizable, windowAttrs.maximizable, windowAttrs.closable],
        [dialog.isMinimizable(), dialog.isMaximizable(), dialog.isClosable()]
    );
};

gpii.tests.dialogManager.testSurveyDialogHidden = function (dialogManager) {
    var dialog = dialogManager.survey.dialog.dialog;
    jqUnit.assertFalse("Survey dialog is hidden", dialog.isVisible());
};

gpii.tests.dialogManager.testSurveyDialogClosed = function (dialogManager) {
    jqUnit.assertFalse("There is no survey dialog available",
        dialogManager.survey.dialog);
};

gpii.tests.dialogManager.testDefs = {
    name: "Dialog manager integration tests",
    expect: 10,
    config: {
        configName: "gpii.tests.dev.config",
        configPath: "tests/configs"
    },
    gradeNames: ["gpii.test.common.testCaseHolder"],
    sequence: [{
        func: "gpii.tests.dialogManager.testManagerWithNoKeyedInUser",
        args: ["{that}.app.dialogManager"]
    }, {
        func: "{that}.app.keyIn",
        args: ["snapset_1a"]
    }, {
        changeEvent: "{that}.app.dialogManager.applier.modelChanged",
        path: "isKeyedIn",
        listener: "jqUnit.assertTrue",
        args:[
            "There is a keyed in user for the dialog manager",
            "{that}.app.dialogManager.model.isKeyedIn"
        ]
    }, {
        func: "{that}.app.dialogManager.show",
        args: ["survey", surveyDialogFixture]
    }, {
        event: "{that gpii.app.surveyDialog}.events.onSurveyCreated",
        listener: "gpii.tests.dialogManager.testSurveyDialogShown",
        args: ["{that}.app.dialogManager", surveyDialogFixture]
    }, { // Test hiding of a dialog via the manager
        func: "{that}.app.dialogManager.hide",
        args: ["survey"]
    }, {
        func: "gpii.tests.dialogManager.testSurveyDialogHidden",
        args: ["{that}.app.dialogManager"]
    }, {
        func: "{that}.app.dialogManager.show",
        args: ["survey", surveyDialogFixture]
    }, {
        event: "{that gpii.app.surveyDialog}.events.onSurveyCreated",
        listener: "fluid.identity"
    }, { // Test closing of a dialog via the manager
        func: "{that}.app.dialogManager.close",
        args: ["survey"]
    }, {
        func: "gpii.tests.dialogManager.testSurveyDialogClosed",
        args: ["{that}.app.dialogManager"]
    }, {
        func: "{that}.app.dialogManager.show",
        args: ["survey", surveyDialogFixture]
    }, {
        event: "{that gpii.app.surveyDialog}.events.onSurveyCreated",
        listener: "fluid.identity"
    }, {
        func: "{that}.app.keyOut"
    }, { // Test that the survey dialog is closed when the user keys out
        changeEvent: "{that}.app.dialogManager.applier.modelChanged",
        path: "isKeyedIn",
        listener: "gpii.tests.dialogManager.testManagerWithNoKeyedInUser",
        args: ["{that}.app.dialogManager"]
    }]
};
