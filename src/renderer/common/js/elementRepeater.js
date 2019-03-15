/**
 * Repeater for markup elements
 *
 * Simple component for visual representation of a list of items with a
 * common markup.
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
     * A component responsible for inserting the markup of an item and its
     * container in the DOM and for removing that markup when the component
     * gets destroyed. In order to accomplish the latter, the rendered
     * container is saved within the component.
     */
    fluid.defaults("gpii.psp.repeater.renderer", {
        gradeNames: "fluid.viewComponent",

        markup: {
            container: null,
            element:   null
        },

        model: {
            renderedContainer: null
        },
        events: {
            onElementRendered: null
        },
        listeners: {
            "onCreate.renderContainer": {
                this: "{that}.container",
                method: "append",
                args: ["{that}.options.markup.container"]
            },
            "onCreate.updateContainer": {
                funcName: "{that}.setContainer",
                args: "@expand:gpii.psp.getContainerLastChild({that}.container)",
                priority: "after:renderContainer"
            },
            "onCreate.renderElement": {
                this: "{that}.model.renderedContainer",
                method: "append",
                args: "{that}.options.markup.element",
                priority: "after:updateContainer"
            },
            "onCreate.notify": {
                funcName: "{that}.events.onElementRendered.fire",
                args: ["{that}.model.renderedContainer"],
                priority: "after:renderElement"
            },
            "onDestroy.clearInjectedMarkup": {
                funcName: "gpii.psp.removeElement",
                args: "{that}.model.renderedContainer"
            }
        },
        invokers: {
            setContainer: {
                changePath: "renderedContainer",
                value: "{arguments}.0"
            }
        }
    });

    /**
     * A component which injects all the necessary markup for an item and
     * initializes a handler of the corresponding `handlerType` to visualize
     * a given item.
     * Some of the component's options are the `item` which is to be visualized
     * together with its `index` in the array of `items` from the `repeater`,
     * the actual `markup` of both the container and the item itself which is
     * to be inserted in the DOM and the `handlerType`.
     */
    fluid.defaults("gpii.psp.repeater.element", {
        gradeNames: "fluid.viewComponent",

        item:        null,
        index:       null,
        handlerType: null,

        model: {
            item: "{that}.options.item"
        },

        markup: {
            container: null,
            element:   null
        },

        events: {
            onElementRendered: null // fired when the rendering of the item completes
        },

        components: {
            renderer: {
                type: "gpii.psp.repeater.renderer",
                container: "{that}.container",
                options: {
                    markup: "{element}.options.markup",

                    listeners: {
                        onElementRendered: "{element}.events.onElementRendered.fire"
                    }
                }
            },
            handler: {
                type: "{that}.options.handlerType",
                createOnEvent: "onElementRendered",
                container: "{arguments}.0",
                options: {
                    model: {
                        item: "{element}.model.item",
                        index: "{element}.options.index"
                    }
                }
            }
        }
    });


    /**
     * A component for visualizing multiple "similar" objects (such as settings,
     * setting groups or image dropdown menu items). The component expects:
     * - an `items` array in its model describing each of the items to be visualized.
     * - a `handlerType` option which contains the grade name of a component which
     * will be in charge of visually representing a single item.
     * - a `getMarkup` invoker which accepts two arguments - the current item and
     * its index in the array of `items` and returns the markup which is to be
     * inserted in the DOM for the given item.
     * - a `dynamicContainerMarkup` which holds the markup of the `container` in which
     * the markup for the item returned by `getMarkup` will be inserted, as well as
     * a `containerClassPrefix` which together with the index of the current item will
     * be used to create a unique class name for the item's container.
     */
    fluid.defaults("gpii.psp.repeater", {
        gradeNames: "fluid.viewComponent",

        model: {
            items: []
        },

        handlerType: null,

        invokers: {
            getMarkup: {
                funcName: "fluid.identity",
                args: ["{that}.options.markup"]
            },
            getHandlerType: {
                funcName: "fluid.identity",
                args: ["{that}.options.handlerType"]
            }
        },

        dynamicContainerMarkup: {
            container:            "<div class=\"%containerClass\"></div>",
            // TODO rename to containerClassTpl
            containerClassPrefix: "flc-dynamicElement-%id" // preferably altered by the implementor
        },

        dynamicComponents: {
            element: {
                type: "gpii.psp.repeater.element",
                container: "{that}.container",
                sources: "{repeater}.model.items",
                options: {
                    index: "{sourcePath}",
                    item:  "{source}",
                    handlerType: "@expand:{repeater}.getHandlerType({that}.options.item)",

                    modelListeners: {
                        /*
                         * Simulate bi-directional binding for items as using `dynamicComponent` corrupts this binding
                         */

                        // notify for changes in the handler
                        // down to top binding
                        "item": {
                            funcName: "gpii.psp.repeater.notifyElementChange",
                            args: [
                                "{repeater}",
                                "{that}.options.index",
                                "{change}.value"
                            ],
                            excludeSource: "init"
                        },
                        // rerender element on item change
                        // top-down binding
                        "{repeater}.model.items.*": {
                            funcName: "gpii.psp.repeater.notifyListChange",
                            args: [
                                "{that}.handler",
                                "{that}.options.index",
                                // take only the index
                                "{change}.path.1",
                                "{change}.value"
                            ],
                            excludeSource: ["init", "gpii.psp.repeater.element"]
                        }
                    },

                    markup: {
                        container: {
                            expander: {
                                funcName: "gpii.psp.repeater.getIndexedContainerMarkup",
                                args: [
                                    "{repeater}.options.dynamicContainerMarkup",
                                    "{that}.options.index"
                                ]
                            }
                        },
                        // generated dynamically using the current item
                        element: "@expand:{repeater}.getMarkup({that}.options.item, {that}.options.index)"
                    }
                }
            }
        }
    });

    /**
     * Notifies the `gpii.psp.repeater` component for changes  in its element handlers.
     * @param {Component} repeater - The `gpii.psp.repeater` component
     * @param {String} elIndex - The index of the handler (which matches the index of the item in
     * the repeater)
     * @param {Object} newValue - The new state of the item
     */
    gpii.psp.repeater.notifyElementChange = function (repeater, elIndex, newValue) {
        repeater.applier.change("items." + elIndex, newValue, null, "gpii.psp.repeater.element");
    };

    /**
     * Notifies the corresponding handler about a change in its setting. The origin of the
     * change is the `repeater`. The handler to be notified is computed using the changed
     * setting's index.
     * @param {Component} handler - The handler instance.
     * @param {String} elIndex - The index of the handler (which matches the index of the item in
     * the repeater).
     * @param {String} itemIndex - The index of the item that has been changed.
     * @param {Object} newValue - The new state of the item.
     */
    gpii.psp.repeater.notifyListChange = function (handler, elIndex , itemIndex, newValue) {
        itemIndex = fluid.parseInteger(itemIndex);

        if (elIndex === itemIndex) {
            handler.applier.change("item", newValue, null, "gpii.psp.repeater.itemUpdate");
        }
    };

    /**
     * Constructs the markup for the indexed container - sets proper index.
     * @param {Object} markup - An object containing various HTML markup.
     * @param {String} markup.containerClassPrefix - The class prefix for the indexed container.
     * Should have a `id` interpolated expression.
     * @param {String} markup.container - The markup which is to be interpolated with the container index.
     * Should have a `containerClass` interpolated expression.
     * @param {Number} containerIndex - The index for the container.
     * @return {String} the markup for the indexed container.
     */
    gpii.psp.repeater.getIndexedContainerMarkup = function (markup, containerIndex) {
        var containerClass = fluid.stringTemplate(markup.containerClassPrefix, { id: containerIndex });
        return fluid.stringTemplate(markup.container, { containerClass: containerClass });
    };

    /**
     * Utility function for retrieving the last  child element of a container.
     * @param {jQuery} container - The jQuery container object
     * @return {jQuery} A jQuery container object representing the last child
     * element if any.
     */
    gpii.psp.getContainerLastChild = function (container) {
        return container.children().last();
    };

    /**
     * Removes the provided element from the DOM.
     * @param {jQuery} element - A jQuery object representing the element to
     * be removed.
     */
    gpii.psp.removeElement = function (element) {
        if (element) {
            element.remove();
        }
    };
})(fluid);
