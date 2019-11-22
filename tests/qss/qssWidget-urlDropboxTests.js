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

var clickCloseBtn = "jQuery(\".fl-qss-btnId-service-close\").click()";

function getDropboxDriveWidgetBtnText() {
    return jQuery(".fl-qss-btnId-url-dropbox > span").text();
}

fluid.registerNamespace("gpii.tests.qss.urlDropboxDrive");

gpii.tests.qss.urlDropboxDrive = [
    { // Open the QSS...
        func: "{that}.app.tray.events.onTrayIconClicked.fire"
    }, { // Text of the button should be
        task: "gpii.test.invokeFunctionInWebContents",
        args: [
            "{that}.app.qssWrapper.qss.dialog",
            getDropboxDriveWidgetBtnText
        ],
        resolve: "jqUnit.assertEquals",
        resolveArgs: [
            "Text of the button should be",
            "My Dropbox",
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
