/**
 * Initializes the promotion window dialog
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
    var gpii = fluid.registerNamespace("gpii"),
        electron = require("electron"),
        windowInitialParams = electron.remote.getCurrentWindow().params;

    /**
     * Wrapper that enables translations for the `gpii.psp.promotionDialog` component.
     */
    fluid.defaults("gpii.psp.translatedPromotionWindow", {
        gradeNames: ["gpii.psp.messageBundles", "fluid.viewComponent", "gpii.psp.linksInterceptor"],

        components: {
            promotionWindow: {
                type: "gpii.psp.promotionWindow",
                container: "{translatedPromotionWindow}.container",
                options: {
                    model: {
                        url: "{translatedPromotionWindow}.model.url",
                        showPromotionWindow: "{translatedPromotionWindow}.model.showPromotionWindow",
                        showCloseButton: "{translatedPromotionWindow}.model.showCloseButton"
                    }
                }
            }
        }
    });

    $(function () {
        gpii.psp.translatedPromotionWindow(".fl-dialog", {
            model: {
                url: windowInitialParams.promoContentUrl,
                showPromotionWindow: windowInitialParams.showPromotionWindow,
                showCloseButton: windowInitialParams.showCloseButton
            }
        });
    });
})(fluid);
