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
            item: {
                funcName: "gpii.qss.settingButtonPresenter.updateChangeIndicator",
                args: ["{that}", "{that}.model.item"]
            }
        }
    });

    /**
     * Shows or hides the toggle indicator when the setting's value is changed depending
     * on whether the changes to the setting can be undone and whether the new value of
     * the setting is the same as its default one.
     * @param {Component} that - The `gpii.qss.settingButtonPresenter` instance.
     * @param {ButtonDefinition} setting - The setting object corresponding to this QSS button
     */
    gpii.qss.settingButtonPresenter.updateChangeIndicator = function (that, setting) {
        var defaultValue,
            shouldShow = false;

        // Check if the button have secondary settings
        if (fluid.isValue(setting.settings)) {
            fluid.each(setting.settings, function (nestedSetting) {
                var defaultValue = nestedSetting.schema["default"];
                if ((fluid.isValue(defaultValue) && !fluid.model.diff(nestedSetting.value, defaultValue)) && shouldShow === false) {
                    shouldShow = true;
                }
            });
        } else {
            defaultValue = setting.schema["default"];
            shouldShow = fluid.isValue(defaultValue) && !fluid.model.diff(setting.value, defaultValue);
        }
        // The dot should be shown if the setting has a default value and the new value of the
        // setting is different from that value.
        that.toggleIndicator(shouldShow);
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
            }
        }
    });

    /**
     * Inherits from `gpii.qss.buttonPresenter` and handles interactions with QSS toggle
     * buttons.
     */
    fluid.defaults("gpii.qss.toggleButtonPresenter", {
        gradeNames: ["gpii.qss.widgetButtonPresenter"],
        model: {
            messages: {
                caption: null
            },
            caption: null
        },
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
            caption: {
                this: "{that}.dom.caption",
                method: "text",
                args: ["{change}.value"]
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
     * Inherits from `gpii.qss.buttonPresenter` and handles interactions with QSS Volume
     * toggle button.
     */
    fluid.defaults("gpii.qss.volumeButtonPresenter", {
        gradeNames: ["gpii.qss.widgetButtonPresenter"],
        model: {
            messages: {
                caption: null
            },
            item: {}
        },
        styles: {
            redButton: "fl-qss-redButton"
        },
        modelRelay: {
            "caption": {
                target: "caption",
                singleTransform: {
                    type: "fluid.transforms.free",
                    func: "gpii.qss.volumeButtonPresenter.getCaption",
                    args: ["{that}.model.value", "{that}.model.messages", "{that}"]
                }
            }
        },
        modelListeners: {
            caption: {
                this: "{that}.dom.caption",
                method: "text",
                args: ["{change}.value"]
            }
        },
        invokers: {
            renderImage: {
                funcName: "gpii.qss.volumeButtonPresenter.renderImage",
                args: ["{that}.dom.image", "{that}.model.item.schema.image", "{arguments}.0"]
            },
            hideTitle: {
                funcName: "gpii.qss.volumeButtonPresenter.hideTitle",
                args: ["{that}.dom.title", "{arguments}.0"]
            },
            toggleStyle: {
                funcName: "gpii.qss.volumeButtonPresenter.toggleStyle",
                args: ["{that}.container", "{that}.options.styles.redButton", "{arguments}.0"]
            }
        }
    });

    /**
     * State of the Volume button. If the value is `true` the state of the button is ON.
     * @typedef {Boolean} volumeState
    */

    /**
     * Show or hide the title of the button.
     * @param {jQuery} titleElem - The jQuery object corresponding to the title of the button.
     * @param {volumeState} value - The state of the button.
     */
    gpii.qss.volumeButtonPresenter.hideTitle = function (titleElem, value) {
        if (value) {
            titleElem.hide();
        } else {
            titleElem.show();
        }
    };

    /**
     * If available in the setting's schema, shows the specified image for the button when the volume switch is ON.
     * @param {jQuery} imageElem - The jQuery object corresponding to the image of the button.
     * @param {String} image - The path to the image.
     * @param {volumeState} value - The state of the button.
     */
    gpii.qss.volumeButtonPresenter.renderImage = function (imageElem, image, value) {
        if (image && value) {
            var maskImageValue = fluid.stringTemplate("url(\"%image\")", {
                image: image
            });

            // use a mask image to avoid having 2 different images (one for when the
            // button is activated and one when it is not)
            imageElem.css("mask-image", maskImageValue);
            imageElem.show();
        } else {
            imageElem.hide();
        }
    };

    /**
     * Returns the caption of the toggle button that needs to be shown below the button's
     * title in case the state of the button is "on".
     * In the case of the Volume widget, the caption message is shown only when the volume switch is ON.
     * @param {volumeState} value - The state of the button.
     * @param {Object} messages - An object containing internationalizable messages for
     * this component.
     * @param {gpii.qss.volumeButtonPresenter} that - The `gpii.qss.volumeButtonPresenter` instance.
     * @return {String} The caption message for the toggle button.
     */
    gpii.qss.volumeButtonPresenter.getCaption = function (value, messages, that) {
        that.toggleStyle(value);
        that.renderImage(value);
        that.hideTitle(value);
        return value ? messages.caption : "";
    };

    /**
     * Change the color of the "Volume & Mute" button if the volume switch is ON.
     * @param {jQuery} container - The jQuery container object
     * @param {String} style - Contains css class
     * @param {volumeState} value - The state of the button.
     */
    gpii.qss.volumeButtonPresenter.toggleStyle = function (container, style, value) {
        if (value) {
            container.addClass(style);
        } else {
            container.removeClass(style);
        }
    };

})(fluid);
