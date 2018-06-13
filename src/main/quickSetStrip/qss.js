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

    // modelListeners: {
    //     "settings.*": {
    //         func: "{settingsBroker}.applySetting",
    //         args: ["{change}.value"],
    //         includeSource: ["qss", "qssWidget"]
    //     }
    // },

    events: {
        onSettingUpdated: null
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
                    "{channelListener}.events.onQssButtonActivated": {
                        func: "{qssWidget}.toggle",
                        args: [
                            "{arguments}.0", // setting
                            "{arguments}.1", // elementMetrics
                            "{arguments}.2"  // activationParams
                        ]
                    },
                    onQssSettingAltered: {
                        func: "{qssWrapper}.alterSetting",
                        args: [
                            "{arguments}.0", // updatedSetting
                            "qss"
                        ]
                    }
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
                        func: "{that}.events.onSettingUpdated.fire",
                        args: ["{change}.value"],
                        excludeSource: ["init", "qssWrapper"]
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
        }
    },

    invokers: {
        alterSetting: {
            funcName: "gpii.app.qssWrapper.alterSetting",
            args: [
                "{that}",
                "{arguments}.0" // updatedSetting
            ]
        }
    }
});

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
