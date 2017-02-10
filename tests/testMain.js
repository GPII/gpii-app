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
var jqUnit = fluid.require("node-jqunit");

require("../src/app.js");

jqUnit.module("GPII Application Main Tests");

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
