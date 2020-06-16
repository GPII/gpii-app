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
    uuid = require("uuid"),
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
        savePreferences: {
            funcName: "gpii.app.captureTool.savePreferences",
            args: ["{that}.model.flatSolutionsRegistry", "{that}.model.keyedInUserToken", "{flowManager}", "{arguments}.0"]
        },
        generateDiagnostics: {
            funcName: "gpii.app.captureTool.generateDiagnostics",
            args: ["{that}", "{flowManager}"]
        },
        getSolutions: {
            funcName: "gpii.flowManager.getSolutions",
            args: ["{flowManager}.solutionsRegistryDataSource", null]
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
        ],
        "{flowManager}.events.preferencesSavedSuccess": [{
            funcName: "fluid.log",
            args: ["CaptureTool: Saved on the preferencesSavedSuccess"]
        },
        {
            func: "{captureTool}.channelNotifier.events.preferencesSavedSuccess.fire"
        }],
        "{flowManager}.events.preferencesSavedError": [{
            funcName: "fluid.log",
            args: ["CaptureTool: Saved on the preferencesSavedError", "@expand:JSON.stringify({arguments}.0, null, 4)"]
        },
        {
            func: "{captureTool}.channelNotifier.events.preferencesSavedError.fire",
            args: ["{arguments}.0"]
        }]
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
            func: "gpii.app.captureTool.channelModelUpdate",
            args: ["{captureTool}.channelNotifier", "{captureTool}", "{flowManager}"],
            excludeSource: "init"
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
                    saveCapturedPreferences: null,
                    preferencesSavedSuccess: null,
                    preferencesSavedError: null
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
                        args: ["{captureTool}.channelNotifier", "{flowManager}", "{arguments}.0"]
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

/**
 * This function sets up the flat solutioins registry in the capture tool model.
 * Essentially it just fetches the solutions registry (which is organized by operating
 * system) and places all the solutions in a top level hash. This is then saved back
 * to the model. This data is used for the `gpii.lifecycleManager.transformSettingsToPrefs`
 * transform.
 *
 * @param {gpii.app.captureTool} that - Instance of the Capture Tool Dialog.
 */
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
                fluid.log("Capture Tool: Error running capture diagnostics. ", err);
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

/**
 * Fetches the list of locally installed solutions and send them to the renderer
 * on the `channelNotifier`.
 *
 * @param {gpii.app.channelNotifier} channelNotifier - The channel notifier to the renderer process.
 * @param {gpii.flowManager.local} flowManager - The local flow manager.
 */
gpii.app.captureTool.channelGetInstalledSolutions = function (channelNotifier, flowManager) {
    flowManager.capture.getInstalledSolutionsForCurrentDevice().then(
        function (data) {
            channelNotifier.events.sendingInstalledSolutions.fire(data);
            var runningSolutions = {};
            fluid.each(data, function (solutionEntry, solutionId) {
                try {
                    var isRunningState = gpii.processReporter.handleIsRunning(solutionEntry);
                    fluid.log("Capture Tool: Running State for: ", solutionId, " Is: ", isRunningState);
                    if (isRunningState) {
                        runningSolutions[solutionId] = solutionEntry;
                    }
                } catch (err) {
                    fluid.log("Capture Tool: Exception trying to look up", solutionEntry, " Error: ", err);
                }
            });
            channelNotifier.events.sendingRunningSolutions.fire(runningSolutions);
        },
        function (err) {
            channelNotifier.events.sendingInstalledSolutions.fire({isError: true, message: err});
        }
    );
};

/**
 * This performs the task of capturing solutions using the flow manager, issuing one call to the flowmanager
 * for each solution. While the flow manager can handle capturing multiple solutions in one invocation, there is a
 * likelihood of unknown situations in the real world with solutions and settings handlers, and a failure
 * in one will cause a failure in the entire capture. Therefore we make one invocation per solution.
 * It causes no real discernable difference in speed.
 *
 * @param {gpii.flowManager.local} flowManager - The local flow manager.
 * @param {String[]} solutionsList - Array of standard solution ID's.
 * @return {fluid.promise} A promise resolving to the full settings capture of all the solutions
 * in `solutionsList`.
 */
gpii.app.captureTool.safelyGetSolutionsCapture = function (flowManager, solutionsList) {
    var promTogo = fluid.promise();
    // Due to the unknown stability of some settings handlers, we are invoking the system capture
    // on each solution individually, so if one fails the capture will still proceed.
    var capturePromises = fluid.transform(fluid.copy(solutionsList), function (solutionId) {
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
        return nextPromise;
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

/**
 * Fetches the entire system capture and sends it to the renderer over the `channelNotifier`.
 *
 * @param {gpii.app.channelNotifier} channelNotifier - The channel notifier to the renderer process.
 * @param {gpii.flowManager.local} flowManager - The local flow manager.
 * @param {Object} args - Optional object contains an array `solutionsList` of solution ID's to capture.
 */
gpii.app.captureTool.channelGetAllSolutionsCapture = function (channelNotifier, flowManager, args) {
    var options = {
        solutionsList: []
    };
    if (args.solutionsList) {
        options.solutionsList = args.solutionsList;
    }

    var result = gpii.app.captureTool.safelyGetSolutionsCapture(flowManager, options.solutionsList);
    result.then(function (data) {
        channelNotifier.events.sendingAllSolutionsCapture.fire(data);
    });
};

/**
 * Sends an update of key in status with username token and preferences up to the renderer process.
 *
 * @param {gpii.app.channelNotifier} channelNotifier - The channel notifier to the renderer process.
 * @param {gpii.app.captureTool} captureTool - Instance of the Capture Tool Dialogue.
 * @param {gpii.flowManager.local} flowManager - The local flow manager.
 */
gpii.app.captureTool.channelModelUpdate = function (channelNotifier, captureTool, flowManager) {
    channelNotifier.events.modelUpdate.fire({
        isKeyedIn: captureTool.model.isKeyedIn,
        keyedInUserToken: captureTool.model.keyedInUserToken,
        preferences: flowManager.pspChannel.model.preferences
    });
};

/**
 * Uses the  local pspChannel flow manager to save the preferences to the cloud.
 *
 * @param {Object} flatSolutionsRegistry - Standard GPII solutions entries with solution ID's acting as the top level
 * keys. (ie. All operating system solutions in one combined set).
 * @param {String} keyedInUserToken - Token for keyed in user to save as.
 * @param {gpii.flowManager.local} flowManager - The local flow manager.
 * @param {Object} options - Data to be saved and any options.
 * @param {String} options.prefSetId - Preference Set ID we are saving.
 * @param {Object} options.preferences - Actual preferences being saved.
 */
gpii.app.captureTool.savePreferences = function (flatSolutionsRegistry, keyedInUserToken, flowManager, options) {
    var payload = {
        contexts: {}
    };

    if (!options.prefSetId) {
        options.prefSetId = uuid.v1();
    }

    payload.contexts[options.prefSetId] = options.prefSetPayload;

    // Note: During the development of the capture tool there has been occasional back and forth discussion as to
    // whether we should be saving the raw application settings, or the transform with some of them going to generic
    // preferences. For the time being we are using application settings as the work better with the validation. GPII-4488.
    // If there was a desire to make the transform before saving, the line below can be used to generate the preferences.
    // var prefsTogo = gpii.lifecycleManager.transformSettingsToPrefs(options.prefSetPayload.preferences, flatSolutionsRegistry);
    //
    // Based on further comments, and notes in https://issues.gpii.net/browse/GPII-4497 this is where we must make
    // the decision point (and in the future this should be configurable here, via IoC, and probably much earlier in the
    // UI workflow based on UX feedback) as to which combination of application specific and generic prefs we are saving.
    // As of this moment, we will be saving all application specific preferences. This allows for zero lossy data, generic
    // prefs can still be calculated from them at any point in the future from the prefs safe.
    var finalPreferences = gpii.app.captureTool.settingsToAllApplicationSpecific(options.prefSetPayload.preferences);

    payload.contexts[options.prefSetId].preferences = finalPreferences;

    flowManager.savePreferences(keyedInUserToken, payload);
};

/**
 * This takes the settings capture and translates it to application specific preferences ready to be saved to the users
 * preferences safe. In practice, this just means prefixing each of the application ID keys with
 * "http://registry.gpii.net/applications/".
 *
 * @param {Object} settings - The captured settings, keyed by application ID.
 * @return {Object} Returns the application specific preferences ready to save.
 */
gpii.app.captureTool.settingsToAllApplicationSpecific = function (settings) {
    var togo = {};
    fluid.each(settings, function (appSettings, appId) {
        var nextBlock = fluid.copy(appSettings);
        fluid.each(nextBlock, function (settingBlock) {
            // SPI Settings Hack to remove the values which will eventually be fixed in GPII-3119
            if (settingBlock.path) {
                fluid.remove_if(settingBlock, function (val, idx) {
                    return idx === "path";
                })
            }
        })
        togo["http://registry.gpii.net/applications/" + appId] = fluid.copy(nextBlock);
    });
    return togo;
};
