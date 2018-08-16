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
            func: "{that}.setBounds",
            args: [
                "{that}.width",
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
 * Registers a listener to be called whenever the `display-metrics-changed`
 * event is emitted by the electron screen.
 * @param {Component} that - The `gpii.app.resizable` component.
 */
gpii.app.resizable.addDisplayMetricsListener = function (that) {
    electron.screen.on("display-metrics-changed", that.events.onDisplayMetricsChanged.fire);
};

// TODO
gpii.app.resizable.scaleDialog = function (that) {
    // reset it's position and size in order for the scale factor to be applied
    that.setBounds();

    // Correct the state of windows
    if (that.options.config.offScreenHide || that.model.isShown) {
        // low level show
        gpii.app.dialog._show(that, !that.displayMetricsChanged.wasFocused);
    }
};

/**
 * Handle electron's `display-metrics-changed` event by resizing the component if
 * necessary.
 * @param {Component} that - The `gpii.app.resizable` component.
 */
gpii.app.resizable.handleDisplayMetricsChange = function (that) {
    // Electron BrowserWindows are not resized automatically on Display Metrics Changes, so
    // manual resizing is necessary.
    // On the other when resizing an Electron BrowserWindow the width and height values that are passed
    // are altered according to the scale factor of the environment (DPI setting for Windows). In other words
    // calling the resize method with the same metrics will update the window with respect to the scaling.
    //
    // There's a problem with the `display-metrics-changed` event.
    // In older versions of Electron (e.g. 1.4.1) whenever the DPI was changed, one
    // `display-metrics-changed` event was fired. In newer versions (e.g. 1.8.1) the
    // `display-metrics-changed` event is fired multiple times. The change of the DPI
    // appears to be applied at different times on different machines. On some as soon
    // as the first `display-metrics-changed` event is fired, the DPI changes are
    // applied. On others, this is not the case until the event is fired again. That is
    // why for the resizing it best to happen only after the last time the event is fired to
    // ensure that the changes from the system have taken place in the dialog rendering unit
    // as well.
    // https://issues.gpii.net/browse/GPII-2890.


    // in case this is the first call notification of the display-metrics-changed event
    // hide the dialog, and keep its state
    if (!that.rescaleDialogTimer.isActive()) {
        that.displayMetricsChanged.wasFocused = that.dialog.isFocused();
        // low level hide
        that.dialog.hide();
    }

    // to ensure the DPI change has taken place, wait for a while after its last event
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
