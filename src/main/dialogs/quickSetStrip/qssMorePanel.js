/**
 * The "More" dialog for the QSS
 *
 * Introduces a component that uses an Electron BrowserWindow to represent the QSS
 * "More" dialog.
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

var fluid = require("infusion");

require("../basic/centeredDialog.js");

/**
 * A centered blurrable dialog which represents the "More" window
 * in the QSS.
 */
fluid.defaults("gpii.app.qssMorePanel", {
    gradeNames: ["gpii.app.centeredDialog", "gpii.app.blurrable"],

    // Configuration which may differ depending on the machine on which the app is deployed
    siteConfig: {
        defaultWidth: 400,
        defaultHeight: 300,
        alwaysOnTop: true,
        movable: true,
        resizable: true,

        urls: {
            moreInfo: "http://morphic.world/more"
        }
    },

    linkedWindowsGrades: ["gpii.app.qss", "gpii.app.qssMorePanel"],

    config: {
        attrs: {
            width: "{that}.options.siteConfig.defaultWidth",
            height: "{that}.options.siteConfig.defaultHeight",

            icon: {
                expander: {
                    funcName: "fluid.module.resolvePath",
                    args: ["%gpii-app/src/icons/Morphic-Desktop-Icon.ico"]
                }
            },

            alwaysOnTop: "{that}.options.siteConfig.alwaysOnTop",
            frame: true,
            type: null,
            transparent: false,
            fullscreenable: true,

            movable: "{that}.options.siteConfig.movable",
            resizable: "{that}.options.siteConfig.resizable",
            destroyOnClose: true,
            minimizable: false,
            maximizable: false
        },
        params: {
            urls: "{that}.options.siteConfig.urls"
        },
        fileSuffixPath: "qssMorePanel/index.html"
    },

    listeners: {
        "onCreate.hideMenu": {
            this: "{that}.dialog",
            method: "setMenu",
            args: [null]
        }
    }
});
