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

var fluid = require("infusion");
var gpii  = fluid.registerNamespace("gpii");
var getQssSettingsList = "(function getItems() { var repeater = fluid.queryIoCSelector(fluid.rootComponent, 'gpii.psp.repeater')[0]; return repeater.model.items; }())";

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

fluid.registerNamespace("gpii.tests.qss.translationsTests");

gpii.tests.qss.translationsTests = [
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
    }, { // bring everything back to normal
        func: "{that}.app.resetAllToStandard"
    }, {
        task: "gpii.test.linger",
        args: [1000],
        resolve: "fluid.identity"
    }
];
