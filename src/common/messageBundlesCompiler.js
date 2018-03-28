/**
 * The error dialog
 *
 * Represents an error dialog, that can be closed by the user.
 * Copyright 2017 Raising the Floor - International
 *
 * Licensed under the New BSD license. You may not use this file except in
 * compliance with this License.
 * The research leading to these results has received funding from the European Union's
 * Seventh Framework Programme (FP7/2007-2013) under grant agreement no. 289016.
 * You may obtain a copy of the License at
 * https://github.com/GPII/universal/blob/master/LICENSE.txt
 */

/* global fluid */

"use strict";

var fs = require("fs");
var path = require("path");

/**
 *
 * @returns {String[]} returns a list fr_FR, en -> ["en", "fr", "fr_FR"]
 */
function getLocaleVersions(locale, fallbackLocale) {
    var segments = locale.split("_");

    var versions = segments.map(function (segment, index) {
        return segments.slice(0, index + 1).join("_");
    });

    if (fallbackLocale) {
        versions.unshift(fallbackLocale);
    }

    return versions;
}



/**
 * In case there are only partial translations for a locale, add
 * missing translations using a fallback locale (that we expect to
 * be the richest bundle), possibly the default one.
 *
 * @param messageBundles {Object} A raw map of collected bundles. It is of type
 * { locale1: { key1: message1, ... }, locale2: { key2: messages }, ... }
 * @param fallbackLocale {String} The locale to be used when translations are missing
 * @returns {Object}
 */
function enhanceMessageBundles(messageBundles, fallbackLocale) {
    var result = {};

    Object.keys(messageBundles).forEach(function (locale) {
        var localeVersions = getLocaleVersions(locale, fallbackLocale),
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


// TODO extarct
// TODO search dir recursivly
//
// gpii-app-messageBundle_en.json
// gpii-app-messageBundle_fr.json
// gpii-app-messageBundle_bg.json
//
// gpii-psp-restartDialog_en.json
//
function loadMessageBundles(bundlesDir, fileType, parser) {
    // read every json file from that index down (support subdirs?)
    var files = fs.readdirSync(bundlesDir);
    var typeRegex = "\\." + fileType + "$";
    // TODO on error
    var loadedFiles = files
        .filter(function (filename) {
            return filename.match(typeRegex);
        })
        .reduce(function (acc, filename) {
            // TODO error
            acc.push({
                messages: parser.parse(fs.readFileSync(path.join(bundlesDir, filename))),
                filename: filename
            });

            return acc;
        }, []);

    return loadedFiles;
};

function extractLocaleFromFilename(filename) {
    // strip file extension
    filename = filename.split(".")[0];

    var localeSegStart = filename.indexOf("_") + 1;
    return filename.slice(localeSegStart);
}

/*
 * Merge all different bundles under same locale.
 *
 Results:
 {
    en: {
        val: message,
        ...
    },
    bg: {
        val: message,
        ...
    }
 }
 */
function constructMessageBundles(loadedBundles) {
    var messageBundles = {};

    loadedBundles.forEach(function (bundle) {
        var locale = extractLocaleFromFilename(bundle.filename),
            prevMessages = messageBundles[locale] || {};

        // merge with the new file's messages
        messageBundles[locale] = Object.assign(prevMessages, bundle.messages);
    });

    return messageBundles;
};


module.exports.compileMessageBundles = function (bundlesDir, fileType, parser, defaultLocale) {
    var messageBundlesList = loadMessageBundles(bundlesDir, fileType, parser);
    var rawMessageBundles = constructMessageBundles(messageBundlesList);
    var compiledMessageBundle = enhanceMessageBundles(rawMessageBundles, defaultLocale);

    return compiledMessageBundle;
};
