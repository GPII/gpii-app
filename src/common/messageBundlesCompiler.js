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

var DEFAULT_FILE_TYPE = "json",
    DEFAULT_PARSER = JSON;


/**
 * Generate a list of most specific to least specific locale that can
 * be used.
 *
 * @param locale {String} A locale, e.g. "en_us".
 * @param fallbackLocale {String} The fallback locale to be used in case
 * translations from previous are missing.
 * @returns {String[]} A list fr_FR, en -> ["en", "fr", "fr_FR"]
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
 * In case there are only partial translations for a locale, e.g. "en_us", add
 * missing translations using its more general locale ("en" in this case) and a
 * fallback locale (probably the default one) in case translations are missing
 * both in "en" and "en_us".
 *
 * Note: in case we have "en_us" and "en" is missing, "en_us" will NOT be used
 * in place of "en", which will result in using the default locale once messages
 * for "en" are requested.
 *
 * @param messageBundles {Object} A raw map of collected bundles. It is of type
 * { locale1: { key1: message1, ... }, locale2: { key2: messages }, ... }
 * @param fallbackLocale {String} The locale to be used when translations are missing
 * @returns {Object} The enhanced message bundles object
 */
function includeFallbackOptions(messageBundles, fallbackLocale) {
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


/**
 * Collect all files of the specified type from the given directory.
 *
 * @param dir {String} The directory which is to be searched for message bundles.
 * @param fileType {String} The file type that is to be searched for.
 * @returns {String[]} The list of matching files
 */
function collectFilesByType(dir, fileType) {
    var typeRegex = "\\." + fileType + "$";

    var filePaths = fs.readdirSync(dir)
        .filter(function matchesFileType(filename) {
            return filename.match(typeRegex);
        }).map(function (filename) {
            return path.join(dir, filename);
        });

    return filePaths;
};

/**
 * Load all message bundles from the passed directories.
 *
 * @param bundlesDirs {String[]} The list of directrories containing message bundles.
 * @param fileType {String} The file type to be searched for in the given folders.
 * @param parser {Object} A parser object, that has `parse` method. An example of such is `JSON`.
 * @returns {Object[]} A list of all collected messages by file.
 */
function loadMessageBundles(bundlesDirs, fileType, parser) {
    var bundleFiles = bundlesDirs.reduce(function (files, bundlesDir) {
        return files.concat(collectFilesByType(bundlesDir, fileType));
    }, []);

    return bundleFiles.map(function (filePath) {
        return {
            messages: parser.parse(fs.readFileSync(filePath)),
            filename: path.basename(filePath)
        };
    });
};


/**
 * Simply returns the locale that is the last part of the filename:
 * <component name>_<locale>.<file type>
 *
 * @param filename {String}
 * @returns {String} The locale, e.g. "en" or "en_us"
 */
function extractLocaleFromFilename(filename) {
    // strip file extension
    filename = filename.split(".")[0];

    var localeSegStart = filename.indexOf("_") + 1;
    return filename.slice(localeSegStart);
}

/**
 * Merge all different bundles, grouping them by locale. Each locale
 * key is represented as the merged bundles.
 *
 * @param {Object[]} A list of all messages by file name.
 * @returns {Object} Returnes the grouped and merged by locale messages.
 * For example:
 *   {
 *      en: {
 *          val: message,
 *          ...
 *      },
 *      bg: {
 *          val: message,
 *          ...
 *      }
 *   }
 */
function mergeMessageBundles(loadedBundles) {
    var messageBundles = {};

    loadedBundles.forEach(function (bundle) {
        var locale = extractLocaleFromFilename(bundle.filename),
            prevMessages = messageBundles[locale] || {};

        // merge with the new file's messages
        messageBundles[locale] = Object.assign(prevMessages, bundle.messages);
    });

    return messageBundles;
};


module.exports.compileMessageBundles = function (bundlesDirs, defaultLocale, fileType, parser) {
    fileType = fileType || DEFAULT_FILE_TYPE;
    parser = parser || DEFAULT_PARSER;

    var messageBundlesList;

    try {
        messageBundlesList = loadMessageBundles(bundlesDirs, fileType, parser);
    } catch (err) {
        // ENOENT, SyntaxError
        console.log(err.message);
        throw err;
    }

    var rawMessageBundles = mergeMessageBundles(messageBundlesList);
    var compiledMessageBundle = includeFallbackOptions(rawMessageBundles, defaultLocale);

    return compiledMessageBundle;
};
