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

var clickCloseBtn = "document.querySelector(\".flc-quickSetStrip > div:last-child\").click()";

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

gpii.tests.qss.testDefs = {
    name: "QSS Widget integration tests",
    // expect: 1,
    config: {
        configName: "gpii.tests.dev.config",
        configPath: "tests/configs"
    },
    gradeNames: ["gpii.test.common.testCaseHolder"],
    sequence: [{
        task: "gpii.tests.qss.awaitQssInitialization",
        args: ["{that}.app.qssWrapper.qss"],
        resolve: "jqUnit.assert",
        resolveArgs: ["QSS has initialized successfully"]
    }, {
        func: "jqUnit.assertFalse",
        args: [
            "QSS is not shown when the application is started",
            "{that}.app.qssWrapper.qss.model.isShown"
        ]
    }, {
        func: "{that}.app.tray.events.onTrayIconClicked.fire"
    }, {
        func: "jqUnit.assertTrue",
        args: [
            "QSS is shown when the tray icon is clicked",
            "{that}.app.qssWrapper.qss.model.isShown"
        ]
    }, {
        func: "gpii.tests.qss.executeCommand",
        args: [
            "{that}.app.qssWrapper.qss.dialog",
            clickCloseBtn
        ]
    }, {
        event: "{that}.app.qssWrapper.qss.channelListener.events.onQssClosed",
        listener: "jqUnit.assertFalse",
        args: [
            "QSS is closed when its close button is clicked",
            "{that}.app.qssWrapper.qss.model.isShown"
        ]
    }]
};
