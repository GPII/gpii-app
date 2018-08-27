/**
 * Basic renderer window component
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
    var electron = require("electron");

    /**
     * Notify the corresponding dialog wrapper component in main,
     * that the base window component has finished initialization.
     *
     * This is needed as the Electon's "ready-to-show" event may
     * be fired too soon - before the renderer wrapper component has
     * finished loading which causes troubles with init data sent from the main.
     */
    fluid.defaults("gpii.psp.baseWindowCmp.signalDialogReady", {
        listeners: {
            "onCreate.signalInit": {
                funcName: "gpii.psp.channel.notifyChannel",
                args: [
                    "onDialogReady",
                    // use the main component gradeName as a unique dialog identifier
                    electron.remote.getCurrentWindow().relatedCmpId
                ]
            }
        }
    });
})(fluid);
