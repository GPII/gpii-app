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
var groupingTemplate = fluid.require("%gpii-app/testData/grouping/groupingTemplate.json");
var gpii = fluid.registerNamespace("gpii");

/**
 * Responsible for creation and housekeeping of the connection to the PSP Channel WebSocket
 */
fluid.defaults("gpii.app.gpiiConnector", {
    gradeNames: ["gpii.app.ws"],

    events: {
        onPreferencesUpdated: null,
        onSettingUpdated: null,
        onSnapsetNameUpdated: null,
        groupSettings: {
            event: "onMessageReceived",
            args: {
                expander: {
                    funcName: "gpii.app.gpiiConnector.groupSettings",
                    args: [
                        groupingTemplate,
                        "{arguments}.0" // message
                    ]
                }
            }
        }
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
 * Creates recursively a `settingControls` object given a template settings
 * group or a setting which may have subsettings and the original `settingControls`
 * object that was received via the PSP channel.
 * @param element {Object} An object (group of settings or an individual setting)
 * which has settings.
 * @param groupSolutionName {String} The solutionName (i.e. the application to which
 * this group pertains) of the group. If it is specified, none of the settings
 * (including subsettings) within the group will have a solution name. If not specified,
 * the solution name for each setting will be used (if provided).
 * @param messageSettingControls {Object} The `settingControls` object received
 * via the PSP channel
 * @return a `settingControls` object for the passed `element` which will include
 * information about the settings available for that element.
 */
gpii.app.gpiiConnector.getSettingControls = function (element, groupSolutionName, messageSettingControls) {
    var settingControls = {};

    fluid.each(element.settings, function (setting) {
        var path = setting.path,
            settingDescriptor = messageSettingControls[path];
        if (settingDescriptor) {
            settingControls[path] = fluid.copy(settingDescriptor);

            // No need for a solution name if the group already has one.
            if (groupSolutionName) {
                delete settingControls[path].solutionName;
            }

            // Calculate the `settingControls` object for the subsettings if any.
            if (setting.settings) {
                var subsettingControls =
                    gpii.app.gpiiConnector.getSettingControls(setting, groupSolutionName, messageSettingControls);
                if (gpii.app.isHashNotEmpty(subsettingControls)) {
                    settingControls[path].settingControls = subsettingControls;
                }
            }

            // Add a flag to the original setting descriptor to indicate that the setting
            // has been assigned to a group. Needed to determine which settings should go
            // into the default group.
            settingDescriptor.grouped = true;
        }
    });

    return settingControls;
};

/**
 *Given the `settingControls` object which was part of the message received
 * via the PSP channel, this function creates setting groups based on the
 * `groupingTemplate`. Each object in the resulting array represents a single
 * group that is to be visualized in the PSP and will definitely have at least
 * one setting present.
 * @param groupingTemplate {Array} A template array which serves for constructing
 * setting groups.
 * @result {Object[]} An array of setting groups each of which containing at
 * least one setting.
 */
gpii.app.gpiiConnector.createGroupsFromTemplate = function (groupingTemplate, messageSettingControls) {
    return fluid.copy(groupingTemplate)
        .map(function (templateGroup) {
            return {
                name: templateGroup.name,
                solutionName: templateGroup.solutionName,
                settingControls: gpii.app.gpiiConnector.getSettingControls(templateGroup, templateGroup.solutionName, messageSettingControls)
            };
        })
        .filter(function (settingGroup) {
            return gpii.app.isHashNotEmpty(settingGroup.settingControls);
        });
};

/**
 *Given the `settingControls` object which was part of the message received
 * via the PSP channel, this function creates a default group of settings, i.e.
 * it will contain all settings which have not been assigned to other groups
 * based on the `groupingTemplate`.
 * @param messageSettingControls {Object} The `settingControls` object from the
 * PSP channel message.
 * @result {Object} The default group or `undefined` if there are no settings
 * which do not belong to other groups.
 */
gpii.app.gpiiConnector.createDefaultGroup = function (messageSettingControls) {
    var defaultGroup = {
        settingControls: {}
    };

    fluid.each(messageSettingControls, function (settingDescriptor, path) {
        if (!settingDescriptor.grouped) {
            defaultGroup.settingControls[path] = fluid.copy(settingDescriptor);
        }
    });

    if (gpii.app.isHashNotEmpty(defaultGroup.settingControls)) {
        return defaultGroup;
    }
};

/**
 * Transforms the message received via the PSP channel by adapting it
 * to the format expected by the PSP. The main thing that this function
 * does is to create groups of settings. Each group has a name and a set
 * of settings each of which can also have settings.
 * @param groupingTemplate {Array} A template array which serves for constructing
 * setting groups. Each group within the template must have a `settings` element
 * which specifies the paths and possibly the subsettings of these settings, and
 * optionally a `name` which will be displayed as a title for the group and a
 * `solutionName` which will be used in the restart warning text.
 * @param message {Object} The received message.
 */
gpii.app.gpiiConnector.groupSettings = function (groupingTemplate, message) {
    var payload = message.payload || {},
        operation = payload.type,
        path = payload.path,
        value = payload.value || {},
        messageSettingControls = value.settingControls;

    if (operation === "ADD" && path.length === 0 && messageSettingControls) {
        // First, add the groups which can be constructed from the grouping template
        value.settingGroups = gpii.app.gpiiConnector.createGroupsFromTemplate(groupingTemplate, messageSettingControls);

        // Then create a default group with all settings that have not yet been assigned
        // to other groups.
        var defaultGroup = gpii.app.gpiiConnector.createDefaultGroup(messageSettingControls);
        if (defaultGroup) {
            value.settingGroups.unshift(defaultGroup);
        }

        // Remove the `settingControls` element as it is no longer needed.
        delete value.settingControls;
    }

    return message;
};

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
 * For a given element which can be either a group of settings or a single setting,
 * this function converts the `settingsControls` object into an array of setting
 * objects which can be used in the PSP `BrowserWindow`. The function is called
 * recursively for every other nested element which may have `settingControls`.
 * @param element {Object} An object (group of settings or an individual setting)
 * which has settings.
 * @return {Array} An array of settings. Each of them must have a `schema` property
 * which contains the setting's name, description, type and possible values, as well
 * as a `value` property specifying the current setting value. The `solutionName`,
 * `liveness` (describing whether a change to a setting's value requires a restart)
 * and `memory` (whether a change to a setting's value is persisted) properties are
 * optional.
 */
gpii.app.extractSettings = function (element) {
    return fluid.hashToArray(element.settingControls, "path", function (setting, settingDescriptor) {
        setting.value = settingDescriptor.value;
        setting.solutionName = settingDescriptor.solutionName;
        setting.schema = settingDescriptor.schema;

        // XXX hardcoded as they're not currently supported by the API (pcpChannel)
        setting.liveness = settingDescriptor.liveness || "live";
        setting.memory = fluid.isValue(settingDescriptor.memory) ? settingDescriptor.memory : true;

        // Call recursively for the subsettings
        if (settingDescriptor.settingControls) {
            setting.settings = gpii.app.extractSettings(settingDescriptor);
        }
    });
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
        sets = [],
        activeSet = value.activeContextName || null,
        settingGroups = [];

    if (contexts) {
        sets = fluid.hashToArray(contexts, "path");
    }

    if (value.settingGroups) {
        settingGroups = fluid.transform(value.settingGroups, function (settingGroup) {
            return {
                name: settingGroup.name,
                solutionName: settingGroup.solutionName,
                settings: gpii.app.extractSettings(settingGroup)
            };
        });
    }

    return {
        sets: sets,
        activeSet: activeSet,
        settingGroups: settingGroups
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
    function applyLivenessFlag(settings) {
        fluid.each(settings, function (setting) {
            // XXX a workaround as the Magnifier settings are missing the `solutionName` property
            if (setting.path.match("common\/magnifi")) {
                setting.liveness = "manualRestart";
            } else if (setting.path.match("common\/speechControl")) {
                setting.liveness = "OSRestart";
            }

            if (setting.settings) {
                applyLivenessFlag(setting.settings);
            }
        });
    }

    function applyPrefSetSound(prefSets) {
        prefSets.forEach(function (prefSet, index) {
            var soundSrc = (index % 2 === 0) ? "sound1.mp3" : "sound2.mp3",
                resolvedSrc = fluid.module.resolvePath("%gpii-app/src/sounds/" + soundSrc);
            prefSet.soundSrc = resolvedSrc;
        });
    }

    if (preferences) {
        applyPrefSetSound(preferences.sets);
        fluid.each(preferences.settingGroups, function (settingGroup) {
            applyLivenessFlag(settingGroup.settings);
        });
    }
};
