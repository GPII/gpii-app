/**
 * The grade that handles widget's sideCart content
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

"use strict";
(function (fluid) {
    var gpii = fluid.registerNamespace("gpii");

    /**
     * Represents the QSS Translate Tools widget.
     */
    fluid.defaults("gpii.qssWidget.sideCart", {
        gradeNames: ["fluid.viewComponent", "gpii.psp.selectorsTextRenderer"],

        model: {
            sideCartContent: null,
            messages: {
                sideCartContent: "{that}.model.sideCartContent"
            }
        },

        selectors: {
            sideCartContent: ".flc-qssWidget-sidecart"
        },

        enableRichText: true,

        modelListeners: {
            "setting.sideCart": {
                funcName: "gpii.qssWidget.sideCart.getSideCartMessage",
                args: ["{that}"]
            }
        }
    });

    /**
     * Adds the appropriate data in the sideCart based on the data available and the siteconfig's
     * osSettingsAvailable variable. If there is data in sideCartWithSettings and osSettingsAvailable
     * is true we are showing that, if not the base sideCart message is displayed.
     * @param  {Component} that - The instance of the widget
     */
    gpii.qssWidget.sideCart.getSideCartMessage = function (that) {
        if (that.model.osSettingsAvailable && that.model.setting.sideCartWithSettings !== "") {
            that.applier.change("sideCartContent", that.model.setting.sideCartWithSettings, null, "fromWidget");
        } else {
            that.applier.change("sideCartContent", that.model.setting.sideCart, null, "fromWidget");
        }
    };
})(fluid);
