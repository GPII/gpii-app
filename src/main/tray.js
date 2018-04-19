/**
 * The PSP Electron Tray
 *
 * Introduces a component that creates and manages the PSP Electron Tray icon.
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

var fluid    = require("infusion");
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
                args: ["{that}.options", "{psp}.show"]
            }
        }
    },
    shortcut: "Super+CmdOrCtrl+Alt+U",
    icons: {
        pendingChanges: "%gpii-app/src/icons/gpii-pending.png",
        keyedIn: "%gpii-app/src/icons/gpii-color.ico",
        keyedOut: "%gpii-app/src/icons/gpii.ico"
    },
    components: {
        menu: {
            type: "gpii.app.menuInApp",
            options: {
                events: {
                    onActivePreferenceSetAltered: "{tray}.events.onActivePreferenceSetAltered"
                }
            }
        }
    },
    events: {
        onActivePreferenceSetAltered: null // passed from parent
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
  * @param {Object} tray - An instance of an Electron Tray.
  * @param {String} icon - The simple path to the icon file.
  */
gpii.app.tray.setTrayIcon = function (tray, icon) {
    var iconPath = fluid.module.resolvePath(icon);
    tray.setImage(iconPath);
};

/**
 * Creates the Electron Tray.
 *
 * @param {Object} options - A configuration object for the tray that will be created.
 * @param {Function} openPSP - A function for showing the PSP window. Should be called whenever the user left clicks on
 * the tray icon or uses the PSP window shortcut.
 * @return {Object} - The tray object.
 */
gpii.app.makeTray = function (options, openPSP) {
    var tray = new Tray(fluid.module.resolvePath(options.icons.keyedOut));

    tray.on("click", function () {
        openPSP();
    });

    globalShortcut.register(options.shortcut, function () {
        openPSP();
    });

    return tray;
};

/**
 * Returns the path to the icon for the Electron Tray based on whether there is a keyed-in user and on the pending
 * setting changes (if any).
 *
 * @param {String} keyedInUserToken - The token if the keyed-in user or `null` if there is no such.
 * @param {Array} pendingChanges - An array containing all pending setting changes.
 * @param {Object} icons - An object containing all possible icon paths.
 * @return {String} - The path to the icon for the Electron Tray.
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
 * @param {Object} preferences - An object describing the preference sets (including the
 * active one) for the currently keyed-in user (if any).
 * @param {Array} pendingChanges - An array containing all pending setting changes.
 * @param {Object} tooltips - An object containing all possible tooltip texts.
 * @return {String} - The tooltip label for the Electron Tray.
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
