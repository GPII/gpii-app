/**
 * Utilities for collection of renderer processes coverage
 *
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


var fluid = require("gpii-universal"),
    gpii = fluid.registerNamespace("gpii"),
    ipcMain = require("electron").ipcMain,
    BrowserWindow = require("electron").BrowserWindow;

require("gpii-testem");



fluid.defaults("gpii.tests.app.rendererCoverageServer", {
    gradeNames:  "gpii.testem.coverage.express",
    port: 7003,
    distributeOptions: {
        record: "%gpii-app/coverage",
        target: "{that gpii.testem.coverage.receiver.middleware}.options.coverageDir"
    },
    listeners: {
        "onCreate": { // XXX dev
            funcName: "console.log",
            args: ["ROUTER CREATED"]
        }
    }
});



/**
 * Sends coverage data from a renderer process to the coverageServer.
 * This function is sent to renderer processes and run there. Once the `gpii.testem.coverage.server`
 * returns a response it notifies the main process so that the tests would continue.
 */
gpii.tests.app.sendRendererCoverage = function () {
    var coveragePort = 7003; // TODO configurabale (stringTemplate)
    // send coverage
    // notify server for change

    function notifyCoverageSuccess() {
        require("electron").ipcRenderer.send("coverageSuccess");
    }
    // Similar to: https://github.com/GPII/gpii-testem/blob/master/src/js/client/coverageSender.js#L27
    if (window.__coverage__) {
        var xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function () {
            if (this.readyState === 4) {
                if (this.status === 200) {
                    console.log("Saved coverage data.");
                }
                else {
                    console.error("Error saving coverage data:", this.responseText);
                }

                // notify the main process TODO or listen for even of server
                notifyCoverageSuccess();
            }
        };
        xhr.open("POST", "http://localhost:" + coveragePort + "/coverage");
        xhr.setRequestHeader("Content-type", "application/json");
        var wrappedPayload = {
            payload: {
                document: {
                    title: document.title,
                    URL: document.URL
                },
                navigator: {
                    appCodeName: navigator.appCodeName,
                    appName: navigator.appName,
                    product: navigator.product,
                    productSub: navigator.productSub,
                    userAgent: navigator.userAgent,
                    vendor: navigator.vendor,
                    vendorSub: navigator.vendorSub
                },
                coverage: window.__coverage__
            }
        };
        xhr.send(JSON.stringify(wrappedPayload, null, 2));
    } else {
        // notify anyways
        notifyCoverageSuccess();
    }
};



/**
 * Component that ensures `gpii.app.dialog`s are using the instrumented version of renderer content
 */
fluid.defaults("gpii.tests.app.instrumentedDialog", {
    // use the instrumented renderer files
    config: {
        filePrefixPath: "/instrumented/src/renderer"
    },
    listeners: {
        // "onDestroy.cleanupElectron": null,
        // "onCreate.attachCoverageCollector": {
        //     funcName: "gpii.tests.app.instrumentedDialog.attachCoverageCollector",
        //     args: ["{that}.dialog"]
        // },
        "onCreate.log": { // XXX dev
            funcName: "console.log",
            args: ["INSTRUMENTED DIALOG: ", "{that}.options.gradeNames"]
        }
    }
});

gpii.tests.app.instrumentedDialog.requestDialogCoverage = function (dialog) {
    var sendCoverageCommand = fluid.stringTemplate("(%function)()", { function: gpii.tests.app.sendRendererCoverage.toString() });
    gpii.test.executeJavaScript(dialog, sendCoverageCommand);
};

/**
 * Request coverage data from all currently created BrowserWindows. Continues with
 * tests execution once all windows have notified that their coverage had been sent successfully, 
 *
 * Note that the coverage is collected by executing a command sent from the main process - `gpii.tests.app.sendRendererCoverage`. 
 * For more details refer to gpii.test.executeJavaScript.
 */
gpii.tests.app.instrumentedDialog.requestCoverage = function () {
    var promise = fluid.promise();

    var dialogs = BrowserWindow.getAllWindows();
    var dialogCounter = 0;

    fluid.each(dialogs, function (dialog) {
        dialog.webContents.toggleDevTools();
        console.log("REQUEST COVERAGE: ", dialog.gradeNames);
        // create an iife
        gpii.tests.app.instrumentedDialog.requestDialogCoverage(dialog);
    });

    ipcMain.on("coverageSuccess", function (e) {
        dialogCounter++;

        // XXX this should be unneeded
        var diags = BrowserWindow.getAllWindows();
        console.log("Sender: ", e.sender.isDestroyed());

        // XXX DEV
        console.log("Getting: ", dialogs.length, diags.length, dialogCounter);

        if (dialogCounter >= dialogs.length) {
            promise.resolve();
            ipcMain.removeAllListeners("coverageSuccess");
        }
    });

    return promise;
};

/**
 * Collect the coverage data of a dialog before its destruction.
 * This is needed in case a dialog is recreated throughout a single test sequence.
 *
 * @param {Component} dialog
 */
gpii.tests.app.instrumentedDialog.attachCoverageCollector = function (dialog) {
    dialog.on("closed", function () {
        // TODO load script form file
        // XXX DEV
        console.log("REQUEST COVERAGE: ", dialog.gradeNames);
        gpii.tests.app.instrumentedDialog.requestDialogCoverage(dialog);
    });
    ipcMain.on("coverageSuccess", dialog.destroy);
};
