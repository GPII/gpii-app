/**
 * The restart dialog
 *
 * Represents the restart dialog which appears when there is a pending change and the
 * user has closed the PSP either by clicking outside of it or by using the close button
 * in the upper right corner.
 * Copyright 2017 Raising the Floor - International
 *
 * Licensed under the New BSD license. You may not use this file except in
 * compliance with this License.
 * The research leading to these results has received funding from the European Union's
 * Seventh Framework Programme (FP7/2007-2013) under grant agreement no. 289016.
 * You may obtain a copy of the License at
 * https://github.com/GPII/universal/blob/master/LICENSE.txt
 */

/* global fluid */

"use strict";

(function (fluid) {
    var ipcRenderer = require("electron").ipcRenderer;

    var gpii = fluid.registerNamespace("gpii");


    /**
     * TODO
     */
    fluid.defaults("gpii.psp.messageBundles", {
        gradeNames: "gpii.app.messageBundles",

        invokers: {
            updateLocale: {
                changePath: "locale",
                value: "{arguments}.0"
            }
        },

        distributeOptions: {
            distributeMessageBundlesChannel: {
                record: {
                    gradeNames: ["gpii.psp.messageBundles.channel"],
                    listeners: {
                        "onLocaleChanged.setLocale": {
                            func: "{messageBundles}.updateLocale",
                            args: "{arguments}.0"
                        }
                    }
                },
                target: "{that channel}.options"
            }
        }
    });

    /// Generic component for receiving the translations updates
    fluid.defaults("gpii.psp.messageBundles.channel", {
        gradeNames: "fluid.component",

        events: {
            onLocaleChanged: null
        },

        listeners: {
            "onCreate.registerLocaleListener": {
                funcName: "gpii.psp.messageBundles.channel.register",
                args: "{that}.events"
            }
        }
    });

    /**
     * Registers for events from the Main process.
     *
     * @param events {Object} Events map.
     */
    gpii.psp.messageBundles.channel.register = function (events) {
        ipcRenderer.on("onLocaleChanged", function (event, locale) {
            //XXX dev
            console.log("Update msg: ", locale);
            events.onLocaleChanged.fire(locale);
        });
    };
})(fluid);
