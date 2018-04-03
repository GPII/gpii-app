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
        icon: "{that}.options.icons.keyedOut",
        preferences: "{app}.model.preferences",
        tooltip: "",
        messages: {
            defaultTooltip: null,
            prefSetTooltip: null
        }
    },
    modelRelay: {
        "icon": {
            target: "icon",
            singleTransform: {
                type: "fluid.transforms.free",
                func: "gpii.app.getTrayIcon",
                args: ["{that}.model.keyedInUserToken", "{that}.options.icons"]
            }
        },
        "tooltip": {
            target: "tooltip",
            singleTransform: {
                type: "fluid.transforms.free",
                func: "gpii.app.getTrayTooltip",
                args: ["{that}.model.preferences", "{that}.model.messages"]
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
            funcName: "gpii.app.tray.setTrayTooltip",
            args: ["{that}.tray", "{that}.model.tooltip"],
            excludeSource: "init"
        }
    },
    listeners: {
        "onDestroy.cleanupElectron": {
            this: "{that}.tray",
            method: "destroy"
        }
    }
});

/**
  * Sets the icon for the Electron Tray which represents the GPII application.
  * @param tray {Object} An instance of an Electron Tray.
  * @param icon {String} The simple path to the icon file.
  */
gpii.app.tray.setTrayIcon = function (tray, icon) {
    var iconPath = fluid.module.resolvePath(icon);
    tray.setImage(iconPath);
};

/**
  * Sets the tooltip for the Electron Tray icon. If a falsy value is provided,
  * the current tooltip will be removed.
  * @param tray {Object} An instance of an Electron Tray.
  * @param tooltip {String} The tooltip to be set.
  */
gpii.app.tray.setTrayTooltip = function (tray, tooltip) {
    tooltip = tooltip || "";
    tray.setToolTip(tooltip);
};

/**
  * Creates the Electron Tray
  * @param options {Object} A configuration object for the tray that will be created.
  * @param openPSP {Function} A function for showing the PSP window. Should be called
  * whenever the user left clicks on the tray icon or uses the PSP window shortcut.
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
 * Returns the path to the icon for the Electron Tray based on whether there is a
 * keyed-in user.
 * @param keyedInUserToken {String} The token if the keyed-in user or `null` if
 * there is no such.
 * @param icons {Object} An object containing all possible icon paths.
 * @return The path to the icon for the Electron Tray.
 */
gpii.app.getTrayIcon = function (keyedInUserToken, icons) {
    return keyedInUserToken ? icons.keyedIn : icons.keyedOut;
};

/**
 * Returns the tooltip for the Electron Tray based on the active preference set.
 * @param preferences {Object} An object describing the preference sets (including the
 * active one) for the currently keyed-in user (if any).
 * @param messages {Object} An object containing differen messages for the tray tooltip.
 * @return The tooltip label for the Electron Tray.
 */
gpii.app.getTrayTooltip = function (preferences, messages) {
    var activePreferenceSet = fluid.find_if(preferences.sets,
        function (preferenceSet) {
            return preferenceSet.path === preferences.activeSet;
        }
    );

    if (activePreferenceSet && messages.prefSetTooltip) {
        return fluid.stringTemplate(messages.prefSetTooltip, {
            prefSet: activePreferenceSet.name
        });
    }

    return messages.defaultTooltip;
};
