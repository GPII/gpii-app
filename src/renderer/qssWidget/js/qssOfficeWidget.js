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
            "onDestroy.visibilityChange": {
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
     * Checks the current states and generates the appropriate command based on the true/false values and the
     * availableCommands list. For example if both states are false is sending the allFalseCommand, if both of
     * them are true is sending the allTrueCommand. And if only one of them is selected then is sending the key
     * of the selected state as a command.
     * @param {Object.<String, Boolean>} states - simple true/false object with the current states
     * @param {Object.<String, String>} availableCommands - a simple list of available commands defined in the model
     * @return {String} - string value of the compiled command
     */
    gpii.qssWidget.office.getCommand = function (states, availableCommands) {
        var selectedStateNames = [],
            defaultCommand = availableCommands.defaultCommand,
            allTrue = availableCommands.allTrueCommand,
            allFalse = availableCommands.allFalseCommand,
            allStates = 0;

        fluid.each(states, function (state, name) {
            if (state) {
                selectedStateNames.push(name);
            }
            allStates++;
        });

        if (selectedStateNames.length === 0) {
            // no option is selected
            return allFalse;
        } else if (selectedStateNames.length === allStates) {
            // all of the options are selected
            return allTrue;
        } else if (selectedStateNames.length === 1) {
            // only one of the options is selected
            // IMPORTANT: returning the name of the option as command
            return selectedStateNames.pop();
        } else {
            // IMPORTANT: we should never got to here
            // but just in case, returning the default command
            return defaultCommand;
        }
    };

    /**
     * Returns states object with the pre-filled keys and values
     * @param {Array} keys - simple true/false object with the current states
     * @param {Boolean} value - true/false state
     * @return {Object.<String, Boolean>} - pre-filled states object
     */
    gpii.qssWidget.office.fillStates = function (keys, value) {
        var filledStates = {};
        fluid.each(keys, function (key) {
            filledStates[key] = value;
        });
        return filledStates;
    };

    /**
     * Returns states object with modified value for the specific key
     * @param {Object.<String, Boolean>} states - the initial states list
     * @param {String} key - the key that we want to modify
     * @param {Boolean} value - true/false state
     * @return {Object.<String, Boolean>} - modified states object
     */
    gpii.qssWidget.office.changeState = function (states, key, value) {
        var newStates = states;
        newStates[key] = value;
        return newStates;
    };

    /**
     * Pre-loads the data in the office.model.states array
     * @param {Component} that - The `gpii.qssWidget.office.presenter` instance.
     * @param {Component} office - The `gpii.qssWidget.office` instance.
     * @param {String} ribbonState - The initial state of ribbons
     */
    gpii.qssWidget.office.loadState = function (that, office) {
        // pre-fills the states of all available schema keys
        var currentValue = office.model.setting.value,
            commands = office.model.availableCommands,
            schemaKeys = office.model.setting.schema.keys;

        if (currentValue === commands.allTrueCommand) {
            // pre-fill the states with true
            office.applier.change("states", gpii.qssWidget.office.fillStates(schemaKeys, true), false, "settingAlter");
        } else if (currentValue === commands.allFalseCommand) {
            // pre-fill the states with false
            office.applier.change("states", gpii.qssWidget.office.fillStates(schemaKeys, false), false, "settingAlter");
        } else {
            // pre-fill the states with false first
            var newStates = gpii.qssWidget.office.fillStates(schemaKeys, false);
            // now change only the selected key using the current value as a key
            office.applier.change("states", gpii.qssWidget.office.changeState(newStates, currentValue, true), false, "settingAlter");
        }

        // checks the required checkboxes
        gpii.qssWidget.office.applyCheckmarks(that, office.model.states);
    };

    /**
     * Adds a checked icon next to a setting option if it is the currently selected one for the setting.
     * @param {Component} that - The `gpii.qssWidget.presenter` instance.
     * @param {Object.<String, Boolean>} states - simple true/false object with the current states
     */
    gpii.qssWidget.office.applyCheckmarks = function (that, states) {
        if (states[that.model.item.key] === true) {
            that.container.attr("aria-checked", true);
        }
    };

    /**
     * Updates the value in the model of the widget's repeater based on the office model's states
     * @param {Component} that - The `gpii.qssWidget.office.presenter` instance.
     * @param {String} key - The key of the current button.
     * @param {jQuery} container - The jQuery object representing the container of the
     * QSS menu widget.
     * @param {Component} office - The `gpii.qssWidget.office` instance.
     * @param {Component} repeater - The `gpii.psp.repeater` instance.
     */
    gpii.qssWidget.office.updateValue = function (that, key, container, office, repeater) {
        // toggle the current state
        var newStates = gpii.qssWidget.office.changeState(office.model.states, key, !office.model.states[key]);

        // apply the change to the state
        office.applier.change("states", newStates, false, "settingAlter");

        // visually checks the selected option
        if (newStates[key]) {
            container.attr("aria-checked", true);
        } else {
            container.removeAttr("aria-checked");
        }

        // applying the value
        var commandToUse = gpii.qssWidget.office.getCommand(newStates, office.model.availableCommands);
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
        $(document).on("visibilityChange.qssOfficeWidget", function () {
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
        $(document).off("visibilityChange.qssOfficeWidget");
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
