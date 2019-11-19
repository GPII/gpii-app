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

var clickLanguageBtn    = "jQuery(\".fl-qss-btnId-language\").click()",
    closeClosableDialog = "jQuery(\".flc-closeBtn\").click()",
    clickCloseBtn       = "jQuery(\".fl-qss-btnId-service-close\").click()";

fluid.registerNamespace("gpii.tests.qss.menuTests");

gpii.tests.qss.menuTests = [
    { // Open the QSS...
        func: "{that}.app.tray.events.onTrayIconClicked.fire"
    }, { // If the language button in the QSS is clicked...
        func: "gpii.test.executeJavaScriptInWebContents",
        args: [
            "{that}.app.qssWrapper.qss.dialog",
            clickLanguageBtn
        ]
    }, { // ... the QSS widget menu will be shown.
        changeEvent: "{that}.app.qssWrapper.qssWidget.applier.modelChanged",
        path: "isShown",
        listener: "jqUnit.assertTrue",
        args: [
            "The QSS widget is shown when the language button is pressed",
            "{that}.app.qssWrapper.qssWidget.model.isShown"
        ]
    }, { // If the close button in the QSS is pressed...
        func: "gpii.test.executeJavaScriptInWebContents",
        args: [
            "{that}.app.qssWrapper.qssWidget.dialog",
            closeClosableDialog
        ]
    }, { // ... the QSS widget menu will be hidden.
        changeEvent: "{that}.app.qssWrapper.qssWidget.applier.modelChanged",
        path: "isShown",
        listener: "jqUnit.assertFalse",
        args: [
            "The QSS widget is hidden when its closed button is pressed",
            "{that}.app.qssWrapper.qssWidget.model.isShown"
        ]
    }, { // If the language button in the QSS is clicked once...
        func: "gpii.test.executeJavaScriptInWebContents",
        args: [
            "{that}.app.qssWrapper.qss.dialog",
            clickLanguageBtn
        ]
    }, {
        changeEvent: "{that}.app.qssWrapper.qssWidget.applier.modelChanged",
        path: "isShown",
        listener: "fluid.identity"
    }, { // ... and is then clicked again...
        func: "gpii.test.executeJavaScriptInWebContents",
        args: [
            "{that}.app.qssWrapper.qss.dialog",
            clickLanguageBtn
        ]
    }, { // ... the QSS widget menu will be hidden again.
        changeEvent: "{that}.app.qssWrapper.qssWidget.applier.modelChanged",
        path: "isShown",
        listener: "jqUnit.assertFalse",
        args: [
            "The QSS widget is hidden when its closed button is pressed",
            "{that}.app.qssWrapper.qssWidget.model.isShown"
        ]
    }, { // Attempts to activate a button which does not have keyboard highlight...
        funcName: "gpii.tests.qss.simulateShortcut",
        args: [
            "{that}.app.qssWrapper.qss.dialog",
            {
                key: "Enter"
            }
        ]
    }, { // ... will fail
        func: "jqUnit.assertFalse",
        args: [
            "QSS button cannot be activated using the keyboard if the button does not have focus",
            "{that}.app.qssWrapper.qssWidget.model.isShown"
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
