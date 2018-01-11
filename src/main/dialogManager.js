/**
 * A manager for all dialogs throughout the application
 *
 * An Infusion component which manages (shows/hides/closes) dialogs within the PSP (for
 * the time being only the survey dialog is managed though the dialog manager).
 * Copyright 2017 Raising the Floor - International
 *
 * Licensed under the New BSD license. You may not use this file except in
 * compliance with this License.
 * The research leading to these results has received funding from the European Union's
 * Seventh Framework Programme (FP7/2007-2013) under grant agreement no. 289016.
 * You may obtain a copy of the License at
 * https://github.com/GPII/universal/blob/master/LICENSE.txt
 */
"use strict";

var fluid = require("infusion"),
    gpii = fluid.registerNamespace("gpii");

require("./surveys/surveyDialog.js");

/**
 * A component which provides means for showing, hiding and closing of dialogs
 * throughout the PSP application. All dialogs that can be manipulated by this
 * component need to be registered as its subcomponents. If a dialog cannot be
 * created when the `dialogManager` is created, it can be wrapped in a component
 * which will take care of the dialogs creation when it is needed (for reference,
 * see the `gpii.app.survey` component which wraps the `gpii.app.surveyDialog` and
 * creates it via an event).
 * In order to show/hide/close a dialog, the IoCSS selector of the particular
 * component needs to be provided as an argument of the corresponding function.
 */
// XXX: Currently only the survey dialog is managed by the dialogManager. As a
// refactoring step, in the future the rest of the dialogs will be controlled by
// this manager, as well. See https://issues.gpii.net/browse/GPII-2817 for more
// information.
fluid.defaults("gpii.app.dialogManager", {
    gradeNames: ["fluid.modelComponent"],
    model: {
        keyedInUserToken: null
    },
    modelListeners: {
        keyedInUserToken: {
            funcName: "gpii.app.dialogManager.closeDialogsOnKeyOut",
            args: ["{that}", "{change}.value"],
            excludeSource: "init"
        }
    },

    components: {
        survey: {
            type: "gpii.app.survey"
        }
    },

    invokers: {
        get: {
            funcName: "gpii.app.dialogManager.get",
            args: ["{that}", "{arguments}.0"]
        },
        show: {
            funcName: "gpii.app.dialogManager.show",
            args: ["{that}", "{arguments}.0", "{arguments}.1"]
        },
        hide: {
            funcName: "gpii.app.dialogManager.hide",
            args: ["{that}", "{arguments}.0"]
        },
        close: {
            funcName: "gpii.app.dialogManager.close",
            args: ["{that}", "{arguments}.0"]
        }
    }
});

/**
 * Retrieves a dialog component that is a subcomponent of the `dialogManager`
 * given its IoCSS selector.
 * @param dialogManager {Component} The `gpii.app.dialogManager` instance.
 * @param selector {String} The IoCSS selector of the component to be fetched.
 * @return {Component} The dialog component corresponding to the given selector
 * or `undefined` if no such is found.
 */
gpii.app.dialogManager.get = function (dialogManager, selector) {
    var dialogs = fluid.queryIoCSelector(dialogManager, selector);
    if (dialogs.length > 0) {
        return dialogs[0];
    }
};

/**
 * Shows a dialog component given its IoCSS selector.
 * @param dialogManager {Component} The `gpii.app.dialogManager` instance.
 * @param selector {String} The IoCSS selector of the component to be shown.
 * @param options {Object} An object containing configuration options for
 * the dialog which is to be shown.
 */
gpii.app.dialogManager.show = function (dialogManager, selector, options) {
    var dialog = dialogManager.get(selector);
    if (dialog) {
        dialog.show(options);
    }
};

/**
 * Hides a dialog component given its IoCSS selector.
 * @param dialogManager {Component} The `gpii.app.dialogManager` instance.
 * @param selector {String} The IoCSS selector of the component to be hidden.
 */
gpii.app.dialogManager.hide = function (dialogManager, selector) {
    var dialog = dialogManager.get(selector);
    if (dialog) {
        dialog.hide();
    }
};

/**
 * Closes a dialog component given its IoCSS selector.
 * @param dialogManager {Component} The `gpii.app.dialogManager` instance.
 * @param selector {String} The IoCSS selector of the component to be closed.
 */
gpii.app.dialogManager.close = function (dialogManager, selector) {
    var dialog = dialogManager.get(selector);
    if (dialog) {
        dialog.close();
    }
};

/**
 * A function responsible for closing all dialogs which need to be closed
 * whenever the user keyes out of the PSP.
 * @param dialogManager {Component} The `gpii.app.dialogManager` instance.
 * @param keyedInUserToken {String} The token of the currently keyed in user.
 */
gpii.app.dialogManager.closeDialogsOnKeyOut = function (dialogManager, keyedInUserToken) {
    if (!fluid.isValue(keyedInUserToken)) {
        dialogManager.close("survey");
    }
};
