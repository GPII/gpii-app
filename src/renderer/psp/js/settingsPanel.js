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

        listeners: {
            onCreate: {
                funcName: "console.log",
                args: "{that}"
            }
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

    /**
     * Returns the markup for a particular setting based on its type.
     * @param markup {Object} A hash containing markup fetched by the `resourceLoader`.
     * @param widgetExemplars {Object} The `gpii.psp.widgetExemplars` object.
     * @param setting {Object} A setting object.
     * @return {String} The markup for the specified setting.
     */
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
