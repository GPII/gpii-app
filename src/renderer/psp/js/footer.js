/*!
Copyright 2017 Raising the Floor - International

Licensed under the New BSD license. You may not use this file except in
compliance with this License.
The research leading to these results has received funding from the European Union's
Seventh Framework Programme (FP7/2007-2013) under grant agreement no. 289016.
You may obtain a copy of the License at
https://github.com/GPII/universal/blob/master/LICENSE.txt
*/

/* global fluid */

"use strict";
(function (fluid) {
    var gpii = fluid.registerNamespace("gpii"),
        shell = require("electron").shell;

    fluid.defaults("gpii.psp.footer", {
        gradeNames: ["fluid.viewComponent"],
        selectors: {
            keyOutBtn: ".flc-keyOutBtn",
            helpBtn: ".flc-helpBtn"
        },
        events: {
            onKeyOut: null
        },
        components: {
            keyOutBtn: {
                type: "gpii.psp.widgets.button",
                container: "{that}.dom.keyOutBtn",
                options: {
                    label: "{footer}.options.labels.keyOut",
                    invokers: {
                        "onClick": "{footer}.events.onKeyOut.fire"
                    }
                }
            },
            helpBtn: {
                type: "gpii.psp.widgets.button",
                container: "{that}.dom.helpBtn",
                options: {
                    label: "{footer}.options.labels.help",
                    invokers: {
                        "onClick": "gpii.psp.openUrl({footer}.options.urls.help)"
                    }
                }
            }
        },
        urls: {
            help: "http://pmt.gpii.org/help"
        },
        labels: {
            keyOut: "Key Out",
            help: "Help"
        }
    });

    /**
     * Opens the passed url externally using the default browser for the
     * OS (or set by the user).
     * @param url {String} The url to open externally.
     */
    gpii.psp.openUrl = function (url) {
        shell.openExternal(url);
    };
})(fluid);
