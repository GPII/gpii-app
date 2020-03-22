/**
 * The QSS Screen Capture widget
 *
 * Shows a list of buttons that do a screen or video capture using the shareX command,
 * its using siteconfig's shareXPath folder and the provided command from the button
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
     * Represents the QSS Screen Capture widget.
     */
    fluid.defaults("gpii.qssWidget.screenCapture", {
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
            heightListenerContainer: ".flc-qssScreenCaptureWidget-controls",
            menuControlsWrapper: ".flc-qssScreenCaptureWidget-controlsWrapper",
            menuControls: ".flc-qssScreenCaptureWidget-controls"
        },
        enableRichText: true,
        activationParams: {},
        closeDelay: 1200,
        components: {
            repeater: {
                // whenever the setting changes (e.g. if the change is made via the PSP)
                type: "gpii.psp.repeater",
                container: "{screenCapture}.dom.menuControls",
                options: {
                    model: {
                        disabled: "{screenCapture}.model.disabled",
                        value: "{screenCapture}.model.setting.value",
                        styles: "{screenCapture}.model.setting.styles"
                    },
                    modelRelay: {
                        items: {
                            target: "items",
                            singleTransform: {
                                type: "fluid.transforms.free",
                                func: "gpii.qssWidget.screenCapture.getRepeaterItems",
                                args: [
                                    "{screenCapture}.model.setting"
                                ]
                            }
                        }
                    },
                    dynamicContainerMarkup: {
                        container: "<div role=\"radio\" class=\"%containerClass fl-qssWidgetMenu-item fl-focusable\" tabindex=\"0\"></div>",
                        containerClassPrefix: "flc-qssWidgetMenu-item"
                    },
                    handlerType: "gpii.qssWidget.screenCapture.presenter",
                    markup: null,
                    styles: {
                        disabled: "disabled"
                    },
                    events: {
                        onItemFocus: null
                    },
                    invokers: {
                        updateValue: {
                            funcName: "gpii.qssWidget.screenCapture.executeShareX",
                            args: [
                                "{arguments}.0", // value
                                "{gpii.qssWidget.screenCapture}.options.siteConfig.shareXPath", // the path to the shareX executable
                                "{channelNotifier}.events.onQssWidgetHideQssRequested"
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
                            args: ["{screenCapture}.closingKeyboardEvent"]
                        }
                    }
                }
            }
        },
        listeners: {
            "onCreate.visibilityChange": {
                funcName: "gpii.qssWidget.screenCapture.addVisibilityChangeListener",
                args: ["{closeTimer}"]
            },
            "onDestroy.visibilityChange": {
                funcName: "gpii.qssWidget.screenCapture.removeVisibilityChangeListener"
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
                funcName: "gpii.qssWidget.screenCapture.close",
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
    gpii.qssWidget.screenCapture.close = function (that, closeTimer, keyboardEvent) {
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
    gpii.qssWidget.screenCapture.addVisibilityChangeListener = function (closeTimer) {
        $(document).on("visibilityChange.qssScreenCaptureWidget", function () {
            if (document.visibilityState === "hidden") {
                closeTimer.clear();
            }
        });
    };

    /**
     * Removes the listener for clearing the `closeTimer`. Useful when the component is
     * destroyed.
     */
    gpii.qssWidget.screenCapture.removeVisibilityChangeListener = function () {
        $(document).off("visibilityChange.qssScreenCaptureWidget");
    };

    /**
     * Executes the shareX command with the command from the button
     * @param {String} value - The new value of the setting in the QSS menu.
     * @param {String} shareXPath - the path to the shareX executable
     * @param {EventListener} hideQss - the handle to the hideQSS's event listener
     */
    gpii.qssWidget.screenCapture.executeShareX = function (value, shareXPath, hideQss) {
        // hiding QSS
        hideQss.fire();
        // taking the screenshot
        gpii.psp.execShareXCommand(value, shareXPath);

    };

    /**
     * Creates an array of possible values for the given setting to be provided to the
     * `gpii.psp.repeater` instance.
     * @param {Object} setting - the current setting for the QSS menu.
     * @return {Object[]} - An array of key-value pairs describing the key and the value
     * (the visible name) of the setting.
     */
    gpii.qssWidget.screenCapture.getRepeaterItems = function (setting) {
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
    fluid.defaults("gpii.qssWidget.screenCapture.presenter", {
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
                funcName: "gpii.qssWidget.screenCapture.presenter.animateActivation",
                args: ["{change}.value", "{that}.model.item", "{that}.container", "{that}.options.styles"],
                includeSource: "fromWidget"
            }]
        },
        events: {
            onItemFocus: "{repeater}.events.onItemFocus"
        },
        listeners: {
            "onCreate.applyStyles": {
                funcName: "gpii.qssWidget.screenCapture.presenter.applyStyles",
                args: ["{that}", "{that}.container", "{repeater}.model.styles"]
            },
            onItemFocus: {
                funcName: "gpii.qssWidget.screenCapture.presenter.focusItem",
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
    gpii.qssWidget.screenCapture.presenter.focusItem = function (that, focusManager, container, index) {
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
    gpii.qssWidget.screenCapture.presenter.animateActivation = function (key, item, container, styles) {
        container.toggleClass(styles.active, item.key === key);
    };

    /**
     * Applies any predefined styles for the particular setting option.
     * @param {Component} that - The `gpii.qssWidget.menu.presenter` instance.
     * @param {jQuery} container - A jQuery object representing the setting option's container.
     * @param {Object} styles - The styles for the current QSS menu setting.
     */
    gpii.qssWidget.screenCapture.presenter.applyStyles = function (that, container, styles) {
        var elementStyles = fluid.get(styles, that.model.item.key);
        if (elementStyles) {
            container.css(elementStyles);
        }
    };

})(fluid);
