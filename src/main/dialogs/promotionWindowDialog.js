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
        promoContentUrl: null,
        width: 200,
        height: 200,
        resizable: false,
        movable: false,
        skipTaskbar: false,
        frame: false,
        transparent: false,
        alwaysOnTop: false,
        closeDelay: 0,
        showDelay: 0
    },

    closeDelay: "{that}.options.siteConfig.closeDelay",
    showDelay: "{that}.options.siteConfig.showDelay",

    config: {
        attrs: {
            width: "{that}.options.siteConfig.width",
            height: "{that}.options.siteConfig.height",
            resizable: "{that}.options.siteConfig.resizable",
            movable: "{that}.options.siteConfig.resizable.movable",
            skipTaskbar: "{that}.options.siteConfig.resizable.skipTaskbar",
            frame: "{that}.options.siteConfig.resizable.frame",
            transparent: "{that}.options.siteConfig.transparent",
            alwaysOnTop: "{that}.options.siteConfig.alwaysOnTop"
        },
        params: {
            promoContentUrl: "{that}.options.siteConfig.promoContentUrl"
        },
        fileSuffixPath: "promotionWindow/index.html"
    },

    events: {
        delayedClose: null
    },
    listeners: {
        "onCreate.showWindow": {
            funcName: "gpii.app.promotionWindowDialog.show",
            args: ["{that}", "{showTimer}", "{that}.options.siteConfig.offset.x", "{that}.options.siteConfig.offset.y"]
        },
        "delayedClose": {
            funcName: "{closeTimer}.start",
            args: ["{that}.options.closeDelay"]
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
        },
        closeTimer: {
            type: "gpii.app.timer",
            options: {
                listeners: {
                    "onTimerFinished": {
                        funcName: "{promotionWindowDialog}.close"
                    }
                }
            }
        },
        showTimer: {
            type: "gpii.app.timer",
            options: {
                listeners: {
                    "onTimerFinished": {
                        funcName: "{promotionWindowDialog}.show"
                    }
                }
            }
        }
    }
});

gpii.app.promotionWindowDialog.show = function (that, timer, offsetX, offsetY) {
    if (offsetX || offsetY) {
        that.setPosition(offsetX, offsetY);
    }
    timer.start(that.options.showDelay);
};
