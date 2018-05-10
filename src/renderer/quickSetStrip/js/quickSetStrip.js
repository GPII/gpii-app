/**
 * The quick set strip
 *
 * Represents the quick set strip with which the user can update his settings.
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

    fluid.defaults("gpii.psp.elementRepeater.clickable", {
        events: {
            onClicked: null
        },

        listeners: {
            "onCreate.addClickHandler": {
                this: "{that}.container",
                method: "click",
                args: "{that}.events.onClicked.fire"
            }
        }
    });

    /**
     * TODO
     * add timeout?
     */
    fluid.defaults("gpii.psp.elementRepeater.hovarable", {
        events: {
            onMouseEnter: null,
            onMouseLeave: null
        },

        listeners: {
            "onCreate.addHoverHandler": {
                this: "{that}.container",
                method: "hover",
                args: [
                    "{that}.events.onMouseEnter.fire",
                    "{that}.events.onMouseLeave.fire"
                ]
            }
        }
    });


    /**
     * TODO
     */
    fluid.defaults("gpii.psp.quickSetStrip.buttonPresenter", {
        gradeNames: [
            "gpii.psp.elementRepeater.clickable",
            "gpii.psp.elementRepeater.hovarable",
            "fluid.viewComponent"
        ],

        model: {
            item: {}
        },

        // pass hover item as it is in order to use its position
        // TODO probably use something like https://stackoverflow.com/questions/3234977/using-jquery-how-to-get-click-coordinates-on-the-target-element
        events: {
            onMouseEnter: "{list}.events.onButtonMouseEnter",
            onMouseLeave: "{list}.events.onButtonMouseLeave"
        },

        listeners: {
            onClicked: {
                funcName: "{list}.events.onButtonClicked.fire",
                args: ["{that}.model.item"]
            },
            "onCreate.renderLabel": {
                this: "{that}.container",
                method: "text",
                args: ["{that}.model.item.label"]
            }
        }
    });


    fluid.defaults("gpii.psp.quickSetStrip.list", {
        gradeNames: ["gpii.psp.repeater"],

        dynamicContainerMarkup: {
            container: "<button class=\"%containerClass\" tabindex=0></button>",
            containerClassPrefix: "fl-quickSetStrip-button"
        },
        // TODO get handler based on setting type
        handlerType: "gpii.psp.quickSetStrip.buttonPresenter",
        markup: null,


        events: {
            onButtonClicked: null,
            onButtonMouseEnter: null,
            onButtonMouseLeave: null
        }
    });


    fluid.defaults("gpii.psp.channelListener", {
        gradeNames: "gpii.app.dialog.simpleChannelListener",
        ipcTarget: require("electron").ipcRenderer,

        // TODO add events from the main process
        events: {}
    });

    fluid.defaults("gpii.psp.channelNotifier", {
        gradeNames: "gpii.app.dialog.simpleChannelNotifier",
        ipcTarget: require("electron").ipcRenderer,

        events: {
            onQssButtonClicked: null,
            onQssButtonMouseEnter: null,
            onQssButtonMouseLeave: null
        }
    });

    /**
     * TODO
     */
    fluid.defaults("gpii.psp.quickSetStrip", {
        gradeNames: ["fluid.viewComponent"],

        model: {
            settings: []
        },

        components: {
            quickSetStripList: {
                type: "gpii.psp.quickSetStrip.list",
                container: "{that}.container",
                options: {
                    model: {
                        items: "{quickSetStrip}.model.settings"
                    }
                }
            },
            channelListener: {
                type: "gpii.psp.channelListener"
            },
            channelNotifier: {
                type: "gpii.psp.channelNotifier",
                options: {
                    events: {
                        onQssButtonClicked:    "{quickSetStripList}.events.onButtonClicked",
                        onQssButtonMouseEnter: "{quickSetStripList}.events.onButtonMouseEnter",
                        onQssButtonMouseLeave: "{quickSetStripList}.events.onButtonMouseLeave"
                    }
                }
            }
        }
    });
})(fluid);
