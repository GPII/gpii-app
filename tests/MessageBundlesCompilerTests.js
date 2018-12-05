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
var gpii = fluid.registerNamespace("gpii");

var jqUnit = fluid.require("node-jqunit", require, "jqUnit");

fluid.require("%gpii-app/scripts/shared/messageBundlesCompiler.js");

fluid.registerNamespace("gpii.tests.messageBundles.testDefs");


var bundle_en = {
        "gpii_app_menu_psp": "Open Morphic",
        "gpii_app_menu_notKeyedIn": "(No one keyed in)"
    }, bundle_en_ca = {
        "gpii_app_menu_psp": "Open the PSP"
    }, bundle_bg = {
        "gpii_app_menu_psp": "Отвори се Сезам",
        "gpii_app_menu_notKeyedIn": "(Никой не е влязъл)"
    }, bundle_it = {};



var loadedBundlesFixture = [{
    messages: bundle_en,
    filename: "bundle_en.json5"
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
        gpii_app_menu_psp: "Open Morphic",
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
        gpii_app_menu_psp: "Open Morphic",
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
        gpii_app_menu_psp: "Open Morphic",
        gpii_app_menu_notKeyedIn: "(No one keyed in)"
    }
};
var DEFAULT_LOCALE = "en";


jqUnit.test("Loaded bundles merging loaded", function () {
    jqUnit.expect(1);

    var mergedBundles = gpii.app.messageBundlesCompiler.mergeMessageBundles(loadedBundlesFixture);

    jqUnit.assertDeepEq("Loaded bundles are merged correctly", mergedLoadedFilesFixture, mergedBundles);
});



jqUnit.test("Fallback options are included properly", function () {
    jqUnit.expect(1);

    var enhancedBundle = gpii.app.messageBundlesCompiler.includeFallbackOptions(mergedLoadedFilesFixture, DEFAULT_LOCALE);

    jqUnit.assertDeepEq("Bundles have fallback options included properly", enhancedBundleFixture, enhancedBundle);
});


var bundlesDir1 = "./tests/fixtures/messageBundles/",
    bundlesDir2 = "./tests/fixtures/messageBundles/inner/",
    missingDir = ".tests/fixtures/messageBundles/some/missing/dir";

jqUnit.test("Bundles loading", function () {
    jqUnit.expect(1);

    // just a simplest comparison function in order to canonize the two arrays
    function cmpFiles(message1, message2) {
        return message1.filename < message2.filename;
    }

    var loadedBundles = gpii.app.messageBundlesCompiler.loadMessageBundles(
        [bundlesDir1, bundlesDir2],
        {
            "json":  JSON,
            // Just for test purpose - the file is in json format
            "json5": JSON
        });

    jqUnit.assertDeepEq("Should load files from multiple directories properly",
        loadedBundlesFixture.sort(cmpFiles),
        loadedBundles.sort(cmpFiles));
});


jqUnit.test("Messages compiling", function () {
    jqUnit.expect(1);

    var compiledMessages = gpii.app.messageBundlesCompiler.compileMessageBundles(
        [bundlesDir1, bundlesDir2],
        DEFAULT_LOCALE,
        {
            "json": JSON,
            "json5": JSON
        }
    );

    jqUnit.assertDeepEq(
        "Should load files from multiple directories properly",
        enhancedBundleFixture,
        compiledMessages
    );

    jqUnit.expectFrameworkDiagnostic(
        "The compiler should log there's a problem loading message bundles",
        function () {
            gpii.app.messageBundlesCompiler.compileMessageBundles(
                [missingDir],
                DEFAULT_LOCALE
            );
        },
        "Messages Compiler: Problem loading message bundles"
    );
});
