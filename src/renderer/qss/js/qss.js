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


    fluid.defaults("gpii.qss.qssKeyListener", {
        gradeNames: "gpii.qss.elementRepeater.keyListener",

        events: {
            onArrowDownPressed: null,
            onArrowUpPressed: null,
            onArrowLeftPressed: null,
            onArrowRightPressed: null,
            onEnterPressed: null,
            onSpacebarPressed: null,
            onTabPressed: null
        }
    });

    /**
     * TODO
     */
    fluid.defaults("gpii.qss.buttonPresenter", {
        gradeNames: [
            "gpii.qss.qssKeyListener",
            "gpii.qss.elementRepeater.hoverable",
            "gpii.qss.elementRepeater.clickable",
            "fluid.viewComponent"
        ],

        model: {
            item: {},
            value: "{that}.model.item.value"
        },

        modelListeners: {
            value: [{
                funcName: "{that}.events.onSettingAltered.fire",
                args: ["{that}.model.item", "{change}.value"],
                excludeSource: ["init", "gpii.psp.repeater.itemUpdate"]
            }, {
                funcName: "gpii.qss.buttonPresenter.updateChangeIndicator",
                args: ["{that}.dom.changeIndicator", "{that}.model.item", "{change}.value"]
            }]
        },

        selectors: {
            title: ".flc-qss-btnLabel",
            image: ".flc-qss-btnImage",
            caption: ".flc-qss-btnCaption",
            changeIndicator: ".flc-qss-btnChangeIndicator"
        },

        styles: {
            activated: "fl-activated",
            settingButton: "fl-qss-settingButton"
        },

        attrs: {
            role: "button"
        },

        // pass hover item as it is in order to use its position
        // TODO probably use something like https://stackoverflow.com/questions/3234977/using-jquery-how-to-get-click-coordinates-on-the-target-element
        events: {
            onMouseEnter: null,
            onMouseLeave: null,
            onButtonFocused: "{gpii.qss.list}.events.onButtonFocused",
            onQssWidgetToggled: "{gpii.qss}.events.onQssWidgetToggled",

            onButtonFocusRequired: "{gpii.qss.list}.events.onButtonFocusRequired",
            onSettingAltered: "{gpii.qss.list}.events.onSettingAltered"
        },

        listeners: {
            "onCreate.addAttrs": {
                "this": "{that}.container",
                method: "attr",
                args: ["{that}.options.attrs"]
            },
            "onCreate.styleButton": {
                funcName: "gpii.qss.buttonPresenter.styleButton",
                args: ["{that}", "{that}.container"]
            },
            "onCreate.renderTitle": {
                this: "{that}.dom.title",
                method: "text",
                args: ["{that}.model.item.schema.title"]
            },
            "onCreate.renderImage": {
                this: "{that}.dom.image",
                method: "attr",
                args: ["src", "{that}.model.item.schema.image"]
            },

            "{focusManager}.events.onElementFocused": {
                funcName: "gpii.qss.buttonPresenter.notifyButtonFocused",
                args: [
                    "{that}",
                    "{that}.container",
                    "{arguments}.0"     // element
                ]
            },

            onButtonFocusRequired: {
                funcName: "gpii.qss.buttonPresenter.focusButton",
                args: [
                    "{that}",
                    "{focusManager}",
                    "{that}.container",
                    "{arguments}.0" // index
                ]
            },
            onQssWidgetToggled: {
                funcName: "gpii.qss.buttonPresenter.onQssWidgetToggled",
                args: [
                    "{that}",
                    "{that}.container",
                    "{arguments}.0", // setting
                    "{arguments}.1" // isShown
                ]
            },

            onMouseEnter: {
                func: "{gpii.qss.list}.events.onButtonMouseEnter",
                args: [
                    "{that}.model.item",
                    "@expand:gpii.qss.getElementMetrics({that}.container)"
                ]
            },
            onMouseLeave: {
                func: "{gpii.qss.list}.events.onButtonMouseLeave",
                args: [
                    "{that}.model.item",
                    "@expand:gpii.qss.getElementMetrics({that}.container)"
                ]
            },

            // Element interaction events

            onClicked: [{
                func: "{focusManager}.focusElement",
                args: ["{that}.container", false]
            }, {
                func: "{that}.activate"
            }],
            "onSpacebarPressed.activate": {
                func: "{that}.activate",
                args: [
                    {key: "Spacebar"}
                ]
            },
            "onEnterPressed.activate": {
                func: "{that}.activate",
                args: [
                    {key: "Enter"}
                ]
            }
        },
        invokers: {
            activate: {
                funcName: "gpii.qss.buttonPresenter.activate",
                args: [
                    "{that}",
                    "{that}.container",
                    "{list}",
                    "{arguments}.0" // activationParams
                ]
            }
        }
    });

    gpii.qss.buttonPresenter.updateChangeIndicator = function (indicatorElem, setting, value) {
        // The dot should be shown if the setting has a default value, the new value of the
        // setting is different from that value and the new value is one of the predefined
        // values (in case of a menu widget).
        var shouldShow =
            fluid.isValue(setting.schema.defaultValue) &&
            !fluid.model.diff(value, setting.schema.defaultValue) &&
            (setting.schema.type !== "string" || setting.schema.enum.indexOf(value) >= 0);
        indicatorElem.toggle(shouldShow);
    };

    gpii.qss.buttonPresenter.styleButton = function (that, container) {
        var path = that.model.item.path;
        if (path.startsWith("http://registry\\.gpii\\.net")) {
            container.addClass(that.options.styles.settingButton);
        }
    };

    gpii.qss.buttonPresenter.onQssWidgetToggled = function (that, container, setting, isShown) {
        var activatedClass = that.options.styles.activated;
        container.toggleClass(activatedClass, isShown && that.model.item.path === setting.path);
    };

    gpii.qss.buttonPresenter.activate = function (that, container, qssList, activationParams) {
        var metrics = gpii.qss.getElementMetrics(container),
            setting = that.model.item;
        qssList.events.onButtonActivated.fire(setting, metrics, activationParams);
    };

    gpii.qss.buttonPresenter.notifyButtonFocused = function (that, container, focusedElement) {
        if (container.is(focusedElement)) {
            that.events.onButtonFocused.fire(
                that.model.item,
                gpii.qss.getElementMetrics(focusedElement));
        }
    };

    gpii.qss.buttonPresenter.focusButton = function (that, focusManager, container, index) {
        if (that.model.index === index) {
            focusManager.focusElement(container, true);
        }
    };
    /**
     * Return the metrics of a clicked element. These can be used
     * for positioning. Note that the position is relative to the right.
     *
     * @param {jQuery} target - The DOM element which
     * positioning metrics are needed.
     * @returns {{width: Number, height: Number, offsetRight}}
     */
    gpii.qss.getElementMetrics = function (target) {
        return {
            offsetRight: $(window).width() - target.offset().left,
            height:      target.outerHeight(),
            width:       target.outerWidth()
        };
    };


    fluid.defaults("gpii.qss.stepperButtonPresenter", {
        gradeNames: ["gpii.qssWidget.baseStepper", "gpii.qss.buttonPresenter"],

        model: {
            // used by baseStepper
            stepperParams: {
                divisibleBy: "{that}.model.item.schema.divisibleBy",
                min:         "{that}.model.item.schema.min",
                max:         "{that}.model.item.schema.max"
            }
        },


        listeners: {
            onArrowUpPressed: [{
                func: "{that}.increment"
            }, {
                func: "{that}.animateButton"
            }],
            onArrowDownPressed: [{
                func: "{that}.decrement"
            }, {
                func: "{that}.animateButton"
            }]
        },

        invokers: {
            animateButton: {
                funcName: "gpii.qssWidget.stepper.animateButton",
                args: ["{that}.container", "{that}.model.value", "{that}.model.stepperParams"]
            }
        }
    });


    fluid.defaults("gpii.qss.toggleButtonPresenter", {
        gradeNames: ["gpii.qss.buttonPresenter"],
        model: {
            messages: {
                caption: null
            }
        },
        attrs: {
            role: "switch"
        },
        modelRelay: {
            "caption": {
                target: "caption",
                singleTransform: {
                    type: "fluid.transforms.free",
                    func: "gpii.qss.toggleButtonPresenter.getCaption",
                    args: ["{that}.model.value", "{that}.model.messages"]
                }
            }
        },
        modelListeners: {
            value: {
                this: "{that}.container",
                method: "attr",
                args: ["aria-checked", "{change}.value"]
            },
            caption: {
                this: "{that}.dom.caption",
                method: "text",
                args: ["{change}.value"]
            }
        },
        listeners: {
            onClicked: "{that}.toggle()",
            onEnterPressed: "{that}.toggle()",
            onSpacebarPressed: "{that}.toggle()"
        },
        invokers: {
            toggle: {
                funcName: "gpii.qss.toggleButtonPresenter.toggle",
                args: ["{that}"]
            }
        }
    });

    gpii.qss.toggleButtonPresenter.getCaption = function (value, messages) {
        return value ? messages.caption : "";
    };

    gpii.qss.toggleButtonPresenter.toggle = function (that) {
        that.applier.change("value", !that.model.value);
    };

    fluid.defaults("gpii.qss.closeButtonPresenter", {
        gradeNames: ["gpii.qss.buttonPresenter"],
        listeners: {
            onClicked: "{that}.closeQss()",
            onEnterPressed: "{that}.closeQss()",
            onSpacebarPressed: "{that}.closeQss()"
        },
        invokers: {
            closeQss: {
                this: "{qss}.events.onQssClosed",
                method: "fire"
            }
        }
    });

    fluid.defaults("gpii.qss.menuButtonPresenter", {
        gradeNames: ["gpii.qss.buttonPresenter"],
        listeners: {
            onArrowUpPressed: {
                funcName: "{that}.activate",
                args: [
                    {key: "ArrowUp"}
                ]
            },
            onArrowDownPressed: {
                funcName: "{that}.activate",
                args: [
                    {key: "ArrowDown"}
                ]
            }
        }
    });

    /**
     * Represents the list of qss settings. It renders the settings and listens
     * for events on them.
     */
    fluid.defaults("gpii.qss.list", {
        gradeNames: ["gpii.psp.repeater"],

        dynamicContainerMarkup: {
            container:
                "<div class=\"%containerClass fl-focusable\" tabindex=\"0\">" +
                    "<div class=\"flc-qss-btnChangeIndicator fl-qss-btnChangeIndicator\"></div>" +
                    "<span class=\"flc-qss-btnLabel fl-qss-btnLabel\"></span>" +
                    "<img class=\"flc-qss-btnImage fl-qss-btnImage\">" +
                    "<div class=\"flc-qss-btnCaption fl-qss-btnCaption\"></div>" +
                "</div>",
            containerClassPrefix: "fl-qss-button"
        },
        markup: null,

        events: {
            onButtonFocusRequired: null,

            // external events
            onButtonFocused: null,
            onButtonActivated: null,
            onButtonMouseEnter: null,
            onButtonMouseLeave: null,

            onSettingAltered: null
        },

        invokers: {
            getHandlerType: {
                funcName: "gpii.qss.list.getHandlerType",
                args: ["{arguments}.0"] // item
            }
        }
    });

    gpii.qss.list.getHandlerType = function (item) {
        switch (item.schema.type) {
        case "boolean":
            return "gpii.qss.toggleButtonPresenter";
        case "number":
            return "gpii.qss.stepperButtonPresenter";
        case "string":
            return "gpii.qss.menuButtonPresenter";
        case "close":
            return "gpii.qss.closeButtonPresenter";

        default:
            return "gpii.qss.buttonPresenter";
        };
    };

    /**
     * Represents the QSS as a whole.
     */
    fluid.defaults("gpii.qss", {
        gradeNames: ["fluid.viewComponent"],

        model: {
            settings: []
        },

        events: {
            onQssOpen: null,
            onQssClosed: null,
            onQssWidgetToggled: null
        },

        listeners: {
            "onQssOpen": {
                funcName: "gpii.qss.onQssOpen",
                args: [
                    "{quickSetStripList}",
                    "{that}.model.settings",
                    "{arguments}.0" // params
                ]
            }
        },

        components: {
            quickSetStripList: {
                type: "gpii.qss.list",
                container: "{that}.container",
                options: {
                    model: {
                        items: "{quickSetStrip}.model.settings"
                    }
                }
            },
            focusManager: {
                type: "gpii.qss.horizontalFocusManager",
                container: "{qss}.container",
                options: {
                    invokers: {
                        onTabPressed: {
                            funcName: "gpii.qss.onTabPressed",
                            args: [
                                "{that}",
                                "{arguments}.0" // KeyboardEvent
                            ]
                        }
                    }
                }
            },
            channelListener: {
                type: "gpii.psp.channelListener",
                options: {
                    events: {
                        // Add events from the main process to be listened for
                        onQssOpen: "{qss}.events.onQssOpen",
                        onQssWidgetToggled: "{qss}.events.onQssWidgetToggled",
                        onSettingUpdated: null
                    },
                    // XXX dev
                    listeners: {
                        onSettingUpdated: {
                            // Update item by path
                            // TODO
                            funcName: "gpii.qss.updateSetting",
                            args: [
                                "{qss}",
                                "{arguments}.0"
                            ]
                        }
                    }
                }
            },
            channelNotifier: {
                type: "gpii.psp.channelNotifier",
                options: {
                    events: {
                        // Add events the main process to be notified for
                        onQssClosed:           "{qss}.events.onQssClosed",
                        onQssButtonFocused:    "{quickSetStripList}.events.onButtonFocused",
                        onQssButtonsFocusLost: "{focusManager}.events.onFocusLost",
                        onQssButtonActivated:  "{quickSetStripList}.events.onButtonActivated",
                        onQssButtonMouseEnter: "{quickSetStripList}.events.onButtonMouseEnter",
                        onQssButtonMouseLeave: "{quickSetStripList}.events.onButtonMouseLeave",

                        onQssSettingAltered:   "{quickSetStripList}.events.onSettingAltered"
                    }
                }
            }
        }
    });


    /**
     * Find a setting in a list of settings and update it. Settings are identified by their
     * `path` property which is expected to be existent and unique.
     *
     * @param {Component} that - The component containing `settings` in its model
     * @param {Object} settingNewState - The new state of the setting
     * @param {String} settingNewState.path - The path of the setting. This field is required.
     */
    gpii.qss.updateSetting = function (that, settingNewState) {
        var settingIndex = that.model.settings.findIndex(function (setting) {
            return setting.path === settingNewState.path;
        });

        that.applier.change("settings." + settingIndex, settingNewState, null, "settingUpdate");
    };

    gpii.qss.onTabPressed = function (that, KeyboardEvent) {
        if (KeyboardEvent.shiftKey) {
            that.focusNext();
        } else {
            that.focusPrevious();
        }
    };

    gpii.qss.getSettingIndex = function (settings, setting) {
        return settings.findIndex(function (currentSetting) {
            return currentSetting.path === setting.path;
        });
    };

    gpii.qss.onQssOpen = function (qssList, settings, params) {
        // Focus the first element (in the presentation order) if the QSS is
        // opened using the global shortcut.
        if (params.shortcut) {
            var keyOutBtnIndex = settings.length - 1;
            qssList.events.onButtonFocusRequired.fire(keyOutBtnIndex);
            return;
        }

        // Focus a button corresponding to a given setting or the previous or
        // following button depending on the activation parameters.
        if (params.setting) {
            var settingIndex = gpii.qss.getSettingIndex(settings, params.setting);

            if (params.key === "ArrowLeft") {
                settingIndex = gpii.psp.modulo(settingIndex - 1, settings.length);
            } else if (params.key === "ArrowRight") {
                settingIndex = gpii.psp.modulo(settingIndex + 1, settings.length);
            }

            qssList.events.onButtonFocusRequired.fire(settingIndex);
        }
    };
})(fluid);
