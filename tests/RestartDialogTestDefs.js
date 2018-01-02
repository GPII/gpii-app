/*
 * GPII App Integration Test Definitions
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

var fluid  = require("infusion"),
    gpii   = fluid.registerNamespace("gpii");


require("node-jqunit", require, "jqUnit");
require("../node_modules/kettle/lib/test/KettleTestUtils.http.js");
require("../src/main/app.js");

fluid.registerNamespace("gpii.tests.settingsBroker.testDefs");


var manualRestartSettingFixture = {
    icon: "../../icons/gear-cloud-white.png",
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

fluid.registerNamespace("gpii.tests.restartWarningController.utils");
// Utils
gpii.tests.restartWarningController.utils.simulateSettingAlter = function (psp, setting, newValue) {
    setting.oldValue = setting.value;
    setting.value = newValue;

    psp.events.onSettingAltered.fire(setting);
};

gpii.tests.restartWarningController.testDefs = {
    name: "Restart dialog integration tests",
    expect: 15,
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

    { // try to show dialog
        func: "{that}.app.restartDialog.showIfNeeded",
        args: [[]]
    },
    [
        /*
         * Should not show restart dialog when no pending changes
         */
        {
            funcName: "jqUnit.assertFalse",
            args: [
                "RestartDialog: Dialog not shown with when no pending changes.",
                "@expand:{that}.app.restartDialog.isShown()"
            ]
        }
    ],

    { // simulate change of setting with manualRestart liveness
        funcName: "gpii.tests.restartWarningController.utils.simulateSettingAlter",
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
                "@expand:{that}.app.restartDialog.isShown()"
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
                "@expand:{that}.app.restartDialog.isShown()"
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
                "@expand:{that}.app.restartDialog.isShown()"
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
                "@expand:{that}.app.restartDialog.isShown()"
            ]
        }
    ],

    { // show PSP
        func: "{that}.app.psp.show"
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
                "@expand:{that}.app.restartDialog.isShown()"
            ]
        }
        // TODO check whether setting applied event was fired
    ],

    { // show PSP
        func: "{that}.app.psp.show"
    },
    { // simulate change of setting with manualRestart liveness
        funcName: "gpii.tests.restartWarningController.utils.simulateSettingAlter",
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
                "@expand:{that}.app.restartDialog.isShown()"
            ]
        }
    ]

    /*
     * Tests that are missing
     * - should show warning in PSP with correct settings list
     * - should show dialog with correct settings list
     * - should fire N events (settingApplied) with resartNow
     * - should fire N events () with undoChanges
     */
    ]
};
