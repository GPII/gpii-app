/**
 * The about dialog
 *
 * Represents an about dialog that can be closed by the user.
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
     * Represents the controller for the about dialog
     * that gives information for the application version,
     * user listeners (keys) and some useful links.
     */
    fluid.defaults("gpii.psp.aboutDialog", {
        gradeNames: ["fluid.viewComponent"],

        model: {
            messages: {
                title:             null,
                titlebarAppName:   null,
                update:            null,
                userListenersText: null,
                version:           null
            },

            version: null,
            userListeners: null
        },

        selectors: {
            titlebar:      ".flc-titlebar",

            title:         ".flc-contentTitle",
            version:       ".flc-contentVersion",
            update:        ".flc-contentCheckUpdates",
            links:         ".flc-contentLinks",
            userListeners: ".flc-contentUserListeners"
        },

        modelListeners: {
            // Any change means that the whole view should be re-rendered
            "": [{
                this: "{that}.dom.title",
                method: "text",
                args: "{that}.model.messages.title"
            }, {
                this: "{that}.dom.version",
                method: "text",
                args: {
                    expander: {
                        func: "fluid.stringTemplate",
                        args: ["{that}.model.messages.version", {version: "{that}.model.version"}]
                    }
                },
                excludeSource: "init"
            }, {
                this: "{that}.dom.update",
                method: "text",
                args: "{that}.model.messages.update"
            }, {
                this: "{that}.dom.userListeners",
                method: "text",
                args: "@expand:gpii.psp.aboutDialog.getUserListenersText({that}.model.messages.userListenersText, {that}.model.userListeners)",
                excludeSource: "init"
            }]
        },

        components: {
            titlebar: {
                type: "gpii.psp.titlebar",
                container: "{that}.dom.titlebar",
                options: {
                    model: {
                        messages: {
                            title: "{aboutDialog}.model.messages.titlebarAppName"
                        }
                    },
                    listeners: {
                        "onClose": {
                            funcName: "gpii.psp.channel.notifyChannel",
                            args: "onAboutDialogClosed"
                        }
                    }
                }
            }
        }
    });


    /**
     * Constructs the user listeners text.
     *
     * @param {String} description - The description with a placeholder by the name "listeners"
     * @param {String[]} userListeners - The list of key in listeners for the user
     * @return {String} The constructed string
     */
    gpii.psp.aboutDialog.getUserListenersText = function (description, userListeners) {
        return fluid.stringTemplate(description, { listeners: userListeners.join(", ") });
    };
})(fluid);
