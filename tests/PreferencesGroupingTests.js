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

jqUnit.module("GPII Preferences Grouping Tests");

var groupingTemplate = [
    {
        "name": "UIO+",
        "solutionName": "UIO+",
        "settings": [
            {
                "path": "http://registry\\.gpii\\.net/applications/net\\.gpii\\.uioPlus.http://registry\\.gpii\\.net/common/supportTool"
            },
            {
                "path": "http://registry\\.gpii\\.net/applications/net\\.gpii\\.uioPlus.http://registry\\.gpii\\.net/common/highContrastEnabled",
                "settings": [
                    {
                        "path": "http://registry\\.gpii\\.net/applications/net\\.gpii\\.uioPlus.http://registry\\.gpii\\.net/common/highContrastTheme"
                    }
                ]
            }
        ]
    },
    {
        "name": "Magnifier",
        "solutionName": "Magnifier",
        "settings": [
            {
                "path": "http://registry\\.gpii\\.net/common/magnification"
            },
            {
                "path": "http://registry\\.gpii\\.net/common/magnifierPosition"
            }
        ]
    }
];

var emptyFixture = {
    "path":[],
    "type":"ADD"
};

var settingGroupsFixture = {
    "type":"modelChanged",
    "payload":{
        "path":[
        ],
        "type":"ADD",
        "value":{
            "userToken":"snapset_1a",
            "activeContextName":"gpii-default",
            "settingControls":{
                "http://registry\\.gpii\\.net/common/magnification":{
                    "value":2,
                    "solutionName": "Magnifier",
                    "schema":{
                        "title":"Magnification",
                        "description":"Level of magnification",
                        "type":"number",
                        "min":1,
                        "divisibleBy":0.1
                    }
                },
                "http://registry\\.gpii\\.net/common/DPIScale":{
                    "value":1.25,
                    "schema":{
                        "title":"DPI Scale",
                        "description":"DPI scale factor on default monitor",
                        "type":"number",
                        "min":1,
                        "max":2,
                        "divisibleBy":0.25
                    }
                },
                "http://registry\\.gpii\\.net/common/cursorSize":{
                    "value":1,
                    "schema":{
                        "title":"Cursor Size",
                        "description":"Cursor size",
                        "type":"number",
                        "min":0,
                        "max":1,
                        "divisibleBy":0.1
                    }
                },
                "http://registry\\.gpii\\.net/applications/net\\.gpii\\.uioPlus.http://registry\\.gpii\\.net/common/supportTool": {
                    "value": [
                        "dictionary"
                    ],
                    "solutionName": "UIO+",
                    "schema": {
                        "title": "Support Tools",
                        "description": "Whether to enable/disable certain support tools",
                        "type": "array",
                        "enum": [
                            "dictionary"
                        ]
                    }
                },
                "http://registry\\.gpii\\.net/applications/net\\.gpii\\.uioPlus.http://registry\\.gpii\\.net/common/highContrastEnabled": {
                    "value": true,
                    "solutionName": "UIO+",
                    "schema": {
                        "title": "High Contrast",
                        "description": "Whether to enable/disable High Contrast",
                        "type": "boolean"
                    }
                },
                "http://registry\\.gpii\\.net/applications/net\\.gpii\\.uioPlus.http://registry\\.gpii\\.net/common/highContrastTheme": {
                    "value": "white-black",
                    "solutionName": "UIO+",
                    "schema": {
                        "title": "High Contrast theme",
                        "description": "High Contrast Theme",
                        "type": "string",
                        "enum": [
                            "black-white",
                            "white-black",
                            "yellow-black",
                            "black-yellow"
                        ]
                    }
                }
            },
            "preferences":{
                "name":"Larger 125%",
                "contexts":{
                    "gpii-default":{
                        "name":"Default preferences"
                    }
                }
            }
        }
    }
};

var keyOutFixture = {
    "path":[],
    "value":null,
    "type":"DELETE"
};


jqUnit.test("Group message without settings", function () {
    jqUnit.expect(1);
    var channelMessage = gpii.app.dev.gpiiConnector.groupSettings(groupingTemplate, emptyFixture);
    jqUnit.assertFalse("Empty message does not have a value", channelMessage.value);
});

jqUnit.test("Group setting tests", function () {
    jqUnit.expect(13);

    var channelMessage = gpii.app.dev.gpiiConnector.groupSettings(groupingTemplate, settingGroupsFixture),
        payload = channelMessage.payload,
        value = payload.value,
        settingGroups = value.settingGroups;

    jqUnit.assertEquals("There are 3 setting groups in the modified message", 3, settingGroups.length);

    var defaultGroup = settingGroups[0];
    jqUnit.assertEquals("The default group contains 2 settings", 2, fluid.keys(defaultGroup.settingControls).length);

    var dpiScaleKey = "http://registry\\.gpii\\.net/common/DPIScale";
    jqUnit.assertLeftHand("The default group contains the DPI scale setting", {
        value: 1.25,
        schema: {
            title: "DPI Scale",
            description: "DPI scale factor on default monitor",
            type: "number",
            min: 1,
            max: 2,
            divisibleBy: 0.25
        }
    }, defaultGroup.settingControls[dpiScaleKey]);

    var cursorSizeKey = "http://registry\\.gpii\\.net/common/cursorSize";
    jqUnit.assertLeftHand("The default group contains the cursorSize setting", {
        value: 1,
        schema: {
            title: "Cursor Size",
            description: "Cursor size",
            type: "number",
            min: 0,
            max: 1,
            divisibleBy: 0.1
        }
    }, defaultGroup.settingControls[cursorSizeKey]);

    var uioPlusGroup = settingGroups[1];
    jqUnit.assertEquals("UIO+ group has correct name", "UIO+", uioPlusGroup.name);
    jqUnit.assertEquals("UIO+ group has correct solutionName", "UIO+", uioPlusGroup.solutionName);

    var uioPlusSupportToolKey = "http://registry\\.gpii\\.net/applications/net\\.gpii\\.uioPlus.http://registry\\.gpii\\.net/common/supportTool";
    jqUnit.assertLeftHand("UIO+ group contains the supportTool setting", {
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
    }, uioPlusGroup.settingControls[uioPlusSupportToolKey]);

    var uioPlusHighContrastEnabledKey = "http://registry\\.gpii\\.net/applications/net\\.gpii\\.uioPlus.http://registry\\.gpii\\.net/common/highContrastEnabled",
        uioPlusHighContrastEnabled = uioPlusGroup.settingControls[uioPlusHighContrastEnabledKey];
    jqUnit.assertLeftHand("UIO+ group contains the highContrastEnabled setting", {
        value: true,
        schema: {
            title: "High Contrast",
            description: "Whether to enable/disable High Contrast",
            type: "boolean"
        }
    }, uioPlusHighContrastEnabled);

    jqUnit.assertEquals("UIO+ high contrast enabled setting has one subsetting", 1, fluid.keys(uioPlusHighContrastEnabled.settingControls).length);

    var uioPlusHighContrastThemeKey = "http://registry\\.gpii\\.net/applications/net\\.gpii\\.uioPlus.http://registry\\.gpii\\.net/common/highContrastTheme";
    jqUnit.assertLeftHand("UIO+ group contains the highContrastTheme setting", {
        value: "white-black",
        schema: {
            title: "High Contrast theme",
            description: "High Contrast Theme",
            type: "string",
            enum: [
                "black-white",
                "white-black",
                "yellow-black",
                "black-yellow"
            ]
        }
    }, uioPlusHighContrastEnabled.settingControls[uioPlusHighContrastThemeKey]);

    var magnifierGroup = settingGroups[2];
    jqUnit.assertEquals("Magnifier group has correct name", "Magnifier", magnifierGroup.name);
    jqUnit.assertEquals("Magnifier group has correct solutionName", "Magnifier", magnifierGroup.solutionName);

    var maginificationKey = "http://registry\\.gpii\\.net/common/magnification";
    jqUnit.assertLeftHand("Magnifier group contains the Magnification setting", {
        value: 2,
        schema: {
            title: "Magnification",
            description: "Level of magnification",
            type: "number",
            min: 1,
            divisibleBy: 0.1
        }
    }, magnifierGroup.settingControls[maginificationKey]);
});

jqUnit.test("Group key out message", function () {
    jqUnit.expect(1);
    var channelMessage = gpii.app.dev.gpiiConnector.groupSettings(groupingTemplate, keyOutFixture);
    jqUnit.assertFalse("Key out message does not have a value", channelMessage.value);
});
