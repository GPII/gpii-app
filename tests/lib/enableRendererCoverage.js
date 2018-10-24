/**
 * Coverage collecting for all BrowserWindows
 *
 * Enable coverage collecting mechanism for the BrowserWindows that are created throughout the
 * gpii-app Integration tests.
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
    gpii = fluid.registerNamespace("gpii"),
    ipcMain = require("electron").ipcMain,
    BrowserWindow = require("electron").BrowserWindow;

require("gpii-testem"); // needed for the coverage server `gpii.testem.coverage.express`

/*
 * The process for collecting BrowserWindows tests is the following:
 * - Runs coverage server (gpii.testem.coverage.express) to be enable collecting of coverage data
 * - Ensures all BrowserWindows are loading instrumented code in order to enable coverage collecting
 * - Collects coverage data from BrowserWindows after every test sequence
 *     - this is needed as we need to collect coverage data before the BrowserWindows are destructed;
 *     - once a test sequence has finished execute a snippet in all running BrowserWindows - this sends coverage data
 *       to the running coverage server which stores this BrowserWindow coverage;
 *     - Note that single BrowserWindows type (e.g. QSS) would get multiple coverage data
 *       reports (for every test sequence) which are merged by "istanbul" (nyc) in the final coverage report.
 */



/**
 * Extension of the `gpii.app.dialog` that is to be used for coverage collecting.
 */
fluid.defaults("gpii.tests.app.instrumentedDialog", {
    // ensure that `gpii.app.dialog`s are using the instrumented version of renderer content.
    config: {
        filePrefixPath: "/instrumented/src/renderer"
    },
    listeners: {
        "onCreate.registerDomStateListener": {
            funcName: "gpii.tests.app.domStateListener",
            args: ["{that}.dialog"]
        }
    }
});


/**
 * Attach flag to that BrowserWindow object that specify whether the DOM of the
 * window is fully initialized. This is needed as `webContents.executeJavaScript`
 * can only be used in case the DOM is ready.
 *
 * @param {Component} dialog - The BrowserWindows instance
 */
gpii.tests.app.domStateListener = function (dialog) {
    dialog.domReady = false;

    dialog.webContents.on("dom-ready", function () {
        dialog.domReady = true;
    });
};



/**
 * Sends coverage data from a renderer process to the coverageServer.
 * This function is sent to renderer processes (as a string) and run there.
 * Once the coverage server `gpii.testem.coverage.express` returns a response it notifies the
 * main process so that the tests would continue.
 *
 * NOTE: The BrowserWindow has to have "node integration" enabled in order to collect coverage data.
 * A work around would be partly loading code with window init - webContents preload script.
 */
gpii.tests.app.sendRendererCoverage = function () {
    require("../../../../node_modules/gpii-testem/src/js/client/coverageSender");

    function notifyreportCoverageSuccess() {
        require("electron").ipcRenderer.send("reportCoverageSuccess");
    }

    var options = {
        coveragePort: 7003,
        exposeCallback: true
    };
    window.gpii.testem.coverage.sender(options);
    window.gpii.testem.coverage.afterTestsCallback(null, null, notifyreportCoverageSuccess);
};

gpii.tests.app.instrumentedDialog.requestDialogCoverage = function (dialog) {
    var sendCoverageCommand = fluid.stringTemplate("(%function)()", { function: gpii.tests.app.sendRendererCoverage.toString() });
    gpii.test.executeJavaScript(dialog, sendCoverageCommand);
};

/**
 * Request coverage data from all currently created BrowserWindows. Continues with
 * tests execution once all windows have notified that their coverage had been sent successfully.
 * Tests notify success over the IPC using the predefined socket - "reportCoverageSuccess".
 *
 * Note that the coverage is collected by executing a command sent from the main process - `gpii.tests.app.sendRendererCoverage`.
 * For more details refer to gpii.test.executeJavaScript.
 *
 * @return {Promise} A promise that is resolved once all the BrowserWindows have repoted their coverage back to the
 * coverage server.
 */
gpii.tests.app.instrumentedDialog.requestCoverage = function () {
    var promise = fluid.promise();

    var activeDialogs = BrowserWindow.getAllWindows();
    var awaitingReportDialogs = activeDialogs.length;

    fluid.each(activeDialogs, function (dialog) {
        // XXX DEV
        console.log("Request coverage: ", dialog.webContents.grades);
        var collectDailogCoverage = gpii.tests.app.instrumentedDialog.requestDialogCoverage.bind(null, dialog);

        /*
         * It might be the case that a test sequence has finished execution before all BrowserWindows have been fully
         * initialized. We might take two approaches in this case:
         * - either wait for the dialogs to be ready (which is currently in use)
         * - or skip them as their coverage won't be needed anyways (the test sequence is not using that dialog at all)
         */
        if (!dialog.domReady) {
            dialog.webContents.on(
                "dom-ready",
                collectDailogCoverage
            );
        } else {
            collectDailogCoverage();
        }
    });

    /*
     * Wait for coverage report success from all of the BrowserWindows.
     */
    ipcMain.on("reportCoverageSuccess", function (/* event */) {
        awaitingReportDialogs--;

        if (awaitingReportDialogs <= 0) {
            promise.resolve();
            ipcMain.removeAllListeners("reportCoverageSuccess");
        }
    });

    return promise;
};

/**
 * Component for running the "coverage" collecting server.
 */
fluid.defaults("gpii.tests.app.rendererCoverageServer", {
    gradeNames:  "gpii.testem.coverage.express",
    port: 7003,
    distributeOptions: {
        record: "%gpii-app/coverage",
        target: "{that gpii.testem.coverage.receiver.middleware}.options.coverageDir"
    },
    listeners: {
        "onCreate": {
            funcName: "fluid.log",
            args: ["Coverage Server started at port ", "{that}.options.port"]
        }
    }
});


/*
 * Collect renderer coverage report at the end of every test sequence. This is needed
 * as we want to collect coverage data before it is lost (the BrowserWindow) will be destroyed
 * with the start of the next test sequence
 */
gpii.tests.app.endSequence = [
    {
        task: "gpii.tests.app.instrumentedDialog.requestCoverage",
        resolve: "console.log",
        resolveArgs: "Renderer coverage collected!"
    }
];

gpii.tests.app.testsDistributions = {
    "distribureInstrumentedDialog": {
        record: "gpii.tests.app.instrumentedDialog",
        target: "{that gpii.app.dialog}.options.gradeNames"
    }
};

/*
 * Start the coverage server. This is needed in order to collect coverage data
 * from current run BrowserWindows.
 * Should be created only once for all test sequences and destroyed with tests completions
 */
gpii.tests.app.rendererCoverageServer();
