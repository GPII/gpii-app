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
    gpii = fluid.registerNamespace("gpii");

require("../common/utils.js");

require("./basic/dialog.js");
require("./basic/blurrable.js");
require("./basic/centeredDialog.js");
require("./basic/resizable.js");
require("./basic/offScreenHidable.js");

fluid.defaults("gpii.app.diagnosticsCollector", {
    gradeNames: ["fluid.component"],
    events: {
        // This is a pseudoevent that will be called to start the transforming
        // promise chain. Usually from a button or menu on the capture tool portions
        // of the gpii-app.
        onCollectDiagnostics: null
    },
    listeners: {
        "onCollectDiagnostics.getSolutions": {
            funcName: "gpii.flowManager.getSolutions",
            args: [ "{flowManager}.solutionsRegistryDataSource", null]
        },
        "onCollectDiagnostics.collectSolutionsPayload": {
            funcName: "gpii.app.diagnosticsCollector.collectPayload",
            args: ["{arguments}.0", "{arguments}.1", "solutions"],
            priority: "after:getSolutions"
        },
        "onCollectDiagnostics.getInstalledSolutionsForCurrentDevice": {
            func: "{flowManager}.capture.getInstalledSolutionsForCurrentDevice",
            priority: "after:collectSolutionsPayload"
        },
        "onCollectDiagnostics.collectInstalledSolutionsPayload": {
            funcName: "gpii.app.diagnosticsCollector.collectPayload",
            args: ["{arguments}.0", "{arguments}.1", "installedSolutions"],
            priority: "after:getInstalledSolutionsForCurrentDevice"
        },
        "onCollectDiagnostics.getSystemSettingsCapture": {
            funcName: "gpii.app.diagnosticsCollector.getSystemSettingsCapture",
            args: ["{flowManager}", "{arguments}.1"],
            priority: "after:collectInstalledSolutionsPayload"
        },
        "onCollectDiagnostics.collectSystemSettingsCapturePayload": {
            funcName: "gpii.app.diagnosticsCollector.collectPayload",
            args: ["{arguments}.0", "{arguments}.1", "settingsCapture"],
            priority: "after:getSystemSettingsCapture"
        }
    }
});

gpii.app.diagnosticsCollector.getSystemSettingsCapture = function (flowManager, options) {
    var solutionIds = fluid.keys(options.installedSolutions);
    return gpii.app.captureTool.safelyGetSolutionsCapture(flowManager, solutionIds);
};

gpii.app.diagnosticsCollector.collectPayload = function (value, options, keyName) {
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
        keyedInUserToken: null,
        preferences: {},
        flatSolutionsRegistry: {}
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
            titleBarStyle: "default"
        }
    },
    invokers: {
        updateRenderModel: {
            funcName: "gpii.app.captureTool.updateRenderModel",
            args: ["{that}", "{arguments}.0", "{arguments}.1"]
        },
        savePreferences: {
            funcName: "gpii.app.captureTool.savePreferences",
            args: ["{that}", "{pspChannel}", "{flowManager}", "{arguments}.0"]
        },
        generateDiagnostics: {
            funcName: "gpii.app.captureTool.generateDiagnostics",
            args: ["{that}", "{flowManager}"]
        },
        getSolutions: {
            funcName: "gpii.flowManager.getSolutions",
            args: [ "{flowManager}.solutionsRegistryDataSource", null]
        }
    },
    listeners: {
        "onCreate.show": [
            {
                func: "{that}.show"
            }
        ],
        "onCreate.setSolutions": [
            {
                funcName: "gpii.app.captureTool.setSolutions",
                args: ["{that}"]
            }
        ]
    },
    modelListeners: {
        // This is a little flimsy. Ideally we'd like to send over
        // one update rather than two. gpii-app seems to always have
        // isKeyedIn updated before the pspChannel updates the preferences
        // (which makes sense), so we listen for changes to preferences.
        // Does it even matter though? If someones preferences changed, we
        // would need to update the prefsset dropdown on page 4 too...
        //
        // So really there could be 2 situations. A change in key-in, which means
        // we'd listen for isKeyedIn/keyedInUserToken and preferences. And second,
        // the same user is keyed in, but their preferences changed.  Perhaps we
        // should cache a copy of isKeyedIn/keyedInUserToken and set up 2
        // listeners to handler this together.  Can you boil modelListeners/events?
        // TODO
        // This does actually cause an issue if you save a capture as a new prefset,
        // then run the capture tool again it does not show up, but requires keying
        // out and in again (this maybe be a different issue in using the channel).
        // "isKeyedIn": {
        "preferences": {
            func: "{that}.updateRenderModel",
            excludeSource: "init",
            args: ["{pspChannel}.model.preferences", "{change}"]
        }
    },
    components: {
        channelNotifier: {
            type: "gpii.app.channelNotifier",
            options: {
                events: {
                    sendingInstalledSolutions: null,
                    sendingRunningSolutions: null,
                    sendingAllSolutionsCapture: null,
                    modelUpdate: null,
                    saveCapturedPreferences: null
                }
            }
        },
        channelListener: {
            type: "gpii.app.channelListener",
            options: {
                events: {
                    getInstalledSolutions: null,
                    getAllSolutionsCapture: null,
                    captureDoneButton: null,
                    modelUpdate: null,
                    saveCapturedPreferences: null,
                    keyinWithKey: null
                },
                listeners: {
                    getInstalledSolutions: {
                        funcName: "gpii.app.captureTool.channelGetInstalledSolutions",
                        args: ["{captureTool}.channelNotifier", "{flowManager}", "{arguments}"]
                    },
                    getAllSolutionsCapture: {
                        funcName: "gpii.app.captureTool.channelGetAllSolutionsCapture",
                        args: ["{captureTool}", "{captureTool}.channelNotifier", "{flowManager}", "{arguments}.0"]
                    },
                    captureDoneButton: {
                        func: "{captureTool}.close"
                    },
                    modelUpdate: {
                        funcName: "gpii.app.captureTool.channelModelUpdate",
                        args: ["{captureTool}.channelNotifier", "{captureTool}", "{flowManager}"]
                    },
                    saveCapturedPreferences: {
                        funcName: "{captureTool}.savePreferences",
                        args: ["{arguments}.0"]
                    },
                    keyinWithKey: {
                        func: "{gpii.app}.keyIn",
                        args: ["{arguments}.0"]
                    }
                }
            }
        }
    }
});

gpii.app.captureTool.setSolutions = function (that) {
    that.getSolutions().then(function (data) {
        var flattenedSolReg = {};
        fluid.each(data.solutions, function (osSolutions) {
            fluid.each(osSolutions, function (solution, solutionId) {
                flattenedSolReg[solutionId] = solution;
            });
        });
        that.applier.change("flatSolutionsRegistry", flattenedSolReg);
    });
};

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
 * @param {gpii.app.diagnosticsCollector} diagnosticsCollector - An instance of `gpii.app.diagnosticsCollector`
 * @param {gpii.settingsDir} settingsDir - An instance of the `gpii.settingsDir` component from gpii-universal.
 */
gpii.app.captureTool.logCaptureDiagnostics = function (diagnosticsCollector, settingsDir) {
    var gpiiSettingsDir = settingsDir.getGpiiSettingsDir();

    var startupTime = Date.now();
    var captureDirName = gpiiSettingsDir + "/capture-diagnostics-" + gpii.journal.formatTimestamp(startupTime);

    fluid.log("Capture Diagnostics directory is: ", captureDirName);

    var dialogPromise = electron.dialog.showMessageBox({
        buttons: ["Cancel", "Run Capture"],
        message: "Select 'Run Capture' to run the capture diagnostics and store them to disk.\n\n  After capture they will be stored in:\n" + captureDirName
    });

    // The promise returned from electrons prompt dialog will equal 1 if the user clicked ok,
    // rather than cancel/close/etc.
    // https://electronjs.org/docs/api/dialog#dialogshowmessageboxbrowserwindow-options
    if (dialogPromise === 1) {
        fs.mkdirSync(captureDirName);
        gpii.app.captureTool.generateDiagnostics(diagnosticsCollector).then(
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
gpii.app.captureTool.generateDiagnostics = function (diagnosticsCollector) {
    return fluid.promise.fireTransformEvent(diagnosticsCollector.events.onCollectDiagnostics, {});
};

gpii.app.captureTool.channelGetInstalledSolutions = function (channelNotifier, flowManager) {
    flowManager.capture.getInstalledSolutionsForCurrentDevice().then(
        function (data) {
            channelNotifier.events.sendingInstalledSolutions.fire(data);
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
                    fluid.log("Exception trying to look up", solutionEntry, " Error: ", err);
                }
            });
            channelNotifier.events.sendingRunningSolutions.fire(runningSolutions);
        },
        function (err) {
            channelNotifier.events.sendingInstalledSolutions.fire({isError: true, message: err});
        }
    );
};

gpii.app.captureTool.safelyGetSolutionsCapture = function (flowManager, solutionsList) {
    var promTogo = fluid.promise();
    // Due to the unknown stability of some settings handlers, we are invoking the system capture
    // on each solution individually, so if one fails the capture will still proceed.
    var capturePromises = [];
    fluid.each(solutionsList, function (solutionId) {
        var nextPromise = fluid.promise();
        flowManager.capture.getSystemSettingsCapture({
            solutionsList: [solutionId]
        }).then(
            function (data) {
                nextPromise.resolve(data);
            },
            function (err) {
                var errTogo = {};
                errTogo[solutionId] = {
                    isError: true,
                    message: err
                };
                fluid.log(fluid.logLevel.WARN, "Error capturing solution " + solutionId + ": " + err);
                nextPromise.resolve(errTogo);
            }
        );

        capturePromises.push(nextPromise);
    });

    var result = fluid.promise.sequence(capturePromises);
    result.then(function (data) {
        var togo = {};
        fluid.each(data, function (value) {
            fluid.each(value, function (solPayload, solId) {
                togo[solId] = solPayload;
            });
        });
        promTogo.resolve(togo);
    });

    return promTogo;
};

gpii.app.captureTool.channelGetAllSolutionsCapture = function (that, channelNotifier, flowManager, arg) {
    var options = {
        solutionsList: []
    };
    if (arg.solutionsList) {
        options.solutionsList = arg.solutionsList;
    }

    var result = gpii.app.captureTool.safelyGetSolutionsCapture(flowManager, options.solutionsList);
    result.then(function (data) {
        channelNotifier.events.sendingAllSolutionsCapture.fire(data);
    });
};

gpii.app.captureTool.channelModelUpdate = function (channelNotifier, captureTool, flowManager) {
    channelNotifier.events.modelUpdate.fire({
        isKeyedIn: captureTool.model.isKeyedIn,
        keyedInUserToken: captureTool.model.keyedInUserToken,
        preferences: flowManager.pspChannel.model.preferences
    });
};

gpii.app.captureTool.savePreferences = function (that, pspChannel, flowManager, options) {
    var payload = {
        contexts: {}
    };

    payload.contexts[options.prefSetId] = options.prefSetPayload;

    var prefsTogo = gpii.lifecycleManager.transformSettingsToPrefs(options.prefSetPayload.preferences, that.model.flatSolutionsRegistry);

    payload.contexts[options.prefSetId].preferences = prefsTogo;

    flowManager.savePreferences(that.model.keyedInUserToken, payload);
};

gpii.app.captureTool.updateRenderModel = function (that /* , preferences, change */ ) {
    that.dialog.webContents.send("modelUpdate", {
        isKeyedIn: that.model.isKeyedIn,
        keyedInUserToken: that.model.keyedInUserToken,
        preferences: that.model.preferences
    });
};
