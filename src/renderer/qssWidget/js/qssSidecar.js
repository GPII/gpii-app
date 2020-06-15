/**
 * The grade that handles widget's sidecar content
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
     * Represents the sidecar extension of the widget
     */
    fluid.defaults("gpii.qssWidget.sidecar", {
        gradeNames: ["fluid.viewComponent", "gpii.psp.selectorsTextRenderer"],

        model: {
            sidecarContent: null,
            messages: {
                sidecarContent: "{that}.model.sidecarContent"
            }
        },

        selectors: {
            sidecarContent: ".flc-qssWidget-sidecar"
        },

        enableRichText: true,

        modelListeners: {
            "setting": {
                funcName: "gpii.qssWidget.sidecar.getSidecarMessage",
                args: ["{that}"]
            }
        }
    });

    /**
     * Adds the appropriate data in the sidecar based on the data available and the siteconfig's
     * osSettingsAvailable variable. If there is data in sidecarWithSettings and osSettingsAvailable
     * is true we are showing that, if not the base sidecar message is displayed.
     * @param {gpii.qssWidget.sidecar} that - The instance of the widget
     */
    gpii.qssWidget.sidecar.getSidecarMessage = function (that) {
        if (that.model.osSettingsAvailable && that.model.setting.sidecarWithSettings !== "") {
            that.applier.change("sidecarContent", that.model.setting.sidecarWithSettings, null, "fromWidget");
        } else {
            that.applier.change("sidecarContent", that.model.setting.sidecar, null, "fromWidget");
        }
    };
})(fluid);
