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

jqUnit.test("Menu.getKeyedInLabel", function () {
    jqUnit.expect(3);

    var keyedIn = "Keyed in with %userTokenName";    // string template
    var notKeyedIn = "Not keyed in";

    jqUnit.assertEquals("No one is keyed in", notKeyedIn, gpii.app.menu.getKeyedInLabel("", keyedIn, notKeyedIn));
    jqUnit.assertEquals("Alice is keyed in", fluid.stringTemplate(keyedIn, {"userTokenName": "Alice"}),
        gpii.app.menu.getKeyedInLabel("Alice", keyedIn, notKeyedIn));
    jqUnit.assertEquals("1234 is keyed in", fluid.stringTemplate(keyedIn, {"userTokenName": "1234"}),
        gpii.app.menu.getKeyedInLabel("1234", keyedIn, notKeyedIn));

});

jqUnit.test("Menu.getKeyOut", function () {
    jqUnit.expect(5);
    var token = "alice";
    var name = "Alice";
    var strTemp = "Key out %userTokenName";

    var keyOutObj = gpii.app.menu.getKeyOut();
    jqUnit.assertFalse("Key out object is not created when no token is provided.", keyOutObj);

    keyOutObj = gpii.app.menu.getKeyOut(token, name, strTemp);
    jqUnit.assertTrue("Key out object exists", keyOutObj);
    jqUnit.assertEquals("Key out is bound to onClick", "onKeyOut", keyOutObj.click);
    jqUnit.assertEquals("Token is set in the key out object", token, keyOutObj.token);
    jqUnit.assertEquals("Label is set in the key out object", "Key out Alice", keyOutObj.label);

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
