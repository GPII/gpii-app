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
    jqUnit.assertEquals("There are two items in the menu", 2, menuTemplate.length);
    jqUnit.assertEquals("First item is 'Not Keyed In'", "Not keyed in", menuTemplate[0].label);
    jqUnit.assertEquals("Second item is 'Exit GPII'", "Exit GPII", menuTemplate[1].label);
};

gpii.tests.app.testKeyInAlice = function (menuTemplate) {
    jqUnit.assertValue("The menu template exists", menuTemplate);
    jqUnit.assertEquals("There are three items in the menu", 3, menuTemplate.length);
    jqUnit.assertEquals("First item is who is keyed in", "Keyed in with Alice", menuTemplate[0].label);
    jqUnit.assertEquals("Second item is key out", "Key out Alice", menuTemplate[1].label);
    jqUnit.assertEquals("Third item is 'Exit GPII'", "Exit GPII", menuTemplate[2].label);
};

gpii.tests.app.testFailToKeyInSammy = function () {
    console.log("=================== Got the key in when someone is keyed in error.");
};

gpii.tests.app.testExit = function () {
    console.log("=================== In Exit");
};

fluid.registerNamespace("gpii.tests.app.testDefs");

gpii.tests.app.testDefs = [{
    name: "GPII application integration tests",
    expect: 13,
    config: {
        configName: "app",
        configPath: "configs"
    },
    gradeNames: ["gpii.test.common.testCaseHolder"],
    members: {
        app: "{that gpii.app}"
    },
    sequence: [{ // Test the menu that will be rendered
        event: "{that gpii.app.menu}.events.onCreate",
        listener: "gpii.tests.app.testInitialMenuRender"
    }, { // Test menu after key in
        func: "{configuration}.server.flowManager.app.keyIn",
        args: "alice"
    }, {
        changeEvent: "{configuration}.server.flowManager.app.tray.menu.applier.modelChanged",
        path: "menuTemplate",
        listener: "gpii.tests.app.testKeyInAlice"
    // }, { // Test key in attempt while someone is keyed in
    //     func: "{configuration}.server.flowManager.app.keyIn",
    //     args: "sammy"
    // }, {
    //     func: "console.log", // attempt to figure out what to listen to
    //     args: ["++++++++++++++++++", "{configuration}.server.flowManager.requests.request", "++++++++++++++++++"]
    // }, { // TODO: This never catches - just hangs - am I listening to the wrong thing?
    //    event: "{configuration}.server.flowManager.requests.request.events.onError",
    //    listener: "gpii.tests.app.testFailToKeyInSammy"
    }, { // Test menu after key out
        func: "{configuration}.server.flowManager.app.keyOut",
        args: "alice"
    }, {
        changeEvent: "{configuration}.server.flowManager.app.tray.menu.applier.modelChanged",
        path: "menuTemplate",
        listener: "gpii.tests.app.testMenuRender"
   // }, { // TODO: Test exit - not getting the test results printed - is this exit actually stopping the tests?
   //     func: "{configuration}.server.flowManager.app.exit"
   // }, {
   //     event: "{configuration}.server.flowManager.app.events.onAppQuit",
   //     listener: "gpii.tests.app.testExit"
    }]
}];
