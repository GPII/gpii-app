/**
 * PSP Message Bundles compiler tests
 *
 * Test message bundles loading and merging.
 *
 * Copyright 2017 Raising the Floor - International
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

var jqUnit = fluid.require("node-jqunit", require, "jqUnit");

var messagesCompiler = require("../messageBundlesCompiler.js");

fluid.registerNamespace("gpii.tests.messageBundles.testDefs");


var bundle_en = {
        "gpii_app_menu_psp": "Open PSP",
        "gpii_app_menu_notKeyedIn": "(No one keyed in)"
    }, bundle_en_ca = {
        "gpii_app_menu_psp": "Open the PSP"
    }, bundle_bg = {
        "gpii_app_menu_psp": "Отвори се Сезам",
        "gpii_app_menu_notKeyedIn": "(Никой не е влязъл)"
    }, bundle_it = {};



var loadedBundlesFixture = [{
    messages: bundle_en,
    filename: "bundle_en.json"
}, {
    messages: bundle_en_ca,
    filename: "bundle_en_ca.json"
}, {
    messages: bundle_bg,
    filename: "bundle_bg.json"
}, { // empty bundle
    messages: bundle_it,
    filename: "bundle_it.json"
}];

var mergedLoadedFilesFixture = {
    en: {
        gpii_app_menu_psp: "Open PSP",
        gpii_app_menu_notKeyedIn: "(No one keyed in)"
    },
    en_ca: { gpii_app_menu_psp: "Open the PSP" },
    bg: {
        gpii_app_menu_psp: "Отвори се Сезам",
        gpii_app_menu_notKeyedIn: "(Никой не е влязъл)"
    },
    it: {}
};

var enhancedBundleFixture = {
    en: {
        gpii_app_menu_psp: "Open PSP",
        gpii_app_menu_notKeyedIn: "(No one keyed in)"
    },
    bg: {
        gpii_app_menu_psp: "Отвори се Сезам",
        gpii_app_menu_notKeyedIn: "(Никой не е влязъл)"
    },
    en_ca: {
        gpii_app_menu_psp: "Open the PSP",
        gpii_app_menu_notKeyedIn: "(No one keyed in)"
    },
    it: {
        gpii_app_menu_psp: "Open PSP",
        gpii_app_menu_notKeyedIn: "(No one keyed in)"
    }
};
var DEFAULT_LOCALE = "en";


jqUnit.test("Loaded bundles merging loaded", function () {
    jqUnit.expect(1);

    var mergedBundles = messagesCompiler._mergeMessageBundles(loadedBundlesFixture);

    jqUnit.assertDeepEq("Loaded bundles are merged correctly", mergedLoadedFilesFixture, mergedBundles);
});



jqUnit.test("Fallback options are included properly", function () {
    jqUnit.expect(1);

    var enhancedBundle = messagesCompiler._includeFallbackOptions(mergedLoadedFilesFixture, DEFAULT_LOCALE);

    jqUnit.assertDeepEq("Bundles have fallback options included properly", enhancedBundleFixture, enhancedBundle);
});


var bundlesDir1 = "./tests/fixtures/messageBundles/",
    bundlesDir2 = "./tests/fixtures/messageBundles/inner/";

jqUnit.test("Bundles loading", function () {
    jqUnit.expect(1);

    var loadedBundles = messagesCompiler._loadMessageBundles([bundlesDir1, bundlesDir2], "json", JSON);

    jqUnit.assertDeepEq("Should load files from multiple directories properly", loadedBundlesFixture, loadedBundles);
});