/**
 * The QSS Translate Tools widget
 *
 * The button is only informational and it simply have text and links on it.
 * Copyright 2017 Raising the Floor - International
 *
 * Licensed under the New BSD license. You may not use this file except in
 * compliance with this License.
 * The research leading to these results has received funding from the European Union's
 * Seventh Framework Programme (FP7/2007-2013) under grant agreement no. 289016.
 * You may obtain a copy of the License at
 * https://github.com/GPII/universal/blob/master/LICENSE.txt
 */

/* global fluid */

"use strict";
(function (fluid) {
    /**
     * Represents the QSS Translate Tools widget.
     */
    fluid.defaults("gpii.qssWidget.translateTools", {
        gradeNames: ["fluid.viewComponent", "gpii.psp.selectorsTextRenderer", "gpii.psp.heightObservable"],

        selectors: {
            heightListenerContainer: ".flc-qssTranslateToolsWidget-controls",
            controlsWrapper: ".flc-qssTranslateToolsWidget-controlsWrapper"
        },

        enableRichText: true,

        events: {
            onHeightChanged: null
        },

        invokers: {
            calculateHeight: {
                funcName: "gpii.qssWidget.calculateHeight",
                args: [
                    "{qssWidget}.container",
                    "{that}.dom.controlsWrapper",
                    "{that}.dom.heightListenerContainer"
                ]
            }
        }
    });

})(fluid);
