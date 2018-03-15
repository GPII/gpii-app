"use-strict";

var fs = require("fs");
var path = require("path");

// fr_FR, en -> ["en", "fr", "fr_FR"]
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

function enchanceMessageBundles(messageBundles, defaultLocale) {
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

// console.log(mergeMessageBundles(messageBundles, "en"));


/*
give index
read all folders of `messageBundles`
merge these files under same locale
merge locales
*/

/*

app
  |__ messageBundles
  |__ src
     |__ renderer
        |__ 




 */

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

module.exports.buildMessageBundles = function (bundlesDir, fileType, parser, defaultLocale) { 
    var messageBundlesList = loadMessageBundles(bundlesDir, fileType, parser);
    var rawMessageBundles = constructMessageBundles(messageBundlesList);
    var compiledMessageBundle = enchanceMessageBundles(rawMessageBundles, defaultLocale);

    return compiledMessageBundle;
};
