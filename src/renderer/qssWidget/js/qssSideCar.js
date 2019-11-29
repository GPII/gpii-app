/**
 * The grade that handles widget's sideCar content
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
     * Represents the sideCar extension of the widget
     */
    fluid.defaults("gpii.qssWidget.sideCar", {
        gradeNames: ["fluid.viewComponent", "gpii.psp.selectorsTextRenderer"],

        model: {
            sideCarContent: null,
            messages: {
                sideCarContent: "{that}.model.sideCarContent"
            }
        },

        selectors: {
            sideCarContent: ".flc-qssWidget-sidecar"
        },

        enableRichText: true,

        modelListeners: {
            "setting.sideCar": {
                funcName: "gpii.qssWidget.sideCar.getSideCarMessage",
                args: ["{that}"]
            }
        }
    });

    /**
     * Adds the appropriate data in the sideCar based on the data available and the siteconfig's
     * osSettingsAvailable variable. If there is data in sideCarWithSettings and osSettingsAvailable
     * is true we are showing that, if not the base sideCar message is displayed.
     * @param  {Component} that - The instance of the widget
     */
    gpii.qssWidget.sideCar.getSideCarMessage = function (that) {
        if (that.model.osSettingsAvailable && that.model.setting.sideCarWithSettings !== "") {
            that.applier.change("sideCarContent", that.model.setting.sideCarWithSettings, null, "fromWidget");
        } else {
            that.applier.change("sideCarContent", that.model.setting.sideCar, null, "fromWidget");
        }
    };
})(fluid);
