/*!
GPII Preferences Parsing Tests
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
        "settingControls":{  
           "http://registry\\.gpii\\.net/common/magnification":{  
                "value":1.5,
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
                    "title":"Magnifier position",
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
            },
            "http://registry\\.gpii\\.net/applications/com\\.microsoft\\.windows\\.highContrast.http://registry\\.gpii\\.net/common/highContrastEnabled":{  
                "value":true,
                "schema":{  
                    "title":"High Contrast",
                    "description":"Whether to enable/disable High Contrast",
                    "type":"boolean"
                },
                "solutionName":"Windows High Contrast"
            },
            "http://registry\\.gpii\\.net/common/tracking":{  
                "value":[
                    "mouse",
                    "caret"
                ],
                "schema":{  
                    "title":"Tracking",
                    "description":"Tracking mode of the screen magnifier",
                    "type":"array",
                    "enum":[  
                        "mouse",
                        "caret",
                        "focus"
                    ]
                }
            }
        },
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
        }
    }
};

var keyOutFixture = {
    "path":[],
    "value":null,
    "type":"DELETE"
};

jqUnit.test("Parse empty message", function () {
    jqUnit.expect(3);

    var preferences = gpii.app.extractPreferencesData(emptyFixture);

    jqUnit.assertDeepEq("There are no preference sets", [], preferences.sets);
    jqUnit.assertFalse("There is no active preference set", preferences.activeSet);
    jqUnit.assertDeepEq("There are no settings", [], preferences.settings);
});

jqUnit.test("Parse multiple preference sets message", function () {
    jqUnit.expect(7);

    var preferences = gpii.app.extractPreferencesData(multiPrefSetsFixture);

    jqUnit.assertDeepEq("Preference sets are parsed correctly", [
        {path: "gpii-default", name: "Default preferences"},
        {path: "bright", name: "bright"},
        {path: "noise", name: "noise"},
        {path: "brightandnoise", name: "bright and noise"}
    ], preferences.sets);

    jqUnit.assertEquals("Active preference set is parsed correctly", "gpii-default", preferences.activeSet);
    jqUnit.assertEquals("There are 4 settings in the active set", 4, preferences.settings.length);

    jqUnit.assertLeftHand("Slider (number) setting is correctly parsed", {
        path: 'http://registry\\.gpii\\.net/common/magnification',
        value: 1.5,
        title: 'Magnification',
        description: 'Level of magnification',
        type: 'number',
        min: 1,
        divisibleBy: 0.1
    }, preferences.settings[0]);

    jqUnit.assertLeftHand("Dropdown (string) setting is correctly parsed", {
        path: 'http://registry\\.gpii\\.net/common/magnifierPosition',
        value: 'Lens',
        title: 'Magnifier position',
        description: 'Position of the magnified area',
        type: 'string',
        values: ["FullScreen", "Lens", "LeftHalf", "RightHalf", "TopHalf", "BottomHalf", "Custom"]
    }, preferences.settings[1]);

    jqUnit.assertLeftHand("Switch (boolean) setting is correctly parsed", {
        path: 'http://registry\\.gpii\\.net/applications/com\\.microsoft\\.windows\\.highContrast.http://registry\\.gpii\\.net/common/highContrastEnabled',
        value: true,
        solutionName: 'Windows High Contrast',
        title: 'High Contrast',
        description: 'Whether to enable/disable High Contrast',
        type: 'boolean',
    }, preferences.settings[2]);

    jqUnit.assertLeftHand("Multipicker (array) setting is correctly parsed", {
        path: 'http://registry\\.gpii\\.net/common/tracking',
        value: ["mouse", "caret"],
        title: 'Tracking',
        description: 'Tracking mode of the screen magnifier',
        type: 'array',
        values: ["mouse", "caret", "focus"]
    }, preferences.settings[3]);
});

jqUnit.test("Parse key out message", function () {
    jqUnit.expect(3);

    var preferences = gpii.app.extractPreferencesData(keyOutFixture);

    jqUnit.assertDeepEq("There are no preference sets", [], preferences.sets);
    jqUnit.assertFalse("There is no active preference set", preferences.activeSet);
    jqUnit.assertDeepEq("There are no settings", [], preferences.settings);
});
