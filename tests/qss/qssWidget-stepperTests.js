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

var clickScreenZoomBtn  = "jQuery(\".fl-qss-btnId-screen-zoom\").click()",
    clickIncreaseBtn    = "jQuery(\".flc-qssStepperWidget-incBtn\").click()",
    clickDecreaseBtn    = "jQuery(\".flc-qssStepperWidget-decBtn\").click()",
    closeClosableDialog = "jQuery(\".flc-closeBtn\").click()",
    clickCloseBtn       = "jQuery(\".fl-qss-btnId-service-close\").click()";

function getStepperIndicatorsCount() {
    return jQuery(".fl-qssStepperWidget-indicator").length;
}

function clickStepperIndicator() {
    jQuery(".fl-qssStepperWidget-indicator:nth-of-type(1)").click();
}

fluid.registerNamespace("gpii.tests.qss.stepperTests");

gpii.tests.qss.stepperTests = [
    { // Open the QSS...
        func: "{that}.app.tray.events.onTrayIconClicked.fire"
    }, { // Click on the "Screen Zoom" button...
        func: "gpii.test.executeJavaScriptInWebContents",
        args: [
            "{that}.app.qssWrapper.qss.dialog",
            clickScreenZoomBtn
        ]
    }, {
        event: "{that}.app.qssWrapper.qssWidget.events.onQssWidgetCreated",
        listener: "fluid.identity"
    }, { // ... should display the value indicators
        task: "gpii.test.invokeFunctionInWebContents",
        args: [
            "{that}.app.qssWrapper.qssWidget.dialog",
            getStepperIndicatorsCount
        ],
        resolve: "jqUnit.assertEquals",
        resolveArgs: [
            "Stepper widget should have proper amount of indicators",
            3, // dependent on the min/max value
            "{arguments}.0"
        ]
    }, { // And clicking one of them
        task: "gpii.test.invokeFunctionInWebContents",
        args: [
            "{that}.app.qssWrapper.qssWidget.dialog",
            clickStepperIndicator
        ],
        resolve: "fluid.identity"
    }, { // ... should apply its value
        changeEvent: "{that}.app.qssWrapper.applier.modelChanged",
        path: "settings.*",
        listener: "jqUnit.assertEquals",
        args: [
            "Clicking a Stepper widget indicator should apply its value",
            1,
            "{arguments}.0.value"
        ]
    }, { // restore everything
        func: "{that}.app.resetAllToStandard"
    }, { // Click on the "Screen Zoom" button...
        func: "gpii.test.executeJavaScriptInWebContents",
        args: [
            "{that}.app.qssWrapper.qss.dialog",
            clickScreenZoomBtn
        ]
    }, { // ... and wait for the QSS widget menu to be shown.
        changeEvent: "{that}.app.qssWrapper.qssWidget.applier.modelChanged",
        path: "isShown",
        listener: "fluid.identity"
    }, {
        task: "gpii.test.linger",
        args: [7000], // temporary fix related to GPII-4478
        resolve: "fluid.identity"
    }, { // Clicking on the increment button...
        func: "gpii.test.executeJavaScriptInWebContents",
        args: [
            "{that}.app.qssWrapper.qssWidget.dialog",
            clickIncreaseBtn
        ]
    }, { // ... will change the value of the DPI setting
        changeEvent: "{that}.app.qssWrapper.applier.modelChanged",
        path: "settings.*",
        listener: "jqUnit.assertLeftHand",
        args: [
            "DPI setting change is correctly registered",
            {
                path: "http://registry\\.gpii\\.net/common/DPIScale",
                value: 1
            },
            "{arguments}.0"
        ]
    }, { // Click on the increment button again...
        task: "gpii.test.executeJavaScriptInWebContents",
        args: [
            "{that}.app.qssWrapper.qssWidget.dialog",
            clickIncreaseBtn
        ],
        resolve: "fluid.identity"
    }, { // ... will not change the DPI setting's value because it is already reached at its highest value
        func: "jqUnit.assertEquals",
        args: [
            "The DPI setting value is not changed once its highest value has been reached",
            1,
            "{that}.app.qssWrapper.model.settings.1.value"
        ]
    }, { // Clicking on the increment button once again...
        func: "gpii.test.executeJavaScriptInWebContents",
        args: [
            "{that}.app.qssWrapper.qssWidget.dialog",
            clickIncreaseBtn
        ]
    }, { // ... will make the QSS warning notification show up.
        changeEvent: "{that}.app.qssWrapper.qssNotification.applier.modelChanged",
        path: "isShown",
        listener: "jqUnit.assertTrue",
        args: [
            "The QSS notification is shown when the DPI setting has reached its highest value",
            "{that}.app.qssWrapper.qssNotification.model.isShown"
        ]
    }, { // Close the QSS notification
        func: "gpii.test.executeJavaScriptInWebContents",
        args: [
            "{that}.app.qssWrapper.qssNotification.dialog",
            closeClosableDialog
        ]
    }, {
        changeEvent: "{that}.app.qssWrapper.qssNotification.applier.modelChanged",
        path: "isShown",
        listener: "fluid.identity"
    }, { // Clicking on the decrement button...
        func: "gpii.test.executeJavaScriptInWebContents",
        args: [
            "{that}.app.qssWrapper.qssWidget.dialog",
            clickDecreaseBtn
        ]
    }, { // ... will change the value of the DPI setting
        changeEvent: "{that}.app.qssWrapper.applier.modelChanged",
        path: "settings.*",
        listener: "jqUnit.assertLeftHand",
        args: [
            "First decrease in DPI setting change is correctly registered",
            {
                path: "http://registry\\.gpii\\.net/common/DPIScale",
                value: 0
            },
            "{arguments}.0"
        ]
    }, { // Click on the decrement button again...
        func: "gpii.test.executeJavaScriptInWebContents",
        args: [
            "{that}.app.qssWrapper.qssWidget.dialog",
            clickDecreaseBtn
        ]
    }, { // ... will change the value of the DPI setting to its lowest possible value
        changeEvent: "{that}.app.qssWrapper.applier.modelChanged",
        path: "settings.*",
        listener: "jqUnit.assertLeftHand",
        args: [
            "Second decrease in DPI setting change is correctly registered",
            {
                path: "http://registry\\.gpii\\.net/common/DPIScale",
                value: -1
            },
            "{arguments}.0"
        ]
    }, { // Clicking on the decrement button once again...
        task: "gpii.test.executeJavaScriptInWebContents",
        args: [
            "{that}.app.qssWrapper.qssWidget.dialog",
            clickDecreaseBtn
        ],
        resolve: "fluid.identity"
    }, { // ... will not change the DPI setting's value because it is already reached its lowest value
        func: "jqUnit.assertEquals",
        args: [
            "The DPI setting value is not changed once its lowest value has been reached",
            -1,
            "{that}.app.qssWrapper.model.settings.1.value"
        ]
    }, { // Clicking on the decrement button once again...
        func: "gpii.test.executeJavaScriptInWebContents",
        args: [
            "{that}.app.qssWrapper.qssWidget.dialog",
            clickDecreaseBtn
        ]
    }, { // ... will make the QSS warning notification show up.
        changeEvent: "{that}.app.qssWrapper.qssNotification.applier.modelChanged",
        path: "isShown",
        listener: "jqUnit.assertTrue",
        args: [
            "The QSS notification is shown when the DPI setting has reached its lowest value",
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
