/**
 * Capture Tool Main Window Dialog
 *
 * Copyright 2019 Raising the Floor - International
 *
 * Licensed under the New BSD license. You may not use this file except in
 * compliance with this License.
 * The research leading to these results has received funding from the European Union's
 * Seventh Framework Programme (FP7/2007-2013) under grant agreement no. 289016.
 * You may obtain a copy of the License at
 * https://github.com/GPII/universal/blob/master/LICENSE.txt
 */
"use strict";

var fs = require("fs"),
    fluid = require("infusion"),
    electron = require("electron"),
    ipcMain = electron.ipcMain,
    gpii = fluid.registerNamespace("gpii");

require("../common/utils.js");

require("./basic/dialog.js");
require("./basic/blurrable.js");
require("./basic/centeredDialog.js");
require("./basic/resizable.js");
require("./basic/offScreenHidable.js");


fluid.defaults("gpii.app.captureToolUtils", {
    gradeNames: ["fluid.component"],
    events: {
        onCollectDiagnostics: null
    },
    listeners: {
        onCollectDiagnostics: [{
            funcName: "gpii.flowManager.getSolutionsPromise",
            args: [ "{flowManager}.solutionsRegistryDataSource", null]
        }, {
            funcName: "gpii.app.captureToolUtils.collectPayload",
            args: ["{arguments}.0", "{arguments}.1", "solutions"]
        }, {
            func: "{flowManager}.capture.getInstalledSolutions"
        }, {
            funcName: "gpii.app.captureToolUtils.collectPayload",
            args: ["{arguments}.0", "{arguments}.1", "installedSolutions"]
        }, {
            func: "{flowManager}.capture.getSystemSettingsCapture"
        }, {
            funcName: "gpii.app.captureToolUtils.collectPayload",
            args: ["{arguments}.0", "{arguments}.1", "settingsCapture"]
        }]
    }
});

gpii.app.captureToolUtils.collectPayload = function (value, options, keyName) {
    options[keyName] = value;
    return options;
};

fluid.defaults("gpii.app.captureTool", {
    gradeNames: [
        "gpii.app.dialog",
        "gpii.app.centeredDialog",
        "fluid.modelComponent"
    ],
    model: {
        isKeyedIn: false,
        keyedInUserToken: null
    },
    /*
     * Raw options to be passed to the Electron `BrowserWindow` that is created.
     */
    config: {
        destroyOnClose: false,
        fileSuffixPath: "captureTool/index.html",

        params: {
            theme: "{that}.model.theme"
        },

        attrs: {
            icon: {
                expander: {
                    funcName: "fluid.module.resolvePath",
                    args: ["%gpii-app/src/icons/Morphic-Desktop-Icon.ico"]
                }
            },
            alwaysOnTop: false,
            frame: true,
            resizable: true,
            transparent: false, // needs to be false to enable resizing and maximizing
            movable: true,
            minimizable: true,
            maximizable: true,
            autoHideMenuBar: true,
            // titleBarStyle: "hidden"
            titleBarStyle: "default"
        }
    },
    invokers: {
        updateRenderModel: {
            funcName: "gpii.app.captureTool.updateRenderModel",
            args: ["{that}", "{arguments}.0"]
        },
        testPspChannel: {
            funcName: "gpii.app.captureTool.testPspChannel",
            args: ["{that}", "{pspChannel}", "{flowManager}", "{arguments}.0"]
        },
        generateDiagnostics: {
            funcName: "gpii.app.captureTool.generateDiagnostics",
            args: ["{that}", "{flowManager}"]
        }
    },
    listeners: {
        onCreate: [
            {
                func: "{that}.show"
            },
            {
                funcName: "gpii.app.captureTool.init",
                args: ["{that}", "{flowManager}"]
            }
        ]
    },
    modelListeners: {
        "isKeyedIn": {
            func: "{that}.updateRenderModel",
            excludeSource: "init",
            args: ["{change}"]
        }
    }
});

/**
 * This function will create a set of diagnostic log dumps and files for analyzing
 * the output of capture on a machine. It will create a directory in the install
 * directory with the current timestamp named `capture-diagnostics-TIMESTAMP` which
 * will include the following files:
 *
 * + gpiiSettingsDir/
 *   + capture-diagnostics-TIMESTAMP
 *     - solutions.json
 *     - installedSolutions.json
 *     - settingsCapture.json
 *
 * @param {gpii.app.captureToolUtils} captureToolUtils = An instance of `gpii.app.captureToolUtils`
 */
gpii.app.captureTool.logCaptureDiagnostics = function (captureToolUtils) {
    var settingsDirComponent = gpii.settingsDir();
    var gpiiSettingsDir = settingsDirComponent.getGpiiSettingsDir();

    var startupTime = Date.now();
    var captureDirName = gpiiSettingsDir + "/capture-diagnostics-" + gpii.journal.formatTimestamp(startupTime);

    fluid.log("Capture Diagnostics directory is: ", captureDirName);

    var dailogPromise = electron.dialog.showMessageBox({
        buttons: ["Cancel", "Run Capture"],
        message: "Select 'Run Capture' to run the capture diagnostics and store them to disk.\n\n  After capture they will be stored in:\n" + captureDirName
    });

    if (dailogPromise === 1) {
        fs.mkdirSync(captureDirName);
        gpii.app.captureTool.generateDiagnostics(captureToolUtils).then(
            function (data) {
                // 0. Solutions
                fs.appendFileSync(captureDirName + "/solutions.json", JSON.stringify(data.solutions, null, 4));
                // 1. Installed Solutions
                fs.appendFileSync(captureDirName + "/installedSolutions.json", JSON.stringify(data.installedSolutions, null, 4));
                // 2. Full System Settings Capture
                fs.appendFileSync(captureDirName + "/settingsCapture.json", JSON.stringify(data.settingsCapture, null, 4));

                electron.dialog.showMessageBox({
                    message: "Capture diagnostics successfully taken and are now stored in this directory:\n" + captureDirName
                });
            },
            function (err) {
                electron.dialog.showMessageBox({
                    message: "There was a problem capturing the diagnostics:\n" + err
                });
                fluid.log("Error running capture diagnostics. ", err);
            }
        );
    }
};

/*
 * Generates and returns a set of diagnostics for the current local machine.
 *
 * Returns a promise containing these.
 */
gpii.app.captureTool.generateDiagnostics = function (captureToolUtils) {
    return fluid.promise.fireTransformEvent(captureToolUtils.events.onCollectDiagnostics, {});
};

gpii.app.captureTool.init = function (that, flowManager) {
    ipcMain.on("getInstalledSolutions", function (event /*, arg */) {
        flowManager.capture.getInstalledSolutions().then(
            function (data) {
                event.sender.send("sendingInstalledSolutions", data);
                var runningSolutions = {};
                fluid.each(data, function (solutionEntry, solutionId) {
                    try {
                        fluid.log("ABOUT TO CHECK PROCESS FOR: ", solutionId);
                        var isRunningState = gpii.processReporter.handleIsRunning(solutionEntry);
                        fluid.log("RUNNING STATE: ", isRunningState);
                        if (isRunningState) {
                            runningSolutions[solutionId] = solutionEntry;
                        }
                    } catch (err) {
                        fluid.log("Exception trying to look up", solutionEntry.isRunning);
                    }
                });
                event.sender.send("sendingRunningSolutions", runningSolutions);
            },
            function (err) {
                event.sender.send("sendingInstalledSolutions", {isError: true, message: err});
            }
        );
    });

    ipcMain.on("getAllSolutionsCapture", function (event, arg) {
        var options = {};
        if (arg.solutionsList) {
            options.solutionsList = arg.solutionsList;
        }
        flowManager.capture.getSystemSettingsCapture(options).then(
            function (data) {
                event.sender.send("sendingAllSolutionsCapture", data);
            },
            function (err) {
                event.sender.send("sendingAllSolutionsCapture", {isError: true, message: err});
            }
        );
    });

    ipcMain.on("captureDoneButton", function (/*event, arg*/) {
        that.close();
    });

    ipcMain.on("modelUpdate", function (event /*, arg */) {
        event.sender.send("modelUpdate", {
            isKeyedIn: that.model.isKeyedIn,
            keyedInUserToken: that.model.keyedInUserToken
        });
    });

    ipcMain.on("saveCapturedPreferences", function (event, arg) {
        that.testPspChannel(arg);
    });
};

gpii.app.captureTool.testPspChannel = function (that, pspChannel, flowManager, options) {
    console.log("Capturing using cloudURL: ", flowManager.settingsDataSource.options.cloudURL);
    console.log("BEFORE Take a look at PSP Channel Model: ", flowManager.pspChannel.model);

    var payload = {
        contexts: {}
    };

    payload.contexts[options.prefSetId] = options.prefSetPayload;

    flowManager.savePreferences(that.model.keyedInUserToken, payload);

    console.log("AFTER Take a look at PSP Channel Model: ", flowManager.pspChannel.model);
};

gpii.app.captureTool.updateRenderModel = function (that /*, change*/) {
    that.dialog.webContents.send("modelUpdate", {
        isKeyedIn: that.model.isKeyedIn,
        keyedInUserToken: that.model.keyedInUserToken
    });
};
