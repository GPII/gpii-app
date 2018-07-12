 /**
 * PSP Blur Behavior Integration Test Definitions
 *
 * Integration tests for the closing behavior of the PSP when clicking outside of it
 * depending on the `closePSPOnBlur` user's preference.
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

var fluid = require("infusion"),
    jqUnit = fluid.require("node-jqunit", require, "jqUnit"),
    gpii = fluid.registerNamespace("gpii");

require("../node_modules/kettle/lib/test/KettleTestUtils.http.js");
require("../src/main/app.js");

fluid.registerNamespace("gpii.tests.pspBlur.testDefs");

var manualSettingChange = {
    path: "dropdownPath",
    oldValue: "Old value",
    value: "New value",
    solutionName: "solutions1",

    liveness: "manualRestart",
    memory: false,

    schema: {
        type: "string",
        "enum": ["Old value", "New value"],
        title: "Setting one title",
        description: "Setting one description"
    }
};

var osSettingChange = {
    path: "zoomPath",
    oldValue: 0.75,
    value: 1,

    liveness: "OSRestart",

    schema: {
        type: "number",
        title: "Zoom",
        description: "Zoom description",
        min: 0.5,
        max: 4,
        divisibleBy: 0.1
    }
};

gpii.tests.pspBlur.checkPSPVisibility = function (psp, isShown) {
    jqUnit.assertEquals(
        "The PSP window has correct visibility",
        isShown,
        psp.model.isShown
    );
};

gpii.tests.pspBlur.blur = function (psp) {
    psp.dialog.blur();
};

gpii.tests.pspBlur.testDefs = {
    name: "PSP Blur behavior integration tests",
    expect: 11,
    config: {
        configName: "gpii.tests.dev.config",
        configPath: "tests/configs"
    },
    gradeNames: ["gpii.test.common.testCaseHolder"],
    sequence: [[ // Test that PSP will close when clicking outside if there is no keyed in user
        {   // The proper way would be to wait for the {that}.app.gpiiConnector.events.onPreferencesUpdated
            // but this cannot happen because of https://issues.fluidproject.org/browse/FLUID-5502
            func: "{that}.app.psp.applier.change",
            args: ["preferences", {closePSPOnBlur: true}]
        }, {
            func: "{that}.app.psp.show"
        }, {
            func: "gpii.tests.pspBlur.checkPSPVisibility",
            args: ["{that}.app.psp", true]
        }, {
            funcName: "gpii.tests.pspBlur.blur",
            args: ["{that}.app.psp"]
        }, {
            event: "{that}.app.psp.events.onBlur",
            listener: "gpii.tests.pspBlur.checkPSPVisibility",
            args: ["{that}.app.psp", false]
        }
    ], [ // Test that PSP will close when clicking outside if there is a keyed in user with closePSPOnBlur = true preference.
        { // Key in with an arbitrary snapset...
            func: "{that}.app.keyIn",
            args: ["snapset_1a"]
        }, {
            func: "{that}.app.psp.show"
        }, {
            func: "gpii.tests.pspBlur.checkPSPVisibility",
            args: ["{that}.app.psp", true]
        }, {
            funcName: "gpii.tests.pspBlur.blur",
            args: ["{that}.app.psp"]
        }, {
            event: "{that}.app.psp.events.onBlur",
            listener: "gpii.tests.pspBlur.checkPSPVisibility",
            args: ["{that}.app.psp", false]
        }
    ], [ // Test that PSP will not close if there is a pending manual setting change regardless of the closePSPOnBlur preference.
        {
            func: "{that}.app.psp.show"
        }, {
            func: "gpii.tests.pspBlur.checkPSPVisibility",
            args: ["{that}.app.psp", true]
        }, {
            func: "{that}.app.settingsBroker.enqueue",
            args: [manualSettingChange]
        }, {
            funcName: "gpii.tests.pspBlur.blur",
            args: ["{that}.app.psp"]
        }, {
            func: "gpii.tests.pspBlur.checkPSPVisibility",
            args: ["{that}.app.psp", true]
        }, {
            func: "{that}.app.settingsBroker.undoPendingChanges"
        }
    ], [ // Test that PSP will close if there is a pending OS setting change and closePSPOnBlur = true
        {
            func: "{that}.app.settingsBroker.enqueue",
            args: [osSettingChange]
        }, {
            funcName: "gpii.tests.pspBlur.blur",
            args: ["{that}.app.psp"]
        }, {
            event: "{that}.app.psp.events.onBlur",
            listener: "gpii.tests.pspBlur.checkPSPVisibility",
            args: ["{that}.app.psp", false]
        }, {
            func: "{that}.app.settingsBroker.undoPendingChanges"
        }
    ], [ // Test that PSP will not close when clicking outside if there is a keyed in user with closePSPOnBlur = false preference.
        {
            func: "{that}.app.psp.applier.change",
            args: ["preferences", {closePSPOnBlur: false}]
        }, {
            func: "{that}.app.psp.show"
        }, {
            func: "gpii.tests.pspBlur.checkPSPVisibility",
            args: ["{that}.app.psp", true]
        }, {
            funcName: "gpii.tests.pspBlur.blur",
            args: ["{that}.app.psp"]
        }, {
            func: "gpii.tests.pspBlur.checkPSPVisibility",
            args: ["{that}.app.psp", true]
        }
    ], [ // Test that PSP will not close if there is a pending manual setting change regardless of the closePSPOnBlur preference.
        {
            func: "{that}.app.settingsBroker.enqueue",
            args: [manualSettingChange]
        }, {
            funcName: "gpii.tests.pspBlur.blur",
            args: ["{that}.app.psp"]
        }, {
            func: "gpii.tests.pspBlur.checkPSPVisibility",
            args: ["{that}.app.psp", true]
        }, {
            func: "{that}.app.settingsBroker.undoPendingChanges"
        }
    ], [  // Test that PSP will not close if there is a pending OS setting change and closePSPOnBlur = false
        {
            func: "{that}.app.settingsBroker.enqueue",
            args: [osSettingChange]
        }, {
            funcName: "gpii.tests.pspBlur.blur",
            args: ["{that}.app.psp"]
        }, {
            func: "gpii.tests.pspBlur.checkPSPVisibility",
            args: ["{that}.app.psp", true]
        }, {
            func: "{that}.app.keyOut"
        }
    ]]
};
