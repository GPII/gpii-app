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

var clickUndoBtn      = "jQuery(\".fl-qss-btnId-service-undo\").click()",
    clickReadAloudBtn = "jQuery(\".fl-qss-btnId-read-aloud\").click()",
    clickToggleBtn    = "jQuery(\".flc-switchUI-control\").click()",
    clickResetAllBtn  = "jQuery(\".fl-qss-btnId-service-reset-all\").click()",
    clickCloseBtn     = "jQuery(\".fl-qss-btnId-service-close\").click()";

var clickUndoButtonSeqEl = {
    func: "gpii.test.executeJavaScriptInWebContentsDelayed",
    args: [
        "{that}.app.qssWrapper.qss.dialog",
        clickUndoBtn
    ]
};

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

fluid.registerNamespace("gpii.tests.qss.undoTests");

gpii.tests.qss.undoTests = [
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
    },
    // More isolated tests for the undo functionality
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
