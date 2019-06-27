/**
 * The QSS Office Simplification widget
 *
 * Represents the QSS menu widget which is used for adjust MS Office Ribbons that have a list
 * of predefined values.
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
     * Represents the QSS MS Office simplification widget.
     */
    fluid.defaults("gpii.qssWidget.office", {
        gradeNames: ["fluid.viewComponent", "gpii.psp.heightObservable", "gpii.psp.selectorsTextRenderer"],
        model: {
            disabled: false,
            states: {},
            availableCommands: {
                defaultCommand: "StandardSet",
                allTrueCommand: "Basics+Essentials+StandardSet",
                allFalseCommand: "StandardSet"
            },
            setting: {},
            messages: {
                footerTip: "{that}.model.setting.widget.footerTip"
            }
        },
        modelListeners: {
            setting: {
                func: "{channelNotifier}.events.onQssWidgetSettingAltered.fire",
                args: ["{change}.value"],
                includeSource: "settingAlter"
            }
        },
        selectors: {
            heightListenerContainer: ".flc-qssOfficeWidget-controls",
            menuControlsWrapper: ".flc-qssOfficeWidget-controlsWrapper",
            menuControls: ".flc-qssOfficeWidget-controls",
            footerTip: ".flc-qssMenuWidget-footerTip"
        },
        enableRichText: true,
        activationParams: {},
        closeDelay: 1200,
        components: {
            repeater: {
                type: "gpii.psp.repeater",
                container: "{office}.dom.menuControls",
                options: {
                    model: {
                        disabled: "{office}.model.disabled",
                        value: "{office}.model.setting.value",
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
     * TODO: getCommand: remove TODO when ready
     * {Object} states - simple true/false object with the current states
     * {Object} availableCommands - a simple list of available commands defined in the model
     */
    gpii.qssWidget.office.getCommand = function (states, availableCommands) {
        var stateNames = [],
            defaultCommand = availableCommands.defaultCommand,
            resetCommand = availableCommands.resetCommand,
            allTrue = availableCommands.allTrueCommand,
            allFalse = availableCommands.allFalseCommand,
            allStates = 0;

        fluid.each(states, function (state, name) {
            if (name !== resetCommand) {
                if (state === true) {
                    stateNames.push(name);
                }
                allStates++;
            }
        });

        if (stateNames.length === 0) {
            // no option is selected
            return allFalse;
        } else if (stateNames.length === allStates) {
            // all of the options are selected
            return allTrue;
        } else if (stateNames.length === 1) {
            // only one of the options is selected
            // IMPORTANT: returning the name of the option as command
            return stateNames.pop();
        } else {
            // IMPORTANT: we should never got to here
            // but just in case, returning the default command
            return defaultCommand;
        }
    };

    /**
     * Pre-loads the data in the office.model.states array
     * @param {Component} that - The `gpii.qssWidget.office.presenter` instance.
     * @param {Component} office - The `gpii.qssWidget.office` instance.
     * @param {String} ribbonState - The initial state of ribbons
     */
    gpii.qssWidget.office.loadState = function (that, office) {
        // pre-fills the states of all available schema keys
        if (office.model.setting.value === office.model.availableCommands.allTrueCommand) {
            fluid.each(office.model.setting.schema.keys, function (key) {
                if (key !== office.model.availableCommands.resetCommand) {
                    office.model.states[key] = true;
                }
            });
        } else if (office.model.setting.value === office.model.availableCommands.allFalseCommand) {
            fluid.each(office.model.setting.schema.keys, function (key) {
                if (key !== office.model.availableCommands.resetCommand) {
                    office.model.states[key] = false;
                }
            });
        } else {
            fluid.each(office.model.setting.schema.keys, function (key) {
                if (key === office.model.setting.value && key !== office.model.availableCommands.resetCommand) {
                    office.model.states[key] = true;
                }
            });
        }

        // // checks the checkboxes if needed
        gpii.qssWidget.office.applyCheckmarks(that, office.model.states) ;

    };

    /** TODO: applyCheckmarks: remove TODO when ready
     * Adds a checked icon next to a setting option if it is the currently selected one for the setting.
     * @param {Component} that - The `gpii.qssWidget.presenter` instance.
     * @param {Component} office - The `gpii.qssWidget.office` instance.
     */
    gpii.qssWidget.office.applyCheckmarks = function (that, states) {
        console.log(states);
        if (states[that.model.item.key] === true) {
            that.container.attr("aria-checked", true);
        }
    };

    gpii.qssWidget.office.updateValue = function (that, key, item, container, office, repeater) {

        // toggle the current state
        office.model.states[key] = !office.model.states[key];

        // visually checks the selected option
        if (office.model.states[key] === true) {
            container.attr("aria-checked", item.key === key);
        } else {
            container.removeAttr("aria-checked");
        }

        var commandToUse = gpii.qssWidget.office.getCommand(office.model.states, office.model.availableCommands);

        // applying the value
        repeater.applier.change("value", commandToUse, null, "settingAlter");
    };

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
            "onCreate.loadState": {
                funcName: "gpii.qssWidget.office.loadState",
                args: [
                    "{that}",
                    "{office}"
                ]
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
                funcName: "gpii.qssWidget.office.updateValue",
                args: [
                    "{that}",
                    "{that}.model.item.key",
                    "{that}.model.item",
                    "{that}.container",
                    "{office}",
                    "{repeater}"
                ]
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
})(fluid);
