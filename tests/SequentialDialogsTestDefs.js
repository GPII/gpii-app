/*
 * GPII Sequential Dialogs Integration Test Definitions
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

fluid.registerNamespace("gpii.tests.sequentialDialogs.testDefs");

var noInternetErrorFixture = {
    title:   "No Internet connection",
    subhead: "There seem to be a problem your Internet connectivity",
    details: "Have you tried turning it off and on again? If the problem is still present, contact GPII Technical Support.",
    btnLabel1: "Ok",
    fatal: false
};

var keyInErrorFixture = {
    title:   "Cannot Key In",
    subhead: "There might be a problem with the user you are trying to use",
    details: "You can try keying in again. If the problem is still present, contact GPII Technical Support.",
    btnLabel1: "Ok",
    fatal: false
};

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

gpii.tests.sequentialDialogs.testNoQueuedDialogs = function (dialogManager) {
    jqUnit.assertEquals("There are no dialogs in the queue",
        0,
        dialogManager.errorDialogQueue.queue.length);
};

gpii.tests.sequentialDialogs.testDefs = {
    name: "Sequential dialogs integration tests",
    expect: 4,
    config: {
        configName: "gpii.tests.dev.config",
        configPath: "tests/configs"
    },
    gradeNames: ["gpii.test.common.testCaseHolder"],
    sequence: [
        // Try to show two error dialogs initially
        {
            func: "{that}.app.dialogManager.show",
            args: ["errorDialog", noInternetErrorFixture]
        }, {
            func: "{that}.app.dialogManager.show",
            args: ["errorDialog", keyInErrorFixture]
        }, {
            func: "jqUnit.assertEquals",
            args: [
                "There are 2 error dialogs queued for showing",
                2,
                "{that}.app.dialogManager.errorDialogQueue.queue.length"
            ]
        }, { // The first error dialog is shown automatically after a timeout.
            changeEvent: "{that}.app.dialogManager.errorDialog.applier.modelChanged",
            path: "isShown",
            listener: "jqUnit.assertDeepEq",
            args: [
                "Now there is only 1 error dialog queued for showing",
                keyInErrorFixture,
                "{that}.app.dialogManager.errorDialogQueue.queue.0"
            ]
        }, { // Only after the first error dialog is hidden...
            func: "{that}.app.dialogManager.hide",
            args: ["errorDialog"]
        }, {
            changeEvent: "{that}.app.dialogManager.errorDialog.applier.modelChanged",
            path: "isShown",
            listener: "fluid.identity"
        }, { // ...will the second error dialog be shown.
            changeEvent: "{that}.app.dialogManager.errorDialog.applier.modelChanged",
            path: "isShown",
            listener: "gpii.tests.sequentialDialogs.testNoQueuedDialogs",
            args: ["{that}.app.dialogManager"]
        }, { // Then try to show a survey dialog...
            func: "{that}.app.dialogManager.show",
            args: ["survey", surveyDialogFixture]
        }, { // ...and check that it is not queued even though there is already an error dialog shown
            func: "gpii.tests.sequentialDialogs.testNoQueuedDialogs",
            args: ["{that}.app.dialogManager"]
        }
    ]
};
