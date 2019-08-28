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
require("./qssWidget-stepperTests.js");
require("./qssWidget-screenCaptureTests.js");
require("./qssWidget-officeSimplifyTests.js");
require("./qssService-undoTests.js");
require("./qssService-saveTests.js");
require("./qssService-morePanelTests.js");

// QSS related
var hoverCloseBtn = "jQuery(\".flc-quickSetStrip > div:last-of-type\").trigger(\"mouseenter\")",
    unhoverCloseBtn = "jQuery(\".flc-quickSetStrip > div:last-of-type\").trigger(\"mouseleave\")",
    focusCloseBtn = "var event = jQuery.Event(\"keyup\"); event.shiftKey = true; event.key = \"Tab\"; jQuery(\".flc-quickSetStrip > div:first-of-type\").trigger(event)",
    clickCloseBtn = "jQuery(\".flc-quickSetStrip > div:last-of-type\").click()",
    hoverLanguageBtn = "jQuery(\".flc-quickSetStrip > div:first-of-type\").trigger('mouseenter')",
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

var restartWarningSequence = [
    { // Simulate language change
        func: "{that}.app.qssWrapper.alterSetting",
        args: [{
            path: "http://registry\\.gpii\\.net/common/language",
            value: "ko-KR"
        }]
    }, { // restart warning is not shown
        funcName: "jqUnit.assertFalse",
        args: [
            "Restart warning notification is shown only one time per session",
            "{that}.app.qssWrapper.qssNotification.model.isShown"
        ]
    }, { // bring everything back to normal
        func: "{that}.app.resetAllToStandard"
    }
];


var tooltipSequence = [
    { // Open the QSS...
        func: "{that}.app.tray.events.onTrayIconClicked.fire"
    }, {
        func: "jqUnit.assertFalse",
        args: [
            "The QSS tooltip is not shown initially",
            "{that}.app.qssWrapper.qssTooltip.model.isShown"
        ]
    }, { // ... and hover on its close button.
        func: "gpii.test.executeJavaScriptInWebContents",
        args: [
            "{that}.app.qssWrapper.qss.dialog",
            hoverCloseBtn
        ]
    }, { // This will bring up the tooltip for that button.
        changeEvent: "{that}.app.qssWrapper.qssTooltip.applier.modelChanged",
        path: "isShown",
        listener: "jqUnit.assertTrue",
        args: [
            "The QSS tooltip is shown when a button is hovered",
            "{that}.app.qssWrapper.qssTooltip.model.isShown"
        ]
    }, { // When the button is no longer hovered...
        func: "gpii.test.executeJavaScriptInWebContents",
        args: [
            "{that}.app.qssWrapper.qss.dialog",
            unhoverCloseBtn
        ]
    }, { // ... the tooltip is gone.
        changeEvent: "{that}.app.qssWrapper.qssTooltip.applier.modelChanged",
        path: "isShown",
        listener: "jqUnit.assertFalse",
        args: [
            "The QSS tooltip is hidden when the button is no longer hovered",
            "{that}.app.qssWrapper.qssTooltip.model.isShown"
        ]
    },
    // hover & click === close
    { // Hovering the language button
        func: "gpii.test.executeJavaScriptInWebContents",
        args: [
            "{that}.app.qssWrapper.qss.dialog",
            hoverLanguageBtn
        ]
    }, { // ... should show the tooltip
        changeEvent: "{that}.app.qssWrapper.qssTooltip.applier.modelChanged",
        path: "isShown",
        listener: "jqUnit.assertTrue",
        args: [
            "The QSS tooltip is shown when a button is focused using the keyboard",
            "{that}.app.qssWrapper.qssTooltip.model.isShown"
        ]
    }, { // ... and clicking (activating) the button
        funcName: "gpii.test.executeJavaScriptInWebContents",
        args: [
            "{that}.app.qssWrapper.qss.dialog",
            clickLanguageBtn
        ]
    }, { // ... should close the tooltip
        changeEvent: "{that}.app.qssWrapper.qssTooltip.applier.modelChanged",
        path: "isShown",
        listener: "jqUnit.assertFalse",
        args: [
            "The QSS tooltip is closed when a button is activated",
            "{that}.app.qssWrapper.qssTooltip.model.isShown"
        ]
    },
    // menu close === no tooltip
    {   // XXX we need some minor timeout for the QSS to get
        // in normal state. In case this is not present,
        // the next item doesn't take effect
        task: "gpii.test.linger",
        args: [1000],
        resolve: "fluid.identity"
    },
    // hover & esc === close
    { // Focusing the close button
        func: "gpii.test.executeJavaScriptInWebContents",
        args: [
            "{that}.app.qssWrapper.qss.dialog",
            focusCloseBtn
        ]
    }, { // ... will show the tooltip
        event: "{that}.app.qssWrapper.qssTooltip.events.onDialogShown",
        listener: "fluid.identity" // already tested
    }, { // ... and then, when Esc is used
        funcName: "gpii.tests.qss.simulateShortcut",
        args: [
            "{that}.app.qssWrapper.qss.dialog",
            {
                key: "Escape",
                type: "keyDown"
            }
        ]
    }, { // ... should close the tooltip
        changeEvent: "{that}.app.qssWrapper.qssTooltip.applier.modelChanged",
        path: "isShown",
        listener: "jqUnit.assertFalse",
        args: [
            "The QSS tooltip is closed when Esc is used",
            "{that}.app.qssWrapper.qssTooltip.model.isShown"
        ]
    }
];

var menuInteractionsSequence = [
    { // If the language button in the QSS is clicked...
        func: "gpii.test.executeJavaScriptInWebContents",
        args: [
            "{that}.app.qssWrapper.qss.dialog",
            clickLanguageBtn
        ]
    }, { // ... the QSS widget menu will be shown.
        changeEvent: "{that}.app.qssWrapper.qssWidget.applier.modelChanged",
        path: "isShown",
        listener: "jqUnit.assertTrue",
        args: [
            "The QSS widget is shown when the language button is pressed",
            "{that}.app.qssWrapper.qssWidget.model.isShown"
        ]
    }, { // If the close button in the QSS is pressed...
        func: "gpii.test.executeJavaScriptInWebContents",
        args: [
            "{that}.app.qssWrapper.qssWidget.dialog",
            closeClosableDialog
        ]
    }, { // ... the QSS widget menu will be hidden.
        changeEvent: "{that}.app.qssWrapper.qssWidget.applier.modelChanged",
        path: "isShown",
        listener: "jqUnit.assertFalse",
        args: [
            "The QSS widget is hidden when its closed button is pressed",
            "{that}.app.qssWrapper.qssWidget.model.isShown"
        ]
    }, { // If the language button in the QSS is clicked once...
        func: "gpii.test.executeJavaScriptInWebContents",
        args: [
            "{that}.app.qssWrapper.qss.dialog",
            clickLanguageBtn
        ]
    }, {
        changeEvent: "{that}.app.qssWrapper.qssWidget.applier.modelChanged",
        path: "isShown",
        listener: "fluid.identity"
    }, { // ... and is then clicked again...
        func: "gpii.test.executeJavaScriptInWebContents",
        args: [
            "{that}.app.qssWrapper.qss.dialog",
            clickLanguageBtn
        ]
    }, { // ... the QSS widget menu will be hidden again.
        changeEvent: "{that}.app.qssWrapper.qssWidget.applier.modelChanged",
        path: "isShown",
        listener: "jqUnit.assertFalse",
        args: [
            "The QSS widget is hidden when its closed button is pressed",
            "{that}.app.qssWrapper.qssWidget.model.isShown"
        ]
    }, { // Attempts to activate a button which does not have keyboard highlight...
        funcName: "gpii.tests.qss.simulateShortcut",
        args: [
            "{that}.app.qssWrapper.qss.dialog",
            {
                key: "Enter"
            }
        ]
    }, { // ... will fail
        func: "jqUnit.assertFalse",
        args: [
            "QSS button cannot be activated using the keyboard if the button does not have focus",
            "{that}.app.qssWrapper.qssWidget.model.isShown"
        ]
    }
];

var widgetClosingBehaviourSequence = [
    { // Click the language button again...
        func: "gpii.test.executeJavaScriptInWebContents",
        args: [
            "{that}.app.qssWrapper.qss.dialog",
            clickLanguageBtn
        ]
    }, { // ... and wait for the QSS widget to show up...
        changeEvent: "{that}.app.qssWrapper.qssWidget.applier.modelChanged",
        path: "isShown",
        listener: "fluid.identity"
    }, { // ... and then simulate an ArrowLeft key press.
        funcName: "gpii.tests.qss.simulateShortcut",
        args: [
            "{that}.app.qssWrapper.qssWidget.dialog",
            {
                key: "Left" // The key should be a value allowed to appear in an accelerator string.
            }
        ]
    }, { // This should close the QSS widget dialog.
        changeEvent: "{that}.app.qssWrapper.qssWidget.applier.modelChanged",
        path: "isShown",
        listener: "jqUnit.assertFalse",
        args: [
            "The QSS widget is hidden when the ArrowLeft key is pressed",
            "{that}.app.qssWrapper.qssWidget.model.isShown"
        ]
    }, { // Now the focus is on the "Close" button. Pressing Tab will move it back to the language button.
        funcName: "gpii.tests.qss.simulateShortcut",
        args: [
            "{that}.app.qssWrapper.qss.dialog",
            {
                key: "Tab"
            }
        ]
    }, { // Pressing the spacebar key...
        funcName: "gpii.tests.qss.simulateShortcut",
        args: [
            "{that}.app.qssWrapper.qss.dialog",
            {
                key: "Space" // The key should be a value allowed to appear in an accelerator string.
            }
        ]
    }, { // ... will make the language menu show up.
        changeEvent: "{that}.app.qssWrapper.qssWidget.applier.modelChanged",
        path: "isShown",
        listener: "jqUnit.assertTrue",
        args: [
            "The QSS widget is shown when the QSS button is activated using spacebar",
            "{that}.app.qssWrapper.qssWidget.model.isShown"
        ]
    }, { // Pressing the ESC key while the QSS widget is focused...
        funcName: "gpii.tests.qss.simulateShortcut",
        args: [
            "{that}.app.qssWrapper.qssWidget.dialog",
            {
                key: "Escape"
            }
        ]
    }, { // ... will close it.
        changeEvent: "{that}.app.qssWrapper.qssWidget.applier.modelChanged",
        path: "isShown",
        listener: "jqUnit.assertFalse",
        args: [
            "The QSS widget is closed when it has focus and the ESC key is pressed",
            "{that}.app.qssWrapper.qssWidget.model.isShown"
        ]
    }, { // Click the language button again...
        func: "gpii.test.executeJavaScriptInWebContents",
        args: [
            "{that}.app.qssWrapper.qss.dialog",
            clickLanguageBtn
        ]
    }, { // ... and wait for the QSS widget to show up.
        changeEvent: "{that}.app.qssWrapper.qssWidget.applier.modelChanged",
        path: "isShown",
        listener: "fluid.identity"
    }, { // Pressing the ArrowRight key while the QSS widget is focused...
        funcName: "gpii.tests.qss.simulateShortcut",
        args: [
            "{that}.app.qssWrapper.qssWidget.dialog",
            {
                key: "Right" // The key should be a value allowed to appear in an accelerator string.
            }
        ]
    }, { // ... will close it.
        changeEvent: "{that}.app.qssWrapper.qssWidget.applier.modelChanged",
        path: "isShown",
        listener: "jqUnit.assertFalse",
        args: [
            "The QSS widget is hidden when the ArrowRight key is pressed",
            "{that}.app.qssWrapper.qssWidget.model.isShown"
        ]
    }
];

var qssCrossTestSequence = [
    // This tests are commented because of changes in GPII-3773 request.
    // Some tests may be removed or parts of them re-used in the future.
    /*
     * Tests QSS and PSP visibility
     * Test QSS button interactions
     */
    { // When the tray icon is clicked...
        func: "{that}.app.tray.events.onTrayIconClicked.fire"
    }, {
        task: "gpii.test.executeJavaScriptInWebContents",
        args: [
            "{that}.app.qssWrapper.qss.dialog",
            clickCloseBtn
        ],
        resolve: "fluid.identity"
    },
    /*
     * Tooltip & QSS integration
     */
    tooltipSequence,
    /*
     * Widget & QSS integration
     */
    //
    // Menu widget interactions
    //
    menuInteractionsSequence,
    //
    // Widget closing behaviour
    //
    widgetClosingBehaviourSequence,
    //
    // Combined tests
    //*/
    //
    // Setting changes tests
    //
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
];




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
    expect: 50,
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
        // qssCrossTestSequence,
        // stepperindicatorsSequence,
        // restartWarningSequence, // The test doesn't cover all the possible behaviors as described in the GPII-3943
        // crossQssTranslations,
        qssInstalledLanguages,
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
        gpii.tests.qss.stepperindicatorsSequence
    )
};
