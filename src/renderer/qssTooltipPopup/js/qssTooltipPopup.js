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
    var gpii = fluid.registerNamespace("gpii");

    /**
     * Represents the controller for the QSS tooltip that is used to provide
     * information about the current setting.
     */
    fluid.defaults("gpii.qss.qssTooltipPopup", {
        gradeNames: ["fluid.viewComponent", "gpii.psp.selectorsTextRenderer"],

        model: {
            messages: {
                tooltip: null
            },
            availableDirections: {
                defaultDirection: "right",
                leftDirection: "left",
                centerDirection: "center"
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
                        onTooltipUpdated: { // handles the text change on tooltip show
                            func: "{qssTooltipPopup}.updateTooltip",
                            args: ["{arguments}.0"]
                        },
                        onTooltipArrowDirection: { // handles the change of the tooltip's arrow direction
                            func: "gpii.qss.qssTooltipPopup.onTooltipArrowDirection",
                            args: [
                                "{arguments}.0",
                                "{qssTooltipPopup}.model.availableDirections",
                                "{qssTooltipPopup}.container"
                            ]
                        }
                    },
                    events: {
                        onTooltipUpdated: null,
                        onTooltipArrowDirection: null
                    }
                }
            }
        }
    });

    /**
     * Applies the new arrow direction class on the tooltip's root dom element
     * by default the arrow is on the right (by design), so we are only applying the change
     * if the new direction its not right
     * @param {String} arrowDirection - the new direction of the arrow
     * @param {Object.<String, String>} availableDirections - all of the available directions
     * @param {jQuery} tooltipRoot - the root container of the widget, we are applying the class there
     */
    gpii.qss.qssTooltipPopup.onTooltipArrowDirection = function (arrowDirection, availableDirections, tooltipRoot) {
        // removing any possible classes
        tooltipRoot.removeClass("fl-arrow-" + availableDirections.leftDirection);
        tooltipRoot.removeClass("fl-arrow-" + availableDirections.centerDirection);
        // applying the new class if its not the default one (which don't need a class)
        if (arrowDirection !== availableDirections.defaultDirection) {
            tooltipRoot.addClass("fl-arrow-" + arrowDirection);
        }
    };
})(fluid);
