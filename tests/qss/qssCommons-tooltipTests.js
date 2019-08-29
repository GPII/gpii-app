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

var hoverCloseBtn = "jQuery(\".flc-quickSetStrip > div:last-of-type\").trigger(\"mouseenter\")",
	unhoverCloseBtn = "jQuery(\".flc-quickSetStrip > div:last-of-type\").trigger(\"mouseleave\")",
	hoverLanguageBtn = "jQuery(\".flc-quickSetStrip > div:first-of-type\").trigger('mouseenter')",
	focusCloseBtn = "var event = jQuery.Event(\"keyup\"); event.shiftKey = true; event.key = \"Tab\"; jQuery(\".flc-quickSetStrip > div:first-of-type\").trigger(event)",
	clickLanguageBtn = "jQuery(\".fl-qss-btnId-language\").click()",
    clickCloseBtn       = "jQuery(\".fl-qss-btnId-service-close\").click()";

fluid.registerNamespace("gpii.tests.qss.tooltipTests");

gpii.tests.qss.tooltipTests = [
    { // Open the QSS...
        func: "{that}.app.tray.events.onTrayIconClicked.fire"
    }, {
        func: "jqUnit.assertFalse",
        args: [
            "The QSS tooltip is not shown initially",
            "{that}.app.qssWrapper.qssTooltip.model.isShown"
        ]
    }, { // ... and hover on its close button.
        func: "gpii.test.executeJavaScriptInWebContents",
        args: [
            "{that}.app.qssWrapper.qss.dialog",
            hoverCloseBtn
        ]
    }, { // This will bring up the tooltip for that button.
        changeEvent: "{that}.app.qssWrapper.qssTooltip.applier.modelChanged",
        path: "isShown",
        listener: "jqUnit.assertTrue",
        args: [
            "The QSS tooltip is shown when a button is hovered",
            "{that}.app.qssWrapper.qssTooltip.model.isShown"
        ]
    }, { // When the button is no longer hovered...
        func: "gpii.test.executeJavaScriptInWebContents",
        args: [
            "{that}.app.qssWrapper.qss.dialog",
            unhoverCloseBtn
        ]
    }, { // ... the tooltip is gone.
        changeEvent: "{that}.app.qssWrapper.qssTooltip.applier.modelChanged",
        path: "isShown",
        listener: "jqUnit.assertFalse",
        args: [
            "The QSS tooltip is hidden when the button is no longer hovered",
            "{that}.app.qssWrapper.qssTooltip.model.isShown"
        ]
    },
    // hover & click === close
    { // Hovering the language button
        func: "gpii.test.executeJavaScriptInWebContents",
        args: [
            "{that}.app.qssWrapper.qss.dialog",
            hoverLanguageBtn
        ]
    }, { // ... should show the tooltip
        changeEvent: "{that}.app.qssWrapper.qssTooltip.applier.modelChanged",
        path: "isShown",
        listener: "jqUnit.assertTrue",
        args: [
            "The QSS tooltip is shown when a button is focused using the keyboard",
            "{that}.app.qssWrapper.qssTooltip.model.isShown"
        ]
    }, { // ... and clicking (activating) the button
        funcName: "gpii.test.executeJavaScriptInWebContents",
        args: [
            "{that}.app.qssWrapper.qss.dialog",
            clickLanguageBtn
        ]
    }, { // ... should close the tooltip
        changeEvent: "{that}.app.qssWrapper.qssTooltip.applier.modelChanged",
        path: "isShown",
        listener: "jqUnit.assertFalse",
        args: [
            "The QSS tooltip is closed when a button is activated",
            "{that}.app.qssWrapper.qssTooltip.model.isShown"
        ]
    },
    // menu close === no tooltip
    {   // XXX we need some minor timeout for the QSS to get
        // in normal state. In case this is not present,
        // the next item doesn't take effect
        task: "gpii.test.linger",
        args: [1000],
        resolve: "fluid.identity"
    },
    // hover & esc === close
    { // Focusing the close button
        func: "gpii.test.executeJavaScriptInWebContents",
        args: [
            "{that}.app.qssWrapper.qss.dialog",
            focusCloseBtn
        ]
    }, { // ... will show the tooltip
        event: "{that}.app.qssWrapper.qssTooltip.events.onDialogShown",
        listener: "fluid.identity" // already tested
    }, { // ... and then, when Esc is used
        funcName: "gpii.tests.qss.simulateShortcut",
        args: [
            "{that}.app.qssWrapper.qss.dialog",
            {
                key: "Escape",
                type: "keyDown"
            }
        ]
    }, { // ... should close the tooltip
        changeEvent: "{that}.app.qssWrapper.qssTooltip.applier.modelChanged",
        path: "isShown",
        listener: "jqUnit.assertFalse",
        args: [
            "The QSS tooltip is closed when Esc is used",
            "{that}.app.qssWrapper.qssTooltip.model.isShown"
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