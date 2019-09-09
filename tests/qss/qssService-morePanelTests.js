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

var clickMoreBtn  = "jQuery(\".fl-qss-btnId-service-more\").click()",
    clickCloseBtn = "jQuery(\".fl-qss-btnId-service-close\").click()";


fluid.registerNamespace("gpii.tests.qss.morePanelTests");

gpii.tests.qss.morePanelTests = [
    { // Open the QSS...
        func: "{that}.app.tray.events.onTrayIconClicked.fire"
    }, {  // When the "More" button is clicked...
        func: "gpii.test.executeJavaScriptInWebContents",
        args: [
            "{that}.app.qssWrapper.qss.dialog",
            clickMoreBtn
        ]
    }, { // ... the QSS More panel will show up.
        changeEvent: "{that}.app.qssWrapper.qssMorePanel.applier.modelChanged",
        path: "isShown",
        listener: "jqUnit.assertTrue",
        args: [
            "The QSS More panel is shown when the More button in the QSS is clicked",
            "{that}.app.qssWrapper.qssMorePanel.model.isShown"
        ]
    }, { // If the "More" button is clicked once again...
        func: "gpii.test.executeJavaScriptInWebContents",
        args: [
            "{that}.app.qssWrapper.qss.dialog",
            clickMoreBtn
        ]
    }, { // ... the QSS More panel will be hidden.
        changeEvent: "{that}.app.qssWrapper.qssMorePanel.applier.modelChanged",
        path: "isShown",
        listener: "jqUnit.assertFalse",
        args: [
            "The QSS More panel is hidden if the More button in the QSS is clicked while the More panel is open",
            "{that}.app.qssWrapper.qssMorePanel.model.isShown"
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
