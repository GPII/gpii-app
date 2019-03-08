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

var fluid = require("infusion"),
    jqUnit = fluid.require("node-jqunit", require, "jqUnit"),
    gpii = fluid.registerNamespace("gpii");

require("./testUtils.js");


/*
 * Scripts for interaction with the renderer
 */

function getStepperIndicatorsCount() {
    return jQuery(".fl-qssStepperWidget-indicator").length;
}

function clickStepperIndicator() {
    jQuery(".fl-qssStepperWidget-indicator:nth-of-type(3)").click();
}



// QSS related
var hoverCloseBtn = "jQuery(\".flc-quickSetStrip > div:last-of-type\").trigger(\"mouseenter\")",
    unhoverCloseBtn = "jQuery(\".flc-quickSetStrip > div:last-of-type\").trigger(\"mouseleave\")",
    focusCloseBtn = "var event = jQuery.Event(\"keyup\"); event.shiftKey = true; event.key = \"Tab\"; jQuery(\".flc-quickSetStrip > div:first-of-type\").trigger(event)",

    clickCloseBtn = "jQuery(\".flc-quickSetStrip > div:last-of-type\").click()",
    hoverLanguageBtn = "jQuery(\".flc-quickSetStrip > div:first-of-type\").trigger('mouseenter')",
    clickLanguageBtn = "jQuery(\".flc-quickSetStrip > div:first-of-type\").click()",
    clickScreenZoomBtn = "jQuery(\".flc-quickSetStrip > div:nth-of-type(2)\").click()",
    clickAppTextZoomBtn = "jQuery(\".flc-quickSetStrip > div:nth-of-type(3)\").click()",
    clickReadAloudBtn = "jQuery(\".flc-quickSetStrip > div:nth-of-type(5)\").click()",
    clickScreenCaptureBtn = "jQuery(\".flc-quickSetStrip > div:nth-of-type(6)\").click()",
    clickMoreBtn = "jQuery(\".flc-quickSetStrip > div:nth-last-of-type(6)\").click()",
    clickSaveBtn = "jQuery(\".flc-quickSetStrip > div:nth-last-of-type(5)\").click()",
    clickUndoBtn = "jQuery(\".flc-quickSetStrip > div:nth-last-of-type(4)\").click()",
    clickPspBtn = "jQuery(\".flc-quickSetStrip > div:nth-last-of-type(3)\").click()",
    clickResetAllBtn = "jQuery(\".flc-quickSetStrip > div:nth-last-of-type(2)\").click()",
    getQssSettingsList = "(function getItems() { var repeater = fluid.queryIoCSelector(fluid.rootComponent, 'gpii.psp.repeater')[0]; return repeater.model.items; }())";

// QSS Widgets related
var checkIfMenuWidget = "jQuery('.flc-qssMenuWidget').is(':visible');",
    checkIfStepperWidget = "jQuery('.flc-qssStepperWidget').is(':visible');",
    clickMenuWidgetItem = "jQuery('.flc-qssWidgetMenu-item:nth-of-type(2)').click()",
    clickIncreaseBtn = "jQuery('.flc-qssStepperWidget-incBtn').click()",
    clickDecreaseBtn = "jQuery('.flc-qssStepperWidget-decBtn').click()",
    clickToggleBtn = "jQuery('.flc-switchUI-control').click()";

// Generic
var closeClosableDialog = "jQuery(\".flc-closeBtn\").click()";

var openReadAloudMenuSeqEl = {
    task: "gpii.test.executeJavaScriptInWebContents",
    args: [
        "{that}.app.qssWrapper.qss.dialog",
        clickReadAloudBtn
    ],
    resolve: "fluid.identity"
};

var clickToggleButtonSeqEl = {
    task: "gpii.test.executeJavaScriptInWebContents",
    args: [
        "{that}.app.qssWrapper.qssWidget.dialog",
        clickToggleBtn
    ],
    resolve: "fluid.identity"
};


require("../src/main/app.js");

fluid.registerNamespace("gpii.tests.qss.testDefs");

gpii.tests.qss.simulateShortcut = function (dialog, shortcut) {
    dialog.webContents.sendInputEvent({
        type: shortcut.type || "keyUp",
        keyCode: shortcut.key,
        modifiers: shortcut.modifiers || []
    });
};

gpii.tests.qss.testPspAndQssVisibility = function (app, params) {
    jqUnit.assertEquals(
        "PSP has correct visibility state",
        params.psp,
        app.psp.model.isShown
    );

    jqUnit.assertEquals(
        "QSS has correct visibility state",
        params.qss,
        app.qssWrapper.qss.model.isShown
    );
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

var qssSettingsCount = 12;

var navigationSequence = [
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
    gpii.tests.qss.pressKey("Up"),
    gpii.tests.qss.assertFocusedElementIndex(qssSettingsCount - 3),
    gpii.tests.qss.pressKey("Down"),
    gpii.tests.qss.assertFocusedElementIndex(qssSettingsCount - 2),
    gpii.tests.qss.pressKey("Left"),
    gpii.tests.qss.assertFocusedElementIndex(qssSettingsCount - 4),
    gpii.tests.qss.pressKey("Up"),
    gpii.tests.qss.assertFocusedElementIndex(qssSettingsCount - 5),
    gpii.tests.qss.pressKey("Right"),
    gpii.tests.qss.assertFocusedElementIndex(qssSettingsCount - 3),
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
    },
    // When there is no focused element and the left arrow is pressed, the last button
    // in the QSS will be focused.
    gpii.tests.qss.pressKey("Left"),
    gpii.tests.qss.assertFocusedElementIndex(qssSettingsCount - 1),
    // Navigate to the "Sign in" button and open it using the Arrow up
    gpii.tests.qss.pressKey("Left"),
    gpii.tests.qss.pressKey("Up"),
    { // The PSP will be shown.
        changeEvent: "{that}.app.psp.applier.modelChanged",
        path: "isShown",
        listener: "jqUnit.assertTrue",
        args: [
            "When the sign in button is focused and the Arrow up key is pressed, the PSP will open",
            "{that}.app.psp.model.isShown"
        ]
    }, { // Close the QSS and the PSP
        func: "gpii.test.executeJavaScriptInWebContents",
        args: [
            "{that}.app.qssWrapper.qss.dialog",
            clickCloseBtn
        ]
    }
];


var restartWarningSequence = [
    { // Simulate language change
        func: "{that}.app.qssWrapper.alterSetting",
        args: [{
            path: "http://registry\\.gpii\\.net/common/language",
            value: "ko-KR"
        }]
    }, { // ... the restart warning notification should be shown
        event: "{that qssNotification}.events.onDialogShown",
        listener: "jqUnit.assert",
        args: ["The notification dialog is shown when restartWarning setting is changed."]
    }, {
        funcName: "{that}.app.qssWrapper.qssNotification.hide"
    }, { // Changing the user restartWarning preference
        event: "{that qssNotification}.events.onDialogHidden",
        listener: "{that}.app.applier.change",
        args: ["preferences.disableRestartWarning", true]
    }, { // and trying to show a restart warning notification
        changeEvent: "{that}.app.qssWrapper.applier.modelChanged",
        path: "disableRestartWarning",
        listener: "{that}.app.qssWrapper.showRestartWarningNotification",
        args: [{
            path: "http://registry\\.gpii\\.net/common/language",
            restartWarning: true,
            schema: {},
            value: "en-US"
        }]
    }, { // should have disabled it
        funcName: "jqUnit.assertFalse",
        args: [
            "Restart warning notification is not shown when disabled by user setting",
            "{that}.app.qssWrapper.qssNotification.model.isShown"
        ]
    },

    { // bring everything back to normal
        func: "{that}.app.resetAllToStandard"
    }
];


var tooltipSequence = [
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
    }
];

var morePanelSequence = [
    {  // When the "More" button is clicked...
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
    }
];

var menuInteractionsSequence = [
    { // If the language button in the QSS is clicked...
        func: "gpii.test.executeJavaScriptInWebContents",
        args: [
            "{that}.app.qssWrapper.qss.dialog",
            clickLanguageBtn
        ]
    }, { // ... the QSS widget menu will be shown.
        changeEvent: "{that}.app.qssWrapper.qssWidget.applier.modelChanged",
        path: "isShown",
        listener: "jqUnit.assertTrue",
        args: [
            "The QSS widget is shown when the language button is pressed",
            "{that}.app.qssWrapper.qssWidget.model.isShown"
        ]
    }, { // If the close button in the QSS is pressed...
        func: "gpii.test.executeJavaScriptInWebContents",
        args: [
            "{that}.app.qssWrapper.qssWidget.dialog",
            closeClosableDialog
        ]
    }, { // ... the QSS widget menu will be hidden.
        changeEvent: "{that}.app.qssWrapper.qssWidget.applier.modelChanged",
        path: "isShown",
        listener: "jqUnit.assertFalse",
        args: [
            "The QSS widget is hidden when its closed button is pressed",
            "{that}.app.qssWrapper.qssWidget.model.isShown"
        ]
    }, { // If the language button in the QSS is clicked once...
        func: "gpii.test.executeJavaScriptInWebContents",
        args: [
            "{that}.app.qssWrapper.qss.dialog",
            clickLanguageBtn
        ]
    }, {
        changeEvent: "{that}.app.qssWrapper.qssWidget.applier.modelChanged",
        path: "isShown",
        listener: "fluid.identity"
    }, { // ... and is then clicked again...
        func: "gpii.test.executeJavaScriptInWebContents",
        args: [
            "{that}.app.qssWrapper.qss.dialog",
            clickLanguageBtn
        ]
    }, { // ... the QSS widget menu will be hidden again.
        changeEvent: "{that}.app.qssWrapper.qssWidget.applier.modelChanged",
        path: "isShown",
        listener: "jqUnit.assertFalse",
        args: [
            "The QSS widget is hidden when its closed button is pressed",
            "{that}.app.qssWrapper.qssWidget.model.isShown"
        ]
    }, { // Attempts to activate a button which does not have keyboard highlight...
        funcName: "gpii.tests.qss.simulateShortcut",
        args: [
            "{that}.app.qssWrapper.qss.dialog",
            {
                key: "Enter"
            }
        ]
    }, { // ... will fail
        func: "jqUnit.assertFalse",
        args: [
            "QSS button cannot be activated using the keyboard if the button does not have focus",
            "{that}.app.qssWrapper.qssWidget.model.isShown"
        ]
    }
];

var widgetClosingBehaviourSequence = [
    { // Click the language button again...
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
    }
];

var stepperindicatorsSequence = [
    { // Click on the "Screen Zoom" button...
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
            -1,
            "{arguments}.0.value"
        ]
    },

    { // restore everything
        func: "{that}.app.resetAllToStandard"
    }
];

var stepperInteractionsSequence = [
    { // Click on the "Screen Zoom" button...
        func: "gpii.test.executeJavaScriptInWebContents",
        args: [
            "{that}.app.qssWrapper.qss.dialog",
            clickScreenZoomBtn
        ]
    }, { // ... and wait for the QSS widget menu to be shown.
        changeEvent: "{that}.app.qssWrapper.qssWidget.applier.modelChanged",
        path: "isShown",
        listener: "fluid.identity"
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
    }
];

var saveButtonSequence = [
    /*
     * Notification & QSS integration
     */
    { // When the "Save" button is clicked...
        func: "gpii.test.executeJavaScriptInWebContents",
        args: [
            "{that}.app.qssWrapper.qss.dialog",
            clickSaveBtn
        ]
    }, { // ... the QSS notification dialog will show up.
        changeEvent: "{that}.app.qssWrapper.qssNotification.applier.modelChanged",
        path: "isShown",
        listener: "jqUnit.assertTrue",
        args: [
            "The QSS notification is shown when the Save button is clicked",
            "{that}.app.qssWrapper.qssNotification.model.isShown"
        ]
    }, { // When the "Close" button in the QSS notification is clicked...
        func: "gpii.test.executeJavaScriptInWebContents",
        args: [
            "{that}.app.qssWrapper.qssNotification.dialog",
            closeClosableDialog
        ]
    }, { // ... the QSS notification dialog will be hidden.
        changeEvent: "{that}.app.qssWrapper.qssNotification.applier.modelChanged",
        path: "isShown",
        listener: "jqUnit.assertFalse",
        args: [
            "The QSS notification is hidden when its closed button is pressed",
            "{that}.app.qssWrapper.qssNotification.model.isShown"
        ]
    }
];



var qssCrossTestSequence = [
    /*
     * Tests QSS and PSP visibility
     * Test QSS button interactions
     */
    { // At first, neither the PSP, nor the QSS is shown.
        func: "gpii.tests.qss.testPspAndQssVisibility",
        args: [
            "{that}.app",
            {psp: false, qss: false}
        ]
    }, { // When the tray icon is clicked...
        func: "{that}.app.tray.events.onTrayIconClicked.fire"
    }, { // ... only the QSS will be shown.
        func: "gpii.tests.qss.testPspAndQssVisibility",
        args: [
            "{that}.app",
            {psp: false, qss: true}
        ]
    }, { // When the tray icon is again...
        func: "{that}.app.tray.events.onTrayIconClicked.fire"
    }, { // ... the QSS will no longer be visible (the tray icon toggles the QSS)
        func: "gpii.tests.qss.testPspAndQssVisibility",
        args: [
            "{that}.app",
            {psp: false, qss: false}
        ]
    }, { // Open the QSS again.
        func: "{that}.app.tray.events.onTrayIconClicked.fire"
    }, { // Open the PSP via the QSS.
        task: "gpii.test.executeJavaScriptInWebContents",
        args: [
            "{that}.app.qssWrapper.qss.dialog",
            clickPspBtn
        ],
        resolve: "fluid.identity"
    }, {
        func: "gpii.tests.qss.testPspAndQssVisibility",
        args: [
            "{that}.app",
            {psp: true, qss: true}
        ]
    }, { // Clicking on the close button in the QSS...
        func: "gpii.test.executeJavaScriptInWebContents",
        args: [
            "{that}.app.qssWrapper.qss.dialog",
            clickCloseBtn
        ]
    }, { // ... results in both the PSP and the QSS being hidden.
        event: "{that}.app.qssWrapper.qss.channelListener.events.onQssClosed",
        listener: "gpii.tests.qss.testPspAndQssVisibility",
        args: [
            "{that}.app",
            {psp: false, qss: false}
        ]
    }, { // Simulate opening of the QSS using the global shortcut
        func: "{that}.app.qssWrapper.qss.show",
        args: [
            {shortcut: true}
        ]
    }, { // The QSS will be shown but the PSP won't be.
        func: "gpii.tests.qss.testPspAndQssVisibility",
        args: [
            "{that}.app",
            {psp: false, qss: true}
        ]
    }, { // Clicking on the "Sign in" button in the QSS...
        task: "gpii.test.executeJavaScriptInWebContents",
        args: [
            "{that}.app.qssWrapper.qss.dialog",
            clickPspBtn
        ],
        resolve: "fluid.identity"
    }, { // ... will also bring up the PSP.
        func: "gpii.tests.qss.testPspAndQssVisibility",
        args: [
            "{that}.app",
            {psp: true, qss: true}
        ]
    }, {
        task: "gpii.test.executeJavaScriptInWebContents",
        args: [
            "{that}.app.qssWrapper.qss.dialog",
            clickCloseBtn
        ],
        resolve: "fluid.identity"
    },
    /*
     * Tooltip & QSS integration
     */
    tooltipSequence,
    //
    // Save button
    //
    saveButtonSequence,
    //
    // "More" panel
    //
    morePanelSequence,
    /*
     * Widget & QSS integration
     */
    //
    // Menu widget interactions
    //
    menuInteractionsSequence,
    //
    // Widget closing behaviour
    //
    widgetClosingBehaviourSequence,
    //
    // Stepper widget interactions
    //
    stepperInteractionsSequence,
    //
    // Combined tests
    //
    { // ... open the widget again
        task: "gpii.test.executeJavaScriptInWebContents",
        args: [
            "{that}.app.qssWrapper.qss.dialog",
            clickLanguageBtn
        ],
        resolve: "fluid.identity"
    }, { // ... and check whether it is the correct widget
        task: "gpii.test.executeJavaScriptInWebContents",
        args: [
            "{that}.app.qssWrapper.qssWidget.dialog",
            checkIfMenuWidget
        ],
        resolve: "jqUnit.assertTrue",
        resolveArgs: ["The QSS menu widget is displayed: ", "{arguments}.0"]
    }, { // Open the stepper widget
        task: "gpii.test.executeJavaScriptInWebContents",
        args: [
            "{that}.app.qssWrapper.qss.dialog",
            clickAppTextZoomBtn
        ],
        resolve: "fluid.identity"
    }, { // ... and the menu widget shouldn't be shown
        task: "gpii.test.executeJavaScriptInWebContents",
        args: [
            "{that}.app.qssWrapper.qssWidget.dialog",
            checkIfMenuWidget
        ],
        resolve: "jqUnit.assertFalse",
        resolveArgs: ["The QSS menu widget is displayed: ", "{arguments}.0"]
    }, { // ... and stepper widget should be
        task: "gpii.test.executeJavaScriptInWebContents",
        args: [
            "{that}.app.qssWrapper.qssWidget.dialog",
            checkIfStepperWidget
        ],
        resolve: "jqUnit.assertTrue",
        resolveArgs: ["The QSS stepper widget is displayed: ", "{arguments}.0"]
    }, { // Open the Screen Capture widget
        task: "gpii.test.executeJavaScriptInWebContents",
        args: [
            "{that}.app.qssWrapper.qss.dialog",
            clickScreenCaptureBtn
        ],
        resolve: "fluid.identity"
    }, { // ... and the menu widget shouldn't be shown
        task: "gpii.test.executeJavaScriptInWebContents",
        args: [
            "{that}.app.qssWrapper.qssWidget.dialog",
            checkIfMenuWidget
        ],
        resolve: "jqUnit.assertFalse",
        resolveArgs: ["The QSS menu widget is displayed: ", "{arguments}.0"]
    },
    //
    // Setting changes tests
    //
    { // Open the menu Widget
        task: "gpii.test.executeJavaScriptInWebContents",
        args: [
            "{that}.app.qssWrapper.qss.dialog",
            clickLanguageBtn
        ],
        resolve: "fluid.identity"
    }, { // ... click on menu item (we know the order from the config we are using)
        func: "gpii.test.executeJavaScriptInWebContents",
        args: [
            "{that}.app.qssWrapper.qssWidget.dialog",
            clickMenuWidgetItem
        ]
    }, { // ... the setting should be applied
        event: "{that}.app.settingsBroker.events.onSettingApplied",
        listener: "jqUnit.assertLeftHand",
        args: [
            "Change event was fired from QSS widget interaction.",
            { path: "http://registry\\.gpii\\.net/common/language", value: "es-ES" },
            "{arguments}.0"
        ]
    },
    // TODO this could be used instead (of the previous)
    //{ // ! should send info to broker
    //     changeEvent: "{that}.app.qssWrapper.applier.modelChanged",
    //     path: "settings.*",
    //     listener: "jqUnit.assertEquals",
    //     args: [
    //         "Change event was fired from QSS widget interaction.",
    //         "hy",
    //         "{that}.app.qssWrapper.model.settings.0.value"
    //     ]
    // }
    {
        changeEvent: "{that}.app.qssWrapper.qssWidget.applier.modelChanged",
        path: "isShown",
        listener: "fluid.identity"
    },
    // Toggle button / menu
    // Opening the toggle menu and clicking the toggle button...
    openReadAloudMenuSeqEl,
    clickToggleButtonSeqEl,
    { // ... should notify the core
        event: "{that}.app.settingsBroker.events.onSettingApplied",
        listener: "jqUnit.assertLeftHand",
        args: [
            "Change event was fired from QSS widget interaction.",
            { path: "http://registry\\.gpii\\.net/common/selfVoicing/enabled", value: true },
            "{arguments}.0"
        ]
    },
    // Turn off the read aloud
    clickToggleButtonSeqEl,
    { // And close the QSS widget menu
        task: "gpii.test.executeJavaScriptInWebContents",
        args: [
            "{that}.app.qssWrapper.qss.dialog",
            clickCloseBtn
        ],
        resolve: "fluid.identity"
    },

    /*
     * QSS & PSP tests
     */
    { // Test menu after key in
        func: "{that}.app.keyIn",
        args: "snapset_2a"
    }, {
        event: "{that}.app.events.onKeyedIn",
        listener: "fluid.identity"
    }, { // If the Key in button in the QSS is clicked...
        func: "gpii.test.executeJavaScriptInWebContents",
        args: [
            "{that}.app.qssWrapper.qss.dialog",
            clickPspBtn
        ]
    }, { // ... the PSP will be shown.
        changeEvent: "{that}.app.psp.applier.modelChanged",
        path: "isShown",
        listener: "jqUnit.assertTrue",
        args: [
            "The PSP is shown when the Key in button is pressed",
            "{that}.app.psp.model.isShown"
        ]
    },
    // Changing a setting from QSS
    openReadAloudMenuSeqEl,
    clickToggleButtonSeqEl,
    { // ... should notify the PSP
        event: "{that}.app.psp.events.onSettingUpdated",
        listener: "jqUnit.assertLeftHand",
        args: [
            "QSS setting change should take place in PSP as well",
            { path: "http://registry\\.gpii\\.net/common/selfVoicing/enabled", value: true },
            "{arguments}.0"
        ]
    }, {
        func: "{that}.app.keyOut"
    }, {
        event: "{that}.app.events.onKeyedOut",
        listener: "fluid.identity"
    }
];

var clickUndoButtonSeqEl = {
    func: "gpii.test.executeJavaScriptInWebContentsDelayed",
    args: [
        "{that}.app.qssWrapper.qss.dialog",
        clickUndoBtn
    ]
};

var undoCrossTestSequence = [
    { // When the tray icon is clicked...
        func: "{that}.app.tray.events.onTrayIconClicked.fire"
    },
    // Change the value of the "Read Aloud" setting ...
    openReadAloudMenuSeqEl,
    clickToggleButtonSeqEl,
    {
        changeEvent: "{that}.app.qssWrapper.applier.modelChanged",
        path: "settings.*",
        listener: "fluid.identity"
    },
    clickUndoButtonSeqEl, // ... and clicking undo button
    { // ... should revert setting's value
        changeEvent: "{that}.app.qssWrapper.applier.modelChanged",
        path: "settings.*",
        listener: "jqUnit.assertLeftHand",
        args: [
            "QSS undo button should undo setting change",
            { path: "http://registry\\.gpii\\.net/common/selfVoicing/enabled", value: false },
            "{arguments}.0"
        ]
    },
    //
    // Multiple setting changes
    openReadAloudMenuSeqEl,
    clickToggleButtonSeqEl, // Changing a setting
    {
        changeEvent: "{that}.app.qssWrapper.applier.modelChanged",
        path: "settings.*",
        listener: "fluid.identity"
    },
    clickToggleButtonSeqEl, // Making second setting change
    {
        changeEvent: "{that}.app.qssWrapper.applier.modelChanged",
        path: "settings.*",
        listener: "fluid.identity"
    },
    clickUndoButtonSeqEl,
    { // ... should restore last setting's state
        changeEvent: "{that}.app.qssWrapper.applier.modelChanged",
        path: "settings.*",
        listener: "jqUnit.assertLeftHand",
        args: [
            "QSS undo shortcut should undo setting change",
            { path: "http://registry\\.gpii\\.net/common/selfVoicing/enabled", value: true },
            "{arguments}.0"
        ]
    },
    clickUndoButtonSeqEl,
    { // ... should trigger undo as well
        changeEvent: "{that}.app.qssWrapper.applier.modelChanged",
        path: "settings.*",
        listener: "jqUnit.assertLeftHand",
        args: [
            "QSS widget undo shortcut should undo setting change",
            { path: "http://registry\\.gpii\\.net/common/selfVoicing/enabled", value: false },
            "{arguments}.0"
        ]
    },
    ////
    //// Indicator test
    ////
    openReadAloudMenuSeqEl,
    clickToggleButtonSeqEl, // Changing a setting
    { // ... should enable undo indicator
        event: "{that}.app.qssWrapper.qss.events.onUndoIndicatorChanged",
        listener: "jqUnit.assertTrue",
        args: [
            "QSS change should enable undo indicator",
            "{arguments}.0"
        ]
    },
    clickUndoButtonSeqEl, // ... and unding it
    { // ... should disable it
        event: "{that}.app.qssWrapper.qss.events.onUndoIndicatorChanged",
        listener: "jqUnit.assertFalse",
        args: [
            "QSS undo should disable undo indicator",
            "{arguments}.0"
        ]
    }, { // close and ensure setting changes have been applied
        task: "gpii.test.executeJavaScriptInWebContents",
        args: [
            "{that}.app.qssWrapper.qss.dialog",
            clickCloseBtn
        ],
        resolve: "fluid.identity"
    }
];

// More isolated tests for the undo functionality
var undoTestSequence = [
    { // make a change to a setting
        func: "{that}.app.qssWrapper.applier.change",
        args: ["settings.1", {value: 1}]
    }, { // ... there should be a setting registered
        changeEvent: "{that}.app.qssWrapper.undoStack.applier.modelChanged",
        path: "hasChanges",
        listener: "jqUnit.assertTrue",
        args: [
            "QSS setting change should indicate available change",
            "{that}.app.qssWrapper.undoStack.model.hasChanges"
        ]
    }, { // Undoing the change
        func: "{that}.app.qssWrapper.undoStack.undo"
    }, { // ... should restore setting's state
        changeEvent: "{that}.app.qssWrapper.applier.modelChanged",
        path: "settings.*",
        listener: "jqUnit.assertLeftHand",
        args: [
            "QSS single setting change should be undone properly",
            {
                path: "http://registry\\.gpii\\.net/common/DPIScale",
                value: 0 // this is the default value of the DPI Scale setting
            },
            "{arguments}.0"
        ]
    }, { // ... should restore `hasChanges` flag state
        funcName: "jqUnit.assertFalse",
        args: [
            "QSS setting change indicator should restore state when stack is emptied",
            "{that}.app.qssWrapper.undoStack.model.hasChanges"
        ]
    },
    //
    // Multiple setting changes
    //
    { // make a change to a setting
        func: "{that}.app.qssWrapper.applier.change",
        args: ["settings.1", {value: 1}]
    }, { // make a change to a setting
        func: "{that}.app.qssWrapper.applier.change",
        args: ["settings.4", {value: true}]
    }, { // ... `hasChanges` should have its state kept
        funcName: "jqUnit.assertTrue",
        args: [
            "QSS setting change indicator should restore state when stack is emptied",
            "{that}.app.qssWrapper.undoStack.model.hasChanges"
        ]
    }, { // ... reverting last change
        func: "{that}.app.qssWrapper.undoStack.undo"
    }, { // ... should restore second setting's state
        changeEvent: "{that}.app.qssWrapper.applier.modelChanged",
        path: "settings.*",
        listener: "jqUnit.assertLeftHand",
        args: [
            "QSS last setting change should be undone",
            {
                path: "http://registry\\.gpii\\.net/common/selfVoicing/enabled",
                value: false
            },
            "{arguments}.0"
        ]
    }, { // ... reverting all of the changes
        func: "{that}.app.qssWrapper.undoStack.undo"
    }, { // ... should restore first setting's state
        event: "{that}.app.qssWrapper.undoStack.events.onChangeUndone", // use whole path for the event attachment
        listener: "jqUnit.assertLeftHand",
        args: [
            "QSS last setting change should be undone",
            {
                path: "http://registry\\.gpii\\.net/common/DPIScale",
                value: 0
            },
            "{arguments}.0"
        ]
    }, { // ... and `hasChanges` should have its state restored
        funcName: "jqUnit.assertFalse",
        args: [
            "QSS setting change indicator should restore state when stack is emptied",
            "{that}.app.qssWrapper.undoStack.model.hasChanges"
        ]
    },
    //
    // Empty stack
    //
    { // Undoing empty stack should not cause an error
        func: "{that}.app.qssWrapper.undoStack.undo"
    },
    //
    // Unwatched setting changes
    //
    { // make a change to an undoable setting shouldn't have effect
        func: "{that}.app.qssWrapper.alterSetting",
        args: ["settings.2", {value: 2}]
    }, { // ... and making a watched change
        func: "{that}.app.qssWrapper.applier.change",
        args: ["settings.1", {value: 1}]
    }, { // ... should change `hasChanges` flag state
        changeEvent: "{that}.app.qssWrapper.undoStack.applier.modelChanged",
        path: "hasChanges",
        listener: "jqUnit.assertTrue",
        args: [
            "QSS setting change indicator should restore state when stack is emptied",
            "{that}.app.qssWrapper.undoStack.model.hasChanges"
        ]
    }, { // Click the "Reset All to Standard" button
        func: "gpii.test.executeJavaScriptInWebContents",
        args: [
            "{that}.app.qssWrapper.qss.dialog",
            clickResetAllBtn
        ]
    }, {
        changeEvent: "{that}.app.qssWrapper.applier.modelChanged",
        path: "settings.1.value",
        listener: "jqUnit.assertEquals",
        args: [
            "Reset All to Standard will revert the DPI setting to its original value",
            0,
            "{that}.app.qssWrapper.model.settings.1.value"
        ]
    }
];

var appZoomTestSequence = [
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

/**
 * Needed in order not to send setting updates to the Core. The testing of
 * the QSS functionalities does not require that the setting updates are
 * actually applied.
 */
fluid.defaults("gpii.tests.qss.mockedGpiiConnector", {
    gradeNames: "fluid.component",
    invokers: {
        updateSetting: {
            funcName: "fluid.identity"
        }
    }
});

/**
 * Also, in order to test the QSS functionalities, there is no need to apply
 * settings when a user keys in.
 */
fluid.defaults("gpii.tests.qss.mockedLifecycleManager", {
    gradeNames: "fluid.component",
    invokers: {
        applySolution: {
            funcName: "gpii.tests.qss.mockedLifecycleManager.applySolution"
        }
    }
});

gpii.tests.qss.mockedLifecycleManager.applySolution = function () {
    var promise = fluid.promise();
    promise.resolve();
    return promise;
};

/*
 * A subset of the QSS setting messages.
 */
var qssSettingMessagesFixture = {
    bg: {
        "gpii_app_qss_settings_common-language": {
            "title": "Избери Език",
            tooltip: "Some different tooltip",
            "enum": [
                "Анг",
                "Арм",
                "Кит",
                "Китс",
                "Кор",
                "Рус",
                "Исп"
            ]
        },
        "gpii_app_qss_settings_save": {
            "title": "Запиши ме"
        },
        "gpii_app_qss_settings_close": {
            "title": "Затвори ме"
        },
        "gpii_app_qss_settings_appTextZoom": {
            title: "Приближи този текст",
            tooltip: "Some tooltip",
            tip: "Some helpful tip",
            footerTip: "Hopefully something helpful as the tip"
        }
    }
};

/*
 * A mock of the settings message
 */
var expectedTranslatedSettings = {
    "http://registry\\.gpii\\.net/common/language": {
        schema: {
            "title": "Избери Език",
            "enum": [
                "Анг",
                "Арм",
                "Кит",
                "Китс",
                "Кор",
                "Рус",
                "Исп"
            ]
        },
        tooltip: "Some different tooltip"
    },
    "save": {
        schema: {
            "title": "Запиши ме"
        }
    },
    "close": {
        schema: {
            "title": "Затвори ме"
        }
    },
    "appTextZoom": {
        schema: {
            title: "Приближи този текст"
        },
        tooltip: "Some tooltip",
        tip: "Some helpful tip",
        widget: {
            footerTip: "Hopefully something helpful as the tip"
        }
    }
};


var crossQssTranslations = [
    /*
     * Tests for the QSS i18n behaviour
     */
    { // trigger locale change
        funcName: "{that}.app.applier.change",
        args: ["locale", "bg"]
    },
    { // ... and check whether the settings' text has been updated in the main
        funcName: "gpii.test.assertLeftHandDeep",
        args: [
            "QSS should have its settings translated with locale change",
            expectedTranslatedSettings,
            "@expand:gpii.test.objectArrayToHash({that}.app.qssWrapper.model.settings, path)"
        ]
    }, { // ... and in the renderer as well
        task: "gpii.test.executeJavaScriptInWebContents",
        args: [
            "{that}.app.qssWrapper.qss.dialog",
            getQssSettingsList
        ],
        resolve: "gpii.test.assertLeftHandDeep",
        resolveArgs: [
            "QSS dialog should have its settings translated with locale change",
            expectedTranslatedSettings,
            "@expand:gpii.test.objectArrayToHash({arguments}.0, path)"
        ]
    }
];


var unorderedInstalledLangsFixture = {
    raw: {
        "es-MX": {
            "english": "Spanish",
            "local": "Spanish (Mexico)",
            "native": "español (México)",
            "code": "es-MX"
        },
        "fr": {
            "english": "French",
            "local": "French",
            "native": "français",
            "code": "fr"
        },
        "en-US": {
            "english": "English",
            "local": "English (United States)",
            "native": "english (United States)",
            "code": "en-US"
        }
    },
    lists: {
        keys: [ "en-US", "fr", "es-MX"],
        enum: [ "English (United States)", "Français · French", "Español (México) · Spanish (Mexico)"]
    }
};

var installedLangsShrunkFixture = {
    raw: {
        "en-US": {
            "english": "English",
            "local": "English (United States)",
            "native": "english (United States)",
            "code": "en-US"
        },
        "es-ES": {
            "english": "Spanish",
            "local": "Spanish (Spain)",
            "native": "Español (España)",
            "code": "es-ES"
        }
    },
    lists: {
        keys: ["en-US", "es-ES"],
        enum: ["English (United States)", "Español (España) · Spanish (Spain)"]
    }
};



fluid.defaults("gpii.tests.qss.systemLanguageListener", {
    gradeNames: ["fluid.modelComponent"],

    model: {
        installedLanguages: unorderedInstalledLangsFixture.raw,
        configuredLanguage: null
    },

    listeners: {
        // use a listener to avoid overriding the
        // model binding in the `gpii.app`.
        // There should be a better way
        "onCreate.setDefaultValue": {
            changePath: "configuredLanguage",
            value: "en-US"
        }
    },

    invokers: {
        updateLanguages: {
            funcName: "gpii.app.applier.replace",
            args: [
                "{that}.applier",
                "installedLanguages",
                "{arguments}.0" // new languages
            ]
        }
    }
});

gpii.tests.qss.languageSettingValuesMatches = function (qssWrapper, expectedInstalledLanguages) {
    var languageSetting = qssWrapper.getSetting(qssWrapper.options.settingOptions.settingPaths.language);

    jqUnit.assertDeepEq(
        "QSS should list correctly installed languages",
        [
            expectedInstalledLanguages["enum"],
            expectedInstalledLanguages.keys
        ],
        [
            languageSetting.schema["enum"],
            languageSetting.schema.keys
        ]
    );
};


var qssInstalledLanguages = [
    { // once qssWrapper is firstly created it should have proper languages list
        func: "gpii.tests.qss.languageSettingValuesMatches",
        args: ["{that}.app.qssWrapper", unorderedInstalledLangsFixture.lists]
    },

    { // changing the installed languages
        func: "{that}.app.systemLanguageListener.updateLanguages",
        args: [installedLangsShrunkFixture.raw]
    },
    { // should result in language setting update
        changeEvent: "{that}.app.qssWrapper.applier.modelChanged",
        path: "settings.0.schema.enum", // we want changes only for the language setting
        listener: "gpii.tests.qss.languageSettingValuesMatches",
        args: ["{that}.app.qssWrapper", installedLangsShrunkFixture.lists]
    }
];




gpii.tests.qss.testDefs = {
    name: "QSS Widget integration tests",
    expect: 85,
    config: {
        configName: "gpii.tests.dev.config",
        configPath: "tests/configs"
    },
    distributeOptions: {
        mockedSettings: {
            record: "%gpii-app/tests/fixtures/qssSettings.json",
            target: "{that gpii.app.qssWrapper}.options.settingsFixturePath"
        },
        mockedMessages: {
            record: qssSettingMessagesFixture,
            target: "{that gpii.app}.options.messageBundles"
        },
        mockedAppZoomWrapper: {
            record: "gpii.tests.qss.mockedAppZoomWrapper",
            target: "{that gpii.app}.options.gradeNames"
        },
        mockedGpiiConnector: {
            record: "gpii.tests.qss.mockedGpiiConnector",
            target: "{that gpiiConnector}.options.gradeNames"
        },
        mockedLifecycleManager: {
            record: "gpii.tests.qss.mockedLifecycleManager",
            target: "{that lifecycleManager}.options.gradeNames"
        },
        mockedLanguagesListener: {
            record: "gpii.tests.qss.systemLanguageListener",
            target: "{that gpii.app}.options.components.systemLanguageListener.type",
            priority: "last"
        }
    },

    gradeNames: ["gpii.test.common.testCaseHolder"],
    sequence: [].concat(
        [{ // Wait for the QSS to initialize.
            event: "{that gpii.app.qss}.events.onDialogReady",
            listener: "jqUnit.assert",
            args: ["QSS has initialized successfully"]
        }],
        navigationSequence,
        qssInstalledLanguages,
        undoCrossTestSequence,
        undoTestSequence,
        qssCrossTestSequence,
        stepperindicatorsSequence,
        crossQssTranslations,
        appZoomTestSequence,
        restartWarningSequence
    )
};
