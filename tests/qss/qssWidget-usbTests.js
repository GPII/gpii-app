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

var clickOpenUsbBtn  = "jQuery(\".fl-qss-btnId-usb-open\").click()",
    checkIfUSBWidget = "jQuery(\".fl-qss-btnId-usb-open\").is(':visible')",
	clickCloseBtn    = "jQuery(\".fl-qss-btnId-service-close\").click()";

function getUsbWidgetBtnText() {
    return jQuery(".fl-qss-btnId-usb-open > span").text();
}

fluid.registerNamespace("gpii.tests.qss.usbTests");

gpii.tests.qss.usbTests = [
    { // Open the QSS...
        func: "{that}.app.tray.events.onTrayIconClicked.fire"
    }, { // ... and open USB button should be visible
        task: "gpii.test.executeJavaScriptInWebContents",
        args: [
            "{that}.app.qssWrapper.qss.dialog",
            checkIfUSBWidget
        ],
        resolve: "jqUnit.assertTrue",
        resolveArgs: ["The Open USB button is displayed: ", "{arguments}.0"]
    }, { // Text of button should be
        task: "gpii.test.invokeFunctionInWebContents",
        args: [
            "{that}.app.qssWrapper.qss.dialog",
            getUsbWidgetBtnText
        ],
        resolve: "jqUnit.assertEquals",
        resolveArgs: [
            "Text of button should be",
            "Open & Eject USB",
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
