/**
 * PSP Restart Dialog Integration Test Definitions
 *
 * Integration tests for the restart dialog of the PSP. Test whether the restart dialog
 * is correctly shown/hidden based on whether there are any pending changes, as well as
 * if the buttons within the dialog function as expected.
 * Copyright 2017 Raising the Floor - International
 *
 * Licensed under the New BSD license. You may not use this file except in
 * compliance with this License.
 * The research leading to these results has received funding from the European Union's
 * Seventh Framework Programme (FP7/2007-2013) under grant agreement no. 289016.
 * You may obtain a copy of the License at
 * https://github.com/GPII/universal/blob/master/LICENSE.txt
 */
"use strict";

var fluid  = require("infusion"),
    gpii   = fluid.registerNamespace("gpii");


require("node-jqunit", require, "jqUnit");
fluid.require("%kettle/lib/test/KettleTestUtils.http.js");
require("../src/main/app.js");

fluid.registerNamespace("gpii.tests.settingsBroker.testDefs");

var settingChangeFixture = {
    liveness: "manualRestart",
    value: 1,
    oldValue: 2,
    path: "change/setting"
};

var manualRestartSettingFixture = {
    liveness: "manualRestart",
    memory: true,
    path: "http://registry\\.gpii\\.net/common/magnification",
    schema: {
        description: "Level of magnification",
        divisibleBy: 0.1,
        min: 1,
        title: "Magnification",
        type: "number"
    },
    value: 2
};

fluid.registerNamespace("gpii.tests.restartDialog");

gpii.tests.restartDialog.simulateSettingAlter = function (psp, setting, newValue) {
    setting.oldValue = setting.value;
    setting.value = newValue;

    psp.events.onSettingAltered.fire(setting);
};

gpii.tests.restartDialog.testDefs = {
    name: "Restart dialog integration tests",
    expect: 16,
    config: {
        configName: "gpii.tests.dev.config",
        configPath: "tests/configs"
    },
    gradeNames: ["gpii.test.common.testCaseHolder"],
    sequence: [{ // just bring the app in working state
        func: "{that}.app.keyIn",
        args: ["snapset_4a"]
    }, {
        changeEvent: "{that}.app.applier.modelChanged",
        path: "keyedInUserToken",
        listener: "fluid.identity"
    },

    [
        /*
         * Should not show restart dialog when no pending changes
         */
        {
            funcName: "jqUnit.assertFalse",
            args: [
                "RestartDialog: Dialog not shown with when no pending changes.",
                "{that}.app.dialogManager.restartDialog.model.isShown"
            ]
        }
    ],

    { // simulate change of setting with manualRestart liveness
        funcName: "gpii.tests.restartDialog.simulateSettingAlter",
        args: [
            "{that}.app.psp",
            manualRestartSettingFixture,
            3 /*newValue*/
        ]
    },

    /*
     * Basic show of Restart Dialog
     */
    { // open PSP
        func: "{that}.app.psp.show"
    },
    [
        /*
         * Should not show restart dialog with PSP when no pending changes
         */
        { // psp shown
            funcName: "jqUnit.assertTrue",
            args: [
                "RestartDialog: PSP shown when pending change is present",
                "{that}.app.psp.model.isShown"
            ]
        }, { // dialog not shown
            funcName: "jqUnit.assertFalse",
            args: [
                "RestartDialog: Dialog now shown when PSP is opened",
                "{that}.app.dialogManager.restartDialog.model.isShown"
            ]
        }
    ],

    { // with PSP normal close
        func: "{that}.app.psp.events.onClosed.fire"
    },
    [
        /*
         * Should show restart Dialog on PSP normal close
         * with pending changes
         */
        {
            funcName: "jqUnit.assertFalse",
            args: [
                "RestartDialog: PSP is hidden when close is fired",
                "{that}.app.psp.model.isShown"
            ]
        }, { // dialog shown
            funcName: "jqUnit.assertTrue",
            args: [
                "RestartDialog: Dialog is shown when PSP is closed",
                "{that}.app.dialogManager.restartDialog.model.isShown"
            ]
        }
    ],

    { // show PSP
        func: "{that}.app.psp.show"
    },
    [
        /*
         * Should hide restart dialog when PSP is showed
         */
        {
            funcName: "jqUnit.assertTrue",
            args: [
                "RestartDialog: PSP is show when opened normally",
                "{that}.app.psp.model.isShown"
            ]
        }, {
            funcName: "jqUnit.assertFalse",
            args: [
                "RestartDialog: Dialog is hidden when PSP is shown",
                "{that}.app.dialogManager.restartDialog.model.isShown"
            ]
        }
    ],

    /*
     * PSP/Dialog restart buttons interaction
     * (restart dialog events are handled by PSP as the share the mainIPC channels)
     */
    { // Simulate RestartLater click
        func: "{that}.app.psp.events.onRestartLater.fire"
    },
    [
        /*
         * Should not show dialog when PSP is closed with RestartLater
         */
        {
            funcName: "jqUnit.assertFalse",
            args: [
                "RestartDialog: PSP is hidden when onRestart is fired",
                "{that}.app.psp.model.isShown"
            ]
        }, {
            funcName: "jqUnit.assertFalse",
            args: [
                "RestartDialog: Dialog is hidden on RestartLater in PSP",
                "{that}.app.dialogManager.restartDialog.model.isShown"
            ]
        }
    ],

    {
        func: "{that}.app.settingsBroker.clearPendingChanges"
    },
    { // show PSP
        func: "{that}.app.psp.show"
    },
    {
        func: "{that}.app.psp.events.onSettingAltered.fire",
        args: [settingChangeFixture]
    },
    { // Simulate RestartNow click
        func: "{that}.app.psp.events.onRestartNow.fire"
    },
    [
        /*
         * Should clear (apply) settings and not show dialog
         * when PSP is closed with RestartNow
         */
        {
            event: "{that}.app.settingsBroker.events.onSettingApplied",
            listener: "jqUnit.assertLeftHand", // check includes
            args: [
                "RestartDialog: PSP is hidden when onRestart is fired",
                settingChangeFixture,
                "{arguments}.0"
            ]
        }, {
            changeEvent: "{that}.app.settingsBroker.applier.modelChanged",
            path: "pendingChanges",
            listener: "fluid.identity"
        }, {
            funcName: "jqUnit.assertFalse",
            args: [
                "RestartDialog: PSP is hidden when onRestart is fired",
                "{that}.app.psp.model.isShown"
            ]
        }, {
            funcName: "jqUnit.assertDeepEq",
            args: [
                "RestartDialog: Pending changes are cleared on RestartNow in PSP",
                [],
                "{that}.app.settingsBroker.model.pendingChanges"
            ]
        }, {
            funcName: "jqUnit.assertFalse",
            args: [
                "RestartDialog: Dialog is hidden on RestartNow in PSP",
                "{that}.app.dialogManager.restartDialog.model.isShown"
            ]
        }
    ],

    { // show PSP
        func: "{that}.app.psp.show"
    },
    { // simulate change of setting with manualRestart liveness
        funcName: "gpii.tests.restartDialog.simulateSettingAlter",
        args: [
            "{that}.app.psp",
            manualRestartSettingFixture,
            3 /*newValue*/
        ]
    },
    { // Simulate PSP UndoChanges click
        func: "{that}.app.psp.events.onUndoChanges.fire"
    },
    { // with PSP normal close
        func: "{that}.app.psp.events.onClosed.fire"
    },
    [
        /*
         * Should clear pending changes and not show dialog after UndoChanges
         */
        {
            funcName: "jqUnit.assertFalse",
            args: [
                "RestartDialog: PSP is hidden when onRestart is fired",
                "{that}.app.psp.model.isShown"
            ]
        }, {
            funcName: "jqUnit.assertDeepEq",
            args: [
                "RestartDialog: Pending changes are cleared on RestartNow in PSP",
                [],
                "{that}.app.settingsBroker.model.pendingChanges"
            ]
        }, {
            funcName: "jqUnit.assertFalse",
            args: [
                "RestartDialog: Dialog is hidden on RestartNow in PSP",
                "{that}.app.dialogManager.restartDialog.model.isShown"
            ]
        }
    ]
    ]
};
