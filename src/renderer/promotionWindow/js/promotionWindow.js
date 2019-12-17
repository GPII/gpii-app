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

        enableRichText: true,

        selectors: {
            title: ".flc-contentTitle",
            content: ".flc-content",
            image: ".flc-image"
        },
        listeners: {
            "onCreate.getContent": {
                funcName: "gpii.psp.promotionWindow.getContent",
                args: ["{that}", "{that}.dom.content", "{that}.dom.image"]
            }
        }
    });

    /** TODO
     * @param {gpii.psp.promotionWindow} that - The instance of the widget.
     */
    gpii.psp.promotionWindow.getContent = function (that, contentContainer, imageContainer) {
        var fileExtension = gpii.windows.getFileExtension(that.model.url);

        if (fileExtension === ".html" || !fileExtension) {
            gpii.windows.getWebContent(that.model.url).then(function (contentData) {
                contentContainer.append(contentData);
            }, function () {
                that.applier.change("messages.content", that.model.messages.error, null, "fromWidget");
            });
        } else if (fileExtension === ".png" || fileExtension === ".jpg" || fileExtension === ".svg") {
            imageContainer.attr("src", that.model.url);
        }
    };

})(fluid);
