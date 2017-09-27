/*!
GPII Application Tests
Copyright 2017 OCAD University

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
fluid.loadTestingSupport();
var jqUnit = fluid.require("node-jqunit");

require("../src/app.js");

jqUnit.module("GPII Application Tests");

// Unit test the functions in gpii.app.menu

jqUnit.test("Menu.getUserName", function () {
    jqUnit.expect(4);

    jqUnit.assertEquals("Generated name is empty when no name provided.", "", gpii.app.menu.getUserName());
    jqUnit.assertEquals("Generated name is empty when no name provided.", "", gpii.app.menu.getUserName(""));
    jqUnit.assertEquals("Name should be capitilized.", "Alice", gpii.app.menu.getUserName("alice"));
    jqUnit.assertEquals("No change in name when token is numeric.", "1234", gpii.app.menu.getUserName("1234"));
});

jqUnit.test("Menu.getKeyedInUser", function () {
    jqUnit.expect(4);

    var token = "alice";
    var name = "Alice";
    var keyedInStrTemp = "Keyed in with %userTokenName";    // string template

    var keyedInUserObject = gpii.app.menu.getKeyedInUser(null, null, keyedInStrTemp);
    jqUnit.assertFalse("Keyed in user object is not created when no token is provided.", keyedInUserObject);

    keyedInUserObject = gpii.app.menu.getKeyedInUser(token, name, keyedInStrTemp);
    jqUnit.assertTrue("Keyed in user object is created when there is a token", keyedInUserObject);
    jqUnit.assertFalse("Keyed in user object is disabled", keyedInUserObject.enabled);
    jqUnit.assertEquals("Label is set in the keyed in user object",
        fluid.stringTemplate(keyedInStrTemp, {"userTokenName": name}), keyedInUserObject.label);
});

jqUnit.test("Menu.getKeyOut", function () {
    jqUnit.expect(7);
    var token = "alice";
    var keyOutStr = "Key-out of GPII";
    var notKeyedInStr = "(No one keyed in)";

    var keyOutObj = gpii.app.menu.getKeyOut(null, keyOutStr, notKeyedInStr);
    jqUnit.assertEquals("Label is set in the key out object when there is no user",
        notKeyedInStr, keyOutObj.label);
    jqUnit.assertFalse("Key out object is disabled when no token is provided.", keyOutObj.enabled);

    keyOutObj = gpii.app.menu.getKeyOut(token, keyOutStr, notKeyedInStr);
    jqUnit.assertTrue("Key out object exists", keyOutObj);
    jqUnit.assertTrue("Key out object is enabled when a token is provided", keyOutObj.enabled);
    jqUnit.assertEquals("Key out is bound to onClick", "onKeyOut", keyOutObj.click);
    jqUnit.assertEquals("Token is set in the key out object", token, keyOutObj.token);
    jqUnit.assertEquals("Label is set in the key out object", keyOutStr, keyOutObj.label);

});

var item1 = {label: "Item 1", enabled: false};
var item2 = {label: "Item 2"};
var item3 = {label: "Item 3", click: "onKeyIn", token: "3"};
var submenu = {label: "submenu", submenu: [item3]};

jqUnit.test("Menu.expandMenuTemplate", function () {
    jqUnit.expect(3);
    var menuTemplate = gpii.app.menu.generateMenuTemplate(item1, item2, submenu);
    jqUnit.assertEquals("There are 3 items in the menuTemplate after generation", 3, menuTemplate.length);

    menuTemplate = gpii.app.menu.expandMenuTemplate(menuTemplate);
    jqUnit.assertEquals("There are 3 items in the menuTemplate after expansion", 3, menuTemplate.length);
    jqUnit.assertEquals("The click string has been expanded into a function", "function", typeof menuTemplate[2].submenu[0].click);

});
