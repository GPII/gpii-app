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

var clickLanguageBtn = "jQuery(\".fl-qss-btnId-language\").click()",
    clickCloseBtn    = "jQuery(\".fl-qss-btnId-service-close\").click()";

fluid.registerNamespace("gpii.tests.qss.widgetClosingBehaviourTests");

gpii.tests.qss.widgetClosingBehaviourTests = [
    { // Open the QSS...
        func: "{that}.app.tray.events.onTrayIconClicked.fire"
    }, { // Click the language button again...
        func: "gpii.test.executeJavaScriptInWebContents",
        args: [
            "{that}.app.qssWrapper.qss.dialog",
            clickLanguageBtn
        ]
    }, { // ... and wait for the QSS widget to show up...
        changeEvent: "{that}.app.qssWrapper.qssWidget.applier.modelChanged",
        path: "isShown",
        listener: "fluid.identity"
    }, { // ... and then simulate an ArrowLeft key press.
        funcName: "gpii.tests.qss.simulateShortcut",
        args: [
            "{that}.app.qssWrapper.qssWidget.dialog",
            {
                key: "Left" // The key should be a value allowed to appear in an accelerator string.
            }
        ]
    }, { // This should close the QSS widget dialog.
        changeEvent: "{that}.app.qssWrapper.qssWidget.applier.modelChanged",
        path: "isShown",
        listener: "jqUnit.assertFalse",
        args: [
            "The QSS widget is hidden when the ArrowLeft key is pressed",
            "{that}.app.qssWrapper.qssWidget.model.isShown"
        ]
    }, { // Now the focus is on the "Close" button. Pressing Tab will move it back to the language button.
        funcName: "gpii.tests.qss.simulateShortcut",
        args: [
            "{that}.app.qssWrapper.qss.dialog",
            {
                key: "Tab"
            }
        ]
    }, { // Pressing the spacebar key...
        funcName: "gpii.tests.qss.simulateShortcut",
        args: [
            "{that}.app.qssWrapper.qss.dialog",
            {
                key: "Space" // The key should be a value allowed to appear in an accelerator string.
            }
        ]
    }, { // ... will make the language menu show up.
        changeEvent: "{that}.app.qssWrapper.qssWidget.applier.modelChanged",
        path: "isShown",
        listener: "jqUnit.assertTrue",
        args: [
            "The QSS widget is shown when the QSS button is activated using spacebar",
            "{that}.app.qssWrapper.qssWidget.model.isShown"
        ]
    }, { // Pressing the ESC key while the QSS widget is focused...
        funcName: "gpii.tests.qss.simulateShortcut",
        args: [
            "{that}.app.qssWrapper.qssWidget.dialog",
            {
                key: "Escape"
            }
        ]
    }, { // ... will close it.
        changeEvent: "{that}.app.qssWrapper.qssWidget.applier.modelChanged",
        path: "isShown",
        listener: "jqUnit.assertFalse",
        args: [
            "The QSS widget is closed when it has focus and the ESC key is pressed",
            "{that}.app.qssWrapper.qssWidget.model.isShown"
        ]
    }, { // Click the language button again...
        func: "gpii.test.executeJavaScriptInWebContents",
        args: [
            "{that}.app.qssWrapper.qss.dialog",
            clickLanguageBtn
        ]
    }, { // ... and wait for the QSS widget to show up.
        changeEvent: "{that}.app.qssWrapper.qssWidget.applier.modelChanged",
        path: "isShown",
        listener: "fluid.identity"
    }, { // Pressing the ArrowRight key while the QSS widget is focused...
        funcName: "gpii.tests.qss.simulateShortcut",
        args: [
            "{that}.app.qssWrapper.qssWidget.dialog",
            {
                key: "Right" // The key should be a value allowed to appear in an accelerator string.
            }
        ]
    }, { // ... will close it.
        changeEvent: "{that}.app.qssWrapper.qssWidget.applier.modelChanged",
        path: "isShown",
        listener: "jqUnit.assertFalse",
        args: [
            "The QSS widget is hidden when the ArrowRight key is pressed",
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
