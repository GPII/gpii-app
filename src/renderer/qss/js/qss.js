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


    fluid.defaults("gpii.qss.qssKeyListener", {
        gradeNames: "gpii.qss.elementRepeater.keyListener",

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
     * TODO
     */
    fluid.defaults("gpii.qss.buttonPresenter", {
        gradeNames: [
            "gpii.qss.qssKeyListener",
            "gpii.qss.elementRepeater.hoverable",
            "gpii.qss.elementRepeater.clickable",
            "fluid.viewComponent"
        ],

        model: {
            item: {
                value: null
            },
            value: "{that}.model.item.value",
            messages: {
                notification: {
                    description: "Most applications will need to be re-started in order for the %settingTitle setting to work in that application."
                }
            }
        },

        modelRelay: {
            title: {
                target: "title",
                singleTransform: {
                    type: "fluid.transforms.free",
                    func: "gpii.qss.buttonPresenter.getTitle",
                    args: [
                        "{gpii.qss}.model.keyedInUserToken",
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

        applyKeyboardHighlight: false,

        // pass hover item as it is in order to use its position
        // TODO probably use something like https://stackoverflow.com/questions/3234977/using-jquery-how-to-get-click-coordinates-on-the-target-element
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
                    "{arguments}.0"     // element
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
                funcName: "gpii.qss.buttonPresenter.onQssWidgetToggled",
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

            // Element interaction events

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
            onButtonActivated: {
                funcName: "gpii.qss.buttonPresenter.onButtonActivated",
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

    gpii.qss.buttonPresenter.getTitle = function (keyedInUserToken, title) {
        return (keyedInUserToken ? title.keyedIn : title.keyedOut) || title;
    };

    gpii.qss.buttonPresenter.renderImage = function (that, imageElem) {
        var image = that.model.item.schema.image;
        if (image) {
            var maskImageValue = fluid.stringTemplate("url(%image)", {
                image: image
            });

            imageElem.css("mask-image", maskImageValue);
        } else {
            imageElem.hide();
        }
    };

    gpii.qss.buttonPresenter.onActivationKeyPressed = function (that, focusManager, container, activationParams) {
        if (focusManager.isHighlighted(container)) {
            that.activate(activationParams);
        }
    };

    gpii.qss.buttonPresenter.onQssWidgetToggled = function (that, container, setting, isShown) {
        var activatedClass = that.options.styles.activated;
        container.toggleClass(activatedClass, isShown && that.model.item.path === setting.path);
    };

    gpii.qss.buttonPresenter.onButtonActivated = function (that, focusManager, container, qssList, activationParams) {
        var metrics = gpii.qss.getElementMetrics(container),
            isKeyPressed = fluid.get(activationParams, "key"),
            applyKeyboardHighlight = that.options.applyKeyboardHighlight;

        focusManager.focusElement(container, isKeyPressed && applyKeyboardHighlight);
        qssList.events.onButtonActivated.fire(that.model.item, metrics, activationParams);
    };

    gpii.qss.buttonPresenter.activate = function (that, activationParams) {
        that.onButtonActivated(activationParams);
    };

    gpii.qss.buttonPresenter.notifyButtonFocused = function (that, container, focusedElement) {
        if (container.is(focusedElement)) {
            that.events.onButtonFocused.fire(
                that.model.item,
                gpii.qss.getElementMetrics(focusedElement));
        }
    };

    gpii.qss.buttonPresenter.focusButton = function (that, focusManager, container, index, applyHighlight) {
        if (that.model.index === index) {
            focusManager.focusElement(container, applyHighlight);
        }
    };

    gpii.qss.buttonPresenter.showNotification = function (that, qssList) {
        if (that.model.item.restartWarning) {
            var messages = that.model.messages,
                description = fluid.stringTemplate(messages.notification.description, {
                    settingTitle: that.model.item.schema.title
                }),
                notificationParams = fluid.extend({}, messages.notification, {
                    description: description
                });
            qssList.events.onNotificationRequired.fire(notificationParams);
        }
    };

    /**
     * Return the metrics of a clicked element. These can be used
     * for positioning. Note that the position is relative to the right.
     *
     * @param {jQuery} target - The DOM element which
     * positioning metrics are needed.
     * @returns {{width: Number, height: Number, offsetRight: Number}}
     */
    gpii.qss.getElementMetrics = function (target) {
        return {
            offsetRight: $(window).width() - target.offset().left,
            height:      target.outerHeight() - 3, // TODO: Think of a better formula.
            width:       target.outerWidth()
        };
    };

    fluid.defaults("gpii.qss.settingButtonPresenter", {
        gradeNames: "fluid.viewComponent",

        model: {
            item: {
                value: null
            },
            value: "{that}.model.item.value"
        },

        selectors: {
            changeIndicator: ".flc-qss-btnChangeIndicator"
        },

        styles: {
            settingButton: "fl-qss-settingButton"
        },

        modelListeners: {
            value: {
                funcName: "gpii.qss.settingButtonPresenter.updateChangeIndicator",
                args: ["{that}.dom.changeIndicator", "{that}.model.item", "{change}.value"],
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

    gpii.qss.settingButtonPresenter.updateChangeIndicator = function (indicatorElem, setting, value) {
        // The dot should be shown if the setting has a default value and the new value of the
        // setting is different from that value.
        var defaultValue = setting.schema.defaultValue,
            shouldShow = fluid.isValue(defaultValue) && !fluid.model.diff(value, defaultValue);
        indicatorElem.toggle(shouldShow);
    };

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

    gpii.qss.toggleButtonPresenter.getCaption = function (value, messages) {
        return value ? messages.caption : "";
    };

    gpii.qss.toggleButtonPresenter.activate = function (that, activationParams) {
        that.onButtonActivated(activationParams);
        that.applier.change("value", !that.model.value);
    };

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

    gpii.qss.keyInButtonPresenter.activate = function (that, qssList, activationParams) {
        that.onButtonActivated(activationParams);
        qssList.events.onPSPOpen.fire();
    };

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

    gpii.qss.closeButtonPresenter.activate = function (that, qssList, activationParams) {
        that.onButtonActivated(activationParams);
        qssList.events.onQssClosed.fire();
    };

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

    fluid.defaults("gpii.qss.saveButtonPresenter", {
        gradeNames: ["gpii.qss.buttonPresenter"],
        model: {
            messages: {
                notification: {
                    description: "Current Settings Saved"
                }
            }
        },
        invokers: {
            activate: {
                funcName: "gpii.qss.saveButtonPresenter.activate",
                args: [
                    "{that}",
                    "{list}",
                    "{arguments}.0" // activationParams
                ]
            }
        }
    });

    gpii.qss.saveButtonPresenter.activate = function (that, qssList, activationParams) {
        that.onButtonActivated(activationParams);
        qssList.events.onNotificationRequired.fire(that.model.messages.notification);
    };

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

    gpii.qss.moreButtonPresenter.activate = function (that, qssList, activationParams) {
        that.onButtonActivated(activationParams);
        qssList.events.onMorePanelRequired.fire();
    };

    fluid.defaults("gpii.qss.undoButtonPresenter", {
        gradeNames: ["gpii.qss.buttonPresenter"],
        applyKeyboardHighlight: true,
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

    gpii.qss.undoButtonPresenter.activate = function (that, qssList, activationParams) {
        that.onButtonActivated(activationParams);
        qssList.events.onUndoRequired.fire();
    };


    /**
     * Represents the list of qss settings. It renders the settings and listens
     * for events on them.
     */
    fluid.defaults("gpii.qss.list", {
        gradeNames: ["gpii.psp.repeater"],

        dynamicContainerMarkup: {
            container:
                "<div class=\"%containerClass fl-focusable\" tabindex=\"0\">" +
                    "<div class=\"flc-qss-btnChangeIndicator fl-qss-btnChangeIndicator\"></div>" +
                    "<div class=\"flc-qss-btnImage fl-qss-btnImage\"></div>" +
                    "<span class=\"flc-qss-btnLabel fl-qss-btnLabel\"></span>" +
                    "<div class=\"flc-qss-btnCaption fl-qss-btnCaption\"></div>" +
                "</div>",
            containerClassPrefix: "fl-qss-button"
        },
        markup: null,

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
            onPSPOpen: null
        },

        invokers: {
            getHandlerType: {
                funcName: "gpii.qss.list.getHandlerType",
                args: ["{arguments}.0"] // item
            }
        }
    });

    gpii.qss.list.getHandlerType = function (item) {
        switch (item.schema.type) {
        case "boolean":
            return "gpii.qss.toggleButtonPresenter";
        case "number":
        case "string":
            return "gpii.qss.widgetButtonPresenter";
        case "close":
            return "gpii.qss.closeButtonPresenter";
        case "psp":
            return "gpii.qss.keyInButtonPresenter";
        case "save":
            return "gpii.qss.saveButtonPresenter";
        case "undo":
            return "gpii.qss.undoButtonPresenter";
        case "more":
            return "gpii.qss.moreButtonPresenter";
        default:
            return "gpii.qss.buttonPresenter";
        };
    };

    /**
     * Represents the QSS as a whole.
     */
    fluid.defaults("gpii.qss", {
        gradeNames: ["fluid.viewComponent"],

        model: {
            keyedInUserToken: null,
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
                        onQssClosed: "{gpii.qss}.events.onQssClosed"
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
                        onKeyedInUserTokenChanged: null
                    },
                    listeners: {
                        onSettingUpdated: {
                            funcName: "gpii.qss.updateSetting",
                            args: [
                                "{qss}",
                                "{arguments}.0"
                            ]
                        },
                        onKeyedInUserTokenChanged: {
                            func: "{gpii.qss}.updateKeyedInUserToken"
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
                        onQssPspOpen: "{quickSetStripList}.events.onPSPOpen"
                    }
                }
            }
        },

        invokers: {
            updateKeyedInUserToken: {
                changePath: "keyedInUserToken",
                value: "{arguments}.0"
            }
        }
    });


    /**
     * Find a setting in a list of settings and update it. Settings are identified by their
     * `path` property which is expected to be existent and unique.
     *
     * @param {Component} that - The component containing `settings` in its model
     * @param {Object} settingNewState - The new state of the setting
     * @param {String} settingNewState.path - The path of the setting. This field is required.
     */
    gpii.qss.updateSetting = function (that, settingNewState) {
        var settingIndex = that.model.settings.findIndex(function (setting) {
            return setting.path === settingNewState.path;
        });

        gpii.app.applier.replace(that.applier, "settings." + settingIndex, settingNewState, "settingUpdate");
    };

    gpii.qss.getSettingIndex = function (settings, setting) {
        return settings.findIndex(function (currentSetting) {
            return currentSetting.path === setting.path;
        });
    };

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
            var settingIndex = gpii.qss.getSettingIndex(settings, params.setting),
                applyHighlight = false;

            if (params.key === "ArrowLeft") {
                settingIndex = gpii.psp.modulo(settingIndex - 1, settings.length);
                applyHighlight = true;
            } else if (params.key === "ArrowRight") {
                settingIndex = gpii.psp.modulo(settingIndex + 1, settings.length);
                applyHighlight = true;
            }

            qssList.events.onButtonFocusRequired.fire(settingIndex, applyHighlight);
        } else {
            focusManager.removeHighlight(true);
        }
    };
})(fluid);
