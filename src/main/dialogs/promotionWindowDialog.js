/**
 * Promotion Window page BrowserWindow Dialog
 *
 * Introduces a component that uses an Electron BrowserWindow to represent a "Promotion Window" dialog.
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
"use strict";

var fluid = require("infusion");

require("./basic/dialog.js");

var gpii = fluid.registerNamespace("gpii");

/**
 * Component that represents the Promotion Window dialog
 */
fluid.defaults("gpii.app.promotionWindowDialog", {
    gradeNames: ["gpii.app.dialog"],

    siteConfig: {
        promoContentUrl: null,
        width: 200,
        height: 200,
        centered: false,
        resizable: false,
        movable: false,
        skipTaskbar: false,
        frame: false,
        transparent: false,
        alwaysOnTop: false,
        closeDelay: 0,
        showDelay: 0
    },

    closeDelay: "{that}.options.siteConfig.closeDelay",
    showDelay: "{that}.options.siteConfig.showDelay",

    config: {
        attrs: {
            width: "{that}.options.siteConfig.width",
            height: "{that}.options.siteConfig.height",
            centered: "{that}.options.siteConfig.centered",
            resizable: "{that}.options.siteConfig.resizable",
            movable: "{that}.options.siteConfig.resizable.movable",
            skipTaskbar: "{that}.options.siteConfig.resizable.skipTaskbar",
            frame: "{that}.options.siteConfig.resizable.frame",
            transparent: "{that}.options.siteConfig.transparent",
            alwaysOnTop: "{that}.options.siteConfig.alwaysOnTop"
        },
        params: {
            promoContentUrl: "{that}.options.siteConfig.promoContentUrl"
        },
        fileSuffixPath: "promotionWindow/index.html"
    },

    events: {
        delayedClose: null
    },
    listeners: {
        "delayedClose": {
            funcName: "{closeTimer}.start",
            args: ["{that}.options.closeDelay"]
        }
    },

    components: {
        channelListener: {
            type: "gpii.app.channelListener",
            options: {
                events: {
                    onPromotionWindowShow: null,
                    onCloseClicked: null
                },
                listeners: {
                    onPromotionWindowShow: {
                        funcName: "gpii.app.promotionWindowDialog.show",
                        args: [
                            "{promotionWindowDialog}",
                            "{showTimer}",
                            "{promotionWindowDialog}.options.siteConfig.offset.x",
                            "{promotionWindowDialog}.options.siteConfig.offset.y",
                            "{tray}"
                        ]
                    },
                    onCloseClicked: {
                        funcName: "{promotionWindowDialog}.close"
                    }
                }
            }
        },
        closeTimer: {
            type: "gpii.app.timer",
            options: {
                listeners: {
                    "onTimerFinished": {
                        funcName: "{promotionWindowDialog}.close"
                    }
                }
            }
        },
        showTimer: {
            type: "gpii.app.timer",
            options: {
                listeners: {
                    "onTimerFinished": {
                        funcName: "{promotionWindowDialog}.show"
                    }
                }
            }
        }
    }
});

/**
 * Shows the promotion window dialog. The '{promotionWindowDialog}.show' function
 * is invoked through the 'showTimer' component. If a delay is not specified
 * the promotion dialog will be shown without delay. This function also set the position
 * of the promotion dialog with given 'x' and 'y' offset. If offset 'x' and 'y' are not given
 * the window will be displayed with the default position (0, 0). If the 'centered' option
 * is specified, the dialog will be positioned in the center of the screen.
 * @param {gpii.app.promotionWindowDialog} that - The instance of the widget.
 * @param {Component} timer - An instance of `gpii.app.timer` used for showing
 * the widget with a delay.
 * @param {Number} offsetX - The x offset from the right edge of the screen.
 * @param {Number} offsetY - The y offset from the bottom edge of the screen.
 */
gpii.app.promotionWindowDialog.show = function (that, timer, offsetX, offsetY, tray) {
    if (that.options.siteConfig.positionByTrayIcon) {
        // getting the tray position only when it's required (siteConfig > positionByTrayIcon)
        var trayPosition = tray.getIconBounds(),
            screen = require("electron").screen,
            displaySize = { width: screen.getPrimaryDisplay().workAreaSize.width, height: screen.getPrimaryDisplay().workAreaSize.height },
            offset = {x: (displaySize.width - trayPosition.x) - (trayPosition.width / 2), y: (displaySize.height - trayPosition.y) + (trayPosition.height / 2)};
        console.log("===== gpii.app.promotionWindowDialog.show: tray.getIconBounds()");
        console.log(trayPosition, displaySize, offset);
        console.log("=======================");

        that.setPosition(offset.x, offset.y);
    } else if (that.options.siteConfig.centered) {
        // centering the promo window
        var centeredPosition = gpii.browserWindow.computeCentralWindowPosition(that.options.siteConfig.width, that.options.siteConfig.height);
        that.setPosition(centeredPosition.x, centeredPosition.y);
    } else if (offsetX || offsetY) {
        // setting the manual offset possition
        that.setPosition(offsetX, offsetY);
    }

    timer.start(that.options.showDelay);
};
