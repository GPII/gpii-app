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

var clickAppTextZoomBtn = "jQuery(\".fl-qss-btnId-text-zoom\").click()",
    clickIncreaseBtn = "jQuery(\".flc-qssStepperWidget-incBtn\").click()",
    clickDecreaseBtn = "jQuery(\".flc-qssStepperWidget-decBtn\").click()",
    clickCloseBtn     = "jQuery(\".fl-qss-btnId-service-close\").click()";

fluid.defaults("gpii.tests.qss.mockedAppZoom", {
    gradeNames: "fluid.component",

    events: {
        onAppZoomed: null
    },

    invokers: {
        sendZoom: {
            func: "{that}.events.onAppZoomed.fire",
            args: [
                "{arguments}.0" // direction
            ]
        }
    }
});

/**
 * No need to actually test if the "App/Text Zoom" functionality works. This
 * should be done in `gpii-windows` tests. Here we can simply check if the
 * corresponding function is called when the "App/Text Zoom" is pressed.
 */
fluid.defaults("gpii.tests.qss.mockedAppZoomWrapper", {
    gradeNames: "fluid.component",
    components: {
        appZoomHandler: {
            type: "gpii.tests.qss.mockedAppZoom"
        }
    }
});

fluid.registerNamespace("gpii.tests.qss.textZoomTests");

gpii.tests.qss.textZoomTests = [
    { // Open the QSS...
        func: "{that}.app.tray.events.onTrayIconClicked.fire"
    }, { // ... and click on the "App / Text Zoom" button.
        func: "gpii.test.executeJavaScriptInWebContents",
        args: [
            "{that}.app.qssWrapper.qss.dialog",
            clickAppTextZoomBtn
        ]
    }, {
        changeEvent: "{that}.app.qssWrapper.qssWidget.applier.modelChanged",
        path: "isShown",
        listener: "fluid.identity"
    }, { // Click on the increment button
        func: "gpii.test.executeJavaScriptInWebContents",
        args: [
            "{that}.app.qssWrapper.qssWidget.dialog",
            clickIncreaseBtn
        ]
    }, {
        event: "{that}.app.appZoomHandler.events.onAppZoomed",
        listener: "jqUnit.assertEquals",
        args: [
            "App Zoom zooms in when the + button in the QSS widget is pressed",
            "increase",
            "{arguments}.0"
        ]
    }, { // Click on the decrement button
        func: "gpii.test.executeJavaScriptInWebContents",
        args: [
            "{that}.app.qssWrapper.qssWidget.dialog",
            clickDecreaseBtn
        ]
    }, {
        event: "{that}.app.appZoomHandler.events.onAppZoomed",
        listener: "jqUnit.assertEquals",
        args: [
            "App Zoom zooms out when the - button in the QSS widget is pressed",
            "decrease",
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
