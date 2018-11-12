/**
 * The QSS tooltip dialog
 *
 * Represents the QSS tooltip dialog.
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
                tooltip: null
            }
        },

        enableRichText: true,

        selectors: {
            tooltip: ".flc-qssTooltip-content"
        },

        invokers: {
            updateTooltip: {
                changePath: "messages.tooltip",
                value: "{arguments}.0"
            }
        },

        components: {
            channelListener: {
                type: "gpii.psp.channelListener",
                options: {
                    listeners: {
                        onTooltipUpdated: {
                            func: "{qssTooltipPopup}.updateTooltip",
                            args: ["{arguments}.0"]
                        }
                    },
                    events: {
                        onTooltipUpdated: null
                    }
                }
            }
        }
    });
})(fluid);
