/*
 * GPII App ShortcutsManager Integration Tests
 *
 * Copyright 2018 Raising the Floor - International
 *
 * Licensed under the New BSD license. You may not use this file except in
 * compliance with this License.
 *
 * You may obtain a copy of the License at
 * https://github.com/GPII/universal/blob/master/LICENSE.txt
 */

"use strict";

var fluid = require("infusion"),
    jqUnit = fluid.require("node-jqunit", require, "jqUnit"),
    gpii = fluid.registerNamespace("gpii");

require("../src/main/app.js");
require("./testUtils.js");

fluid.registerNamespace("gpii.tests.shortcutsManager.testDefs");

fluid.defaults("gpii.tests.shortcutsManager.mockedShortcutsManager", {
    gradeNames: "fluid.modelComponent",
    events: {
        onGlobalShortcut: null,
        onLocalShortcut: null
    }
});

gpii.tests.shortcutsManager.testGlobalShortcutOperations = function (shortcutsManager) {
    var globalEventName = "onGlobalShortcut",
        globalShortcutAccelerator = "Ctrl+Shift+Alt+D+E+V",
        missingGlobalEventName = "onMissingGlobalEvent";

    jqUnit.expectFrameworkDiagnostic("An error is thrown if a global shortcut doesn't have an associated event", function () {
        shortcutsManager.registerGlobalShortcut(globalShortcutAccelerator, missingGlobalEventName);
    }, "ShortcutsManager: Missing shortcut event - " + missingGlobalEventName);

    shortcutsManager.registerGlobalShortcut(globalShortcutAccelerator, globalEventName);
    jqUnit.assert("Global shortcut registered successfully");

    jqUnit.expectFrameworkDiagnostic("An errors is thrown when trying to register an already present global shortcut", function () {
        shortcutsManager.registerGlobalShortcut(globalShortcutAccelerator, globalEventName);
    }, "ShortcutsManager: Global shortcut already exists - " + globalShortcutAccelerator);

    shortcutsManager.deregisterGlobalShortcut(globalShortcutAccelerator);
    jqUnit.assert("Global shortcut deregistered successfully");

    // Let's try to deregister the `globalShortcutAccelerator` now that it has already been deregistered
    jqUnit.expectFrameworkDiagnostic("An errors is thrown when trying to deregister a missing global shortcut", function () {
        shortcutsManager.deregisterGlobalShortcut(globalShortcutAccelerator);
    }, "ShortcutsManager: Cannot unregister an unexisting global shortcut - " + globalShortcutAccelerator);
};

gpii.tests.shortcutsManager.testLocalShortcutOperations = function (shortcutsManager) {
    var localEventName = "onLocalShortcut",
        localShortcutAccelerator = "Ctrl+Z",
        missingLocalEventName = "onMissingLocalEvent",
        dialogGradeName = "gpii.app.psp",
        nonExistingGradeName = "gpii.app.nonExistingComponent",
        nonDialogGradeName = "gpii.app.factsManager";

    jqUnit.expectFrameworkDiagnostic("An error is thrown if a local shortcut doesn't have an associated event", function () {
        shortcutsManager.registerLocalShortcut(localShortcutAccelerator, missingLocalEventName, dialogGradeName);
    }, "ShortcutsManager: Missing shortcut event - " + missingLocalEventName);

    jqUnit.expectFrameworkDiagnostic("An error is thrown if a local shortcut is registered for an unspecified window", function () {
        shortcutsManager.registerLocalShortcut(localShortcutAccelerator, localEventName);
    }, "ShortcutsManager: Local shortcuts require windows to be attached to - " + localEventName);

    jqUnit.expectFrameworkDiagnostic("An error is thrown if a local shortcut is registered for a non-existing component", function () {
        shortcutsManager.registerLocalShortcut(localShortcutAccelerator, localEventName, nonExistingGradeName);
    }, "ShortcutsManager: Target window either missing or not of `gpii.app.dialog` grade - " + nonExistingGradeName);

    jqUnit.expectFrameworkDiagnostic("An error is thrown if a local shortcut is registered for an exsting component which does not have a dialog", function () {
        shortcutsManager.registerLocalShortcut(localShortcutAccelerator, localEventName, nonDialogGradeName);
    }, "ShortcutsManager: Target window either missing or not of `gpii.app.dialog` grade - " + nonDialogGradeName);

    shortcutsManager.registerLocalShortcut(localShortcutAccelerator, localEventName, dialogGradeName);
    jqUnit.assert("Local shortcut registered successfully");

    shortcutsManager.deregisterLocalShortcut(localShortcutAccelerator, dialogGradeName);
    jqUnit.assert("Local shortcut deregistered successfully");

    jqUnit.expectFrameworkDiagnostic("An error is thrown if a local shortcut is deregistered for a non-existing component", function () {
        shortcutsManager.deregisterLocalShortcut(localShortcutAccelerator, nonExistingGradeName);
    }, "ShortcutsManager: Target window either missing or not of `gpii.app.dialog` grade - " + nonExistingGradeName);

    jqUnit.expectFrameworkDiagnostic("An error is thrown if a local shortcut is deregistered for an exsting component which does not have a dialog", function () {
        shortcutsManager.deregisterLocalShortcut(localShortcutAccelerator, nonDialogGradeName);
    }, "ShortcutsManager: Target window either missing or not of `gpii.app.dialog` grade - " + nonDialogGradeName);
};

gpii.tests.shortcutsManager.testGpiiAppGlobalShortcut = function (app, shortcutsManager) {
    var defaultGpiiAppShortcut = app.gpiiConnector.options.defaultPreferences.gpiiAppShortcut,
        initialShortcut = app.model.preferences.gpiiAppShortcut,
        newGpiiAppShortcut = "Ctrl+Shift+Alt+D+E+V";

    jqUnit.assertEquals("The initial GPII app shortcut is the same as the default one specified in the GPII connector",
        defaultGpiiAppShortcut, initialShortcut);
    jqUnit.assertTrue("The initial GPII app shortcut is actually registered",
        shortcutsManager.isGlobalShortcutRegistered(initialShortcut));

    // Register a new shortcut
    app.applier.change("preferences.gpiiAppShortcut", newGpiiAppShortcut);
    jqUnit.assertFalse("The initial GPII app shortcut is no longer registered",
        shortcutsManager.isGlobalShortcutRegistered(initialShortcut));
    jqUnit.assertTrue("The new GPII app shortcut has been registered as a global shortcut",
        shortcutsManager.isGlobalShortcutRegistered(newGpiiAppShortcut));

    // Register an invalid application shortcut
    app.applier.change("preferences.gpiiAppShortcut", null);
    jqUnit.assertFalse("The subsequent GPII app shortcut is no longer registered",
        shortcutsManager.isGlobalShortcutRegistered(newGpiiAppShortcut));
};

gpii.tests.shortcutsManager.testDefs = {
    name: "Shortcuts Manager integration tests",
    expect: 9,
    config: {
        configName: "gpii.tests.dev.config",
        configPath: "tests/configs"
    },
    distributeOptions: {
        applyMockedShortcutsManager: {
            record: "gpii.tests.shortcutsManager.mockedShortcutsManager",
            target: "{that gpii.app.shortcutsManager}.options.gradeNames"
        }
    },
    gradeNames: ["gpii.test.common.testCaseHolder"],
    sequence: [{
        func: "gpii.tests.shortcutsManager.testGlobalShortcutOperations",
        args: ["{that}.app.shortcutsManager"]
    }, {
        func: "gpii.tests.shortcutsManager.testLocalShortcutOperations",
        args: ["{that}.app.shortcutsManager"]
    }, {
        func: "gpii.tests.shortcutsManager.testGpiiAppGlobalShortcut",
        args: ["{that}.app", "{that}.app.shortcutsManager"]
    }]
};
