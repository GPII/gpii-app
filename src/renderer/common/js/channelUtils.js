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


    /**
     * Listen for events from the main process.
     * It expects component events to be supplied and it uses their keys as
     * channel names to which it attaches. Once data from a specific channel is
     * received a corresponding event is fired.
     */
    fluid.defaults("gpii.psp.channelListener", {
        gradeNames: "gpii.app.dialog.simpleChannelListener",
        ipcTarget: ipcRenderer,

        events: {} // defined by implementor
    });


    /**
     * Send data to the main process.
     * It expects component events to be supplied and it uses their keys as
     * channel names to which it sends data. Data is sent once a matching event
     * is fired.
     */
    fluid.defaults("gpii.psp.channelNotifier", {
        gradeNames: "gpii.app.dialog.simpleChannelNotifier",
        ipcTarget: ipcRenderer,

        events: {} // defined by implementor
    });
})(fluid);
