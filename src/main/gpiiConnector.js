/**
 * The PcpChannel connector
 *
 * Introduces component that manages the connection with the PcpChannel.
 * GPII Application
 * Copyright 2016 Steven Githens
 * Copyright 2016-2017 OCAD University
 *
 * Licensed under the New BSD license. You may not use this file except in
 * compliance with this License.
 * The research leading to these results has received funding from the European Union's
 * Seventh Framework Programme (FP7/2007-2013) under grant agreement no. 289016.
 * You may obtain a copy of the License at
 * https://github.com/GPII/universal/blob/master/LICENSE.txt
 */
"use strict";
require("./utils.js");

var fluid = require("infusion");
var gpii = fluid.registerNamespace("gpii");

/**
 * Responsible for creation and housekeeping of the connection to the PSP Channel WebSocket
 */
fluid.defaults("gpii.app.gpiiConnector", {
    gradeNames: ["gpii.app.ws"],

    events: {
        onPreferencesUpdated: null,
        onSettingUpdated: null,
        onSnapsetNameUpdated: null
    },

    listeners: {
        "onCreate.connect": "{that}.connect",
        "onMessageReceived.parseMessage": {
            funcName: "{gpiiConnector}.parseMessage"
        }
    },

    invokers: {
        parseMessage: {
            funcName: "gpii.app.gpiiConnector.parseMessage",
            args: ["{that}", "{arguments}.0"] // message
        },
        updateSetting: {
            funcName: "gpii.app.gpiiConnector.updateSetting",
            args: ["{that}", "{arguments}.0"] // setting
        },
        updateActivePrefSet: {
            funcName: "gpii.app.gpiiConnector.updateActivePrefSet",
            args: ["{that}", "{arguments}.0"] // newPrefSet
        }
    }
});

/**
 * Sends a setting update request to GPII over the socket if necessary.
 * A request will not be sent if the current and the previous values
 * of the setting coincide.
 * @param gpiiConnector {Component} The `gpii.app.gpiiConnector` instance
 * @param setting {Object} The setting to be changed
 * @param setting.path {String} The id of the setting
 * @param setting.value {String} The new value of the setting
 * @param setting.oldValue {String} Optional - the previous value of
 * the setting
 */
gpii.app.gpiiConnector.updateSetting = function (gpiiConnector, setting) {
    if (fluid.isValue(setting.oldValue) && fluid.model.diff(setting.oldValue, setting.value)) {
        return;
    }

    gpiiConnector.send({
        path: ["settingControls", setting.path, "value"],
        type: "ADD",
        value: setting.value
    });
};

/**
 * Responsible for parsing messages from the GPII socket connection.
 * @param gpiiConnector {Object} The `gpii.app.gpiiConnector` instance
 * @param message {Object} The received message
 */
gpii.app.gpiiConnector.parseMessage = function (gpiiConnector, message) {
    var payload = message.payload || {},
        operation = payload.type,
        path = payload.path,
        preferences;

    if ((operation === "ADD" && path.length === 0) ||
            operation === "DELETE") {
        /*
         * Preferences change update has been received
         */
        var snapsetName = gpii.app.extractSnapsetName(payload);
        gpiiConnector.events.onSnapsetNameUpdated.fire(snapsetName);

        preferences = gpii.app.extractPreferencesData(payload);
        gpiiConnector.events.onPreferencesUpdated.fire(preferences);
    } else if (operation === "ADD") {
        /*
         * Setting change update has been received
         */
        var settingPath = path[path.length - 2],
            settingValue = payload.value;

        gpiiConnector.events.onSettingUpdated.fire({
            path: settingPath,
            value: settingValue
        });
    }
};

/**
 * Send active set change request to GPII.
 *
 * @param gpiiConnector {Object} The `gpii.app.gpiiConnector` instance
 * @param newPrefSet {String} The id of the new preference set
 */
gpii.app.gpiiConnector.updateActivePrefSet = function (gpiiConnector, newPrefSet) {
    gpiiConnector.send({
        path: ["activeContextName"],
        type: "ADD",
        value: newPrefSet
    });
};

/**
 * Creates a setting view model to be used in the settings window.
 * @param key {String} The name of the setting. Must be unique as
 * subsequent requests to the GPII API will use this key as identifier.
 * @param settingDescriptor {Object} A descriptor for the given setting
 * containing its title, description and constraints regarding its value.
 * @return {Object} The view model for the setting.
 */
gpii.app.createSettingModel = function (key, settingDescriptor) {
    return {
        path: key,
        value: settingDescriptor.value,
        solutionName: settingDescriptor.solutionName,

        schema: settingDescriptor.schema,

        // XXX hardcoded as they're not currently supported by the API (pcpChannel)
        icon: fluid.module.resolvePath("%gpii-app/src/icons/gear-cloud-white.png"),
        liveness: settingDescriptor.liveness || "live",
        memory: fluid.isValue(settingDescriptor.memory) ? settingDescriptor.memory : true
    };
};

/**
 * Extracts data for the user's preference sets (including the active preference
 * set and the applicable settings) from the message received when the user keys in
 * or out.
 * @param message {Object} The message sent when the user keys is or out (a JSON
 * object).
 * @return {Object} An object containing all preference sets, the active preference
 * set and the corresponding settings.
 */
gpii.app.extractPreferencesData = function (message) {
    var value = message.value || {},
        preferences = value.preferences || {},
        contexts = preferences.contexts,
        settingControls = value.settingControls,
        sets = [],
        activeSet = value.activeContextName || null,
        settings = [];

    if (contexts) {
        sets = fluid.hashToArray(contexts, "path");
    }

    if (settingControls) {
        settings = fluid.values(
            fluid.transform(settingControls, function (settingDescriptor, settingKey) {
                return gpii.app.createSettingModel(settingKey, settingDescriptor);
            })
        );
    }

    return {
        sets: sets,
        activeSet: activeSet,
        settings: settings
    };
};

/**
 * Extracts the user-friendly snapset name form the message received when the user
 * keys in or out.
 * @param message {Object} The message sent when the user keys is or out (a JSON
 * object).
 * @return {String} The user-friendly snapset name.
 */
gpii.app.extractSnapsetName = function (message) {
    var value = message.value || {},
        preferences = value.preferences || {};
    return preferences.name;
};

/**
 * Extension of `gpiiController` used for dev purposes.
 */
fluid.defaults("gpii.app.dev.gpiiConnector", {
    gradeNames: ["gpii.app.gpiiConnector"],

    events: {
        mockPrefSets: {
            event: "onPreferencesUpdated",
            args: "@expand:gpii.app.dev.gpiiConnector.mockPreferences({arguments}.0)"
        }
    }
});


/**
 * A decorator for the extracted preferences that applies values that are to be used
 * for development.
 */
gpii.app.dev.gpiiConnector.mockPreferences = function (preferences) {
    function applyManualLivenessFlag(settings) {
        settings.forEach(function (setting) {
            // XXX a workaround as the Magnifier settings are missing the `solutionName` property
            if (setting.path.match("common\/magnifi")) {
                setting.liveness = "manualRestart";
            }
        });
    }

    function applyOsLivenessFlag(settings) {
        settings.forEach(function (setting) {
            if (setting.path.match("common\/speechControl")) {
                setting.liveness = "OSRestart";
            }
        });
    }

    if (preferences) {
        applyManualLivenessFlag(preferences.settings);
        applyOsLivenessFlag(preferences.settings);
    }
};
