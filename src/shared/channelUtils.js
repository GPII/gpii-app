/**
 * Electron IPC utilities
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
 * A generic channel component that handles events sent from another Electron process
 * within the same application. Whenever an IPC message is received, the corresponding
 * event (if any) from the component's configuration will be fired.
 */
fluid.defaults("gpii.app.shared.simpleChannelListener", {
    gradeNames: "fluid.component",

    events: {}, // to be passed by the implementor
    ipcTarget: null,

    listeners: {
        "onCreate.registerIpcListeners": {
            funcName: "gpii.app.shared.simpleChannelListener.registerIPCListeners",
            args: ["{that}", "{that}.events"]
        },
        "onDestroy.deregisterIpcListeners": {
            funcName: "gpii.app.shared.simpleChannelListener.deregisterIPCListeners",
            args: ["{that}", "{that}.events"]
        }
    },

    invokers: {
        registerIPCListener: {
            funcName: "gpii.app.shared.simpleChannelListener.registerIPCListener",
            args: [
                "{that}.options.ipcTarget",
                "{arguments}.0", // channelName
                "{arguments}.1"  // event
            ]
        },
        deregisterIPCListener: {
            funcName: "gpii.app.shared.simpleChannelListener.deregisterIPCListener",
            args: [
                "{that}.options.ipcTarget",
                "{arguments}.0" // channelName
            ]
        }
    }
});

/**
 * Registers simple IPC socket listeners for all given events. In case anything is
 * sent via the channel, the corresponding event will be fired.
 * @param {Component} that - The `gpii.app.common.simpleChannelListener` instance.
 * @param {Object} events - The events to be listened for including the system ones.
 */
gpii.app.shared.simpleChannelListener.registerIPCListeners = function (that, events) {
    var userEvents = fluid.censorKeys(events, systemEventNames);
    fluid.each(userEvents, function (event, eventName) {
        that.registerIPCListener(eventName, event.fire);
    });
};

/**
 * Deregisters all socket listeners for the specified events object.
 * @param {Component} that - The `gpii.app.common.simpleChannelListener` instance.
 * @param {Object} events - The events to be used.
 */
gpii.app.shared.simpleChannelListener.deregisterIPCListeners = function (that, events) {
    fluid.keys(events).forEach(that.deregisterIPCListener);
};

/**
 * Registers a single IPC socket channel for a given target (either `ipcMain` or
 * `ipcRenderer`).
 * @param {Object} ipcTarget - The target for which a channel is to be registered.
 * @param {String} channelName - The name of the channel to be listened to.
 * @param {Function} handler - The handler to be triggered once there's an incoming message from the channel
 */
gpii.app.shared.simpleChannelListener.registerIPCListener = function (ipcTarget, channelName, handler) {
    ipcTarget.on(channelName, function (/* event, args... */) {
        handler.apply(null, [].slice.call(arguments, 1));
    });
};

/**
 * Deregisters a socket listener from a given target  (either `ipcMain` or
 * `ipcRenderer`).
 * @param {Object} ipcTarget - The target for which the channel should be removed.
 * @param {String} channelName - The channel to be disconnected from.
 */
gpii.app.shared.simpleChannelListener.deregisterIPCListener = function (ipcTarget, channelName) {
    ipcTarget.removeAllListeners(channelName);
};

/**
 * A generic channel component which sends a message to another Electron process
 * (identified by the `ipcTarget` object in the component's configuration) within
 * the application whenever certain events occur.
 */
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
 * Adds listeners to the specified events which simply send an IPC message to the
 * other Electron process with the same name as the event which has occurred.
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
