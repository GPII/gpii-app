/**
 * Error dialog component
 *
 * An Electron BrowserWindow dialog that presents errors to the user.
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

var fluid   = require("infusion");

require("./basic/dialogWrapper.js");
require("../common/utils.js");


/**
 * A component that represent an error dialog and is used to display error messages
 * to the user. In order for an error to be properly displayed it requires the
 * following attributes: title, subheader, details and error code.
 * These attributes are expected in the `params` section as they will be
 * directly passed to the renderer scope with dialog creation.
 */
fluid.defaults("gpii.app.errorDialog", {
    gradeNames: ["gpii.app.dialog", "gpii.app.scaledDialog"],

    scaleFactor: 1,
    defaultWidth: 400,
    defaultHeight: 250,

    config: {
        destroyOnClose: true,
        awaitWindowReadiness: true,

        params: {
            title:   null,
            subhead: null,
            details: null,
            errCode: null,

            btnLabel1: null,
            btnLabel2: null,
            btnLabel3: null
        },
        fileSuffixPath: "errorDialog/index.html"
    },

    listeners: {
        "onDialogReady.show": {
            funcName: "{that}.show"
        }
    },

    components: {
        channelNotifier: {
            // simply notify i18n locale changes
            type: "gpii.app.channelNotifier"
        },
        channelListener: {
            type: "gpii.app.channelListener",
            options: {
                events: {
                    onErrorDialogContentHeightChanged: "{errorDialog}.events.onContentHeightChanged",
                    onErrorDialogButtonClicked: null,
                    onErrorDialogClosed: null
                },
                listeners: {
                    onErrorDialogButtonClicked: {
                        // Currently only single buttons are available, and
                        // will simply close the dialog
                        funcName: "{errorDialog}.close"
                    },
                    onErrorDialogClosed: {
                        funcName: "{errorDialog}.close"
                    }
                }
            }
        }
    }
});


/*
 * A wrapper for the creation of error dialogs. See the documentation of the
 * `gpii.app.dialogWrapper` grade for more information.
 */
fluid.defaults("gpii.app.error", {
    gradeNames: "gpii.app.dialogWrapper",

    components: {
        dialog: {
            type: "gpii.app.errorDialog",
            options: {
                scaleFactor: "{gpii.app.error}.options.scaleFactor",
                config: {
                    params: "{arguments}.0"
                }
            }
        }
    }
});
