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

    fluid.defaults("gpii.psp.quickSetStrip.buttonPresenter", {
        gradeNames: ["gpii.psp.elementRepeater.clickable", "fluid.viewComponent"],

        model: {
            item: {}
        },

        listeners: {
            "onCreate.renderLabel": {
                this: "{that}.container",
                method: "text",
                args: ["{that}.model.item.label"]
            },
            onClicked: {
                funcName: "console.log",
                args: "Clicked"
            }
        }
    });


    fluid.defaults("gpii.psp.quickSetStrip.list", {
        gradeNames: ["gpii.psp.repeater"],

        dynamicContainerMarkup: {
            container: "<a class=\"%containerClass\"></a>",
            containerClassPrefix: "fl-quickSetStrip-button"
        },
        // TODO get handler based on setting type
        handlerType: "gpii.psp.quickSetStrip.buttonPresenter",
        markup: ""
    });

    /**
     * TODO
     */
    fluid.defaults("gpii.psp.quickSetStrip", {
        gradeNames: ["fluid.viewComponent"],

        model: {
            settings: [
                {label: "More ..."},
                {label: "Some long long long long setting label"},
                {label: "Key out"}
            ]
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
            // TODO
            // channel: {
            // }
        }
    });
})(fluid);
