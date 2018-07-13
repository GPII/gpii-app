/**
 * Initializes the restart dialog
 *
 * Creates the restart dialog once the document has been loaded.
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
     * Simple wrapper that enables translations for the `gpii.psp.errorDialog` component.
     */
    fluid.defaults("gpii.psp.translatedErrorDialog", {
        gradeNames: ["gpii.psp.messageBundles", "fluid.viewComponent"],

        components: {
            errorDialog: {
                type: "gpii.psp.errorDialog",
                container: "{translatedErrorDialog}.container"
            }
        }
    });


    $(function () {
        gpii.psp.translatedErrorDialog(".fl-dialog");
    });
})(fluid);
