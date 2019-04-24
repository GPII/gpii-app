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

var fluid    = require("infusion");
var electron = require("electron");

var ipcMain           = electron.ipcMain;
var gpii              = fluid.registerNamespace("gpii");

require("../common/utils.js");

require("./basic/dialog.js");
require("./basic/blurrable.js");
require("./basic/centeredDialog.js");
require("./basic/resizable.js");
require("./basic/offScreenHidable.js");

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


gpii.app.captureTool.init = function (that, flowManager) {
    ipcMain.on("getInstalledSolutions", function (event /*, arg */) {
        flowManager.capture.getInstalledSolutions().then(
            function (data) {
                event.sender.send("sendingInstalledSolutions", data);
                var runningSolutions = {};
                fluid.each(data, function (solutionEntry, solutionId) {
                    try {
                        console.log("ABOUT TO CHECK PROCESS FOR: ", solutionId);
                        var isRunningState = gpii.processReporter.handleIsRunning(solutionEntry);
                        console.log("RUNNING STATE: ", isRunningState);
                        if (isRunningState) {
                            runningSolutions[solutionId] = solutionEntry;
                        }
                    } catch (err) {
                        console.log("Exception trying to look up", solutionEntry.isRunning);
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
    var payload = {
        contexts: {}
    };

    payload.contexts[options.prefSetId] = options.prefSetPayload;

    flowManager.savePreferences(that.model.keyedInUserToken, payload);
};

gpii.app.captureTool.updateRenderModel = function (that /*, change*/) {
    that.dialog.webContents.send("modelUpdate", {
        isKeyedIn: that.model.isKeyedIn,
        keyedInUserToken: that.model.keyedInUserToken
    });
};
