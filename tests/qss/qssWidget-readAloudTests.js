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
    gpii = fluid.registerNamespace("gpii");

var clickReadAloudBtn = "jQuery(\".fl-qss-btnId-read-aloud\").click()",
    clickToggleBtn    = "jQuery(\".flc-switchUI-control\").click()",
    clickCloseBtn     = "jQuery(\".fl-qss-btnId-service-close\").click()";

var openReadAloudMenuSeqEl = {
    task: "gpii.test.executeJavaScriptInWebContents",
    args: [
        "{that}.app.qssWrapper.qss.dialog",
        clickReadAloudBtn
    ],
    resolve: "fluid.identity"
};

var clickToggleButtonSeqEl = {
    task: "gpii.test.executeJavaScriptInWebContents",
    args: [
        "{that}.app.qssWrapper.qssWidget.dialog",
        clickToggleBtn
    ],
    resolve: "fluid.identity"
};

fluid.registerNamespace("gpii.tests.qss.readAloudTests");

gpii.tests.qss.readAloudTests = [
    { // Open the QSS...
        func: "{that}.app.tray.events.onTrayIconClicked.fire"
    },
    // Toggle button / menu
    // Opening the toggle menu and clicking the toggle button...
    openReadAloudMenuSeqEl,
    clickToggleButtonSeqEl,
    { // ... should notify the core
        event: "{that}.app.settingsBroker.events.onSettingApplied",
        listener: "jqUnit.assertLeftHand",
        args: [
            "Change event was fired from QSS widget interaction.",
            { path: "http://registry\\.gpii\\.net/common/selfVoicing/enabled", value: true },
            "{arguments}.0"
        ]
    },
    // Turn off the read aloud
    clickToggleButtonSeqEl,
    { // And close the QSS widget menu
        task: "gpii.test.executeJavaScriptInWebContents",
        args: [
            "{that}.app.qssWrapper.qss.dialog",
            clickCloseBtn
        ],
        resolve: "fluid.identity"
    }
];
