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

var fluid = require("infusion");

var gpii = fluid.registerNamespace("gpii"),
    electron = require("electron");

require("../basic/dialog.js");
require("../basic/blurrable.js");
require("../../../shared/channelUtils.js");

/**
 * A component that represents the Quick Set Strip.
 */
fluid.defaults("gpii.app.qss", {
    gradeNames: ["gpii.app.dialog", "gpii.app.dialog.offScreenHidable", "gpii.app.blurrable"],

    model: {
        // Whether blurring should be respected by the dialog
        closeQssOnBlur: null
    },

    sideMargin: 5,
    buttonWidth: 89,

    config: {
        destroyOnClose: false,
        awaitWindowReadiness: true,

        attrs: {
            width: {
                expander: {
                    funcName: "gpii.app.qss.computeQssWidth",
                    args: [
                        "{that}.options.buttonWidth",
                        "{that}.options.sideMargin",
                        "{that}.options.config.params.settings"
                    ]
                }
            },
            height: 95,

            alwaysOnTop: true,
            transparent: false
        },
        params: {
            settings: null
        },
        fileSuffixPath: "qss/index.html"
    },

    events: {
        onQssOpen: null,
        onQssWidgetToggled: null,
        onQssSettingAltered: null,
        onSettingUpdated: null,

        onUndoIndicatorChanged: null
    },

    linkedWindowsGrades: ["gpii.app.psp", "gpii.app.qssWidget",  "gpii.app.qssNotification", "gpii.app.qssMorePanel", "gpii.app.qss"],

    components: {
        channelNotifier: {
            type: "gpii.app.channelNotifier",
            options: {
                events: {
                    onQssOpen: "{qss}.events.onQssOpen",
                    onQssWidgetToggled: "{qss}.events.onQssWidgetToggled",
                    onSettingUpdated: "{qss}.events.onSettingUpdated",
                    onUndoIndicatorChanged: "{qss}.events.onUndoIndicatorChanged",
                    onIsKeyedInChanged: null
                },
                listeners: {
                    onSettingUpdated: {
                        "funcName": "console.log",
                        args: ["QssDialog settingUpdate: ", "{arguments}.0"]
                    }
                },
                modelListeners: {
                    "{qss}.model.isKeyedIn": {
                        this: "{that}.events.onIsKeyedInChanged",
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
                    onQssPspOpen: null
                },

                listeners: {
                    onQssClosed: {
                        func: "{qss}.hide"
                    },
                    // XXX DEV
                    onQssSettingAltered: {
                        funcName: "console.log",
                        args: ["Setting altered QSS:", "{arguments}.0.path", "{arguments}.0.value"]
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
        getExtendedWidth: {
            funcName: "gpii.app.qss.getExtendedWidth",
            args: ["{that}", "{qssWrapper}.qssWidget"]
        }
    }
});

/**
 * Returns the total width of the component which must be taken into account when
 * fitting the window into the available screen space. It is assumed that the first
 * button in the QSS will have a QSS widget menu and this menu should be fully visible
 * when displayed. Thus, the extended width of the QSS is its own width together with
 * the width of the QSS widget menu which stays to the left of the QSS.
 * @param {Component} that - The `gpii.app.qss` instance.
 * @param {Component} qssWidget - The `gpii.app.qssWidget` instance.
 * @return {Number} The total width of the component.
 */
gpii.app.qss.getExtendedWidth = function (that, qssWidget) {
    var scaledButtonWidth = that.model.scaleFactor * that.options.buttonWidth;
    return that.model.width + (qssWidget.model.width - scaledButtonWidth) / 2;
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
 * Computes the desired width of the QSS based on the single button size,
 * the width of the side margin and the number of buttons.
 * @param {Number} buttonWidth - The width of a single QSS button
 * @param {Number} sideMargin - The margin between the last QSS button and the
 * right edge of the QSS.
 * @param {Object} qssButtons - The list of QSS buttons
 * @return {Number} The computed QSS width based on the buttons count
 */
gpii.app.qss.computeQssWidth = function (buttonWidth, sideMargin, qssButtons) {
    var buttonsCount = qssButtons.length,
        qssWidth = buttonsCount * buttonWidth + sideMargin;

    console.log("QSS Dialog: Computed width - ", qssWidth);

    return qssWidth;
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
    if (closeQssOnBlur) {
        var trayBounds = tray.tray.getBounds(),
            cursorPoint = electron.screen.getCursorScreenPoint();

        if (!gpii.app.isPointInRect(cursorPoint, trayBounds)) {
            that.hide();
        }
    }
};
