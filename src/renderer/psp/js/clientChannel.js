/*!
Copyright 2017 Raising the Floor - International

Licensed under the New BSD license. You may not use this file except in
compliance with this License.
The research leading to these results has received funding from the European Union's
Seventh Framework Programme (FP7/2007-2013) under grant agreement no. 289016.
You may obtain a copy of the License at
https://github.com/GPII/universal/blob/master/LICENSE.txt
*/

/* global fluid */

"use strict";
(function (fluid) {
    var gpii = fluid.registerNamespace("gpii"),
        ipcRenderer = require("electron").ipcRenderer;
    fluid.registerNamespace("gpii.psp.clientChannel");

    /**
     * A function which should be called when the PSP window needs to be
     * closed. It simply notifies the main electron process for this.
     */
    gpii.psp.clientChannel.closePSP = function () {
        ipcRenderer.send("onPSPClose");
    };

    /**
     * Notifies the main electron process that the user must be keyed out.
     */
    gpii.psp.clientChannel.keyOut = function () {
        ipcRenderer.send("onKeyOut");
    };

    /**
     * A function which should be called whenever a settings is updated
     * as a result of a user's input. Its purpose is to notify the main
     * electron process for the change.
     * @param path {String} The path of the updated setting.
     * @param value {Any} The new, updated value for the setting. Can be
     * of different type depending on the setting.
     */
    gpii.psp.clientChannel.alterSetting = function (path, value, oldValue, liveness, solutionName) {
        ipcRenderer.send("onSettingAltered", {
            path: path,
            value: value,
            oldValue: oldValue,
            liveness: liveness,
            solutionName: solutionName
        });
    };

    /**
     * A function which should be called when the active preference set
     * has been changed as a result of a user's input. It will notify
     * the main electron process for the change.
     * @param value {String} The path of the new active preference set.
     */
    gpii.psp.clientChannel.alterActivePreferenceSet = function (value) {
        ipcRenderer.send("onActivePreferenceSetAltered", {
            value: value
        });
    };

    /**
     * A function which should be called whenever the total height of the
     * PSP `BrowserWindow` changes.
     * @param height {Number} The new height of the PSP `BrowserWindow`.
     */
    gpii.psp.clientChannel.changeContentHeight = function (height) {
        ipcRenderer.send("onContentHeightChanged", height);
    };

    gpii.psp.clientChannel.restartNow = function () {
        ipcRenderer.send("onRestartNow");
    };

    gpii.psp.clientChannel.restartLater = function () {
        ipcRenderer.send("onRestartLater");
    };

    gpii.psp.clientChannel.undoChanges = function () {
        ipcRenderer.send("onUndoChanges");
    };

    /**
     * Initializes the `clientChannel` component by registering listeners
     * for various messages sent by the main process.
     * @param clientChannel {Component} The `clientChannel` component.
     */
    gpii.psp.clientChannel.initialize = function (clientChannel) {
        ipcRenderer.on("onPreferencesUpdated", function (event, preferences) {
            clientChannel.events.onPreferencesUpdated.fire(preferences);
        });

        ipcRenderer.on("onSettingUpdated", function (event, settingData) {
            clientChannel.events.onSettingUpdated.fire(settingData.path, settingData.value);
        });

        ipcRenderer.on("onAccentColorChanged", function (event, accentColor) {
            clientChannel.events.onAccentColorChanged.fire(accentColor);
        });

        ipcRenderer.on("onRestartRequired", function (event, pendingChanges) {
            clientChannel.events.onRestartRequired.fire(pendingChanges);
        });
    };

    /**
     * Responsible for communication between the main and the renderer
     * processes.
     */
    fluid.defaults("gpii.psp.clientChannel", {
        gradeNames: ["fluid.component"],
        events: {
            onPreferencesUpdated: null,
            onSettingUpdated: null,
            onAccentColorChanged: null,
            onRestartRequired: null
        },
        listeners: {
            "onCreate.initClientChannel": {
                funcName: "gpii.psp.clientChannel.initialize",
                args: ["{that}"]
            }
        },
        invokers: {
            close: {
                funcName: "gpii.psp.clientChannel.closePSP"
            },
            keyOut: {
                funcName: "gpii.psp.clientChannel.keyOut"
            },
            alterSetting: {
                funcName: "gpii.psp.clientChannel.alterSetting"
            },
            alterActivePreferenceSet: {
                funcName: "gpii.psp.clientChannel.alterActivePreferenceSet"
            },
            changeContentHeight: {
                funcName: "gpii.psp.clientChannel.changeContentHeight"
            },
            restartNow: {
                funcName: "gpii.psp.clientChannel.restartNow"
            },
            restartLater: {
                funcName: "gpii.psp.clientChannel.restartLater"
            },
            undoChanges: {
                funcName: "gpii.psp.clientChannel.undoChanges"
            }
        }
    });
})(fluid);
