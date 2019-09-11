/**
 * Generic QSS buttons
 *
 * Contains components representing various generic QSS buttons.
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
            value: "{that}.model.item.value"
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
            value: {
                funcName: "{that}.events.onSettingAltered.fire",
                args: ["{that}.model.item", "{change}.value"],
                excludeSource: ["init", "gpii.psp.repeater.itemUpdate"]
            },
            title: {
                this: "{that}.dom.title",
                method: "text",
                args: ["{change}.value"]
            },
            "item.tabindex": {
                this: "{that}.container",
                method: "attr",
                args: ["tabindex", "{change}.value"]
            }
        },

        selectors: {
            title: ".flc-qss-btnLabel",
            image: ".flc-qss-btnImage",
            caption: ".flc-qss-btnCaption",
            changeIndicator: ".flc-qss-btnChangeIndicator"
        },

        styles: {
            activated: "fl-activated",
            smallButton: "fl-qss-smallButton",
            largeButton: "fl-qss-largeButton",
            settingButton: "fl-qss-settingButton",
            closeButton: "fl-qss-closeButton",
            separator: "fl-qss-separator"
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
            "onCreate.addButtonTypesStyles": {
                funcName: "gpii.qss.buttonPresenter.addButtonTypesStyles",
                args: ["{that}", "{that}.container"]
            },

            "{focusManager}.events.onElementFocused": {
                funcName: "gpii.qss.buttonPresenter.notifyButtonFocused",
                args: [
                    "{that}",
                    "{focusManager}",
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
                    "{arguments}.1", // applyHighlight
                    "{arguments}.2"  // silentFocus
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
                    "@expand:gpii.qss.buttonPresenter.getElementMetrics({that}.container)"
                ]
            },
            onMouseLeave: {
                func: "{gpii.qss.list}.events.onButtonMouseLeave",
                args: [
                    "{that}.model.item",
                    "@expand:gpii.qss.buttonPresenter.getElementMetrics({that}.container)"
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

    gpii.qss.buttonPresenter.addButtonTypesStyles = function (that, container) {
        var buttonTypes = that.model.item.buttonTypes,
            styles = that.options.styles;

        fluid.each(buttonTypes, function (buttonType) {
            if (styles[buttonType]) {
                container.addClass(styles[buttonType]);
            }
            // adding the button id, if there is any in the schema
            if (that.model.item.id) {
                container.addClass("fl-qss-btnId-" + that.model.item.id);
            }
        });
    };

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
        var metrics = gpii.qss.buttonPresenter.getElementMetrics(container),
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
     * @param {focusManager} focusManager - The `gpii.qss.focusManager` instance for the QSS.
     * @param {jQuery} container - A jQuery object representing the button's container.
     */
    gpii.qss.buttonPresenter.notifyButtonFocused = function (that, focusManager, container) {
        if (focusManager.isHighlighted(container)) {
            that.events.onButtonFocused.fire(
                that.model.item,
                gpii.qss.buttonPresenter.getElementMetrics(container));
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
     * @param {Boolean} silentFocus - If `true` no event will be fired after the necessary UI
     * changes are made.
     */
    gpii.qss.buttonPresenter.focusButton = function (that, focusManager, container, index, applyHighlight, silentFocus) {
        if (that.model.index === index) {
            focusManager.focusElement(container, applyHighlight, silentFocus);
        }
    };

    /**
     * Returns the metrics of a given element. These can be used for positioning the QSS
     * button's tooltip or the QSS widget.
     * @param {jQuery} target - The DOM element for which positioning
     * metrics are needed.
     * @return {Object} {{offsetTop: Number, offsetLeft: Number, width: Number}}
     */
    gpii.qss.buttonPresenter.getElementMetrics = function (target) {
        return {
            offsetTop:  target.offset().top,
            offsetLeft: target.offset().left,
            width:      target.outerWidth()
        };
    };

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
})(fluid);
