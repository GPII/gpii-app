/**
 * About page BrowserWindow Dialog
 *
 * Introduces a component that uses an Electron BrowserWindow to represent an "About" dialog.
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

require("./basic/dialog.js");

var gpii = fluid.registerNamespace("gpii");

/**
 * Component that represents the About dialog
 */
fluid.defaults("gpii.app.aboutDialog", {
    gradeNames: ["gpii.app.dialog", "gpii.app.scaledDialog"],

    scaleFactor: 1,
    defaultWidth: 400,
    defaultHeight: 250,

    siteConfig: {
        urls: {
            morphicHome: "https://morphic.world",
            submitSuggestions: "mailto:suggestions@morphic.world"
        }
    },

    config: {
        params: {
            userListeners: ["USB", "NFC", "Fingerprint", "Webcam & Voice"],
            version: "@expand:gpii.app.getVersion()",
            urls: "{that}.options.siteConfig.urls"
        },
        fileSuffixPath: "aboutDialog/index.html"
    },

    components: {
        channelListener: {
            type: "gpii.app.channelListener",
            options: {
                events: {
                    onAboutDialogClosed: null
                },
                listeners: {
                    onAboutDialogClosed: {
                        func: "{aboutDialog}.hide"
                    }
                }
            }
        },
        // notify for i18n events
        channelNotifier: {
            type: "gpii.app.channelNotifier"
        }
    }
});


/**
 * Simple method for retrieving the gpii-app version. Currently it
 * uses the Electron's api that makes use of the version in the `package.json`.
 * @return {String} The version of the gpii-app
 */
gpii.app.getVersion = function () {
    return require("electron").app.getVersion();
};
