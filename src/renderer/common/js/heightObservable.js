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
     *
     * Note that this view component assumes that its corresponding DOM element is
     * an iframe.
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
     * A view component whose visual representation has а varing height or which
     * contains a DOM element with а varying height. The component fires the
     * `onHeightChanged` event with the new height as an argument whenever a height
     * change is detected. Internally uses an instance of the
     * `gpii.psp.heightChangeListener` component. The `heightListenerContainer`
     * selector must uniquely identify the piece of the DOM whose height may change.
     * If this selector is not provided, the component's container will be used.
     *
     * The component provides a general mechanism for calculating the new height of
     * its visual representation. If for any reason there is a need to use a
     * different strategy for this, please override the `calculateHeight` invoker.
     *
     * As the `gpii.psp.heightChangeListener` needs an iframe as a container element
     * in order to function properly, the `heightObservable` takes care of adding
     * the necessary markup (iframe element) to the document. This way the only thing
     * that has to be done to detect changes in height is to add this grade to the
     * component of interest (and perhaps specify the `gpii.psp.heightChangeListener`
     * and a new `calculateHeight` invoker as mentioned earlier).
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
            heightListenerContainer: null // may be specified by parent
        },

        markup: {
            heightChangeListener: "<iframe class=\"fl-heightChangeListener\"></iframe>"
        },

        events: {
            onHeightListenerMarkupRendered: null,
            onHeightChanged: null
        },

        components: {
            renderHeightListenerMarkup: {
                type: "fluid.viewComponent",
                container: {
                    expander: {
                        funcName: "gpii.psp.heightObservable.getHeightListenerContainer",
                        args: [
                            "{that}.dom.heightListenerContainer",
                            "{that}.container"
                        ]
                    }
                },
                options: {
                    listeners: {
                        "onCreate.render": {
                            funcName: "gpii.psp.heightObservable.renderMarkup",
                            args: [
                                "{that}.container",
                                "{heightObservable}.options.markup.heightChangeListener",
                                "{heightObservable}.events.onHeightListenerMarkupRendered"
                            ]
                        }
                    }
                }
            },
            heightChangeListener: {
                type: "gpii.psp.heightChangeListener",
                createOnEvent: "onHeightListenerMarkupRendered",
                container: "{arguments}.0",
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
                this: "{that}.container",
                method: "outerHeight",
                args: [true]
            },
            updateHeight: {
                changePath: "height",
                value: "@expand:{that}.calculateHeight()"
            }
        }
    });

    /**
     * Returns the container to which the height change listener DOM element
     * should be added. If the parent component has explicitly specified such
     * a container, it will be used. Otherwise, the parent's container will be
     * used.
     * @param {jQuery} heightListenerContainer - An element representing the
     * height change listener container. May be empty.
     * @param {jQuery} heightObservableContainer - An element representing the
     * container of the parent component.
     * @return {jQuery} the element in which the height change listener DOM
     * element should be added.
     */
    gpii.psp.heightObservable.getHeightListenerContainer = function (heightListenerContainer, heightObservableContainer) {
        return fluid.isValue(heightListenerContainer[0]) ? heightListenerContainer : heightObservableContainer;
    };

    /**
     * Creates the height change listner DOM element, adds it to the specified
     * container and fires an event when done.
     * @param {jQuery} container - The container to which the height change listener
     * element will be added.
     * @param {String} markup - The markup of the height change listner element.
     * @param {Object} onRenderedEvent - The event which will be fired once the
     * markup has been rendered.
     */
    gpii.psp.heightObservable.renderMarkup = function (container, markup, onRenderedEvent) {
        var heightListenerElement = jQuery(markup);
        container.prepend(heightListenerElement);
        onRenderedEvent.fire(heightListenerElement);
    };
})(fluid);
