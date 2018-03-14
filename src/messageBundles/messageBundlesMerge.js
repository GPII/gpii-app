"use-strict";

var messageBundles = {
    "en": {
        // TODO naming
        "gpii_app_menu_open-psp": "Open PSP",
        "gpii_app_menu_status_keyed_in": "Keyed in with %snapsetName",
        "gpii_app_menu_status_not_keyed": "(No one keyed in)",
        "gpii_app_menu_keyed_out_btn": "Key-out of GPII",

        gpii_app_restartWarning_restartTitle: "Changes require restart",
        gpii_app_restartWarning_osRestartText: "Windows needs to restart to apply your changes.",
        gpii_app_restartWarning_restartText: "In order to be applied, some of the changes you made require the following applications to restart:",
        gpii_app_restartWarning_restartQuestion: "What would you like to do?",

        gpii_app_restartWarning_undo: "Cancel\n(Undo Changes)",
        gpii_app_restartWarning_restartLater: "Close and\nRestart Later",
        gpii_app_restartWarning_restartNow: "Restart Now"
    },
    "en_us": {
        // TODO naming
        "gpii_app_menu_open-psp": "Open the PSP"
    },
    "en_gb": {
        // TODO naming
        "gpii_app_menu_open-psp": "To the PSP"
    },
    "bg": {
        // персонален панел за настройки
        // "gpii_app_menu_open-psp": "Отвори ППН",
        // "gpii_app_menu_status_not_keyed": "(Не сте влезли)",
        // "gpii_app_menu_status_keyed_in": "Вписан с %snapsetName",
        // "gpii_app_menu_keyed_out_btn": "Отписване от GPII",

        gpii_app_restartWarning_restartTitle: "Промените изискват рестартиране.",
        gpii_app_restartWarning_osRestartText: "Windows изисква да бъде рестартиран, за да се приложат настройките.",
        gpii_app_restartWarning_restartText: "За да могат част от вашите настройки да бъдат приложени, следните приложения трябва да бъдат презаредени:",
        gpii_app_restartWarning_restartQuestion: "Какво бихте желали да направите?",

        gpii_app_restartWarning_undo: "Отказ\n(Отменете промените)",
        gpii_app_restartWarning_restartLater: "Затваряне и\n рестартиране по-късно",
        gpii_app_restartWarning_restartNow: "Рестартиране сега"
    }
};

// fr_FR, en -> ["en", "fr", "fr_FR"]
function getLocaleVersions(locale, defaultLocale) {
    var segments = locale.split("_");

    var versions = segments.map(function (segment, index) {
        return segments.slice(0, index + 1).join("_");
    });

    if (defaultLocale) {
        versions.unshift(defaultLocale);
    }

    return versions;
}

function mergeMessageBundles(messageBundles, defaultLocale) {
    var result = {};

    Object.keys(messageBundles).forEach(function (locale) {
        var localeVersions = getLocaleVersions(locale, defaultLocale),
            messageBundle = {};

        localeVersions.forEach(function (localeVersion) {
            if (messageBundles[localeVersion]) {
                messageBundle = Object.assign(messageBundle, messageBundles[localeVersion]);
            }
        });

        result[locale] = messageBundle;
    });

    return result;
}

console.log(mergeMessageBundles(messageBundles, "en"));
