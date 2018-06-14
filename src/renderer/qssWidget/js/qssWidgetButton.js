/**
 * Initializes the QuickSetStrip widget window
 *
 * Creates the Quick Set Strip widget once the document has been loaded.
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

    fluid.defaults("gpii.qssWidget.button", {
        gradeNames: ["gpii.psp.widgets.button", "gpii.qss.elementRepeater.keyListener"],
        events: {
            onSpacebarPressed: null,
            onEnterPressed: null
        },
        listeners: {
            // The click event will be attached manually.
            "onCreate.bindClickEvt": {
                funcName: "fluid.identity"
            },
            "onCreate.addClickHandler": {
                funcName: "gpii.qssWidget.button.addClickHandler",
                args: ["{that}", "{focusManager}", "{that}.container"]
            },
            onSpacebarPressed: "{that}.activate()",
            onEnterPressed: "{that}.activate()"
        },
        invokers: {
            activate: {
                funcName: "fluid.notImplemented"
            }
        }
    });

    gpii.qssWidget.button.addClickHandler = function (that, focusManager, container) {
        container.on("click", function () {
            focusManager.focusElement(container, false);
            that.activate();
        });
    };
})(fluid);
