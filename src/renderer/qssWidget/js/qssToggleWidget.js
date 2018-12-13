/**
 * The QSS toggle widget
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
     * Represents the QSS toggle widget.
     */
    fluid.defaults("gpii.qssWidget.toggle", {
        gradeNames: ["fluid.viewComponent", "gpii.psp.selectorsTextRenderer"],

        selectors: {
            toggleButton: ".flc-toggleButton",
            helpImage: ".flc-qssToggleWidget-helpImage",
            extendedTip: ".flc-qssWidget-extendedTip",
            settingTitle: ".flc-qssToggleWidget-settingTitle"
        },

        enableRichText: true,

        model: {
            setting: {},
            value: "{that}.model.setting.value"
        },

        modelListeners: {
            "setting.value": {
                func: "{channelNotifier}.events.onQssWidgetSettingAltered.fire",
                args: ["{that}.model.setting"],
                includeSource: "settingAlter"
            },
            "setting.schema.helpImage": {
                this: "{that}.dom.helpImage",
                method: "attr",
                args: ["src", "{change}.value"]
            },
            "setting.schema.title": {
                this: "{that}.dom.settingTitle",
                method: "text",
                args: ["{change}.value"]
            }
        },

        components: {
            toggleButton: {
                type: "gpii.psp.widgets.switch",
                container: "{that}.dom.toggleButton",
                options: {
                    model: {
                        enabled: "{gpii.qssWidget.toggle}.model.value"
                    },
                    invokers: {
                        toggleModel: {
                            funcName: "gpii.qssWidget.toggle.toggleModel",
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
    gpii.qssWidget.toggle.toggleModel = function (that) {
        that.applier.change("enabled", !that.model.enabled, null, "settingAlter");
    };
})(fluid);
