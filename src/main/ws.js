/*!
Simple WebSocket wrapper

An Infusion component which manages a WebSocket connection.
Copyright 2016 Steven Githens
Copyright 2016-2017 OCAD University

Licensed under the New BSD license. You may not use this file except in
compliance with this License.
The research leading to these results has received funding from the European Union's
Seventh Framework Programme (FP7/2007-2013) under grant agreement no. 289016.
You may obtain a copy of the License at
https://github.com/GPII/universal/blob/master/LICENSE.txt
*/
"use strict";

var fluid = require("infusion"),
    gpii = fluid.registerNamespace("gpii"),
    WebSocket = require("ws");

/**
 * This component provides means for opening a WebSocket connection to a URL,
 * sending messages through it and closing it. The component also fires events
 * when a connection is established (the `onConnected` event), if an error
 * occurs (the `onError` event) and when a message is received via the
 * WebSocket (the `onMessageReceived` event).
 */
fluid.defaults("gpii.app.ws", {
    gradeNames: ["fluid.component"],

    config: {
        hostname: null,
        port: null,
        path: "" // optional
    },

    members: {
        ws: null // will be assigned when connect is called
    },

    events: {
        onConnected: null,
        onError: null,
        onMessageReceived: null
    },

    listeners: {
        onDestroy: "{that}.disconnect"
    },

    invokers: {
        connect: {
            funcName: "gpii.app.ws.connect",
            args: ["{that}", "{that}.options.config"]
        },
        send: {
            funcName: "gpii.app.ws.send",
            args: ["{that}.ws", "{arguments}.0"]
        },
        disconnect: {
            funcName: "gpii.app.ws.disconnect",
            args: ["{that}.ws"]
        }
    }
});

/**
 * Establishes a connection to a URL which is built using the provided config
 * parameter. Attaches various listener to the connection which when called
 * will fire the appropriate event of the component.
 * @param that {Component} The `gpii.app.ws` instance.
 * @param config {Object} An object containing the hostname, port and path of
 * the URL to connect to.
 */
gpii.app.ws.connect = function (that, config) {
    var url = fluid.stringTemplate("ws://%hostname:%port%path", config);
    that.ws = new WebSocket(url);

    that.ws.on("open", function () {
        that.events.onConnected.fire();
    });

    that.ws.on("message", function (data) {
        that.events.onMessageReceived.fire(JSON.parse(data));
    });

    that.ws.on("error", function (error) {
        that.events.onError.fire(error);
    });

    that.ws.on("unexpected-response", function () {
        that.events.onError.fire("Unexpected HTTP response where WebSocket response was expected");
    });
};

/**
 * Sends a message through the WebSocket. The data that is to be sent is first
 * converted to a string representation (using JSON.stringify).
 * @param ws {Object} The already connected WebSocket instance if any.
 * @param data {Any} The data to send.
 */
gpii.app.ws.send = function (ws, data) {
    if (ws) {
        ws.send(JSON.stringify(data));
    }
};

/**
 * Closes gracefully the WebSocket connection.
 * @param ws {Object} The already connected WebSocket instance if any.
 */
gpii.app.ws.disconnect = function (ws) {
    if (ws) {
        // for ref https://developer.mozilla.org/en-US/docs/Web/API/CloseEvent#Status_codes
        ws.close(1000);
    }
};
