/*!
PSP titlebar

Contains a component representing the titlebar of the PSP.
Copyright 2017 Raising the Floor - International

Licensed under the New BSD license. You may not use this file except in
compliance with this License.
The research leading to these results has received funding from the European Union's
Seventh Framework Programme (FP7/2007-2013) under grant agreement no. 289016.
You may obtain a copy of the License at
https://github.com/GPII/universal/blob/master/LICENSE.txt
*/

/* global fluid */

"use strict";
(function (fluid) {
    /**
     * A component representing the titlebar of a window. Contains the application
     * icon, the application title (given by implementor), as well as
     * a button for closing the window.
     */
    fluid.defaults("gpii.psp.titlebar", {
        gradeNames: ["fluid.viewComponent"],
        selectors: {
            title: ".flc-title",
            closeBtn: ".flc-closeBtn"
        },
        events: {
            onClose: null
        },

        model: {
            messages: {
                title: null
            }
        },

        modelListeners: {
            "messages.title": {
                this: "{that}.dom.title",
                method: "text",
                args: ["{change}.value"]
            }
        },

        components: {
            closeBtn: {
                type: "gpii.psp.titlebar.closeBtn",
                container: "{that}.dom.closeBtn"
            }
        }
    });

    fluid.defaults("gpii.psp.titlebar.closeBtn", {
        gradeNames: [
            "fluid.viewComponent",
            "gpii.qss.elementRepeater.keyListener",
            "gpii.qss.elementRepeater.clickable"
        ],

        attrs: {
            "aria-label": "Close"
        },

        events: {
            onSpacebarPressed: null,
            onEnterPressed: null
        },

        listeners: {
            "onClicked.activate": {
                func: "{that}.activate",
                args: [
                    {key: null}
                ]
            },
            "onSpacebarPressed.activate": {
                func: "{that}.activate",
                args: [
                    {key: "Spacebar"}
                ]
            },
            "onEnterPressed.activate": {
                func: "{that}.activate",
                args: [
                    {key: "Enter"}
                ]
            }
        },

        invokers: {
            activate: {
                this: "{titlebar}.events.onClose",
                method: "fire",
                args: "{arguments}.0"
            }
        }
    });
})(fluid);
