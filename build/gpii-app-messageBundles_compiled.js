/**
 * The PSP Main component
 *
 * A component that represents the whole PSP. It wraps all of the PSP's functionality and also provides information on whether there's someone keyIn or not.
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

var gpii = fluid.registerNamespace("gpii");

/**
 * Holds all messages for the app (renderer included)
 */
fluid.defaults("gpii.app.messageBundles", {
    gradeNames: ["fluid.modelComponent"],

    model: {
        locale: "bg",

        // keep messages here in order to make use
        // of the model events system
        messages: {}
    },

    defaultLocale: "en_us",

    messageBundles: {"bg":{"gpii_app_menu_open-psp":"Отвори ППН","gpii_app_menu_status_keyed_in":"Вписан с %snapsetName","gpii_app_menu_status_not_keyed":"(Не сте влезли)","gpii_app_menu_keyed_out_btn":"Отписване от GPII","gpii_psp_splash_heading":"Не сте вписан","gpii_psp_splash_fullAppName":"GPII - Персонален Панел за Настройки","gpii_psp_titlebar_appName":"GPII Настройки","gpii_psp_header_autosaveText":"Автоматично запазване е включено","gpii_psp_header_keyOut":"Отпиши се","gpii_psp_settingPresenter_osRestart":"За да промените тази настройка,\nWindows трябва да се рестартира.","gpii_psp_settingPresenter_osRestartRequired":"Променихте тази настройка, което\nизисква Windows да се рестартира.","gpii_psp_settingPresenter_appRestart":"%solutionName - за да промените тази настройка,\nприложението трябва да се рестартира.","gpii_psp_settingPresenter_appRestartRequired":"%solutionName - променихте тази настройка,\nкоето изисква приложението да се рестартира.","gpii_app_restartWarning_osName":"Windows","gpii_app_restartWarning_restartTitle":"Промените изискват рестартиране.","gpii_app_restartWarning_osRestartText":"Windows изисква да бъде рестартиран, за да се приложат настройките.","gpii_app_restartWarning_restartText":"За да могат част от вашите настройки да бъдат приложени, следните приложения трябва да бъдат презаредени:","gpii_app_restartWarning_restartQuestion":"Какво бихте желали да направите?","gpii_app_restartWarning_undo":"Отказ\n(Отменете промените)","gpii_app_restartWarning_restartLater":"Затваряне и\n рестартиране по-късно","gpii_app_restartWarning_restartNow":"Рестартиране сега","gpii_psp_footer_help":"Помощ"},"en":{"gpii_app_menu_open-psp":"Open PSP","gpii_app_menu_status_keyed_in":"Keyed in with %snapsetName","gpii_app_menu_status_not_keyed":"(No one keyed in)","gpii_app_menu_keyed_out_btn":"Key-out of GPII","gpii_psp_splash_heading":"Not keyed in","gpii_psp_splash_fullAppName":"GPII - Personal Settings Panel","gpii_psp_titlebar_appName":"GPII Settings","gpii_psp_header_autosaveText":"Auto-save is on","gpii_psp_header_keyOut":"Key Out","gpii_psp_settingPresenter_osRestart":"To change this setting,\nWindows requires a restart.","gpii_psp_settingPresenter_osRestartRequired":"You changed this setting, which\nrequires Windows to restart.","gpii_psp_settingPresenter_appRestart":"%solutionName - To change this setting,\nthe app requires a restart.","gpii_psp_settingPresenter_appRestartRequired":"%solutionName - You changed this setting,\nwhich requires the app to restart.","gpii_app_restartWarning_osName":"Windows","gpii_app_restartWarning_restartTitle":"Changes require restart","gpii_app_restartWarning_osRestartText":"Windows needs to restart to apply your changes.","gpii_app_restartWarning_restartText":"In order to be applied, some of the changes you made require the following applications to restart:","gpii_app_restartWarning_restartQuestion":"What would you like to do?","gpii_app_restartWarning_undo":"Cancel\n(Undo Changes)","gpii_app_restartWarning_restartLater":"Close and\nRestart Later","gpii_app_restartWarning_restartNow":"Restart Now","gpii_psp_footer_help":"Help"},"en_us":{"gpii_app_menu_open-psp":"Open the PSP","gpii_app_menu_status_keyed_in":"Keyed in with %snapsetName","gpii_app_menu_status_not_keyed":"(No one keyed in)","gpii_app_menu_keyed_out_btn":"Key-out of GPII","gpii_psp_splash_heading":"Not keyed in","gpii_psp_splash_fullAppName":"GPII - Personal Settings Panel","gpii_psp_titlebar_appName":"GPII Settings","gpii_psp_header_autosaveText":"Auto-save is on","gpii_psp_header_keyOut":"Key Out","gpii_psp_settingPresenter_osRestart":"To change this setting,\nWindows requires a restart.","gpii_psp_settingPresenter_osRestartRequired":"You changed this setting, which\nrequires Windows to restart.","gpii_psp_settingPresenter_appRestart":"%solutionName - To change this setting,\nthe app requires a restart.","gpii_psp_settingPresenter_appRestartRequired":"%solutionName - You changed this setting,\nwhich requires the app to restart.","gpii_app_restartWarning_osName":"Windows","gpii_app_restartWarning_restartTitle":"Changes require restart","gpii_app_restartWarning_osRestartText":"Windows needs to restart to apply your changes.","gpii_app_restartWarning_restartText":"In order to be applied, some of the changes you made require the following applications to restart:","gpii_app_restartWarning_restartQuestion":"What would you like to do?","gpii_app_restartWarning_undo":"Cancel\n(Undo Changes)","gpii_app_restartWarning_restartLater":"Close and\nRestart Later","gpii_app_restartWarning_restartNow":"Restart Now","gpii_psp_footer_help":"Help"}},

    modelListeners: {
        "locale": {
            func: "{that}.updateMessages"
        }
    },

    invokers: {
        updateMessages: {
            funcName: "gpii.app.messageBundles.updateMessages",
            args: [
                "{that}",
                "{that}.options.messageBundles",
                "{that}.model.locale",
                "{that}.options.defaultLocale"
            ]
        }
    }
});


/**
 * Make a bulk update of the currently set translations
 *
 * TODO
 * @param that
 * @param messageBundles
 * @param locale
 * @param defaultLocale
 * @returns {undefined}
 */
gpii.app.messageBundles.updateMessages = function (that, messageBundles, locale, defaultLocale) {
    var messages = messageBundles[locale];

    if (!messages) {
        fluid.log(fluid.logLevel.WARN, "Bundles for locale - " + locale + " - are missing. Using default locale of: " + defaultLocale);
        messages = messageBundles[defaultLocale];
    }

    console.log("Update: ", messages);
    that.applier.change("messages", messages);
};

