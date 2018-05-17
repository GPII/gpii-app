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
        gradeNames: ["fluid.viewComponent"],
        model: {
            setting: {}
        },
        modelListeners: {
            setting: {
                func: "{channelNotifier}.events.onQssSettingAltered.fire",
                args: ["{change}.value"]
            }
        },
        selectors: {
            menuWidget: ".flc-qssMenuWidget"
        },
        components: {
            repeater: {
                type: "gpii.psp.repeater",
                container: "{menu}.dom.menuWidget",
                options: {
                    model: {
                        items: "{menu}.model.setting.enum",
                        value: "{menu}.model.setting.value"
                    },
                    dynamicContainerMarkup: {
                        container: "<button class=\"%containerClass\"></button>",
                        containerClassPrefix: "flc-qssWidgetMenu-item"
                    },
                    handlerType: "gpii.qssWidget.menu.presenter",
                    markup: null,
                    invokers: {
                        updateValue: {
                            changePath: "value",
                            value: "{arguments}.0"
                        }
                    }
                }
            }
        }
    });

    fluid.defaults("gpii.qssWidget.menu.presenter", {
        gradeNames: ["fluid.viewComponent"],
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
            "{repeater}.model.value": {
                funcName: "gpii.qssWidget.menu.presenter.applyStyles",
                args: ["{change}.value", "{that}.model.item", "{that}.container", "{that}.options.styles"]
            }
        },
        listeners: {
            "onCreate.addClickHandler": {
                this: "{that}.container",
                method: "click",
                args: "{that}.updateValue"
            }
        },
        invokers: {
            updateValue: {
                func: "{repeater}.updateValue",
                args: ["{that}.model.item"]
            }
        }
    });

    gpii.qssWidget.menu.presenter.applyStyles = function (value, item, container, styles) {
        container.toggleClass(styles.active, item === value);
    };
})(fluid);
