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
            target: "{app qssWrapper}.options.settingOptions.hiddenSettings"
        },
        distributeQssScaleFactor: {
            record: "{that}.options.siteConfig.qss",
            target: "{app qssWrapper}.options.siteConfig"
        },
        distributeLanguageLabelTemplate: {
            record: "{that}.options.siteConfig.qss.languageOptionLabel",
            target: "{app qssWrapper}.options.settingOptions.languageOptionLabelTemplate"
        },
        distributeDefaultLanguage: {
            record: "{that}.options.siteConfig.qss.defaultLanguage",
            target: "{app qssWrapper}.options.settingOptions.defaultLanguage"
        },
        distributePspConfig: {
            record: "{that}.options.siteConfig.psp",
            target: "{app psp}.options.siteConfig"
        },
        distributeDialogScaleFactor: {
            record: "{that}.options.siteConfig.pspScaleFactor",
            target: "{app dialogManager}.options.scaleFactor"
        },
        distributeQssMorePanelConfig: {
            record: "{that}.options.siteConfig.qssMorePanel",
            target: "{app qssMorePanel}.options.siteConfig"
        },
        distributeQssClickOutside: {
            record: "{that}.options.siteConfig.closeQssOnClickOutside",
            target: "{app gpiiConnector}.options.defaultPreferences.closeQssOnBlur"
        },
        distributePspClickOutside: {
            record: "{that}.options.siteConfig.closePspOnClickOutside",
            target: "{app gpiiConnector}.options.defaultPreferences.closePspOnBlur"
        },
        distributeOpenQssShortcut: {
            record: "{that}.options.siteConfig.openQssShortcut",
            target: "{app gpiiConnector}.options.defaultPreferences.gpiiAppShortcut"
        },
        distributeDisableRestartWarning: {
            record: "{that}.options.siteConfig.disableRestartWarning",
            target: "{app gpiiConnector}.options.defaultPreferences.disableRestartWarning"
        },
        distributeSurveyTriggersUrl: {
            record: "{that}.options.siteConfig.surveyTriggersUrl",
            target: "{app surveyConnector}.options.config.surveyTriggersUrl"
        },
        distributeAboutDialogConfig: {
            record: "{that}.options.siteConfig.aboutDialog",
            target: "{app aboutDialog}.options.siteConfig"
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
