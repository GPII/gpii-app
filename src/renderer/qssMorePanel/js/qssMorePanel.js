/**
 * The renderer portion of the QSS More Panel
 *
 * Creates the Quick Set Strip widget once the document has been loaded.
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
    fluid.defaults("gpii.psp.translatedQssMorePanel", {
        gradeNames: ["gpii.psp.messageBundles", "fluid.viewComponent", "gpii.psp.linksInterceptor"],

        components: {
            qssMorePanel: {
                type: "gpii.psp.qssMorePanel",
                container: "{translatedQssMorePanel}.container"
            }
        }
    });

    fluid.defaults("gpii.psp.qssMorePanel", {
        gradeNames: ["fluid.viewComponent", "gpii.psp.selectorsTextRenderer"],

        model: {
            messages: {
                title: "More",
                details: "Watch this space for more Morphic buttons,  as well as additional features to help you tune the computer to your specific needs and preferences.",
                link: "For more information on Morphic go to <a target=\"_blank\" href=\"http://morphic.global/more\">http://morphic.global/more</a>."
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
