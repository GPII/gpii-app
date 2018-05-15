/**
 * Electron browser window IPC utilities
 *
 * A set of utility for communication between the main and renderer processes.
 * Copyright 2016 Steven Githens
 * Copyright 2016-2017 OCAD University
 *
 * Licensed under the New BSD license. You may not use this file except in
 * compliance with this License.
 * The research leading to these results has received funding from the European Union's
 * Seventh Framework Programme (FP7/2007-2013) under grant agreement no. 289016.
 * You may obtain a copy of the License at
 * https://github.com/GPII/universal/blob/master/LICENSE.txt
 */
"use strict";

var gpii = fluid.registerNamespace("gpii");
fluid.registerNamespace("gpii.app");

// XXX find a better way to collect system events
var systemEventNames = fluid.keys(fluid.component().events);


/**
 * Generic channel component for communication with BroserWindows
 * It simply registers listeners for the passed events.
 */
fluid.defaults("gpii.app.common.simpleChannelListener", {
    gradeNames: "fluid.component",

    events: {}, // to be passed by implementor
    ipcTarget: null,

    listeners: {
        "onCreate.registerIpcListeners": {
            funcName: "gpii.app.common.simpleChannelListener.registerIPCListeners",
            args: ["{that}", "{that}.events"]
        },
        "onDestroy.deregisterIpcListeners": {
            funcName: "gpii.app.common.simpleChannelListener.deregisterIPCListeners",
            args: ["{that}", "{that}.events"]
        }
    },

    invokers: {
        registerIPCListener: {
            funcName: "gpii.app.common.simpleChannelListener.registerIPCListener",
            args: [
                "{that}.options.ipcTarget",
                "{arguments}.0", // channelName
                "{arguments}.1"  // event
            ]
        },
        deregisterIPCListener: {
            funcName: "gpii.app.common.simpleChannelListener.deregisterIPCListener",
            args: [
                "{that}.options.ipcTarget",
                "{arguments}.0" // channelName
            ]
        }
    }
});


/**
 * Registers simple IPC socket listeners for all given events. In case anything is written to
 * the channel, the corresponding event is triggered.
 *
 * @param {Object} events - The events to be used including the system ones.
 */
gpii.app.common.simpleChannelListener.registerIPCListeners = function (that, events) {
    var userEvents = fluid.censorKeys(events, systemEventNames);
    fluid.each(userEvents, function (event, eventName) {
        that.registerIPCListener(eventName, event);
    });
};

/**
 * Deregisters all socket listeners for the specified events.
 *
 * @param events {Object} The events to be used.
 */
gpii.app.common.simpleChannelListener.deregisterIPCListeners = function (that, events) {
    fluid.keys(events).forEach(that.registerIPCListener);
};


/**
 * Registers a single IPC socket channel.
 *
 * @param channelName {String} The name of the channel to be listened to.
 * @param event {Object} The event to be fired when the channel is notified.
 */
gpii.app.common.simpleChannelListener.registerIPCListener = function (ipcTarget, channelName, event) {
    ipcTarget.on(channelName, function (/* event, args... */) {
        event.fire.apply(event, [].slice.call(arguments, 1));
    });
};


/**
 * Deregisters a socket listener.
 *
 * @param channelName {String} The channel to be disconnected from.
 */
gpii.app.common.simpleChannelListener.deregisterIPCListener = function (ipcTarget, channelName) {
    ipcTarget.removeAllListeners(channelName);
};



fluid.defaults("gpii.app.common.simpleChannelNotifier", {
    gradeNames: "fluid.component",

    events: {}, // to be passed by implementor
    ipcTarget: null,

    listeners: {
        "onCreate.registerIPCNotifiers": {
            funcName: "gpii.app.common.simpleChannelNotifier.registerIPCNotifiers",
            args: [
                "{that}.options.ipcTarget",
                "{that}.events"
            ]
        }
    }
});

/**
 * Registers simple IPC socket listeners for all given events. In case anything is written to
 * the channel, the corresponding event is triggered.
 *
 * @param {Object} ipcTarget - The events to be used.
 * @param {Object} events - The events to be used including the system ones.
 */
gpii.app.common.simpleChannelNotifier.registerIPCNotifiers = function (ipcTarget, events) {
    var userEvents = fluid.censorKeys(events, systemEventNames);
    fluid.each(userEvents, function (event, eventName) {
        // send data to a channel named after the event name
        events[eventName].addListener(ipcTarget.send.bind(ipcTarget, eventName));
    });
};
