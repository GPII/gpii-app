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
gpii.tests.app.testInitialMenuRender = function (menu) {
    var menuTemplate = menu.model.menuTemplate;
    gpii.tests.app.testMenuRender(menuTemplate);
};

gpii.tests.app.testMenuRender = function (menuTemplate) {
    jqUnit.assertValue("The menu template was created", menuTemplate);
    jqUnit.assertEquals("There is one item in the menu", 1, menuTemplate.length);
    jqUnit.assertEquals("First item is 'Not Keyed In'", "Not keyed in", menuTemplate[0].label);
};

gpii.tests.app.testAliceKeyedIn = function (menuTemplate) {
    jqUnit.assertValue("The menu template exists", menuTemplate);
    jqUnit.assertEquals("There are two items in the menu", 2, menuTemplate.length);
    jqUnit.assertEquals("First item is who is keyed in", "Keyed in with Alice", menuTemplate[0].label);
    jqUnit.assertEquals("Second item is key out", "Key out Alice", menuTemplate[1].label);
};

gpii.tests.app.receiveApp = function (testCaseHolder, app) {
    testCaseHolder.app = app;
};

fluid.registerNamespace("gpii.tests.app.testDefs");

gpii.tests.app.testDefs = [{
    name: "GPII application integration tests",
    expect: 14,
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
        listener: "gpii.tests.app.testInitialMenuRender"
    }, { // Test menu after key in
        func: "{that}.app.keyIn",
        args: "alice"
    }, {
        changeEvent: "{that}.app.tray.menu.applier.modelChanged",
        path: "menuTemplate",
        listener: "gpii.tests.app.testAliceKeyedIn"
    }, { // Test key in attempt while someone is keyed in
        func: "{that}.app.keyIn",
        args: "sammy"
    }, {
        event: "{that flowManager kettle.request.http}.events.onError",
        listener: "gpii.tests.app.testAliceKeyedIn",
        args: ["{that}.app.tray.menu.model.menuTemplate"]
    }, { // Test menu after key out
        func: "{that}.app.keyOut",
        args: "alice"
    }, {
        changeEvent: "{that}.app.tray.menu.applier.modelChanged",
        path: "menuTemplate",
        listener: "gpii.tests.app.testMenuRender"
    }]
}];

fluid.registerNamespace("gpii.tests.dev");

// TODO: Test the dev config. How do I stop the server and restart it with a different config during tests?
gpii.tests.dev.testMenuRender = function () {
    jqUnit.assert("In Dev Tests");
};

fluid.registerNamespace("gpii.tests.dev.testDefs");

gpii.tests.dev.testDefs = [{
    name: "GPII application dev config integration tests",
    expect: 1,
    config: {
        configName: "app.dev",
        configPath: "configs"
    },
    gradeNames: ["gpii.test.common.testCaseHolder"],
    sequence: [{ // Test the menu that will be rendered
        event: "{that gpii.app.menu}.events.onCreate",
        listener: "gpii.tests.dev.testMenuRender"
    }]
}];
