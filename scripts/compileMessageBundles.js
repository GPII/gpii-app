/**
 * The message bundles compiler script.
 *
 * This script compiles a mega message bundle which contains
 * all messages for all available locales.
 * Copyright 2018 Raising the Floor - International
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

var fs = require("fs");
var path = require("path");
var shell = require("shelljs");

fluid.setLogging(true);
require("./shared/messageBundlesCompiler.js");

/**
 * This function generates the messages bundle and writes into a given file.
 * @param {String[]} messageDirs - An array of the directories from which messages
 * files are to be retrieved.
 * @param {String}  resultFilePath - The file where the bundles are going to be written.
 */
gpii.app.compileMessageBundles = function (messageDirs, resultFilePath) {
    require("gpii-windows/index.js");

    // This is a noop when the folder already exists
    shell.mkdir("-p", path.dirname(resultFilePath));

    var compileMessageBundles = gpii.app.messageBundlesCompiler.compileMessageBundles;
    var compiledMessageBundles = compileMessageBundles(messageDirs, "en", {"json": JSON, "json5": require("json5")});

    fs.writeFileSync(resultFilePath, JSON.stringify(compiledMessageBundles, null, 4));
    fluid.log("Message bundle successfully written to ", resultFilePath);

    // We have to manually exit the electron process
    process.exit();
};

/**
 * This is the entry point to the script. Any configuration must be indicated below.
*/
gpii.app.compileMessageBundles(
    // List of dirs to look for message bundles
    ["./messageBundles", "%gpii-user-errors/bundles"],
    // The resulting bundle file path
    "./build/gpii-app-messageBundles.json"
);
