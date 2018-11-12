/**
 * The sign in page
 *
 * Represents the sign in page with a form for keying in, error handling mechanism and
 * useful links.
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
     * A component responsible for managing the sign in page. It provides
     * means for sending key in requests and error handling. It is also
     * internationalizable.
     */
    fluid.defaults("gpii.psp.signIn", {
        gradeNames: [
            "fluid.viewComponent",
            "gpii.psp.heightObservable",
            "gpii.psp.selectorsTextRenderer"
        ],

        model: {
            messages: {
                signInHeader: null,

                subtitleIntro: null,

                title: null,
                subtitle: null,

                emailTextInputLabel: null,
                passwordInputLabel: null,
                signInButton: null,
                signUpButton: null,
                forgotPasswordButton: null
            },

            email: null,
            password: null,

            error: {
                title: null,
                details: null
            }
        },

        selectors: {
            signInHeader:         ".flc-signInHeader",

            subtitleIntro:        ".flc-contentSubTitleIntro",

            title:                ".flc-contentTitle",
            subtitle:             ".flc-contentSubtitle",

            emailTextInputLabel:  ".flc-emailTextInput-label",
            passwordInputLabel:   ".flc-passwordInput-label",

            emailTextInput:       ".flc-emailTextInput",
            passwordInput:        ".flc-passwordInput",

            signUpButton:         ".flc-signUpBtn",
            forgotPasswordButton: ".flc-forgotPasswordBtn",

            signInBtn:            ".flc-signInBtn",

            error:                ".flc-error",
            errorTitle:           ".flc-errorTitle",
            errorDetails:         ".flc-errorDetails"
        },

        events: {
            onSignInClicked: null,
            onSignInRequested: null
        },

        invokers: {
            updateError: {
                changePath: "error",
                value: "{arguments}.0"
            }
        },

        listeners: {
            onSignInClicked: {
                funcName: "gpii.psp.signIn.validateSignIn",
                args: [
                    "{that}",
                    "{that}.dom.emailTextInput",
                    "{that}.dom.passwordInput"
                ]
            },
            "onCreate.addFocusListener": {
                funcName: "gpii.psp.signIn.addFocusListener",
                args: ["{that}.dom.emailTextInput"]
            },
            "onDestroy.removeFocusListener": {
                funcName: "gpii.psp.signIn.removeFocusListener"
            }
        },

        modelListeners: {
            "error": {
                funcName: "gpii.psp.signIn.toggleError",
                args: [
                    "{that}",
                    "{change}.value"
                ]
            }
        },

        components: {
            signInBtn: {
                type: "gpii.psp.widgets.button",
                container: "{that}.dom.signInBtn",
                options: {
                    attrs: {
                        "aria-label": "{signIn}.model.messages.signInButton"
                    },
                    model: {
                        label: "{signIn}.model.messages.signInButton"
                    },
                    invokers: {
                        "onClick": "{signIn}.events.onSignInClicked.fire"
                    }
                }
            }
        }
    });

    /**
     * Adds a listener so that whenever the page is focused, the email
     * field in the sign-in form (provided that it is visible) is focused.
     * @param {jQuery} emailInput - The email input element
     */
    gpii.psp.signIn.addFocusListener = function (emailInput) {
        jQuery(window).on("focus.signIn", function () {
            if (emailInput.is(":visible")) {
                emailInput.focus();
            }
        });
    };

    /**
     * Removes the listener which focuses the email field in the sign-in form.
     * Useful if the component is destroyed.
     */
    gpii.psp.signIn.removeFocusListener = function () {
        jQuery(window).off("focus.signIn");
    };


    /**
     * Validates and propagates the sign in request. In case there are
     * validation errors, an error message is shown to the user.
     *
     * @param {Component} that - The `gpii.psp.signIn` instance
     * @param {jQuery} emailInput - The email input element
     * @param {jQuery} passwordInput - The password input element
     */
    gpii.psp.signIn.validateSignIn = function (that, emailInput, passwordInput) {
        var email = emailInput.val(),
            password = passwordInput.val();

        // XXX temporary test validation. This should be replaced with
        // some better mechanism for real usage
        if (!email || !password) {
            that.updateError({
                title: "Wrong name or password",
                details: "Try again or use a key"
            });
        } else {
            that.updateError({title: null, details: null});
            that.events.onSignInRequested.fire(email, password);
        }
    };

    /**
     * Shows or hides the error container and sets the corresponding
     * messages depending on whether an error has occurred.
     *
     * @param {Component} that - The `gpii.psp.signIn` instance.
     * @param {Object} error - An object descibing the error that has
     * occurred if any.
     */
    gpii.psp.signIn.toggleError = function (that, error) {
        var errorContainer = that.dom.locate("error");
        if (error.title) {
            errorContainer.show();

            that.dom.locate("errorTitle").text(error.title);
            that.dom.locate("errorDetails").text(error.details);
        } else {
            errorContainer.hide();
        }
    };
})(fluid);
