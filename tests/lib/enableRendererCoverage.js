/**
 * Coverage collecting for all BrowserWindows
 *
 * Enable coverage collecting mechanism for the BrowserWindows which is generated
 * throughout the gpii-app Integration tests.
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
 * - Run coverage server (gpii.testem.coverage.express) that will collect the renderer's coverage data
 * - Ensure all BrowserWindows are loading instrumented code to introduce coverage collecting in the renderer processes' code
 * - Ensure dialogs (BrowserWindows) are not destroyed before their coverage is collected
 *     - currently the only dialogs that are being destroyed are the `destroyOnClose` dialogs and we simply prevent
 *     their destruction until their coverage is collected which is done at the end of a test sequence;
 *     - this is done by disabling both their mechanism for getting destroyed by being closed and getting destroyed with
 *     their wrapping component destruction;
 *     - Note that we don't destroy every dialog in the final step but only the ones that are `destroyOnClose` and have their
 *     wrapping component destroyed. The reason behind this is that these components might be used in some post
 *     test sequence code execution;
 * - Collect coverage data from BrowserWindows after every test sequence and destroy postponed dialogs
 *     - this is needed as we need to collect coverage data before the BrowserWindows are destroyed;
 *     - once a test sequence has finished snippet in all running BrowserWindows is executed - this sends coverage data
 *       to the running coverage server which stores this BrowserWindow coverage information;
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
        "onCreate.disableWindowDestruction": {
            func: "gpii.tests.app.instrumentedDialog.disableWindowDestruction",
            args: "{that}"
        },
        "onDestroy.cleanupElectron": {
            func: "gpii.tests.app.instrumentedDialog.disableCleanUpDestruction",
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
 * Disable destruction of the BrowserWindow of `destroyOnClose` components as we need to collect their
 * coverage first. They should be the only type of dialogs that are being destroyed throughout a gpii-app run.
 * @param {Component} that - The `gpii.app.dialog` instance
 */
gpii.tests.app.instrumentedDialog.disableCleanUpDestruction = function (that) {
    if (!that.dialog.isDestroyed()) {
        if (that.options.config.destroyOnClose) {
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
gpii.tests.app.instrumentedDialog.disableWindowDestruction = function (that) {
    that.dialog.grade = that.options.gradeNames.slice(-2)[0];

    if (that.options.config.destroyOnClose) {
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

    function notifyCoverageReportSuccess() {
        require("electron").ipcRenderer.send("coverageReportSuccess");
    }

    var options = {
        coveragePort: 7003,
        exposeCallback: true
    };
    window.gpii.testem.coverage.sender(options);
    window.gpii.testem.coverage.afterTestsCallback(null, null, notifyCoverageReportSuccess);
};


/**
 * Send the coverage collecting code to the specified `BrowserWindow`. Note that the code is sent
 * as a string. Refer to `gpii.tests.app.sendRendererCoverage` for details.
 * @param {Component} dialog - The `BrowserWindow` instance
 */
gpii.tests.app.instrumentedDialog.requestDialogCoverage = function (dialog) {
    var sendCoverageCommand = gpii.test.toIIFEString(gpii.tests.app.sendRendererCoverage);
    gpii.test.executeJavaScript(dialog, sendCoverageCommand);
};

/**
 * Request coverage data from all BrowserWindows that currently exists (hopefully all dialogs created throughout the test
 * sequence). It is resolved once all windows have notified that their coverage had been sent successfully which will allow
 * next test sequence to be executed. Tests notify their success on reporting coverage over the IPC using
 * the predefined socket - "coverageReportSuccess".
 *
 * NOTE that the coverage data is collected by executing a command sent from the main process - `gpii.tests.app.sendRendererCoverage`.
 * For more details refer to gpii.test.executeJavaScript.
 *
 * @return {Promise} A promise that is resolved once all the BrowserWindows have repoted their coverage back to the
 * coverage server.
 */
gpii.tests.app.instrumentedDialog.requestCoverage = function () {
    var promise = fluid.promise();

    var activeDialogs = BrowserWindow.getAllWindows();
    var awaitingDialogReports = activeDialogs.length;

    fluid.log("Collect coverage from active dialogs: ", activeDialogs.length);

    fluid.each(activeDialogs, function (dialog) {
        /*
         * It might be the case that a test sequence has finished execution before all BrowserWindows have been fully
         * initialized. In that case we should wait for the BrowserWindows to be ready.
         */
        if (dialog.domReady) {
            gpii.tests.app.instrumentedDialog.requestDialogCoverage(dialog);
        } else {
            dialog.webContents.on(
                "dom-ready",
                function () {
                    gpii.tests.app.instrumentedDialog.requestDialogCoverage(dialog);
                }
            );
        }
    });

    /*
     * Wait for all of the BrowserWindows to report their coverage successfully.
     */
    ipcMain.on("coverageReportSuccess", function (event) {
        awaitingDialogReports--;


        var responseDialog = BrowserWindow.fromWebContents(event.sender);
        // XXX DEV
        console.log("Report collected: ", awaitingDialogReports, responseDialog.grade);
        activeDialogs = activeDialogs.filter( function (dialog) {
            return dialog.grade !== responseDialog.grade;
        } );
        console.log("Still awating: ", activeDialogs.map( function (d) { return d.grade; } ));
        /*
         * Ensure the "BrowserWindow" is destroyed after its coverage is collected and its wrapping
         * component has been already destroyed as it won't be needed anymore.
         * This is most used for dialogs whose destruction has been postponed until their
         * coverage is collected (destroyOnClose dialogs)
         */
        if (responseDialog && !responseDialog.isDestroyed() && responseDialog.componentDestroyed) {
            responseDialog.destroy();
        }

        if (awaitingDialogReports <= 0) {
            promise.resolve();
            ipcMain.removeAllListeners("coverageReportSuccess");
        }
    });

    return promise;
};

/**
 * Component for running the "coverage" collecting server.
 *
 * A BrowserWindow sends its coverage data to the server which saves it in a unique file.
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
 * Collect renderer coverage data at the end of every test sequence. This is needed
 * as we want to collect coverage data after it has been fully generated and
 * before it is lost as all of the BrowserWindows will be destroyed with the start
 * of the next test sequence
 */
gpii.tests.app.endSequence.push({
    task: "gpii.tests.app.instrumentedDialog.requestCoverage",
    resolve: "fluid.log",
    resolveArgs: "Renderer coverage collected!"
});

/*
 * Simply distribute the dialog grade that is needed for coverage data collecting.
 */
gpii.tests.app.testsDistributions = {
    "distribureInstrumentedDialog": {
        record: "gpii.tests.app.instrumentedDialog",
        target: "{that gpii.app.dialog}.options.gradeNames"
    }
};

/*
 * Start the coverage server.
 * Should be created only once for all test sequences and destroyed once tests are run.
 */
gpii.tests.app.rendererCoverageServer();
