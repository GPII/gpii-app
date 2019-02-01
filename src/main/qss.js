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
 * A component which coordinates the operation of all QSS related components
 * (the QSS itself and its widget, tooltip, notification and "More" dialogs,
 * as well as the undo stack). It also takes care of loading the QSS settings
 * from a local configuration file.
 */
fluid.defaults("gpii.app.qssWrapper", {
    gradeNames: "fluid.modelComponent",


    /*
     * Additional options for QSS settings. These are options that are always
     * valid and may be dependent on some local configuration.
     * Currently they are used for the "site configuration" for conditionally
     * hiding the "Save" button.
     */
    settingOptions: {
        /*
         * The list of hidden settings. These settings are removed from the QSS settings
         * and a placeholder is left at their place.
         */
        hiddenSettings: [],

        // paths might be needed for some reason
        settingPaths: {
            language: "http://registry\\.gpii\\.net/common/language",
            psp: "psp"
        },

        settingMessagesPrefix: "gpii_app_qss_settings",

        languageOptionLabelTemplate:  {
            currentLanguageGroup: "%native",
            genericLanguage: "%native · %local"
        },
        // This language should always be positioned on top of the
        // language setting choices
        systemDefaultLanguage: "en-US"
    },

    settingsFixturePath: "%gpii-app/testData/qss/settings.json",
    loadedSettings: {
        expander: {
            funcName: "gpii.app.qssWrapper.loadSettings",
            args: [
                "{assetsManager}",
                "{systemLanguageListener}.model.installedLanguages",
                "{messageBundles}.model.locale",
                "{messageBundles}.model.messages",
                "{that}.options.settingOptions",
                "{that}.options.settingsFixturePath"
            ]
        }
    },

    settingMessagesPrefix: "gpii_app_qss_settings",

    siteConfig: {
        scaleFactor: 1,
        urls: {
            account: "http://morphic.world/account"
        }
    },

    model: {
        messages: {
            restartWarningNotification: null
        },

        isKeyedIn: false,
        keyedInUserToken: null,
        settings: "{that}.options.loadedSettings",


        scaleFactor: "{that}.options.siteConfig.scaleFactor",

        // user preferences
        closeQssOnBlur: false,
        disableRestartWarning: false
    },

    events: {
        onSettingUpdated: null,
        onActivePreferenceSetAltered: null,
        onUndoRequired: null,
        onResetAllRequired: null,
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
        "onUndoRequired.activateUndo": {
            func: "{undoStack}.undo"
        },
        onResetAllRequired: {
            func: "{app}.resetAllToStandard"
        },
        "onSaveRequired.issuesSaveSettingsRequest": {
            funcName: "gpii.app.qssWrapper.saveSettings",
            args: [
                "{that}",
                "{pspChannel}",
                "{qssNotification}",
                "{gpii.app.qss}",
                "{arguments}.0"
            ]
        }
    },

    modelListeners: {
        "keyedInUserToken": {
            this: "{qssNotification}",
            method: "hide",
            excludeSource: "init"
        },

        "{messageBundles}.model.locale": {
            func: "{that}.updateSettingTranslations",
            excludeSource: "init"
        },

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
            }, {
                funcName: "{that}.showRestartWarningNotification",
                args: ["{change}.value"],
                excludeSource: ["init"]
            }
        ]
    },

    invokers: {
        updateSettings: {
            funcName: "gpii.app.qssWrapper.updateSettings",
            args: [
                "{that}",
                "{arguments}.0", // settings
                "{arguments}.0"  // notUndoable
            ]
        },
        updateSetting: {
            funcName: "gpii.app.qssWrapper.updateSetting",
            args: [
                "{that}",
                "{arguments}.0", // updatedSetting
                "{arguments}.1"  // notUndoable
            ]
        },
        getSetting: {
            funcName: "gpii.app.qssWrapper.getSetting",
            args: [
                "{that}.model.settings",
                "{arguments}.0" // settingPath
            ]
        },
        alterSetting: {
            funcName: "gpii.app.qssWrapper.alterSetting",
            args: [
                "{that}",
                "{arguments}.0", // updatedSetting
                "{arguments}.1" // source
            ]
        },
        showRestartWarningNotification: {
            funcName: "gpii.app.qssWrapper.showRestartWarningNotification",
            args: [
                "{that}",
                "{qss}",
                "{qssNotification}",
                "{arguments}.0" // updatedSetting
            ]
        },
        updateSettingTranslations: {
            funcName: "gpii.app.qssWrapper.updateSettingTranslations",
            args: [
                "{that}",
                "{messageBundles}.model.messages",
                "{that}.model.settings"
            ]
        },
        updateLanguageSettingOptions: {
            funcName: "gpii.app.qssWrapper.updateLanguageSettingOptions",
            args: [
                "{that}",
                "{messageBundles}.model.locale",
                "{systemLanguageListener}.model.installedLanguages"
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
                model: {
                    scaleFactor: "{qssWrapper}.model.scaleFactor"
                },
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
                            closeOnBlur: "{arguments}.0.closeOnBlur",
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
                model: {
                    isKeyedIn: "{qssWrapper}.model.isKeyedIn",
                    scaleFactor: "{qssWrapper}.model.scaleFactor"
                },
                listeners: {
                    "{gpii.app.qss}.channelListener.events.onQssButtonMouseEnter": [{
                        func: "{that}.hide"
                    }, {
                        func: "{that}.showIfPossible",
                        args: [
                            "{arguments}.0", // setting
                            "@expand:gpii.app.qssWrapper.getButtonPosition({gpii.app.qss}, {arguments}.1)"  // btnCenterOffset
                        ]
                    }],

                    "{gpii.app.qss}.events.onDialogHidden": {
                        func: "{that}.hide"
                    },
                    "{gpii.app.qss}.events.onBlur": {
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
                model: {
                    scaleFactor: "{qssWrapper}.model.scaleFactor"
                }
            }
        },
        qssMorePanel: {
            type: "gpii.app.qssMorePanel",
            options: {
                model: {
                    scaleFactor: "{qssWrapper}.model.scaleFactor"
                }
            }
        }
    }
});


/**
 * Shows a notification to the user in case the changed setting requires applications
 * to be restarted in order to be fully applied (restartWarning),
 * and in case the user hasn't disabled such (restartWarning) notificaions.
 * @param {Component} that - The `gpii.qss.buttonPresenter` instance.
 * @param {Component} qss - The `gpii.app.qssDialog` instance.
 * @param {Component} qssNotification - The `gpii.app.qssNotification` instance.
 * @param {Object} updatedSetting - The `gpii.app.qssNotification` instance.
 */
gpii.app.qssWrapper.showRestartWarningNotification = function (that, qss, qssNotification, updatedSetting) {
    if (updatedSetting.restartWarning && !that.model.disableRestartWarning) {
        var description = fluid.stringTemplate(that.model.messages.restartWarningNotification, {
            settingTitle: updatedSetting.schema.title
        });

        qssNotification.show({
            description: description,
            closeOnBlur: false,
            focusOnClose: qss.dialog
        });
    }
};

/**
 * Notifies the `gpii.pspChannel` to trigger preferences save and shows a confirmation message.
 * @param {Component} that - The `gpii.app.qssWrapper` instance.
 * @param {Component} pspChannel - The `gpii.pspChannel` instance.
 * @param {Component} qssNotification - The `gpii.app.qssNotification` instance.
 * @param {Component} qss - The `gpii.app.qss` instance.
 * @param {String} description - The message that should be shown in the QSS notification.
 */
gpii.app.qssWrapper.saveSettings = function (that, pspChannel, qssNotification, qss, description) {
    // Instead of sending a request via the pspChannel, the pspChannel is used directly.
    var saveButtonClickCount = pspChannel.model.saveButtonClickCount || 0;
    pspChannel.applier.change("saveButtonClickCount", saveButtonClickCount + 1, null, "PSP");

    description = fluid.stringTemplate(description, {
        accountUrl: that.options.siteConfig.urls.account
    });

    qssNotification.show({
        description: description,
        focusOnClose: qss.dialog,
        closeOnBlur: true
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
 * When new preferences are delivered to the QSS wrapper, this function takes
 * care of notifying the QSS about the changes which should in turn update its
 * internal models and UI. Note that settings changes as a result of a change
 * in the preference set are not undoable.
 * @param {Component} that - The `gpii.app.qssWrapper` instance.
 * @param {Object[]} settings - Setting changes to be applied
 * @param {String} settings.path - The path of the setting to be updated
 * @param {Any} settings.value - The new value of the setting
 * @param {Boolean} notUndoable - Whether these setting changes are undoable
 */
gpii.app.qssWrapper.updateSettings = function (that, settings, notUndoable) {
    fluid.each(settings, function (setting) {
        that.updateSetting(setting, notUndoable);
    });
};

/**
 * Returns the primary subtag of a language code e.g. if the locale is "en-US"
 * the primary part would be "en".
 * @param {String} locale - A language code in the format: "code-region"
 * @return {String} The primary language subtag
 */
gpii.app.qssWrapper.getPrimaryLanguage = function (locale) {
    return locale && locale.split("-")[0];
};

/**
 * Generates a language setting option label out of a provided language metadata.
 * @param {String} languageOptionLabelTemplate - The template for every language label
 * @param {Object} languageMetadata - The language metadata that includes different labels
 * for the language
 * @param {String} languageMetadata.native - The name of the language in its native form
 * @param {String} languageMetadata.local - The name of the language in the currently applied language
 * @param {String} languageMetadata.english - The name of the of the language in English
 * @return {String} The desired language label
 */
gpii.app.qssWrapper.getLanguageLabel = function (languageOptionLabelTemplate, languageMetadata) {
    languageMetadata.local = languageMetadata.local || languageMetadata.english;

    // Native labels might be coming in full lowercase
    languageMetadata["native"] = gpii.flowManager.capitalizeFirstLetter(languageMetadata["native"]);

    var systemPrimaryLang = gpii.app.qssWrapper.getPrimaryLanguage(languageMetadata.currentLocale),
        currentPrimaryLang = gpii.app.qssWrapper.getPrimaryLanguage(languageMetadata.code);

    /*
     * We wouldn't want to display both the native representation
     * and the main language as they are redundant
     */
    return systemPrimaryLang === currentPrimaryLang ?
        fluid.stringTemplate(languageOptionLabelTemplate.currentLanguageGroup, languageMetadata) :
        fluid.stringTemplate(languageOptionLabelTemplate.genericLanguage, languageMetadata);
};


/**
 * Generates a list of language labels out of the provided languages metadata.
 * @param {Object} settingOptions - The QSS settings specific options
 * @param {String} settingOptions.languageOptionLabelTemplate - The template for every language label
 * @param {String} locale - The current OS locale
 * @param {Object[]} installedLanguages - A list of all languages metadata
 * @return {String[]} The list of labels
 */
gpii.app.qssWrapper.buildLanguageLabels = function (settingOptions, locale, installedLanguages) {
    return installedLanguages.map(function (languageMetadata) {
        languageMetadata.currentLocale = locale;

        return gpii.app.qssWrapper.getLanguageLabel(
            settingOptions.languageOptionLabelTemplate,
            languageMetadata
        );
    });
};



/**
 * Applies special order to the languages metadata that is to be used for generating
 * the language options.
 * The languages are sorted in ascending order according to their English names;
 * The current default language is positioned on top of the list.
 * @param {Object} settingOptions - The options specific to settings
 * @param {Object[]} languagesMetadata - The list of languages metadata for all installed languages
 * @return {Object[]} The ordered metadata
 */
gpii.app.qssWrapper.orderLanguagesMetadata = function (settingOptions, languagesMetadata) {
    // sort by their english labels in ascending order
    languagesMetadata.sort(function (a, b) { return a.english > b.english; });

    // Move the default language at the top
    var systemDefaultLanguageIdx = languagesMetadata.findIndex(function (lang) {
        return lang.code.toLowerCase() === settingOptions.systemDefaultLanguage.toLowerCase();
    });
    if ( systemDefaultLanguageIdx > -1 ) {
        var language = languagesMetadata.splice(systemDefaultLanguageIdx, 1);
        languagesMetadata.unshift(language[0]);
    }

    return languagesMetadata;
};


/**
 * Updates the given language setting so that it contains a proper list of options. The list includes
 * only languages that are currently installed on the machine.
 * @param {Object} settingOptions - The QSS settings specific options
 * @param {Object} locale - The QSS settings specific options
 * @param {Object[]} installedLanguages - The languages that are currently installed in the OS
 * @param {Object} languageSetting - The language setting that is to be populated with language keys and labels
 */
gpii.app.qssWrapper.populateLanguageSettingOptions = function (settingOptions, locale, installedLanguages, languageSetting) {
    // move default language to the top of the list
    var languagesMetadata = fluid.values(installedLanguages);

    var orderedLanguagesMetadata = gpii.app.qssWrapper.orderLanguagesMetadata(settingOptions, languagesMetadata);

    // keep the order but generate readable labels
    var orderedLangLabels = gpii.app.qssWrapper.buildLanguageLabels(settingOptions, locale, orderedLanguagesMetadata);
    var orderedLangCodes = orderedLanguagesMetadata.map(function (language) { return language.code; });


    languageSetting.schema.keys = orderedLangCodes;
    languageSetting.schema["enum"] = orderedLangLabels;

    fluid.log("populateLanguageSettingOptions - decorate language setting: ", locale, installedLanguages, languageSetting);
};

/**
 * Retrieves synchronously the QSS settings from a file on the local machine
 * and resolves any assets that they reference with respect to the `gpii-app`
 * folder.
 * It also applies any other mutations to the settings, such as hiding and translations.
 * @param {Component} assetsManager - The `gpii.app.assetsManager` instance.
 * @param {Object[]} installedLanguages - The languages that are currently installed on the OS
 * @param {Object} locale - The current OS language
 * @param {Object} messageBundles - The available message bundles
 * @param {Object} settingOptions - The options for setting mutations
 * @param {String} settingsFixturePath - The path to the file containing the QSS
 * settings with respect to the `gpii-app` folder.
 * @return {Object[]} An array of the loaded settings
 */
gpii.app.qssWrapper.loadSettings = function (assetsManager, installedLanguages, locale, messageBundles, settingOptions, settingsFixturePath) {
    var loadedSettings = fluid.require(settingsFixturePath);

    fluid.each(loadedSettings, function (loadedSetting) {
        // Resolve dynamic settings, where the function grade is identified by the 'type' field.
        loadedSetting.schema = fluid.transform(loadedSetting.schema, function (schemaItem) {
            var togo;
            if (schemaItem && schemaItem.type) {
                // Call the function, and use the result as the value.
                var result = fluid.invokeGradedFunction(schemaItem.type);
                togo = schemaItem.path ? fluid.get(result, schemaItem.path) : result;
            } else {
                togo = schemaItem;
            }
            return togo;
        });

        var imageAsset = loadedSetting.schema.image;
        if (imageAsset) {
            loadedSetting.schema.image = assetsManager.resolveAssetPath(imageAsset);
        }

        var helpImageAsset = loadedSetting.schema.helpImage;
        if (helpImageAsset) {
            loadedSetting.schema.helpImage = assetsManager.resolveAssetPath(helpImageAsset);
        }
    });

    // more dynamic loading
    var languageSetting = fluid.find_if(loadedSettings, function (setting) {
        return setting.path === settingOptions.settingPaths.language;
    });
    gpii.app.qssWrapper.populateLanguageSettingOptions(settingOptions, locale, installedLanguages, languageSetting);

    // sync the language value as well
    languageSetting.value = locale;

    /*
     * Hide settings
     */
    if (settingOptions.hiddenSettings) {
        fluid.each(settingOptions.hiddenSettings, function (hiddenSettingPath) {
            var settingToHideIdx = loadedSettings.findIndex(function (setting) {
                return setting.path === hiddenSettingPath;
            });

            if (settingToHideIdx > -1) {
                // Ensure there isn't any metadata left for the button
                // Make the button a placeholder (a button in hidden state)
                loadedSettings[settingToHideIdx] = {
                    path: null,
                    schema: {
                        /*
                         * In the renderer the type property is used for choosing the proper handling
                         * approach. Use a special type of "disabled" so that the button (placeholder) is
                         * represented disable fashion.
                         */
                        type: "disabled",
                        title: ""
                    },
                    // Preserve the styling of the corresponding QSS button
                    buttonTypes: loadedSettings[settingToHideIdx].buttonTypes
                };
            }
        });
    }

    /*
     * Translations
     */
    loadedSettings = gpii.app.qssWrapper.applySettingTranslations(settingOptions, messageBundles, loadedSettings);


    return loadedSettings;
};


/**
 * Find a QSS setting by its path.
 * @param {Object[]} settings - The QSS settings list
 * @param {String} path - The path of the searched setting
 * @return {Object} The desired QSS setting
 */
gpii.app.qssWrapper.getSetting = function (settings, path) {
    return fluid.find_if(settings, function (setting) {
        return setting.path === path;
    });
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
    // trying to find the primary setting's index (anything that is not secondary setting)
    var settingIndex = that.model.settings.findIndex(function (setting) {
        return setting.path === updatedSetting.path && !fluid.model.diff(setting, updatedSetting);
    });

    // there is no result, looking for secondary settings
    if (settingIndex === -1) {
        var primarySettingIndex = false, // store primary setting's index (ie. 0; 1; etc.)
            secondarySettingKey = false, // store secondary setting's key (ie. "mouseSpeed"; "swapMouseButtons"; etc.)
            secondarySettingData = false; // store secondary index object data

        fluid.each(that.model.settings, function(el, index) {
            if (fluid.isValue(el.settings)) {
                primarySettingIndex = index;
                secondarySettingData = fluid.find_if(el.settings, function(setting, key) {
                    secondarySettingKey = key;
                    return setting.path === updatedSetting.path && !fluid.model.diff(setting, updatedSetting);
                });
            }
        });

        if (secondarySettingData) {
            // we found a secondary setting that matches
            // applying the secondary setting's change
            that.applier.change("settings."+primarySettingIndex+".settings."+secondarySettingKey, updatedSetting, null, source);
        }
    } else {
        // we do have result, applying primary setting's change
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
    var scaleFactor = qss.model.scaleFactor,
        offsetLeft = scaleFactor * buttonElemMetrics.offsetLeft,
        offsetTop = scaleFactor * buttonElemMetrics.offsetTop,
        buttonWidth = scaleFactor * buttonElemMetrics.width;

    return {
        x: qss.model.width - offsetLeft - buttonWidth / 2,
        y: qss.model.height - offsetTop
    };
};

/**
 * Translate the given setting by updating its text properties with the passed messages.
 * @param {Object} qssSettingMessages - The QSS settings messages. Currently, a qss setting
 * has the following messages: title, tooltip, [tip], [enum], [footerTip]
 * @param {Object} setting - The setting to be applied messages to
 * @return {Object} A translated copy of the QSS setting
 */
gpii.app.qssWrapper.applySettingTranslation = function (qssSettingMessages, setting) {

    var translatedSetting = fluid.copy(setting),
        message = qssSettingMessages[translatedSetting.messageKey];

    // translation of the main settings
    if (message) {
        translatedSetting.tooltip = message.tooltip;
        translatedSetting.tip = message.tip;
        translatedSetting.extendedTip = message.extendedTip;

        if (fluid.isValue(message.footerTip)) {
            translatedSetting.widget = translatedSetting.widget || {};
            translatedSetting.widget.footerTip = message.footerTip;
        }

        translatedSetting.schema.title = message.title;
        if (message["enum"]) {
            translatedSetting.schema["enum"] = message["enum"];
        }
    }
    // checking if we have secondary settings (looking for a `settings` node
    if (fluid.isValue(translatedSetting.settings)) {
        fluid.each(translatedSetting.settings, function(secondarySetting, index) {
            var secondaryMessage = qssSettingMessages[secondarySetting.messageKey];
            if (secondaryMessage && fluid.isValue(secondaryMessage.title)) {
                // applying the title of the setting
                // the secondary settings don't have any other translation part, only titles
                secondarySetting.schema.title = secondaryMessage.title;
            }
        });
    }

    return translatedSetting;
};



/**
 * Apply translations to all settings using the existing messages "mega" bundle. A translated QSS setting is a setting
 * with all its text properties updated with the current locale messages. A translation is notified trough the changeApplier.
 * N.B. - this function updates given objects in place
 * @param {Object} settingOptions - Specific options for the QSS settings
 * @param {Object} messageBundles - Messages for the current locale
 * @param {Object[]} qssSettingControls - The list of QSS settings to be applied translations to
 * @return {Object[]} The QSS settings with updated translations
 */
gpii.app.qssWrapper.applySettingTranslations = function (settingOptions, messageBundles, qssSettingControls) {
    var qssSettingMessagesGroup = settingOptions.settingMessagesPrefix,
        qssSettingMessages = messageBundles[qssSettingMessagesGroup];

    fluid.log("qssWrapper#applySettingTranslations: ", messageBundles);

    // Straight forward translations
    var translatedSettings = qssSettingControls.map(function (setting) {
        return gpii.app.qssWrapper.applySettingTranslation(qssSettingMessages, setting);
    });

    return translatedSettings;
};

/**
 * Updates setting translations corresponding to a change in the locale.
 * @param {Component} that - The `gpii.app.qssWrapper` instance
 * @param {Object} messageBundles - Messages for the current locale
 * @param {Object[]} qssSettingControls - The list of QSS settings to be applied translations to
 */
gpii.app.qssWrapper.updateSettingTranslations = function (that, messageBundles, qssSettingControls) {
    fluid.log("qssWrapper#updateSettingTranslations: ", messageBundles);

    var translatedSettings = gpii.app.qssWrapper.applySettingTranslations(
        that.options.settingOptions,
        messageBundles,
        qssSettingControls
    );

    // save settings with translations
    fluid.each(translatedSettings, function (setting) {
        that.alterSetting(setting, "gpii.app.undoStack.notUndoable");
    });
};

/**
 * Updates the language setting options. They can change dynamically as the OS currently
 * installed languages are displayed as options.
 * @param {Component} that - The gpii.app.qssWrapper` instance
 * @param {String} locale - The current locale for the OS
 * @param {Object[]} installedLanguages - Currently installed languages
 */
gpii.app.qssWrapper.updateLanguageSettingOptions = function (that, locale, installedLanguages) {
    var languageSetting = fluid.copy(that.getSetting(that.options.settingOptions.settingPaths.language));
    gpii.app.qssWrapper.populateLanguageSettingOptions(that.options.settingOptions, locale, installedLanguages, languageSetting);

    fluid.log("qssWrapper#updateLanguageSettingOptions: ", languageSetting);

    that.alterSetting(languageSetting, "gpii.app.undoStack.notUndoable");
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
    model: {
        isKeyedIn: "{qssWrapper}.model.isKeyedIn",
        closeQssOnBlur: "{qssWrapper}.model.closeQssOnBlur",
        scaleFactor: "{qssWrapper}.model.scaleFactor"
    },
    config: {
        params: {
            settings: "{qssWrapper}.model.settings"
        }
    },
    pspButtonPath: "psp",
    events: {
        onQssPspClose: "{qssWrapper}.events.onQssPspClose",
        onUndoIndicatorChanged: null,

        onQssWidgetToggled: "{qssWidget}.events.onQssWidgetToggled"
    },
    listeners: {
        onQssSettingAltered: {
            func: "{qssWrapper}.alterSetting",
            args: [
                "{arguments}.0", // updatedSetting
                "qss"
            ]
        },
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
        "{channelListener}.events.onQssButtonActivated": {
            func: "{qssWidget}.toggle",
            args: [
                "{arguments}.0", // setting
                "@expand:gpii.app.qssWrapper.getButtonPosition({gpii.app.qss}, {arguments}.1)",  // btnCenterOffset
                "{arguments}.2"  // activationParams
            ]
        },
        "{channelListener}.events.onQssNotificationRequired": {
            func: "{qssNotification}.show",
            args: [{
                description: "{arguments}.0.description",
                closeOnBlur: "{arguments}.0.closeOnBlur",
                focusOnClose: "{that}.dialog"
            }] // notificationParams
        },
        "{channelListener}.events.onQssMorePanelRequired": {
            func: "{qssMorePanel}.toggle"
        },
        "{channelListener}.events.onQssUndoRequired": "{qssWrapper}.events.onUndoRequired",
        "{channelListener}.events.onQssResetAllRequired": "{qssWrapper}.events.onResetAllRequired",
        "{channelListener}.events.onQssSaveRequired": "{qssWrapper}.events.onSaveRequired",
        "{channelListener}.events.onQssPspOpen": "{qssWrapper}.events.onQssPspOpen"
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
