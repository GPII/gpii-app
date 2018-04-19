/**
 * Client channel for IPC communication
 *
 * Defines a component responsible for the communication between the main and the
 * renderer processes.
 * Copyright 2017 Raising the Floor - International
 *
 * Licensed under the New BSD license. You may not use this file except in
 * compliance with this License.
 * The research leading to these results has received funding from the European Union's
 * Seventh Framework Programme (FP7/2007-2013) under grant agreement no. 289016.
 * You may obtain a copy of the License at
 * https://github.com/GPII/universal/blob/master/LICENSE.txt
 */

/* global fluid */

"use strict";
(function (fluid) {
    var gpii = fluid.registerNamespace("gpii"),
        ipcRenderer = require("electron").ipcRenderer;
    fluid.registerNamespace("gpii.psp.clientChannel");

    /**
     * Sends asynchronously a message to the main process.
     * @param channel {String} The channel via which the message will
     * be sent
     * @oaram message {Any} The actual message that is to be sent.
     */
    gpii.psp.clientChannel.sendMessage = function (channel, message) {
        ipcRenderer.send(channel, message);
    };

    /**
     * A function which should be called whenever a settings is updated
     * as a result of a user's input. Its purpose is to notify the main
     * electron process for the change.
     * @param clientChannel {Component} The `gpii.psp.clientChannel`
     * instance.
     * @param setting {Object} The setting which has been updated.
     * @param oldValue {Any} The old value of the setting.
     */
    gpii.psp.clientChannel.alterSetting = function (clientChannel, setting, oldValue) {
        setting = fluid.extend(true, {}, setting, {
            oldValue: oldValue
        });
        clientChannel.sendMessage("onSettingAltered", setting);
    };

    /**
     * Initializes the `clientChannel` component by registering listeners
     * for various messages sent by the main process.
     * @param clientChannel {Component} The `clientChannel` component.
     */
    gpii.psp.clientChannel.initialize = function (clientChannel) {
        ipcRenderer.on("onPSPOpen", function () {
            clientChannel.events.onPSPOpen.fire();
        });

        ipcRenderer.on("onPreferencesUpdated", function (event, preferences) {
            clientChannel.events.onPreferencesUpdated.fire(preferences);
        });

        ipcRenderer.on("onSettingUpdated", function (event, settingData) {
            clientChannel.events.onSettingUpdated.fire(settingData.path, settingData.value);
        });

        ipcRenderer.on("onAccentColorChanged", function (event, accentColor) {
            clientChannel.events.onAccentColorChanged.fire(accentColor);
        });

        ipcRenderer.on("onThemeChanged", function (event, theme) {
            clientChannel.events.onThemeChanged.fire(theme);
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
            onPSPOpen: null,
            onPreferencesUpdated: null,
            onSettingUpdated: null,
            onAccentColorChanged: null,
            onThemeChanged: null,
            onRestartRequired: null
        },
        listeners: {
            "onCreate.initClientChannel": {
                funcName: "gpii.psp.clientChannel.initialize",
                args: ["{that}"]
            }
        },
        invokers: {
            sendMessage: {
                funcName: "gpii.psp.clientChannel.sendMessage"
            },
            close: {
                func: "{that}.sendMessage",
                args: ["onPSPClose"]
            },
            keyOut: {
                func: "{that}.sendMessage",
                args: ["onKeyOut"]
            },
            alterSetting: {
                funcName: "gpii.psp.clientChannel.alterSetting",
                args: [
                    "{that}",
                    "{arguments}.0", // setting
                    "{arguments}.1"  // oldValue
                ]
            },
            alterActivePreferenceSet: {
                func: "{that}.sendMessage",
                args: [
                    "onActivePreferenceSetAltered",
                    "{arguments}.0" // message
                ]
            },
            changeContentHeight: {
                func: "{that}.sendMessage",
                args: [
                    "onContentHeightChanged",
                    "{arguments}.0" // message
                ]
            },
            restartNow: {
                func: "{that}.sendMessage",
                args: [
                    "onRestartNow",
                    "{arguments}.0" // pendingChanges
                ]
            },
            undoChanges: {
                func: "{that}.sendMessage",
                args: [
                    "onUndoChanges",
                    "{arguments}.0" // pendingChanges
                ]
            }
        }
    });
})(fluid);
