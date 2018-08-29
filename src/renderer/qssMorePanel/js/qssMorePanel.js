/**
 * The renderer portion of the QSS More Panel
 *
 * Creates the Quick Set Strip More Panel once the document has been loaded.
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
     * Enables internationalization of the QSS More Panel.
     */
    fluid.defaults("gpii.psp.translatedQssMorePanel", {
        gradeNames: ["gpii.psp.messageBundles", "fluid.viewComponent", "gpii.psp.linksInterceptor"],

        components: {
            qssMorePanel: {
                type: "gpii.psp.qssMorePanel",
                container: "{translatedQssMorePanel}.container",
                options: {
                    scaleFactor: "{translatedQssMorePanel}.options.scaleFactor"
                }
            }
        }
    });

    /**
     * Represents the More Panel. Takes care of initializing it and handling
     * user interaction.
     */
    fluid.defaults("gpii.psp.qssMorePanel", {
        gradeNames: ["fluid.viewComponent", "gpii.psp.scaledPage", "gpii.psp.selectorsTextRenderer"],

        model: {
            messages: {
                title: null,
                details: null,
                link: null
            }
        },

        selectors: {
            titlebar: ".flc-titlebar",
            details: ".flc-qssMorePanel-details",
            link: ".flc-qssMorePanel-link"
        },

        events: {
            onQssMorePanelClosed: null
        },

        enableRichText: true,

        components: {
            channelNotifier: {
                type: "gpii.psp.channelNotifier",
                options: {
                    events: {
                        onQssMorePanelClosed: "{qssMorePanel}.events.onQssMorePanelClosed"
                    }
                }
            },
            titlebar: {
                type: "gpii.psp.titlebar",
                container: "{that}.dom.titlebar",
                options: {
                    model: {
                        messages: {
                            title: "{qssMorePanel}.model.messages.title"
                        }
                    },
                    listeners: {
                        "onClose": "{qssMorePanel}.events.onQssMorePanelClosed"
                    }
                }
            }
        }
    });
})(fluid);
