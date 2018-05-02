/**
 * The PSP Assets Manager
 *
 * A component which manages application assets.
 * Copyright 2016 Steven Githens
 * Copyright 2016-2017 OCAD University
 *
 * Licensed under the New BSD license. You may not use this file except in
 * compliance with this License.
 * The research leading to these results has received funding from the European Union's
 * Seventh Framework Programme (FP7/2007-2013) under grant agreement no. 289016.
 * You may obtain a copy of the License at
 * https://github.com/GPII/universal/blob/master/LICENSE.txt
 */
"use strict";

var fluid = require("infusion"),
    gpii = fluid.registerNamespace("gpii");

/**
 * A component which manages application assets. Contains means for resolving
 * an asset's path given its name and the `assetsDir` which is a configurable
 * option for the component.
 */
fluid.defaults("gpii.app.assetsManager", {
    gradeNames: "fluid.component",

    assetsDir: "%gpii-app/src/assets/",

    invokers: {
        resolveAssetPath: {
            funcName: "gpii.app.assetsManager.resolveAssetPath",
            args: [
                "{that}.options.assetsDir",
                "{arguments}.0" // filename
            ]
        }
    }
});

/**
 * Returns the absolute path to an asset given its `filename` and the absolute
 * path of the assets directory. The latter can be prefixed with a module name.
 * @param assetsDir {String} The path (possibly starting with a module name) to
 * the assets folder.
 * @param filename {String} The simple name of the asset including the extension.
 * @return the absolute path to the asset.
 */
gpii.app.assetsManager.resolveAssetPath = function (assetsDir, filename) {
    return fluid.module.resolvePath(assetsDir + filename);
};
