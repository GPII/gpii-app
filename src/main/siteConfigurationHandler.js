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

    siteConfigPath: [
        process.env.ProgramData + "/Morphic/siteconfig.json5",
        "%gpii-app/siteconfig.json5"
    ],
    siteConfig: "@expand:{that}.requireFirst({that}.options.siteConfigPath)",

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
        distributeQssConfig: {
            record: "{that}.options.siteConfig.qss",
            target: "{app qssWrapper}.options.siteConfig"
        },
        distributeQssWidgetConfig: {
            record: "{that}.options.siteConfig.qss",
            target: "{app qssWidget}.options.config.params.siteConfig"
        },
        distributeLanguageLabelTemplate: {
            record: "{that}.options.siteConfig.qss.languageOptionLabel",
            target: "{app qssWrapper}.options.settingOptions.languageOptionLabelTemplate"
        },
        distributeDefaultLanguage: {
            record: "{that}.options.siteConfig.qss.systemDefaultLanguage",
            target: "{app qssWrapper}.options.settingOptions.systemDefaultLanguage"
        },
        distributeTooltipShowDelay: {
            record: "{that}.options.siteConfig.qss.tooltipDisplayDelay",
            target: "{app qssTooltipDialog}.options.showDelay"
        },
        distributeQssMorePanelConfig: {
            record: "{that}.options.siteConfig.qssMorePanel",
            target: "{app qssMorePanel}.options.siteConfig"
        },
        distributeQssClickOutside: {
            record: "{that}.options.siteConfig.closeQssOnClickOutside",
            target: "{app gpiiConnector}.options.defaultPreferences.closeQssOnBlur"
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
        },
        distributeTrayType: {
            record: "{that}.options.siteConfig.trayType",
            target: "{app tray}.options.trayType"
        },
        distributeAutoLogin: {
            record: "{that}.options.siteConfig.autoLogin",
            target: "{/ gpii.windows.userListeners.windowsLogin}.options.config"
        }
    },

    invokers: {
        requireFirst: "gpii.app.siteConfigurationHandler.requireFirst"
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

/**
 * Requires the first successfully required file in the given array. Used to load a file and provide a fall-back
 * location if it doesn't exist.
 *
 * @param {Array<String>} files The files to attempt to require. Only the first successful file is required.
 * @return {Object} The loaded module from the first successful required file.
 */
gpii.app.siteConfigurationHandler.requireFirst = function (files) {
    var firstError;
    var togo = fluid.find(fluid.makeArray(files), function (file) {
        try {
            fluid.log(fluid.logLevel.WARN, "Reading site config from " + file);
            return fluid.require(file);
        } catch (e) {
            fluid.log(fluid.logLevel.WARN, "Unable to read site config from " + file + ": " + e.message);
            if (!firstError) {
                firstError = e;
            }
        }
    });

    // If nothing gets loaded, then re-throw the first error.
    if (!togo && firstError) {
        throw firstError;
    }
    return togo;
};
