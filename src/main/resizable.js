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
 * The implementors must provide a concrete implementation of the `resize`
 * invoker. The initial dimensions of the `BrowserWindow` must be specified
 * in the `config.attrs` property.
 */
fluid.defaults("gpii.app.resizable", {
    gradeNames: ["fluid.component"],
    config: {
        attrs: {
            width: null, // the initial width of the `BrowserWindow`
            height: null // the initial height of the `BrowserWindow`
        }
    },
    members: {
        width: null, // the actual width of the content
        height: null, // the actual height of the content
        // helper variables needed for display metrics changes
        displayMetricsChanged: {
            timer: null,
            wasShown: null
        }
    },
    events: {
        onContentHeightChanged: null,
        onDisplayMetricsChanged: null
    },
    listeners: {
        "onCreate.addDisplayMetricsListener": {
            func: "gpii.app.resizable.addDisplayMetricsListener",
            args: ["{that}"]
        },
        "onContentHeightChanged": {
            funcName: "gpii.app.resizable.onContentSizeChanged",
            args: [
                "{that}",
                "{that}.options.config.attrs.width",
                "{arguments}.0" // height
            ]
        },
        "onDisplayMetricsChanged.handleDisplayMetricsChange": {
            func: "gpii.app.resizable.handleDisplayMetricsChange",
            args: [
                "{that}",
                "{arguments}.2" // changedMetrics
            ]
        },
        "onDestroy.removeDisplayMetricsListener": {
            func: "gpii.app.resizable.removeDisplayMetricsListener",
            args: ["{that}"]
        }
    },
    invokers: {
        resize: {
            funcName: "fluid.notImplemented",
            args: [
                "{arguments}.0", // width
                "{arguments}.1"  // height
            ]
        }
    }
});


/**
 * Registers a listener to be called whenever the `display-metrics-changed`
 * event is emitted by the electron screen.
 * @param that {Component} The `gpii.app.resizable` component.
 */
gpii.app.resizable.addDisplayMetricsListener = function (that) {
    electron.screen.on("display-metrics-changed", that.events.onDisplayMetricsChanged.fire);
};

/**
 * Should be called whenever a change in the size of the component's
 * content is detected from within the content itself.
 * @param that {Component} The `gpii.app.resizable` component.
 * @param width {Number} The updated width of the componet's content.
 * @param height {Number} The updated height of the componet's content.
 */
gpii.app.resizable.onContentSizeChanged = function (that, width, height) {
    that.width = width;
    that.height = height;
    that.resize(width, height);
};

/**
 * Handle electron's display-metrics-changed event by resizing the component if
 * necessary.
 * @param that {Component} The `gpii.app.resizable` component.
 * @param changedMetrics {Array} An array of strings that describe the changes.
 * Possible changes are `bounds`, `workArea`, `scaleFactor` and `rotation`
 */
gpii.app.resizable.handleDisplayMetricsChange = function (that, changedMetrics) {
    // In older versions of Electron (e.g. 1.4.1) whenever the DPI was changed, one
    // `display-metrics-changed` event was fired. In newer versions (e.g. 1.8.1) the
    // `display-metrics-changed` event is fired multiple times. The change of the DPI
    // appears to be applied at different times on different machines. On some as soon
    // as the first `display-metrics-changed` event is fired, the DPI changes are
    // applied. On others, this is not the case until the event is fired again. That is
    // why the resizing should happen only the second (or third) time the
    // `display-metrics-changed` event is fired in which case the changedMetrics argument
    // will not include the `scaleFactor` string. For more information please take a look
    // at https://issues.gpii.net/browse/GPII-2890.
    // 
    // Electron BrowserWindows are not resized automatically on Display Metrics Changes, so
    // manual resizing is necessary.
    // On the other resizing an Electron BrowserWindow the passed width and height values are altered
    // according to the scale factor of the environment (DPI setting for Windows). In other words
    // calling the resize method with the same size will update the window with respect to the scaling.
    function scaleDialog() {
        var attrs = that.options.config.attrs,
            width = that.width || attrs.width,
            height = that.height || attrs.height;

        that.resize(width, height);

        // reset the timer state
        that.displayMetricsChanged.timer = null;
        if (that.displayMetricsChanged.wasShown) {
            that.show();
        }
    }

    // in case this is the first call notification of the display-metrics-changed event
    // hide the dialog, and keep its state
    if (!that.displayMetricsChange.timer) {
        that.displayMetricsChanged.wasShown = that.model.isShown;
        that.hide();
    }

    // to ensure the DPI change has taken place, wait for a while after its last event
    clearTimeout(that.displayMetricsChanged.timer);
    that.displayMetricsChanged.timer = setTimeout(scaleDialog, 400);
};

/**
 * Removes the listener for the `display-metrics-changed` event. This should
 * be done when the component gets destroyed in order to avoid memory leaks.
 * @param that {Component} The `gpii.app.resizable` component.
 */
gpii.app.resizable.removeDisplayMetricsListener = function (that) {
    electron.screen.removeListener("display-metrics-changed", that.events.onDisplayMetricsChanged.fire);
};
