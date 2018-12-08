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
var child_process = require("child_process");

var Tray           = electron.Tray;
var gpii           = fluid.registerNamespace("gpii");

/**
 * Component that controls the tray widgets.
 */
fluid.defaults("gpii.app.tray", {
    gradeNames: ["fluid.modelComponent", "{that}.options.trayType"],
    icons: {
        keyedIn: "%gpii-app/src/icons/Morphic-tray-icon-green.ico",
        keyedOut: "%gpii-app/src/icons/Morphic-tray-icon-white.ico",
        highContrast: "%gpii-app/src/icons/Morphic-tray-icon-white.ico"
    },
    components: {
        menu: {
            type: "gpii.app.menuInApp",
            options: {
                events: {
                    onActivePreferenceSetAltered: "{tray}.events.onActivePreferenceSetAltered",
                    onMenuUpdated: "{tray}.events.onMenuUpdated"
                }
            }
        }
    },
    events: {
        onActivePreferenceSetAltered: null, // passed from parent
        onMenuUpdated: null,
        onTrayIconClicked: null
    },
    model: {
        isKeyedIn: false,
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
                args: ["{that}.model.isKeyedIn", "{gpii.app.tray}.options.icons"]
            }
        },
        "tooltip": {
            target: "tooltip",
            singleTransform: {
                type: "fluid.transforms.free",
                func: "gpii.app.getTrayTooltip",
                args: ["{that}.model.isKeyedIn", "{that}.model.preferences", "{that}.model.messages"]
            }
        }
    }
});

/**
 * Returns the path to the icon for the Electron Tray based on whether there is a
 * keyed-in user.
 * @param {Boolean} isKeyedIn - Indicates whether there is a currently keyed in user.
 * @param {Object} icons - An object containing all possible icon paths.
 * @return {String} The path to the icon for the Electron Tray.
 */
gpii.app.getTrayIcon = function (isKeyedIn, icons) {
    return fluid.module.resolvePath(isKeyedIn ? icons.keyedIn : icons.keyedOut);
};

/**
 * Returns the tooltip for the Electron Tray based on the active preference set.
 * @param {Boolean} isKeyedIn - Indicates whether there is a currently keyed in user.
 * @param {Object} preferences - An object describing the preference sets (including the
 * active one) for the currently keyed-in user (if any).
 * @param {Object} messages - An object containing differen messages for the tray tooltip.
 * @return {String} The tooltip label for the Electron Tray.
 */
gpii.app.getTrayTooltip = function (isKeyedIn, preferences, messages) {
    if (!isKeyedIn) {
        return messages.defaultTooltip;
    }

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

// Wrapper of the electron Tray
fluid.defaults("gpii.app.trayIcon", {
    gradeNames: ["fluid.modelComponent"],
    modelListeners: {
        icon: {
            this: "{that}.trayIcon",
            method: "setImage",
            args: [ "{change}.value" ],
            excludeSource: "init"
        },
        tooltip: {
            this: "{that}.trayIcon",
            method: "setToolTip",
            args: [ "{change}.value" ],
            excludeSource: "init"
        }
    },
    listeners: {
        "onDestroy.cleanupElectron": {
            this: "{that}.trayIcon",
            method: "destroy"
        },
        "onMenuUpdated.trayIcon": {
            this: "{that}.trayIcon",
            method: "setContextMenu",
            args: [ "{arguments}.0" ]
        }
    },
    members: {
        trayIcon: {
            expander: {
                funcName: "gpii.app.makeIcon",
                args: ["{gpii.app.tray}.options", "{that}.events"]
            }
        }
    }
});

/**
 * Creates the Electron Tray
 * @param {Object} options A configuration object for the tray that will be created.
 * @param {Object} events Object containing component's events.
 * @return {Tray} - The tray object.
 */
gpii.app.makeIcon = function (options, events) {
    var tray = new Tray(gpii.app.getTrayIcon(false, options.icons));

    tray.on("click", function () {
        events.onTrayIconClicked.fire();
    });

    return tray;
};

// A task bar button.
fluid.defaults("gpii.app.trayButton", {
    gradeNames: ["fluid.modelComponent", "fluid.contextAware"],
    contextAwareness: {
        platform: {
            checks: {
                windows: {
                    contextValue: "{gpii.contexts.windows}",
                    gradeNames: "gpii.app.trayButton.windows"
                }
            }
        }
    },
    invokers: {
        startProcess: {
            funcName: "gpii.app.trayButton.startProcess",
            args: [ "{that}" ]
        },
        remove: {
            func: "{that}.updateButton",
            args: [ "{that}.buttonItems.destroy" ]
        },
        updateButton: {
            func: "{that}.sendDataMessage", // command, data
            args: [ "{that}.trayButtonWindow", "{arguments}.0", "{arguments}.1" ]
        }
    },
    listeners: {
        "onCreate.init": "{that}.startProcess()",
        "onDestroy.remove": "{that}.remove()",
        "onMenuUpdated.trayButton": {
            funcName: "gpii.app.trayButton.setMenu",
            args: [ "{that}", "{arguments}.0" ]
        }
    },
    modelListeners: {
        icon: {
            func: "{that}.updateButton",
            args: [ "{that}.buttonItems.icon", "{change}.value" ]
        },
        highContrastIcon: {
            func: "{that}.updateButton",
            args: [ "{that}.buttonItems.highContrastIcon", "{change}.value" ]
        },
        tooltip: {
            func: "{that}.updateButton",
            args: [ "{that}.buttonItems.toolTip", "{change}.value" ]
        },
        isKeyedIn: {
            func: "{that}.updateButton",
            args: [ "{that}.buttonItems.state", "{change}.value" ]
        }
    },
    model: {
        highContrastIcon: "{that}.options.icons.highContrastIcon"
    },
    members: {
        buttonItems: {
            // Set the current icon
            icon: 1,
            // Set the icon used when high-contrast is on
            highContrastIcon: 2,
            // Set the tool tip
            toolTip: 3,
            // Remove the icon
            destroy: 4,
            // Set whether or not the button should look "on" (for high-contrast)
            state: 5
        },
        // Path to the tray button window.
        trayButtonWindow: ["Shell_TrayWnd", "GPII-TrayButton"],
        trayButtonMessage: "GPII-TrayButton-Message",
        menu: null
    },
    trayButtonExe: "%gpii-app/bin/tray-button.exe"
});

fluid.defaults("gpii.app.trayButton.windows", {
    invokers: {
        sendDataMessage: {
            func: "{gpii.windows.messages}.sendData", // window class, command, data
            args: ["{arguments}.0", "{arguments}.1", "{arguments}.2"]
        }
    },
    listeners: {
        "onCreate.messages": "{gpii.windows.messages}.start({that})",
        "onDestroy.messages": "{gpii.windows.messages}.stop({that})",
        "{gpii.windows.messages}.events.onMessage": {
            funcName: "gpii.app.trayButton.windowMessage",
            // that, hwnd, msg, wParam, lParam
            args: ["{that}", "{arguments}.0", "{arguments}.1", "{arguments}.2", "{arguments}.3"]
        }
    }
});

// Notifications sent from the button
gpii.app.trayButton.notifications = {
    // Update everything
    update: 0,
    // Left button clicked
    click: 1,
    // Show the menu (right button clicked)
    showMenu: 2
};

/**
 * Starts the tray button process, and restarts it if it dies.
 * @param {Component} that The gpii.app.trayButton instance.
 */
gpii.app.trayButton.startProcess = function (that) {
    fluid.log("Starting TrayButton process.");
    var child = child_process.spawn(fluid.module.resolvePath(that.options.trayButtonExe), []);
    child.on("exit", function (code) {
        fluid.log("TrayButton process terminated.");
        if (code && !fluid.isDestroyed(that)) {
            that.startProcess();
        }
    });
};

/**
 * Sets the context menu.
 * @param {Component} that The gpii.app.trayButton instance.
 * @param {Electron.Menu} menu The menu object.
 */
gpii.app.trayButton.setMenu = function (that, menu) {
    that.menu = menu;
};

/**
 * Handles messages sent from the tray button.
 * @param {Component} that The gpii.app.trayButton instance.
 * @param {Number} hwnd The message window.
 * @param {Number|String} msg The message.
 * @param {Number} wParam Message data.
 */
gpii.app.trayButton.windowMessage = function (that, hwnd, msg, wParam) {
    if (msg === that.trayButtonMessage) {
        switch (wParam) {
        case gpii.app.trayButton.notifications.click:
            that.events.onTrayIconClicked.fire();
            break;

        case gpii.app.trayButton.notifications.showMenu:
            if (that.menu) {
                that.menu.popup({});
            }
            break;

        case gpii.app.trayButton.notifications.update:
            that.updateButton(that.buttonItems.highContrastIcon,
                fluid.module.resolvePath(that.options.icons.highContrast));
            that.updateButton(that.buttonItems.state, that.model.isKeyedIn);
            that.updateButton(that.buttonItems.icon, that.model.icon);
            that.updateButton(that.buttonItems.toolTip, that.model.tooltip);
            break;

        default:
            break;
        }
    }
};
