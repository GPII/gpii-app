/**
 * The Quick Set Strip pop-up
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

require("./qssDialog.js");
require("./qssTooltipDialog.js");
require("./qssWidgetDialog.js");
require("./qssNotificationDialog.js");
require("./qssMorePanel.js");


/**
 * Loads the initial settings from a local configuration file.
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

    model: {
        settings: "{that}.options.loadedSettings"
    },

    events: {
        onSettingUpdated: null,
        onPreferencesUpdated: null,
        onUndoRequired: null,
        onQssPspOpen: null
    },

    listeners: {
        onSettingUpdated: {
            funcName: "gpii.app.qssWrapper.updateSetting",
            args: [
                "{that}",
                "{arguments}.0" // setting
            ]
        },
        onPreferencesUpdated: {
            funcName: "gpii.app.qssWrapper.onPreferencesUpdated",
            args: [
                "{that}",
                "{arguments}.0" // preferences
            ]
        }
    },

    components: {
        qss: {
            type: "gpii.app.qss",
            options: {
                config: {
                    params: {
                        settings: "{qssWrapper}.model.settings"
                    }
                },
                events: {
                    onQssWidgetToggled: "{qssWidget}.events.onQssWidgetToggled"
                },
                listeners: {
                    "{channelListener}.events.onQssButtonActivated": [{
                        func: "{qssWidget}.toggle",
                        args: [
                            "{arguments}.0", // setting
                            "{arguments}.1", // elementMetrics
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
                            description: "{arguments}.0.description",
                            focusOnClose: "{that}.dialog"
                        }] // notificationParams
                    },
                    "{channelListener}.events.onQssMorePanelRequired": {
                        func: "{qssMorePanel}.show"
                    },
                    "{channelListener}.events.onQssUndoRequired": "{qssWrapper}.events.onUndoRequired",
                    "{channelListener}.events.onQssPspOpen":      "{qssWrapper}.events.onQssPspOpen.fire"
                },
                modelListeners: {
                    "{qssWrapper}.model.settings.*": {
                        func: "{that}.events.onSettingUpdated.fire",
                        args: ["{change}.value"],
                        excludeSource: ["init", "qss"]
                    }
                }
            }
        },
        qssWidget: {
            type: "gpii.app.qssWidget",
            options: {
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
                            description: "{arguments}.0.description",
                            focusOnClose: "{that}.dialog"
                        }] // notificationParams 
                    }
                },
                modelListeners: {
                    // Ensure the widget window is closed with the QSS
                    "{gpii.app.qss}.model.isShown": {
                        // it won't hurt if this is called
                        // even on QSS show
                        func: "{that}.hide"
                    },
                    "{qssWrapper}.model.settings.*": {
                        funcName: "gpii.app.qssWidget.onSettingUpdated",
                        args: ["{qssWidget}", "{change}.value"],
                        excludeSource: ["init", "qssWidget"]
                    }
                }
            }
        },
        qssTooltip: {
            type: "gpii.app.qssTooltipDialog",
            options: {
                listeners: {
                    // TODO list events for a method
                    "{gpii.app.qss}.channelListener.events.onQssButtonMouseEnter": {
                        func: "{that}.showIfPossible",
                        args: [
                            "{arguments}.0", // setting
                            "{arguments}.1"  // metrics
                        ]
                    },
                    "{gpii.app.qss}.channelListener.events.onQssButtonFocused": {
                        func: "{that}.showIfPossible",
                        args: [
                            "{arguments}.0", // setting
                            "{arguments}.1"  // metrics
                        ]
                    },

                    // TODO we could also have a modelListener and always hide. See widget
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
            type: "gpii.app.qssNotification"
        },
        qssMorePanel: {
            type: "gpii.app.qssMorePanel"
        }
    },

    invokers: {
        alterSetting: {
            funcName: "gpii.app.qssWrapper.alterSetting",
            args: [
                "{that}",
                "{arguments}.0", // updatedSetting
                "{arguments}.1" // source
            ]
        }
    }
});

gpii.app.qssWrapper.updateSetting = function (that, updatedSetting) {
    fluid.each(that.model.settings, function (setting, index) {
        if (setting.path === updatedSetting.path && !fluid.model.diff(setting.value, updatedSetting.value)) {
            that.applier.change("settings." + index, updatedSetting);
        }
    });
};

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

gpii.app.qssWrapper.getPreferencesSettings = function (settingGroups) {
    var settings = [];

    fluid.each(settingGroups, function (settingGroup) {
        var settingGroupSettings = gpii.app.qssWrapper.getItemSettings(settingGroup);
        settings = settings.concat(settingGroupSettings);
    });

    return settings;
};

gpii.app.qssWrapper.onPreferencesUpdated = function (that, preferences) {
    var settings = gpii.app.qssWrapper.getPreferencesSettings(preferences.settingGroups);
    fluid.each(settings, function (setting) {
        that.events.onSettingUpdated.fire(setting);
    });
};

gpii.app.qssWidget.onSettingUpdated = function (qssWidget, updatedSetting) {
    // Update the widget only if the changed setting is the one which the widget is displaying
    if (qssWidget.model.setting.path === updatedSetting.path) {
        qssWidget.events.onSettingUpdated.fire(updatedSetting);
    }
};

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

gpii.app.qssWrapper.alterSetting = function (that, updatedSetting, source) {
    var settingIndex = that.model.settings.findIndex(function (setting) {
        return setting.path === updatedSetting.path;
    });

    if (settingIndex > -1) {
        that.applier.change("settings." + settingIndex, updatedSetting, null, source);
    }
};
