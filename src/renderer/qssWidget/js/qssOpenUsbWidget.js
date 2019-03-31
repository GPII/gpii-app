/**
 * The QSS Open USB widget
 *
 * TODO
 *
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
     * Represents the QSS USB widget.
     */
    fluid.defaults("gpii.qssWidget.openUSB", {
        gradeNames: ["fluid.viewComponent", "gpii.psp.heightObservable", "gpii.psp.selectorsTextRenderer"],
        model: {
            disabled: false,
            setting: {}
        },
        members: {
            // Holds the last keyboard event received during the "close" operation
            closingKeyboardEvent: null
        },
        selectors: {
            heightListenerContainer: ".flc-qssOpenUSBWidget-controls",
            menuControlsWrapper: ".flc-qssOpenUSBWidget-controlsWrapper",
            menuControls: ".flc-qssOpenUSBWidget-controls"
        },
        enableRichText: true,
        activationParams: {},
        closeDelay: 1200,
        components: {
            repeater: {
                // whenever the setting changes (e.g. if the change is made via the PSP)
                type: "gpii.psp.repeater",
                container: "{openUSB}.dom.menuControls",
                options: {
                    model: {
                        disabled: "{openUSB}.model.disabled",
                        value: "{openUSB}.model.setting.value",
                        styles: "{openUSB}.model.setting.styles"
                    },
                    modelRelay: {
                        items: {
                            target: "items",
                            singleTransform: {
                                type: "fluid.transforms.free",
                                func: "gpii.qssWidget.openUSB.getRepeaterItems",
                                args: [
                                    "{openUSB}.model.setting"
                                ]
                            }
                        }
                    },
                    dynamicContainerMarkup: {
                        container: "<div role=\"radio\" class=\"%containerClass fl-qssWidgetMenu-item fl-focusable\" tabindex=\"0\"></div>",
                        containerClassPrefix: "flc-qssWidgetMenu-item"
                    },
                    handlerType: "gpii.qssWidget.openUSB.presenter",
                    markup: null,
                    styles: {
                        disabled: "disabled"
                    },
                    events: {
                        onItemFocus: null
                    },
                    invokers: {
                        updateValue: {
                            funcName: "fluid.log",
                            args: [
                                "{arguments}.0" // value
                            ]
                        }
                    },
                    listeners: {
                        "onCreate.enable": {
                            this: "{that}.container",
                            method: "removeClass",
                            args: ["{that}.options.styles.disabled"]
                        }
                    }
                }
            },
            closeTimer: {
                type: "gpii.app.timer",
                options: {
                    listeners: {
                        "onTimerFinished.closeWidget": {
                            func: "{qssWidget}.close",
                            args: ["{openUSB}.closingKeyboardEvent"]
                        }
                    }
                }
            }
        },
        listeners: {
            "onCreate.visibilityChange": {
                funcName: "gpii.qssWidget.openUSB.addVisibilityChangeListener",
                args: ["{closeTimer}"]
            },
            "onDestroy.visibilityChange": {
                funcName: "gpii.qssWidget.openUSB.removeVisibilityChangeListener"
            }
        },
        invokers: {
            calculateHeight: {
                funcName: "gpii.qssWidget.calculateHeight",
                args: [
                    "{qssWidget}.container",
                    "{that}.dom.menuControlsWrapper",
                    "{that}.dom.heightListenerContainer"
                ]
            },
            close: {
                funcName: "gpii.qssWidget.openUSB.close",
                args: [
                    "{that}",
                    "{closeTimer}",
                    "{arguments}.0" // keyboardEvent
                ]
            }
        },
        events: {
            onHeightChanged: null
        }
    });

    /**
     * Invoked whenever the user changes the value of the given setting. Schedules that
     * the widget should be closed in `closeDelay` milliseconds.
     * @param {Component} that - The `gpii.qssWidget.menu` instance.
     * @param {Component} closeTimer - An instance of `gpii.app.timer` used for closing
     * the widget with a delay.
     * @param {KeyboardEvent} keyboardEvent - The keyboard event (if any) that led to the
     * change in the setting's value.
     */
    gpii.qssWidget.openUSB.close = function (that, closeTimer, keyboardEvent) {
        that.closingKeyboardEvent = keyboardEvent;
        closeTimer.start(that.options.closeDelay);
    };

    /**
     * Adds a listener which stops the close timer in case the dialog was closed before
     * the timer has finished as a result of another user interaction (e.g. clicking
     * outside of the widget's window or clicking on a different QSS button which opens
     * the QSS widget again).
     * @param {Component} closeTimer - An instance of `gpii.app.timer` used for closing
     * the widget with a delay.
     */
    gpii.qssWidget.openUSB.addVisibilityChangeListener = function (closeTimer) {
        $(document).on("visibilityChange.qssOpenUSBWidget", function () {
            if (document.visibilityState === "hidden") {
                closeTimer.clear();
            }
        });
    };

    /**
     * Removes the listener for clearing the `closeTimer`. Useful when the component is
     * destroyed.
     */
    gpii.qssWidget.openUSB.removeVisibilityChangeListener = function () {
        $(document).off("visibilityChange.qssOpenUSBWidget");
    };

    /**
     * Creates an array of possible values for the given setting to be provided to the
     * `gpii.psp.repeater` instance.
     * @param {Object} setting - the current setting for the QSS menu.
     * @return {Object[]} - An array of key-value pairs describing the key and the value
     * (the visible name) of the setting.
     */
    gpii.qssWidget.openUSB.getRepeaterItems = function (setting) {
        var schema = setting.schema || {},
            values = schema["enum"],
            keys = schema.keys || values;

        return fluid.transform(keys, function (key, index) {
            return {
                key: key,
                value: values[index]
            };
        });
    };

    /**
     * A handler for the `repeater` instance in the QSS widget menu. Takes care of rendering
     * a particular setting option and handling user interaction.
     */
    fluid.defaults("gpii.qssWidget.openUSB.presenter", {
        gradeNames: ["fluid.viewComponent", "gpii.qssWidget.button"],
        model: {
            item: null
        },
        styles: {
            active: "fl-qssWidgetMenu-active",
            default: "fl-qssWidgetMenu-default"
        },
        modelListeners: {
            item: {
                this: "{that}.container",
                method: "text",
                args: ["{that}.model.item.value"]
            },
            "{repeater}.model.value": [{
                funcName: "gpii.qssWidget.openUSB.presenter.animateActivation",
                args: ["{change}.value", "{that}.model.item", "{that}.container", "{that}.options.styles"],
                includeSource: "settingAlter"
            }]
        },
        events: {
            onItemFocus: "{repeater}.events.onItemFocus"
        },
        listeners: {
            "onCreate.applyStyles": {
                funcName: "gpii.qssWidget.openUSB.presenter.applyStyles",
                args: ["{that}", "{that}.container", "{repeater}.model.styles"]
            },
            onItemFocus: {
                funcName: "gpii.qssWidget.openUSB.presenter.focusItem",
                args: [
                    "{that}",
                    "{focusManager}",
                    "{that}.container",
                    "{arguments}.0" // index
                ]
            }
        },
        invokers: {
            activate: {
                func: "{repeater}.updateValue",
                args: [
                    "{that}.model.item.key",
                    "{arguments}.0" // keyboardEvent
                ]
            }
        }
    });

    /**
     * Focuses the current QSS menu option if its index matches the specified `index` parameter.
     * @param {Component} that - The `gpii.qssWidget.menu.presenter` instance.
     * @param {focusManager} focusManager - The `gpii.qss.focusManager` instance. for the QSS.
     * @param {jQuery} container - A jQuery object representing the setting option's container.
     * @param {Number} index - The index of the setting option to be focused.
     */
    gpii.qssWidget.openUSB.presenter.focusItem = function (that, focusManager, container, index) {
        if (that.model.index === index) {
            focusManager.focusElement(container, true);
        }
    };

    /**
     * Applies the necessary CSS classes to the current setting option if it has been just selected
     * by the user to be the new setting value.
     * @param {String} key - The `key` of the selected setting option.
     * @param {Object} item - The current setting option.
     * @param {jQuery} container - A jQuery object representing the setting option's container.
     * @param {Object} styles - An object containing useful predefined CSS classes.
     */
    gpii.qssWidget.openUSB.presenter.animateActivation = function (key, item, container, styles) {
        container.toggleClass(styles.active, item.key === key);
    };

    /**
     * Applies any predefined styles for the particular setting option.
     * @param {Component} that - The `gpii.qssWidget.menu.presenter` instance.
     * @param {jQuery} container - A jQuery object representing the setting option's container.
     * @param {Object} styles - The styles for the current QSS menu setting.
     */
    gpii.qssWidget.openUSB.presenter.applyStyles = function (that, container, styles) {
        var elementStyles = fluid.get(styles, that.model.item.key);
        if (elementStyles) {
            container.css(elementStyles);
        }
    };

})(fluid);
