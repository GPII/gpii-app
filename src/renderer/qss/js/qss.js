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

        styles: {
            highlighted: "fl-highlighted"
        },

        attrs: {
            role: "button"
        },

        // pass hover item as it is in order to use its position
        // TODO probably use something like https://stackoverflow.com/questions/3234977/using-jquery-how-to-get-click-coordinates-on-the-target-element
        events: {
            onButtonFocus: "{list}.events.onButtonFocus",

            onMouseEnter: "{list}.events.onButtonMouseEnter",
            onMouseLeave: "{list}.events.onButtonMouseLeave",
            onSettingAltered: "{list}.events.onSettingAltered"
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
            "onCreate.addBlurListener": {
                this: "{that}.container",
                method: "on",
                args: ["blur", "{that}.removeHighlight"]
            },

            onButtonFocus: {
                funcName: "gpii.qss.buttonPresenter.focusButton",
                args: [
                    "{that}",
                    "{that}.container",
                    "{arguments}.0" // index
                ]
            },

            // Element interaction events

            onClicked: [{
                func: "{that}.activate"
            }, {
                func: "{that}.removeHighlight"
            }],
            "onArrowLeftPressed.changeFocus": {
                func: "{gpii.qss.list}.changeFocus",
                args: [
                    "{that}.model.index",
                    true
                ]
            },
            "onArrowRightPressed.changeFocus": {
                func: "{gpii.qss.list}.changeFocus",
                args: [
                    "{that}.model.index"
                ]
            },
            "onSpacebarPressed.activate": {
                func: "{that}.activate"
            },
            "onEnterPressed.activate": {
                func: "{that}.activate"
            },
            "onTabPressed.changeFocus": {
                funcName: "gpii.qss.buttonPresenter.onTabPressed",
                args: [
                    "{gpii.qss.list}",
                    "{that}.model.index",
                    "{arguments}.0"
                ]
            }
        },
        invokers: {
            activate: {
                funcName: "gpii.qss.buttonPresenter.activate",
                args: ["{that}", "{that}.container", "{list}"]
            },
            removeHighlight: {
                this: "{that}.container",
                method: "removeClass",
                args: ["{that}.options.styles.highlighted"]
            }
        }
    });

    gpii.qss.buttonPresenter.activate = function (that, container, qssList) {
        var metrics = gpii.qss.getElementMetrics(container),
            setting = that.model.item;
        qssList.events.onButtonClicked.fire(setting, metrics);
    };

    gpii.qss.buttonPresenter.onTabPressed = function (qssList, index, KeyboardEvent) {
        qssList.changeFocus(index, !KeyboardEvent.shiftKey);
    };

    gpii.qss.buttonPresenter.focusButton = function (that, container, index) {
        if (that.model.index === index) {
            container
                .addClass(that.options.styles.highlighted)
                .focus();
        }
    };

    /**
     * Return the metrics of a clicked element. These can be used
     * for positioning. Note that the position is relative to the right.
     *
     * @param {Object} target - The DOM element which
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

    /**
     * Represents the list of qss settings. It renders the settings and listens
     * for events on them.
     */
    fluid.defaults("gpii.qss.list", {
        gradeNames: ["gpii.psp.repeater"],

        dynamicContainerMarkup: {
            container:
                "<div class=\"%containerClass\" tabindex=0>" +
                    "<span class=\"flc-qss-btnLabel fl-qss-btnLabel\"></span>" +
                    "<div class=\"flc-qss-btnCaption fl-qss-btnCaption\"></div>" +
                "</div>",
            containerClassPrefix: "fl-qss-button"
        },

        markup: null,

        events: {
            onButtonFocus: null,

            onButtonClicked: null,
            onButtonMouseEnter: null,
            onButtonMouseLeave: null,

            onSettingAltered: null
        },

        invokers: {
            getHandlerType: {
                funcName: "gpii.qss.list.getHandlerType",
                args: ["{arguments}.0"] // item
            },
            changeFocus: {
                funcName: "gpii.qss.list.changeFocus",
                args: [
                    "{that}",
                    "{that}.model.items",
                    "{arguments}.0", // index
                    "{arguments}.1" // backwards
                ]
            }
        }
    });

    gpii.qss.list.getHandlerType = function (item) {
        if (item.type === "boolean") {
            return "gpii.qss.toggleButtonPresenter";
        }

        if (item.type === "close") {
            return "gpii.qss.closeButtonPresenter";
        }

        return "gpii.qss.buttonPresenter";
    };

    gpii.qss.list.changeFocus = function (that, items, index, backwards) {
        var increment = backwards ? -1 : 1,
            nextIndex = (index + increment) % items.length;

        if (nextIndex < 0) {
            nextIndex += items.length;
        }

        that.events.onButtonFocus.fire(nextIndex);
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
                        onQssClosed: "{qss}.events.onQssClosed",
                        onQssButtonClicked:    "{quickSetStripList}.events.onButtonClicked",
                        onQssButtonMouseEnter: "{quickSetStripList}.events.onButtonMouseEnter",
                        onQssButtonMouseLeave: "{quickSetStripList}.events.onButtonMouseLeave",

                        onQssSettingAltered: "{quickSetStripList}.events.onSettingAltered"
                    }
                }
            }
        },

        listeners: {
            "onCreate.disableTabKey": {
                funcName: "gpii.qss.disableTabKey"
            },
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

    gpii.qss.disableTabKey = function () {
        $(document).on("keydown", function (KeyboardEvent) {
            if (KeyboardEvent.key === "Tab") {
                KeyboardEvent.preventDefault();
            }
        });
    };

    gpii.qss.onQssOpen = function (qssList, settings, params) {
        if (params.shortcut) {
            var keyOutBtnIndex = settings.length - 1;
            qssList.events.onButtonFocus.fire(keyOutBtnIndex);
        }
    };
})(fluid);
