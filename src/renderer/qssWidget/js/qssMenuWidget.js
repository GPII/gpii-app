/**
 * The quick set strip widget
 *
 * Represents the quick set strip stepper widget. It is used for
 * incrementing/decrementing a setting.
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

    fluid.defaults("gpii.qssWidget.menu", {
        gradeNames: ["fluid.viewComponent", "gpii.psp.selectorsTextRenderer"],
        model: {
            disabled: false,
            setting: {},
            messages: {
                tipTitle: "To Choose Setting Options",
                tipSubtitle: "Use mouse or Up/Down arrow keys, then press Enter to select."
            }
        },
        modelListeners: {
            setting: {
                func: "{channelNotifier}.events.onQssSettingAltered.fire",
                args: ["{change}.value"]
            }
        },
        selectors: {
            menuControls: ".flc-qssMenuWidget-controls",
            tipTitle: ".flc-tipTitle",
            tipSubtitle: ".flc-tipSubtitle"
        },
        activationParams: {},
        closeDelay: 1200,
        components: {
            titlebar: {
                type: "gpii.psp.titlebar",
                container: ".flc-titlebar",
                options: {
                    model: {
                        messages: {
                            title: "{menu}.model.setting.label"
                        }
                    },
                    events: {
                        onClose: "{channelNotifier}.events.onQssWidgetClosed"
                    }
                }
            },
            focusManager: {
                type: "gpii.qss.verticalFocusManager",
                container: "{menu}.container"
            },
            repeater: {
                // TODO Perhaps add "createOnEvent" so that the component can be recreated
                // whenever the setting changes (e.g. if the change is made via the PSP)
                type: "gpii.psp.repeater",
                container: "{menu}.dom.menuControls",
                options: {
                    model: {
                        disabled: "{menu}.model.disabled",
                        items: "{menu}.model.setting.enum",
                        value: "{menu}.model.setting.value"
                    },
                    dynamicContainerMarkup: {
                        container: "<div role=\"radio\" class=\"%containerClass fl-qssWidgetMenu-item fl-focusable\" tabindex=\"0\"></div>",
                        containerClassPrefix: "flc-qssWidgetMenu-item"
                    },
                    handlerType: "gpii.qssWidget.menu.presenter",
                    markup: null,
                    styles: {
                        disabled: "disabled"
                    },
                    events: {
                        onItemFocus: null
                    },
                    invokers: {
                        updateValue: {
                            funcName: "gpii.qssWidget.menu.updateValue",
                            args: [
                                "{that}",
                                "{menu}",
                                "{that}.container",
                                "{arguments}.0" // value
                            ]
                        },
                        changeFocus: {
                            funcName: "gpii.qssWidget.menu.changeFocus",
                            args: [
                                "{that}",
                                "{that}.model.items",
                                "{arguments}.0", // index
                                "{arguments}.1" // backwards
                            ]
                        }
                    },
                    listeners: {
                        "onCreate.enable": {
                            this: "{that}.container",
                            method: "removeClass",
                            args: ["{that}.options.styles.disabled"]
                        },
                        "onCreate.processParams": {
                            funcName: "gpii.qssWidget.menu.processParams",
                            args: ["{that}", "{menu}.options.activationParams"]
                        }
                    }
                }
            }
        },
        invokers: {
            close: {
                funcName: "gpii.qssWidget.menu.close",
                args: ["{that}", "{channelNotifier}"]
            }
        }
    });

    gpii.qssWidget.menu.processParams = function (that, activationParams) {
        var items = that.model.items;

        if (activationParams.key === "ArrowUp") {
            that.events.onItemFocus.fire(items.length - 1);
        } else if (activationParams.key === "ArrowDown") {
            that.events.onItemFocus.fire(0);
        }
    };

    gpii.qssWidget.menu.changeFocus = function (that, items, index, backwards) {
        var increment = backwards ? -1 : 1,
            nextIndex = (index + increment) % items.length;

        if (nextIndex < 0) {
            nextIndex += items.length;
        }

        that.events.onItemFocus.fire(nextIndex);
    };

    gpii.qssWidget.menu.updateValue = function (that, menu, container, value) {
        if (!that.model.disabled && that.model.value !== value) {
            that.applier.change("value", value, null, "settingAlter");

            // Disable interactions with the window as it is about to close
            that.applier.change("disabled", true);
            container.addClass(that.options.styles.disabled);

            menu.close();
        }
    };

    gpii.qssWidget.menu.close = function (that, channelNotifier) {
        setTimeout(function () {
            channelNotifier.events.onQssWidgetClosed.fire();
        }, that.options.closeDelay);
    };

    fluid.defaults("gpii.qssWidget.menu.presenter", {
        gradeNames: ["fluid.viewComponent", "gpii.qss.elementRepeater.keyListener"],
        model: {
            item: null
        },
        styles: {
            active: "active"
        },
        modelListeners: {
            item: {
                this: "{that}.container",
                method: "text",
                args: ["{change}.value"]
            },
            "{repeater}.model.value": [{
                funcName: "gpii.qssWidget.menu.presenter.toggleCheckmark",
                args: ["{change}.value", "{that}.model.item", "{that}.container"]
            }, {
                funcName: "gpii.qssWidget.menu.presenter.animateActivation",
                args: ["{change}.value", "{that}.model.item", "{that}.container", "{that}.options.styles"],
                includeSource: "settingAlter"
            }]
        },
        events: {
            onItemFocus: "{repeater}.events.onItemFocus",
            onSpacebarPressed: null,
            onEnterPressed: null,
            onArrowUpPressed: null,
            onArrowDownPressed: null
        },
        listeners: {
            "onCreate.addClickHandler": {
                this: "{that}.container",
                method: "click",
                args: "{that}.activate"
            },
            onItemFocus: {
                funcName: "gpii.qssWidget.menu.presenter.focusItem",
                args: [
                    "{that}",
                    "{that}.container",
                    "{arguments}.0" // index
                ]
            },
            onSpacebarPressed: "{that}.activate()",
            onEnterPressed: "{that}.activate()",
            onArrowUpPressed: {
                func: "{repeater}.changeFocus",
                args: [
                    "{that}.model.index",
                    true
                ]
            },
            onArrowDownPressed: {
                func: "{repeater}.changeFocus",
                args: [
                    "{that}.model.index"
                ]
            }
        },
        invokers: {
            activate: {
                func: "{repeater}.updateValue",
                args: ["{that}.model.item"]
            }
        }
    });

    gpii.qssWidget.menu.presenter.focusItem = function (that, container, index) {
        if (that.model.index === index) {
            container.focus();
        }
    };

    gpii.qssWidget.menu.presenter.toggleCheckmark = function (value, item, container) {
        container.attr("aria-checked", item === value);
    };

    gpii.qssWidget.menu.presenter.animateActivation = function (value, item, container, styles) {
        container.toggleClass(styles.active, item === value);
    };
})(fluid);
