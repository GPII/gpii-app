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

var ipcMain           = electron.ipcMain,
    systemPreferences = electron.systemPreferences;
var gpii              = fluid.registerNamespace("gpii");

require("../common/utils.js");

require("./basic/dialog.js");
require("./basic/blurrable.js");
require("./basic/centeredDialog.js");
require("./basic/resizable.js");
require("./basic/scaledDialog.js");
require("./basic/offScreenHidable.js");

fluid.defaults("gpii.app.captureTool", {
    gradeNames: [
        "gpii.app.dialog",
        "gpii.app.centeredDialog",
        "fluid.modelComponent"
    ],
    model: {

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

            frame: true,
            resizable: true,
            transparent: false, // needs to be false to enable resizing and maximizing
            movable: true,
            minimizable: true,
            maximizable: true,
            autoHideMenuBar: true,
            titleBarStyle: "hidden"
        },
    },

    listeners: {
        onCreate: [
            {
                func: "{that}.show"
            },
            {
                funcName: "gpii.app.captureTool.init",
                args: ["{that}", "{flowManager}", "{gpii.processReporter}"]
            }
        ]
    }
});

gpii.app.captureTool.init = function (that, flowManager, processReporter) {
    ipcMain.on('getInstalledSolutions', (event, arg) => {
        flowManager.capture.getInstalledSolutions().then(
            function (data) {
                event.sender.send('sendingInstalledSolutions', data);
                var runningSolutions = {};
                fluid.each(data, function (solutionEntry, solutionId) {
                    try {
                        var isRunningState = gpii.processReporter.handleIsRunning(solutionEntry);
                        if (isRunningState) {
                            runningSolutions[solutionId] = solutionEntry;
                        }
                    } catch (err) {
                        console.log("Exception trying to look up", solutionEntry.isRunning);
                    }
                })
                event.sender.send('sendingRunningSolutions', runningSolutions);  
            },
            function (err) {
                event.sender.send('sendingInstalledSolutions', "Damn, it didn't work");
            }
        );
    })

    ipcMain.on("getAllSolutionsCapture", (event, arg) => {
        var options = {};
        if (arg.solutionsList) {
            options.solutionsList = arg.solutionsList;
        }
        flowManager.capture.getSystemSettingsCapture(options).then(
            function (data) {
                event.sender.send('sendingAllSolutionsCapture', data);
            },
            function (err) {
                event.sender.send('sendingAllSolutionsCapture', "Damn, it didn't work");
            }
        );
    });

    ipcMain.on("captureDoneButton", (event, arg) => {
        that.close();
    });
};