/**
 * PSP Integration Test Definitions
 *
 * Integration tests for the menu and tray components of the PSP both for the development
 * and the production configurations.
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

fluid.registerNamespace("gpii.tests.app");

gpii.tests.app.testInitialMenu = function (menu) {
    var menuTemplate = menu.model.menuTemplate;
    gpii.tests.app.testMenu(menuTemplate);
};

gpii.tests.app.testTemplateExists = function (template, expectedLength) {
    jqUnit.assertValue("The menu template was created", template);
    jqUnit.assertEquals("There are " + expectedLength + " items in the menu", expectedLength, template.length);
};

gpii.tests.app.testItem = function (item, label) {
    jqUnit.assertEquals("Check label ", label, item.label);
    jqUnit.assertNull("Item has no submenu", item.submenu);
};

gpii.tests.app.testSnapset_1aKeyedIn = function (infoItem, keyoutItem) {
    gpii.tests.app.testItem(infoItem, "User Signed In"); // Expected behavior after GPII-3826
    gpii.tests.app.testItem(keyoutItem, "Reset Morphic");
};

gpii.tests.app.testMenu = function (menuTemplate) {
    gpii.tests.app.testTemplateExists(menuTemplate, 6);
    gpii.tests.app.testItem(menuTemplate[0], "Open Morphic");
    gpii.tests.app.testItem(menuTemplate[3], "About...");
    gpii.tests.app.testItem(menuTemplate[5], "Reset Morphic");
};
// Expected behavior after GPII-3826
gpii.tests.app.testMenuSnapsetKeyedIn = function (menuTemplate) {
    gpii.tests.app.testTemplateExists(menuTemplate, 5);
    gpii.tests.app.testSnapset_1aKeyedIn(menuTemplate[1], menuTemplate[4]);
    gpii.tests.app.testItem(menuTemplate[0], "Open Morphic");
};

gpii.tests.app.receiveApp = function (testCaseHolder, app) {
    testCaseHolder.app = app;
};

fluid.registerNamespace("gpii.tests.app.testDefs");

gpii.tests.app.testDefs = {
    name: "GPII application integration tests",
    expect: 24,
    config: {
        configName: "gpii.tests.production.config",
        configPath: "tests/configs"
    },
    gradeNames: ["gpii.test.common.testCaseHolder"],
    sequence: [{ // Test the menu that will be rendered
        func: "gpii.tests.app.testInitialMenu",
        args: ["{that}.app.tray.menu"]
    }, { // Test menu after key in
        func: "{that}.app.keyIn",
        args: "snapset_1a"
    }, {
        changeEvent: "{that}.app.tray.menu.applier.modelChanged",
        // XXX {{1}} as `keyedInUserToken` and `preferences` are updated at different times (token is first),
        // if we have a listener for `menuTemplate` update, the `preferenceSetsMenuItems` update won't be present
        // at the time of the event firing
        path: "preferenceSetsMenuItems",
        args: ["{that}.app.tray.menu.model.menuTemplate"],
        listener: "gpii.tests.app.testMenuSnapsetKeyedIn"
    }, { // Test menu after key out
        func: "{that}.app.keyOut"
    }, {
        event: "{that}.app.events.onKeyedOut",
        args: ["{that}.app.tray.menu.model.menuTemplate"],
        listener: "gpii.tests.app.testMenu"
    }]
};

fluid.registerNamespace("gpii.tests.dev");

var prefSetsInDevStartIdx = 8;
gpii.tests.dev.testMultiContextKeyedIn = function (tray, menuTemplate, activeSetIdx) {
    gpii.tests.app.testItem(menuTemplate[3], "Keyed in with Multiple Contexts");
    gpii.tests.app.testItem(menuTemplate[prefSetsInDevStartIdx], "Default preferences");
    gpii.tests.app.testItem(menuTemplate[prefSetsInDevStartIdx + 1], "bright");
    gpii.tests.app.testItem(menuTemplate[prefSetsInDevStartIdx + 2], "noise");
    gpii.tests.app.testItem(menuTemplate[prefSetsInDevStartIdx + 3], "bright and noise");

    jqUnit.assertTrue("Active set is marked in the menu", menuTemplate[activeSetIdx].checked);
    gpii.tests.dev.testTrayTooltip(tray, menuTemplate[activeSetIdx].label);
};

gpii.tests.dev.testInitialMenu = function (menu) {
    var menuTemplate = menu.model.menuTemplate;
    gpii.tests.dev.testMenu(menuTemplate);
};

gpii.tests.dev.testKeyInList = function (item) {
    jqUnit.assertEquals("Item is 'Key In' List", "Key in ...", item.label);
    var submenu = item.submenu;
    jqUnit.assertValue("Item has submenu", submenu);
    jqUnit.assertEquals("Key in list has 16 items", 16, submenu.length);

    gpii.tests.app.testItem(submenu[0], "Voice control with Increased Size");
    gpii.tests.app.testItem(submenu[1], "Larger 125%");
    gpii.tests.app.testItem(submenu[2], "Larger 150%");
    gpii.tests.app.testItem(submenu[3], "Larger 175%");
    gpii.tests.app.testItem(submenu[4], "Dark & Larger 125%");
    gpii.tests.app.testItem(submenu[5], "Dark & Larger 150%");
    gpii.tests.app.testItem(submenu[6], "Dark & Larger 175%");
    gpii.tests.app.testItem(submenu[7], "Read To Me");
    gpii.tests.app.testItem(submenu[8], "Magnifier 200%");
    gpii.tests.app.testItem(submenu[9], "Magnifier 400%");
    gpii.tests.app.testItem(submenu[10], "Magnifier 200% & Display Scaling 175%");
    gpii.tests.app.testItem(submenu[11], "Dark Magnifier 200%");
    gpii.tests.app.testItem(submenu[12], "Multiple pref sets. Magnifier & Volume Control");
    gpii.tests.app.testItem(submenu[13], "Empty Pref Set");
    gpii.tests.app.testItem(submenu[14], "onKeyInFail");
    gpii.tests.app.testItem(submenu[15], "onSettingWriteFail");
};

gpii.tests.dev.testMenu = function (menuTemplate) {
    gpii.tests.app.testTemplateExists(menuTemplate, 10);
    gpii.tests.app.testItem(menuTemplate[0], "Open Morphic");
    gpii.tests.app.testItem(menuTemplate[1], "Capture Tool");
    gpii.tests.app.testItem(menuTemplate[2], "Capture Tool Diagnostics");
    gpii.tests.dev.testKeyInList(menuTemplate[5]);
    gpii.tests.app.testItem(menuTemplate[6], "About...");
    gpii.tests.app.testItem(menuTemplate[8], "Reset Morphic");
    gpii.tests.app.testItem(menuTemplate[9], "Exit GPII");
};
// Expected behavior after GPII-3826
gpii.tests.dev.testMenuSnapsetKeyedIn = function (menuTemplate) {
    gpii.tests.app.testTemplateExists(menuTemplate, 11);
    gpii.tests.app.testItem(menuTemplate[0], "Open Morphic");
    gpii.tests.app.testItem(menuTemplate[1], "Capture Tool");
    gpii.tests.app.testItem(menuTemplate[2], "Capture Tool Diagnostics");
    gpii.tests.dev.testKeyInList(menuTemplate[6]);
    gpii.tests.app.testSnapset_1aKeyedIn(menuTemplate[3], menuTemplate[9]);
    gpii.tests.app.testItem(menuTemplate[10], "Exit GPII");
};

gpii.tests.dev.testTrayTooltip = function (tray, activePrefSet) {
    var expectedTooltip;

    if (activePrefSet) {
        expectedTooltip = fluid.stringTemplate(tray.model.messages.prefSetTooltip, {
            prefSet: activePrefSet
        });
    } else {
        expectedTooltip = tray.model.messages.defaultTooltip;
    }

    jqUnit.assertEquals("Tray tooltip label", expectedTooltip, tray.model.tooltip);
};

gpii.tests.dev.testTrayKeyedOut = function (tray) {
    jqUnit.assertValue("Tray is available", tray);
    jqUnit.assertEquals("No user keyed-in icon",
        fluid.module.resolvePath(tray.options.icons.keyedOut), tray.model.icon);
    gpii.tests.dev.testTrayTooltip(tray);
};

gpii.tests.dev.testTrayKeyedIn = function (tray, activePrefSet) {
    jqUnit.assertValue("Tray is available", tray);
    jqUnit.assertEquals("Keyed-in user icon", fluid.module.resolvePath(tray.options.icons.keyedIn), tray.model.icon);
    gpii.tests.dev.testTrayTooltip(tray, activePrefSet);
};

gpii.tests.dev.testMultiPrefSetMenu = function (tray, menuTemplate) {
    gpii.tests.app.testTemplateExists(menuTemplate, 11);
    gpii.tests.app.testItem(menuTemplate[0], "Open Morphic");
    gpii.tests.app.testItem(menuTemplate[9], "Reset Morphic");
    gpii.tests.app.testItem(menuTemplate[10], "Exit GPII");
};

gpii.tests.dev.testChangedActivePrefSetMenu = function (tray, menuTemplate, prefSetClickedIdx) {
    gpii.tests.dev.testMultiContextKeyedIn(
        tray,
        menuTemplate,
        /*activeSetIdx=*/prefSetClickedIdx
    );
};

gpii.tests.dev.testActiveSetChanged = function (tray, menuTemplate, prefSetItemClickedIdx, preferences) {
    // Changed in menu
    gpii.tests.dev.testChangedActivePrefSetMenu(tray, menuTemplate, prefSetItemClickedIdx);

    // Changed in component
    jqUnit.assertEquals("Active preference set changed properly in component",
        menuTemplate[prefSetItemClickedIdx].args,
        preferences.activeSet);
};

fluid.registerNamespace("gpii.tests.dev.testDefs");

// TODO: Should this derive from the above app tests?
gpii.tests.dev.testDefs = {
    name: "GPII application dev config integration tests",
    expect: 164,
    config: {
        configName: "gpii.tests.dev.config",
        configPath: "tests/configs"
    },
    gradeNames: ["gpii.test.common.testCaseHolder"],
    sequence: [{ // Test the tray that will be rendered
        func: "gpii.tests.dev.testTrayKeyedOut",
        args: ["{that}.app.tray"]
    }, { // Test the menu that will be rendered
        func: "gpii.tests.dev.testInitialMenu",
        args: "{that}.app.tray.menu"
    }, { // Test menu after key in
        func: "{that}.app.keyIn",
        args: "snapset_1a"
    }, {
        changeEvent: "{that}.app.tray.menu.applier.modelChanged",
        // XXX {{1}}
        path: "preferenceSetsMenuItems",
        args: ["{that}.app.tray.menu.model.menuTemplate"],
        listener: "gpii.tests.dev.testMenuSnapsetKeyedIn"
    }, {
        func: "gpii.tests.dev.testTrayKeyedIn",
        args: ["{that}.app.tray", "Default preferences"]
    }, { // Test menu after key out
        func: "{that}.app.keyOut"
    }, {
        event: "{that}.app.events.onKeyedOut",
        args: ["{that}.app.tray.menu.model.menuTemplate"],
        listener: "gpii.tests.dev.testMenu"
    }, {
        func: "gpii.tests.dev.testTrayKeyedOut",
        args: "{that}.app.tray"
    }, { // test active set change
        func: "{that}.app.keyIn",
        args: "multi_context"
    }, {
        changeEvent: "{that}.app.tray.menu.applier.modelChanged",
        // XXX {{1}}
        path: "preferenceSetsMenuItems",
        args: ["{that}.app.tray", "{that}.app.tray.menu.model.menuTemplate"],
        listener: "gpii.tests.dev.testMultiPrefSetMenu"
    }, { // simulate choosing different pref set
        func: "{that}.app.tray.menu.model.menuTemplate.9.click"
    }, {
        func: "{that}.app.keyOut"
    }, {
        event: "{that}.app.events.onKeyedOut",
        listener: "fluid.identity"
    }]
};
