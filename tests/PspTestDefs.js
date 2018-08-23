/*
 * PSP Test Definitions
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
    gpii = fluid.registerNamespace("gpii"),
    jqUnit = fluid.require("node-jqunit");

require("../src/main/app.js");
require("./testUtils.js");

fluid.registerNamespace("gpii.tests.psp.testDefs");

var clickCloseBtn = "jQuery(\".flc-closeBtn\").click()",
    clickKeyOutBtn = "jQuery(\".flc-keyOutBtn\").click()",
    clickDecreaseVolumeBtn = "jQuery(\".flc-setting:eq(0) .flc-textfieldStepper-decrease\").click()",
    selectBrightPrefSet = "jQuery(\".flc-prefSetPicker .dropdown-toggle\").click(); jQuery(\".flc-imageDropdown-menu .flc-imageDropdown-item:nth-child(2)\").click()";

gpii.tests.psp.testKeyedOut = function (psp) {
    jqUnit.assertFalse("The PSP is not shown when the user is keyed out", psp.model.isShown);
    jqUnit.assertFalse("There is no keyed in user when the user keys out", psp.model.isKeyedIn);
};

/**
 * When a person uses the GPII app, the only way for him to open the PSP will be by
 * pressing the "Sign in" button in the QSS. However, in order to simplify the
 * testing of the PSP, we would directly call functions of the PSP component. This
 * will not affect the accuracy of the tests.
 */
gpii.tests.psp.testDefs = {
    name: "PSP integration tests",
    // expect: 1,
    config: {
        configName: "gpii.tests.dev.config",
        configPath: "tests/configs"
    },
    gradeNames: ["gpii.test.common.testCaseHolder"],
    sequence: [{
        func: "{that}.app.psp.show"
    }, { // Clicking the close button in the PSP...
        func: "gpii.test.executeCommand",
        args: [
            "{that}.app.psp.dialog",
            clickCloseBtn
        ]
    }, { // ... results in the error dialog being hidden.
        event: "{that}.app.psp.events.onClosed",
        listener: "jqUnit.assertFalse",
        args: [
            "The PSP is closed when its close button is clicked",
            "{that}.app.psp.model.isShown"
        ]
    }, {
        func: "{that}.app.psp.show"
    }, {
        func: "{that}.app.keyIn",
        args: ["multi_context"]
    }, {
        task: "gpii.test.executeCommandDelayed",
        args: [
            "{that}.app.psp.dialog",
            clickDecreaseVolumeBtn,
            2000
        ],
        resolve: "fluid.identity"
    }, {
        event: "{that}.app.psp.events.onSettingAltered",
        listener: "jqUnit.assertLeftHand",
        args: [
            "When the decrease volume button is pressed, the PSP is notified accordingly",
            {
                path: "http://registry\\.gpii\\.net/common/volume",
                value: 0
            },
            "{arguments}.0"
        ]
    }, {
        task: "gpii.test.executeCommand",
        args: [
            "{that}.app.psp.dialog",
            selectBrightPrefSet
        ],
        resolve: "fluid.identity"
    }, {
        event: "{that}.app.psp.events.onActivePreferenceSetAltered",
        listener: "jqUnit.assertEquals",
        args: [
            "The new selected preference set is correct",
            "bright",
            "{arguments}.0"
        ]
    }, {
        func: "gpii.test.executeCommand",
        args: [
            "{that}.app.psp.dialog",
            clickKeyOutBtn
        ]
    }, {
        changeEvent: "{that}.app.applier.modelChanged",
        path: "isKeyedIn",
        listener: "gpii.tests.psp.testKeyedOut",
        args: ["{that}.app.psp"]
    }]
};
