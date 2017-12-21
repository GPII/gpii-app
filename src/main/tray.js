/*!
GPII Application
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

var fluid    = require("infusion");
var path     = require("path");
var electron = require("electron");

var Tray           = electron.Tray,
    globalShortcut = electron.globalShortcut;
var gpii           = fluid.registerNamespace("gpii");

/**
 * Component that contains an Electron Tray.
 */
fluid.defaults("gpii.app.tray", {
    gradeNames: "fluid.modelComponent",
    members: {
        tray: {
            expander: {
                funcName: "gpii.app.makeTray",
                args: ["{that}.options.icons.keyedOut", "{psp}.show"]
            }
        }
    },
    icons: {
        pendingChanges: "src/icons/gpii-pending.png",
        keyedIn: "src/icons/gpii-color.ico",
        keyedOut: "src/icons/gpii.ico"
    },
    components: {
        menu: {
            type: "gpii.app.menuInApp"
        }
    },
    model: {
        keyedInUserToken: null,
        pendingChanges: [],
        icon: "{that}.options.icons.keyedOut",
        preferences: "{app}.model.preferences",
        tooltip: ""
    },
    modelRelay: {
        "icon": {
            target: "icon",
            singleTransform: {
                type: "fluid.transforms.free",
                func: "gpii.app.getTrayIcon",
                args: ["{that}.model.keyedInUserToken", "{that}.model.pendingChanges", "{that}.options.icons"]
            }
        },
        "tooltip": {
            target: "tooltip",
            singleTransform: {
                type: "fluid.transforms.free",
                func: "gpii.app.getTrayTooltip",
                args: ["{that}.model.preferences", "{that}.model.pendingChanges", "{that}.options.tooltips"]
            }
        }
    },
    modelListeners: {
        "icon": {
            funcName: "gpii.app.tray.setTrayIcon",
            args: ["{that}.tray", "{change}.value"],
            excludeSource: "init"
        },
        "tooltip": {
            "this": "{that}.tray",
            method: "setToolTip",
            args: "{that}.model.tooltip"
        }
    },
    listeners: {
        "onDestroy.cleanupElectron": {
            this: "{that}.tray",
            method: "destroy"
        }
    },
    tooltips: {
        pendingChanges: "There are pending changes",
        defaultTooltip: "(No one keyed in)"
    }
});

/**
  * Sets the icon for the Electron Tray which represents the GPII application.
  * @param tray {Object} An instance of an Electron Tray.
  * @param icon {String} The simple path to the icon file.
  */
gpii.app.tray.setTrayIcon = function (tray, icon) {
    var iconPath = path.join(fluid.module.terms()["gpii-app"], icon);
    tray.setImage(iconPath);
};

/**
  * Creates the Electron Tray
  * @param icon {String} Path to the icon that represents the GPII in the task tray.
  * @param openPSP {Function} A function for showing the PSP window. Should be called
  * whenever the user left clicks on the tray icon or uses the PSP window shortcut.
  */
gpii.app.makeTray = function (icon, openPSP) {
    var tray = new Tray(path.join(fluid.module.terms()["gpii-app"], icon));

    tray.on("click", function () {
        openPSP();
    });

    globalShortcut.register("Super+CmdOrCtrl+Alt+U", function () {
        openPSP();
    });

    return tray;
};

/**
 * Returns the path to the icon for the Electron Tray based on whether there is a
 * keyed-in user and on the pending setting changes (if any).
 * @param keyedInUserToken {String} The token if the keyed-in user or `null` if
 * there is no such.
 * @param pendingChanges {Array} An array containing all pending setting changes.
 * @param icons {Object} An object containing all possible icon paths.
 * @return The tooltip label for the Electron Tray.
 */
gpii.app.getTrayIcon = function (keyedInUserToken, pendingChanges, icons) {
    if (pendingChanges && pendingChanges.length > 0) {
        return icons.pendingChanges;
    }

    return keyedInUserToken ? icons.keyedIn : icons.keyedOut;
};

/**
 * Returns the tooltip for the Electron Tray based on the active preference set (if any)
 * and the pending setting changes.
 * @param preferences {Object} An object describing the preference sets (including the
 * active one) for the currently keyed-in user (if any).
 * @param pendingChanges {Array} An array containing all pending setting changes.
 * @param tooltips {Object} An object containing all possible tooltip texts.
 * @return The tooltip label for the Electron Tray.
 */
gpii.app.getTrayTooltip = function (preferences, pendingChanges, tooltips) {
    if (pendingChanges && pendingChanges.length > 0) {
        return tooltips.pendingChanges;
    }

    var activePreferenceSet = fluid.find_if(preferences.sets,
        function (preferenceSet) {
            return preferenceSet.path === preferences.activeSet;
        }
    );

    return activePreferenceSet ? activePreferenceSet.name : tooltips.defaultTooltip;
};
