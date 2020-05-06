/*
 * GPII Sequential Dialogs Integration Test Definitions
 *
 * Copyright 2017 OCAD University
 *
 * Licensed under the New BSD license. You may not use this file except in
 * compliance with this License.
 *
 * The research leading to these results has received funding from the European Union's
 * Seventh Framework Programme (FP7/2007-2013)
 * under grant agreement no. 289016.
 *
 * You may obtain a copy of the License at
 * https://github.com/GPII/universal/blob/master/LICENSE.txt
 */

"use strict";

require("../testUtils.js");
require("./qssWidget-languageTests.js");
require("./qssWidget-readAloudTests.js");
require("./qssWidget-textZoomTests.js");
require("./qssWidget-documorphTests.js");
require("./qssWidget-volumeTests.js");
require("./qssWidget-quickFolderTests.js");
require("./qssWidget-usbTests.js");
require("./qssWidget-screenCaptureTests.js");
require("./qssWidget-officeSimplifyTests.js");
require("./qssWidget-stepperTests.js");
require("./qssWidget-menuTests.js");
require("./qssWidget-mouseTests.js");
require("./qssWidget-urlGoogleDriveTests.js");
require("./qssWidget-urlOneDriveTests.js");
require("./qssWidget-urlDropboxTests.js");
require("./qssWidget-snippingToolTests.js");
require("./qssWidget-customizeQuickstripTests.js");
require("./qssWidget-colorVisionTests.js");
require("./qssService-undoTests.js");
require("./qssService-saveTests.js");
require("./qssService-morePanelTests.js");
require("./qssCommons-tooltipTests.js");
require("./qssCommons-navigationTests.js");
require("./qssCommons-translationsTests.js");
require("./qssCommons-restartWarningTests.js");
require("./qssCommons-widgetClosingBehaviourTests.js");

var fluid = require("infusion"),
    jqUnit = fluid.require("node-jqunit", require, "jqUnit"),
    gpii = fluid.registerNamespace("gpii");

require("../../src/main/app.js");

fluid.registerNamespace("gpii.tests.qss.testDefs");

/**
 * Needed in order not to send setting updates to the Core. The testing of
 * the QSS functionalities does not require that the setting updates are
 * actually applied.
 */
fluid.defaults("gpii.tests.qss.mockedGpiiConnector", {
    gradeNames: "fluid.component",
    invokers: {
        updateSetting: {
            funcName: "fluid.identity"
        }
    }
});

/**
 * Also, in order to test the QSS functionalities, there is no need to apply
 * settings when a user keys in.
 */
fluid.defaults("gpii.tests.qss.mockedLifecycleManager", {
    gradeNames: "fluid.component",
    invokers: {
        applySolution: {
            funcName: "gpii.tests.qss.mockedLifecycleManager.applySolution"
        }
    }
});

gpii.tests.qss.mockedLifecycleManager.applySolution = function () {
    var promise = fluid.promise();
    promise.resolve();
    return promise;
};

/*
 * A subset of the QSS setting messages.
 */
var qssSettingMessagesFixture = {
    bg: {
        "gpii_app_qss_settings_common-language": {
            "title": "Избери Език",
            tooltip: "Some different tooltip",
            "enum": [
                "Анг",
                "Арм",
                "Кит",
                "Китс",
                "Кор",
                "Рус",
                "Исп"
            ]
        },
        "gpii_app_qss_settings_save": {
            "title": "Запиши ме"
        },
        "gpii_app_qss_settings_close": {
            "title": "Затвори ме"
        },
        "gpii_app_qss_settings_appTextZoom": {
            title: "Приближи този текст",
            tooltip: "Some tooltip",
            tip: "Some helpful tip",
            footerTip: "Hopefully something helpful as the tip"
        }
    }
};

var unorderedInstalledLangsFixture = {
    raw: {
        "es-MX": {
            "english": "Spanish",
            "local": "Spanish (Mexico)",
            "native": "español (México)",
            "code": "es-MX"
        },
        "fr": {
            "english": "French",
            "local": "French",
            "native": "français",
            "code": "fr"
        },
        "en-US": {
            "english": "English",
            "local": "English (United States)",
            "native": "english (United States)",
            "code": "en-US"
        }
    },
    lists: {
        keys: [ "en-US", "fr", "es-MX"],
        enum: [ "English (United States)", "Français · French", "Español (México) · Spanish (Mexico)"]
    }
};

var installedLangsShrunkFixture = {
    raw: {
        "en-US": {
            "english": "English",
            "local": "English (United States)",
            "native": "english (United States)",
            "code": "en-US"
        },
        "es-ES": {
            "english": "Spanish",
            "local": "Spanish (Spain)",
            "native": "Español (España)",
            "code": "es-ES"
        }
    },
    lists: {
        keys: ["en-US", "es-ES"],
        enum: ["English (United States)", "Español (España) · Spanish (Spain)"]
    }
};



fluid.defaults("gpii.tests.qss.systemLanguageListener", {
    gradeNames: ["fluid.modelComponent"],

    model: {
        installedLanguages: unorderedInstalledLangsFixture.raw,
        configuredLanguage: null
    },

    listeners: {
        // use a listener to avoid overriding the
        // model binding in the `gpii.app`.
        // There should be a better way
        "onCreate.setDefaultValue": {
            changePath: "configuredLanguage",
            value: "en-US"
        }
    },

    invokers: {
        updateLanguages: {
            funcName: "gpii.app.applier.replace",
            args: [
                "{that}.applier",
                "installedLanguages",
                "{arguments}.0" // new languages
            ]
        }
    }
});

gpii.tests.qss.languageSettingValuesMatches = function (qssWrapper, expectedInstalledLanguages) {
    var languageSetting = qssWrapper.getSetting(qssWrapper.options.settingOptions.settingPaths.language);

    jqUnit.assertDeepEq(
        "QSS should list correctly installed languages",
        [
            expectedInstalledLanguages["enum"],
            expectedInstalledLanguages.keys
        ],
        [
            languageSetting.schema["enum"],
            languageSetting.schema.keys
        ]
    );
};


var qssInstalledLanguages = [
    { // once qssWrapper is firstly created it should have proper languages list
        func: "gpii.tests.qss.languageSettingValuesMatches",
        args: ["{that}.app.qssWrapper", unorderedInstalledLangsFixture.lists]
    },

    { // changing the installed languages
        func: "{that}.app.systemLanguageListener.updateLanguages",
        args: [installedLangsShrunkFixture.raw]
    },
    { // should result in language setting update
        changeEvent: "{that}.app.qssWrapper.applier.modelChanged",
        path: "settings.0.schema.enum", // we want changes only for the language setting
        listener: "gpii.tests.qss.languageSettingValuesMatches",
        args: ["{that}.app.qssWrapper", installedLangsShrunkFixture.lists]
    }
];

gpii.tests.qss.testDefs = {
    name: "QSS Widget integration tests",
    expect: 104,
    config: {
        configName: "gpii.tests.dev.config",
        configPath: "tests/configs"
    },
    distributeOptions: {
        mockedSettings: {
            record: "%gpii-app/tests/fixtures/qssSettings.json",
            target: "{that gpii.app.qssWrapper}.options.settingsFixturePath"
        },
        mockedMessages: {
            record: qssSettingMessagesFixture,
            target: "{that gpii.app}.options.messageBundles"
        },
        mockedAppZoomWrapper: {
            record: "gpii.tests.qss.mockedAppZoomWrapper",
            target: "{that gpii.app}.options.gradeNames"
        },
        mockedGpiiConnector: {
            record: "gpii.tests.qss.mockedGpiiConnector",
            target: "{that gpiiConnector}.options.gradeNames"
        },
        mockedLifecycleManager: {
            record: "gpii.tests.qss.mockedLifecycleManager",
            target: "{that lifecycleManager}.options.gradeNames"
        },
        mockedLanguagesListener: {
            record: "gpii.tests.qss.systemLanguageListener",
            target: "{that gpii.app}.options.components.systemLanguageListener.type",
            priority: "last"
        }
    },

    gradeNames: ["gpii.test.common.testCaseHolder"],
    sequence: [].concat(
        [{ // Wait for the QSS to initialize.
            event: "{that gpii.app.qss}.events.onDialogReady",
            listener: "jqUnit.assert",
            args: ["QSS has initialized successfully"]
        }],
        // Commons
        gpii.tests.qss.navigationTests,
        qssInstalledLanguages,
        gpii.tests.qss.tooltipTests,
        gpii.tests.qss.widgetClosingBehaviourTests,
        gpii.tests.qss.restartWarningTests,
        // Service Buttons
        gpii.tests.qss.undoTests,
        gpii.tests.qss.saveTests,
        gpii.tests.qss.morePanelTests,
        // Widgets
        gpii.tests.qss.languageTests,
        gpii.tests.qss.usbTests,
        gpii.tests.qss.quickFolderTests,
        gpii.tests.qss.volumeTests,
        gpii.tests.qss.documorphTests,
        gpii.tests.qss.urlGoogleDrive,
        gpii.tests.qss.urlOneDrive,
        gpii.tests.qss.urlDropboxDrive,
        gpii.tests.qss.textZoomTests,
        gpii.tests.qss.readAloudTests,
        gpii.tests.qss.screenCaptureTests,
        gpii.tests.qss.officeSimplifyTests,
        gpii.tests.qss.customizeQuickstripTests,
        gpii.tests.qss.menuTests,
        gpii.tests.qss.stepperTests,
        gpii.tests.qss.colorVisionTests,
        gpii.tests.qss.snippingToolTests,
        gpii.tests.qss.translationsTests,
        gpii.tests.qss.mouseTests
    )
};
