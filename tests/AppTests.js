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

require("../src/main/app.js");
fluid.registerNamespace("gpii.tests.app");

jqUnit.module("GPII Application Tests");

// Unit test the functions in gpii.app.menu

var prefSet1 = {
        path: "a",
        name: "not used"
    },
    prefSet2 = {
        path: "b",
        name: "used"
    },
    emptyPrefSets = {
        sets: [],
        activeSet: null
    },
    keyedInPrefSets = {
        sets: [prefSet1, prefSet2],
        activeSet: prefSet2.path
    };


jqUnit.test("Tray.getTrayTooltip", function () {
    var tooltips = {
        pendingChanges: "There are pending changes",
        defaultTooltip: "(No one keyed in)"
    };

    jqUnit.expect(3);

    jqUnit.assertEquals("The tooltip is default when user is not keyedIn",
        tooltips.defaultTooltip,
        gpii.app.getTrayTooltip(emptyPrefSets, [], tooltips)
    );

    jqUnit.assertEquals("The tooltip is active pref set name when user is keyed in and there is no pending setting change",
        prefSet2.name,
        gpii.app.getTrayTooltip(keyedInPrefSets, [], tooltips)
    );

    var pendingChanges = [{
        path: "magnification",
        value: "2",
        oldValue: "1.5"
    }];
    jqUnit.assertEquals("The tooltip indicates there are pending changes when such are indeed present",
        tooltips.pendingChanges,
        gpii.app.getTrayTooltip(keyedInPrefSets, pendingChanges, tooltips)
    );
});

jqUnit.test("Tray.getTrayIcon", function () {
    var icons = {
        pendingChanges: "pendingChangesIcon",
        keyedIn: "keyedInIcon",
        keyedOut: "keyedOutIcon"
    };

    jqUnit.expect(3);

    jqUnit.assertEquals("Tray icon is keyedOut icon when there is no keyed in user",
        icons.keyedOut,
        gpii.app.getTrayIcon(null, [], icons)
    );

    var keyedInUserToken = "alice";
    jqUnit.assertEquals("Tray icon is keyedIn icon when user is keyed in and there is no pending setting change",
        icons.keyedIn,
        gpii.app.getTrayIcon(keyedInUserToken, [], icons)
    );

    var pendingChanges = [{
        path: "magnification",
        value: "2",
        oldValue: "1.5"
    }];
    jqUnit.assertEquals("Tray icon is pendingChanges icon when there are pending changes present",
        icons.pendingChanges,
        gpii.app.getTrayIcon(keyedInUserToken, pendingChanges, icons)
    );
});

jqUnit.test("Menu.getShowPSP", function () {
    jqUnit.expect(6);

    var showPSPEvent = "onPSP",
        showPSPLabel = "Open PSP",
        showPSPObj = gpii.app.menu.getShowPSP(null, showPSPLabel);

    jqUnit.assertTrue("Show PSP object exists when there is no user", showPSPObj);
    jqUnit.assertEquals("Show PSP is bound to onClick when there is no user", showPSPEvent, showPSPObj.click);
    jqUnit.assertEquals("Label is set in the show PSP object when there is no user", showPSPLabel, showPSPObj.label);

    showPSPObj = gpii.app.menu.getShowPSP("alice", showPSPLabel);
    jqUnit.assertTrue("Show PSP object exists when there is user", showPSPObj);
    jqUnit.assertEquals("Show PSP is bound to onClick when there is user", showPSPEvent, showPSPObj.click);
    jqUnit.assertEquals("Label is set in the show PSP object when there is user", showPSPLabel, showPSPObj.label);
});

gpii.tests.app.testPrefSetMenuItem = function (item, label, checked) {
    var prefSetMenuItemEvent = "onActivePrefSetUpdate";
    jqUnit.assertEquals("Pref set menu item has proper click handler", prefSetMenuItemEvent, item.click);

    var prefSetMenuType = "radio";
    jqUnit.assertEquals("Pref set menu item has proper type", prefSetMenuType, item.type);

    jqUnit.assertEquals("Pref set menu item has proper label", label, item.label);
    jqUnit.assertEquals("Pref set menu item has proper (un)checked state", checked, item.checked);
};

jqUnit.test("Menu.getPreferenceSetsMenuItems", function () {
    var emptyPrefSetList = gpii.app.menu.getPreferenceSetsMenuItems([], null);
    var prefSetList = gpii.app.menu.getPreferenceSetsMenuItems(keyedInPrefSets.sets, prefSet2.path);

    jqUnit.expect(10);

    jqUnit.assertEquals("Pref set menu items list is empty", 0, emptyPrefSetList.length);
    // Note: +2 for separators
    jqUnit.assertEquals("Pref set menu items list", 4, prefSetList.length);

    gpii.tests.app.testPrefSetMenuItem(prefSetList[1], keyedInPrefSets.sets[0].name, false);
    gpii.tests.app.testPrefSetMenuItem(prefSetList[2], keyedInPrefSets.sets[1].name, true);
});

jqUnit.test("Menu.getKeyedInSnapset", function () {
    jqUnit.expect(4);

    var token = "alice";
    var snapsetName = "Snapset_1";
    var keyedInStrTemp = "Keyed in with %snapsetName";    // string template

    var keyedInObject = gpii.app.menu.getKeyedInSnapset(null, null, keyedInStrTemp);
    jqUnit.assertFalse("Keyed in user object is not created when no token is provided.", keyedInObject);

    keyedInObject = gpii.app.menu.getKeyedInSnapset(token, snapsetName, keyedInStrTemp);
    jqUnit.assertTrue("Keyed in user object is created when there is a token", keyedInObject);
    jqUnit.assertFalse("Keyed in user object is disabled", keyedInObject.enabled);
    jqUnit.assertEquals("Label is set in the keyed in user object",
        fluid.stringTemplate(keyedInStrTemp, {"snapsetName": snapsetName}), keyedInObject.label);
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
    jqUnit.assertEquals("Token is set in the key out object", token, keyOutObj.args.token);
    jqUnit.assertEquals("Label is set in the key out object", keyOutStr, keyOutObj.label);

});

var item1 = {label: "Item 1", enabled: false};
var item2 = {label: "Item 2"};
var item3 = {label: "Item 3", click: "onKeyIn", args: {token: "3"}};
var submenu = {label: "submenu", submenu: [item3]};

jqUnit.test("Menu.expandMenuTemplate", function () {
    jqUnit.expect(4);

    // A mocked event
    var events = {
        onKeyIn: {
            fire: function (args) {
                jqUnit.assertEquals("Menu item was \"clicked\" with proper arguments", item3.args, args);
            }
        }
    };

    var menuTemplate = gpii.app.menu.generateMenuTemplate(item1, item2, submenu);
    jqUnit.assertEquals("There are 3 items in the menuTemplate after generation", 3, menuTemplate.length);

    menuTemplate = gpii.app.menu.expandMenuTemplate(menuTemplate, events);
    jqUnit.assertEquals("There are 3 items in the menuTemplate after expansion", 3, menuTemplate.length);
    jqUnit.assertEquals("The click string has been expanded into a function", "function", typeof menuTemplate[2].submenu[0].click);

    menuTemplate[2].submenu[0].click();
});
