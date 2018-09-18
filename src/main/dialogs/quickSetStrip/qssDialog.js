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

var gpii = fluid.registerNamespace("gpii");

require("../basic/dialog.js");
require("../basic/blurrable.js");
require("../basic/scaledDialog.js");
require("../../../shared/channelUtils.js");

/**
 * A component that represents the Quick Set Strip.
 */
fluid.defaults("gpii.app.qss", {
    gradeNames: ["gpii.app.dialog", "gpii.app.dialog.offScreenHidable", "gpii.app.scaledDialog", "gpii.app.blurrable"],

    scaleFactor: 1,

    buttonWidth: 89,
    defaultHeight: 95,

    defaultWidth: "@expand:gpii.app.qss.computeQssWidth({that}.options.buttonWidth, {that}.options.config.params.settings)",

    config: {
        closable: false,
        awaitWindowReadiness: true,

        attrs: {
            alwaysOnTop: true,
            transparent: false,
            enableLargerThanScreen: true
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
            funcName: "fluid.identity"
        },
        updateUndoIndicator: {
            func: "{that}.events.onUndoIndicatorChanged.fire",
            args: [
                "{arguments}.0" // state
            ]
        }
    }
});

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
 * Compute the desired width of the QSS based on the single button size
 * and the number of buttons.
 *
 * @param {Number} buttonWidth - The width of a single QSS button
 * @param {Object} qssButtons - The list of QSS buttons
 * @return {Number} The computed QSS width based on the buttons count
 */
gpii.app.qss.computeQssWidth = function (buttonWidth, qssButtons) {
    var bothSidesMargin = 6;
    var buttonsCount = qssButtons.length;
    var qssWidth = buttonsCount * buttonWidth + bothSidesMargin;

    console.log("QSS Dialog: Computed width - ", qssWidth);

    return qssWidth;
};
