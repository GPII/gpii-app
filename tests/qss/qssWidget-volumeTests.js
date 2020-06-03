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

var clickVolumeBtn           = "jQuery(\".fl-qss-btnId-volume\").click()",
    checkIfVolumeButtonImage = "jQuery('.fl-qss-btnId-volume > .flc-qss-btnImage').is(':visible')",
    checkIfVolumeButtonTitle = "jQuery('.fl-qss-btnId-volume > .flc-qss-btnLabel').is(':visible')",
    clickVolumeSwitchBtn     = "jQuery('.flc-volumeSwitch > .flc-switchUI-control').click()",
    clickVolumeStepperIncBtn = "jQuery('.flc-volumeStepper .flc-qssStepperWidget-incBtn').click()",
    clickCloseBtn            = "jQuery(\".fl-qss-btnId-service-close\").click()";

function getVolumeWidgetBtnText() {
    return jQuery(".fl-qss-btnId-volume > span").text();
}

function getVolumeWidgetBtnColor() {
    return jQuery(".fl-qss-btnId-volume").css("background-color");
}

fluid.registerNamespace("gpii.tests.qss.volumeTests");

gpii.tests.qss.volumeTests = [
    { // Open the QSS...
        func: "{that}.app.tray.events.onTrayIconClicked.fire"
    }, { // Text of the button should be
        task: "gpii.test.invokeFunctionInWebContents",
        args: [
            "{that}.app.qssWrapper.qss.dialog",
            getVolumeWidgetBtnText
        ],
        resolve: "jqUnit.assertEquals",
        resolveArgs: [
            "Text of the button should be",
            "Volume & Mute",
            "{arguments}.0"
        ]
    }, { // ... and click on the "Volume & Mute" button.
        func: "gpii.test.executeJavaScriptInWebContents",
        args: [
            "{that}.app.qssWrapper.qss.dialog",
            clickVolumeBtn
        ]
    }, {
        changeEvent: "{that}.app.qssWrapper.qssWidget.applier.modelChanged",
        path: "isShown",
        listener: "fluid.identity"
    }, {
        task: "gpii.test.linger",
        args: [1000],
        resolve: "fluid.identity"
    }, {
        task: "gpii.test.executeJavaScriptInWebContents",
        args: [
            "{that}.app.qssWrapper.qssWidget.dialog",
            clickVolumeSwitchBtn
        ],
        resolve: "fluid.identity"
    }, { // ... and the button image should be visible
        task: "gpii.test.executeJavaScriptInWebContents",
        args: [
            "{that}.app.qssWrapper.qss.dialog",
            checkIfVolumeButtonImage
        ],
        resolve: "jqUnit.assertTrue",
        resolveArgs: ["The Volume button image is displayed: ", "{arguments}.0"]
    }, { // ... title should be hidden
        task: "gpii.test.executeJavaScriptInWebContents",
        args: [
            "{that}.app.qssWrapper.qss.dialog",
            checkIfVolumeButtonTitle
        ],
        resolve: "jqUnit.assertFalse",
        resolveArgs: ["The Volume button title is hidden: ", "{arguments}.0"]
    }, { // Color of the button should be
        task: "gpii.test.invokeFunctionInWebContents",
        args: [
            "{that}.app.qssWrapper.qss.dialog",
            getVolumeWidgetBtnColor
        ],
        resolve: "jqUnit.assertEquals",
        resolveArgs: [
            "Color of the button should be",
            "rgb(128, 0, 0)",
            "{arguments}.0"
        ]
    }, {
        task: "gpii.test.executeJavaScriptInWebContents",
        args: [
            "{that}.app.qssWrapper.qssWidget.dialog",
            clickVolumeStepperIncBtn
        ],
        resolve: "fluid.identity"
    }, {
        task: "gpii.test.linger",
        args: [1000],
        resolve: "fluid.identity"
    }, { // ... and the button image should be visible
        task: "gpii.test.executeJavaScriptInWebContents",
        args: [
            "{that}.app.qssWrapper.qss.dialog",
            checkIfVolumeButtonImage
        ],
        resolve: "jqUnit.assertFalse",
        resolveArgs: ["The Volume button image is hidden: ", "{arguments}.0"]
    }, { // ... and the button image should be visible
        task: "gpii.test.executeJavaScriptInWebContents",
        args: [
            "{that}.app.qssWrapper.qss.dialog",
            checkIfVolumeButtonTitle
        ],
        resolve: "jqUnit.assertTrue",
        resolveArgs: ["The Volume button title is displayed: ", "{arguments}.0"]
    }, { // Color of the button should be
        task: "gpii.test.invokeFunctionInWebContents",
        args: [
            "{that}.app.qssWrapper.qss.dialog",
            getVolumeWidgetBtnColor
        ],
        resolve: "jqUnit.assertEquals",
        resolveArgs: [
            "Color of the button should be",
            "rgb(0, 129, 69)",
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
