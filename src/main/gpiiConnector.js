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
        resolveAssetPaths: {
            event: "onPreferencesUpdated",
            args: {
                expander: {
                    funcName: "gpii.app.gpiiConnector.resolveAssetPaths",
                    args: [
                        "{assetsManager}",
                        "{arguments}.0" // preferences
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
 * Modifies the passed `preferences` by resolving paths to any assets which
 * may be specified as properties of the preference sets.
 * @param {Component} assetsManager - The `gpii.app.assetsManager` instance.
 * @param {Object} preferences - The preferences received via the PSP channel.
 */
gpii.app.gpiiConnector.resolveAssetPaths = function (assetsManager, preferences) {
    if (preferences) {
        fluid.each(preferences.sets, function (prefSet) {
            var imageMapKeys = fluid.keys(prefSet.imageMap);
            fluid.each(imageMapKeys, function (imageMapKey) {
                prefSet.imageMap[imageMapKey] =
                    assetsManager.resolveAssetPath(prefSet.imageMap[imageMapKey]);
            });
        });
    }
};

/**
 * Sends a setting update request to GPII over the socket if necessary.
 * A request will not be sent if the current and the previous values
 * of the setting coincide.
 * @param {Component} gpiiConnector - The `gpii.app.gpiiConnector` instance
 * @param {Object} setting - The setting to be changed
 * @param {String} setting.path - The id of the setting
 * @param {String} setting.value - The new value of the setting
 * @param {String} setting.oldValue - Optional - the previous value of
 * the setting.
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
 * @param {Object} gpiiConnector - The `gpii.app.gpiiConnector` instance
 * @param {Object} message - The received message
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

        console.log("SETTING UPDATE: ", settingPath, settingValue);

        gpiiConnector.events.onSettingUpdated.fire({
            path: settingPath,
            value: settingValue
        });
    }
};

/**
 * Send active set change request to GPII.
 *
 * @param {Object} gpiiConnector - The `gpii.app.gpiiConnector` instance
 * @param {String} newPrefSet - The id of the new preference set
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
 * @param {Object} element - An object (group of settings or an individual setting)
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
 * @param {Object} message - The message sent when the user keys is or out (a JSON
 * object).
 * @return {Object} An object containing all preference sets, the active preference
 * set and the corresponding settings.
 */
gpii.app.extractPreferencesData = function (message) {
    var value = message.value || {},
        // Whether the PSP should be closed when the user clicks outside. The default
        // value is `true` (in case this is not specified in the payload). Note that
        // the latter will always be the case in the keyed out payload!
        closePSPOnBlur = fluid.isValue(value.closePSPOnBlur) ? value.closePSPOnBlur : true,
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
        settingGroups: settingGroups,
        closePSPOnBlur: closePSPOnBlur
    };
};

/**
 * Extracts the user-friendly snapset name form the message received when the user
 * keys in or out.
 * @param {Object} message - The message sent when the user keys is or out (a JSON
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
        },
        groupSettings: {
            event: "onMessageReceived",
            args: {
                expander: {
                    funcName: "gpii.app.dev.gpiiConnector.groupSettings",
                    args: [
                        groupingTemplate,
                        "{arguments}.0" // message
                    ]
                }
            }
        }
    }
});


/*
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

    function applyPrefSetImages(prefSets) {
        var whiteThemeimages = ["paris.jpg", "mountains.jpg", "lights.jpg"],
            darkThemeimages = ["nature_wide.jpg", "fjords_wide.jpg", "mountains_wide.jpg"];

        prefSets.forEach(function (prefSet, index) {
            prefSet.imageMap = {
                white: whiteThemeimages[index % whiteThemeimages.length],
                dark: darkThemeimages[index % darkThemeimages.length]
            };
        });
    }

    if (preferences) {
        applyPrefSetImages(preferences.sets);

        fluid.each(preferences.settingGroups, function (settingGroup) {
            applyLivenessFlag(settingGroup.settings);
        });
    }
};

/**
 * An object containing information about the type of the setting and its possible
 * values, as well as some additional meta information.
 * @typedef {Object} SettingSchema
 * @property {String} title The name of the setting which is displayed to the user.
 * @property {String} description Contains additional information about the setting.
 * @property {String} type The type of the setting which will later on determine the
 * widget which will be used to visually represent the setting. Possible values are
 * "boolean", "string", "array", "number".
 * @property {Number} [min] The minimal value a setting with a type "number" can have.
 * @property {Number} [max] The maximal value a setting with a type "number" can have.
 * @property {Number} [divisibleBy] The setting's value must be a multiple of this
 * number.
 * @property {String[]} [enum] An array of the values which a "string" type setting
 * can have.
 */


/**
 * Represents a setting as described in the PSP channel message.
 * @typedef {Object} ChannelSettingDescriptor
 * @property {String|Number|Array|Boolean} value The value of the setting. The type
 * of this property depends on the `schema.type` property.
 * @property {SettingSchema} schema
 * @property {String} [solutionName] The application to which this setting belongs.
 * @property {String} [liveness] Describes whether a change in the setting value will
 * require a restart of either an application or the whole OS. Possible values are
 * "live", "liveRestart", "manualRestart", "OSRestart".
 * @property {Boolean} [memory] Will have a `true` value if the setting's value will
 * be persisted in the cloud when modified, and `false` otherwise.
 */


/**
  * Represents the `settingControls` object from the PSP channel message. Contains
  * information about each setting that is to be displayed in the PSP. Each key in
  * this hash is a unique setting's path.
  * @typedef {Object.<String, ChannelSettingDescriptor>} ChannelSettingControls
  */


/**
 * Represents a setting after the grouping transformation has been applied to the
 * original PSP channel message. Almost identical to the ChannelSettingDescriptor
 * except for the possible presence of a nested PSPSettingDescriptor object.
 * @typedef {Object} PSPSettingDescriptor
 * @property {String|Number|Array|Boolean} value @see ChannelSettingDescriptor.value.
 * @property {SettingSchema} schema
 * @property {PSPSettingDescriptor} [settingControls] Represents the subsettings
 * (if any) which this setting has.
 * @property {String} [solutionName] @see ChannelSettingDescriptor.solutionName.
 * @property {String} [liveness] @see ChannelSettingDescriptor.liveness.
 * @property {Boolean} [memory] @see ChannelSettingDescriptor.memory.
 */


/**
 * Represents the `settingControls` object obtained after the original message received
 * via the PSP channel has been modified so that grouping is applied to its settings.
 * Each key in this hash is a unique setting's path.
 * @typedef {Object.<String, PSPSettingDescriptor>} PSPSettingControls
 */


/**
 * Represents a group of setting created when the grouping algorithm is applied to the
 * original PSP channel message.
 * @typedef {Object} PSPSettingGroup
 * @property {String} [name] The name of the group.
 * @property {String} [solutionName] The application whose restart will be needed if a
 * setting in this group is modified. It will be used in the restart warning message.
 * @property {PSPSettingControls} settingControls
 */


/**
 * Creates recursively a PSPSettingControls object given a template settings
 * group or a setting which may have subsettings and a ChannelSettingControls object.
 * @param {Object} element - An object (group of settings or an individual setting)
 * which has settings.
 * @param {String} groupSolutionName - The solutionName (i.e. the application to which
 * this group pertains) of the group. If it is specified, none of the settings
 * (including subsettings) within the group will have a solution name. If not specified,
 * the solution name for each setting will be used (if provided).
 * @param {ChannelSettingControls} channelSettingControls the `settingControls` object
 * from the PSP channel message
 * @return {PSPSettingControls} The resulting PSPSettingControls object.
 */
gpii.app.dev.gpiiConnector.getSettingControls = function (element, groupSolutionName, channelSettingControls) {
    var settingControls = {};

    fluid.each(element.settings, function (setting) {
        var path = setting.path,
            settingDescriptor = channelSettingControls[path];
        if (settingDescriptor) {
            settingControls[path] = fluid.copy(settingDescriptor);

            // No need for a solution name if the group already has one.
            if (groupSolutionName) {
                delete settingControls[path].solutionName;
            }

            // Calculate the `settingControls` object for the subsettings if any.
            if (setting.settings) {
                var subsettingControls =
                    gpii.app.dev.gpiiConnector.getSettingControls(setting, groupSolutionName, channelSettingControls);
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
 * Given a ChannelSettingControls object, this function creates setting groups
 * based on the `groupingTemplate`. Each object in the resulting array represents a
 * single group that is to be visualized in the PSP and will definitely have at least
 * one setting present.
 * @param {Array} groupingTemplate - A template array which serves for constructing
 * setting groups.
 * @param {ChannelSettingControls} channelSettingControls - the `settingControls` object
 * from the PSP channel message
 * @return {PSPSettingGroup[]} An array of setting groups each of which containing at
 * least one setting.
 */
gpii.app.dev.gpiiConnector.createGroupsFromTemplate = function (groupingTemplate, channelSettingControls) {
    return fluid.copy(groupingTemplate)
        .map(function (templateGroup) {
            return {
                name: templateGroup.name,
                solutionName: templateGroup.solutionName,
                settingControls: gpii.app.dev.gpiiConnector.getSettingControls(templateGroup, templateGroup.solutionName, channelSettingControls)
            };
        })
        .filter(function (settingGroup) {
            return gpii.app.isHashNotEmpty(settingGroup.settingControls);
        });
};

/**
 * Given a ChannelSettingControls object, this function creates a default group
 * of settings, i.e. it will contain all settings which have not been assigned to
 * other groups based on the `groupingTemplate`. Will return `undefined` if there
 * are no such settings.
 * @param {ChannelSettingControls} channelSettingControls - the `settingControls` object
 * from the PSP channel message
 * @return {PSPSettingGroup} A PSPSettingGroup object representing the default setting
 * group.
 */
gpii.app.dev.gpiiConnector.createDefaultGroup = function (channelSettingControls) {
    var defaultGroup = {
        settingControls: {}
    };

    fluid.each(channelSettingControls, function (settingDescriptor, path) {
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
 * of settings each of which can also have settings. Note that this function
 * modifies the passed `message` object argument.
 * @param {Array} groupingTemplate - A template array which serves for constructing
 * setting groups. Each group within the template must have a `settings` element
 * which specifies the paths and possibly the subsettings of these settings, and
 * optionally a `name` which will be displayed as a title for the group and a
 * `solutionName` which will be used in the restart warning text.
 * @param {Object} message - The received message.
 * @return {Object} The PSP channel message adapted to the expected format.
 */
gpii.app.dev.gpiiConnector.groupSettings = function (groupingTemplate, message) {
    var payload = message.payload || {},
        operation = payload.type,
        path = payload.path,
        value = payload.value || {},
        channelSettingControls = value.settingControls;

    if (operation === "ADD" && path.length === 0 && channelSettingControls) {
        // First, add the groups which can be constructed from the grouping template
        value.settingGroups = gpii.app.dev.gpiiConnector.createGroupsFromTemplate(groupingTemplate, channelSettingControls);

        // Then create a default group with all settings that have not yet been assigned
        // to other groups.
        var defaultGroup = gpii.app.dev.gpiiConnector.createDefaultGroup(channelSettingControls);
        if (defaultGroup) {
            value.settingGroups.unshift(defaultGroup);
        }

        // Remove the `settingControls` element as it is no longer needed.
        delete value.settingControls;
    }

    return message;
};
