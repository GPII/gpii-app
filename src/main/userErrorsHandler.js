/*
 * GPII User Errors handler
 *
 * A component responsible for handling user errors.
 * Copyright 2018 Raising the Floor - International
 *
 * Licensed under the New BSD license. You may not use this file except in
 * compliance with this License.
 *
 * You may obtain a copy of the License at
 * https://github.com/GPII/universal/blob/master/LICENSE.txt
 */

"use strict";

var fluid = fluid || require("infusion");
var gpii = fluid.registerNamespace("gpii");

/**
 * A component for handling user errors during app runtime. It triggers a "gpii.app.errorDialog"
 * with all the details for the occurred error.
 * The error details are collected from the specified messages bundle: it uses an "errorCode" given with
 * the error which corresponds to several messages ("title", "subhead", "details" properties) in the bundle.
 */
fluid.defaults("gpii.app.userErrorsHandler", {
    gradeNames: ["fluid.component"],

    messagePrefix: "gpii_userErrors",
    messagesBundlePath : "%gpii-user-errors/bundles/gpii-userErrors-messageBundle_en.json5",
    errorProperties: ["title", "subhead", "details"],

    errorMessages: "@expand:fluid.require({that}.options.messagesBundlePath)",

    invokers: {
        handleUserError: {
            funcName: "gpii.app.userErrorsHandler.handleUserError",
            args: [
                "{that}",
                "{dialogManager}",
                "{arguments}.0",  // errorCode
                "{arguments}.1",  // isError
                "{arguments}.2"   // error
            ]
        },
        getErrorDetails: {
            funcName: "gpii.app.userErrorsHandler.getErrorDetails",
            args: [
                "{that}.options.errorMessages",
                "{that}.options.messagePrefix",
                "{that}.options.errorProperties",
                "{arguments}.0"
            ]
        }
    }
});

/**
 * Extracts error details for the specified error code from provided error messages.
 * For every error it expects there to be several messages (specified in `errorProperties`).
 * Currently there are three such properties - "title", "subhead", "details".
 * Every message key is expected to follow the format: <errorSupplierComponent>_<errorCode>-<errorProperty>,
 * e.g. GPII_userErrors_KeyInFail-title.
 * @param {Object} errorMessages - Object containing all messages for the different error codes
 * @param {String} messagePrefix - The prefix for each error message key
 * @param {String[]} errorProperties - The properties of an error to be looked for
 * @param {String} errorCode - The code of the error that has occurred
 * @return {Object} {{title: String, subhead: String, details: String}}
 */
gpii.app.userErrorsHandler.getErrorDetails = function (errorMessages, messagePrefix, errorProperties, errorCode) {
    return errorProperties.reduce(function (errorDetails, errorProp) {
        var propKey =  messagePrefix + "_" + errorCode + "-" + errorProp;
        // Extract error errorDetails from the bundle
        errorDetails[errorProp] = errorMessages[propKey];

        return errorDetails;
    }, {});
};

/**
 * Displays a user error through the usage of the "gpii.app.errorDialog".
 * @param {Component} that - An instance of gpii.app.
 * @param {Component} dialogManager - An instance of `gpii.app.dialogManager`.
 * @param {Object} error - The error payload
 * @param {Boolean} error.isError - Whether it is an error (it should be positive)
 * @param {Object} error.originalError - The original error object
 * @param {String} error.messagesKey - The error code of the error. It also represents a key
 * in the userError messages.
 */
gpii.app.userErrorsHandler.handleUserError = function (that, dialogManager, error) {
    var errorDialogOptions = that.getErrorDetails(error.messageKey);
    errorDialogOptions.errCode = error.messageKey;

    dialogManager.hide("waitDialog");
    dialogManager.show("error", errorDialogOptions);
};
