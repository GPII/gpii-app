/*!
PSP titlebar

Contains a component representing the titlebar of the PSP.
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
    /**
     * A component representing the titlebar of the PSP. Contains the application
     * icon, the application title, as well as a button for closing the PSP window.
     */
    fluid.defaults("gpii.psp.titlebar", {
        gradeNames: ["fluid.viewComponent"],
        selectors: {
            appName: ".flc-appName",
            closeBtn: ".flc-closeBtn"
        },
        events: {
            onPSPClose: null
        },
        labels: {
            appName: "GPII Settings"
        },
        components: {
            closeBtn: {
                type: "gpii.psp.widgets.button",
                container: "{that}.dom.closeBtn",
                options: {
                    attrs: {
                        "aria-label": "Close"
                    },
                    invokers: {
                        "onClick": "{titlebar}.events.onPSPClose.fire"
                    }
                }
            }
        },
        listeners: {
            "onCreate.setAppName": {
                this: "{that}.dom.appName",
                method: "text",
                args: ["{that}.options.labels.appName"]
            }
        }
    });
})(fluid);
