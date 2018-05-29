/**
 * The Quick Set Strip tooltip pop-up
 *
 * Introduces a component that uses an Electron BrowserWindow to represent a QSS tooltip.
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

var fluid = require("infusion");

require("../dialog.js");
require("../blurrable.js");
require("../../common/channelUtils.js");

var gpii = fluid.registerNamespace("gpii");


fluid.defaults("gpii.app.qssTooltipDialog", {
    gradeNames: ["gpii.app.dialog", "gpii.app.blurrable"],

    model: {
        setting: null
    },

    config: {
        showInactive: true, // not focused when shown

        attrs: {
            width: 200,
            height: 300,
            alwaysOnTop: true
        },
        fileSuffixPath: "qssTooltipPopup/index.html"
    },

    // close whenever focus is lost
    linkedWindowsGrades: null,

    invokers: {
        showIfPossible: {
            funcName: "gpii.app.qssTooltipDialog.showIfPossible",
            args: [
                "{that}",
                "{arguments}.0",
                "{arguments}.1"
            ]
        },
        show: {
            // TODO split to some generic parts
            funcName: "gpii.app.qssTooltipDialog.show",
            args: [
                "{that}",
                "{arguments}.0",
                "{arguments}.1"
            ]
        }
    },

    components: {
        channelNotifier: {
            type: "gpii.app.channelNotifier",
            options: {
                events: {
                    // update message in the tooltip
                    // expect this message to be translated
                    onSettingUpdated: null
                },
                modelListeners: {
                    "{qssTooltipDialog}.model.setting": {
                        func: "{that}.events.onSettingUpdated.fire",
                        args: ["{change}.value.tooltip"]
                    }
                }
            }
        }
    }
});


/**
 * Retrieve element position.
 */
function getTooltipPosition(dialog, elementMetrics) {
    // change offset to element's element right corner
    var offsetX = elementMetrics.offsetRight - elementMetrics.width;

    return {
        offsetX: offsetX,
        offsetY: elementMetrics.height
    };
}

gpii.app.qssTooltipDialog.showIfPossible = function (that, setting, elementMetrics) {
    if (setting && fluid.isValue(setting.tooltip)) {
        that.show(setting, elementMetrics);
    }
};

// TODO reuse widget show
gpii.app.qssTooltipDialog.show = function (that, setting, elementMetrics) {
    console.log("Showing... ", that.options.gradeNames);
    console.log(setting, elementMetrics);

    var offset = getTooltipPosition(that.dialog, elementMetrics);

    // trigger update in the tooltip BrowserWindow
    // and keep the last shown setting
    that.applier.change("setting", null, "DELETE");
    that.applier.change("setting", setting);

    // Trigger the showing mechanism
    that.applier.change("isShown", true);
    // reposition window properly
    that.positionWindow(offset.offsetX, offset.offsetY);

    // TODO is this needed as it is not even focused?
    that.setBlurTarget(that.dialog);
};
