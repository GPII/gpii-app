/**
 * A component which detects height modifications of the parent DOM element
 *
 * This component should always have an iframe as a container. It fires an event whenever
 * the height of the parent DOM element changes.
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
     * Responsible for detecting height changes in the DOM element which is the
     * parent of the component's container. When a height change occurs, the
     * component fires the `onHeightChanged` event without any arguments. It is
     * up to the implementor/parent component to calculate what the new height
     * is (it may as well not be any different) and whether any subsequent actions
     * should be taken based on it.
     */
    fluid.defaults("gpii.psp.heightChangeListener", {
        gradeNames: ["fluid.viewComponent"],
        listeners: {
            "onCreate.initResizeListener": {
                "this": "@expand:jQuery({that}.container.0.contentWindow)",
                method: "on",
                args: ["resize", "{that}.events.onHeightChanged.fire"]
            }
        },
        events: {
            onHeightChanged: null
        }
    });

    /**
     * Represents a view component whose height can vary. The component fires the
     * `onHeightChanged` event with the new height as an argument whenever a change
     * in the height of the DOM element is detected. Internally uses an instance of
     * the `gpii.psp.heightChangeListener` component.
     *
     * The component provides a general mechanism for calculating the new height of
     * its visual representation. If for any reason there is a need to use a
     * different strategy for this, please override the `calculateHeight` invoker.
     */
    fluid.defaults("gpii.psp.heightObservable", {
        gradeNames: "fluid.viewComponent",

        model: {
            height: null
        },

        modelListeners: {
            height: {
                func: "{that}.events.onHeightChanged.fire",
                args: ["{change}.value"]
            }
        },

        selectors: {
            heightChangeListener: ".flc-contentHeightChangeListener:eq(0)"
        },

        events: {
            onHeightChanged: null
        },

        components: {
            heightChangeListener: {
                type: "gpii.psp.heightChangeListener",
                container: "{that}.dom.heightChangeListener",
                options: {
                    listeners: {
                        onHeightChanged: {
                            func: "{heightObservable}.updateHeight"
                        }
                    }
                }
            }
        },

        invokers: {
            calculateHeight: {
                funcName: "gpii.psp.heightObservable.calculateHeight",
                args: ["{that}"]
            },
            updateHeight: {
                changePath: "height",
                value: "@expand:{that}.calculateHeight()"
            }
        }
    });

    /**
     * Returns the height of the visual representation of the `heightObservable`
     * component.
     * @param that {Component} The `gpii.psp.heightObservable` instance.
     * @return {Number} The height of the component.
     */
    gpii.psp.heightObservable.calculateHeight = function (that) {
        var container = that.container,
            triangleHeight = container.find(".fl-speech-triangle").outerHeight(true) || 0;
        return container.outerHeight(true) + triangleHeight;
    };
})(fluid);
