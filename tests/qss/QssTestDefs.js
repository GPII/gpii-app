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

var fluid = require("infusion"),
    jqUnit = fluid.require("node-jqunit", require, "jqUnit"),
    gpii = fluid.registerNamespace("gpii");

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
require("./qssService-undoTests.js");
require("./qssService-saveTests.js");
require("./qssService-morePanelTests.js");
require("./qssCommons-tooltipTests.js");
require("./qssCommons-restartWarningTests.js");
require("./qssCommons-widgetClosingBehaviourTests.js");

// QSS related
var clickCloseBtn = "jQuery(\".flc-quickSetStrip > div:last-of-type\").click()",
    clickLanguageBtn = "jQuery(\".flc-quickSetStrip > div:first-of-type\").click()",
    getQssSettingsList = "(function getItems() { var repeater = fluid.queryIoCSelector(fluid.rootComponent, 'gpii.psp.repeater')[0]; return repeater.model.items; }())";

// QSS Widgets related
var checkIfMenuWidget = "jQuery('.flc-qssMenuWidget').is(':visible');";

// Generic
var closeClosableDialog = "jQuery(\".flc-closeBtn\").click()";

require("../../src/main/app.js");

fluid.registerNamespace("gpii.tests.qss.testDefs");

gpii.tests.qss.simulateShortcut = function (dialog, shortcut) {
    dialog.webContents.sendInputEvent({
        type: shortcut.type || "keyUp",
        keyCode: shortcut.key,
        modifiers: shortcut.modifiers || []
    });
};

gpii.tests.qss.getFocusedElementIndex = function () {
    // Note that the elements will be returned in the order in which they appear in the DOM.
    var qssButtons = jQuery(".fl-qss-button"),
        focusedElement = jQuery(".fl-focused")[0];
    return jQuery.inArray(focusedElement, qssButtons);
};

gpii.tests.qss.pressKey = function (key, modifiers) {
    return {
        funcName: "gpii.tests.qss.simulateShortcut",
        args: [
            "{that}.app.qssWrapper.qss.dialog",
            {
                key: key,
                modifiers: modifiers
            }
        ]
    };
};

gpii.tests.qss.assertFocusedElementIndex = function (expectedIndex) {
    return {
        task: "gpii.test.invokeFunctionInWebContentsDelayed",
        args: [
            "{that}.app.qssWrapper.qss.dialog",
            gpii.tests.qss.getFocusedElementIndex,
            100
        ],
        resolve: "jqUnit.assertEquals",
        resolveArgs: [
            "The correct button in the QSS is focused",
            expectedIndex,
            "{arguments}.0"
        ]
    };
};

gpii.tests.qss.clearFocusedElement = function () {
    jQuery(".fl-qss-button").removeClass("fl-focused fl-highlighted");
};

var qssSettingsCount = 16;

var navigationSequence = [
    {
        func: "{that}.app.tray.events.onTrayIconClicked.fire"
    },
    // No focused element at first
    gpii.tests.qss.assertFocusedElementIndex(-1),
    // When the right arrow is pressed, the first button in the QSS will be focused.
    gpii.tests.qss.pressKey("Right"),
    gpii.tests.qss.assertFocusedElementIndex(0),
    gpii.tests.qss.pressKey("Tab"),
    gpii.tests.qss.assertFocusedElementIndex(1),
    gpii.tests.qss.pressKey("Left"),
    gpii.tests.qss.assertFocusedElementIndex(0),
    gpii.tests.qss.pressKey("Tab", ["Shift"]),
    gpii.tests.qss.assertFocusedElementIndex(qssSettingsCount - 1),
    gpii.tests.qss.pressKey("Tab", ["Shift"]),
    gpii.tests.qss.assertFocusedElementIndex(qssSettingsCount - 2),
    // This part of the test is commented because the button is disabled temporary (GPII-3773) and cannot be focused.
    // Some tests may be removed or parts of them re-used in the future.
    // gpii.tests.qss.pressKey("Up"),
    // gpii.tests.qss.assertFocusedElementIndex(qssSettingsCount - 3),
    // gpii.tests.qss.pressKey("Down"),
    // gpii.tests.qss.assertFocusedElementIndex(qssSettingsCount - 2),
    // gpii.tests.qss.pressKey("Left"),
    // gpii.tests.qss.assertFocusedElementIndex(qssSettingsCount - 4),
    // gpii.tests.qss.pressKey("Up"),
    // gpii.tests.qss.assertFocusedElementIndex(qssSettingsCount - 4),
    // This part of the test is commented because the button is disabled temporary (GPII-3773) and cannot be focused.
    // Some tests may be removed or parts of them re-used in the future.
    // gpii.tests.qss.pressKey("Right"),
    // gpii.tests.qss.assertFocusedElementIndex(qssSettingsCount - 3),
    // Manually clear the focused state in order to test the Arrow Left behavior when
    // there is no focused element.
    {
        task: "gpii.test.invokeFunctionInWebContentsDelayed",
        args: [
            "{that}.app.qssWrapper.qss.dialog",
            gpii.tests.qss.clearFocusedElement,
            100
        ],
        resolve: "fluid.identity"
    }, { // Close the QSS and the PSP
        func: "gpii.test.executeJavaScriptInWebContents",
        args: [
            "{that}.app.qssWrapper.qss.dialog",
            clickCloseBtn
        ]
    }
];

    // TODO this could be used instead (of the previous)
    //{ // ! should send info to broker
    //     changeEvent: "{that}.app.qssWrapper.applier.modelChanged",
    //     path: "settings.*",
    //     listener: "jqUnit.assertEquals",
    //     args: [
    //         "Change event was fired from QSS widget interaction.",
    //         "hy",
    //         "{that}.app.qssWrapper.model.settings.0.value"
    //     ]
    // }




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

/*
 * A mock of the settings message
 */
var expectedTranslatedSettings = {
    "http://registry\\.gpii\\.net/common/language": {
        schema: {
            "title": "Избери Език",
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
        tooltip: "Some different tooltip"
    },
    "save": {
        schema: {
            "title": "Запиши ме"
        }
    },
    "close": {
        schema: {
            "title": "Затвори ме"
        }
    },
    "appTextZoom": {
        schema: {
            title: "Приближи този текст"
        },
        tooltip: "Some tooltip",
        tip: "Some helpful tip",
        widget: {
            footerTip: "Hopefully something helpful as the tip"
        }
    }
};


var crossQssTranslations = [
    /*
     * Tests for the QSS i18n behaviour
     */
    { // trigger locale change
        funcName: "{that}.app.applier.change",
        args: ["locale", "bg"]
    },
    { // ... and check whether the settings' text has been updated in the main
        funcName: "gpii.test.assertLeftHandDeep",
        args: [
            "QSS should have its settings translated with locale change",
            expectedTranslatedSettings,
            "@expand:gpii.test.objectArrayToHash({that}.app.qssWrapper.model.settings, path)"
        ]
    }, { // ... and in the renderer as well
        task: "gpii.test.executeJavaScriptInWebContents",
        args: [
            "{that}.app.qssWrapper.qss.dialog",
            getQssSettingsList
        ],
        resolve: "gpii.test.assertLeftHandDeep",
        resolveArgs: [
            "QSS dialog should have its settings translated with locale change",
            expectedTranslatedSettings,
            "@expand:gpii.test.objectArrayToHash({arguments}.0, path)"
        ]
    }
];


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
    expect: 66,
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
        // For no particular reason the tests work properly in this sequence
        // navigationSequence,
        // crossQssTranslations,
        // Commons
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
        gpii.tests.qss.textZoomTests,
        gpii.tests.qss.readAloudTests,
        gpii.tests.qss.screenCaptureTests,
        gpii.tests.qss.officeSimplifyTests,
        gpii.tests.qss.menuTests,
        gpii.tests.qss.stepperindicatorsSequence
    )
};
