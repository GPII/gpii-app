/**
 * The message bundles compiler.
 *
 * Contains various functions for compiling a mega message bundle which contains
 * all messages for all available locales.
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

var fs = require("fs");
var path = require("path");

var DEFAULT_FILE_TYPE = "json",
    DEFAULT_PARSER = JSON;

/**
 * Generate a list of the least to the most specific locales that can be used.
 * @param locale {String} A locale, e.g. "en_us".
 * @param defaultLocale {String} The locale to be used in case messages from all
 * previous locales are missing.
 * @returns {String[]} A list of locales. For example, for the "fr_FR" locale and
 * in case the default locale is "en", the function would return ["en", "fr", "fr_FR"].
 */
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

/**
 * In case there are only partial messages for a given locale, this function adds
 * the missing messages using the messages for all versions of the locale in the
 * order in which they are returned by the `getLocaleVersions` function.
 * @param messageBundles {Object} A raw map of collected bundles. It is of type
 * { locale1: { key1: message1, ... }, locale2: { key2: message2 }, ... }
 * @param defaultLocale {String} The default locale to be used.
 * @returns {Object} The enhanced message bundles object.
 */
function includeFallbackOptions(messageBundles, defaultLocale) {
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


/**
 * Collects all file names of the specified type from the given directory.
 * @param dir {String} The name of the directory from which files are to
 * be collected.
 * @param fileType {String} The file type that is to be searched for.
 * @returns {String[]} The list of matching file names.
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
 * Loads all message bundles from the passed directories.
 * @param bundlesDirs {String[]} The list of directrories' names containing message bundles.
 * @param fileType {String} The file type to be searched for in the given folders.
 * @param parser {Object} A parser object that has a `parse` method. An example of such is `JSON`.
 * @returns {Object[]} A list of all collected messages by file name.
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
 * Returns the locale that is the last part of the filename:
 * <component-name>_<locale>.<file type>
 * @param filename {String} The name of the file.
 * @returns {String} The locale, e.g. "en" or "en_us".
 */
function extractLocaleFromFilename(filename) {
    // strip file extension
    filename = filename.split(".")[0];

    var localeSegStart = filename.indexOf("_") + 1;
    return filename.slice(localeSegStart);
}

/**
 * Merges all different bundles grouping them by locale.
 * @param {Object[]} A list of all messages by file name.
 * @returns {Object} Returns the grouped and merged messages.
 * For example:
 *   {
 *      en: {
 *          key: message,
 *          ...
 *      },
 *      bg: {
 *          key: message,
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

/**
 * Creates a message bundles hash where the keys are the available locales and the values
 * are also hashes whose keys are the message keys and the values are the texts of the
 * messages themselves.
 * @param bundlesDirs {String[]} An array of the directories from which message bundle
 * files are to be retrieved.
 * @param defaultLocale {String} The default locale to be used.
 * @param fileType {String} The extension of the message bundle files.
 * @param parser {Object} An object which provides means (a `parse` method) for parsing the
 * contents of message bundle files.
 */
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
