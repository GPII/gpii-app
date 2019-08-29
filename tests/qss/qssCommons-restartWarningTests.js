/*
 * GPII Sequential Dialogs Integration Test Definitions
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

var fluid = require("infusion");
var gpii  = fluid.registerNamespace("gpii");

fluid.registerNamespace("gpii.tests.qss.restartWarningTests");

gpii.tests.qss.restartWarningTests = [
    { // Simulate language change
        func: "{that}.app.qssWrapper.alterSetting",
        args: [{
            path: "http://registry\\.gpii\\.net/common/language",
            value: "ko-KR"
        }]
    }, { // restart warning is shown
        funcName: "jqUnit.assertTrue",
        args: [
            "Restart warning notification is shown",
            "{that}.app.qssWrapper.qssNotification.model.isShown"
        ]
    }, { // bring everything back to normal
        func: "{that}.app.resetAllToStandard"
    }, { // restart warning is not shown
        funcName: "jqUnit.assertFalse",
        args: [
            "Restart warning notification is shown only one time per session",
            "{that}.app.qssWrapper.qssNotification.model.isShown"
        ]
    },
];