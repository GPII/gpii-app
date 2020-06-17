/**
 * Handles link redirection.
 *
 * Copyright 2020 Raising the Floor - International
 *
 * Licensed under the New BSD license. You may not use this file except in
 * compliance with this License.
 *
 * The R&D leading to these results received funding from the
 * Department of Education - Grant H421A150005 (GPII-APCP). However,
 * these results do not necessarily represent the policy of the
 * Department of Education, and you should not assume endorsement by the
 * Federal Government.
 *
 * You may obtain a copy of the License at
 * https://github.com/GPII/gpii-app/blob/master/LICENSE.txt
 */

"use strict";

var fluid = require("infusion"),
    URL = require("url").URL;

var gpii = fluid.registerNamespace("gpii");
fluid.registerNamespace("gpii.app.linkRedirect");

/**
 * Handles /redirect, which redirects the browser to the provided url.
 * This is a fall-back for the 'open link in existing tab' feature [GPII-4410], where the browser is opened with a
 * special link which gets intercepted by a browser extension. The link really points to this handler, so it will
 * still work with browsers that don't have the extension installed.
 */
fluid.defaults("gpii.app.linkRedirect", {
    gradeNames: ["kettle.app"],
    defaultRedirectUrl: "http://opensametab.morphic.org/redirect/$1",
    requestHandlers: {
        handle: {
            type: "gpii.app.linkRedirect.request",
            route: "/redirect/:destination(.*)"
        }
    }
});

fluid.defaults("gpii.app.linkRedirect.request", {
    gradeNames: ["kettle.request.http"],
    invokers: {
        handleRequest: {
            funcName: "gpii.app.linkRedirect.handleRequest",
            args: [
                "{request}",
                "{request}.req.params.destination"
            ]
        }
    }
});

/**
 * Handler for /redirect. Redirects the browser to the given url.
 *
 * @param {Component} request The request object.
 * @param {String} destination The destination URL.
 */
gpii.app.linkRedirect.handleRequest = function (request, destination) {
    try {
        // Make sure the url is valid before sending it out.
        var url = new URL(destination);
        request.res.status(301).redirect(url.href);
    } catch (e) {
        request.handlerPromise.reject({
            statusCode: 400,
            message: e.message
        });
    }
};
