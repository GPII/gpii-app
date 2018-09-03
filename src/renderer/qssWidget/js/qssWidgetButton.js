/**
 * A QSS widget button
 *
 * A button representing a possible setting value in the QSS menu or the increment
 * and decrement button in the QSS stepper widget.
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
     * An `activatable` instance of `gpii.psp.widgets.button` used in the
     * QSS widget.
     */
    fluid.defaults("gpii.qssWidget.button", {
        gradeNames: ["gpii.psp.widgets.button", "gpii.app.activatable"],
        listeners: {
            "onCreate.addClickHandler": {
                funcName: "gpii.qssWidget.button.addClickHandler",
                args: ["{that}", "{focusManager}", "{that}.container"]
            }
        }
    });

    /**
     * Adds a click handler which activates the button when it is pressed and
     * adjusts the focus appropriately.
     * @param {Component} that - The `gpii.qssWidget.button` instance.
     * @param {Component} focusManager - The `gpii.qss.focusManager` instance
     * for the QSS widget.
     * @param {jQuery} container - The jQuery object representing the container
     * for the QSS widget button.
     */
    gpii.qssWidget.button.addClickHandler = function (that, focusManager, container) {
        container.on("click", function () {
            focusManager.focusElement(container, false);
            that.activate();
        });
    };
})(fluid);
