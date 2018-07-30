/**
 * The footer component of the PSP window
 *
 * Defines the buttons contained in the footer of the PSP and their click handlers.
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
    fluid.defaults("gpii.psp.footer", {
        gradeNames: ["fluid.viewComponent"],
        selectors: {
            helpBtn: ".flc-helpBtn"
        },
        model: {
            messages: {
                help: null
            }
        },
        components: {
            helpBtn: {
                type: "gpii.psp.widgets.button",
                container: "{that}.dom.helpBtn",
                options: {
                    model: {
                        label: "{footer}.model.messages.help"
                    },
                    invokers: {
                        "onClick": "gpii.psp.openUrlExternally({footer}.options.urls.help)"
                    }
                }
            }
        },
        urls: {
            help: "http://pmt.gpii.org/help"
        }
    });
})(fluid);
