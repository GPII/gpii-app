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


function collectFilesRec(cwd, fileType) {
    var typeRegex = "\\." + fileType + "$";

    var messageBundlesDir = "messageBundles";

    var items = fs.readdirSync(cwd),
        dirs = items.filter(function isDirectory(name) {
            return fs.lstatSync(path.join(cwd, name)).isDirectory();
        }), files = [];

    // We want to load json files only from message bundle dirs
    if (cwd.includes(messageBundlesDir)) {
        files = items.filter(function matchesFileType(filename) {
            return filename.match(typeRegex);
        }).map(function (filename) {
            return path.join(cwd, filename);
        });
    }

    // unite files from subdirectories
    var subfolerBundles = dirs.reduce(function (acc, dirName) {
        return acc.concat(collectFilesRec(path.join(cwd, dirName), fileType));
    }, []);

    return files.concat(subfolerBundles);
};

function loadMessageBundlesRec(bundlesDir, fileType, parser) {
    var bundleFiles = collectFilesRec(bundlesDir, fileType);

    return bundleFiles.map(function (filePath) {
        return {
            messages: parser.parse(fs.readFileSync(filePath)),
            filePath: filePath
        };
    });
};

function extractLocaleFromFilename(filename) {
    // strip file extension
    filename = filename.split(".")[0];

    var localeSegStart = filename.indexOf("_") + 1;
    return filename.slice(localeSegStart);
}

/*
 * Merge all different bundles under the same locale.
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

module.exports.buildMessageBundles = function (bundlesDir, fileType, parser, defaultLocale) {
    var messageBundlesList;

    try {
        messageBundlesList = loadMessageBundlesRec(bundlesDir, fileType, parser);
    } catch (err) {
        // ENOENT, SyntaxError
        console.log(err.message);
        throw err;
    }

    var rawMessageBundles = mergeMessageBundles(messageBundlesList);
    var compiledMessageBundle = includeFallbackOptions(rawMessageBundles, defaultLocale);

    return compiledMessageBundle;
};
