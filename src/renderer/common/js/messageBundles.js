/**
 * Message bundles management for the renderer process.
 *
 * This component handles internationalization for components in the renderer process by
 * using IPC listeners (to observe changes in the locale) and message distributions.
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
     * A component that handles i18n for the components in the renderer process.
     * It uses IPC to listen for changes in the locale and the same mechanism for
     * messages distribution that is used in the main process.
     * It expects a subcomponent named `channel` (possibly not a direct child) that handles
     * communication with the main process.
     */
    fluid.defaults("gpii.psp.messageBundles", {
        gradeNames: "gpii.app.messageBundles",

        invokers: {
            updateLocale: {
                changePath: "locale",
                value: "{arguments}.0"
            }
        },

        components: {
            localeChannel: {
                type: "gpii.psp.messageBundles.channel",
                options: {
                    listeners: {
                        "onLocaleChanged.setLocale": {
                            func: "{messageBundles}.updateLocale",
                            args: "{arguments}.0"
                        }
                    }
                }
            }
        }
    });

    /**
     * A simple component that attaches a listener for `onLocaleChanged` IPC message
     * from the main process.
     */
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
     * Registers a listener for the  `onLocaleChanged` event from the main process.
     * @param {Object} events - A map of all events for the `channel` component.
     */
    gpii.psp.messageBundles.channel.register = function (events) {
        // XXX DEV
        console.log("Registering locale listener");
        ipcRenderer.on("onLocaleChanged", function (event, locale) {
            console.log("Changed locale: ", locale);
            events.onLocaleChanged.fire(locale);
        });
    };
})(fluid);
