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

var app = require("electron").app;

require("./basic/dialog.js");


/**
 * Component that represents the About dialog
 */
fluid.defaults("gpii.app.aboutDialog", {
    gradeNames: ["gpii.app.dialog", "gpii.app.scaledDialog"],

    scaleFactor: 1,
    defaultWidth: 400,
    defaultHeight: 250,

    config: {
        params: {
            userListeners: ["USB", "NFC", "Fingerprint", "Webcam & Voice"],
            version: { expander: { func: app.getVersion } }
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
