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

var clickSaveBtn        = "jQuery(\".fl-qss-btnId-service-save\").click()",
    closeClosableDialog = "jQuery(\".flc-closeBtn\").click()",
    clickCloseBtn       = "jQuery(\".fl-qss-btnId-service-close\").click()";


fluid.registerNamespace("gpii.tests.qss.saveTests");

gpii.tests.qss.saveTests = [
    { // Open the QSS...
        func: "{that}.app.tray.events.onTrayIconClicked.fire"
    }, { // When the "Save" button is clicked...
        func: "gpii.test.executeJavaScriptInWebContents",
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
        func: "gpii.test.executeJavaScriptInWebContents",
        args: [
            "{that}.app.qssWrapper.qssNotification.dialog",
            closeClosableDialog
        ]
    }, { // ... the QSS notification dialog will be hidden.
        changeEvent: "{that}.app.qssWrapper.qssNotification.applier.modelChanged",
        path: "isShown",
        listener: "jqUnit.assertFalse",
        args: [
            "The QSS notification is hidden when its closed button is pressed",
            "{that}.app.qssWrapper.qssNotification.model.isShown"
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
