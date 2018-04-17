/**
 * Channel utilities
 *
 * Defines utilities for communication with the main process.
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
    var ipcRenderer = require("electron").ipcRenderer;

    var gpii = fluid.registerNamespace("gpii");

    fluid.registerNamespace("gpii.psp.channel");


    /**
     * Sends a message to the main process.
     * @param {...Any} The channel to be notified and the parameters to be passed
     * with the message.
     */
    gpii.psp.channel.notifyChannel = function () {
        ipcRenderer.send.apply(null, arguments);
    };
})(fluid);
