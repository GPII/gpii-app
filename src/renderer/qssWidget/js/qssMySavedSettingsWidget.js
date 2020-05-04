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
            },
            messageChannel: "mySavedSettingsMessageChannel" // Channel listening for messages related to auto key in functionality
        },

        enableRichText: true,
        selectors: {
            footerTip: ".flc-qssMySavedSettingsWidget-footerTip",
            reApplyPreferencesBtn: ".flc-reApplyPreferencesBtn"
        },

        listeners: {
            "onCreate.registerIpcListener": {
                funcName: "gpii.psp.registerIpcListener",
                args: ["{that}.model.messageChannel", "{that}.toggleView"]
            },
            "onCreate.sendGetRequest": {
                funcName: "{channelNotifier}.events.onQssGetEnvironmentalLoginKeyRequested.fire",
                args: ["{that}.model.messageChannel"]
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
                    listeners: {
                        "onClick.reApplyPreferences": "{channelNotifier}.events.onQssReApplyPreferencesRequired.fire"
                    }
                }
            }
        },

        invokers: {
            toggleView: {
                funcName: "gpii.qssWidget.mySavedSettings.toggleView",
                args: [
                    "{that}.dom.reApplyPreferencesBtn",
                    "{that}.dom.footerTip",
                    "{arguments}.0"
                ]
            }
        }
    });

    /**
     * Changes the view depending on the lastEnvironmentalLoginGpiiKey key
     * @param  {jQuery} autoKeyInView - DOM element for the autoKey in view
     * @param  {jQuery} tip - DOM element for the tip at the bottom
     * @param  {String} lastEnvironmentalLoginGpiiKey - contains the string of the last key used for the auto-keyin
     */
    gpii.qssWidget.mySavedSettings.toggleView = function (autoKeyInView, tip, lastEnvironmentalLoginGpiiKey) {
        // show the option to re-apply the preferences if there is auto-keyin option enabled
        if (!lastEnvironmentalLoginGpiiKey) {
            autoKeyInView.hide();
            tip.show();
        } else {
            autoKeyInView.show();
            tip.hide();
        }
    };

})(fluid);
