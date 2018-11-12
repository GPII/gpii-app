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

var fluid = require("infusion");
var gpii = fluid.registerNamespace("gpii");
fluid.registerNamespace("gpii.app.messageBundlesCompiler");

var fs = require("fs");
var path = require("path");

var DEFAULT_PARSER = {"json": JSON};


/**
 * Represents a single messages bundle, containing label names and messages for them.
 *
 * A label for the corresponding component follows the format: <full_grade_name_messageName>.
 * Notice that the key's prefix is the grade name separated by "_" and
 * the postfix is the message name which the component uses.
 *
 * For example:
 * ```
 * {
 *     gpii_app_menu_keyOut: "Key out",
 *     ...
 * }
 * ```
 * contains a key for component `gpii.app.menu` which the component simply refers with `keyOut`.
 *
 * @typedef {Object.<String, String>} Messages
 */


/**
 * An object representing messages for the different locales.
 * It follows the format:
 * {
 *     <locale>: <Messages>,
 *     ...
 * }
 *
 * Example with multiple locales:
 * ```
 * {
 *      en: {
 *          gpii_app_menu_keyOut: "Key out",
 *          ...
 *      },
 *      bg: {
 *          gpii_app_menu_keyOut: "Излез",
 *          ...
 *      }
 * }
 * ```
 *
 * @typedef {Object.<String, Messages>} MessageBundles
 */

/**
 * A map of file extensions to parsers.
 * Example: {
 *  "json": JSON,
 *  "json5": JSON5
 * }
 *
 * @typedef {Object.<String, String>} FileParsers
 */



/**
 * Generates a list of the least to the most specific locales that can be used.
 * @param {String} locale - A locale, e.g. "en_us".
 * @param {String} defaultLocale - The locale to be used in case messages from all
 * previous locales are missing.
 * @return {String[]} A list of locales. For example, for the "fr_FR" locale and
 * in case the default locale is "en", the function would return ["en", "fr", "fr_FR"].
 */
gpii.app.messageBundlesCompiler.getLocaleVersions = function (locale, defaultLocale) {
    var segments = locale.split("_");

    var versions = segments.map(function (segment, index) {
        return segments.slice(0, index + 1).join("_");
    });

    if (defaultLocale) {
        versions.unshift(defaultLocale);
    }

    return versions;
};

/**
 * In case there are only partial messages for a given locale, this function adds
 * missing messages to this locale. It uses the messages from less specific locales,
 * ending with the default locale. For example if we have a default locale of `bg`
 * and a partial `en_us` bundle, a message will be first looked in the `en` bundles
 * and only then in the `bg`.
 *
 * @param {MessageBundles} messageBundles - A raw map of collected bundles.
 * @param {String} defaultLocale - The default locale to be used.
 * @return {MessageBundles} The enhanced message bundles object.
 */
gpii.app.messageBundlesCompiler.includeFallbackOptions = function (messageBundles, defaultLocale) {
    var result = {};

    Object.keys(messageBundles).forEach(function (locale) {
        var localeVersions = gpii.app.messageBundlesCompiler.getLocaleVersions(locale, defaultLocale),
            messageBundle = {};

        localeVersions.forEach(function (localeVersion) {
            if (messageBundles[localeVersion]) {
                messageBundle = Object.assign(messageBundle, messageBundles[localeVersion]);
            }
        });

        result[locale] = messageBundle;
    });

    return result;
};

/**
 * Collects all file names of the specified type from the given directory.
 * @param {String} dir - The name of the directory from which files are to
 * be collected.
 * @param {String[]} fileTypes - The file types that is to be searched for.
 * @return {String[]} The list of relative paths of matching files to the
 * searched directory.
 */
gpii.app.messageBundlesCompiler.collectFilesByType = function (dir, fileTypes) {
    var filePaths = fs.readdirSync(dir)
        .filter(function matchesFileType(filename) {
            var fileType = path.extname(filename).slice(1);
            return fluid.contains(fileTypes, fileType);
        })
        .map(function (filename) {
            return path.join(dir, filename);
        });

    return filePaths;
};

/**
 * Loads synchronously all message bundles from the passed directories. Note that directories'
 * paths may include gpii module references.
 * @param {String[]} bundlesDirs - The list of directrories' names containing message bundles.
 * @param {FileParsers} parsers - Available parsers for the bundle files. Bundles for the
 * provided file types will be used for collected.
 * @return {Object[]} A list of all collected messages by filename.
 */
gpii.app.messageBundlesCompiler.loadMessageBundles = function (bundlesDirs, parsers) {
    var fileTypes = fluid.keys(parsers);

    var bundleFiles = bundlesDirs
        .map(fluid.module.resolvePath)
        .reduce(function (files, bundlesDir) {
            return files.concat(gpii.app.messageBundlesCompiler.collectFilesByType(bundlesDir, fileTypes));
        }, []);

    return bundleFiles.map(function (filePath) {
        var fileType = path.extname(filePath).slice(1),
            parser = parsers[fileType];
        return {
            messages: parser.parse(fs.readFileSync(filePath)),
            filename: path.basename(filePath)
        };
    });
};

/**
 * Returns the locale that is the last part of the filename:
 * <component-name>_<locale>.<file type>
 * @param {String} filename - The name of the file.
 * @return {String} The locale, e.g. "en" or "en_us".
 */
gpii.app.messageBundlesCompiler.extractLocaleFromFilename = function (filename) {
    // strip file extension
    filename = filename.split(".")[0];

    var localeSegStart = filename.indexOf("_") + 1;
    return filename.slice(localeSegStart);
};

/**
 * Merges all different bundles grouping them by locale.
 * @param {Object[]} loadedBundles - A list of all messages by file name.
 * @return {MessageBundles} Returns the grouped and merged messages. Note that
 * there might be missing messages.
 */
gpii.app.messageBundlesCompiler.mergeMessageBundles = function (loadedBundles) {
    var messageBundles = {};

    loadedBundles.forEach(function (bundle) {
        var locale = gpii.app.messageBundlesCompiler.extractLocaleFromFilename(bundle.filename),
            prevMessages = messageBundles[locale] || {};

        // merge with the new file's messages
        messageBundles[locale] = Object.assign(prevMessages, bundle.messages);
    });

    return messageBundles;
};


/**
 * Creates a message bundles map where the keys are the available locales and the values
 * are also maps whose keys are the message keys and the values are the texts of the
 * messages themselves.
 * @param {String[]} bundlesDirs - An array of the directories from which message bundle
 * files are to be retrieved.
 * @param {String} defaultLocale - The default locale to be used.
 * @param {FileParsers} parsers - Available parsers for bundle files.
 * @return {Object} The compiled message bundles map.
 */
gpii.app.messageBundlesCompiler.compileMessageBundles = function (bundlesDirs, defaultLocale, parsers) {
    parsers = parsers || DEFAULT_PARSER;

    var messageBundlesList;

    try {
        messageBundlesList = gpii.app.messageBundlesCompiler.loadMessageBundles(bundlesDirs, parsers);
    } catch (err) {
        // ENOENT, SyntaxError
        fluid.fail("Messages Compiler: Problem loading message bundles - ", err.message);
        // return something not particularly useful
        return null;
    }

    var rawMessageBundles = gpii.app.messageBundlesCompiler.mergeMessageBundles(messageBundlesList);
    var compiledMessageBundle = gpii.app.messageBundlesCompiler.includeFallbackOptions(rawMessageBundles, defaultLocale);

    return compiledMessageBundle;
};


module.exports.compileMessageBundles = gpii.app.messageBundlesCompiler.compileMessageBundles;
