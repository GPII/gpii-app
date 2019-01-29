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

    // The width of the logo together with its left and right margins
    logoWidth: 117,

    // The width of a single button together with its left margin
    buttonWidth: 59,

    model: {
        // Whether the Morphic logo is currently shown
        isLogoShown: true,
        // Whether blurring should be respected by the dialog
        closeQssOnBlur: null
    },

    modelListeners: {
        isLogoShown: {
            funcName: "gpii.app.qss.toggleLogo",
            args: ["{that}", "{change}.value"],
            excludeSource: "init"
        }
    },

    config: {
        destroyOnClose: false,
        awaitWindowReadiness: true,

        attrs: {
            width: 618,
            height: 64,

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
        onQssLogoToggled: null,
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
                    onQssPspToggled: null
                },

                listeners: {
                    onQssClosed: {
                        func: "{qss}.hide"
                    },
                    onQssSettingAltered: {
                        funcName: "fluid.log",
                        args: ["QSS Dialog: Setting altered QSS - ", "{arguments}.0.path", "{arguments}.0.value"]
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
        },
        fitToScreen: {
            funcName: "gpii.app.qss.fitToScreen",
            args: ["{that}"]
        }
    }
});

/**
 * Shows or hides the QSS logo depending on the `isLogoShown` model value and adjusts
 * the width of the QSS accordingly.
 * @param {Component} that - The `gpii.app.qss` component.
 * @param {Boolean} isLogoShown - Whether the logo should be shown or not.
 */
gpii.app.qss.toggleLogo = function (that, isLogoShown) {
    var width = that.model.width,
        scaleFactor = that.model.scaleFactor,
        logoWidth = scaleFactor * that.options.logoWidth;

    if (isLogoShown) {
        width += logoWidth;
    } else {
        width -= logoWidth;
    }

    that.applier.change("width", width);
    that.events.onQssLogoToggled.fire(isLogoShown);
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
        extendedWidth = that.getExtendedWidth(),
        scaleFactor = that.model.scaleFactor;

    if (screenSize.width < extendedWidth) {
        // QSS needs to shrink
        if (that.model.isLogoShown) {
            // Hide the logo first
            that.applier.change("isLogoShown", false);
            extendedWidth = that.getExtendedWidth();
        }

        // If the QSS still does not fit, scale it down
        if (screenSize.width < extendedWidth) {
            scaleFactor = that.computeScaleFactor();
        }
    } else {
        // QSS needs to expand
        // Scale up the QSS as far as possible
        scaleFactor = that.computeScaleFactor();

        // Show the logo if there is enough space for it
        if (!that.model.isLogoShown) {
            var logoWidth = scaleFactor * that.options.logoWidth;

            if (that.model.width + logoWidth < screenSize.width) {
                that.applier.change("isLogoShown", true);
            }
        }
    }

    // Simply reposition the QSS if the scaleFactor does not need to change
    if (scaleFactor === that.model.scaleFactor) {
        that.setBounds();
    } else {
        that.applier.change("scaleFactor", scaleFactor);
    }
};

/**
 * Returns the total width of the component which must be taken into account when
 * fitting the window into the available screen space.
 * If the QSS logo is shown, then the width of the QSS itself is used.
 * Otherwise, it is assumed that the first button in the QSS will have a QSS widget
 * menu and this menu should be fully visible when displayed. Thus, the extended
 * width of the QSS is its own width together with the width of the QSS widget menu
 * which stays to the left of the QSS.
 * @param {Component} that - The `gpii.app.qss` instance.
 * @param {Component} qssWidget - The `gpii.app.qssWidget` instance.
 * @return {Number} The total width of the component.
 */
gpii.app.qss.getExtendedWidth = function (that, qssWidget) {
    if (that.model.isLogoShown) {
        return that.model.width;
    }

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

        if (cursorPoint && trayBounds && !gpii.app.isPointInRect(cursorPoint, trayBounds)) {
            that.hide();
        }
    }
};
