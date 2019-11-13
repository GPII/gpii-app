/**
 * The Quick Set Strip dialog
 *
 * Introduces a component that uses an Electron BrowserWindow to represent the QSS.
 * Copyright 2016 Steven Githens
 * Copyright 2016-2017 OCAD University
 *
 * Licensed under the New BSD license. You may not use this file except in
 * compliance with this License.
 * The research leading to these results has received funding from the European Union's
 * Seventh Framework Programme (FP7/2007-2013) under grant agreement no. 289016.
 * You may obtain a copy of the License at
 * https://github.com/GPII/universal/blob/master/LICENSE.txt
 */
"use strict";

var fluid = require("infusion"),
    electron = require("electron");

var gpii = fluid.registerNamespace("gpii");

require("../basic/dialog.js");
require("../basic/blurrable.js");
require("../../../shared/channelUtils.js");

/**
 * A component that represents the Quick Set Strip.
 */
fluid.defaults("gpii.app.qss", {
    gradeNames: ["gpii.app.dialog", "gpii.app.dialog.offScreenHidable", "gpii.app.blurrable"],


    dialogContentMetrics: {
        // metrics are in px
        // The width of the logo together with its left and right margins
        logoWidth: 117,
        // The width of a single button together with its left margin
        buttonWidth: 59,
        separatorWidth: 10,
        closeButtonWidth: 29
    },
    qssButtonTypes: {
        smallButton: "smallButton",
        closeButton: "close"
    },

    model: {
        settings: [],
        // Whether the Morphic logo is currently shown
        isLogoShown: true,
        // Whether blurring should be respected by the dialog
        closeQssOnBlur: null
    },

    modelListeners: {
        settings: {
            funcName: "{that}.fitToScreen",
            args: ["{that}"],
            excludeSource: "init"
        },
        isLogoShown: {
            funcName: "{that}.events.onQssLogoToggled.fire",
            args: ["{change}.value"],
            // it is shown at first
            excludeSource: "init"
        }
    },

    config: {
        destroyOnClose: false,
        awaitWindowReadiness: true,

        attrs: {
            // the width will be computed once component loads up
            height: 64,

            alwaysOnTop: true,
            transparent: false
        },
        params: {
            settings: "{that}.model.settings",
            siteConfig: "{that}.options.siteConfig"
        },
        fileSuffixPath: "qss/index.html"
    },

    events: {
        onQssOpen: null,
        onQssWidgetToggled: null,
        onQssSettingAltered: null,
        onQssLogoToggled: null,
        onSettingUpdated: null,

        onUndoIndicatorChanged: null
    },

    linkedWindowsGrades: ["gpii.app.qssWidget",  "gpii.app.qssNotification", "gpii.app.qssMorePanel", "gpii.app.qss"],

    components: {
        channelNotifier: {
            type: "gpii.app.channelNotifier",
            options: {
                events: {
                    onQssOpen: "{qss}.events.onQssOpen",
                    onQssWidgetToggled: "{qss}.events.onQssWidgetToggled",
                    onSettingUpdated: "{qss}.events.onSettingUpdated",
                    onQssLogoToggled: "{qss}.events.onQssLogoToggled",
                    onUndoIndicatorChanged: "{qss}.events.onUndoIndicatorChanged",
                    onIsKeyedInChanged: null
                },
                listeners: {
                    onSettingUpdated: {
                        "funcName": "fluid.log",
                        args: ["QssDialog settingUpdate: ", "{arguments}.0"]
                    }
                },
                modelListeners: {
                    "{qss}.model.isKeyedIn": {
                        "this": "{that}.events.onIsKeyedInChanged",
                        method: "fire",
                        args: ["{change}.value"],
                        excludeSource: "init"
                    }
                }
            }
        },
        channelListener: {
            type: "gpii.app.channelListener",
            options: {
                events: {
                    // Important information
                    // These events are available in the service buttons as well
                    // It can be used to access the main events and utils from them
                    // Usage: "{channelNotifier}.events.onQssResetAllRequired"

                    onQssClosed: null,
                    onQssButtonFocused: null,
                    onQssButtonsFocusLost: null,
                    onQssButtonActivated: null,
                    onQssButtonMouseEnter: null,
                    onQssButtonMouseLeave: null,

                    onQssSettingAltered: "{qss}.events.onQssSettingAltered",
                    onQssNotificationRequired: null,
                    onQssMorePanelRequired: null,
                    onQssUndoRequired: null,
                    onQssResetAllRequired: null,
                    onQssSaveRequired: null,
                    onQssPspToggled: null,

                    // Custom buttons events
                    onQssStartProcess: null,
                    onQssExecuteKeySequence: null
                },

                listeners: {
                    onQssClosed: {
                        func: "{qss}.hide"
                    },
                    onQssSettingAltered: {
                        funcName: "fluid.log",
                        args: ["QSS Dialog: Setting altered QSS - ", "{arguments}.0.path", "{arguments}.0.value"]
                    },
                    onQssStartProcess: {
                        funcName: "gpii.app.startProcess",
                        args: [
                            "{arguments}.0",
                            "{arguments}.1"
                        ]
                    },
                    onQssExecuteKeySequence: {
                        funcName: "gpii.app.executeKeySequence",
                        args: ["{arguments}.0"]
                    }
                }
            }
        }
    },
    invokers: {
        show: {
            funcName: "gpii.app.qss.show",
            args: [
                "{that}",
                "{arguments}.0" // params
            ]
        },
        handleBlur: {
            funcName: "gpii.app.qss.handleBlur",
            args: ["{that}", "{tray}", "{that}.model.closeQssOnBlur"]
        },
        updateUndoIndicator: {
            func: "{that}.events.onUndoIndicatorChanged.fire",
            args: [
                "{arguments}.0" // state
            ]
        },
        getQssHorizontalMargin: {
            funcName: "gpii.app.qss.getQssHorizontalMargin",
            args: ["{that}", "{qssWrapper}.qssWidget"]
        },
        getExtendedWidth: {
            funcName: "gpii.app.qss.getExtendedWidth",
            args: ["{that}"]
        },
        fitToScreen: {
            funcName: "gpii.app.qss.fitToScreen",
            args: ["{that}"]
        }
    }
});

/**
 * Represents a group of setting data from which we using only the buttonTypes array
 * @typedef {Object} ButtonList
 * @property {String} [path] the path of the prefererence set.
 * @property {SettingSchema} schema.
 * @property {Array} [buttonTypes] array from diffent button types.
 * @property {Number} [tabindex] order of which the buttons will act on keyboard interaction.
 * @property {String} [messageKey] message bundle key used to translate the button's
 * data (like title, hints, etc.).
 * @property {String} [learnMoreLink] url to the help page related to this button's setting.
 * @property {String} [value] default value to the setting.
 */

/**
 * Computes the total width of all of the QSS buttons, based on their sizes inside
 * the BrowserWindow.
 * @param {Object} options - Component options object containing information for buttons
 * @param {Number} modelScaleFactor - Predefined scale factor setting in siteconfig
 * @param {ButtonList[]} buttons - The list of QSS buttons
 * @return {Number} - The total scaled size of the QSS's button
 */
gpii.app.qss.computeQssButtonsWidth = function (options, modelScaleFactor, buttons) {
    var separatorId = "separator",
        qssButtonTypes   = options.qssButtonTypes,
        buttonWidth      = options.dialogContentMetrics.buttonWidth,
        separatorWidth   = options.dialogContentMetrics.separatorWidth,
        closeButtonWidth = options.dialogContentMetrics.closeButtonWidth;

    // start off with the first button size and the constant close button
    var buttonsWidth = closeButtonWidth + buttonWidth;
    // check the type of the previous button, if the current is small
    // in the future, we might have the case that there aren't two small sequential buttons
    for (var i = 1; i < buttons.length; i++) {
        if (!buttons[i].buttonTypes.includes(qssButtonTypes.smallButton) ||
            !buttons[i - 1].buttonTypes.includes(qssButtonTypes.smallButton) &&
            buttons[i].path !== qssButtonTypes.closeButton
        ) {
            if (buttons[i].buttonTypes[0] === separatorId) {
                // this is separator type button, which is slimmer that the others
                buttonsWidth += separatorWidth;
            } else {
                // standart button width
                buttonsWidth += buttonWidth;
            }
        }
    }

    return buttonsWidth * modelScaleFactor;
};

/**
 * Resizes the QSS so that it fits in the available screen size. The resizing process
 * may include hiding or showing the QSS logo depending on the available space. As a
 * result the `scaleFactor` for the QSS will be adjusted but in any case it will not
 * exceed the `maxScaleFactor`.
 * @param {Component} that - The `gpii.app.qss` component.
 */
gpii.app.qss.fitToScreen = function (that) {
    var screenSize = electron.screen.getPrimaryDisplay().workAreaSize,
        qssButtonsWidth = gpii.app.qss.computeQssButtonsWidth(that.options, that.model.scaleFactor, that.model.settings),
        qssLogoWidth = that.options.dialogContentMetrics.logoWidth * that.model.scaleFactor;

    var canFitOnScreenFullSized = screenSize.width > qssButtonsWidth + qssLogoWidth;

    // We would need to hide the logo if there's insufficient space
    that.applier.change("", {
        width: qssButtonsWidth + (canFitOnScreenFullSized && qssLogoWidth),
        isLogoShown: canFitOnScreenFullSized
    });

    gpii.app.resizable.fitToScreen(that);
};

/**
 * Returns the width needed for the button menu to be displayed.
 * As a button menu usually exceeds the bounds of the button, and
 * given the case that the button is at the very edge the QSS (the logo is hidden)
 * we need to know the additional space needed for the proper displaying of
 * the QS as a whole.
 * @param {Component} that - The `gpii.app.qss` instance.
 * @param {Component} qssWidget - The `gpii.app.qssWidget` instance.
 * @return {Number} The total width of the component.
 */
gpii.app.qss.getQssHorizontalMargin = function (that, qssWidget) {
    var scaledButtonWidth = that.model.scaleFactor * that.options.dialogContentMetrics.buttonWidth;
    return (qssWidget.model.width - scaledButtonWidth) / 2;
};

/**
 * Returns the total width of the component which must be taken into account when
 * fitting the window into the available screen space.
 * It is assumed that the first button in the QSS will have a QSS widget
 * menu and it ensures that this menu will be fully visible when displayed.
 * @param {Component} that - The `gpii.app.qss` instance.
 * @param {Component} qssWidget - The `gpii.app.qssWidget` instance.
 * @return {Number} The total width of the component.
 */
gpii.app.qss.getExtendedWidth = function (that) {
    var scaledLogoWidth = that.options.dialogContentMetrics.logoWidth * that.model.scaleFactor,
        qssDesiredMargin = that.getQssHorizontalMargin();
    if (that.model.isLogoShown && scaledLogoWidth > qssDesiredMargin) {
        return that.model.width;
    }

    return that.model.width + that.getQssHorizontalMargin();
};

/**
 * Shows the QSS or focuses it in case it is already shown.
 * @param {Component} that - The `gpii.app.qss` instance.
 * @param {Object} params - The parameters which should be passed to the renderer
 * part of the QSS. These may, for example, inform the renderer if the QSS was
 * opened via an ArrowLeft/ArrowRight key or using the global shortcut.
 */
gpii.app.qss.show = function (that, params) {
    gpii.app.dialog.show(that);

    that.events.onQssOpen.fire(params);
};

/**
 * Handles the blur event for the QSS which is fired when the window loses focus. The QSS
 * will be closed only if this is the user's preference AND if the blur event was not the
 * result of the user clicking the tray icon (i.e. the mouse pointer is not within the
 * bounds of the tray icon).
 * @param {Component} that - The `gpii.app.qss` instance.
 * @param {Component} tray - The `gpii.app.tray` instance.
 * @param {Boolean} closeQssOnBlur - If `true`, the QSS will be hidden once the window
 * loses focus. Otherwise, it will stay open.
 */
gpii.app.qss.handleBlur = function (that, tray, closeQssOnBlur) {
    if (closeQssOnBlur && !tray.isMouseOver()) {
        that.hide();
    }
};
