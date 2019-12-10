/**
 * The Promotion window dialog
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
        TODO
     */
    fluid.defaults("gpii.psp.promotionWindow", {
        gradeNames: ["fluid.viewComponent", "gpii.psp.selectorsTextRenderer"],

        model: {
            messages: {
                content: null,
                error: null
            }
        },
        selectors: {
            title: ".flc-contentTitle",
            content: ".flc-content"
        },
        modelListeners: {
            "messages.content": {
                this: "{that}.dom.content",
                method: "html",
                args: ["{change}.value"]
            }
        },
        listeners: {
            "onCreate.getContent": {
                funcName: "gpii.psp.promotionWindow.getContent",
                args: ["{that}"]
            }
        }
    });

    /** TODO
     * @param {gpii.psp.promotionWindow} that - The instance of the widget.
     */
    gpii.psp.promotionWindow.getContent = function (that) {
        gpii.windows.getWebContent(that.model.url).then(function (contentData) {
            that.applier.change("messages.content", contentData, null, "fromWidget");
        }, function () {
            that.applier.change("messages.content", that.model.messages.error, null, "fromWidget");
        });
    };

})(fluid);
