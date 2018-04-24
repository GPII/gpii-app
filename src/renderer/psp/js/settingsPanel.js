/**
 * The settings panel component for visualizing user settings.
 *
 * Contains all necessary components in order for the user settings to be visualized (i.e.
 * means for drawing the corresponding widgets, handling user input and removing the DOM
 * elements when they are no longer needed).
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

    fluid.registerNamespace("gpii.psp");
    fluid.registerNamespace("gpii.psp.utils");


    /**
     * Utility function for retrieving the last  child element of a container.
     * @param container {jQuery} The jQuery container object
     * @return {jQuery} A jQuery container object representing the last child
     * element if any.
     */
    gpii.psp.utils.getContainerLastChild = function (container) {
        return container.children().last();
    };

    /**
     * Removes the provided element from the DOM.
     * @param container {jQuery} A jQuery object representing the element to
     * be removed.
     */
    gpii.psp.utils.removeElement = function (element) {
        if (element) {
            element.remove();
        }
    };


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
            onElementRendered: {
                events: {
                    onContainerRendered: "onContainerRendered",
                    onMarkupRendered:    "onMarkupRendered"
                },
                args: ["{that}.model.renderedContainer"]
            },

            onContainerRendered: null,
            onMarkupRendered:    null
        },
        listeners: {
            "onDestroy.clearInjectedMarkup": {
                funcName: "gpii.psp.utils.removeElement",
                args: "{that}.model.renderedContainer"
            }
        },
        components: {
            /*
             * Renders the container for the item's element, saves it and
             * notifies when done.
             */
            renderElementContainer: {
                type: "fluid.viewComponent",
                container: "{that}.container",
                options: {
                    listeners: {
                        "onCreate.render": {
                            this: "{that}.container",
                            method: "append",
                            args: ["{renderer}.options.markup.container"]
                        },
                        "onCreate.updateContainer": {
                            funcName: "{renderer}.setContainer",
                            args: "@expand:gpii.psp.utils.getContainerLastChild({that}.container)",
                            priority: "after:render"
                        },
                        "onCreate.notify": {
                            funcName: "{renderer}.events.onContainerRendered.fire",
                            // Get the newly created container
                            priority: "after:updateContainer"
                        }
                    }
                }
            },
            /**
             * Renders the markup of the item inside the dedicated container.
             */
            renderElementMarkup: {
                type: "fluid.viewComponent",
                container: "{that}.model.renderedContainer",
                createOnEvent: "onContainerRendered",
                options: {
                    listeners: {
                        "onCreate.render": {
                            this: "{that}.container",
                            method: "append",
                            args: "{renderer}.options.markup.element"
                        },
                        "onCreate.notify": {
                            funcName: "{renderer}.events.onMarkupRendered.fire",
                            args: ["{that}.model.renderedContainer"],
                            priority: "after:render"
                        }
                    }
                }
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
                        item: "{element}.options.item"
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
                funcName: "fluid.notImplemented",
                args: ["{arguments}.0"] // item
            }
        },

        dynamicContainerMarkup: {
            container:            "<div class=\"%containerClass\"></div>",
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
                    handlerType: "{repeater}.options.handlerType",

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
                        // generated dynamicaly using the current item
                        element: "@expand:{repeater}.getMarkup({that}.options.item, {that}.options.index)"
                    }
                }
            }
        }
    });

    /**
     * Constructs the markup for the indexed container - sets proper index.
     *
     * @param markup {Object}
     * @param markup.containerClassPrefix {String} The class prefix for the indexed container.
     *   Should have a `id` interpolated expression.
     * @param markup.container {String} The markup which is to be interpolated with the container index.
     *   Should have a `containerClass` interpolated expression.
     * @param containerIndex {Number} The index for the container
     * @returns {String}
     */
    gpii.psp.repeater.getIndexedContainerMarkup = function (markup, containerIndex) {
        var containerClass = fluid.stringTemplate(markup.containerClassPrefix, { id: containerIndex });
        return fluid.stringTemplate(markup.container, { containerClass: containerClass });
    };


    /**
     * A component which is responsible for visually presenting a setting.
     * It initializes the DOM elements, updates the UI when necessary and
     * fires the appropriate event when a setting's value is changed. Note
     * that a setting can also have subsetting whose visualization will be
     * delegated to a component of type `gpii.psp.settingsVisualizer`.
     */
    fluid.defaults("gpii.psp.settingPresenter", {
        gradeNames: "fluid.viewComponent",
        selectors: {
            solutionName: ".flc-solutionName:eq(0)",
            title: ".flc-title:eq(0)",
            titleLabel: ".flc-titleLabel:eq(0)",
            memoryIcon: ".flc-memoryIcon:eq(0)",
            restartIcon: ".flc-restartIcon:eq(0)",
            widget: ".flc-widget:eq(0)",
            subsettings: ".flc-subsettings:eq(0)"
        },
        model: {
            item: {}, // passed by the repeater

            path:         "{that}.model.item.path",
            solutionName: "{that}.model.item.solutionName",
            value:        "{that}.model.item.value",
            schema:       "{that}.model.item.schema",
            liveness:     "{that}.model.item.liveness", // "live", "liveRestart", "manualRestart", "OSRestart"
            memory:       "{that}.model.item.memory",

            messages: {
                osRestart: null,
                osRestartRequired: null,
                appRestart: null,
                appRestartRequired: null
            }
        },
        modelRelay: {
            restartIconTooltip: {
                target: "restartIconTooltip",
                singleTransform: {
                    type: "fluid.transforms.free",
                    func: "gpii.psp.settingPresenter.getRestartIconTooltip",
                    args: [
                        "{that}.model",
                        "{that}.model.pendingChanges",
                        "{that}.model.messages"
                    ]
                }
            }
        },
        widgetConfig: "@expand:{settingsExemplars}.widgetExemplars.getExemplarBySchemaType({that}.model.item.schema.type)",

        events: {
            onSettingUpdated: "{settingsPanel}.events.onSettingUpdated",
            onSettingAltered: "{settingsPanel}.events.onSettingAltered",
            onRestartRequired: "{settingsPanel}.events.onRestartRequired"
        },

        components: {
            widget: {
                type: "{that}.options.widgetConfig.options.grade",
                container: "{that}.dom.widget",
                // XXX currently, we exploit a misbehavior of expanding the `model` options, even if there's been expansion
                options: "{settingPresenter}.options.widgetConfig.options.widgetOptions"
            },
            subsettings: {
                type: "gpii.psp.settingsVisualizer",
                container: "{that}.dom.subsettings",
                options: {
                    markup:          "{settingGroupsVisualizer}.options.markup",
                    widgetExemplars: "{settingGroupsVisualizer}.options.widgetExemplars",

                    model: {
                        items: "{settingPresenter}.model.item.settings"
                    }
                }
            }
        },
        modelListeners: {
            value: [{
                funcName: "gpii.psp.settingPresenter.toggleSubsettings",
                args: ["{that}", "{change}.value", "{that}.dom.subsettings"]
            }, {
                funcName: "{that}.events.onSettingAltered.fire",
                args: ["{that}.model", "{change}.oldValue"],
                excludeSource: ["init", "psp.mainWindow"]
            }],
            restartIconTooltip: {
                this: "{that}.dom.restartIcon",
                method: "attr",
                args: ["title", "{change}.value"]
            }
        },
        listeners: {
            "onCreate.setSolutionName": {
                this: "{that}.dom.solutionName",
                method: "text",
                args: "{that}.model.solutionName"
            },
            "onCreate.setTitle": {
                this: "{that}.dom.title",
                method: "text",
                args: "{that}.model.schema.title"
            },
            "onCreate.setLabelId": {
                this: "{that}.dom.titleLabel",
                method: "attr",
                args: ["id", "{that}.model.path"]
            },
            "onCreate.showMemoryIcon": {
                this: "{that}.dom.memoryIcon",
                method: "toggle",
                args: ["{that}.model.memory"]
            },
            "onCreate.toggleRestartIcon": {
                funcName: "gpii.psp.settingPresenter.toggleRestartIcon",
                args: ["{that}", "{that}.dom.restartIcon"]
            },
            // Update value locally in order for the corresponding
            //   DOM elements to be notifier, and thus updated
            "onSettingUpdated": {
                funcName: "gpii.psp.settingPresenter.updateModelIfNeeded",
                args: [
                    "{that}",
                    "{arguments}.0", // path
                    "{arguments}.1"  // newValue
                ]
            },
            "onRestartRequired": {
                changePath: "pendingChanges",
                value: "{arguments}.0"
            }
        }
    });

    /**
     * Shows or hides the subsettings for a setting whose type is `boolean` depending on the
     * setting's value.
     * @param that {Component} An instance of `gpii.psp.settingPresenter`.
     * @param value {Any} The new value of a setting.
     * @param subsettingsElement {jQuery} A jQuery element representing the container of the
     * subsetting elements.
     */
    gpii.psp.settingPresenter.toggleSubsettings = function (that, value, subsettingsElement) {
        if (that.model.schema.type === "boolean") {
            subsettingsElement.toggle(value);
        }
    };

    /**
     * Notifies the corresponding widget components about an update on the setting
     * in case the update is reffering current setting
     */
    gpii.psp.settingPresenter.updateModelIfNeeded = function (that, path, newValue) {
        if (path === that.model.path) {
            that.applier.change("value", newValue, null, "psp.mainWindow");
        }
    };

    /**
     * Returns the appropriate tooltip for the restart icon if the setting has has an
     * "OSRestart" liveness and based on whether the user has modified the setting's value.
     * @param setting {Object} An object representing the setting.
     * @param pendingChanges {Array} An array of all pending setting changes that the user
     * has made.
     * @param messages {Object} A set of messages to choose from when calculating the restart
     * icon tooltip.
     * @return The tooltip for the restart icon.
     */
    gpii.psp.settingPresenter.getRestartIconTooltip = function (setting, pendingChanges, messages) {
        if (setting.liveness === "OSRestart") {
            var hasPendingChange = fluid.find_if(pendingChanges, function (change) {
                return change.path === setting.path;
            });

            return hasPendingChange ? messages.osRestartRequired : messages.osRestart;
        }
    };

    /**
     * A function responsible for showing the restart icon if the setting has an "OSRestart"
     * liveness.
     * @param that {Component} An instance of `gpii.psp.settingPresenter`.
     * @param restartIcon {jQuery} A jQuery object representing the restart icon.
     */
    gpii.psp.settingPresenter.toggleRestartIcon = function (that, restartIcon) {
        var isShown = that.model.liveness === "OSRestart";
        restartIcon.toggle(isShown);
    };


    /**
     * A component which is responsible for visually presenting a setting
     * group. It also houses the `restartWarning` component which is separate
     * for each setting group.
     */
    fluid.defaults("gpii.psp.settingGroupPresenter", {
        gradeNames: "fluid.viewComponent",

        selectors: {
            name: ".flc-groupName",
            settings: ".flc-settings:eq(0)",
            restartWarning: ".flc-restartWarning"
        },

        model: {
            item: {}, // passed by the repeater
            name: "{that}.model.item.name",
            solutionName: "{that}.model.item.solutionName",
            settings: "{that}.model.item.settings"
        },

        components: {
            settings: {
                type: "gpii.psp.settingsVisualizer",
                container: "{that}.dom.settings",
                options: {
                    // TODO
                    markup:          "{settingGroupsVisualizer}.options.markup",
                    widgetExemplars: "{settingGroupsVisualizer}.options.widgetExemplars",

                    model: {
                        items: "{settingGroupPresenter}.model.settings"
                    }
                }
            },
            restartWarning: {
                type: "gpii.psp.restartWarning",
                container: "{that}.dom.restartWarning",
                options: {
                    model: {
                        solutionName: "{settingGroupPresenter}.model.solutionName",
                        settings: "{settingGroupPresenter}.model.settings"
                    },
                    modelRelay: {
                        pendingChanges: {
                            target: "pendingChanges",
                            singleTransform: {
                                type: "fluid.transforms.free",
                                func: "gpii.psp.restartWarning.filterPendingChanges",
                                args: ["{settingsPanel}.model.pendingChanges", "{that}.model.settings"]
                            }
                        }
                    },
                    events: {
                        onRestartNow: "{settingsPanel}.events.onRestartNow",
                        onRestartLater: "{settingsPanel}.events.onRestartLater",
                        onUndoChanges: "{settingsPanel}.events.onUndoChanges"
                    }
                }
            }
        },

        listeners: {
            "onCreate.setLabel": {
                this: "{that}.dom.name",
                method: "text",
                args: "{that}.model.name"
            }
        }
    });

    /**
     * A special instance of a `gpii.psp.repeater` responsible for visualizing setting
     * groups. The groups to be visualized have to be passed in the `items` property of
     * the model. This component also requires to be configured with the `group` markup
     * (or more precisely, the group markup will be fetched by the resource loader) and
     * to have a `widgetExemplars` object containing various widget related options.
     */
    fluid.defaults("gpii.psp.settingGroupsVisualizer", {
        gradeNames: "gpii.psp.repeater",

        // Expected from parent
        model: {
            items: null // settingGroups
        },

        widgetExemplars: null, // passed by parent
        markup: {
            group: null
        },

        handlerType:   "gpii.psp.settingGroupPresenter",

        dynamicContainerMarkup: {
            containerClassPrefix: "flc-settingGroup-%id"
        },

        invokers: {
            getMarkup: {
                funcName: "fluid.identity",
                args: ["{that}.options.markup.group"]
            }
        }
    });


    /**
     * A special instance of a `gpii.psp.repeater` responsible for visualizing settings.
     * They have to be passed in the `items` property of the model. This component also
     * requires to be configured with the `setting` markup (it will be fetched by the
     * resource loader) and to have a `widgetExemplars` object containing various widget
     * related options.
     */
    fluid.defaults("gpii.psp.settingsVisualizer", {
        gradeNames: "gpii.psp.repeater",

        model: {
            items: null // settings
        },

        handlerType:   "gpii.psp.settingPresenter",

        widgetExemplars: null, // passed by parent
        markup: {
            setting: null
            // per widget exemplar property
        },
        dynamicContainerMarkup: {
            containerClassPrefix: "flc-settingListRow-%id"
        },

        invokers: {
            getMarkup: {
                funcName: "gpii.psp.settingsVisualizer.getMarkup",
                args: [
                    "{that}.options.markup",
                    "{that}.options.widgetExemplars",
                    "{arguments}.0",
                    "{arguments}.1"
                ]
            }
        }
    });

    gpii.psp.settingsVisualizer.getMarkup = function (markup, widgetExemplars, setting) {
        var widgetConfig = widgetExemplars.getExemplarBySchemaType(setting.schema.type);
        var widgetMarkup = markup[widgetConfig.options.grade];

        return fluid.stringTemplate(markup.setting, {widgetMarkup: widgetMarkup});
    };


    /**
     * The top most component for representation of list of settings.
     * Responsible for fetching all related templates, and visualization of settings
     * Expects: list of settings
     */
    fluid.defaults("gpii.psp.settingsPanel", {
        gradeNames: "gpii.psp.heightObservable",
        model: {
            pendingChanges: [],
            settingGroups: []
        },
        components: {
            settingsExemplars: {
                type: "fluid.component",
                options: {
                    members: {
                        widgetExemplarsList: "@expand:gpii.psp.settingsPanel.getExemplarsList({that}.widgetExemplars)"
                    },
                    components: {
                        widgetExemplars: {
                            type: "gpii.psp.widgetExemplars"
                        },
                        settingsVisualizerExemplar: {
                            type: "gpii.psp.exemplar.settingsVisualizer"
                        },
                        settingGroupsVisualizerExemplar: {
                            type: "gpii.psp.exemplar.settingGroupsVisualizer"
                        }
                    }
                }
            },
            resourcesLoader: {
                type: "fluid.resourceLoader",
                options: {
                    resources: {
                        expander: {
                            funcName: "gpii.psp.settingsPanel.getResourcesToFetch",
                            args: [
                                "{settingsExemplars}.settingGroupsVisualizerExemplar",
                                "{settingsExemplars}.settingsVisualizerExemplar",
                                "{settingsExemplars}.widgetExemplarsList"
                            ]
                        }
                    },
                    listeners: {
                        onResourcesLoaded: "{settingsPanel}.events.onTemplatesLoaded"
                    }
                }
            },
            // Represents the list of the setting groups
            settingGroupsVisualizer: {
                type: "gpii.psp.settingGroupsVisualizer",
                createOnEvent: "onTemplatesLoaded",
                container: "{that}.container",
                options: {
                    widgetExemplars: "{settingsExemplars}.widgetExemplars",
                    markup: "@expand:gpii.psp.settingsPanel.flattenResources({resourcesLoader}.resources)",
                    model: {
                        items: "{settingsPanel}.model.settingGroups"
                    }
                }
            }
        },
        events: {
            onTemplatesLoaded: null,
            onSettingAltered: null,
            onSettingUpdated: null, // passed from outside
            onRestartRequired: null,

            onRestartNow: null,
            onRestartLater: null,
            onUndoChanges: null
        },
        invokers: {
            updatePendingChanges: {
                changePath: "pendingChanges",
                value: "{arguments}.0"
            }
        }
    });

    /**
     * Returns list of exemplars.
     * @param exemplars {Object} The `gpii.psp.widgetExemplars` object
     * @return {Object[]} A list of `gpii.psp.exemplar` objects
     */
    gpii.psp.settingsPanel.getExemplarsList = function (exemplars) {
        return fluid.values(exemplars)
            .filter(fluid.isComponent);
    };

    /**
     * Simplifies the `fluid.resourcesLoader`'s resource object, to supply only the fetched data.
     *
     * @param resources {Object} The `fluid.resourceLoader`'s `resource` object after fetch.
     * @return {Object} Object with properties like: `{resourceKey}: {resourceText}`
     */
    gpii.psp.settingsPanel.flattenResources = function (resources) {
        return fluid.keys(resources)
            .reduce(function (markupMap, resourceKey) {
                markupMap[resourceKey] = resources[resourceKey].resourceText;
                return markupMap;
            }, {});
    };

    /**
     * Resources that are to be fetched - settings inner container and widgets'.
     *
     * @param settingExemplar {Object} A 'gpii.psp.exemplar.settingsVisualizer' object.
     *   Note: it has a fixed key.
     * @param widgetExemplarsList {Object[]} The list of `gpii.psp.exemplar`-s
     */
    gpii.psp.settingsPanel.getResourcesToFetch = function (settingGroupExemplar, settingExemplar, widgetExemplarsList) {
        function getWidgetResources(exemplars) {
            return exemplars.reduce(function (markup, exemplar) {
                markup[exemplar.options.grade] = exemplar.options.template;
                return markup;
            }, {});
        }

        var settingsVisualizerMarkup = {
            group: settingGroupExemplar.options.template,
            setting:  settingExemplar.options.template
        };
        var widgetsMarkup = getWidgetResources(widgetExemplarsList);

        return Object.assign(settingsVisualizerMarkup, widgetsMarkup);
    };
})(fluid);
