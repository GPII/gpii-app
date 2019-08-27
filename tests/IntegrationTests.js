/**
 * PSP Integration Test Utilities
 *
 * Utilities for starting and running the PSP integration tests. Provide means for
 * prepending and appending necessary sequence elements to the test definitions and
 * for bootstraping the test application instance.
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

require("gpii-windows/index.js"); // loads gpii-universal as well

var fluid = require("infusion"),
    kettle = fluid.registerNamespace("kettle"),
    gpii = fluid.registerNamespace("gpii");

fluid.require("%gpii-universal/gpii/node_modules/testing");

gpii.loadTestingSupport();

require("./DialogManagerTestDefs.js");
require("./IntegrationTestDefs.js");
require("./qss/QssTestDefs.js");
require("./SequentialDialogsTestDefs.js");
require("./SettingsBrokerTestDefs.js");
require("./StorageTestDefs.js");
require("./SurveysConnectorTestDefs.js");
require("./SurveyTriggerManagerTestsDefs.js");
require("./ShortcutsManagerTestDefs.js");
require("./UserErrorsHandlerTestDefs.js");
require("./SiteConfigurationHandlerTestDefs.js");
require("./WebviewTestDefs.js");
require("./GpiiConnectorTestDefs.js");
require("./TimerTestDefs.js");

// TODO: Review this following CI run.
//fluid.setLogging(fluid.logLevel.FATAL);

fluid.registerNamespace("gpii.tests.app");

/*
 * Preceding items for every test sequence.
 */
gpii.tests.app.startSequence = [
    {
        // Fire our "combined startup" event to ensure that all services are set up in the correct order before the
        // tests are run.
        task:        "{testEnvironment}.startup",
        resolve:     "fluid.log",
        resolveArgs: ["Combined startup successful."]
    },
    {
        event: "{testEnvironment}.events.startupComplete",
        listener: "fluid.identity"
    }
];

/*
 * Items added after every test sequence.
 */
gpii.tests.app.endSequence = [];

/*
 * We might need to conditionally make some options distributions that should affect all test sequences.
 * Every test sequence specifies a configuration file to be used for creating the gpii-app.
 * As we can't easily change all test sequences configuration files to some containing desired distribution
 * we can use this property to do so.
 *
 * This is extremely useful in the case of coverage collecting for the renderer processes
 * as we need to distribute options only if we are running instrumented code (coverage data
 * is to be collected).
 */
gpii.tests.app.testsDistributions = {};


/**
 * Used to disable the system language listener and set a fixed language.
 */
fluid.defaults("gpii.tests.app.mockedSystemLanguageListener", {
    gradeNames: ["fluid.modelComponent"],

    model: {
        installedLanguages: {},
        configuredLanguage: "en-US"
    }
});

/**
 * Attach instances that are needed in test cases.
 * @param {Component} testCaseHolder - The overall test cases holder
 * @param {Component} flowManager - The `gpii.flowManager`
 */
gpii.tests.app.receiveApp = function (testCaseHolder, flowManager) {
    testCaseHolder.flowManager = flowManager;
    testCaseHolder.app = flowManager.app;
};

// This is a fork of kettle.test.testDefToCaseHolder which is written in a non-reusable style
// See: https://issues.fluidproject.org/browse/KETTLE-60
gpii.tests.app.testDefToCaseHolder = function (configurationName, testDefIn) {
    var testDef = fluid.copy(testDefIn);
    var sequence = testDef.sequence;
    delete testDef.sequence;
    delete testDef.config;
    // We eliminate this since we need to wait longer for the app to be started
    // as well as the server
    // sequence.unshift.apply(sequence, kettle.test.startServerSequence);
    sequence.unshift.apply(sequence, gpii.tests.app.startSequence);
    sequence.push.apply(sequence, gpii.tests.app.endSequence);
    testDef.modules = [{
        name: configurationName + " tests",
        tests: [{
            name: testDef.name,
            expect: testDef.expect,
            sequence: sequence
        }]
    }];
    return testDef;
};

gpii.tests.app.constructServerAsPromise = function (testEnvironment) {
    var constructionPromise = fluid.promise();

    testEnvironment.events.serverConstructed.addListener(function () {
        constructionPromise.resolve();
    });

    testEnvironment.events.constructServer.fire();

    return constructionPromise;
};

// Also a fork from kettle
// See: https://issues.fluidproject.org/browse/KETTLE-60
gpii.tests.app.testDefToServerEnvironment = function (testDef) {
    var configurationName = testDef.configType || kettle.config.createDefaults(testDef.config);
    return {
        type: "kettle.test.serverEnvironment",
        options: {
            configurationName: configurationName,
            components: {
                tests: {
                    options: gpii.tests.app.testDefToCaseHolder(configurationName, testDef)
                }
            },
            distributeOptions: gpii.tests.app.testsDistributions,
            events: {
                pspStarted:     null,
                noUserLoggedIn: null,
                serverConstructed: {
                    events: {
                        pspStarted:     "pspStarted",
                        noUserLoggedIn: "noUserLoggedIn"
                    }
                },

                combinedStartup: null,
                startupComplete: null
            },
            invokers: {
                startup: {
                    funcName: "fluid.promise.fireTransformEvent",
                    args:     ["{that}.events.combinedStartup"]
                }
            },
            listeners: {
                // TODO: Review other test suites and see if this pattern should be stored somewhere more general.
                "combinedStartup.log": {
                    priority: "first",
                    funcName: "fluid.log",
                    args: ["Beginning combined chained startup."]
                },
                "combinedStartup.startCouch": {
                    priority: "after:log",
                    func: "{testEnvironment}.tests.configuration.harness.startup"
                },
                "combinedStartup.constructServer": {
                    priority: "after:startCouch",
                    funcName: "gpii.tests.app.constructServerAsPromise",
                    args: ["{testEnvironment}"]
                },
                "combinedStartup.fireEvent": {
                    priority: "last",
                    func: "{that}.events.startupComplete.fire"
                },
                // TODO: Remove these when possible.
                "pspStarted.log": {
                    funcName: "fluid.log",
                    args: ["PSP Started"]
                },
                "noUserLoggedIn.log": {
                    funcName: "fluid.log",
                    args: ["No User Logged in"]
                }
            }
        }
    };
};

// Also a fork from kettle
// See: https://issues.fluidproject.org/browse/KETTLE-60
gpii.tests.app.bootstrapServer = function (testDefs, transformer) {
    return kettle.test.bootstrap(testDefs, fluid.makeArray(transformer).concat([gpii.tests.app.testDefToServerEnvironment]));
};

/*
 * In case we're running tests with coverage data collecting,
 * we'd need to collect coverage data for the renderer as well.
 * This allows running the tests without coverage collecting.
 */
if (gpii.tests.app.isInstrumented) {
    /*
     * Run coverage collecting for the BrowserWindow-s.
     *
     * NOTE: This should be required last as it overrides existing items, such as `gpii.tests.app.endSequence`
     */
    fluid.require("%gpii-app/tests/lib/enableRendererCoverage.js");
}


gpii.tests.app.bootstrapServer([
    fluid.copy(gpii.tests.app.testDefs),
    fluid.copy(gpii.tests.dev.testDefs),
    fluid.copy(gpii.tests.timer.testDefs),
    fluid.copy(gpii.tests.dialogManager.testDefs),
    fluid.copy(gpii.tests.qss.testDefs),
    fluid.copy(gpii.tests.sequentialDialogs.testDefs),
    //fluid.copy(gpii.tests.shortcutsManager.testDefs), // NOT OK
    fluid.copy(gpii.tests.settingsBroker.testDefs),
    fluid.copy(gpii.tests.surveys.dynamicSurveyConnectorTestDefs),
    fluid.copy(gpii.tests.surveyTriggerManager.testDefs),
    fluid.copy(gpii.tests.siteConfigurationHandler.testDefs),
    fluid.copy(gpii.tests.storage.testDefs),
    fluid.copy(gpii.tests.userErrorsHandler.testDefs),
    // fluid.copy(gpii.tests.gpiiConnector.testDefs),  // should be changed to match the new specification
    fluid.copy(gpii.tests.webview.testDefs)
]);
