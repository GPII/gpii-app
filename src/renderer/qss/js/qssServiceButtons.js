/**
 * QSS service buttons
 *
 * Contains components representing QSS buttons which can be used by the user to perform
 * tasks other than updating his settings (e.g. key in, reset, undo, etc).
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
     * Inherits from `gpii.qss.buttonPresenter` and handles interactions with the "Key in"
     * QSS button.
     */
    fluid.defaults("gpii.qss.keyInButtonPresenter", {
        gradeNames: ["gpii.qss.buttonPresenter"],
        buttonType: "smallButton",
        attrs: {
            "aria-label": "Morphic settings panel"
        },
        invokers: {
            activate: {
                funcName: "gpii.qss.keyInButtonPresenter.activate",
                args: [
                    "{that}",
                    "{list}",
                    "{arguments}.0" // activationParams
                ]
            }
        }
    });

    /**
     * A custom function for handling activation of the "Key in" QSS button. Reuses the generic
     * `notifyButtonActivated` invoker.
     * @param {Component} that - The `gpii.qss.keyInButtonPresenter` instance.
     * @param {Component} qssList - The `gpii.qss.list` instance.
     * @param {Object} activationParams - An object containing parameter's for the activation
     * of the button (e.g. which key was used to activate the button).
     */
    gpii.qss.keyInButtonPresenter.activate = function (that, qssList, activationParams) {
        that.notifyButtonActivated(activationParams);
        qssList.events.onPSPOpen.fire();
    };

    /**
     * Inherits from `gpii.qss.buttonPresenter` and handles interactions with the "Close"
     * QSS button.
     */
    fluid.defaults("gpii.qss.closeButtonPresenter", {
        gradeNames: ["gpii.qss.buttonPresenter"],
        buttonType: "closeButton",
        styles: {
            closeButton: "fl-qss-closeButton"
        },
        invokers: {
            activate: {
                funcName: "gpii.qss.closeButtonPresenter.activate",
                args: [
                    "{that}",
                    "{list}",
                    "{arguments}.0" // activationParams
                ]
            }
        }
    });

    /**
     * A custom function for handling activation of the "Close" QSS button. Reuses the generic
     * `notifyButtonActivated` invoker.
     * @param {Component} that - The `gpii.qss.closeButtonPresenter` instance.
     * @param {Component} qssList - The `gpii.qss.list` instance.
     * @param {Object} activationParams - An object containing parameter's for the activation
     * of the button (e.g. which key was used to activate the button).
     */
    gpii.qss.closeButtonPresenter.activate = function (that, qssList, activationParams) {
        that.notifyButtonActivated(activationParams);
        qssList.events.onQssClosed.fire();
    };

    /**
     * Inherits from `gpii.qss.buttonPresenter` and handles interactions with the "Save"
     * QSS button.
     */
    fluid.defaults("gpii.qss.saveButtonPresenter", {
        gradeNames: ["gpii.qss.buttonPresenter"],
        buttonType: "smallButton",
        model: {
            messages: {
                notification: {
                    keyedOut: null,
                    keyedIn: null
                }
            }
        },
        styles: {
            dimmed: "fl-qss-dimmed"
        },
        modelListeners: {
            "{gpii.qss}.model.isKeyedIn": {
                this: "{that}.container",
                method: "toggleClass",
                args: [
                    "{that}.options.styles.dimmed",
                    "@exapnd:fluid.negate({change}.value)" // dim if not keyed in
                ]
            }
        },
        invokers: {
            activate: {
                funcName: "gpii.qss.saveButtonPresenter.activate",
                args: [
                    "{that}",
                    "{list}",
                    "{gpii.qss}.model.isKeyedIn",
                    "{arguments}.0" // activationParams
                ]
            }
        }
    });

    /**
     * A custom function for handling activation of the "Save" QSS button. Reuses the generic
     * `notifyButtonActivated` invoker.
     * @param {Component} that - The `gpii.qss.saveButtonPresenter` instance.
     * @param {Component} qssList - The `gpii.qss.list` instance.
     * @param {Boolean} isKeyedIn - Whether there is an actual keyed in user. The
     * "noUser" is not considererd an actual user.
     * @param {Object} activationParams - An object containing parameter's for the activation
     * of the button (e.g. which key was used to activate the button).
     */
    gpii.qss.saveButtonPresenter.activate = function (that, qssList, isKeyedIn, activationParams) {
        that.notifyButtonActivated(activationParams);

        var messages = that.model.messages.notification,
            notification = isKeyedIn ? messages.keyedIn : messages.keyedOut;
        qssList.events.onSaveRequired.fire(notification);
    };

    /**
     * Inherits from `gpii.qss.buttonPresenter` and handles interactions with the "More..."
     * QSS button.
     */
    fluid.defaults("gpii.qss.moreButtonPresenter", {
        gradeNames: ["gpii.qss.buttonPresenter"],
        invokers: {
            activate: {
                funcName: "gpii.qss.moreButtonPresenter.activate",
                args: [
                    "{that}",
                    "{list}",
                    "{arguments}.0" // activationParams
                ]
            }
        }
    });

    /**
     * A custom function for handling activation of the "More..." QSS button. Reuses the generic
     * `notifyButtonActivated` invoker.
     * @param {Component} that - The `gpii.qss.moreButtonPresenter` instance.
     * @param {Component} qssList - The `gpii.qss.list` instance.
     * @param {Object} activationParams - An object containing parameter's for the activation
     * of the button (e.g. which key was used to activate the button).
     */
    gpii.qss.moreButtonPresenter.activate = function (that, qssList, activationParams) {
        that.notifyButtonActivated(activationParams);
        qssList.events.onMorePanelRequired.fire();
    };

    /**
     * Inherits from `gpii.qss.buttonPresenter` and handles interactions with the "Undo"
     * QSS button.
     */
    fluid.defaults("gpii.qss.undoButtonPresenter", {
        gradeNames: ["gpii.qss.buttonPresenter", "gpii.qss.changeIndicator"],
        buttonType: "smallButton",
        applyKeyboardHighlight: true,
        listeners: {
            "{list}.events.onUndoIndicatorChanged": {
                func: "{that}.toggleIndicator",
                args: "{arguments}.0" // shouldShow
            }
        },

        invokers: {
            activate: {
                funcName: "gpii.qss.undoButtonPresenter.activate",
                args: [
                    "{that}",
                    "{list}",
                    "{arguments}.0" // activationParams
                ]
            }
        }
    });

    /**
     * A custom function for handling activation of the "Undo" QSS button. Reuses the generic
     * `notifyButtonActivated` invoker.
     * @param {Component} that - The `gpii.qss.undoButtonPresenter` instance.
     * @param {Component} qssList - The `gpii.qss.list` instance.
     * @param {Object} activationParams - An object containing parameter's for the activation
     * of the button (e.g. which key was used to activate the button).
     */
    gpii.qss.undoButtonPresenter.activate = function (that, qssList, activationParams) {
        that.notifyButtonActivated(activationParams);
        qssList.events.onUndoRequired.fire();
    };

    /**
     * Inherits from `gpii.qss.buttonPresenter` and handles interactions with the "Reset All
     * to Standard" QSS button.
     */
    fluid.defaults("gpii.qss.resetAllButtonPresenter", {
        gradeNames: ["gpii.qss.buttonPresenter"],
        buttonType: "smallButton",
        invokers: {
            activate: {
                funcName: "gpii.qss.resetAllButtonPresenter.activate",
                args: [
                    "{that}",
                    "{list}",
                    "{arguments}.0" // activationParams
                ]
            }
        }
    });

    /**
     * A custom function for handling activation of the "Reset All to Standard" QSS button.
     * Reuses the generic `notifyButtonActivated` invoker.
     * @param {Component} that - The `gpii.qss.resetAllButtonPresenter` instance.
     * @param {Component} qssList - The `gpii.qss.list` instance.
     * @param {Object} activationParams - An object containing parameter's for the activation
     * of the button (e.g. which key was used to activate the button).
     */
    gpii.qss.resetAllButtonPresenter.activate = function (that, qssList, activationParams) {
        that.notifyButtonActivated(activationParams);
        qssList.events.onResetAllRequired.fire();
    };
})(fluid);
