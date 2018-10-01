/**
 * PSP Preferences Parsing Tests
 *
 * Unit tests for whether the PSP parses correctly the settings payloads sent to it
 * by the GPII API when the user keys in/out.
 * Copyright 2017 Raising the Floor - International
 *
 * Licensed under the New BSD license. You may not use this file except in
 * compliance with this License.
 * The research leading to these results has received funding from the European Union's
 * Seventh Framework Programme (FP7/2007-2013) under grant agreement no. 289016.
 * You may obtain a copy of the License at
 * https://github.com/GPII/universal/blob/master/LICENSE.txt
 */
/* eslint-env node */
"use strict";

var fluid = require("infusion");
var gpii = fluid.registerNamespace("gpii");
fluid.loadTestingSupport();
var jqUnit = fluid.require("node-jqunit");

require("../src/main/app.js");
fluid.registerNamespace("gpii.tests.app");

jqUnit.module("GPII Preferences Parsing Tests");

var emptyFixture = {
    "path":[],
    "type":"ADD"
};

var multiPrefSetsFixture = {
    "path":[],
    "type":"ADD",
    "value":{
        "userToken":"context1",
        "activeContextName":"gpii-default",
        "settingGroups": [
            {
                "solutionName": "Magnifier",
                "settingControls": {
                    "http://registry\\.gpii\\.net/common/magnifierEnabled":{
                        "value":true,
                        "schema":{
                            "title":"Magnifier",
                            "description":"Magnifier",
                            "type":"boolean"
                        },
                        "settingControls": {
                            "http://registry\\.gpii\\.net/common/magnification":{
                                "value":2,
                                "schema":{
                                    "title":"Magnification",
                                    "description":"Level of magnification",
                                    "type":"number",
                                    "min":1,
                                    "divisibleBy":0.1
                                }
                            },
                            "http://registry\\.gpii\\.net/common/magnifierPosition":{
                                "value":"Lens",
                                "schema":{
                                    "title":"Position",
                                    "description":"Position of the magnified area",
                                    "type":"string",
                                    "enum":[
                                        "FullScreen",
                                        "Lens",
                                        "LeftHalf",
                                        "RightHalf",
                                        "TopHalf",
                                        "BottomHalf",
                                        "Custom"
                                    ]
                                }
                            }
                        }
                    }
                }
            },
            {
                "name": "UIO+",
                "solutionName": "UIO+",
                "settingControls": {
                    "http://registry\\.gpii\\.net/applications/net\\.gpii\\.uioPlus.http://registry\\.gpii\\.net/common/supportTool":{
                        "value":[
                            "dictionary"
                        ],
                        "schema":{
                            "title":"Support Tools",
                            "description":"Whether to enable/disable certain support tools",
                            "type":"array",
                            "enum":[
                                "dictionary"
                            ]
                        }
                    },
                    "http://registry\\.gpii\\.net/applications/net\\.gpii\\.uioPlus.http://registry\\.gpii\\.net/common/highContrastEnabled":{
                        "value":true,
                        "schema":{
                            "title":"High Contrast",
                            "description":"Whether to enable/disable High Contrast",
                            "type":"boolean"
                        }
                    },
                    "http://registry\\.gpii\\.net/applications/net\\.gpii\\.uioPlus.http://registry\\.gpii\\.net/common/highContrastTheme":{
                        "value":"white-black",
                        "schema":{
                            "title":"High Contrast theme",
                            "description":"High Contrast Theme",
                            "type":"string",
                            "enum":[
                                "black-white",
                                "white-black",
                                "yellow-black",
                                "black-yellow"
                            ]
                        }
                    }
                }
            }
        ],
        "preferences":{
            "contexts":{
                "gpii-default":{
                    "name":"Default preferences"
                },
                "bright":{
                    "name":"bright"
                },
                "noise":{
                    "name":"noise"
                },
                "brightandnoise":{
                    "name":"bright and noise"
                }
            }
        },
        "gpiiAppShortcut": "Shift+Alt+Super+M"
    }
};

var keyOutFixture = {
    "path":[],
    "value":null,
    "type":"DELETE"
};

var defaultGpiiAppShortcut = "Shift+CmdOrCtrl+Alt+Super+M";

jqUnit.test("Parse empty message", function () {
    jqUnit.expect(4);

    var preferences = gpii.app.extractPreferencesData(emptyFixture, defaultGpiiAppShortcut);

    jqUnit.assertDeepEq("There are no preference sets", [], preferences.sets);
    jqUnit.assertFalse("There is no active preference set", preferences.activeSet);
    jqUnit.assertDeepEq("There are no settings", [], preferences.settingGroups);

    jqUnit.assertEquals("The global shortcut for opening the GPII app is the default one",
        defaultGpiiAppShortcut,
        preferences.gpiiAppShortcut
    );
});

jqUnit.test("Parse multiple preference sets message", function () {
    jqUnit.expect(17);

    var preferences = gpii.app.extractPreferencesData(multiPrefSetsFixture, defaultGpiiAppShortcut);

    jqUnit.assertDeepEq("Preference sets are parsed correctly", [
        {path: "gpii-default", name: "Default preferences"},
        {path: "bright", name: "bright"},
        {path: "noise", name: "noise"},
        {path: "brightandnoise", name: "bright and noise"}
    ], preferences.sets);

    jqUnit.assertEquals("Active preference set is parsed correctly", "gpii-default", preferences.activeSet);
    jqUnit.assertEquals("There are 2 setting groups in the active set", 2, preferences.settingGroups.length);

    // Magnifier group tests
    var magnifierGroup = preferences.settingGroups[0],
        magnifierEnabledSetting = magnifierGroup.settings[0];

    jqUnit.assertFalse("Magnifier group does not have a name", magnifierGroup.name);
    jqUnit.assertEquals("Maginifier group has correct solution name", "Magnifier", magnifierGroup.solutionName);
    jqUnit.assertEquals("Magnifier group has one top level setting", 1, magnifierGroup.settings.length);

    jqUnit.assertLeftHand("Maginifier enabled setting (type: boolean) is correctly parsed", {
        path: "http://registry\\.gpii\\.net/common/magnifierEnabled",
        value: true,
        schema: {
            title: "Magnifier",
            description: "Magnifier",
            type: "boolean"
        }
    }, magnifierEnabledSetting);

    jqUnit.assertEquals("There are 2 subsettings for the magnifier enabled setting", 2, magnifierEnabledSetting.settings.length);

    jqUnit.assertLeftHand("Maginification subsetting (type: number) is correctly parsed", {
        path: "http://registry\\.gpii\\.net/common/magnification",
        value: 2,
        schema: {
            title: "Magnification",
            description: "Level of magnification",
            type: "number",
            min: 1,
            divisibleBy: 0.1
        }
    }, magnifierEnabledSetting.settings[0]);

    jqUnit.assertLeftHand("Position subsetting (type: string) is correctly parsed", {
        path: "http://registry\\.gpii\\.net/common/magnifierPosition",
        value: "Lens",
        schema: {
            title: "Position",
            description: "Position of the magnified area",
            type: "string",
            enum: ["FullScreen", "Lens", "LeftHalf", "RightHalf", "TopHalf", "BottomHalf", "Custom"]
        }
    }, magnifierEnabledSetting.settings[1]);

    // UIO+ group tests
    var uioPlusGroup = preferences.settingGroups[1];

    jqUnit.assertEquals("UIO+ group has a correct name", "UIO+", uioPlusGroup.name);
    jqUnit.assertEquals("UIO+ group has correct solution name", "UIO+", uioPlusGroup.solutionName);
    jqUnit.assertEquals("UIO+ group has 3 top level settings", 3, uioPlusGroup.settings.length);

    jqUnit.assertLeftHand("Support tools setting (type: array) is correctly parsed", {
        path: "http://registry\\.gpii\\.net/applications/net\\.gpii\\.uioPlus.http://registry\\.gpii\\.net/common/supportTool",
        value: [
            "dictionary"
        ],
        schema: {
            title: "Support Tools",
            description: "Whether to enable/disable certain support tools",
            type: "array",
            enum: [
                "dictionary"
            ]
        }
    }, uioPlusGroup.settings[0]);

    jqUnit.assertLeftHand("UIO+: High Contrast setting (type: boolean) is correctly parsed", {
        path: "http://registry\\.gpii\\.net/applications/net\\.gpii\\.uioPlus.http://registry\\.gpii\\.net/common/highContrastEnabled",
        value: true,
        schema: {
            title: "High Contrast",
            description: "Whether to enable/disable High Contrast",
            type: "boolean"
        }
    }, uioPlusGroup.settings[1]);

    jqUnit.assertLeftHand("UIO+: High Contrast theme setting (type: string) is correctly parsed", {
        path: "http://registry\\.gpii\\.net/applications/net\\.gpii\\.uioPlus.http://registry\\.gpii\\.net/common/highContrastTheme",
        value: "white-black",
        schema: {
            title: "High Contrast theme",
            description: "High Contrast Theme",
            type: "string",
            enum: ["black-white", "white-black", "yellow-black", "black-yellow"]
        }
    }, uioPlusGroup.settings[2]);

    jqUnit.assertEquals(
        "The global shortcut for opening the GPII app is the one defined by the user's preferences",
        "Shift+Alt+Super+M",
        preferences.gpiiAppShortcut
    );
});

jqUnit.test("Parse key out message", function () {
    jqUnit.expect(4);

    var preferences = gpii.app.extractPreferencesData(keyOutFixture, defaultGpiiAppShortcut);

    jqUnit.assertDeepEq("There are no preference sets", [], preferences.sets);
    jqUnit.assertFalse("There is no active preference set", preferences.activeSet);
    jqUnit.assertDeepEq("There are no settings", [], preferences.settingGroups);

    jqUnit.assertEquals("The global shortcut for opening the GPII app is the default one",
        defaultGpiiAppShortcut,
        preferences.gpiiAppShortcut
    );
});
