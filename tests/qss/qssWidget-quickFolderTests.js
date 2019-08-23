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

var fluid = require("infusion");
var gpii  = fluid.registerNamespace("gpii");

var checkIfQuickFoldersWidget = "jQuery('.fl-qss-btnId-cloud-folder-open').is(':visible')",
	clickCloseBtn = "jQuery(\".fl-qss-btnId-service-close\").click()";

function getQuickFolderWidgetBtnText() {
    return jQuery(".fl-qss-btnId-cloud-folder-open > span").text();
}

fluid.registerNamespace("gpii.tests.qss.quickFolderTests");

gpii.tests.qss.quickFolderTests = [
    { // Open the QSS...
        func: "{that}.app.tray.events.onTrayIconClicked.fire"
    }, { // ... and quick folders button should be visible
        task: "gpii.test.executeJavaScriptInWebContents",
        args: [
            "{that}.app.qssWrapper.qss.dialog",
            checkIfQuickFoldersWidget
        ],
        resolve: "jqUnit.assertTrue",
        resolveArgs: ["The quick folder button is displayed: ", "{arguments}.0"]
    }, { // Text of the button should be
        task: "gpii.test.invokeFunctionInWebContents",
        args: [
            "{that}.app.qssWrapper.qss.dialog",
            getQuickFolderWidgetBtnText
        ],
        resolve: "jqUnit.assertEquals",
        resolveArgs: [
            "Text of the button should be",
            "Open Quick Folder",
            "{arguments}.0"
        ]
    }, { // Close the QSS
        task: "gpii.test.executeJavaScriptInWebContents",
        args: [
            "{that}.app.qssWrapper.qss.dialog",
            clickCloseBtn
        ],
        resolve: "fluid.identity"
    }
];