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

var clickMouseBtn = "jQuery('.fl-qss-btnId-mouse').click()",
    clickDecreaseBtn = "jQuery('.fl-qssStepper-incBtn').click()",
    clickIncreaseBtn = "jQuery('.fl-qssStepper-decBtn').click()",
    swapMouseToggleBtn = "jQuery('.flc-qssMouseWidget-swapMouseButtons .flc-switchUI-control').click()",
    easierDoubleClickToggleBtn = "jQuery('.flc-qssMouseWidget-easierDoubleClick .flc-switchUI-control').click()",
    largeMouseToggleBtn = "jQuery('.flc-qssMouseWidget-largerMousePointer .flc-switchUI-control').click()",
    closeClosableDialog = "jQuery(\".flc-closeBtn\").click()",
    clickCloseBtn = "jQuery('.fl-qss-btnId-service-close').click()";

function getMouseWidgetBtnText() {
    return jQuery(".fl-qss-btnId-mouse > span").text();
}

function getStepperIndicatorsCount() {
    return jQuery(".fl-qssStepperWidget-indicator").length;
}

function clickStepperIndicator() {
    jQuery(".fl-qssStepperWidget-indicator:nth-of-type(2)").click();
}

var clickSwapMouseToggleButtonSeqEl = {
    task: "gpii.test.executeJavaScriptInWebContents",
    args: [
        "{that}.app.qssWrapper.qssWidget.dialog",
        swapMouseToggleBtn
    ],
    resolve: "fluid.identity"
};

var clickEasierDoubleClickToggleButtonSeqEl = {
    task: "gpii.test.executeJavaScriptInWebContents",
    args: [
        "{that}.app.qssWrapper.qssWidget.dialog",
        easierDoubleClickToggleBtn
    ],
    resolve: "fluid.identity"
};

var clickLargeMouseToggleButtonSeqEl = {
    task: "gpii.test.executeJavaScriptInWebContents",
    args: [
        "{that}.app.qssWrapper.qssWidget.dialog",
        largeMouseToggleBtn
    ],
    resolve: "fluid.identity"
};

fluid.registerNamespace("gpii.tests.qss.mouseTests");

gpii.tests.qss.mouseTests = [
    { // Open the QSS...
        func: "{that}.app.tray.events.onTrayIconClicked.fire"
    }, { // Text of the button should be
        task: "gpii.test.invokeFunctionInWebContents",
        args: [
            "{that}.app.qssWrapper.qss.dialog",
            getMouseWidgetBtnText
        ],
        resolve: "jqUnit.assertEquals",
        resolveArgs: [
            "Text of the button should be",
            "Adjust Mouse",
            "{arguments}.0"
        ]
    }, { // Click on the "Adjust Mouse" button...
        func: "gpii.test.executeJavaScriptInWebContents",
        args: [
            "{that}.app.qssWrapper.qss.dialog",
            clickMouseBtn
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
            11, // dependent on the min/max value
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
            2,
            "{arguments}.0.settings.mouseSpeed.value"
        ]
    }, { // Clicking on the decrement button...
        func: "gpii.test.executeJavaScriptInWebContents",
        args: [
            "{that}.app.qssWrapper.qssWidget.dialog",
            clickDecreaseBtn
        ]
    }, { // ... will change the value of the mouse speed setting
        changeEvent: "{that}.app.qssWrapper.applier.modelChanged",
        path: "settings.*",
        listener: "jqUnit.assertLeftHand",
        args: [
            "Mouse speed change is correctly registered",
            {
                path: "http://registry\\.gpii\\.net/applications/com\\.microsoft\\.windows\\.mouseSettings.PointerSpeed",
                value: 1
            },
            "{arguments}.0.settings.mouseSpeed"
        ]
    }, { // Click on the decrement button again...
        task: "gpii.test.executeJavaScriptInWebContents",
        args: [
            "{that}.app.qssWrapper.qssWidget.dialog",
            clickDecreaseBtn
        ],
        resolve: "fluid.identity"
    }, { // ... will not change the mouse speed value because it is already reached at its lowest value
        func: "jqUnit.assertEquals",
        args: [
            "The mouse speed value is not changed once its lowest value has been reached",
            1,
            "{that}.app.qssWrapper.model.settings.5.settings.mouseSpeed.value"
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
            "The QSS notification is shown when the mouse speed setting has reached its lowest value",
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
    }, { // Clicking on the increment button...
        func: "gpii.test.executeJavaScriptInWebContents",
        args: [
            "{that}.app.qssWrapper.qssWidget.dialog",
            clickIncreaseBtn
        ]
    }, { // ... will change the value of the mouse speed setting
        changeEvent: "{that}.app.qssWrapper.applier.modelChanged",
        path: "settings.*",
        listener: "jqUnit.assertLeftHand",
        args: [
            "First increase in mouse speed setting change is correctly registered",
            {
                path: "http://registry\\.gpii\\.net/applications/com\\.microsoft\\.windows\\.mouseSettings.PointerSpeed",
                value: 2
            },
            "{arguments}.0.settings.mouseSpeed"
        ]
    },
    clickSwapMouseToggleButtonSeqEl,
    { // ... should notify the core
        event: "{that}.app.settingsBroker.events.onSettingApplied",
        listener: "jqUnit.assertLeftHand",
        args: [
            "Change event was fired from QSS widget interaction.",
            { path: "http://registry\\.gpii\\.net/applications/com\\.microsoft\\.windows\\.mouseSettings.SwapMouseButtons", value: 1 },
            "{arguments}.0"
        ]
    },
    // Turn off the Swap Mouse
    clickSwapMouseToggleButtonSeqEl,
    {
        event: "{that}.app.settingsBroker.events.onSettingApplied",
        listener: "jqUnit.assertLeftHand",
        args: [
            "Change event was fired from QSS widget interaction.",
            { path: "http://registry\\.gpii\\.net/applications/com\\.microsoft\\.windows\\.mouseSettings.SwapMouseButtons", value: 0 },
            "{arguments}.0"
        ]
    },
    // clicking the Easier Double Click toggle button...
    clickEasierDoubleClickToggleButtonSeqEl,
    { // ... should notify the core
        event: "{that}.app.settingsBroker.events.onSettingApplied",
        listener: "jqUnit.assertLeftHand",
        args: [
            "Change event was fired from QSS widget interaction.",
            { path: "http://registry\\.gpii\\.net/applications/com\\.microsoft\\.windows\\.mouseSettings.DoubleClickTime", value: 5000 },
            "{arguments}.0"
        ]
    },
    // Turn off the Easier Double Click
    clickEasierDoubleClickToggleButtonSeqEl,
    {
        event: "{that}.app.settingsBroker.events.onSettingApplied",
        listener: "jqUnit.assertLeftHand",
        args: [
            "Change event was fired from QSS widget interaction.",
            { path: "http://registry\\.gpii\\.net/applications/com\\.microsoft\\.windows\\.mouseSettings.DoubleClickTime", value: 500 },
            "{arguments}.0"
        ]
    },
    // clicking the Large Mouse Pointer toggle button...
    clickLargeMouseToggleButtonSeqEl,
    { // ... should notify the core
        event: "{that}.app.settingsBroker.events.onSettingApplied",
        listener: "jqUnit.assertLeftHand",
        args: [
            "Change event was fired from QSS widget interaction.",
            { path: "http://registry\\.gpii\\.net/common/cursorSize", value: true },
            "{arguments}.0"
        ]
    },
    // Turn off the Large Mouse Pointer
    clickLargeMouseToggleButtonSeqEl,
    {
        event: "{that}.app.settingsBroker.events.onSettingApplied",
        listener: "jqUnit.assertLeftHand",
        args: [
            "Change event was fired from QSS widget interaction.",
            { path: "http://registry\\.gpii\\.net/common/cursorSize", value: false },
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
