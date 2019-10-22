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
var qssSettingsCount = 19;

var clickCloseBtn = "jQuery(\".fl-qss-btnId-service-close\").click()";

gpii.tests.qss.simulateShortcut = function (dialog, shortcut) {
    dialog.webContents.sendInputEvent({
        type: shortcut.type || "keyUp",
        keyCode: shortcut.key,
        modifiers: shortcut.modifiers || []
    });
};

gpii.tests.qss.getFocusedElementIndex = function () {
    // Note that the elements will be returned in the order in which they appear in the DOM.
    var qssButtons = jQuery(".fl-qss-button"),
        focusedElement = jQuery(".fl-focused")[0];
    return jQuery.inArray(focusedElement, qssButtons);
};

gpii.tests.qss.pressKey = function (key, modifiers) {
    return {
        funcName: "gpii.tests.qss.simulateShortcut",
        args: [
            "{that}.app.qssWrapper.qss.dialog",
            {
                key: key,
                modifiers: modifiers
            }
        ]
    };
};

gpii.tests.qss.assertFocusedElementIndex = function (expectedIndex) {
    return {
        task: "gpii.test.invokeFunctionInWebContentsDelayed",
        args: [
            "{that}.app.qssWrapper.qss.dialog",
            gpii.tests.qss.getFocusedElementIndex,
            100
        ],
        resolve: "jqUnit.assertEquals",
        resolveArgs: [
            "The correct button in the QSS is focused",
            expectedIndex,
            "{arguments}.0"
        ]
    };
};

gpii.tests.qss.clearFocusedElement = function () {
    jQuery(".fl-qss-button").removeClass("fl-focused fl-highlighted");
};


fluid.registerNamespace("gpii.tests.qss.navigationTests");

gpii.tests.qss.navigationTests = [
    {
        func: "{that}.app.tray.events.onTrayIconClicked.fire"
    },
    // No focused element at first
    gpii.tests.qss.assertFocusedElementIndex(-1),
    // When the right arrow is pressed, the first button in the QSS will be focused.
    gpii.tests.qss.pressKey("Right"),
    gpii.tests.qss.assertFocusedElementIndex(0),
    gpii.tests.qss.pressKey("Tab"),
    gpii.tests.qss.assertFocusedElementIndex(1),
    gpii.tests.qss.pressKey("Left"),
    gpii.tests.qss.assertFocusedElementIndex(0),
    gpii.tests.qss.pressKey("Tab", ["Shift"]),
    gpii.tests.qss.assertFocusedElementIndex(qssSettingsCount - 1),
    gpii.tests.qss.pressKey("Tab", ["Shift"]),
    gpii.tests.qss.assertFocusedElementIndex(qssSettingsCount - 2),
    // This part of the test is commented because the button is disabled temporary (GPII-3773) and cannot be focused.
    // Some tests may be removed or parts of them re-used in the future.
    // gpii.tests.qss.pressKey("Up"),
    // gpii.tests.qss.assertFocusedElementIndex(qssSettingsCount - 3),
    // gpii.tests.qss.pressKey("Down"),
    // gpii.tests.qss.assertFocusedElementIndex(qssSettingsCount - 2),
    // gpii.tests.qss.pressKey("Left"),
    // gpii.tests.qss.assertFocusedElementIndex(qssSettingsCount - 4),
    // gpii.tests.qss.pressKey("Up"),
    // gpii.tests.qss.assertFocusedElementIndex(qssSettingsCount - 4),
    // This part of the test is commented because the button is disabled temporary (GPII-3773) and cannot be focused.
    // Some tests may be removed or parts of them re-used in the future.
    // gpii.tests.qss.pressKey("Right"),
    // gpii.tests.qss.assertFocusedElementIndex(qssSettingsCount - 3),
    // Manually clear the focused state in order to test the Arrow Left behavior when
    // there is no focused element.
    {
        task: "gpii.test.invokeFunctionInWebContentsDelayed",
        args: [
            "{that}.app.qssWrapper.qss.dialog",
            gpii.tests.qss.clearFocusedElement,
            100
        ],
        resolve: "fluid.identity"
    }, { // Close the QSS
        func: "gpii.test.executeJavaScriptInWebContents",
        args: [
            "{that}.app.qssWrapper.qss.dialog",
            clickCloseBtn
        ]
    }
];
