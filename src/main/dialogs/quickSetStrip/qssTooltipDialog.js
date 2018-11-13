/**
 * The Quick Set Strip tooltip dialog
 *
 * Introduces a component that uses an Electron BrowserWindow to represent a QSS tooltip.
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


require("../basic/dialog.js");
require("../basic/delayedDialog.js");
require("../basic/blurrable.js");
require("../basic/offScreenHidable.js");
require("../../../shared/channelUtils.js");

var gpii = fluid.registerNamespace("gpii");

/**
 * A blurrable, shown with a delay dialog which represents the QSS
 * tooltip. It is also hidden off-screen to avoid flickering when
 * a new QSS button is focused and the tooltip needs to change.
 */
fluid.defaults("gpii.app.qssTooltipDialog", {
    gradeNames: [
        "gpii.app.dialog",
        "gpii.app.blurrable",
        "gpii.app.delayedDialog",
        "gpii.app.dialog.offScreenHidable"
    ],

    model: {
        isKeyedIn: false,
        setting: null,
        tooltip: null
    },

    modelRelay: {
        tooltip: {
            target: "tooltip",
            singleTransform: {
                type: "fluid.transforms.free",
                func: "gpii.app.qssTooltipDialog.getTooltip",
                args: [
                    "{that}.model.isKeyedIn",
                    "{that}.model.setting"
                ]
            }
        }
    },

    showDelay: 500,

    config: {
        showInactive: true, // not focused when shown
        destroyOnClose: false,

        attrs: {
            width: 205,
            height: 300,
            alwaysOnTop: true
        },
        fileSuffixPath: "qssTooltipPopup/index.html"
    },

    // close whenever focus is lost
    linkedWindowsGrades: [],

    invokers: {
        showIfPossible: {
            funcName: "gpii.app.qssTooltipDialog.showIfPossible",
            args: [
                "{that}",
                "{arguments}.0",
                "{arguments}.1"
            ]
        },
        show: {
            // TODO split to some generic parts
            funcName: "gpii.app.qssTooltipDialog.show",
            args: [
                "{that}",
                "{arguments}.0"
            ]
        }
    },

    components: {
        channelNotifier: {
            type: "gpii.app.channelNotifier",
            options: {
                events: {
                    // update message in the tooltip
                    // expect this message to be translated
                    onTooltipUpdated: null
                },
                modelListeners: {
                    "{qssTooltipDialog}.model.tooltip": {
                        func: "{that}.events.onTooltipUpdated.fire",
                        args: ["{change}.value"],
                        excludeSource: "init"
                    }
                }
            }
        }
    }
});

/**
 * Returns the tooltip for the particular QSS button based on whether
 * there is an actually keyed-in user.
 * @param {Boolean} isKeyedIn - Whether there is an actually keyed-in user.
 * The "noUser" is not considered an actual user.
 * @param {Object} setting - The setting corresponding to the QSS button.
 * @return {String} The tooltip for the button.
 */
gpii.app.qssTooltipDialog.getTooltip = function (isKeyedIn, setting) {
    if (setting) {
        var tooltip = setting.tooltip;
        return (isKeyedIn ? tooltip.keyedIn : tooltip.keyedOut) || tooltip;
    }
};

/**
 * If there is a tooltip defined for the particular QSS button, this function
 * will schedule showing of the tooltip dialog with a delay.
 * @param {Component} that - The `gpii.app.qssTooltipDialog` instance.
 * @param {Object} setting - The setting for whose button a tooltip needs to
 * be shown.
 * @param {Object} btnCenterOffset - An object containing metrics for the QSS
 * button.
 */
gpii.app.qssTooltipDialog.showIfPossible = function (that, setting, btnCenterOffset) {
    if (setting && fluid.isValue(setting.tooltip)) {
        that.showWithDelay(btnCenterOffset);
        gpii.app.applier.replace(that.applier, "setting", setting);
    }
};

/**
 * Retrieves the tooltip dialog's position.
 * @param {Component} that - The `gpii.app.qssTooltipDialog` instance.
 * @param {Object} btnCenterOffset - An object containing metrics for the QSS
 * button that has been activated.
 * @return {Object} The offset of the tooltip from the bottom right corner of
 * the screen.
 */
gpii.app.qssTooltipDialog.getTooltipPosition = function (that, btnCenterOffset) {
    // XXX extract hardcoded value to a better place
    var arrowSize = 44; // px
    return {
        offsetX: btnCenterOffset.x - that.model.scaleFactor * arrowSize,
        offsetY: btnCenterOffset.y
    };
};

/**
 * Shows the tooltip dialog immediately.
 * @param {Component} that - The `gpii.app.qssTooltipDialog` instance.
 * @param {Object} btnCenterOffset - An object containing metrics for the QSS
 * button.
 */
gpii.app.qssTooltipDialog.show = function (that, btnCenterOffset) {
    var offset = gpii.app.qssTooltipDialog.getTooltipPosition(that, btnCenterOffset);

    that.dialog.setAlwaysOnTop(true);

    // reposition window properly
    that.setPosition(offset.offsetX, offset.offsetY);

    // Trigger the showing mechanism
    that.applier.change("isShown", true);
};
