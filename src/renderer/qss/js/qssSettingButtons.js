/**
 * QSS setting buttons
 *
 * Contains components representing QSS buttons which can be used by the user to update
 * his settings.
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
     * In the QSS there are two types of buttons - setting buttons (which this grade
     * describes) are used for altering the value of their corresponding buttons and
     * "system" buttons which have various supplementary functions such as saving the
     * user's preferences, undoing changes made via the QSS, closing the QSS, etc.
     */
    fluid.defaults("gpii.qss.settingButtonPresenter", {
        gradeNames: ["fluid.viewComponent", "gpii.qss.changeIndicator"],

        model: {
            item: {
                value: null
            },
            value: "{that}.model.item.value"
        },

        modelListeners: {
            value: {
                funcName: "gpii.qss.settingButtonPresenter.updateChangeIndicator",
                args: ["{that}", "{that}.model.item", "{change}.value"],
                namespace: "changeIndicator"
            }
        }
    });

    /**
     * Shows or hides the toggle indicator when the setting's value is changed depending
     * on whether the changes to the setting can be undone and whether the new value of
     * the setting is the same as its default one.
     * @param {Component} that - The `gpii.qss.settingButtonPresenter` instance.
     * @param {Object} setting - The setting object corresponding to this QSS button.
     * @param {Any} value - The new value of the `setting`.
     */
    gpii.qss.settingButtonPresenter.updateChangeIndicator = function (that, setting, value) {
        // The dot should be shown if the setting has a default value and the new value of the
        // setting is different from that value.
        var defaultValue = setting.schema["default"],
            shouldShow = fluid.isValue(defaultValue) && !fluid.model.diff(value, defaultValue);
        that.toggleIndicator(shouldShow);
    };

    /**
     * Inherits from `gpii.qss.buttonPresenter` and handles interactions with QSS toggle
     * buttons.
     */
    fluid.defaults("gpii.qss.toggleButtonPresenter", {
        gradeNames: ["gpii.qss.buttonPresenter", "gpii.qss.settingButtonPresenter"],
        model: {
            messages: {
                caption: null
            },
            caption: null
        },
        attrs: {
            role: "switch"
        },
        applyKeyboardHighlight: true,
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
            "onArrowUpPressed.activate": {
                func: "{that}.onActivationKeyPressed",
                args: [
                    {key: "ArrowUp"}
                ]
            },
            "onArrowDownPressed.activate": {
                func: "{that}.onActivationKeyPressed",
                args: [
                    {key: "ArrowDown"}
                ]
            }
        },
        invokers: {
            activate: {
                funcName: "gpii.qss.toggleButtonPresenter.activate",
                args: [
                    "{that}",
                    "{arguments}.0" // activationParams
                ]
            }
        }
    });

    /**
     * Returns the caption of the toggle button that needs to be shown below the button's
     * title in case the state of the button is "on".
     * @param {Boolean} value - The state of the button.
     * @param {Object} messages - An object containing internationalizable messages for
     * this component.
     * @return {String} The caption message for the toggle button.
     */
    gpii.qss.toggleButtonPresenter.getCaption = function (value, messages) {
        return value ? messages.caption : "";
    };

    /**
     * A custom function for handling activation of QSS toggle buttons. Reuses the generic
     * `notifyButtonActivated` invoker.
     * @param {Component} that - The `gpii.qss.toggleButtonPresenter` instance.
     * @param {Object} activationParams - An object containing parameter's for the activation
     * of the button (e.g. which key was used to activate the button).
     */
    gpii.qss.toggleButtonPresenter.activate = function (that, activationParams) {
        that.notifyButtonActivated(activationParams);
        that.applier.change("value", !that.model.value);
    };

    /**
     * Inherits from `gpii.qss.buttonPresenter` and handles interactions with QSS buttons which
     * can have their values changed via the QSS widget.
     */
    fluid.defaults("gpii.qss.widgetButtonPresenter", {
        gradeNames: ["gpii.qss.buttonPresenter", "gpii.qss.settingButtonPresenter"],
        listeners: {
            "onArrowUpPressed.activate": {
                func: "{that}.onActivationKeyPressed",
                args: [
                    {key: "ArrowUp"}
                ]
            },
            "onArrowDownPressed.activate": {
                func: "{that}.onActivationKeyPressed",
                args: [
                    {key: "ArrowDown"}
                ]
            }
        }
    });
})(fluid);
