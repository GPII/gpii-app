/**
 * The Quick Set Strip dialog
 *
 * Introduces a component that uses an Electron BrowserWindow to represent the QSS.
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

var fluid = require("infusion");

var gpii = fluid.registerNamespace("gpii");

require("./dialogs/quickSetStrip/qssDialog.js");
require("./dialogs/quickSetStrip/qssTooltipDialog.js");
require("./dialogs/quickSetStrip/qssWidgetDialog.js");
require("./dialogs/quickSetStrip/qssNotificationDialog.js");
require("./dialogs/quickSetStrip/qssMorePanel.js");
require("./common/undoStack.js");

/**
 * A QSS wrapper which defines default values for its settings. The default
 * values are applied every time a user keys in or out or changes his active
 * preference set (in case there is more than one available set).
 */
fluid.defaults("gpii.app.resettableQssWrapper", {
    gradeNames: ["gpii.app.qssWrapper"],

    members: {
        previousState: {
            gpiiKey: null,
            activeSet: null
        }
    },

    listeners: {
        // override the existing listener
        "onPreferencesUpdated.applyPrefSettings": {
            func: "gpii.app.resettableQssWrapper.applyDecoratedPreferenceSettings",
            args: [
                "{that}",
                "{that}.options.defaultQssSettings",
                "{arguments}.0"
            ]
        }
    },

    // The default values of the QSS settings
    defaultQssSettings: [{
        "path": "http://registry\\.gpii\\.net/common/language",
        "value": "en-US"
    }, {
        "path": "http://registry\\.gpii\\.net/common/DPIScale",
        "value": 0
    }, {
        "path": "http://registry\\.gpii\\.net/common/captions/enabled",
        "value": false
    }, {
        "path": "http://registry\\.gpii\\.net/common/highContrastTheme",
        "value": "regular-contrast"
    }, {
        "path": "http://registry\\.gpii\\.net/common/selfVoicing/enabled",
        "value": false
    }]
});

/**
 * Similar to `gpii.app.qssWrapper.applyPreferenceSettings`. In addition to
 * propagating the changes to the QSS, this function also takes care of
 * notifying the QSS if it is necessary to apply the default values for its
 * settings.
 * @param {Component} that - The `gpii.app.resettableQssWrapper` instance.
 * @param {Object[]} defaultQssSettings - An array containing the default
 * values of the QSS settings. Each setting is identified by its path and each
 * object in the array contains the default value for that setting.
 * @param {module:gpiiConnector.Preferences} preferences - The new preferences
 * that are delivered to the QSS wrapper.
 */
gpii.app.resettableQssWrapper.applyDecoratedPreferenceSettings = function (that, defaultQssSettings, preferences) {
    var settings = gpii.app.qssWrapper.getPreferencesSettings(preferences && preferences.settingGroups),
        notUndoable = false;

    /**
     * If this check fails, it means that the new preference set is due to a
     * new setting being added to the user's preferences as a result of a
     *change to that setting from the QSS.
     */
    if (that.previousState.gpiiKey !== preferences.gpiiKey || that.previousState.activeSet !== preferences.activeSet) {
        notUndoable = true;

        // merge new settings with the original qss settings
        fluid.each(defaultQssSettings, function (defaultSetting) {
            var prefSetting = fluid.find_if(settings, function (setting) {
                return setting.path === defaultSetting.path;
            });

            if (!prefSetting) {
                settings.push(defaultSetting);
            }
        });
    }

    that.previousState = {
        gpiiKey: preferences.gpiiKey,
        activeSet: preferences.activeSet
    };

    fluid.each(settings, function (setting) {
        that.updateSetting(setting, notUndoable);
    });
};

/**
 * A component which coordinates the operation of all QSS related components
 * (the QSS itself and its widget, tooltip, notification and "More" dialogs,
 * as well as the undo stack). It also takes care of loading the QSS settings
 * from a local configuration file.
 */
fluid.defaults("gpii.app.qssWrapper", {
    gradeNames: "fluid.modelComponent",

    settingsPath: "%gpii-app/testData/qss/settings.json",
    loadedSettings: {
        expander: {
            funcName: "gpii.app.qssWrapper.loadSettings",
            args: [
                "{assetsManager}",
                "{that}.options.settingsPath"
            ]
        }
    },

    scaleFactor: 0.8,

    model: {
        isKeyedIn: false,
        settings: "{that}.options.loadedSettings"
    },

    events: {
        onSettingUpdated: null,
        onPreferencesUpdated: null,
        onActivePreferenceSetAltered: null,
        onUndoRequired: null,
        onSaveRequired: null,
        onQssPspOpen: null,
        onQssPspClose: null
    },

    listeners: {
        onSettingUpdated: {
            funcName: "{that}.updateSetting",
            args: [
                "{arguments}.0" // setting
            ]
        },
        "onPreferencesUpdated.applyPrefSettings": {
            funcName: "gpii.app.qssWrapper.applyPreferenceSettings",
            args: [
                "{that}",
                "{arguments}.0" // preferences
            ]
        },
        "onUndoRequired.activateUndo": {
            func: "{undoStack}.undo"
        },
        onSaveRequired: {
            funcName: "gpii.app.qssWrapper.saveSettings",
            args: [
                "{that}",
                "{flowManager}",
                "{qssNotification}",
                "{gpii.app.qss}",
                "{arguments}.0"
            ]
        }
    },

    modelListeners: {
        // All interested in setting updates
        "{qssWrapper}.model.settings.*": [
            { // Undo Stack
                funcName: "{undoStack}.registerUndoableChange",
                args: ["{change}.oldValue"],
                excludeSource: ["gpii.app.undoStack.undo", "gpii.app.undoStack.notUndoable", "init"]
            }, { // QSS
                func: "{qss}.events.onSettingUpdated.fire",
                args: ["{change}.value"],
                excludeSource: ["init", "qss"]
            }, { // QSS Widget
                funcName: "gpii.app.qssWidget.updateIfMatching",
                args: ["{qssWidget}", "{change}.value"],
                excludeSource: ["init", "qssWidget"]
            }
        ]
    },

    invokers: {
        updateSetting: {
            funcName: "gpii.app.qssWrapper.updateSetting",
            args: [
                "{that}",
                "{arguments}.0", // updatedSetting
                "{arguments}.1"  // notUndoable
            ]
        },
        alterSetting: {
            funcName: "gpii.app.qssWrapper.alterSetting",
            args: [
                "{that}",
                "{arguments}.0", // updatedSetting
                "{arguments}.1" // source
            ]
        }
    },

    components: {
        undoStack: {
            type: "gpii.app.undoInWrapper"
        },
        qss: {
            type: "gpii.app.qssInWrapper",
            options: {
                scaleFactor: "{qssWrapper}.options.scaleFactor"
            }
        },
        qssWidget: {
            type: "gpii.app.qssWidget",
            options: {
                scaleFactor: "{qssWrapper}.options.scaleFactor",
                listeners: {
                    onQssWidgetSettingAltered: {
                        func: "{qssWrapper}.alterSetting",
                        args: [
                            "{arguments}.0", // updatedSetting
                            "qssWidget"
                        ]
                    },
                    onQssWidgetNotificationRequired: {
                        func: "{qssNotification}.show",
                        args: [{
                            description: "{arguments}.0",
                            focusOnClose: "{that}.dialog"
                        }]
                    }
                },
                modelListeners: {
                    // Ensure the widget window is closed with the QSS
                    "{gpii.app.qss}.model.isShown": {
                        // it won't hurt if this is called even if QSS shows up
                        func: "{that}.hide"
                    }
                }
            }
        },
        qssTooltip: {
            type: "gpii.app.qssTooltipDialog",
            options: {
                scaleFactor: "{qssWrapper}.options.scaleFactor",
                model: {
                    isKeyedIn: "{qssWrapper}.model.isKeyedIn"
                },
                listeners: {
                    // TODO list events for a method
                    "{gpii.app.qss}.channelListener.events.onQssButtonMouseEnter": {
                        func: "{that}.showIfPossible",
                        args: [
                            "{arguments}.0", // setting
                            "@expand:gpii.app.qssWrapper.getButtonPosition({gpii.app.qss}, {arguments}.1)"  // btnCenterOffset
                        ]
                    },

                    "{gpii.app.qss}.events.onDialogHidden": {
                        func: "{that}.hide"
                    },
                    "{gpii.app.qss}.channelListener.events.onQssButtonActivated": {
                        func: "{that}.hide"
                    },
                    "{gpii.app.qss}.channelListener.events.onQssButtonsFocusLost": {
                        func: "{that}.hide"
                    },
                    "{gpii.app.qss}.channelListener.events.onQssButtonMouseLeave": {
                        func: "{that}.hide"
                    }
                }
            }
        },
        qssNotification: {
            type: "gpii.app.qssNotification",
            options: {
                scaleFactor: "{qssWrapper}.options.scaleFactor"
            }
        },
        qssMorePanel: {
            type: "gpii.app.qssMorePanel",
            options: {
                scaleFactor: "{qssWrapper}.options.scaleFactor"
            }
        }
    }
});

/**
 * If there is a keyed in user, saves his settings and shows a confirmation message.
 * If there is no keyed in user, a warning message is shown.
 * @param {Component} that - The `gpii.app.qssWrapper` instance.
 * @param {Component} flowManager - The `gpii.flowManager` instance.
 * @param {Component} qssNotification - The `gpii.app.qssNotification` instance.
 * @param {Component} qss - The `gpii.app.qss` instance.
 * @param {String} description - The message that should be shown in the QSS notification.
 */
gpii.app.qssWrapper.saveSettings = function (that, flowManager, qssNotification, qss, description) {
    // Request that the settings are saved only if there is a keyed in user
    if (that.model.isKeyedIn) {
        // Instead of sending a request via the pspChannel, the flowManager is used directly.
        var pspChannel = flowManager.pspChannel,
            saveButtonClickCount = pspChannel.model.saveButtonClickCount || 0;
        pspChannel.applier.change("saveButtonClickCount", saveButtonClickCount + 1, null, "PSP");
    }

    qssNotification.show({
        description: description,
        focusOnClose: qss.dialog
    });
};

/**
 * Whenever a button in the QSS is focused, hides the QSS widget and the PSP in case
 * the setting for the newly focused button is different from the QSS widget's setting
 * (or the setting for the PSP button respectively).
 * @param {Component} that - The `gpii.app.qss` instance.
 * @param {Component} qssWidget - The `gpii.app.qssWidget` instance.
 * @param {Object} setting - the setting for the newly focused QSS button.
 */
gpii.app.qss.hideQssMenus = function (that, qssWidget, setting) {
    if (setting.path !== qssWidget.model.setting.path) {
        qssWidget.hide();
    }

    if (setting.path !== that.options.pspButtonPath) {
        that.events.onQssPspClose.fire();
    }
};

/**
 * When a setting's value in the QSS is modified and if the setting can be undone, adds
 * the change that has occurred to the undo stack.
 * @param {Component} that - The `gpii.app.undoStack` instance.
 * @param {Object} oldValue - The previous value of the setting before its modification.
 */
gpii.app.qssWrapper.registerUndoableChange = function (that, oldValue) {
    var isChangeUndoable = !fluid.find_if(
        that.options.unwatchedSettings,
        function (excludedPath) { return oldValue.path === excludedPath; });

    if (isChangeUndoable) {
        that.registerChange(oldValue);
    }
};

/**
 * When the "Undo" button is pressed, reverts the topmost change in the undo stack.
 * Actually, a change is reverted by applying the previous value of the setting.
 * @param {Component} qssWrapper - The `gpii.app.undoStack` instance.
 * @param {Object} change - The change to be reverted.
 */
gpii.app.undoStack.revertChange = function (qssWrapper, change) {
    qssWrapper.alterSetting({
        path:  change.path,
        value: change.value
    }, "gpii.app.undoStack.undo");
};

/**
 * Updates only the value of a QSS setting. Called when the change originated from
 * outside the QSS or the QSS widget.
 * @param {Component} that - The `gpii.app.qssWrapper` component
 * @param {Object} updatedSetting - The setting with updated state
 * @param {Boolean} notUndoable - Whether the setting is undoable or not
 */
gpii.app.qssWrapper.updateSetting = function (that, updatedSetting, notUndoable) {
    var updateNamespace = notUndoable ? "gpii.app.undoStack.notUndoable" : null;

    that.alterSetting(
        fluid.filterKeys(updatedSetting, ["path", "value"]),
        updateNamespace
    );
};

/**
 * Returns all available settings (including subsettings) in the provided
 * item (either a setting group or a setting). In case the passed argument
 * is a setting, it is also added to the resulting list.
 * @param {module:gpiiConnector.SettingGroup | module:gpiiConnector.SettingDescriptor} item - The
 * setting group or the setting from which to retrieve settings
 * @return {module:gpiiConnector.SettingDescriptor[]} An array of all available
 * settings for that `item`.
 */
gpii.app.qssWrapper.getItemSettings = function (item) {
    var settings = [];

    fluid.each(item.settings, function (setting) {
        settings.push(setting);
        if (setting.settings) {
            var subsettings = gpii.app.qssWrapper.getItemSettings(setting);
            settings = settings.concat(subsettings);
        }
    });

    return settings;
};

/**
 * Returns all settings (including subsettings) available in the provided
 * settings groups.
 * @param {module:gpiiConnector.SettingGroup[]} settingGroups - An array with
 * setting group items as per the parsed message in the `gpiiConnector`.
 * @return {module:gpiiConnector.SettingDescriptor[]} An array of all available
 * settings.
 */
gpii.app.qssWrapper.getPreferencesSettings = function (settingGroups) {
    var settings = [];

    fluid.each(settingGroups, function (settingGroup) {
        var settingGroupSettings = gpii.app.qssWrapper.getItemSettings(settingGroup);
        settings = settings.concat(settingGroupSettings);
    });

    return settings;
};

/**
 * When new preferences are delivered to the QSS wrapper, this function takes
 * care of notifying the QSS about the changes which should in turn update its
 * internal models and UI. Note that settings changes as a result of a change
 * in the preference set are not undoable.
 * @param {Component} that - The `gpii.app.qssWrapper` instance.
 * @param {module:gpiiConnector.Preferences} preferences - The new preferences
 * that are delivered to the QSS wrapper.
 */
gpii.app.qssWrapper.applyPreferenceSettings = function (that, preferences) {
    var settings = gpii.app.qssWrapper.getPreferencesSettings(preferences.settingGroups);

    fluid.each(settings, function (setting) {
        that.updateSetting(setting, true);
    });
};

/**
 * Retrieves synchronously the QSS settings from a file on the local machine
 * and resolves any assets that they reference with respect to the `gpii-app`
 * folder.
 * @param {Component} assetsManager - The `gpii.app.assetsManager` instance.
 * @param {String} settingsPath - The path to the file containing the QSS
 * settings with respect to the `gpii-app` folder.
 * @return {Object[]} An array of the loaded settings
 */
gpii.app.qssWrapper.loadSettings = function (assetsManager, settingsPath) {
    var resolvedPath = fluid.module.resolvePath(settingsPath),
        loadedSettings = fluid.require(resolvedPath);

    fluid.each(loadedSettings, function (loadedSetting) {
        var imageAsset = loadedSetting.schema.image;
        if (imageAsset) {
            loadedSetting.schema.image = assetsManager.resolveAssetPath(imageAsset);
        }
    });

    return loadedSettings;
};

/**
 * Update a QSS setting (all of its data). Called when the change originated from the
 * QSS or the QSS widget.
 * @param {Component} that - The `gpii.app.qssWrapper` instance.
 * @param {Object} updatedSetting - The new setting. The setting with the same path in
 * the QSS will be replaced.
 * @param {String} [source] - The source of the update.
 */
gpii.app.qssWrapper.alterSetting = function (that, updatedSetting, source) {
    var settingIndex = that.model.settings.findIndex(function (setting) {
        return setting.path === updatedSetting.path && !fluid.model.diff(setting.value, updatedSetting.value);
    });

    if (settingIndex !== -1) {
        that.applier.change("settings." + settingIndex, updatedSetting, null, source);
    }
};


/**
 * Given the metrics of the focused/activated QSS button, computes the coordinates of
 * the topmost middle point of the button with respect to the bottom right corner of
 * the QSS.
 * @param {Component} qss - The `gpii.app.qss` instance.
 * @param {Object} buttonElemMetrics - An object containing metrics for the QSS button
 * that has been interacted with.
 * @return {Object} the coordinates of the topmost middle point of the corresponding QSS
 * button.
 */
gpii.app.qssWrapper.getButtonPosition = function (qss, buttonElemMetrics) {
    return {
        x: qss.width - buttonElemMetrics.offsetLeft - (buttonElemMetrics.width / 2),
        y: buttonElemMetrics.height
    };
};

/**
 * Propagates a setting update to the QSS widget only if the setting has the same path
 * as the one which the widget is currently displaying.
 * @param {Component} qssWidget - The `gpii.app.qssWidget` instance.
 * @param {Object} updatedSetting - The new setting.
 */
gpii.app.qssWidget.updateIfMatching = function (qssWidget, updatedSetting) {
    if (qssWidget.model.setting.path === updatedSetting.path) {
        qssWidget.events.onSettingUpdated.fire(updatedSetting);
    }
};

/**
 * Configuration for using the `gpii.app.qss` in the QSS wrapper component.
 */
fluid.defaults("gpii.app.qssInWrapper", {
    gradeNames: "gpii.app.qss",
    config: {
        params: {
            settings: "{qssWrapper}.model.settings"
        }
    },
    pspButtonPath: "psp",
    model: {
        isKeyedIn: "{qssWrapper}.model.isKeyedIn"
    },
    events: {
        onQssPspClose: "{qssWrapper}.events.onQssPspClose",
        onUndoIndicatorChanged: null,

        onQssWidgetToggled: "{qssWidget}.events.onQssWidgetToggled"
    },
    listeners: {
        "{channelListener}.events.onQssButtonFocused": [{
            func: "{qssTooltip}.showIfPossible",
            args: [
                "{arguments}.0", // setting
                "@expand:gpii.app.qssWrapper.getButtonPosition({gpii.app.qss}, {arguments}.1)"  // btnCenterOffset
            ]
        }, {
            funcName: "gpii.app.qss.hideQssMenus",
            args: [
                "{that}",
                "{qssWidget}",
                "{arguments}.0" // setting
            ]
        }],
        "{channelListener}.events.onQssButtonActivated": [{
            func: "{qssWidget}.toggle",
            args: [
                "{arguments}.0", // setting
                "@expand:gpii.app.qssWrapper.getButtonPosition({gpii.app.qss}, {arguments}.1)",  // btnCenterOffset
                "{arguments}.2"  // activationParams
            ]
        }, {
            func: "{qssNotification}.hide"
        }, {
            func: "{qssMorePanel}.hide"
        }],
        onQssSettingAltered: {
            func: "{qssWrapper}.alterSetting",
            args: [
                "{arguments}.0", // updatedSetting
                "qss"
            ]
        },
        "{channelListener}.events.onQssNotificationRequired": {
            func: "{qssNotification}.show",
            args: [{
                description: "{arguments}.0",
                focusOnClose: "{that}.dialog"
            }] // notificationParams
        },
        "{channelListener}.events.onQssMorePanelRequired": {
            func: "{qssMorePanel}.show"
        },
        "{channelListener}.events.onQssUndoRequired": "{qssWrapper}.events.onUndoRequired",
        "{channelListener}.events.onQssSaveRequired": "{qssWrapper}.events.onSaveRequired",
        "{channelListener}.events.onQssPspOpen":      "{qssWrapper}.events.onQssPspOpen"
    }
});

/**
 * Configuration for using the `gpii.app.undoInWrapper` in the QSS wrapper component.
 */
fluid.defaults("gpii.app.undoInWrapper", {
    gradeNames: "gpii.app.undoStack",
    // paths of settings that are not undoable
    unwatchedSettings: ["appTextZoom"],

    listeners: {
        "onChangeUndone.applyChange": {
            funcName: "gpii.app.undoStack.revertChange",
            args: [
                "{qssWrapper}",
                "{arguments}.0" // change
            ]
        },
        "{qssWrapper}.events.onActivePreferenceSetAltered": {
            func: "{that}.clear"
        }
    },
    modelListeners: {
        "{qssWrapper}.model.keyedInUserToken": {
            func: "{that}.clear"
        },

        "hasChanges": {
            func: "{qss}.updateUndoIndicator",
            args: ["{change}.value"]
        }
    },
    invokers: {
        registerUndoableChange: {
            funcName: "gpii.app.qssWrapper.registerUndoableChange",
            args: [
                "{undoStack}",
                "{arguments}.0" // oldValue
            ]
        }
    }
});
