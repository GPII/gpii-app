/**
 * Generic utilities for the renderer
 *
 * Contains utility functions and components shared between different BrowserWindows.
 * Copyright 2017 Raising the Floor - International
 *
 * Licensed under the New BSD license. You may not use this file except in
 * compliance with this License.
 * The research leading to these results has received funding from the European Union's
 * Seventh Framework Programme (FP7/2007-2013) under grant agreement no. 289016.
 * You may obtain a copy of the License at
 * https://github.com/GPII/universal/blob/master/LICENSE.txt
 */

/* global fluid, jQuery */

"use strict";
(function (fluid, jQuery) {
    var gpii = fluid.registerNamespace("gpii"),
        shell = require("electron").shell,
        ipcRenderer = require("electron").ipcRenderer,
        child_process = require("child_process");

    fluid.registerNamespace("gpii.psp");

    /**
     * An implementation of the modulation operation which resolves the
     * notorious "JavaScrip Modulo bug".
     * @param {Number} a - The dividend
     * @param {Number} b - The divisor
     * @return {Number} The remainder - a number in the range [0, Math.abs(b) - 1]
     */
    gpii.psp.modulo = function (a, b) {
        return ((a % b) + b) % b;
    };

    /**
     * Opens the passed url externally using the default browser for the
     * OS (or set by the user).
     * @param {String} url - The url to open externally.
     */
    gpii.psp.openUrlExternally = function (url) {
        shell.openExternal(url);
    };


    /**
     * Executes the file from the shareXPath with the combination of the command
     * @param {String} command - shareX command, example: "Morphic: Capture entire screen to desktop"
     * @param {String} shareXPath - the path and executable name, example: "C:\\sharex-portable\\sharex.exe"
     * @return {Boolean} - returns true on successful command execution
     */
    gpii.psp.execShareXCommand = function (command, shareXPath) {
        // creates the command line, it should looks something like:
        // "C:\\sharex-portable\\sharex.exe" -workflow "Morphic: Capture entire screen to desktop"
        var commandToExecute = "\"" + shareXPath + "\" -workflow \"" + command + "\"";

        try {
            child_process.exec(commandToExecute);
            return true;
        } catch (err) {
            fluid.log(fluid.logLevel.WARN, "execShareXCommand: Cannot execute - " + commandToExecute);
        }
        return false;
    };

    /**
     * Registers an IPC listener event and executes the provided function on result
     * @param {String} messageChannel - The channel to which the message should be sent.
     * @param {Function} funcExec - handle to the function to be executed
     * @param {Component} presenter - The `gpii.qssWidget.WIDGETNAME.presenter` instance.
     * @param {Component} widget - The `gpii.qssWidget.WIDGETNAME` instance.
     */
    gpii.psp.registerIpcListener = function(messageChannel, funcExec, presenter, widget) {
        ipcRenderer.on(messageChannel, function (event, result) {
            // execute the function when the result arrives
            funcExec(presenter, widget, result);
        });
    };

    /**
     * Clears all of the I{C event listeners}
     * @param {String} messageChannel - The channel to which the message should be sent.
     */
    gpii.psp.removeIpcAllListeners = function(messageChannel) {
        ipcRenderer.removeAllListeners(messageChannel);
    };

    /**
     * Plays a sound identified by an absolute path or a URL to it.
     * @param {String} soundPath - The path or URL of the sound to play.
     */
    gpii.psp.playSound = function (soundPath) {
        if (soundPath) {
            var sound = new Audio(soundPath);
            sound.play();
        }
    };

    /**
     * Replaces all anchor tags that are not "#" links to open in an
     * external browser.
     */
    gpii.psp.interceptLinks = function () {
        jQuery(document).on("click", "a:not([href^='#'])", function (event) {
            event.preventDefault();
            gpii.psp.openUrlExternally(this.href);
        });
    };

    /**
     * Returns the DOM element (wrapped in a jQuery object) corresponding to the
     * `widgetGrade` which is provided. The last part of the widget grade name (i.e.
     * everything after the last dot) is the key of the selector which should be
     * located in the DOM.
     * @param {jQuery} domElement - jQuery DOM element.
     * @param {String} widgetGrade - A grade name for the widget component.
     * @return {jQuery} The jQuery element representing the element in the DOM or
     * `undefined` if there is no such element.
     */
    gpii.psp.widgetGradeToSelectorName = function (domElement, widgetGrade) {
        if (widgetGrade) {
            var lastDotIndex = widgetGrade.lastIndexOf("."),
                selector = widgetGrade.substring(lastDotIndex + 1);
            return domElement.locate(selector);
        }
    };

    /**
     * A wrapper that adds the replacing of the normal behaviour
     * of all anchor tags to open the specified link in an external
     * (default) browser.
     */
    fluid.defaults("gpii.psp.linksInterceptor", {
        listeners: {
            "onCreate.interceptLinks": {
                funcName: "gpii.psp.interceptLinks"
            }
        }
    });

    /**
     * Render text for DOM elements referenced by component's
     * selectors. It simply adds text (using jquery .text method)
     * to every selector element in case there exists a string
     * by the same name as the selector's.
     * This is done with the only `renderText` invoker which needs the
     * map of strings to be given. In case these strings need to be
     * interpolated, optionally a "values" map can also be given.
     */
    fluid.defaults("gpii.psp.selectorsTextRenderer", {
        enableRichText: false,

        model: {
            messages: null,
            // list of values to be used for messages interpolation
            values: null
        },
        modelListeners: {
            // Any change means that the whole view should be re-rendered
            // messages are a default option as it is most likely that
            // we'll need these to be re-rendered
            "messages": {
                funcName: "{that}.renderText",
                args: [
                    "{that}.model.messages",
                    "{that}.model.values"
                ],
                namespace: "renderText"
            }
        },
        invokers: {
            // This is to be used with model listeners
            renderText: {
                funcName: "gpii.psp.selectorsTextRenderer.renderText",
                args: [
                    "{that}",
                    "{that}.options.enableRichText",
                    "{that}.options.selectors",
                    "{arguments}.0", // strings
                    "{arguments}.1"  // values (used for interpolation)
                ]
            }
        }
    });

    /**
     * Sets (rich) text to dom elements using jQuery.
     * Text is added to an element ONLY if a string with the same name as the element's
     * selector property exists.
     * Example:
     *  selector - { signInHeader: ".flc-signInHeader" }
     *  uses a message of the type - { signInHeader: "Header text" }
     *
     * @param {Component} that - The `gpii.psp.signIn` instance.
     * @param {Boolean} enableRichText - Whether the strings can include rich text (e.g.
     * formatting markup). If `true`, measures will be taken to prevent possible scripts
     * in the message from executing.
     * @param {Object} selectors - The viewComponent's selectors
     * @param {Object} strings - The strings to be used for rendering
     * @param {Object} [values] - The value to be used for interpolation of the strings. This
     * is passed as it is to the `fluid.stringTemplate` method, meaning that the names must match.
     */
    gpii.psp.selectorsTextRenderer.renderText = function (that, enableRichText, selectors, strings, values) {
        if (!strings) {
            return;
        }

        fluid.each(selectors, function (value, key) {
            var element = that.dom.locate(key),
                message = strings[key];
            if (element && fluid.isValue(message)) {
                // interpolate the string with missing values
                message = fluid.stringTemplate(message, values || {});
                if (enableRichText) {
                    // Use parseHTML to prevent scripts from executing.
                    var parsedMessage = jQuery.parseHTML(message);
                    element.html(parsedMessage);
                } else {
                    element.text(message);
                }
            }
        });
    };
})(fluid, jQuery);
