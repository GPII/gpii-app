/*!
GPII Application Tests
Copyright 2016 OCAD University

Licensed under the New BSD license. You may not use this file except in
compliance with this License.
The research leading to these results has received funding from the European Union's
Seventh Framework Programme (FP7/2007-2013) under grant agreement no. 289016.
You may obtain a copy of the License at
https://github.com/GPII/universal/blob/master/LICENSE.txt
*/
/* eslint-env node */
"use strict";

var fluid = require("infusion");
var gpii = fluid.registerNamespace("gpii");
var jqUnit = fluid.require("node-jqunit");

require("../src/app.js");

jqUnit.module("GPII Application Main Tests");

// jqUnit.asyncTest("Testing App", function () {
//     jqUnit.expect(3);
//
//     var testApp = gpii.app({model: {keyedInSet: 'hc'}, invokers: });
//     jqUnit.assertNotNull("The test app was created", testApp);
//     jqUnit.assertEquals("hc was set through the options", 'hc', testApp.model.keyedInSet);
//
//
// // gpii started
//
// //keyedInSet
//
//
// // startLocalFlowManager
//
//
//  // changeStarted
//
//  // key in
//
//
//  // key out
//
//
//
// });

jqUnit.test("Menu.getExit", function () {
    jqUnit.expect(4);

    var exitStr = "Exit GPII",
        exitObj = gpii.app.menu.getExit(false, exitStr);
    jqUnit.assertFalse("Exit object is not created when app is not elevated", exitObj);

    exitObj = gpii.app.menu.getExit(true, exitStr);
    jqUnit.assertTrue("Exit object exists", exitObj);
    jqUnit.assertEquals("Exit is bound to onClick", "onExit", exitObj.click);
    jqUnit.assertEquals("Label is set in the exit object", exitStr, exitObj.label);
});
