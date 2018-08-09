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

require("./waitDialog.js");
require("./surveyDialog.js");
require("./errorDialog.js");
require("./aboutDialog.js");
require("../common/utils.js");


/**
 * A component for showing dialogs sequentially. Only a single dialog is allowed to be
 * shown at a given time. The display of another dialog is postponed (queued up) until
 * the previous one in the sequence is closed.
 *
 * The first element of the queue represents the options of the currently shown error
 * dialog. When it is closed, the element is removed from the queue and the next
 * options element in the queue is used for showing the following error dialog.
 */
fluid.defaults("gpii.app.dialogManager.queue", {
    gradeNames: ["fluid.modelComponent"],

    members: {
        queue: []
    },

    components: {
        dialog: null
    },

    invokers: {
        enqueue: {
            funcName: "gpii.app.dialogManager.queue.enqueue",
            args: ["{that}", "{arguments}.0"]
        },
        processNext: {
            funcName: "gpii.app.dialogManager.queue.processNext",
            args: ["{that}"]
        },
        showDialog: {
            funcName: "gpii.app.dialogManager.queue.showDialog",
            args: ["{that}", "{that}.dialog"]
        },
        clear: {
            funcName: "gpii.app.dialogManager.queue.clear",
            args: ["{that}"]
        }
    }
});

/**
 * Clears the dialog queue.
 * @param {Component} that - The `gpii.app.dialogManager.queue` instance.
 */
gpii.app.dialogManager.queue.clear = function (that) {
    that.queue = [];
};

/*
 * Removes the first element in the queue (which represents the options
 * of the error dialog that has just been closed) and shows the next
 * dialog if there are any items in the queue.
 * @param {Component} that - The `gpii.app.dialogManager.queue` object
 */
gpii.app.dialogManager.queue.processNext = function (that) {
    that.queue.shift();
    that.showDialog();
};

/**
 * Shows a dialog given its configuration options from the queue.
 * @param {Component} that - The `gpii.app.dialogManager.queue` instance.
 * @param {Component} dialog - The dialog to be shown.
 */
gpii.app.dialogManager.queue.showDialog = function (that, dialog) {
    if (that.queue.length > 0) {
        var options = that.queue[0];
        dialog.show(options);
    }
};

/**
 * Queues a dialog to be shown in the future. If this is the only dialog in the
 * queue, it will be shown immediately. Otherwise, it will be shown once the
 * previous dialog is closed.
 * @param {Component} that - The `gpii.app.dialogManager.queue` instance.
 * @param {Object} options - The configuration options of the dialog to be queued.
 */
gpii.app.dialogManager.queue.enqueue = function (that, options) {
    that.queue.push(options);

    if (that.queue.length === 1) {
        that.showDialog();
    }
};

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
 * All dialogs which have a `type` equal to the value of `sequentialDialogsGrade` (currently
 * defaulted to `gpii.app.error`) will enter a visibility queue and each of these will
 * only be shown once the previous such has been hidden/destroyed (see GPII-2871).
 */
fluid.defaults("gpii.app.dialogManager", {
    gradeNames: ["fluid.modelComponent"],

    model: {
        isKeyedIn: false
    },

    sequentialDialogsGrade: "gpii.app.error",

    distributeOptions: {
        target: "{that errorDialog}.options.modelListeners",
        record: {
            isShown: {
                funcName: "gpii.app.dialogManager.errorDialogToggled",
                args: ["{dialogManager}.errorQueue", "{change}.value"],
                excludeSource: "init"
            }
        }
    },

    modelListeners: {
        isKeyedIn: {
            funcName: "gpii.app.dialogManager.closeDialogsOnKeyOut",
            args: ["{that}", "{change}.value"],
            excludeSource: "init"
        }
    },

    components: {
        waitDialog: {
            type: "gpii.app.waitDialog"
        },
        aboutDialog: {
            type: "gpii.app.aboutDialog"
        },
        survey: {
            type: "gpii.app.survey"
        },
        error: {
            type: "gpii.app.error"
        },

        errorQueue: {
            type: "gpii.app.dialogManager.queue",
            options: {
                listeners: {
                    "{app}.events.onKeyedOut": {
                        func: "{that}.clear"
                    }
                },

                components: {
                    dialog: "{error}"
                }
            }
        }
    },

    invokers: {
        get: {
            funcName: "gpii.app.dialogManager.get",
            args: [
                "{that}",
                "{arguments}.0" // selector
            ]
        },
        toggle: {
            funcName: "gpii.app.dialogManager.toggle",
            args: [
                "{that}",
                "{arguments}.0", // selector
                "{arguments}.1", // display
                "{arguments}.2"  // options
            ]
        },
        show: {
            funcName: "gpii.app.dialogManager.show",
            args: [
                "{that}",
                "{arguments}.0", // selector
                "{arguments}.1"  // options
            ]
        },
        hide: {
            funcName: "gpii.app.dialogManager.hide",
            args: [
                "{that}",
                "{arguments}.0" // selector
            ]
        },
        close: {
            funcName: "gpii.app.dialogManager.close",
            args: [
                "{that}",
                "{arguments}.0" // selector
            ]
        }
    }
});

/**
 * Invoked whenever an error dialog has changed its visibility (i.e. it has
 * either be shown or hidden).
 * @param {Component} errorQueue - The `gpii.app.dialogManager.queue` instance.
 * @param {Boolean} isShown - Whether the error dialog is shown or not.
 */
gpii.app.dialogManager.errorDialogToggled = function (errorQueue, isShown) {
    if (!isShown) {
        errorQueue.processNext();
    }
};

/**
 * Retrieves a dialog component that is a subcomponent of the `dialogManager`
 * given its IoCSS selector.
 * @param {Component} dialogManager - The `gpii.app.dialogManager` instance.
 * @param {String} selector - The IoCSS selector of the component to be fetched.
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
 * Depending on the value of the `display` argument, either shows or hides a
 * component given its IoCSS selector.
 * @param {Component} dialogManager - The `gpii.app.dialogManager` instance.
 * @param {String} selector - The IoCSS selector of the component to be shown.
 * @param {Boolean} display - If `true`, the corresponding dialog will be shown.
 * Otherwise, it will be hidden.
 * @param {Object} [options] - An object containing configuration options for
 * the dialog in case it needs to be shown.
 */
gpii.app.dialogManager.toggle = function (dialogManager, selector, display, options) {
    if (display) {
        dialogManager.show(selector, options);
    } else {
        dialogManager.hide(selector);
    }
};

/**
 * Shows a dialog component given its IoCSS selector. The dialog may not be shown
 * direclty but instead added to a queue.
 *
 * @param {Component} dialogManager - The `gpii.app.dialogManager` instance.
 * @param {String} selector - The IoCSS selector of the component to be shown.
 * @param {Object} [options] - An object containing configuration options for
 * the dialog which is to be shown.
 */
gpii.app.dialogManager.show = function (dialogManager, selector, options) {
    var dialog = dialogManager.get(selector);
    if (dialog) {
        if (dialog.typeName === dialogManager.options.sequentialDialogsGrade) {
            dialogManager.errorQueue.enqueue(options);
        } else {
            dialog.show(options);
        }
    }
};

/**
 * Hides a dialog component given its IoCSS selector.
 * @param {Component} dialogManager - The `gpii.app.dialogManager` instance.
 * @param {String} selector - The IoCSS selector of the component to be hidden.
 */
gpii.app.dialogManager.hide = function (dialogManager, selector) {
    var dialog = dialogManager.get(selector);
    if (dialog) {
        dialog.hide();
    }
};

/**
 * Closes a dialog component given its IoCSS selector.
 * @param {Component} dialogManager - The `gpii.app.dialogManager` instance.
 * @param {String} selector - The IoCSS selector of the component to be closed.
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
 * @param {Component} dialogManager - The `gpii.app.dialogManager` instance.
 * @param {Boolean} isKeyedIn - Indicates whether there is a currently keyed
 * in user.
 */
gpii.app.dialogManager.closeDialogsOnKeyOut = function (dialogManager, isKeyedIn) {
    if (!isKeyedIn) {
        dialogManager.close("survey");
    }
};
