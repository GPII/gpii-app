/**
 * The QSS base toggle widget
 *
 * Represents the quick set strip toggle widget. It is used for adjusting the
 * values of "boolean" settings.
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
    var gpii = fluid.registerNamespace("gpii");

    /**
     * Represents the QSS base toggle widget.
     */
    fluid.defaults("gpii.qssWidget.baseToggle", {
        gradeNames: ["fluid.viewComponent", "gpii.psp.selectorsTextRenderer"],

        selectors: {
            toggleButton: ".flc-toggleButton",
            settingTitle: ".flc-qssBaseToggleWidget-settingTitle"
        },

        enableRichText: true,

        model: {
            setting: {},
            value: "{that}.model.setting.value",
            messages: {
                settingTitle: "{that}.model.setting.schema.title"
            }
        },

        modelListeners: {
            "setting.value": {
                func: "{channelNotifier}.events.onQssWidgetSettingAltered.fire",
                args: ["{that}.model.setting"],
                includeSource: "settingAlter"
            }
        },

        components: {
            toggleButton: {
                type: "gpii.psp.widgets.switch",
                container: "{that}.dom.toggleButton",
                options: {
                    model: {
                        enabled: "{gpii.qssWidget.baseToggle}.model.value"
                    },
                    invokers: {
                        toggleModel: {
                            funcName: "gpii.qssWidget.baseToggle.toggleModel",
                            args: ["{that}"]
                        }
                    }
                }
            }
        }
    });

    /**
     * Invoked whenever the user has activated the "switch" UI element (either
     * by clicking on it or pressing "Space" or "Enter"). What this function
     * does is to change the `enabled` model property to its opposite value.
     * @param {Component} that - The `gpii.psp.widgets.switch` instance.
     */
    gpii.qssWidget.baseToggle.toggleModel = function (that) {
        that.applier.change("enabled", !that.model.enabled, null, "settingAlter");
    };
})(fluid);
