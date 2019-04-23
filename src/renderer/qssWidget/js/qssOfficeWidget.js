/**
 * The QSS Office Simplification widget
 *
 * TO DO
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
     * Represents the QSS MS Office simplification widget.
     */
    fluid.defaults("gpii.qssWidget.office", {
        gradeNames: ["fluid.viewComponent", "gpii.psp.heightObservable", "gpii.psp.selectorsTextRenderer"],
        model: {
            disabled: false,
            states: {},
            setting: {}
        },
        selectors: {
            heightListenerContainer: ".flc-qssOfficeWidget-controls",
            menuControlsWrapper: ".flc-qssOfficeWidget-controlsWrapper",
            menuControls: ".flc-qssOfficeWidget-controls"
        },
        enableRichText: true,
        activationParams: {},
        closeDelay: 1200,
        components: {
            repeater: {
                // TODO Perhaps add "createOnEvent" so that the component can be recreated
                // whenever the setting changes (e.g. if the change is made via the PSP)
                type: "gpii.psp.repeater",
                container: "{office}.dom.menuControls",
                options: {
                    model: {
                        disabled: "{office}.model.disabled",
                        // value: "{office}.model.setting.value",
                        styles: "{office}.model.setting.styles"
                    },
                    modelRelay: {
                        items: {
                            target: "items",
                            singleTransform: {
                                type: "fluid.transforms.free",
                                func: "gpii.qssWidget.office.getRepeaterItems",
                                args: [
                                    "{office}.model.setting"
                                ]
                            }
                        }
                    },
                    dynamicContainerMarkup: {
                        container: "<div role=\"radio\" class=\"%containerClass fl-qssWidgetMenu-item fl-focusable\" tabindex=\"0\"></div>",
                        containerClassPrefix: "flc-qssWidgetMenu-item"
                    },
                    handlerType: "gpii.qssWidget.office.presenter",
                    markup: null,
                    styles: {
                        disabled: "disabled"
                    },
                    events: {
                        onItemFocus: null
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
                            args: ["{office}.keyboardEvent"]
                        }
                    }
                }
            }
        },
        listeners: {
            "onCreate.visibilityChange": {
                funcName: "gpii.qssWidget.office.addVisibilityChangeListener",
                args: ["{closeTimer}"]
            },
            "onCreate.loadState" : {
                funcName: "gpii.qssWidget.office.loadState",
                args: ["{that}"]
            },
            "onDestroy.visibilitychange": {
                funcName: "gpii.qssWidget.office.removeVisibilityChangeListener"
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
                funcName: "gpii.qssWidget.office.close",
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
     * @param {Component} that - The `gpii.qssWidget.office` instance.
     * @param {Component} closeTimer - An instance of `gpii.app.timer` used for closing
     * the widget with a delay.
     * @param {KeyboardEvent} keyboardEvent - The keyboard event (if any) that led to the
     * change in the setting's value.
     */
    gpii.qssWidget.office.close = function (that, closeTimer, keyboardEvent) {
        that.keyboardEvent = keyboardEvent;
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
    gpii.qssWidget.office.addVisibilityChangeListener = function (closeTimer) {
        $(document).on("visibilitychange.qssOfficeWidget", function () {
            if (document.visibilityState === "hidden") {
                closeTimer.clear();
            }
        });
    };

    /**
     * Removes the listener for clearing the `closeTimer`. Useful when the component is
     * destroyed.
     */
    gpii.qssWidget.office.removeVisibilityChangeListener = function () {
        $(document).off("visibilitychange.qssOfficeWidget");
    };

    /**
     * Creates an array of possible values for the given setting to be provided to the
     * `gpii.psp.repeater` instance.
     * @param {Object} setting - the current setting for the QSS menu.
     * @return {Object[]} - An array of key-value pairs describing the key and the value
     * (the visible name) of the setting.
     */
    gpii.qssWidget.office.getRepeaterItems = function (setting) {
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
     * TODO
     */
    gpii.qssWidget.office.loadState = function (that) {
        fluid.each(that.model.setting.schema.keys, function (key) {
            console.log(key);
            that.model.states[key] = false;
        });
    };

    /**
     * A handler for the `repeater` instance in the QSS widget menu. Takes care of rendering
     * a particular setting option and handling user interaction.
     */
    fluid.defaults("gpii.qssWidget.office.presenter", {
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
            }
        },
        events: {
            onItemFocus: "{repeater}.events.onItemFocus"
        },
        listeners: {
            "onCreate.applyStyles": {
                funcName: "gpii.qssWidget.office.presenter.applyStyles",
                args: ["{that}", "{that}.container", "{repeater}.model.styles"]
            },
            "onCreate.applyCheckmark": {
                funcName: "gpii.qssWidget.office.presenter.applyCheckmark",
                args: ["{that}.model.item.key", "{that}.model.item", "{that}.container", "{office}"]
            },
            onItemFocus: {
                funcName: "gpii.qssWidget.office.presenter.focusItem",
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
                funcName: "gpii.qssWidget.office.presenter.toggleCheckmark",
                args: ["{that}.model.item.key", "{that}.model.item", "{that}.container", "{office}"]
            }
        }
    });

    /**
     * Focuses the current QSS menu option if its index matches the specified `index` parameter.
     * @param {Component} that - The `gpii.qssWidget.office.presenter` instance.
     * @param {focusManager} focusManager - The `gpii.qss.focusManager` instance. for the QSS.
     * @param {jQuery} container - A jQuery object representing the setting option's container.
     * @param {Number} index - The index of the setting option to be focused.
     */
    gpii.qssWidget.office.presenter.focusItem = function (that, focusManager, container, index) {
        if (that.model.index === index) {
            focusManager.focusElement(container, true);
        }
    };

    /**
     * TODO
     */
    gpii.qssWidget.office.getCommand = function (states) {
        var stateNames = [],
            defaultCase = "standard",
            allTrue = "both",
            allFalse = "standard",
            allStates = 0;

        fluid.each(states, function (state, name) {
            if (state === true) {
                stateNames.push(name);
            }
            allStates++;
        });
        console.log("length: ", stateNames.length, allStates);
        if (stateNames.length === 0) {
            return allFalse;
        } else if (stateNames.length === allStates) {
            return allTrue;
        } else if (stateNames.length === 1) {
            return stateNames.pop();
        } else {
            return defaultCase;
        }
    };

    /** TODO
     * Adds a checkmark next to a setting option if it is the currently selected one for the setting.
     * @param {String} key - The `key` of the selected setting option.
     * @param {Object} item - The current setting option.
     * @param {jQuery} container - A jQuery object representing the setting option's container.
     */
    gpii.qssWidget.office.presenter.applyCheckmark = function (key, item, container, that) {

        console.log("key: ", key);
        console.log("item: ", item);
        console.log("that.model.states: ", that.model.setting.schema.keys);
        if (that.model.states[key] === true) {
            container.attr("aria-checked", item.key === key);
        }
    };

    /** TODO
     * Adds a checkmark next to a setting option if it is the currently selected one for the setting.
     * @param {String} key - The `key` of the selected setting option.
     * @param {Object} item - The current setting option.
     * @param {jQuery} container - A jQuery object representing the setting option's container.
     */
    gpii.qssWidget.office.presenter.toggleCheckmark = function (key, item, container, that) {

        that.model.states[key] = !that.model.states[key];

        // console.log("key: ", key);
        // console.log("item: ", item);
        // console.log("that: ", that.model.states);
        if (that.model.states[key] === true) {
            container.attr("aria-checked", item.key === key);
        } else {
            container.removeAttr("aria-checked");
        }

        console.log("getCommand: ", gpii.qssWidget.office.getCommand(that.model.states));
    };

    /**
     * Applies any predefined styles for the particular setting option.
     * @param {Component} that - The `gpii.qssWidget.office.presenter` instance.
     * @param {jQuery} container - A jQuery object representing the setting option's container.
     * @param {Object} styles - The styles for the current QSS menu setting.
     */
    gpii.qssWidget.office.presenter.applyStyles = function (that, container, styles) {
        var elementStyles = fluid.get(styles, that.model.item.key);
        if (elementStyles) {
            container.css(elementStyles);
        }
    };
    /**
     * Adds an attribute property for the default setting value.
     * @param {String} key - The `key` of the setting option.
     * @param {Object} item - The default value from the settings.
     * @param {jQuery} container - A jQuery object representing the setting option's container.
     * @param {Object} styles - An object containing useful predefined CSS classes.
     */
    // gpii.qssWidget.office.presenter.defaultValue = function (key, item, container, styles) {
    //     if (key === item) {
    //         container.addClass(styles["default"]);
    //     }
    // };
})(fluid);
