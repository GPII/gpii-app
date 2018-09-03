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
    config: {
        attrs: {
            width: null,
            height: null
        }
    },
    members: {
        // helper variables needed for display metrics changes
        displayMetricsChanged: {
            wasFocused: null
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
        rescaleDialogTimer: {
            type: "gpii.app.timer",
            options: {
                listeners: {
                    onTimerFinished: {
                        funcName: "gpii.app.resizable.scaleDialog",
                        args: ["{gpii.app.resizable}"]
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
                "{arguments}.1",  // height
                "{arguments}.2", // offsetX
                "{arguments}.3"  // offsetY
            ]
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
    var scaleFactor = that.options.scaleFactor || 1;
    height = Math.ceil(scaleFactor * height);
    that.setBounds(that.width, height);
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
 * Scales the current dialog as a result of a `display-metrics-changed` event.
 * Note that this function will reset the position and the size of the dialog
 * so that the scale factor can be applied.
 * @param {Component} that - The `gpii.app.resizable` component.
 */
gpii.app.resizable.scaleDialog = function (that) {
    that.setBounds();

    // Show the dialog if it was shown when a `display-metrics-changed` event occurred
    if (that.options.config.hideOffScreen || that.model.isShown) {
        // Use the low level show
        gpii.app.dialog.showImpl(that, !that.displayMetricsChanged.wasFocused);
    }
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
    if (!that.rescaleDialogTimer.isActive()) {
        that.displayMetricsChanged.wasFocused = that.dialog.isFocused();
        // Low level hide - hides the dialog but preserves the `isShown` model state of its component.
        that.dialog.hide();
    }

    that.rescaleDialogTimer.start(1000);
};

/**
 * Removes the listener for the `display-metrics-changed` event. This should
 * be done when the component gets destroyed in order to avoid memory leaks.
 * @param {Component} that - The `gpii.app.resizable` component.
 */
gpii.app.resizable.removeDisplayMetricsListener = function (that) {
    electron.screen.removeListener("display-metrics-changed", that.events.onDisplayMetricsChanged.fire);
};
