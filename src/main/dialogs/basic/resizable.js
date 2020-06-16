/**
 * A component whose visual representation is resizable
 *
 * A component responsible for adjusting the dimensions of its visual representation
 * whenever the DPI or the content itself changes.
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

var gpii  = fluid.registerNamespace("gpii");

/**
 * A component responsible for adjusting the dimensions of its visual
 * representation (i.e. its corresponding `BrowserWindow`) whenever the
 * DPI or the content itself changes.
 *
 * The implementors must provide a concrete implementation of the `setBounds`
 * invoker. The initial dimensions of the `BrowserWindow` must be specified
 * in the `config.attrs` property.
 */
fluid.defaults("gpii.app.resizable", {
    gradeNames: ["fluid.component"],
    model: {
        scaleFactor: null,
        maxScaleFactor: null
    },
    members: {
        beforeRescale: {
            wasFocused: null,
            awaitingRescale: null
        }
    },

    /*
     * A delay in ms after a `displayMetricsChanged` event has occurred and
     * before the dialog corresponding dialog gets its position and size "refreshed".
     * Refer to `gpii.app.resizable.handleDisplayMetricsChange` for more details.
     */
    refreshTimeout: 1800,

    config: {
        attrs: {
            width: null,
            height: null
        }
    },
    events: {
        onDisplayMetricsChanged: null,
        /*
         * Should be called whenever a change in the size of the component's
         * content is detected from within the content itself.
         */
        onContentHeightChanged: null
    },
    listeners: {
        "onCreate.addDisplayMetricsListener": {
            func: "gpii.app.resizable.addDisplayMetricsListener",
            args: ["{that}"]
        },
        "onCreate.setMaxScaleFactor": {
            changePath: "maxScaleFactor",
            value: "{that}.model.scaleFactor"
        },
        "onCreate.scaleOnCreate": {
            func: "{that}.fitToScreen",
            priority: "last"
        },
        "onContentHeightChanged": {
            funcName: "gpii.app.resizable.handleContentHeightChange",
            args: [
                "{that}",
                "{arguments}.0" // height
            ]
        },
        "onDisplayMetricsChanged.handleDisplayMetricsChange": {
            func: "gpii.app.resizable.handleDisplayMetricsChange",
            args: [
                "{that}"
            ]
        },
        "onDestroy.removeDisplayMetricsListener": {
            func: "gpii.app.resizable.removeDisplayMetricsListener",
            args: ["{that}"]
        }
    },

    components: {
        refreshDialogTimeout: {
            type: "gpii.app.timer",
            options: {
                listeners: {
                    onTimerFinished: {
                        func: "gpii.app.resizable.refreshDialog",
                        args: "{resizable}"
                    }
                }
            }
        }
    },
    invokers: {
        setBounds: {
            funcName: "fluid.notImplemented",
            args: [
                "{arguments}.0", // width
                "{arguments}.1", // height
                "{arguments}.2", // offsetX
                "{arguments}.3"  // offsetY
            ]
        },
        computeScaleFactor: {
            funcName: "gpii.app.resizable.computeScaleFactor",
            args: ["{that}"]
        },
        fitToScreen: {
            funcName: "gpii.app.resizable.fitToScreen",
            args: ["{that}"]
        }
    }
});

/**
 * Handles the change in the height of the content for this component's
 * dialog. Simply invokes `setBounds` with the current width and the new
 * height (scaled by the `scaleFactor`).
 * @param {Component} that - The `gpii.app.resizable` component.
 * @param {Number} height - The new height of the dialog's content.
 */
gpii.app.resizable.handleContentHeightChange = function (that, height) {
    var scaleFactor = that.model.scaleFactor;
    height = Math.ceil(scaleFactor * height);
    that.setBounds(that.model.width, height);
};

/**
 * Registers a listener to be called whenever the `display-metrics-changed`
 * event is emitted by the electron screen.
 * @param {Component} that - The `gpii.app.resizable` component.
 */
gpii.app.resizable.addDisplayMetricsListener = function (that) {
    electron.screen.on("display-metrics-changed", that.events.onDisplayMetricsChanged.fire);
};

/**
 * Calculates what the scaleFactor should be so that the visual representation of
 * the current component can completely fit into the available screen space. In any
 * case the new `scaleFactor` cannot be larger than the originally specified
 * `maxScaleFactor`.
 * @param {Component} that - The `gpii.app.resizable` component.
 * @return {Number} - The new scale factor.
 */
gpii.app.resizable.computeScaleFactor = function (that) {
    var screenSize = electron.screen.getPrimaryDisplay().workAreaSize,
        extendedWidth = that.getExtendedWidth(),
        scaleFactor = ((screenSize.width / extendedWidth) * that.model.scaleFactor).toFixed(2);

    return Math.min(scaleFactor, that.model.maxScaleFactor);
};

/**
 * Resizes the dialog so that it fits in the available screen size by adjusting
 * the `scaleFactor`.
 * @param {Component} that - The `gpii.app.resizable` component.
 */
gpii.app.resizable.fitToScreen = function (that) {
    // check for preventing a weird bug related to GPII-3822
    if (that.typeName !== "gpii.app.qssTooltipDialog") {
        // getting the scale factor
        var scaleFactor = that.computeScaleFactor();

        // changing the scale factor only if its different in the current one
        if (scaleFactor !== that.model.scaleFactor) {
            that.applier.change("scaleFactor", scaleFactor);
        }
        that.setBounds();
    }
};

/**
 * Positions and sizes the hidden dialogs correctly. Also shows them back up.
 * @param {Component} that - The `gpii.app.resizable` instance
 */
gpii.app.resizable.refreshDialog = function (that) {
    // Ensure the dialog is in correct state.
    // There was a problem with changing the position of a dialog when rescaling is about
    // to take place, thus, in case it is offScreenHidable, its state might get corrupted
    if (!that.model.isShown) {
        // access lowlevel hide implementation
        that.hideImpl();
    }

    if (that.options.config.hideOffScreen) {
        // As we're using a normal BrowserWindow hide, we'd always need to
        // apply the normal BrowserWindow show to offScreen hidden windows.
        gpii.app.dialog.showImpl(that, !that.beforeRescale.wasFocused);
    } else if (that.model.isShown) {
        that.showImpl(that, !that.beforeRescale.wasFocused);
    }

    that.beforeRescale.awaitingRescale = false;

    that.fitToScreen();
};

/**
 * Handle electron's `display-metrics-changed` event by resizing the component if
 * necessary.
 * @param {Component} that - The `gpii.app.resizable` component.
 */
gpii.app.resizable.handleDisplayMetricsChange = function (that) {
    /**
     * There is a notorious issue about wrong positioning and sizing of Electron `BrowserWindow`s
     * when the screen DPI has a value different from 1: https://github.com/electron/electron/issues/10862.
     * We tried to employ different strategies to work around this issue but the biggest problem
     * with all of them is that the `display-metrics-changed` event is probably not fired when the
     * DPI change has been completely applied. Thus, there is no way to know when to resize the
     * dialogs in the GPII app.
     *
     * The current approach for handling this situation is as follows:
     * Whenever a change in the DPI occurs, multiple `display-metrics-changed` events are fired. During
     * the first event, the dialog is hidden and a resizing timer is started. If more `display-metrics-changed`
     * continue to arrive, the timer that has been started is discarded and a new timer is started.
     * When the time is up, the DPI changes are considered to be applied successfully and the dialog can
     * be resized/repositioned and shown again.
     */

    // repositioning promotion window dialog
    if (that.typeName === "gpii.app.promotionWindowDialog") {
        that.events.onRepositioningRequired.fire();
    };

    if (!that.beforeRescale.awaitingRescale) {
        that.beforeRescale = {
            wasFocused: electron.BrowserWindow.getFocusedWindow() === that.dialog,
            awaitingRescale: true
        };

        that.dialog.hide();
    }

    // it would restart the timer
    that.refreshDialogTimeout.start(that.options.refreshTimeout);
};

/**
 * Removes the listener for the `display-metrics-changed` event. This should
 * be done when the component gets destroyed in order to avoid memory leaks.
 * @param {Component} that - The `gpii.app.resizable` component.
 */
gpii.app.resizable.removeDisplayMetricsListener = function (that) {
    electron.screen.removeListener("display-metrics-changed", that.events.onDisplayMetricsChanged.fire);
};
