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

    /**
     * An instance of `gpii.app.keyListener` which specified all key
     * events in which the QSS is interested.
     */
    fluid.defaults("gpii.qss.qssKeyListener", {
        gradeNames: "gpii.app.keyListener",

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
     * A component that handles interactions with a single QSS button. It is responsible
     * for applying the necessary changes whenever the component is focused or activated,
     * for firing the corresponding events when the button is hovered or no longer hovered,
     * for changing its label if there is a keyed in user, etc.
     */
    fluid.defaults("gpii.qss.buttonPresenter", {
        gradeNames: [
            "gpii.qss.qssKeyListener",
            "gpii.app.hoverable",
            "gpii.app.clickable",
            "fluid.viewComponent"
        ],

        model: {
            item: {
                value: null
            },
            value: "{that}.model.item.value",
            messages: {
                notification: null
            }
        },

        modelRelay: {
            title: {
                target: "title",
                singleTransform: {
                    type: "fluid.transforms.free",
                    func: "gpii.qss.buttonPresenter.getTitle",
                    args: [
                        "{gpii.qss}.model.isKeyedIn",
                        "{that}.model.item.schema.title"
                    ]
                }
            }
        },

        modelListeners: {
            value: [{
                funcName: "{that}.events.onSettingAltered.fire",
                args: ["{that}.model.item", "{change}.value"],
                excludeSource: ["init", "gpii.psp.repeater.itemUpdate"]
            }, {
                funcName: "gpii.qss.buttonPresenter.showNotification",
                args: ["{that}", "{list}"],
                excludeSource: "init"
            }],
            title: {
                this: "{that}.dom.title",
                method: "text",
                args: ["{change}.value"]
            }
        },

        selectors: {
            title: ".flc-qss-btnLabel",
            image: ".flc-qss-btnImage",
            caption: ".flc-qss-btnCaption",
            changeIndicator: ".flc-qss-btnChangeIndicator"
        },

        styles: {
            activated: "fl-activated"
        },

        attrs: {
            role: "button"
        },

        // whether the button should be highlighted if activated via keyboard
        applyKeyboardHighlight: false,

        events: {
            onMouseEnter: null,
            onMouseLeave: null,
            onButtonFocused: "{gpii.qss.list}.events.onButtonFocused",
            onQssWidgetToggled: "{gpii.qss}.events.onQssWidgetToggled",

            onButtonFocusRequired: "{gpii.qss.list}.events.onButtonFocusRequired",
            onSettingAltered: "{gpii.qss.list}.events.onSettingAltered"
        },

        listeners: {
            "onCreate.addAttrs": {
                "this": "{that}.container",
                method: "attr",
                args: ["{that}.options.attrs"]
            },
            "onCreate.renderImage": {
                funcName: "gpii.qss.buttonPresenter.renderImage",
                args: ["{that}", "{that}.dom.image"]
            },

            "{focusManager}.events.onElementFocused": {
                funcName: "gpii.qss.buttonPresenter.notifyButtonFocused",
                args: [
                    "{that}",
                    "{that}.container",
                    "{arguments}.0" // focusedElement
                ]
            },

            onButtonFocusRequired: {
                funcName: "gpii.qss.buttonPresenter.focusButton",
                args: [
                    "{that}",
                    "{focusManager}",
                    "{that}.container",
                    "{arguments}.0", // index
                    "{arguments}.1" // applyHighlight
                ]
            },
            onQssWidgetToggled: {
                funcName: "gpii.qss.buttonPresenter.applyActivatedStyle",
                args: [
                    "{that}",
                    "{that}.container",
                    "{arguments}.0", // setting
                    "{arguments}.1" // isShown
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
                args: [
                    "{that}.model.item",
                    "@expand:gpii.qss.getElementMetrics({that}.container)"
                ]
            },

            "onClicked.activate": {
                func: "{that}.activate"
            },
            "onSpacebarPressed.activate": {
                func: "{that}.onActivationKeyPressed",
                args: [
                    {key: "Spacebar"}
                ]
            },
            "onEnterPressed.activate": {
                func: "{that}.onActivationKeyPressed",
                args: [
                    {key: "Enter"}
                ]
            }
        },
        invokers: {
            onActivationKeyPressed: {
                funcName: "gpii.qss.buttonPresenter.onActivationKeyPressed",
                args: [
                    "{that}",
                    "{focusManager}",
                    "{that}.container",
                    "{arguments}.0" // activationParams
                ]
            },
            notifyButtonActivated: {
                funcName: "gpii.qss.buttonPresenter.notifyButtonActivated",
                args: [
                    "{that}",
                    "{focusManager}",
                    "{that}.container",
                    "{list}",
                    "{arguments}.0" // activationParams
                ]
            },
            activate: {
                funcName: "gpii.qss.buttonPresenter.activate",
                args: [
                    "{that}",
                    "{arguments}.0" // activationParams
                ]
            }
        }
    });

    /**
     * Returns the title (label) of the button depending on whether there is a
     * currently keyed in user or not. The `title` property in the QSS setting's
     * schema can either be a simple string which is used in both cases or an
     * object with `keyedIn` and `keyedOut` keys in which case their respective
     * values are used in the corresponding cases.
     * @param {Boolean} isKeyedIn - Whether there is an actual keyed in user. The
     * "noUser" is not considererd an actual user.
     * @param {String|Object} title - The `title` property of the setting's schema.
     * @return {String} The title of the button.
     */
    gpii.qss.buttonPresenter.getTitle = function (isKeyedIn, title) {
        return (isKeyedIn ? title.keyedIn : title.keyedOut) || title;
    };

    /**
     * If available in the setting's schema, shows the specified image for the button.
     * @param {Component} that - The `gpii.qss.buttonPresenter` instance.
     * @param {jQuery} imageElem - The jQuery object corresponding to the image of the
     * button.
     */
    gpii.qss.buttonPresenter.renderImage = function (that, imageElem) {
        var image = that.model.item.schema.image;
        if (image) {
            var maskImageValue = fluid.stringTemplate("url(\"%image\")", {
                image: image
            });

            // use a mask image to avoid having 2 different images (one for when the
            // button is activated and one when it is not)
            imageElem.css("mask-image", maskImageValue);
        } else {
            imageElem.hide();
        }
    };

    /**
     * Invoked when a button is activated using the Spacebar or Enter key. Some QSS buttons
     * can also be activated using ArrowUp or ArrowDown keys in which case this function is
     * also invoked. Only if the QSS button has a keyboard highlight will it be actually
     * activated.
     * @param {Component} that - The `gpii.qss.buttonPresenter` instance.
     * @param {focusManager} focusManager - The `gpii.qss.focusManager` instance for the QSS.
     * @param {jQuery} container - A jQuery object representing the button's container.
     * @param {Object} activationParams - An object containing parameter's for the activation
     * of the button (e.g. which key was used to activate the button).
     */
    gpii.qss.buttonPresenter.onActivationKeyPressed = function (that, focusManager, container, activationParams) {
        if (focusManager.isHighlighted(container)) {
            that.activate(activationParams);
        }
    };

    /**
     * Styles appropriately the button if the QSS widget for that particular button has been
     * shown or hidden.
     * @param {Component} that - The `gpii.qss.buttonPresenter` instance.
     * @param {jQuery} container - A jQuery object representing the button's container.
     * @param {Object} setting - The setting object corresponding to this QSS button.
     * @param {Boolean} isShown - Whether the QSS widget has been shown or hidden.
     */
    gpii.qss.buttonPresenter.applyActivatedStyle = function (that, container, setting, isShown) {
        var activatedClass = that.options.styles.activated;
        container.toggleClass(activatedClass, isShown && that.model.item.path === setting.path);
    };

    /**
     * Fires the appropriate event when the button is activated and manages the button's focus.
     * @param {Component} that - The `gpii.qss.buttonPresenter` instance.
     * @param {focusManager} focusManager - The `gpii.qss.focusManager` instance for the QSS.
     * @param {jQuery} container - A jQuery object representing the button's container.
     * @param {Component} qssList - The `gpii.qss.list` instance.
     * @param {Object} activationParams - An object containing parameter's for the activation
     * of the button (e.g. which key was used to activate the button).
     */
    gpii.qss.buttonPresenter.notifyButtonActivated = function (that, focusManager, container, qssList, activationParams) {
        var metrics = gpii.qss.getElementMetrics(container),
            isKeyPressed = fluid.get(activationParams, "key"),
            applyKeyboardHighlight = that.options.applyKeyboardHighlight;

        focusManager.focusElement(container, isKeyPressed && applyKeyboardHighlight);
        qssList.events.onButtonActivated.fire(that.model.item, metrics, activationParams);
    };

    /**
     * A generic invoker for handling QSS button activation. In its most basic form it simply
     * calls the `notifyButtonActivated`. However, some QSS buttons may need to override this
     * behavior as they may have more complex activation behavior.
     * @param {Component} that - The `gpii.qss.buttonPresenter` instance.
     * @param {Object} activationParams - An object containing parameter's for the activation
     * of the button (e.g. which key was used to activate the button).
     */
    gpii.qss.buttonPresenter.activate = function (that, activationParams) {
        that.notifyButtonActivated(activationParams);
    };

    /**
     * Fires the appropriate event if the `container` for the current button is the element
     * that has been focused by the `focusManager`.
     * @param {Component} that - The `gpii.qss.buttonPresenter` instance.
     * @param {jQuery} container - A jQuery object representing the button's container.
     * @param {jQuery} focusedElement - A jQuery object representing the focused QSS button's
     * container (if any).
     */
    gpii.qss.buttonPresenter.notifyButtonFocused = function (that, container, focusedElement) {
        if (container.is(focusedElement)) {
            that.events.onButtonFocused.fire(
                that.model.item,
                gpii.qss.getElementMetrics(focusedElement));
        }
    };

    /**
     * Focuses the current QSS button if its index among the rest of the QSS buttons coincides
     * with the `index` parameter.
     * @param {Component} that - The `gpii.qss.buttonPresenter` instance.
     * @param {focusManager} focusManager - The `gpii.qss.focusManager` instance for the QSS.
     * @param {jQuery} container - A jQuery object representing the button's container.
     * @param {Number} index - The index of the QSS button to be focused.
     * @param {Boolean} applyHighlight - Whether highlighting should be applied to the QSS
     * button. The latter happens when the element has been focused via the keyboard.
     */
    gpii.qss.buttonPresenter.focusButton = function (that, focusManager, container, index, applyHighlight) {
        if (that.model.index === index) {
            focusManager.focusElement(container, applyHighlight);
        }
    };

    /**
     * When the value of the QSS button's setting changes, fires an event that a notification
     * must be shown to the user.
     * @param {Component} that - The `gpii.qss.buttonPresenter` instance.
     * @param {Component} qssList - The `gpii.qss.list` instance.
     */
    gpii.qss.buttonPresenter.showNotification = function (that, qssList) {
        if (that.model.item.restartWarning) {
            var notification = fluid.stringTemplate(that.model.messages.notification, {
                settingTitle: that.model.item.schema.title
            });
            qssList.events.onNotificationRequired.fire(notification);
        }
    };

    /**
     * Returns the metrics of a given element. These can be used for positioning the QSS
     * button's tooltip or the QSS widget.
     * @param {jQuery} target - The DOM element for which positioning
     * metrics are needed.
     * @return {Object} {{width: Number, height: Number, offsetLeft: Number}}
     */
    gpii.qss.getElementMetrics = function (target) {
        var result = {
            offsetLeft: target.offset().left,
            height:     (target.outerHeight() - 3), // TODO: Think of a better formula.
            width:      (target.outerWidth())
        };

        return result;
    };

    /**
     * Represent a disabled button. These are buttons that cannot be interacted with (event not focusable).
     */
    fluid.defaults("gpii.qss.disabledButtonPresenter", {
        gradeNames: ["gpii.qss.buttonPresenter"],

        styles: {
            disabled: "fl-qss-disabled",
            focusable: "fl-focusable"
        },

        listeners: {
            "onCreate.removeButtonStyles": {
                this: "{that}.container",
                method: "removeClass",
                args: ["{that}.options.styles.focusable"]
            },
            "onCreate.addButtonStyles": {
                this: "{that}.container",
                method: "addClass",
                args: ["{that}.options.styles.disabled"]
            }
        },
        invokers: {
            // Override button activation behaviour
            activate: {
                funcName: "fluid.identity"
            }
        }
    });


    /**
     * Represents a QSS button that can have a LED change indicator in the upper right
     * corner. For setting buttons, the presence of that LED light indicates that if the
     * setting can be undone, its value is different than its default one. If the LED
     * light is shown for the undo button, this means that there are settings changes
     * that can be undone.
     */
    fluid.defaults("gpii.qss.changeIndicator", {
        gradeNames: ["fluid.viewComponent"],

        selectors: {
            changeIndicator: ".flc-qss-btnChangeIndicator"
        },

        invokers: {
            toggleIndicator: {
                this: "{that}.dom.changeIndicator",
                method: "toggle",
                args: [
                    "{arguments}.0" // shouldShow
                ]
            }
        }
    });

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

        styles: {
            settingButton: "fl-qss-settingButton"
        },

        modelListeners: {
            value: {
                funcName: "gpii.qss.settingButtonPresenter.updateChangeIndicator",
                args: ["{that}", "{that}.model.item", "{change}.value"],
                namespace: "changeIndicator"
            }
        },

        listeners: {
            "onCreate.styleButton": {
                this: "{that}.container",
                method: "addClass",
                args: ["{that}.options.styles.settingButton"]
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
     * Inherits from `gpii.qss.buttonPresenter` and handles interactions with the "Key in"
     * QSS button.
     */
    fluid.defaults("gpii.qss.keyInButtonPresenter", {
        gradeNames: ["gpii.qss.buttonPresenter"],
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
     * @param {Component} that - The `gpii.qss.closeButtonPresenter` instance.
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

    /**
     * Inherits from `gpii.qss.buttonPresenter` and handles interactions with the "Save"
     * QSS button.
     */
    fluid.defaults("gpii.qss.saveButtonPresenter", {
        gradeNames: ["gpii.qss.buttonPresenter"],
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

    /**
     * Represents the list of QSS settings. It renders the settings and listens for events
     * triggered by the buttons. The `handlerGrades` hash maps the type of a setting to the
     * gradeName of the handler which will present the corresponding setting button in the
     * QSS. If for a given setting type there is no entry in the `handlerGrades` hash, the
     * the `defaultHandlerGrade` will be used for its presenter.
     */
    fluid.defaults("gpii.qss.list", {
        gradeNames: ["gpii.psp.repeater"],

        defaultHandlerGrade: "gpii.qss.buttonPresenter",
        handlerGrades: {
            "boolean":  "gpii.qss.toggleButtonPresenter",
            "number":   "gpii.qss.widgetButtonPresenter",
            "string":   "gpii.qss.widgetButtonPresenter",
            "close":    "gpii.qss.closeButtonPresenter",
            "psp":      "gpii.qss.keyInButtonPresenter",
            "save":     "gpii.qss.saveButtonPresenter",
            "undo":     "gpii.qss.undoButtonPresenter",
            "resetAll": "gpii.qss.resetAllButtonPresenter",
            "more":     "gpii.qss.moreButtonPresenter",
            "disabled": "gpii.qss.disabledButtonPresenter"
        },

        dynamicContainerMarkup: {
            container:
                "<div class=\"%containerClass fl-focusable\" tabindex=\"0\">" +
                "</div>",
            containerClassPrefix: "fl-qss-button"
        },
        markup: "<div class=\"flc-qss-btnChangeIndicator fl-qss-btnChangeIndicator\"></div>" +
                "<div class=\"flc-qss-btnImage fl-qss-btnImage\"></div>" +
                "<span class=\"flc-qss-btnLabel fl-qss-btnLabel\"></span>" +
                "<div class=\"flc-qss-btnCaption fl-qss-btnCaption\"></div>",

        events: {
            onButtonFocusRequired: null,

            // external events
            onButtonFocused: null,
            onButtonActivated: null,
            onButtonMouseEnter: null,
            onButtonMouseLeave: null,

            onSettingAltered: null,
            onNotificationRequired: null,
            onMorePanelRequired: null,
            onUndoRequired: null,
            onResetAllRequired: null,
            onSaveRequired: null,
            onPSPOpen: null
        },

        invokers: {
            getHandlerType: {
                funcName: "gpii.qss.list.getHandlerType",
                args: [
                    "{that}",
                    "{arguments}.0" // item
                ]
            }
        }
    });

    /**
     * Returns the correct handler type (a grade inheriting from `gpii.qss.buttonPresenter`)
     * for the given setting depending on its type.
     * @param {Component} that - The `gpii.qss.list` instance.
     * @param {Object} setting - The setting for which the handler type is to be determined.
     * @return {String} The grade name of the setting's handler.
     */
    gpii.qss.list.getHandlerType = function (that, setting) {
        var handlerGrades = that.options.handlerGrades,
            settingType = setting.schema.type;

        return handlerGrades[settingType] || that.options.defaultHandlerGrade;
    };

    /**
     * Wrapper that enables internationalization of the `gpii.qss` component and
     * intercepts all anchor tags on the page so that an external browser is used
     * for loading them.
     */
    fluid.defaults("gpii.psp.translatedQss", {
        gradeNames: [
            "gpii.psp.messageBundles",
            "fluid.viewComponent",
            "gpii.psp.linksInterceptor",
            "gpii.psp.baseWindowCmp.signalDialogReady"
        ],

        components: {
            quickSetStrip: {
                type: "gpii.qss",
                container: "{translatedQss}.container",
                options: {
                    model: {
                        settings: "{translatedQss}.model.settings"
                    }
                }
            }
        }
    });

    /**
     * Represents all renderer components of the QSS including the list of settings,
     * the `focusManager` and the channels for communication with the main process.
     */
    fluid.defaults("gpii.qss", {
        gradeNames: ["fluid.viewComponent"],

        model: {
            isKeyedIn: false,
            settings: []
        },

        events: {
            onQssOpen: null,
            onQssClosed: null,
            onQssWidgetToggled: null
        },

        defaultFocusButtonType: "psp",

        listeners: {
            "onQssOpen": {
                funcName: "gpii.qss.onQssOpen",
                args: [
                    "{quickSetStripList}",
                    "{focusManager}",
                    "{that}.model.settings",
                    "{that}.options.defaultFocusButtonType",
                    "{arguments}.0" // params
                ]
            }
        },

        components: {
            quickSetStripList: {
                type: "gpii.qss.list",
                container: "{that}.container",
                options: {
                    model: {
                        items: "{quickSetStrip}.model.settings"
                    },
                    events: {
                        onQssClosed: "{gpii.qss}.events.onQssClosed",
                        onUndoIndicatorChanged: null
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
                        onQssWidgetToggled: "{qss}.events.onQssWidgetToggled",
                        onSettingUpdated: null,
                        onIsKeyedInChanged: null,

                        onUndoIndicatorChanged: "{quickSetStripList}.events.onUndoIndicatorChanged"
                    },
                    listeners: {
                        onSettingUpdated: {
                            funcName: "gpii.qss.updateSetting",
                            args: [
                                "{qss}",
                                "{arguments}.0"
                            ]
                        },
                        onIsKeyedInChanged: {
                            func: "{gpii.qss}.updateIsKeyedIn"
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
                        onQssButtonActivated:  "{quickSetStripList}.events.onButtonActivated",
                        onQssButtonMouseEnter: "{quickSetStripList}.events.onButtonMouseEnter",
                        onQssButtonMouseLeave: "{quickSetStripList}.events.onButtonMouseLeave",

                        onQssSettingAltered:   "{quickSetStripList}.events.onSettingAltered",
                        onQssNotificationRequired: "{quickSetStripList}.events.onNotificationRequired",
                        onQssMorePanelRequired: "{quickSetStripList}.events.onMorePanelRequired",
                        onQssUndoRequired: "{quickSetStripList}.events.onUndoRequired",
                        onQssResetAllRequired: "{quickSetStripList}.events.onResetAllRequired",
                        onQssSaveRequired: "{quickSetStripList}.events.onSaveRequired",
                        onQssPspOpen: "{quickSetStripList}.events.onPSPOpen"
                    }
                }
            }
        },

        invokers: {
            updateIsKeyedIn: {
                changePath: "isKeyedIn",
                value: "{arguments}.0"
            }
        }
    });

    /**
     * Returns the index of the `setting` object in the `settings` array. Settings are identified
     * by their `path` property which is expected to be existent and unique.
     * @param {Object[]} settings - An array of QSS settings.
     * @param {Object} setting - The particular setting whose index is queried.
     * @return {Number} The index of the setting in the specified array or -1 if the setting is not
     * present in the array.
     */
    gpii.qss.getSettingIndex = function (settings, setting) {
        return settings.findIndex(function (currentSetting) {
            return currentSetting.path === setting.path;
        });
    };

    /**
     * Finds a setting in a list of settings and updates it.
     * @param {Component} that - The component containing `settings` in its model
     * @param {Object} settingNewState - The new state of the setting
     * @param {String} settingNewState.path - The path of the setting. This field is required.
     */
    gpii.qss.updateSetting = function (that, settingNewState) {
        var settingIndex = gpii.qss.getSettingIndex(that.model.settings, settingNewState);
        gpii.app.applier.replace(that.applier, "settings." + settingIndex, settingNewState, "channelNotifier.settingUpdate");
    };

    /**
     * Handles opening of the QSS by focusing or removing the focus for the QSS buttons
     * depending on how the QSS was opened (using the keyboard shortcut, by clicking the
     * tray icon, by closing the QSS widget using the left, right arrow keys or the ESC).
     * @param {Component} qssList - The `gpii.qss.list` instance.
     * @param {focusManager} focusManager - The `gpii.qss.focusManager` instance for the QSS.
     * @param {Object[]} settings - An array of QSS settings.
     * @param {String} defaultFocusButtonType - The gradeName of the QSS button which should
     * be focused by default (i.e. when the QSS is opened using the keyboard shortcut).
     * @param {Object} params - An object containing parameter's for the activation
     * of the button (e.g. which key was used to open the QSS).
     */
    gpii.qss.onQssOpen = function (qssList, focusManager, settings, defaultFocusButtonType, params) {
        // Focus the first button of the specified `defaultFocusButtonType` if
        // the QSS is opened using the global shortcut.
        if (params.shortcut) {
            fluid.each(settings, function (setting, settingIndex) {
                if (setting.schema.type === defaultFocusButtonType) {
                    qssList.events.onButtonFocusRequired.fire(settingIndex);
                    return true;
                }
            });
        } else if (params.setting) {
            // Focus a button corresponding to a given setting or the previous or
            // following button depending on the activation parameters.
            var settingIndex = gpii.qss.getSettingIndex(settings, params.setting);

            if (params.key === "ArrowLeft") {
                settingIndex = gpii.psp.modulo(settingIndex - 1, settings.length);
            } else if (params.key === "ArrowRight") {
                settingIndex = gpii.psp.modulo(settingIndex + 1, settings.length);
            }

            qssList.events.onButtonFocusRequired.fire(settingIndex, !!params.key);
        } else {
            focusManager.removeHighlight(true);
        }
    };
})(fluid);
