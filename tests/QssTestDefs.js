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

/*
 * Scripts for interaction with the renderer
 */
// QSS related
var hoverCloseBtn = "jQuery(\".flc-quickSetStrip > div:last-child\").trigger(\"mouseenter\")",
    unhoverCloseBtn = "jQuery(\".flc-quickSetStrip > div:last-child\").trigger(\"mouseleave\")",
    focusCloseBtn = "var event = jQuery.Event(\"keyup\"); event.shiftKey = true; event.key = \"Tab\"; jQuery(\".flc-quickSetStrip > div:first-child\").trigger(event)",

    clickCloseBtn = "jQuery(\".flc-quickSetStrip > div:last-child\").click()",
    clickLanguageBtn = "jQuery(\".flc-quickSetStrip > div:first-child\").click()",
    clickFontSizeBtn = "jQuery(\".flc-quickSetStrip > div:nth-child(2)\").click()",
    clickCaptionsBtn = "jQuery(\".flc-quickSetStrip > div:nth-child(4)\").click()",
    clickReadAloudBtn = "jQuery(\".flc-quickSetStrip > div:nth-child(6)\").click()",
    clickSaveBtn = "jQuery(\".flc-quickSetStrip > div:nth-last-child(4)\").click()",
    clickUndoBtn = "jQuery(\".flc-quickSetStrip > div:nth-last-child(3)\").click()",
    clickPspBtn = "jQuery(\".flc-quickSetStrip > div:nth-last-child(2)\").click()";
// QSS Widgets related
var checkIfMenuWidget = "jQuery('.flc-qssMenuWidget').is(':visible');",
    checkIfStepperWidget = "jQuery('.flc-qssStepperWidget').is(':visible');",
    clickMenuWidgetItem = "jQuery('.flc-qssWidgetMenu-item:first-child').click()";
// Generic
var closeClosableDialog = "jQuery(\".flc-closeBtn\").click()";

require("../src/main/app.js");

fluid.registerNamespace("gpii.tests.qss.testDefs");

gpii.tests.qss.awaitQssInitialization = function (qss) {
    var promise = fluid.promise();

    qss.dialog.once("ready-to-show", function () {
        promise.resolve();
    });

    return promise;
};

gpii.tests.qss.executeCommand = function (dialog, command) {
    return dialog.webContents.executeJavaScript(command, true);
};

gpii.tests.qss.simulateShortcut = function (dialog, shortcut) {
    dialog.webContents.sendInputEvent({
        type: "keyDown",
        keyCode: shortcut.key,
        modifiers: shortcut.modifiers
    })
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

// XXX: For dev purposes.
gpii.tests.qss.linger = function () {
    var promise = fluid.promise();

    setTimeout(function () {
        promise.resolve();
    }, 2000);

    return promise;
};



var qssCrossTestSequence = [
    /*
     * CROSS
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
    }, { // Clicking on the close button in the QSS...
        func: "gpii.tests.qss.executeCommand",
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
    },
    /*
     * Tooltip & QSS integration
     */
    { // Open the QSS...
        func: "{that}.app.tray.events.onTrayIconClicked.fire"
    }, {
        func: "jqUnit.assertFalse",
        args: [
            "The QSS tooltip is not shown initially",
            "{that}.app.qssWrapper.qssTooltip.model.isShown"
        ]
    }, { // ... and hover on its close button.
        func: "gpii.tests.qss.executeCommand",
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
        func: "gpii.tests.qss.executeCommand",
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
    }, { // If the button is focused using keyboard interaction...
        func: "gpii.tests.qss.executeCommand",
        args: [
            "{that}.app.qssWrapper.qss.dialog",
            focusCloseBtn
        ]
    }, {
        changeEvent: "{that}.app.qssWrapper.qssTooltip.applier.modelChanged",
        path: "isShown",
        listener: "jqUnit.assertTrue",
        args: [
            "The QSS tooltip is shown when a button is focused using the keyboard",
            "{that}.app.qssWrapper.qssTooltip.model.isShown"
        ]
    },
    /*
     * Notification & QSS integration
     */
    { // When the "Save" button is clicked...
        func: "gpii.tests.qss.executeCommand",
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
        func: "gpii.tests.qss.executeCommand",
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
    },
    /*
     * Widget & QSS integration
     */
    // QSS widget visibility tests
    { // If the language button in the QSS is clicked...
        func: "gpii.tests.qss.executeCommand",
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
    }, { // If the button is focused using keyboard interaction...
        func: "gpii.tests.qss.executeCommand",
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
        func: "gpii.tests.qss.executeCommand",
        args: [
            "{that}.app.qssWrapper.qss.dialog",
            clickLanguageBtn
        ]
    }, {
        changeEvent: "{that}.app.qssWrapper.qssWidget.applier.modelChanged",
        path: "isShown",
        listener: "fluid.identity"
    }, { // ... and is then clicked again...
        func: "gpii.tests.qss.executeCommand",
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
    },
    //
    // CROSS tests
    //
    { // ... open the widget again
        func: "gpii.tests.qss.executeCommand",
        args: [
            "{that}.app.qssWrapper.qss.dialog",
            clickLanguageBtn
        ]
    }, { // ... and check whether it is the correct widget
        task: "gpii.tests.qss.executeCommand",
        args: [
            "{that}.app.qssWrapper.qssWidget.dialog",
            checkIfMenuWidget
        ],
        resolve: "jqUnit.assertTrue",
        resolveArgs: ["The QSS menu widget is displayed: ", "{arguments}.0"]
    }, { // Open the stepper widget
        task: "gpii.tests.qss.executeCommand",
        args: [
            "{that}.app.qssWrapper.qss.dialog",
            clickFontSizeBtn
        ],
        resolve: "fluid.identity"
    }, { // ... and the menu widget shouldn't be shown
        task: "gpii.tests.qss.executeCommand",
        args: [
            "{that}.app.qssWrapper.qssWidget.dialog",
            checkIfMenuWidget
        ],
        resolve: "jqUnit.assertFalse",
        resolveArgs: ["The QSS menu widget is displayed: ", "{arguments}.0"]
    }, { // ... and stepper widget should be
        task: "gpii.tests.qss.executeCommand",
        args: [
            "{that}.app.qssWrapper.qssWidget.dialog",
            checkIfStepperWidget
        ],
        resolve: "jqUnit.assertTrue",
        resolveArgs: ["The QSS stepper widget is displayed: ", "{arguments}.0"]
    },


    //
    // Setting changes tests
    //
    { // Open the menu Widget
        task: "gpii.tests.qss.executeCommand",
        args: [
            "{that}.app.qssWrapper.qss.dialog",
            clickLanguageBtn
        ],
        resolve: "fluid.identity"
    }, { // ... click on menu item (we know the order from the config we are using)
        func: "gpii.tests.qss.executeCommand",
        args: [
            "{that}.app.qssWrapper.qssWidget.dialog",
            clickMenuWidgetItem
        ]
    }, { // ... the setting should be applied
        event: "{that}.app.settingsBroker.events.onSettingApplied",
        listener: "jqUnit.assertLeftHand",
        args: [
            "Change event was fired from QSS widget interaction.",
            { path: "http://registry\\.gpii\\.net/common/language", value: "hy" },
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
    // Toggle
    { // Activation of toggle button should
        func: "gpii.tests.qss.executeCommand",
        args: [
            "{that}.app.qssWrapper.qss.dialog",
            clickCaptionsBtn
        ]
    }, { // ... notify the core
        event: "{that}.app.settingsBroker.events.onSettingApplied",
        listener: "jqUnit.assertLeftHand",
        args: [
            "Change event was fired from QSS widget interaction.",
            { path: "http://registry\\.gpii\\.net/common/captions/enabled", value: true },
            "{arguments}.0"
        ]
    },
    /*
     * QSS & PSP tests
     */
    { // Test menu after key in
        func: "{that}.app.keyIn",
        args: "snapset_2a" // Read To Me
    }, {
        event: "{that}.app.events.onKeyedIn",
        listener: "fluid.identity"
    }, { // If the Key in button in the QSS is clicked...
        func: "gpii.tests.qss.executeCommand",
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
    }, { // ... changing setting from QSS
        func: "gpii.tests.qss.executeCommand",
        args: [
            "{that}.app.qssWrapper.qss.dialog",
            clickReadAloudBtn
        ]
    }, { // ... should notify the PSP
        event: "{that}.app.psp.events.onSettingUpdated",
        listener: "jqUnit.assertLeftHand",
        args: [
            "QSS setting change should take place in PSP as well",
            { path: "http://registry\\.gpii\\.net/common/selfVoicing/enabled", value: true },
            "{arguments}.0"
        ]
    }, { // Test menu after key out
        func: "{that}.app.keyOut"
    }
];

var simpleSettingChangeSeqEl = { // Changeing single setting
    task: "gpii.tests.qss.executeCommand",
    args: [
        "{that}.app.qssWrapper.qss.dialog",
        clickCaptionsBtn
    ],
    resolve: "fluid.identity"
};
var clickUndoButtonSeqEl = { // ... and clicking undo button
    funcName: "gpii.tests.qss.executeCommand",
    args: [
        "{that}.app.qssWrapper.qss.dialog",
        clickUndoBtn
    ]
};

var undoCrossTestSequence = [
    { // When the tray icon is clicked...
        func: "{that}.app.tray.events.onTrayIconClicked.fire"
    }, 
    simpleSettingChangeSeqEl,
    clickUndoButtonSeqEl, // ... and clicking undo button
    { // ... should revert setting's value
        changeEvent: "{that}.app.qssWrapper.applier.modelChanged",
        path: "settings.*",
        listener: "jqUnit.assertLeftHand",
        args: [
            "QSS undo button should undo setting change",
            { path: "http://registry\\.gpii\\.net/common/captions/enabled", value: false },
            "{arguments}.0"
        ]
    },
    //
    // Shortcut test
    //
    simpleSettingChangeSeqEl, // Changing a setting
    simpleSettingChangeSeqEl, // Making second setting change
    { // ... and using undo shortcut in QSS
        funcName: "gpii.tests.qss.simulateShortcut",
        args: [
            "{that}.app.qssWrapper.qss.dialog",
            {
                key: "Z",
                modifiers: ["Ctrl"]
            }
        ] // simulate Ctrl+Z
    }, { // ... should restore last setting's state
        changeEvent: "{that}.app.qssWrapper.applier.modelChanged",
        path: "settings.*",
        listener: "jqUnit.assertLeftHand",
        args: [
            "QSS undo shortcut should undo setting change",
            { path: "http://registry\\.gpii\\.net/common/captions/enabled", value: true },
            "{arguments}.0"
        ]
    }, { // ... and using shortcut in the widget
        funcName: "gpii.tests.qss.simulateShortcut",
        args: [
            "{that}.app.qssWrapper.qssWidget.dialog",
            {
                key: "Z",
                modifiers: ["Ctrl"]
            }
        ] // simulate Ctrl+Z
    }, { // ... should trigger undo as well
        changeEvent: "{that}.app.qssWrapper.applier.modelChanged",
        path: "settings.*",
        listener: "jqUnit.assertLeftHand",
        args: [
            "QSS widget undo shortcut should undo setting change",
            { path: "http://registry\\.gpii\\.net/common/captions/enabled", value: false },
            "{arguments}.0"
        ]
    },
    ////
    //// Indicator test
    ////
    simpleSettingChangeSeqEl, // Changing a setting
    { // ... should enable undo indicator
        event: "{that}.app.qssWrapper.events.onUndoIndicatorChanged",
        listener: "jqUnit.assertTrue",
        args: [
            "QSS change should enable undo indicator",
            "{arguments}.0"
        ]
    },
    clickUndoButtonSeqEl, // ... and unding it
    { // ... should disable it
        event: "{that}.app.qssWrapper.events.onUndoIndicatorChanged",
        listener: "jqUnit.assertFalse",
        args: [
            "QSS undo should disable undo indicator",
            "{arguments}.0"
        ]
    }, { // close and ensure setting changes have been applied
        task: "gpii.tests.qss.executeCommand",
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
        args: ["settings.2", {value: 1.5}]
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
                value: 1.25
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
        args: ["settings.2", {value: 1.5}]
    }, { // make a change to a setting
        func: "{that}.app.qssWrapper.applier.change",
        args: ["settings.3", {value: true}]
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
                path: "http://registry\\.gpii\\.net/common/captions/enabled",
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
                value: 1.25
            },
            "{arguments}.0.oldValue"
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
        args: [{path: "http://registry\\.gpii\\.net/common/fontSize", value: 1.5}]
    }, { // ... and making a watched change
        func: "{that}.app.qssWrapper.applier.change",
        args: ["settings.2", {value: 1.5}]
    }, { // ... should change `hasChanges` flag state
        changeEvent: "{that}.app.qssWrapper.undoStack.applier.modelChanged",
        path: "hasChanges",
        listener: "jqUnit.assertTrue",
        args: [
            "QSS setting change indicator should restore state when stack is emptied",
            "{that}.app.qssWrapper.undoStack.model.hasChanges"
        ]
    }
];



gpii.tests.qss.testDefs = {
    name: "QSS Widget integration tests",
    expect: 36,
    config: {
        configName: "gpii.tests.dev.config",
        configPath: "tests/configs"
    },
    distributeOptions: {
        // Supply the list of QSS settings
        // For now we're using the same settings list
        record: "%gpii-app/tests/fixtures/qssSettings.json",
        target: "{that gpii.app.qssWrapper}.options.settingsPath"
    },

    gradeNames: ["gpii.test.common.testCaseHolder"],
    sequence: [].concat(
        [{ // Wait for the QSS to initialize.
            task: "gpii.tests.qss.awaitQssInitialization",
            args: ["{that}.app.qssWrapper.qss"],
            resolve: "jqUnit.assert",
            resolveArgs: ["QSS has initialized successfully"]
        }],
        undoCrossTestSequence,
        undoTestSequence,
        qssCrossTestSequence
    )
};
