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

var clickLanguageBtn = "jQuery(\".fl-qss-btnId-language\").click()",
    clickMenuWidgetItem = "jQuery('.flc-qssWidgetMenu-item:nth-of-type(2)').click()",
    clickCloseBtn = "jQuery(\".fl-qss-btnId-service-close\").click()";

function getLanguageWidgetBtnText() {
    return jQuery(".fl-qss-btnId-language > span").text();
}

fluid.registerNamespace("gpii.tests.qss.languageTests");

gpii.tests.qss.languageTests = [
    { // Open the QSS...
        func: "{that}.app.tray.events.onTrayIconClicked.fire"
    }, { // Text of the button should be
        task: "gpii.test.invokeFunctionInWebContents",
        args: [
            "{that}.app.qssWrapper.qss.dialog",
            getLanguageWidgetBtnText
        ],
        resolve: "jqUnit.assertEquals",
        resolveArgs: [
            "Text of the button should be",
            "Language of Menus",
            "{arguments}.0"
        ]
    }, { // Open the menu Widget
        task: "gpii.test.executeJavaScriptInWebContents",
        args: [
            "{that}.app.qssWrapper.qss.dialog",
            clickLanguageBtn
        ],
        resolve: "fluid.identity"
    }, { // ... click on menu item (we know the order from the config we are using)
        func: "gpii.test.executeJavaScriptInWebContents",
        args: [
            "{that}.app.qssWrapper.qssWidget.dialog",
            clickMenuWidgetItem
        ]
    }, { // ... the setting should be applied
        event: "{that}.app.settingsBroker.events.onSettingApplied",
        listener: "jqUnit.assertLeftHand",
        args: [
            "Change event was fired from QSS widget interaction.",
            { path: "http://registry\\.gpii\\.net/common/language", value: "es-ES" },
            "{arguments}.0"
        ]
    }, { // Close the QSS
        task: "gpii.test.executeJavaScriptInWebContents",
        args: [
            "{that}.app.qssWrapper.qss.dialog",
            clickCloseBtn
        ],
        resolve: "fluid.identity"
    }
];
