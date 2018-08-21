/**
 * The PSP Channel connector
 *
 * Introduces component that manages the connection with the PSP Channel.
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
require("./common/utils.js");

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
        "onMessageReceived.handleRawChannelMessage": {
            funcName: "{gpiiConnector}.handleRawChannelMessage"
        }
    },

    invokers: {
        handleRawChannelMessage: {
            funcName: "gpii.app.gpiiConnector.handleRawChannelMessage",
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

    console.log("gpiiConnector: Alter setting - ", setting);

    gpiiConnector.send({
        path: ["settingControls", setting.path, "value"],
        type: "ADD",
        value: setting.value
    });
};


/**
 * Extracts data from the preferences change update message that has been received.
 * @param {Object} gpiiConnector - Instance of the `gpii.app.gpiiConnector`
 * @param {Object} updateDetails - The PSP Channel massage's details about the update
 */
gpii.app.gpiiConnector.handlePreferencesChangeMessage = function (gpiiConnector, updateDetails) {
    console.log("GpiiConnector: Updated preference set:", updateDetails);
    var snapsetName = gpii.app.extractSnapsetName(updateDetails);
    gpiiConnector.events.onSnapsetNameUpdated.fire(snapsetName);

    var preferences = gpii.app.extractPreferencesData(updateDetails);
    gpiiConnector.events.onPreferencesUpdated.fire(preferences);
};


/**
 * Extracts data from the single setting update message that has been received.
 * @param {Object} gpiiConnector - Instance of the `gpii.app.gpiiConnector`
 * @param {Object} updateDetails - The PSP Channel massage's details about the update
 */
gpii.app.gpiiConnector.handleSettingUpdateMessage = function (gpiiConnector, updateDetails) {
    var settingPath = updateDetails.path[updateDetails.path.length - 2],
        settingValue = updateDetails.value;

    console.log("GpiiConnector: Updated setting:", settingPath, settingValue);

    gpiiConnector.events.onSettingUpdated.fire({
        path: settingPath,
        value: settingValue
    });
};


/**
 * Determines whether the current PSP channel message is a preference set update.
 * Currently in case of preference set update the update path is empty.
 * @param {Object} messagePayload - The payload of the message that represents a `changeApplier` change object
 * @param {String} messagePayload.type - The type of `changeApplier` operation
 * @param {String} messagePayload.path - The changePath for the update
 * @return {Boolean} - The status of the query
 */
gpii.app.gpiiConnector.isPrefSetUpdate = function (messagePayload) {
    return (messagePayload.type === "ADD" && messagePayload.path.length === 0) ||
        messagePayload.type === "DELETE";
};


/**
 * Use the previous state of preference set update message to determine the source of the current update.
 * Currently there are three sources:
 * - snapset change,
 * - active set change,
 * - or add of new setting to the preference set.
 * In some cases we need the need to distinguish these source as different behaviour may be wanted.
 * @param {Object} previousUpdateState - The previous state of preference set update
 * @param {Object} currentUpdateState - The current preference update state
 * @return {Boolean} - The status of the query
 */
gpii.app.gpiiConnector.isFullPrefSetUpdate = function (previousUpdateState, currentUpdateState) {
    var isSnapsetUpdate = previousUpdateState.gpiiKey !== currentUpdateState.gpiiKey,
        isActiveSetUpdate = previousUpdateState.activeSet !== currentUpdateState.activeSet;
    return isSnapsetUpdate || isActiveSetUpdate;
};

/**
 * Responsible for parsing messages from the GPII socket connection. Currently messages use
 * the format of changeApplier with the path, value and type.
 * @param {Object} gpiiConnector - The `gpii.app.gpiiConnector` instance
 * @param {Object} message - The received PSP Channel message
 * @param {Object} message.payload - The message's payload that describes the update
 * @param {String} message.payload.type - The type of the sent message - ADD or DELETE
 * @param {String} message.payload.path - The path of the updated element
 * @param {Object} message.payload.value - Contains the real data of the message
 */
gpii.app.gpiiConnector.handleRawChannelMessage = function (gpiiConnector, message) {
    var payload = message.payload || {},
        operation = payload.type;

    if (gpii.app.gpiiConnector.isPrefSetUpdate(payload)) {
        gpii.app.gpiiConnector.handlePreferencesChangeMessage(gpiiConnector, payload);
    } else if (operation === "ADD") {
        gpii.app.gpiiConnector.handleSettingUpdateMessage(gpiiConnector, payload);
    }
};

/**
 * Sends an active set change request to GPII.
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
        gpiiKey = value.gpiiKey,
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
        gpiiKey: gpiiKey,
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
    gradeNames: ["gpii.app.gpiiConnector", "gpii.app.dev.gpiiConnector.qss"],

    events: {
        // Decorate events' arguments
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
        if (settingDescriptor && settingDescriptor.schema) {
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
        if (!settingDescriptor.grouped && settingDescriptor.schema) {
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
    }

    return message;
};



/**
 * A component for managing the QSS related data from the channel and mainly notifies about
 * setting updates.
 * Currently it uses the same channel messages as the PSP and, as some settings might be missing,
 * applies some mocked default values settings that are missing from the PSP related requests.
 */
fluid.defaults("gpii.app.dev.gpiiConnector.qss", {
    members: {
        // keep the state to determine the type of the next "preferences update" - whether it
        // is caused by a fresh keying in or change of active preference set, or is simply the result
        // of a new setting added to the preferences set (when activating a setting from the QSS that is not
        // present in the PSP)
        previousState: {
            gpiiKey: null,
            activeSet: null
        }
    },

    events: {
        // Simply ensure the message is in the state that is expected, as currently there aren't specific
        // channel messages for the QSS in the core
        prepareMessageForQss: {
            event: "onMessageReceived",
            args: {
                expander: {
                    funcName: "gpii.app.dev.gpiiConnector.qss.prepareMessageForQss",
                    args: [
                        "{that}",
                        "{that}.options.defaultQssSettingValues",
                        "{arguments}.0" // message
                    ]
                }
            }
        },

        onQssSettingsUpdate: null
    },

    listeners: {
        "onMessageReceived.distributeQssSettings": {
            func: "gpii.app.dev.gpiiConnector.qss.distributeQssSettings",
            args: [
                "{that}",
                "{arguments}.0"
            ]
        }
    },

    // The "original" values of the QSS settings. These are to be provided from the core
    // in the future.
    defaultQssSettingValues: {
        "http://registry\\.gpii\\.net/common/language": { value: "en-US" },
        "http://registry\\.gpii\\.net/common/DPIScale": { value: 0 },
        "http://registry\\.gpii\\.net/common/captions/enabled": { value: false },
        "http://registry\\.gpii\\.net/common/highContrastTheme": { value: "regular-contrast" },
        "http://registry\\.gpii\\.net/common/selfVoicing/enabled": { value: false }
    }
});

/**
 * Decorate the PSP channel message with QSS specific property so that it looks similar
 * to what it will look like in the future with core improvements on QSS functionality.
 * The property is populated using data from the incoming "Preference Update" message, sent for the PSP. It extracts
 * settings that are updated in order to update their state in the QSS as well.
 * In case it is needed (it's a full preference set update after a snapset or active set change), it
 * also populates with QSS settings that are missing using a predefined set of default values.
 * @param {Component} that - The instance of `gpii.app.dev.gpiiComponent` component
 * @param {Object} defaultQssSettingValues - The default QSS settings in the format - <path>: <value>
 * @param {Object} message - The raw PSP channel message
 * @return {Object} The decorated PSP channel message
 */
gpii.app.dev.gpiiConnector.qss.prepareMessageForQss = function (that, defaultQssSettingValues, message) {
    var payload = message.payload || {};

    if (gpii.app.gpiiConnector.isPrefSetUpdate(payload)) {
        var value = payload.value || {},
            channelSettingControls = value.settingControls || [];

        // leave only QSS settings
        // Note that settings that doesn't have specific values such as "App / Text Zoom" will not receive setting updates
        var qssSettingControls = fluid.filterKeys(channelSettingControls, fluid.keys(defaultQssSettingValues));

        // add missing setting values if needed
        qssSettingControls = gpii.app.dev.gpiiConnector.qss.applySettingDefaults(that, that.options.defaultQssSettingValues, qssSettingControls, value);

        value.qssSettingControls = qssSettingControls;
    }

    return message;
};


/**
 * Fires the `onQssSettingsUpdate` event if needed to notify the QSS about setting changes.
 * Note that in case the changes are coming from snapset or active set update, they are not undoable (they indicate a full QSS reset).
 * @param {Component} that - The instance of `gpii.app.dev.gpiiConnector` component
 * @param {Object} message - The PSP channel decorated (with QSS data) massage
 */
gpii.app.dev.gpiiConnector.qss.distributeQssSettings = function (that, message) {
    var payload = message.payload || {},
        value = payload.value || {},
        qssSettingControls = value.qssSettingControls || {};

    if (gpii.app.gpiiConnector.isPrefSetUpdate(payload)) {
        console.log("gpiiConnector.qss Controls to be sent: ", value.qssSettingControls);

        that.events.onQssSettingsUpdate.fire(
            fluid.hashToArray(qssSettingControls, "path"), // set to the expected format
            gpii.app.gpiiConnector.isFullPrefSetUpdate(that.previousState, value)
        );

        // Update the state of the last Pref Set update, in order to determine
        // the type of update in the future
        that.previousState = {
            gpiiKey: value.gpiiKey,
            activeSet: value.activeContextName
        };
    }
};


/**
 * Adds missing QSS settings with default values in case it is a full pref set update.
 * @param {Component} that - The instance of `gpii.app.dev.gpiiComponent` component
 * @param {Object} defaultQssSettingValues - The default QSS settings in the format <path>: <value>
 * @param {Object} qssSettingControls - The map of qss settings
 * @param {Object} updateDetails - The metadata for the current update
 * @return {Object} - the populated setting controls
 */
gpii.app.dev.gpiiConnector.qss.applySettingDefaults = function (that, defaultQssSettingValues, qssSettingControls, updateDetails) {
    // Whether the update is a full preference set update (fired from change in the snapset or active preference set),
    // or a change of a missing in the preference set setting from the QSS
    if (gpii.app.gpiiConnector.isFullPrefSetUpdate(that.previousState, updateDetails)) {
        console.log("gpiiConnect.qss: Merge QSS default settings");

        // add missing QSS settings to the update list (this is needed for triggering reset of the QSS)
        qssSettingControls = fluid.extend(true, {}, defaultQssSettingValues, qssSettingControls);
    }

    return qssSettingControls;
};

