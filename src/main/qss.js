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

require("./dialogs/quickSetStrip/qssDialog.js");
require("./dialogs/quickSetStrip/qssTooltipDialog.js");
require("./dialogs/quickSetStrip/qssWidgetDialog.js");
require("./dialogs/quickSetStrip/qssNotificationDialog.js");
require("./dialogs/quickSetStrip/qssMorePanel.js");
require("./common/undoStack.js");


fluid.defaults("gpii.app.resettableQssWrapper", {
    gradeNames: ["gpii.app.qssWrapper"],

    members: {
        previousState: {
            gpiiKey: null,
            activeSet: null
        }
    },

    listeners: {
        // override existing listener
        "onPreferencesUpdated.applyPrefSettings": {
            func: "gpii.app.resettableQssWrapper.applyDecoratedPreferenceSettings",
            args: [
                "{that}",
                "{that}.options.defaultQssSettings",
                "{arguments}.0"
            ]
        }
    },

    // The "original" values of the QSS settings
    defaultQssSettings: [{
        "path": "http://registry\\.gpii\\.net/common/language",
        "value": "en"
    }, {
        "path": "http://registry\\.gpii\\.net/common/DPIScale",
        "value": 1.25
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

gpii.app.resettableQssWrapper.applyDecoratedPreferenceSettings = function (that, defaultQssSettings, preferences) {
    var settings = gpii.app.qssWrapper.getPreferencesSettings(preferences && preferences.settingGroups),
        notUndoable = false;

    if (that.previousState.gpiiKey !== preferences.gpiiKey || that.previousState.activeSet !== preferences.activeSet) {
        /// Else comes from addition of new setting
        console.log("resettableQssWrapper: Apply QSS original settings");

        notUndoable = true;

        /// merge new settings with the original qss settings
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
                args: ["{change}.path", "{change}.oldValue"],
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
            type: "gpii.app.qssInWrapper"
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
                            description: "{arguments}.0",
                            focusOnClose: "{that}.dialog"
                        }]
                    }
                },
                modelListeners: {
                    // Ensure the widget window is closed with the QSS
                    "{gpii.app.qss}.model.isShown": {
                        // it won't hurt if this is called
                        // even on QSS show
                        func: "{that}.hide"
                    }
                }
            }
        },
        qssTooltip: {
            type: "gpii.app.qssTooltipDialog",
            options: {
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

                    // TODO we could also have a modelListener and always hide. See widget
                    "{gpii.app.qss}.events.onDialogHidden": {
                        func: "{that}.delayedHide"
                    },
                    "{gpii.app.qss}.channelListener.events.onQssButtonActivated": {
                        func: "{that}.delayedHide"
                    },
                    "{gpii.app.qss}.channelListener.events.onQssButtonsFocusLost": {
                        func: "{that}.delayedHide"
                    },
                    "{gpii.app.qss}.channelListener.events.onQssButtonMouseLeave": {
                        func: "{that}.delayedHide"
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
    }
});

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
 * Whenever a button in the QSS is focused hides the QSS widget and the PSP in case
 * the setting for the newly focused button is different from the QSS widget's setting
 * (or the setting for the PSP button respectively).
 */
gpii.app.qss.hideQssMenus = function (that, qssWidget, setting) {
    if (setting.path !== qssWidget.model.setting.path) {
        qssWidget.hide();
    }

    if (setting.path !== that.options.pspButtonPath) {
        that.events.onQssPspClose.fire();
    }
};

gpii.app.qssWrapper.registerUndoableChange = function (that, changePath, oldValue) {
    var isChangeUndoable = !fluid.find_if(
        that.options.unwatchedSettings,
        function (excludedPath) { return oldValue.path === excludedPath; });

    if (isChangeUndoable) {
        that.registerChange({
            oldValue: oldValue,
            changePath: changePath
        });
    }
};

gpii.app.undoStack.revertChange = function (qssWrapper, change) {
    qssWrapper.alterSetting({
        path:  change.oldValue.path,
        value: change.oldValue.value
    }, "gpii.app.undoStack.undo");
};

/**
 * Update the state of a QSS setting, i.e. only the value of the setting
 * is updated.
 *
 * @param {Component} that - The `gpii.app.qssWrapper` component
 * @param {Object} updatedSetting - The setting with updated state
 * @param {Boolean} notUndoable - Whether the setting is undoable or not
 */
gpii.app.qssWrapper.updateSetting = function (that, updatedSetting, notUndoable) {
    var updateNamespace = notUndoable ? "gpii.app.undoStack.notUndoable" : null;

    // update only the value of the setting
    that.alterSetting(
        fluid.filterKeys(updatedSetting, ["path", "value"]),
        updateNamespace
    );
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



/**
 * Update QSS settings from the updated preference set.
 * Note: preference set changes are not undoable.
 *
 * @param {Component} that
 * @param {Obeject[]} preferences
 */
gpii.app.qssWrapper.applyPreferenceSettings = function (that, preferences) {
    var settings = gpii.app.qssWrapper.getPreferencesSettings(preferences.settingGroups);

    fluid.each(settings, function (setting) {
        that.updateSetting(setting, true);
    });
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

/**
 * Update a QSS setting - all its data.
 *
 * @param that
 * @param updatedSetting
 * @param source
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
 * Compute the center of the button.
 */
gpii.app.qssWrapper.getButtonPosition = function (qss, buttonElemMetrics) {
    return {
        // center of the button
        x: qss.width - buttonElemMetrics.offsetLeft - (buttonElemMetrics.width / 2),
        y: buttonElemMetrics.height
    };
};

gpii.app.qssWidget.updateIfMatching = function (qssWidget, updatedSetting) {
    // Update the widget only if the changed setting is the one which the widget is displaying
    if (qssWidget.model.setting.path === updatedSetting.path) {
        qssWidget.events.onSettingUpdated.fire(updatedSetting);
    }
};



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
                "{arguments}.0", // changePath
                "{arguments}.1" // oldValue
            ]
        }
    }
});