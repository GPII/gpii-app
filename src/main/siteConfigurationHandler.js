/**
 * The site config handler
 *
 * Introduces a component that loads the "site config" and distributes its values.
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

// already added in app.js
// require("json5/lib/register");


/**
 * Take care of the "site configuration" for the gpii-app. It is responsible of loading the config
 * and distributing these options to the proper places. It translates the config values to the
 * proper options that the affected components use.
 */
fluid.defaults("gpii.app.siteConfigurationHandler", {
    gradeNames: ["fluid.component"],

    siteConfigPath: "%gpii-app/siteconfig.json5",
    siteConfig: "@expand:fluid.require({that}.options.siteConfigPath)",

    saveSettingPath: "save",

    distributeOptions: {
        distributeSaveSettings: {
            record: {
                expander: {
                    funcName: "gpii.app.siteConfigurationHandler.getSaveDistribution",
                    args: [
                        "{that}.options.saveSettingPath",
                        "{that}.options.siteConfig.hideQssSaveButton"
                    ]
                }
            },
            target: "{that qssWrapper}.options.settingOptions.hiddenSettings"
        },
        distributeQssConfig: {
            record: "{that}.options.siteConfig.qss",
            target: "{that qssWrapper}.options.siteConfig"
        },
        distributeQssWidgetConfig: {
            record: "{that}.options.siteConfig.qss",
            target: "{that qssWidget}.options.config.params.siteConfig"
        },
        distributeLanguageLabelTemplate: {
            record: "{that}.options.siteConfig.qss.languageOptionLabel",
            target: "{that qssWrapper}.options.settingOptions.languageOptionLabelTemplate"
        },
        distributeDefaultLanguage: {
            record: "{that}.options.siteConfig.qss.systemDefaultLanguage",
            target: "{that qssWrapper}.options.settingOptions.systemDefaultLanguage"
        },
        distributeTooltipShowDelay: {
            record: "{that}.options.siteConfig.qss.tooltipDisplayDelay",
            target: "{that qssTooltipDialog}.options.showDelay"
        },
        distributeQssMorePanelConfig: {
            record: "{that}.options.siteConfig.qssMorePanel",
            target: "{that qssMorePanel}.options.siteConfig"
        },
        distributeQssClickOutside: {
            record: "{that}.options.siteConfig.closeQssOnClickOutside",
            target: "{that gpiiConnector}.options.defaultPreferences.closeQssOnBlur"
        },
        distributeAppBarQss: {
            record: "{that}.options.siteConfig.qss.appBarQss",
            target: "{app gpiiConnector}.options.defaultPreferences.appBarQss"
        },
        distributeOpenQssShortcut: {
            record: "{that}.options.siteConfig.openQssShortcut",
            target: "{that gpiiConnector}.options.defaultPreferences.gpiiAppShortcut"
        },
        distributeDisableRestartWarning: {
            record: "{that}.options.siteConfig.disableRestartWarning",
            target: "{that gpiiConnector}.options.defaultPreferences.disableRestartWarning"
        },
        distributeSurveyTriggersUrl: {
            record: "{that}.options.siteConfig.surveyTriggersUrl",
            target: "{that surveyConnector}.options.config.surveyTriggersUrl"
        },
        distributeAboutDialogConfig: {
            record: "{that}.options.siteConfig.aboutDialog",
            target: "{that aboutDialog}.options.siteConfig"
        },
        distributeTrayType: {
            record: "{that}.options.siteConfig.trayType",
            target: "{that tray}.options.trayType"
        },
        distributeResetToStandardProfileUrl: {
            record: "{that}.options.siteConfig.resetToStandardProfileUrl",
            target: "{that defaultSettingsLoader}.options.defaultSettingsUrl",
            priority: "after:flowManager.remoteDefaultSettings"
        }
    }
});

/**
 * Get value for hiding the save button in QSS.
 * @param {String} saveSettingPath - The path for the "Save" button setting
 * @param {Boolean} shouldHideSaveButton - Whether the save button should be hidden or not
 * @return {String[]} - In case it should be hidden, return the "Save" setting's path
 */
gpii.app.siteConfigurationHandler.getSaveDistribution = function (saveSettingPath, shouldHideSaveButton) {
    return shouldHideSaveButton ? [saveSettingPath] : [];
};
