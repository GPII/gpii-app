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
        shell = require("electron").shell;

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
     * selectors. It simply adds text (using jquery .text) method)
     * to every selector element in case there exists a message
     * by the same name as the selector's.
     */
    fluid.defaults("gpii.psp.selectorsTextRenderer", {
        enableRichText: false,
        modelListeners: {
            // Any change means that the whole view should be re-rendered
            "messages": {
                funcName: "gpii.psp.selectorsTextRenderer.renderText",
                args: [
                    "{that}",
                    "{that}.options.selectors",
                    "{that}.model.messages",
                    "{that}.options.enableRichText"
                ]
            }
        }
    });

    /**
     * Sets (rich) text to dom elements using jQuery.
     * Text is added to an element ONLY if a message with the same name as the element's
     * selector property exists.
     * Example:
     *  selector - { signInHeader: ".flc-signInHeader" }
     *  uses a message of the type - { messages: { signInHeader: "Header text" } }
     *
     * @param {Component} that - The `gpii.psp.signIn` instance.
     * @param {Object} selectors - The viewComponent's selectors
     * @param {Object} messages - The translated text
     * @param {Boolean} enableRichText - Whether the messages can include rich text (e.g.
     * formatting markup). If `true`, measures will be taken to prevent possible scripts
     * in the message from executing.
     */
    gpii.psp.selectorsTextRenderer.renderText = function (that, selectors, messages, enableRichText) {
        if (!messages) {
            return;
        }

        fluid.each(selectors, function (value, key) {
            var element = that.dom.locate(key),
                message = messages[key];
            if (element && fluid.isValue(message)) {
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

    /**
     * A component which applies a zoom factor to the whole page.
     */
    fluid.defaults("gpii.psp.scaledPage", {
        gradeNames: "fluid.viewComponent",
        scaleFactor: 1,
        listeners: {
            onCreate: {
                funcName: "gpii.psp.scaledPage.setZoom",
                args: [
                    "{that}.options.scaleFactor"
                ]
            }
        }
    });

    /**
     * Applies a custom scaling factor to the whole HTML page by using the
     * css `zoom` property.
     * @param {Number} scaleFactor - The scaling factor to be applied. If
     * it is 1, this means that no scaling will be provided. If it is smaller
     * than 1, the page will shrink. Otherwise, it will get bigger.
     */
    gpii.psp.scaledPage.setZoom = function (scaleFactor) {
        $("body").css("zoom", scaleFactor);
    };
})(fluid, jQuery);
