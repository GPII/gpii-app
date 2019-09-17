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

    arrowWidth: 18,

    model: {
        isKeyedIn: false,
        setting: null,
        tooltip: null,
        arrowDirection: "right",
        availableDirections: {
            defaultDirection: "right",
            leftDirection: "left",
            centerDirection: "center"
        }
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
        },
        arrowDirection: {
            target: "arrowDirection",
            singleTransform: {
                type: "fluid.transforms.free",
                func: "gpii.app.qssTooltipDialog.getArrowDirection",
                args: [
                    "{that}.model.arrowDirection"
                ]
            }
        }
    },

    showDelay: 500,

    config: {
        showInactive: true, // not focused when shown
        destroyOnClose: false,

        attrs: {
            width: 140,
            height: 200,
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
                    onTooltipUpdated: null,
                    onTooltipArrowDirection: null
                },
                modelListeners: {
                    "{qssTooltipDialog}.model.tooltip": {
                        func: "{that}.events.onTooltipUpdated.fire",
                        args: ["{change}.value"],
                        excludeSource: "init"
                    },
                    "{qssTooltipDialog}.model.arrowDirection": {
                        func: "{that}.events.onTooltipArrowDirection.fire",
                        args: ["{qssTooltipDialog}.model.arrowDirection"],
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
 * Returns the new direction of the tooltip's arrow
 * @param {String} arrowDirection - arrow direction
 * @return {String} arrow direction
 */
gpii.app.qssTooltipDialog.getArrowDirection = function (arrowDirection) {
    return arrowDirection;
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
    var screen = require("electron").screen, // used to get the current screen size
        availableDirections = that.model.availableDirections,
        arrowDirection = availableDirections.defaultDirection, // default tooltip arrow direction
        arrowWidth = that.options.arrowWidth,
        scaleFactor = that.model.scaleFactor,
        tooltipWidth = that.options.config.attrs.width * scaleFactor, // current tooltip width
        screenWidth = screen.getPrimaryDisplay().workAreaSize.width, // current screen size
        offsetX = btnCenterOffset.x - scaleFactor * arrowWidth / 2; // calculate the offset

    // checking if the offset is too big and the tooltip will show off screen
    if (offsetX + tooltipWidth > screenWidth) {
        // setting the offset to fit the screen
        offsetX = screenWidth - tooltipWidth;
        // changing the arrow to be in the center
        arrowDirection = availableDirections.centerDirection;
    } else {
        arrowDirection = availableDirections.defaultDirection;
    }

    // return the calculated offsets and arrow direction
    return {
        offsetX: offsetX,
        offsetY: btnCenterOffset.y,
        direction: arrowDirection
    };
};

/**
 * Shows the tooltip dialog immediately.
 * @param {Component} that - The `gpii.app.qssTooltipDialog` instance.
 * @param {Object} btnCenterOffset - An object containing metrics for the QSS
 * button.
 */
gpii.app.qssTooltipDialog.show = function (that, btnCenterOffset) {
    var offsetAndDirection = gpii.app.qssTooltipDialog.getTooltipPosition(that, btnCenterOffset);

    that.dialog.setAlwaysOnTop(true);

    // reposition window properly
    that.setPosition(offsetAndDirection.offsetX, offsetAndDirection.offsetY);

    // apply the new arrow direction
    that.applier.change("arrowDirection", offsetAndDirection.direction);

    // Trigger the showing mechanism
    that.applier.change("isShown", true);
};
