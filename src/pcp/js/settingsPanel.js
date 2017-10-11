/*

Copyright 2013-2017 OCAD University



Licensed under the Educational Community License (ECL), Version 2.0 or the New

BSD license. You may not use this file except in compliance with one these

Licenses.



You may obtain a copy of the ECL 2.0 License and BSD License at

https://github.com/fluid-project/infusion/raw/master/Infusion-LICENSE.txt

*/

/* global fluid */

"use strict";
(function (fluid) {
    var gpii = fluid.registerNamespace("gpii");

    fluid.registerNamespace("gpii.pcp");
    fluid.registerNamespace("gpii.pcp.utils");


    /**
     * Utility function for retrieving the last sub-element of a container
     * @param container {Object} The jQuery container object
     * @returns {Object} A jQuery container object
     */
    gpii.pcp.utils.getContainerLastChild = function (container) {
        return container.children().last();
    };

    /**
     * A simple wrapper for the remove function
     * @param container {Object} A jQuery object
     */
    gpii.pcp.utils.removeContainer = function (container) {
        if (container) {
            container.remove();
        }
    };

    /**
     * Creates the binding with the already rendered DOM elements.
     * Expects: widget configuration and model
     */
    fluid.defaults("gpii.pcp.settingPresenter", {
        gradeNames: "fluid.viewComponent",
        selectors: {
            icon: ".flc-icon",
            solutionName: ".flc-solutionName",
            title: ".flc-title",
            memoryIcon: ".flc-memoryIcon",
            restartIcon: ".flc-restartIcon",
            widget: ".flc-widget"
        },
        model: {
            icon: null,
            solutionName: null,
            title: null,
            values: null,
            value: null
        },
        widgetConfig: {
            widgetOptions: null,
            grade: null
        },

        components: {
            widget: {
                type: "{that}.options.widgetConfig.options.grade",
                container: "{that}.dom.widget",
                options: "{settingPresenter}.options.widgetConfig.options.widgetOptions"
            }
        },
        modelListeners: {
            value: {
                funcName: "gpii.pcp.showRestartIcon",
                args: ["{that}.model.dynamic", "{that}.dom.restartIcon"],
                excludeSource: "init"
            }
        },
        listeners: {
            "onCreate.setIcon": {
                this: "{that}.dom.icon",
                method: "attr",
                args: ["src", "{that}.model.icon"]
            },
            "onCreate.setSolutionName": {
                this: "{that}.dom.solutionName",
                method: "text",
                args: "{that}.model.solutionName"
            },
            "onCreate.setTitle": {
                this: "{that}.dom.title",
                method: "append",
                args: "{that}.model.title"
            },
            "onCreate.setMemoryIcon": {
                funcName: "gpii.pcp.showMemoryIcon",
                args: ["{that}.model.isPersisted", "{that}.dom.memoryIcon"]
            }
        }
    });

    /**
     * Renders all related markup for a setting:
     * - container;
     * - setting markup;
     * - widget markup
     * It also removes the injected markup on destroy
     * Expects: markup
     * Saves the newly created setting outer container internally
     */
    fluid.defaults("gpii.pcp.settingRenderer", {
        gradeNames: "fluid.viewComponent",

        markup: {
            container: null,
            setting: null,
            widget: null
        },

        model: {
            // Save the container created
            settingContainer: null
        },
        events: {
            onSettingContainerRendered: null,
            onSettingMarkupRendered: null,
            onWidgetMarkupRendered: null
        },
        listeners: {
            "onDestroy.clearInjectedMarkup": {
                funcName: "gpii.pcp.utils.removeContainer",
                args: "{that}.model.settingContainer"
            }
        },
        components: {
            /*
             * Render the outer most container for the setting
             */
            renderSettingContainer: {
                type: "fluid.viewComponent",
                container: "{that}.container",
                options: {
                    // TODO extract as component -> container renderer?
                    listeners: {
                        "onCreate.render": {
                            this: "{that}.container",
                            method: "append",
                            args: ["{settingRenderer}.options.markup.container"]
                        },
                        "onCreate.updateContainer": {
                            funcName: "{settingRenderer}.setContainer",
                            args: "@expand:gpii.pcp.utils.getContainerLastChild({that}.container)",
                            priority: "after:render"
                        },
                        "onCreate.notify": {
                            funcName: "{settingRenderer}.events.onSettingContainerRendered.fire",
                            // Get the newly created container
                            priority: "after:updateContainer"
                        }
                    }
                }
            },
            /**
             * Renders the setting markup inside the dedicated container
             */
            renderSettingMarkup: {
                type: "fluid.viewComponent",
                container: "{that}.model.settingContainer",
                createOnEvent: "onSettingContainerRendered",
                options: {
                    widgetContainerClass: ".flc-widget",
                    listeners: {
                        "onCreate.render": {
                            this: "{that}.container",
                            method: "append",
                            args: "{settingRenderer}.options.markup.setting"
                        },
                        "onCreate.notify": {
                            funcName: "{settingRenderer}.events.onSettingMarkupRendered.fire",
                            /*
                             * Get the widget container.
                             * Should match single element (jquery returns an array of matches)
                             */
                            args: "@expand:$({that}.options.widgetContainerClass, {that}.container)",
                            priority: "after:render"
                        }
                    }
                }
            },
            /*
             * Render widget related markup
             */
            renderWidgetMarkup: {
                type: "fluid.viewComponent",
                // the widget container
                container: "{arguments}.0",
                createOnEvent: "onSettingMarkupRendered",
                options: {
                    listeners: {
                        "onCreate.render": {
                            this: "{that}.container",
                            method: "append",
                            args: "{settingRenderer}.options.markup.widget"
                        },
                        "onCreate.notify": {
                            funcName: "{settingRenderer}.events.onWidgetMarkupRendered.fire",
                            priority: "after:render"
                        }
                    }
                }
            }
        },
        invokers: {
            setContainer: {
                changePath: "settingContainer",
                value: "{arguments}.0"
            }
        }
    });

    /**
     * Handles visualization of single setting.
     * Expects: markup for the all containers and the widget; widgetConfig needed for the setting; the setting
     */
    fluid.defaults("gpii.pcp.settingVisualizer",  {
        gradeNames: "fluid.viewComponent",

        setting: null,
        widgetConfig: null,
        markup: {
            container: null,
            setting: null,
            widget: null
        },

        events: {
            // XXX not quite valid naming as the widget component (in settingPresenter) also renders
            onSettingRendered: null
        },

        components: {
            settingRenderer: {
                type: "gpii.pcp.settingRenderer",
                container: "{that}.container",

                options: {
                    markup: "{settingVisualizer}.options.markup",
                    listeners: {
                        "onWidgetMarkupRendered.notify": {
                            funcName: "{settingVisualizer}.events.onSettingRendered.fire",
                            // pass the created by the subcomponent container
                            args: "{that}.model.settingContainer"
                        }
                    }
                }
            },
            settingPresenter: {
                type: "gpii.pcp.settingPresenter",
                createOnEvent: "onSettingRendered",
                container: "{arguments}.0",
                options: {
                    widgetConfig: "{settingVisualizer}.options.widgetConfig",
                    model: "{settingVisualizer}.options.setting",
                    modelListeners: {
                        value: {
                            funcName: "gpii.pcp.updateSetting",
                            args: ["{that}.model.path", "{change}.value"],
                            excludeSource: ["init", "outer"]
                        }
                    }
                }
            }
        }
    });


    /*
     * With markup given, visualizes the list of settings passed - rendering and binding of each.
     * Expects:
     *   - settings list;
     *   - widgetExemplars containing widget related options;
     *   - markup
     */
    fluid.defaults("gpii.pcp.settingsVisualizer", {
        gradeNames: "fluid.viewComponent",

        model: {
            settings: null
        },
        widgetExemplars: [],
        markup: {
            setting: null
            // per widget exemplar property
        },
        dynamicContainerMarkup: {
            container: "<div class=\"%containerClass\"></div>",
            containerClassPrefix: "flc-settingListRow-%id"
        },
        events: {
            onSettingCreated: null
        },
        modelListeners: {
            settings: {
                func: "{that}.updateSettingsPresentations",
                args: ["{that}", "{that}.model.settings"]
            }
        },
        invokers: {
            updateSettingsPresentations: {
                funcName: "gpii.pcp.settingsVisualizer.updateSettingsPresentations"
            }
        },
        dynamicComponents: {
            settingVisualizer: {
                type: "gpii.pcp.settingVisualizer",
                container: "{that}.container",
                createOnEvent: "onSettingCreated",
                options: {
                    settingIndex: "{arguments}.0",
                    setting: "{arguments}.1",

                    widgetConfig: "@expand:{settingsVisualizer}.options.widgetExemplars.getExemplarBySchemeType({that}.options.setting.type)",
                    markup: {
                        container: "@expand:gpii.pcp.settingsVisualizer.getIndexedContainerMarkup({settingsVisualizer}.options.dynamicContainerMarkup, {that}.options.settingIndex)",
                        setting: "{settingsVisualizer}.options.markup.setting", // markup.setting",
                        widget: "@expand:gpii.pcp.getProperty({settingsVisualizer}.options.markup, {that}.options.widgetConfig.options.grade)"
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
    gpii.pcp.settingsVisualizer.getIndexedContainerMarkup = function (markup, containerIndex) {
        // Remove the "." prefix
        var containerClass = fluid.stringTemplate(markup.containerClassPrefix, { id: containerIndex });
        return fluid.stringTemplate(markup.container, { containerClass: containerClass });
    };

    /**
     * Simple getter for the property that supports complex keys containing '.' (dots).
     */
    gpii.pcp.getProperty = function (obj, property) {
        return obj && obj[property];
    };


    gpii.pcp.settingsVisualizer.updateSettingsPresentations = function (that, settings) {
        // TODO improve
        settings.forEach(function (setting, settingIndex) {
            that.events.onSettingCreated.fire(settingIndex, setting);
        });
    };



    /**
     * The top most component for representation of list of settings.
     * Responsible for fetching all related templates, and visualization of settings
     * Expects: list of settings
     */
    fluid.defaults("gpii.pcp.settingsPanel", {
        gradeNames: "fluid.viewComponent",
        model: {
            settings: []
        },

        components: {
            settingsExemplars: {
                type: "fluid.component",
                options: {
                    members: {
                        widgetExemplarsList: "@expand:gpii.pcp.settingsPanel.getExemplarsList({that}.widgetExemplars)"
                    },
                    components: {
                        widgetExemplars: {
                            type: "gpii.pcp.widgetExemplars"
                        },
                        settingsVisualizerExemplar: {
                            type: "gpii.pcp.exemplar.settingsVisualizer"
                        }
                    }
                }
            },
            resourcesLoader: {
                type: "fluid.resourceLoader",
                options: {
                    resources: "@expand:gpii.pcp.settingsPanel.getResourcesToFetch({settingsExemplars}.settingsVisualizerExemplar, {settingsExemplars}.widgetExemplarsList)",
                    listeners: {
                        onResourcesLoaded: "{settingsPanel}.events.onTemplatesLoaded"
                    }
                }
            },
            // Represents the list of the settings component
            settingsVisualizer: {
                type: "gpii.pcp.settingsVisualizer",
                createOnEvent: "onTemplatesLoaded",
                container: "{that}.container",
                options: {
                    widgetExemplars: "{settingsExemplars}.widgetExemplars",
                    markup: "@expand:gpii.pcp.settingsPanel.flattenResources({resourcesLoader}.resources)",
                    model: {
                        settings: "{settingsPanel}.model.settings"
                    }
                }
            }
        },
        events: {
            onTemplatesLoaded: null
        }
    });

    /**
     * Returns list of exemplars.
     * @param exemplars {Object} The `gpii.pcp.widgetExemplars` object
     * @returns {Object[]} A list of `gpii.pcp.exemplar` objects
     */
    gpii.pcp.settingsPanel.getExemplarsList = function (exemplars) {
        return fluid.values(exemplars)
            .filter(fluid.isComponent);
    };

    /**
     * Simplifies the `fluid.resourcesLoader`'s resource object, to supply only the fetched data.
     *
     * @param resources {Object} The `fluid.resourceLoader`'s `resource` object after fetch.
     * @returns {Object} Object with properties like: `{resourceKey}: {resourceText}`
     */
    gpii.pcp.settingsPanel.flattenResources = function (resources) {
        return fluid.keys(resources)
            .reduce(function (markupMap, resourceKey) {
                markupMap[resourceKey] = resources[resourceKey].resourceText;
                return markupMap;
            }, {});
    };

    /**
     * Resources that are to be fetched - settings inner container and widgets'.
     *
     * @param settingExemplar {Object} A 'gpii.pcp.exemplar.settingsVisualizer' object.
     *   Note: it has a fixed key.
     * @param widgetExemplarsList {Object[]} The list of `gpii.pcp.exemplar`-s
     */
    gpii.pcp.settingsPanel.getResourcesToFetch = function (settingExemplar, widgetExemplarsList) {
        function getWidgetResources(exemplars) {
            return exemplars.reduce(function (markup, exemplar) {
                markup[exemplar.options.grade] = exemplar.options.template;
                return markup;
            }, {});
        }

        var settingsVisualizerMarkup = {
            setting:  settingExemplar.options.template
        };
        var widgetsMarkup = getWidgetResources(widgetExemplarsList);

        return Object.assign(settingsVisualizerMarkup, widgetsMarkup);
    };
})(fluid);
