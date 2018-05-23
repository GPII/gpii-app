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
     * Represents the controller for the qssTooltip dialog
     * that gives information for the application version,
     * user listeners (keys) and some useful links.
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

        selectors: {
            header: ".flc-tooltipHeader",
            body:   ".flc-tooltipBody",
            footer: ".flc-tooltipFooter"
        },

        invokers: {
            update: {
                changePath: "messages",
                value: "{arguments}.0"
            }
        },

        components: {
            channelListener: {
                type: "gpii.psp.channelListener",
                options: {
                    listeners: {
                        onSettingUpdated: {
                            func: "{qssTooltipPopup}.update",
                            args: ["{arguments}.0.tooltip"]
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
