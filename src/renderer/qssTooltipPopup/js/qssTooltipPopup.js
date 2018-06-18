/**
 * The QSS tooltip popup
 *
 * Represents an QSS tooltip popup.
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
    /**
     * Represents the controller for the QSS tooltip that is used to provide
     * information about the current setting.
     */
    fluid.defaults("gpii.qss.qssTooltipPopup", {
        gradeNames: ["fluid.viewComponent", "gpii.psp.selectorsTextRenderer"],

        model: {
            messages: {
                header: "Some header",
                body: "some body",
                footer: "some description"
            }
        },

        enableRichText: true,

        selectors: {
            header: ".flc-tooltipHeader",
            body:   ".flc-tooltipBody",
            footer: ".flc-tooltipFooter"
        },

        invokers: {
            update: {
                funcName: "fluid.fireChanges",
                args: [
                    "{that}.applier",
                    [
                        // simple way to avoid get rid of previous state leftovers
                        {path: "messages", value: { header: "", body: "", footer: "" }},
                        {path: "messages", value: "{arguments}.0"}
                    ]
                ]
            }
        },

        components: {
            channelListener: {
                type: "gpii.psp.channelListener",
                options: {
                    listeners: {
                        onSettingUpdated: {
                            func: "{qssTooltipPopup}.update",
                            args: ["{arguments}.0"]
                        }
                    },
                    events: {
                        // Add events from the main process to be listened for
                        onSettingUpdated: null
                    }
                }
            }
        }
    });
})(fluid);
