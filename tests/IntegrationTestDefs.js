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

var fluid = require("infusion"),
    jqUnit = fluid.require("node-jqunit", require, "jqUnit"),
    gpii = fluid.registerNamespace("gpii");

require("../node_modules/kettle/lib/test/KettleTestUtils.http.js");
require("../src/app.js");

fluid.registerNamespace("gpii.tests.app");

// TODO: Is there a way to do this directly in the sequence?
gpii.tests.app.testInitialMenu = function (menu) {
    var menuTemplate = menu.model.menuTemplate;
    gpii.tests.app.testMenu(menuTemplate);
};

// Test regarding the PCP window
fluid.registerNamespace("gpii.tests.app.pcp");

gpii.tests.app.pcp.testPCPWindowIsShown = function (pcpWindow) {
    jqUnit.assertTrue("The PCP Window is shown", pcpWindow.isVisible());
};

gpii.tests.app.pcp.testPCPWindowIsHidden = function (pcpWindow) {
    jqUnit.assertFalse("The PCP Window is hidden", pcpWindow.isVisible());
};

gpii.tests.app.pcp.testInitialPCPWindow = function (pcp) {
    jqUnit.assertNotUndefined("The PCP was instantiated", pcp);
    jqUnit.assertNotUndefined("The PCP Electron window was instantiated", pcp.pcpWindow);
    gpii.tests.app.pcp.testPCPWindowIsHidden(pcp.pcpWindow);
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
    gpii.tests.app.testItem(infoItem, "Keyed in with Snapset_1a");
    gpii.tests.app.testItem(keyoutItem, "Key out Snapset_1a");
};

gpii.tests.app.testMenu = function (menuTemplate) {
    gpii.tests.app.testTemplateExists(menuTemplate, 2);
    gpii.tests.app.testItem(menuTemplate[0], "Open PCP");
    gpii.tests.app.testItem(menuTemplate[1], "Not keyed in");
};

gpii.tests.app.testMenuSnapsetKeyedIn = function (menuTemplate) {
    gpii.tests.app.testTemplateExists(menuTemplate, 3);
    gpii.tests.app.testSnapset_1aKeyedIn(menuTemplate[1], menuTemplate[2]);
    gpii.tests.app.testItem(menuTemplate[0], "Open PCP");
};

gpii.tests.app.receiveApp = function (testCaseHolder, app) {
    testCaseHolder.app = app;
};

fluid.registerNamespace("gpii.tests.app.testDefs");

gpii.tests.app.testDefs = {
    name: "GPII application integration tests",
    expect: 32,
    config: {
        configName: "app",
        configPath: "configs"
    },
    gradeNames: ["gpii.test.common.testCaseHolder"],
    distributeOptions: {
        record: {
            funcName: "gpii.tests.app.receiveApp",
            args: ["{testCaseHolder}", "{arguments}.0"]
        },
        target: "{that flowManager gpii.app}.options.listeners.onCreate"
    },
    sequence: [{ // Test the menu that will be rendered
        event: "{that gpii.app.menu}.events.onCreate",
        listener: "gpii.tests.app.testInitialMenu"
    }, [ // PCP window tests
        { // pcpWindow should've been created by now
            funcName: "gpii.tests.app.pcp.testInitialPCPWindow",
            args: ["{that}.app.pcp"]
        }, {
            func: "{that}.app.pcp.show"
        }, {
            funcName: "gpii.tests.app.pcp.testPCPWindowIsShown",
            args: ["{that}.app.pcp.pcpWindow"]
        }
    ], { // Test menu after key in
        func: "{that}.app.keyIn",
        args: "snapset_1a"
    }, {
        changeEvent: "{that}.app.tray.menu.applier.modelChanged",
        path: "menuTemplate",
        listener: "gpii.tests.app.testMenuSnapsetKeyedIn"
    }, { // Test key in attempt while someone is keyed in
        func: "{that}.app.keyIn",
        args: "snapset_2a"
    }, {
        event: "{that flowManager kettle.request.http}.events.onError",
        listener: "gpii.tests.app.testMenuSnapsetKeyedIn",
        args: ["{that}.app.tray.menu.model.menuTemplate"]
    }, { // Test menu after key out
        func: "{that}.app.keyOut",
        args: "snapset_1a"
    }, {
        changeEvent: "{that}.app.tray.menu.applier.modelChanged",
        path: "menuTemplate",
        listener: "gpii.tests.app.testMenu"
    }]
};

fluid.registerNamespace("gpii.tests.dev");

gpii.tests.dev.testInitialMenu = function (menu) {
    var menuTemplate = menu.model.menuTemplate;
    gpii.tests.dev.testMenu(menuTemplate);
};

gpii.tests.dev.testKeyInList = function (item) {
    jqUnit.assertEquals("Item is 'Key In' List", "Key in ...", item.label);
    var submenu = item.submenu;
    jqUnit.assertValue("Item has submenu", submenu);
    jqUnit.assertEquals("Key in list has 11 items", 11, submenu.length);

    gpii.tests.app.testItem(submenu[0], "Larger 125%");
    gpii.tests.app.testItem(submenu[1], "Larger 150%");
    gpii.tests.app.testItem(submenu[2], "Larger 175%");
    gpii.tests.app.testItem(submenu[3], "Dark & Larger 125%");
    gpii.tests.app.testItem(submenu[4], "Dark & Larger 150%");
    gpii.tests.app.testItem(submenu[5], "Dark & Larger 175%");
    gpii.tests.app.testItem(submenu[6], "Read To Me");
    gpii.tests.app.testItem(submenu[7], "Magnifier 200%");
    gpii.tests.app.testItem(submenu[8], "Magnifier 400%");
    gpii.tests.app.testItem(submenu[9], "Magnifier 200% & Display Scaling 175%");
    gpii.tests.app.testItem(submenu[10], "Dark Magnifier 200%");
};

gpii.tests.dev.testMenu = function (menuTemplate) {
    gpii.tests.app.testTemplateExists(menuTemplate, 4);
    gpii.tests.app.testItem(menuTemplate[0], "Open PCP");
    gpii.tests.app.testItem(menuTemplate[1], "Not keyed in");
    gpii.tests.dev.testKeyInList(menuTemplate[2]);
    gpii.tests.app.testItem(menuTemplate[3], "Exit GPII");
};

gpii.tests.dev.testMenuSnapsetKeyedIn = function (menuTemplate) {
    gpii.tests.app.testTemplateExists(menuTemplate, 5);
    gpii.tests.app.testItem(menuTemplate[0], "Open PCP");
    gpii.tests.app.testSnapset_1aKeyedIn(menuTemplate[1], menuTemplate[2]);
    gpii.tests.dev.testKeyInList(menuTemplate[3]);
    gpii.tests.app.testItem(menuTemplate[4], "Exit GPII");
};

fluid.registerNamespace("gpii.tests.dev.testDefs");

// TODO: Should this derive from the above app tests?
gpii.tests.dev.testDefs = {
    name: "GPII application dev config integration tests",
    expect: 101,
    config: {
        configName: "app.dev",
        configPath: "configs"
    },
    gradeNames: ["gpii.test.common.testCaseHolder"],
    distributeOptions: {
        record: {
            funcName: "gpii.tests.app.receiveApp",
            args: ["{testCaseHolder}", "{arguments}.0"]
        },
        target: "{that flowManager gpii.app}.options.listeners.onCreate"
    },
    sequence: [{ // Test the menu that will be rendered
        event: "{that gpii.app.menu}.events.onCreate",
        listener: "gpii.tests.dev.testInitialMenu"
    }, { // Test menu after key in
        func: "{that}.app.keyIn",
        args: "snapset_1a"
    }, {
        changeEvent: "{that}.app.tray.menu.applier.modelChanged",
        path: "menuTemplate",
        listener: "gpii.tests.dev.testMenuSnapsetKeyedIn"
    }, { // Test menu after key out
        func: "{that}.app.keyOut",
        args: "snapset_1a"
    }, {
        changeEvent: "{that}.app.tray.menu.applier.modelChanged",
        path: "menuTemplate",
        listener: "gpii.tests.dev.testMenu"
    }]
};
