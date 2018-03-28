/**
 * Message bundles management for the renderer.
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
     * A component that handles i18n for the components in the renderer.
     * It uses IPC to listen for changes in the locale and the same mechanism for
     * messages distribution that is used in the main process.
     * It expects there to be a subcomponent named `channel` (possibly not direct child) that handles
     * communication with the Main process. It simply extends the latter component, attaching
     * additional listener for the `onLocaleChanged` event.
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

    /**
     * A simple component that attaches listening for "onLocaleChanged" notifications
     * from the Main process through the usage of IPC. A possible usage is alongside
     * with existing (extending) of existing `channel` component.
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
     * Registers for locale change events from the Main process.
     *
     * @param events {Object} Events map.
     */
    gpii.psp.messageBundles.channel.register = function (events) {
        ipcRenderer.on("onLocaleChanged", function (event, locale) {
            events.onLocaleChanged.fire(locale);
        });
    };
})(fluid);
