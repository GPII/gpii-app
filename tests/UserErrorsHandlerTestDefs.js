/*
 * GPII User Errors handler integration tests
 *
 * Copyright 2018 Raising the Floor - International
 *
 * Licensed under the New BSD license. You may not use this file except in
 * compliance with this License.
 *
 * You may obtain a copy of the License at
 * https://github.com/GPII/universal/blob/master/LICENSE.txt
 */

"use strict";

var fluid = require("infusion"),
    jqUnit = fluid.require("node-jqunit", require, "jqUnit"),
    gpii = fluid.registerNamespace("gpii");


require("../src/main/app.js");
require("./testUtils.js");

fluid.registerNamespace("gpii.tests.userErrorsHandler.testDefs");

var invalidUser = "asdasd_";
var expectedDialogOptionsProperties = ["title", "subhead", "details", "errCode"];

gpii.tests.userErrorsHandler.assertErrorDialogOptions = function (dialogOptions) {
    fluid.each(expectedDialogOptionsProperties,
        function (property) {
            jqUnit.assertValue(
                "Error dialog should be shown with proper values - property is not a string: " + property,
                dialogOptions[property]
            );
        });
};

gpii.tests.userErrorsHandler.testDefs = {
    name: "User errors handler integration tests",
    expect: 5,
    config: {
        configName: "gpii.tests.dev.config",
        configPath: "tests/configs"
    },
    gradeNames: ["gpii.test.common.testCaseHolder"],
    sequence: [{ // When an error is fired...
        func: "{that}.app.keyIn",
        args: invalidUser
    }, { // ... an error dialog should be shown with the proper values.
        event: "{that}.app.dialogManager.error.events.onDialogCreate",
        listener: "gpii.tests.userErrorsHandler.assertErrorDialogOptions",
        args: [
            "{arguments}.0"
        ]
    }, { // Clicking the close button in the error dialog...
        func: "gpii.tests.qss.executeJavascript",
        args: [
            "{that}.app.dialogManager.error.dialog.dialog",
            "jQuery(\".flc-closeBtn\").click()"
        ]
    }, { // ... results in the error dialog being hidden.
        event: "{that}.app.dialogManager.error.dialog.dialogChannel.events.onErrorDialogClosed",
        listener: "jqUnit.assertFalse",
        args: [
            "The error dialog is closed when its close button is clicked",
            "{that}.app.dialogManager.error.dialog.model.isShown"
        ]
    }]
};
