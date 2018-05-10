/**
 * Initializes the QuickSetStrip dialog
 *
 * Creates the Quick Set Strip once the document has been loaded.
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
    var gpii = fluid.registerNamespace("gpii");

    var electron = require("electron");
    var windowInitialParams = electron.remote.getCurrentWindow().params;

    /**
     * Wrapper that enables translations for the `gpii.psp.QuickSetStrip` component and
     * applies interception of all anchor tags on the page so that an external browser is used
     * for loading them.
     */
    fluid.defaults("gpii.psp.translatedQuickSetStrip", {
        gradeNames: ["gpii.psp.messageBundles", "fluid.viewComponent", "gpii.psp.linksInterceptor"],

        components: {
            quickSetStrip: {
                type: "gpii.psp.quickSetStrip",
                container: "{translatedQuickSetStrip}.container",
                options: {
                    model: {
                        settings: "{translatedQuickSetStrip}.model.settings"
                    }
                }
            }
        }
    });


    jQuery(function () {
        gpii.psp.translatedQuickSetStrip(".flc-quicksetstrip", {
            model: {
                settings: windowInitialParams.settings
            }
        });

        /// XXX for dev in browser
        // gpii.psp.quickSetStrip(".flc-quickSetStrip", {
        //     model: {
        //         settings: [
        //             {label: "More ..."},
        //             {label: "Some long long long long setting label"},
        //             {label: "Caption"},
        //             {label: "Languages"},
        //             {label: "Key out"}
        //         ]
        //     }
        // });
    });
})(fluid);
