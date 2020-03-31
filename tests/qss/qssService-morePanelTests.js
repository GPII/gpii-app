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

var clickMoreBtn        = "jQuery(\".fl-qss-btnId-service-more\").click()",
    ifMorePanelVisible 	= "jQuery(\".fl-quickSetStrip-more\").is(\":visible\")",
    ifMorePanelActive 	= "jQuery(\".fl-qss-btnId-service-more\").hasClass(\"fl-activated\")",
    closeMoreDialog 	= "jQuery(\".fl-more-closeButton\").click()",
    clickCloseBtn       = "jQuery(\".fl-qss-btnId-service-close\").click()";


fluid.registerNamespace("gpii.tests.qss.morePanelTests");

gpii.tests.qss.morePanelTests = [
    { // Open the QSS...
        func: "{that}.app.tray.events.onTrayIconClicked.fire"
    }, { // open the `More Panel`
        func: "gpii.test.executeJavaScriptInWebContents",
        args: [
            "{that}.app.qssWrapper.qss.dialog",
            clickMoreBtn
        ]
    }, {
        event: "{that}.app.qssWrapper.qss.channelListener.events.onQssMorePanelRequired",
        listener: "jqUnit.assert",
        args: ["`onQssMorePanelRequired` event is fired"]
    }, {
        task: "gpii.test.executeJavaScriptInWebContents",
        args: [
            "{that}.app.qssWrapper.qss.dialog",
            ifMorePanelActive
        ],
        resolve: "jqUnit.assertTrue",
        resolveArgs: ["The `More Panel` button is active: ", "{arguments}.0"]
    },  {
        task: "gpii.test.executeJavaScriptInWebContents",
        args: [
            "{that}.app.qssWrapper.qss.dialog",
            ifMorePanelVisible
        ],
        resolve: "jqUnit.assertTrue",
        resolveArgs: ["The `More Panel` is displayed: ", "{arguments}.0"]
    }, {
        func: "gpii.test.executeJavaScriptInWebContents",
        args: [
            "{that}.app.qssWrapper.qss.dialog",
            closeMoreDialog
        ]
    }, {
        event: "{that}.app.qssWrapper.qss.channelListener.events.onMorePanelClosed",
        listener: "jqUnit.assert",
        args: ["`onMorePanelClosed` event is fired"]
    }, {
        task: "gpii.test.executeJavaScriptInWebContents",
        args: [
            "{that}.app.qssWrapper.qss.dialog",
            ifMorePanelVisible
        ],
        resolve: "jqUnit.assertFalse",
        resolveArgs: ["The `More Panel` is not displayed: ", "{arguments}.0"]
    }, {
        task: "gpii.test.executeJavaScriptInWebContents",
        args: [
            "{that}.app.qssWrapper.qss.dialog",
            ifMorePanelActive
        ],
        resolve: "jqUnit.assertFalse",
        resolveArgs: ["The `More Panel` button is not active: ", "{arguments}.0"]
    }, { // open the `More Panel`
        func: "gpii.test.executeJavaScriptInWebContents",
        args: [
            "{that}.app.qssWrapper.qss.dialog",
            clickMoreBtn
        ]
    }, { // second click closes the `More Panel`
        func: "gpii.test.executeJavaScriptInWebContents",
        args: [
            "{that}.app.qssWrapper.qss.dialog",
            clickMoreBtn
        ]
    }, {
        event: "{that}.app.qssWrapper.qss.channelListener.events.onMorePanelClosed",
        listener: "jqUnit.assert",
        args: ["`onMorePanelClosed` event is fired"]
    }, {
        task: "gpii.test.executeJavaScriptInWebContents",
        args: [
            "{that}.app.qssWrapper.qss.dialog",
            ifMorePanelVisible
        ],
        resolve: "jqUnit.assertFalse",
        resolveArgs: ["The `More Panel` is not displayed: ", "{arguments}.0"]
    }, { // Close the QSS
        task: "gpii.test.executeJavaScriptInWebContents",
        args: [
            "{that}.app.qssWrapper.qss.dialog",
            clickCloseBtn
        ],
        resolve: "fluid.identity"
    }
];
