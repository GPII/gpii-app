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

var clickCloseBtn = "jQuery(\".flc-quickSetStrip > div:last-child\").click()",
    hoverCloseBtn = "jQuery(\".flc-quickSetStrip > div:last-child\").trigger(\"mouseenter\")",
    unhoverCloseBtn = "jQuery(\".flc-quickSetStrip > div:last-child\").trigger(\"mouseleave\")",
    focusCloseBtn = "var event = jQuery.Event(\"keyup\"); event.shiftKey = true; event.key = \"Tab\"; jQuery(\".flc-quickSetStrip > div:first-child\").trigger(event)";

var clickSaveBtn = "jQuery(\".flc-quickSetStrip > div:nth-last-child(4)\").click()",
    closeQssNotification = "jQuery(\".flc-closeBtn\").click()";

require("../src/main/app.js");

fluid.registerNamespace("gpii.tests.qss.testDefs");

gpii.tests.qss.awaitQssInitialization = function (qss) {
    var promise = fluid.promise();

    qss.dialog.once("ready-to-show", function () {
        promise.resolve();
    });

    return promise;
};

gpii.tests.qss.executeCommand = function (dialog, command) {
    dialog.webContents.executeJavaScript(command, true);
};

gpii.tests.qss.testPspAndQssVisibility = function (app, params) {
    jqUnit.assertEquals(
        "PSP has correct visibility state",
        params.psp,
        app.psp.model.isShown
    );

    jqUnit.assertEquals(
        "QSS has correct visibility state",
        params.qss,
        app.qssWrapper.qss.model.isShown
    );
};

// XXX: For dev purposes.
gpii.tests.qss.linger = function () {
    var promise = fluid.promise();

    setTimeout(function () {
        promise.resolve();
    }, 2000);

    return promise;
};

gpii.tests.qss.testDefs = {
    name: "QSS Widget integration tests",
    expect: 13,
    config: {
        configName: "gpii.tests.dev.config",
        configPath: "tests/configs"
    },
    gradeNames: ["gpii.test.common.testCaseHolder"],
    sequence: [{ // Wait for the QSS to initialize.
        task: "gpii.tests.qss.awaitQssInitialization",
        args: ["{that}.app.qssWrapper.qss"],
        resolve: "jqUnit.assert",
        resolveArgs: ["QSS has initialized successfully"]
    }, { // At first, neither the PSP, nor the QSS is shown.
        func: "gpii.tests.qss.testPspAndQssVisibility",
        args: [
            "{that}.app",
            {psp: false, qss: false}
        ]
    }, { // When the tray icon is clicked...
        func: "{that}.app.tray.events.onTrayIconClicked.fire"
    }, { // ... both the PSP and the QSS will be shown.
        func: "gpii.tests.qss.testPspAndQssVisibility",
        args: [
            "{that}.app",
            {psp: true, qss: true}
        ]
    }, { // Clicking on the close button in the QSS...
        func: "gpii.tests.qss.executeCommand",
        args: [
            "{that}.app.qssWrapper.qss.dialog",
            clickCloseBtn
        ]
    }, { // ... results in both the PSP and the QSS being hidden.
        event: "{that}.app.qssWrapper.qss.channelListener.events.onQssClosed",
        listener: "gpii.tests.qss.testPspAndQssVisibility",
        args: [
            "{that}.app",
            {psp: false, qss: false}
        ]
    }, { // Open the QSS...
        func: "{that}.app.tray.events.onTrayIconClicked.fire"
    }, {
        func: "jqUnit.assertFalse",
        args: [
            "The QSS tooltip is not shown initially",
            "{that}.app.qssWrapper.qssTooltip.model.isShown"
        ]
    }, { // ... and hover on its close button.
        func: "gpii.tests.qss.executeCommand",
        args: [
            "{that}.app.qssWrapper.qss.dialog",
            hoverCloseBtn
        ]
    }, { // This will bring up the tooltip for that button.
        changeEvent: "{that}.app.qssWrapper.qssTooltip.applier.modelChanged",
        path: "isShown",
        listener: "jqUnit.assertTrue",
        args: [
            "The QSS tooltip is shown when a button is hovered",
            "{that}.app.qssWrapper.qssTooltip.model.isShown"
        ]
    }, { // When the button is no longer hovered...
        func: "gpii.tests.qss.executeCommand",
        args: [
            "{that}.app.qssWrapper.qss.dialog",
            unhoverCloseBtn
        ]
    }, { // ... the tooltip is gone.
        changeEvent: "{that}.app.qssWrapper.qssTooltip.applier.modelChanged",
        path: "isShown",
        listener: "jqUnit.assertFalse",
        args: [
            "The QSS tooltip is hidden when the button is no longer hovered",
            "{that}.app.qssWrapper.qssTooltip.model.isShown"
        ]
    }, { // If the button is focused using keyboard interaction...
        func: "gpii.tests.qss.executeCommand",
        args: [
            "{that}.app.qssWrapper.qss.dialog",
            focusCloseBtn
        ]
    }, {
        changeEvent: "{that}.app.qssWrapper.qssTooltip.applier.modelChanged",
        path: "isShown",
        listener: "jqUnit.assertTrue",
        args: [
            "The QSS tooltip is shown when a button is focused using the keyboard",
            "{that}.app.qssWrapper.qssTooltip.model.isShown"
        ]
    }, { // When the "Save" button is clicked...
        func: "gpii.tests.qss.executeCommand",
        args: [
            "{that}.app.qssWrapper.qss.dialog",
            clickSaveBtn
        ]
    }, { // ... the QSS notification dialog will show up.
        changeEvent: "{that}.app.qssWrapper.qssNotification.applier.modelChanged",
        path: "isShown",
        listener: "jqUnit.assertTrue",
        args: [
            "The QSS notification is shown when the Save button is clicked",
            "{that}.app.qssWrapper.qssNotification.model.isShown"
        ]
    }, { // When the "Close" button in the QSS notification is clicked...
        func: "gpii.tests.qss.executeCommand",
        args: [
            "{that}.app.qssWrapper.qssNotification.dialog",
            closeQssNotification
        ]
    }, { // ... the QSS notification dialog will be hidden.
        changeEvent: "{that}.app.qssWrapper.qssNotification.applier.modelChanged",
        path: "isShown",
        listener: "jqUnit.assertFalse",
        args: [
            "The QSS notification is hidden when its closed button is presseds",
            "{that}.app.qssWrapper.qssNotification.model.isShown"
        ]
    }]
};
