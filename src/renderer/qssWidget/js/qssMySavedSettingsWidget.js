/**
 * The QSS My saved settings widget
 *
 * TODO
 *
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
     * Represents the QSS My saved settings widget.
     */
    fluid.defaults("gpii.qssWidget.mySavedSettings", {
        gradeNames: ["fluid.viewComponent", "gpii.psp.selectorsTextRenderer"],

        model: {
            messages: {
                reApplyPreferencesButtonLabel: null,
                footerTip: "{that}.model.setting.widget.footerTip"
            }
        },

        enableRichText: true,
        selectors: {
            footerTip: ".flc-qssMySavedSettingsWidget-footerTip",
            reApplyPreferencesBtn: ".flc-reApplyPreferencesBtn"
        },

        listeners: {
            "onCreate.toggleView": {
                funcName: "gpii.qssWidget.mySavedSettings.toggleView",
                args: [
                    "{that}.dom.reApplyPreferencesBtn",
                    "{that}.dom.footerTip",
                    "{that}.options.lastEnvironmentalLoginGpiiKey"
                ]
            }
        },

        components: {
            reApplyPreferencesBtn: {
                type: "gpii.psp.widgets.button",
                container: "{that}.dom.reApplyPreferencesBtn",
                options: {
                    attrs: {
                        "aria-label": "{mySavedSettings}.model.messages.reApplyPreferencesButtonLabel"
                    },
                    model: {
                        label: "{mySavedSettings}.model.messages.reApplyPreferencesButtonLabel"
                    },
                    invokers: {
                        "onClick": "{channelNotifier}.events.onQssReApplyPreferencesRequired.fire"
                    }
                }
            }
        }
    });

    gpii.qssWidget.mySavedSettings.toggleView = function (autoKeyInView, tip, lastEnvironmentalLoginGpiiKey) {
        if (!lastEnvironmentalLoginGpiiKey) {
            autoKeyInView.hide();
            tip.show();
        } else {
            autoKeyInView.show();
            tip.hide();
        }
    };

})(fluid);
