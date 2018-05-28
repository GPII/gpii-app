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
            value: {
                funcName: "{that}.events.onSettingAltered.fire",
                args: ["{that}.model.item", "{change}.value"],
                excludeSource: "init"
            }
        },

        selectors: {
            label: ".flc-qss-btnLabel",
            caption: ".flc-qss-btnCaption"
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

            onButtonFocus: "{gpii.qss.list}.events.onButtonFocus",
            onSettingAltered: "{gpii.qss.list}.events.onSettingAltered"
        },

        listeners: {
            "onCreate.addAttrs": {
                "this": "{that}.container",
                method: "attr",
                args: ["{that}.options.attrs"]
            },
            "onCreate.renderLabel": {
                this: "{that}.dom.label",
                method: "text",
                args: ["{that}.model.item.label"]
            },

            "{focusManager}.events.onElementFocused": {
                funcName: "gpii.qss.buttonPresenter.notifyButtonFocused",
                args: [
                    "{that}",
                    "{that}.container",
                    "{arguments}.0"     // element
                ]
            },

            onButtonFocus: {
                funcName: "gpii.qss.buttonPresenter.focusButton",
                args: [
                    "{that}",
                    "{focusManager}",
                    "{that}.container",
                    "{arguments}.0" // index
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
                // TODO is this needed?
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

    gpii.qss.buttonPresenter.activate = function (that, container, qssList, activationParams) {
        var metrics = gpii.qss.getElementMetrics(container),
            setting = that.model.item;
        qssList.events.onButtonClicked.fire(setting, metrics, activationParams);
    };

    gpii.qss.buttonPresenter.notifyButtonFocused = function (that, container, focusedElement) {
        if (container.is(focusedElement)) {
            // TODO generalize this behaviour with the other container related events
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
        target = $(target);
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
                divisibleBy: "{that}.model.item.divisibleBy",
                min:         "{that}.model.item.min",
                max:         "{that}.model.item.max"
            }
        },


        listeners: {
            onArrowUpPressed: [{
                func: "{that}.increment"
            }, {
                func: "{that}.activateBtn"
            }],
            onArrowDownPressed: [{
                func: "{that}.decrement"
            }, {
                func: "{that}.activateBtn"
            }]
        },

        invokers: {
            activateBtn: {
                funcName: "gpii.qssWidget.stepper.activateButton",
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
                    "<span class=\"flc-qss-btnLabel fl-qss-btnLabel\"></span>" +
                    "<div class=\"flc-qss-btnCaption fl-qss-btnCaption\"></div>" +
                "</div>",
            containerClassPrefix: "fl-qss-button"
        },
        markup: null,

        events: {
            onButtonFocus: null,

            onButtonFocused: null,
            onButtonClicked: null,
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
        switch (item.type) {
        case "boolean":
            return "gpii.qss.toggleButtonPresenter";
        case "number":
            return "gpii.qss.stepperButtonPresenter";
        case "array":
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
            onQssClosed: null
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
                container: "{qss}.container"
            },
            channelListener: {
                type: "gpii.psp.channelListener",
                options: {
                    events: {
                        // Add events from the main process to be listened for
                        onQssOpen: "{qss}.events.onQssOpen",
                        onSettingUpdated: null
                    },
                    // XXX dev
                    listeners: {
                        onSettingUpdated: {
                            funcName: "console.log",
                            args: ["Settings updated: ", "{arguments}.0"]
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
                        onQssButtonClicked:    "{quickSetStripList}.events.onButtonClicked",
                        onQssButtonMouseEnter: "{quickSetStripList}.events.onButtonMouseEnter",
                        onQssButtonMouseLeave: "{quickSetStripList}.events.onButtonMouseLeave",

                        onQssSettingAltered:   "{quickSetStripList}.events.onSettingAltered"
                    }
                }
            }
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
        }
    });

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
            qssList.events.onButtonFocus.fire(keyOutBtnIndex);
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

            qssList.events.onButtonFocus.fire(settingIndex);
        }
    };
})(fluid);
