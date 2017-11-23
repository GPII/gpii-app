/*!
GPII Application
Copyright 2016 Steven Githens
Copyright 2016-2017 OCAD University

Licensed under the New BSD license. You may not use this file except in
compliance with this License.
The research leading to these results has received funding from the European Union's
Seventh Framework Programme (FP7/2007-2013) under grant agreement no. 289016.
You may obtain a copy of the License at
https://github.com/GPII/universal/blob/master/LICENSE.txt
*/
"use strict";
require("./utils.js");

var fluid = require("infusion");
var ws    = require("ws");

var gpii = fluid.registerNamespace("gpii");

/**
 * Responsible for creation and housekeeping of the connection to the PSP Channel WebSocket
 */
fluid.defaults("gpii.app.gpiiConnector", {
    gradeNames: "fluid.component",

    // Configuration regarding the socket connection
    config: {
        gpiiWSUrl: "ws://localhost:8081/pcpChannel"
    },

    members: {
        socket: "@expand:gpii.app.gpiiConnector.createGPIIConnection({that}.options.config)"
    },

    events: {
        onPreferencesUpdated: null,
        onSettingUpdated: null,
        onSnapsetNameUpdated: null
    },

    listeners: {
        "onCreate.register": {
            funcName: "{gpiiConnector}.registerPSPListener"
        },
        "onDestroy.closeConnection": {
            listener: "{that}.closeConnection"
        }
    },

    invokers: {
        registerPSPListener: {
            funcName: "gpii.app.gpiiConnector.registerPSPListener",
            args: ["{that}.socket", "{that}"]
        },
        updateSetting: {
            funcName: "gpii.app.gpiiConnector.updateSetting",
            args: ["{that}.socket", "{arguments}.0"]
        },
        updateActivePrefSet: {
            funcName: "gpii.app.gpiiConnector.updateActivePrefSet",
            args: ["{that}.socket", "{arguments}.0"]
        },
        closeConnection: {
            this: "{that}.socket",
            method: "close",
            // for ref https://developer.mozilla.org/en-US/docs/Web/API/CloseEvent#Status_codes
            args: [1000]
        }
    }
});

/**
 * Sends setting update request to GPII over the socket if necessary.
 * A request will not be sent if the current and the previous values
 * of the setting coincide.
 *
 * @param socket {Object} The already connected WebSocket instance
 * @param setting {Object} The setting to be changed
 * @param setting.path {String} The id of the setting
 * @param setting.value {String} The new value of the setting
 * @param setting.oldValue {String} Optional - the previous value of
 * the setting
 */
gpii.app.gpiiConnector.updateSetting = function (socket, setting) {
    if (fluid.isValue(setting.oldValue) && gpii.app.equalsAsJSON(setting.oldValue, setting.value)) {
        return;
    }

    var payload = JSON.stringify({
        path: ["settingControls", setting.path, "value"],
        type: "ADD",
        value: setting.value
    });

    socket.send(payload);
};

/**
 * Opens a connection to the PSP Channel WebSocket.
 * @param config {Object} The configuration for the WebSocket
 */
gpii.app.gpiiConnector.createGPIIConnection = function (config) {
    return new ws(config.gpiiWSUrl); // eslint-disable-line new-cap
};

/**
 * Register listeners for messages from the GPII socket connection.
 * @param socket {Object} The connected gpii socket
 * @param gpiiConnector {Object} The `gpii.app.gpiiConnector` instance
 */
// TODO rename
gpii.app.gpiiConnector.registerPSPListener = function (socket, gpiiConnector) {
    socket.on("message", function (rawData) {
        var data = JSON.parse(rawData),
            operation = data.type,
            path = data.path,
            preferences;

        if ((operation === "ADD" && path.length === 0) ||
                operation === "DELETE") {
            /*
             * Preferences change update has been received
             */
            var snapsetName = gpii.app.extractSnapsetName(data);
            gpiiConnector.events.onSnapsetNameUpdated.fire(snapsetName);

            preferences = gpii.app.extractPreferencesData(data);
            gpiiConnector.events.onPreferencesUpdated.fire(preferences);
        } else if (operation === "ADD") {
            /*
             * Setting change update has been received
             */
            var settingPath = path[path.length - 2],
                settingValue = data.value;

            gpiiConnector.events.onSettingUpdated.fire({
                path: settingPath,
                value: settingValue
            });

            // TODO add better mocked logic
        }
    });
};

/**
 * Send active set change request to GPII.
 *
 * @param socket {ws} The already connected `ws`(`WebSocket`) instance
 * @param newPrefSet {String} The id of the new preference set
 */
gpii.app.gpiiConnector.updateActivePrefSet = function (socket, newPrefSet) {
    var payload = JSON.stringify({
        path: ["activeContextName"],
        type: "ADD",
        value: newPrefSet
    });

    socket.send(payload);
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
        icon: "../../icons/gear-cloud-white.png",
        liveness: "manualRestart",
        memory: true
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
    var value = message.value || {};
    // TODO: Change this when the API supports user-friendly snapset names.
    return gpii.app.capitalize(value.userToken);
};
