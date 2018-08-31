/**
 * Site configuration handler tests
 * Copyright 2017 Raising the Floor - International
 *
 * Licensed under the New BSD license. You may not use this file except in
 * compliance with this License.
 * The research leading to these results has received funding from the European Union's
 * Seventh Framework Programme (FP7/2007-2013) under grant agreement no. 289016.
 * You may obtain a copy of the License at
 * https://github.com/GPII/universal/blob/master/LICENSE.txt
 */
"use strict";

var fluid = require("infusion"),
    gpii = fluid.registerNamespace("gpii");

fluid.registerNamespace("gpii.tests.siteConfigurationHandler");

gpii.tests.siteConfigurationHandler.testDefs = {
    name: "Site configuration handler options distributions integration tests",
    expect: 2,
    config: {
        configName: "gpii.tests.dev.config",
        configPath: "tests/configs"
    },
    distributeOptions: {
        useSiteConfigFixture: {
            record: "%gpii-app/tests/fixtures/siteconfigSaveHidden.json5",
            target: "{that siteConfigurationHandler}.options.siteConfigPath"
        }
    },
    gradeNames: ["gpii.test.common.testCaseHolder"],
    // Check correct options distributions
    sequence: [{ // once everything is created, check for options distribution
        funcName: "jqUnit.assertDeepEq",
        args: [
            "QSS disable save button setting should be distributed",
            ["save"],
            "{that}.app.qssWrapper.options.settingOptions.hiddenSettings"
        ]
    }, { // once everything is created, check for options distribution
        funcName: "jqUnit.assertDeepEq",
        args: [
            "QSS scale factor have been distributed",
            0.5,
            "{that}.app.qssWrapper.options.scaleFactor"
        ]
    }]
};
