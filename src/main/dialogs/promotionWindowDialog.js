/**
 * Promotion Window page BrowserWindow Dialog
 *
 * Introduces a component that uses an Electron BrowserWindow to represent a "Promotion Window" dialog.
 *
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

require("./basic/dialog.js");

var gpii = fluid.registerNamespace("gpii");

/**
 * Component that represents the Promotion Window dialog
 */
fluid.defaults("gpii.app.promotionWindowDialog", {
    gradeNames: ["gpii.app.dialog"],

    siteConfig: {
        promoContentUrl: null
    },

    config: {
        attrs: {
            width: 400,
            height: 300
        },
        params: {
            promoContentUrl: "{that}.options.siteConfig.promoContentUrl"
        },
        fileSuffixPath: "promotionWindow/index.html"
    },

    listeners: {
        "onCreate": {
            func: "{that}.show"
        }
    },

    components: {
        channelListener: {
            type: "gpii.app.channelListener",
            options: {
                events: {},
                listeners: {}
            }
        },
        // notify for i18n events
        channelNotifier: {
            type: "gpii.app.channelNotifier"
        }
    }
});
