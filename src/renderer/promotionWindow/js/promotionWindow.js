/**
 * The Promotion window dialog
 *
 * Represents the Promotion Window dialog.
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
     * A component representing the promotion window dialog. Takes care of initializing
     * the necessary DOM elements and handling user interaction.
     */
    fluid.defaults("gpii.psp.promotionWindow", {
        gradeNames: ["fluid.viewComponent", "gpii.psp.selectorsTextRenderer"],

        model: {
            messages: {
                content: null
            }
        },

        enableRichText: true,

        selectors: {
            content: ".flc-content",
            image: ".flc-image",
            closeBtn: ".flc-closeBtn"
        },
        listeners: {
            "onCreate.getContent": {
                funcName: "gpii.psp.promotionWindow.getContent",
                args: [
                    "{that}",
                    "{that}.dom.content",
                    "{that}.dom.image",
                    "{that}.dom.closeBtn",
                    "{channelNotifier}.events.onPromotionWindowShow"
                ]
            },
            "onCreate.addClickHandler": {
                this: "{that}.dom.closeBtn",
                method: "click",
                args: ["{channelNotifier}.events.onCloseClicked.fire"]
            }
        },

        components: {
            channelNotifier: {
                type: "gpii.psp.channelNotifier",
                options: {
                    events: {
                        onPromotionWindowShow: null,
                        onCloseClicked: null
                    }
                }
            }
        }
    });

    /**
     * Retrieving the url from siteConfig file and display content according to the file extension.
     * Also shows the close button if option is specified in the site config.
     * @param {gpii.psp.promotionWindow} that - The instance of the widget.
     * @param {jQuery} contentContainer - The DOM element representing the content container.
     * @param {jQuery} imageContainer - The DOM element representing the image container.
     * @param {jQuery} closeBtnContainer - The DOM element representing the close button container.
     * @param {fluid.event} event - The onPromotionWindowShow event.
     */
    gpii.psp.promotionWindow.getContent = function (that, contentContainer, imageContainer, closeBtnContainer, event) {
        // show the window only if the `showPromotionWindow` is set to true
        if (that.model.showPromotionWindow) {
            // show the close button if specified in site config file
            if (that.model.showCloseButton) {
                closeBtnContainer.show();
            }
            // getting the file extension of the promo data
            var fileExtension = gpii.windows.getFileExtension(that.model.url);

            if (fileExtension === ".png" || fileExtension === ".jpg" || fileExtension === ".svg") {
                // this is just an image, assigning the source to the url
                imageContainer.attr("src", that.model.url);
                event.fire();
            } else {
                // its a web page, loading the content into our container
                gpii.windows.getWebContent(that.model.url).then(function (contentData) {
                    contentContainer.append(contentData);
                    event.fire();
                });
            }
        }
    };

})(fluid);
