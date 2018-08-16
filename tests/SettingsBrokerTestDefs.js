 /**
 * PSP Settings Broker Integration Test Definitions
 *
 * Integration tests for the settings broker component of the PSP. Test whether setting
 * changes are properly enqueued, applied and removed.
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

fluid.require("%kettle/lib/test/KettleTestUtils.http.js");
require("../src/main/app.js");

fluid.registerNamespace("gpii.tests.settingsBroker.testDefs");

var liveSettingChange = {
    path: "textfieldPath",
    oldValue: "Old value",
    value: "New Value",

    liveness: "live",

    schema: {
        type: "text",
        title: "Text input",
        description: "Text input description"
    }
};

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

gpii.tests.settingsBroker.receiveApp = function (testCaseHolder, app) {
    testCaseHolder.app = app;
};

gpii.tests.settingsBroker.testNoPendingChanges = function (settingsBroker) {
    jqUnit.assertDeepEq("There are no pending changes",
        [], settingsBroker.model.pendingChanges);
};

gpii.tests.settingsBroker.testBrokerBeforeKeyIn = function (settingsBroker) {
    jqUnit.assertValue("The settings broker exists", settingsBroker);
    jqUnit.assertFalse("There is no keyed in user for the settings broker",
        settingsBroker.model.isKeyedIn);
    gpii.tests.settingsBroker.testNoPendingChanges(settingsBroker);
};

gpii.tests.settingsBroker.testBrokerAfterKeyIn = function (settingsBroker) {
    jqUnit.assertTrue("There is a keyed in user", settingsBroker.model.isKeyedIn);
    gpii.tests.settingsBroker.testNoPendingChanges(settingsBroker);
};

gpii.tests.settingsBroker.testLiveSettingEnqueue = function (settingsBroker, expectedChange, actualChange) {
    jqUnit.assertDeepEq("The live setting that is applied is correct",
        expectedChange, actualChange);
    gpii.tests.settingsBroker.testNoPendingChanges(settingsBroker);
};

gpii.tests.settingsBroker.testNonLiveSettingEnqueue = function (settingsBroker, tray, expectedChanges) {
    jqUnit.assertEquals("The number of pending changes is correct",
        expectedChanges.length, settingsBroker.model.pendingChanges.length);
    fluid.each(expectedChanges, function (expectedChange, index) {
        jqUnit.assertDeepEq("The correct setting change has been queued",
            expectedChange, settingsBroker.model.pendingChanges[index]);
    });
};

gpii.tests.settingsBroker.testApplyPendingChanges = function (expectedChanges, actualChanges) {
    jqUnit.assertDeepEq("The flushed pending change is correct",
        expectedChanges, actualChanges);
};

gpii.tests.settingsBroker.testUndoPendingChanges = function (expectedChange, actualChange) {
    jqUnit.assertEquals("The undo operation is triggered with the correct path",
        expectedChange.path, actualChange.path);
    jqUnit.assertDeepEq("The undo operation is triggered with the correct value",
        expectedChange.oldValue, actualChange.value);
};

gpii.tests.settingsBroker.testBrokerAfterKeyOut = function (settingsBroker) {
    jqUnit.assertFalse("There is no keyed in user after key out",
        settingsBroker.model.isKeyedIn);
    gpii.tests.settingsBroker.testNoPendingChanges(settingsBroker);
};

gpii.tests.settingsBroker.testDefs = {
    name: "Settings broker integration tests",
    expect: 22,
    config: {
        configName: "gpii.tests.dev.config",
        configPath: "tests/configs"
    },
    gradeNames: ["gpii.test.common.testCaseHolder"],
    sequence: [{
        func: "gpii.tests.settingsBroker.testBrokerBeforeKeyIn",
        args: ["{that}.app.settingsBroker"]
    }, {
        func: "{that}.app.keyIn",
        args: ["snapset_1a"]
    }, {
        changeEvent: "{that}.app.settingsBroker.applier.modelChanged",
        path: "isKeyedIn",
        listener: "gpii.tests.settingsBroker.testBrokerAfterKeyIn",
        args: ["{that}.app.settingsBroker"]
    }, {
        func: "{that}.app.settingsBroker.enqueue",
        args: [liveSettingChange]
    }, { // Live setting changes are applied immediately.
        event: "{that}.app.settingsBroker.events.onSettingApplied",
        listener: "gpii.tests.settingsBroker.testLiveSettingEnqueue",
        args: ["{that}.app.settingsBroker", liveSettingChange, "{arguments}.0"]
    }, {
        func: "{that}.app.settingsBroker.enqueue",
        args: [manualSettingChange]
    }, {
        func: "{that}.app.settingsBroker.enqueue",
        args: [osSettingChange]
    }, { // "manualRestart" and "OSRestart" changes are stored in a queue...
        func: "gpii.tests.settingsBroker.testNonLiveSettingEnqueue",
        args: ["{that}.app.settingsBroker", "{that}.app.tray", [manualSettingChange, osSettingChange]]
    }, {
        func: "{that}.app.settingsBroker.applyPendingChanges"
    }, { // ...and are applied sequentially...
        event: "{that}.app.settingsBroker.events.onSettingApplied",
        listener: "gpii.tests.settingsBroker.testApplyPendingChanges",
        args: [manualSettingChange, "{arguments}.0"]
    }, {
        event: "{that}.app.settingsBroker.events.onSettingApplied",
        listener: "gpii.tests.settingsBroker.testApplyPendingChanges",
        args: [osSettingChange, "{arguments}.0"]
    }, { // ...until there are no more changes to apply.
        changeEvent: "{that}.app.settingsBroker.applier.modelChanged",
        path: "pendingChanges",
        listener: "gpii.tests.settingsBroker.testNoPendingChanges",
        args: ["{that}.app.settingsBroker"]
    }, {
        func: "{that}.app.settingsBroker.enqueue",
        args: [manualSettingChange]
    }, {
        func: "{that}.app.settingsBroker.undoPendingChanges"
    }, { // Settings changes can be undone - `onSettingApplied` is fired with the initial setting value.
        event: "{that}.app.settingsBroker.events.onSettingApplied",
        listener: "gpii.tests.settingsBroker.testUndoPendingChanges",
        args: [manualSettingChange, "{arguments}.0"]
    }, {
        changeEvent: "{that}.app.settingsBroker.applier.modelChanged",
        path: "pendingChanges",
        listener: "gpii.tests.settingsBroker.testNoPendingChanges",
        args: ["{that}.app.settingsBroker"]
    }, {
        func: "{that}.app.settingsBroker.enqueue",
        args: [osSettingChange]
    }, {
        func: "{that}.app.settingsBroker.enqueue",
        args: [manualSettingChange]
    }, { // When the PSP is closed...
        func: "{that}.app.psp.events.onClosed.fire"
    }, { // ..."manualRestart" pending changes are applied...
        event: "{that}.app.settingsBroker.events.onSettingApplied",
        listener: "gpii.tests.settingsBroker.testApplyPendingChanges",
        args: [manualSettingChange, "{arguments}.0"]
    }, { // ...whereas "OSRestart" pending changes are reverted...
        event: "{that}.app.settingsBroker.events.onSettingApplied",
        listener: "gpii.tests.settingsBroker.testUndoPendingChanges",
        args: [osSettingChange, "{arguments}.0"]
    }, { // ...and again there will be no changes left in the queue.
        changeEvent: "{that}.app.settingsBroker.applier.modelChanged",
        path: "pendingChanges",
        listener: "gpii.tests.settingsBroker.testNoPendingChanges",
        args: ["{that}.app.settingsBroker"]
    }, { // If there is a pending change...
        func: "{that}.app.settingsBroker.enqueue",
        args: [osSettingChange]
    }, { // ...and the user keys out...
        func: "{that}.app.keyOut"
    }, { // ...the pending changes will be discarded.
        changeEvent: "{that}.app.applier.modelChanged",
        path: "isKeyedIn",
        listener: "gpii.tests.settingsBroker.testBrokerAfterKeyOut",
        args: ["{that}.app.settingsBroker"]
    }]
};
