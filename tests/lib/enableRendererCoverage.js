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
 * - Run coverage server (gpii.testem.coverage.express) that will be collecting the renderer's coverage data
 * - Ensure all BrowserWindows are loading instrumented code to introduce coverage collecting in the renderer processes' code
 * - Ensure dialogs (BrowserWindows) are not destroyed before their coverage is collected
 *     - currently the only dialogs that are being destroyed are the `closable` dialogs and we simply prevent
 *     their destruction for until their coverage is collected which is done at the end of a test sequence;
 *     - this is done by disabling both their mechanism for getting destroyed by being closed and getting destroyed with
 *     their wrapping component destruction;
 *     - Note that we don't destroy every dialog in the final step but only the ones that are `closable` and have their
 *     wrapping component destroyed. This is so as these components might be used in some post test sequence code execution;
 * - Collect coverage data from BrowserWindows after every test sequence and destroy postponed dialogs
 *     - this is needed as we need to collect coverage data before the BrowserWindows are destructed;
 *     - once a test sequence has finished snippet in all running BrowserWindows is executed - this sends coverage data
 *       to the running coverage server which stores this BrowserWindow coverage inforamtion;
 *     - Note that single BrowserWindows type (e.g. QSS) would get multiple coverage data
 *       reports (for every test sequence) that might test different elements of the renderer code. These coverage files
 *       are then merged by "istanbul" (nyc) in the final coverage report.
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
        },
        "onCreate.disableWindowDestr": { // in case they an be destructed
            func: "gpii.tests.app.instrumentedDialog.disableWindowDestr",
            args: "{that}"
        },
        "onDestroy.cleanupElectron": {
            func: "gpii.tests.app.instrumentedDialog.disableCleanUpDestr",
            args: "{that}"
        }
    }
});

/**
 * Attach flag to that BrowserWindow object that specify whether the DOM of the
 * window is fully initialized. This is needed as `webContents.executeJavaScript`
 * can only be used in case the DOM is ready.
 * @param {Component} dialog - The BrowserWindows instance
 */
gpii.tests.app.domStateListener = function (dialog) {
    dialog.domReady = false;

    dialog.webContents.on("dom-ready", function () {
        dialog.domReady = true;
    });
};

/**
 * Disable destruction of the BrowserWindow of `closable` components as we need to collect their
 * coverage first. They should be the only type of dialogs that are being destroyed throughout a gpii-app run.
 * @param {Component} that - The `gpii.app.dialog` instance
 */
gpii.tests.app.instrumentedDialog.disableCleanUpDestr = function (that) {
    if (!that.dialog.isDestroyed()) {
        // XXX We handle only the case when a dialog is closable
        // what if a normal dialog's component gets destroyed earlier (before coverage collecting)
        if (that.options.config.closable) {
            /*
             * Keep information about the dialog's wrapping component. This is
             * useful when dialog's destruction is postponed e.g. when coverage
             * collecting is needed.
             */
            that.dialog.componentDestroyed = true;

            // disable destruction
            that.dialog.hide();
        } else {
            that.dialog.destroy();
        }
    }
};

/**
 * This method is only applicable to dialogs that are destroyed when closed and
 * prevents destruction of the dialog in order for its coverage data to be collected
 * @param {Component} that - The `gpii.app.dialog` instance
 */
gpii.tests.app.instrumentedDialog.disableWindowDestr = function (that) {
    if (that.options.config.closable) {
        var dialog = that.dialog;

        dialog.on("close", function (e) {
            e.preventDefault();
            dialog.hide(); // behave normally in case the close button is used
        });
    }
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
        require("electron").ipcRenderer.send("coverageReportSuccess");
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
 * Tests notify success over the IPC using the predefined socket - "coverageReportSuccess".
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
    var awaitingDialogResports = activeDialogs.length;

    fluid.log("Collect coverage from active dialogs: ", activeDialogs.length);

    fluid.each(activeDialogs, function (dialog) {
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
    ipcMain.on("coverageReportSuccess", function (event) {
        awaitingDialogResports--;

        var responseDialog = BrowserWindow.fromWebContents(event.sender);
        /*
         * Ensure the dialog is destroyed after its coverage is collected as dialogs shouldn't
         * be needed anymore. That is because we are running this collecting
         * be the final step in every test sequence.
         * This is most useful for dialogs which destruction have been postponed
         * for until their coverage is collected (closable dialogs)
         */
        if (responseDialog && !responseDialog.isDestroyed() && responseDialog.componentDestroyed) {
            responseDialog.destroy();
        }

        if (awaitingDialogResports <= 0) {
            promise.resolve();
            ipcMain.removeAllListeners("coverageReportSuccess");
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
