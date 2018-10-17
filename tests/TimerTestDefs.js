/*
 * GPII App Timer Integration Tests
 *
 * Copyright 2018 Raising the Floor - International
 *
 * Licensed under the New BSD license. You may not use this file except in
 * compliance with this License.
 *
 * You may obtain a copy of the License at
 * https://github.com/GPII/universal/blob/master/LICENSE.txt
 */

"use strict";

var fluid = require("infusion"),
    jqUnit = fluid.require("node-jqunit", require, "jqUnit"),
    gpii = fluid.registerNamespace("gpii");

require("../src/main/app.js");

fluid.registerNamespace("gpii.tests.timer.testDefs");

fluid.defaults("gpii.tests.timer.testTimer", {
    gradeNames: "fluid.component",
    components: {
        testTimer: {
            type: "gpii.app.timer"
        }
    }
});

var timerArguments = [0, "first argument", 2.002],
    invalidTimeoutDuration = "invalidTimeoutDuration";

gpii.tests.timer.testInvalidTimeoutDuration = function (timer) {
    jqUnit.expectFrameworkDiagnostic("An error is thrown if timer is started with an invalid timeoutDuration argument", function () {
        timer.start(invalidTimeoutDuration, timerArguments);
    }, "Timer's delay must be a number.");
};

gpii.tests.timer.testDefs = {
    name: "Timer integration tests",
    expect: 2,
    config: {
        configName: "gpii.tests.dev.config",
        configPath: "tests/configs"
    },
    distributeOptions: {
        applyTestTimer: {
            record: "gpii.tests.timer.testTimer",
            target: "{that gpii.app}.options.gradeNames"
        }
    },
    gradeNames: ["gpii.test.common.testCaseHolder"],
    sequence: [{
        func: "{that}.app.testTimer.start",
        args: [2000, timerArguments]
    }, {
        event: "{that}.app.testTimer.events.onTimerFinished",
        listener: "jqUnit.assertDeepEq",
        args: [
            "Timer has finished successfully when the delay is specified",
            timerArguments,
            "{arguments}"
        ]
    }, {
        func: "{that}.app.testTimer.start"
    }, {
        event: "{that}.app.testTimer.events.onTimerFinished",
        listener: "jqUnit.assertFalse",
        args: [
            "Timer has finished successfully when there is no delayed specified and the internal timer is cleared",
            "{that}.app.testTimer.timer"
        ]
    }, {
        func: "gpii.tests.timer.testInvalidTimeoutDuration",
        args: ["{that}.app.testTimer"]
    }]
};
