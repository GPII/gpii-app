/**
 * PSP Tray's context menu
 *
 * Introduces set a of components responsible for the context menu of the PSP's Electron tray icon.
 * Copyright 2016 Steven Githens
 * Copyright 2016-2017 OCAD University
 *
 * Licensed under the New BSD license. You may not use this file except in
 * compliance with this License.
 * The research leading to these results has re eived funding from the European Union's
 * Seventh Framework Programme (FP7/2007-2013) under grant agreement no. 289016.
 * You may obtain a copy of the License at
 *
 * https://github.com/GPII/universal/blob/master/LICENSE.txt
 */
"use strict";

var fluid = require("infusion");
var Menu  = require("electron").Menu;

var gpii  = fluid.registerNamespace("gpii");

/*
 ** Configuration for using the menu in the app.
 ** Note that this is an incomplete grade which references the app.
 */
fluid.defaults("gpii.app.menuInApp", {
    gradeNames: "gpii.app.menu",
    model: {
        isKeyedIn: "{app}.model.isKeyedIn",
        keyedInUserToken: "{app}.model.keyedInUserToken",
        snapsetName: "{app}.model.snapsetName",
        preferences: {
            sets: "{app}.model.preferences.sets",
            activeSet: "{app}.model.preferences.activeSet"
        }
    },
    modelListeners: {
        "menuTemplate": {
            namespace: "updateMenu",
            funcName: "gpii.app.updateMenu",
            args: ["{tray}.tray", "{that}.model.menuTemplate", "{that}.events"]
        }
    },
    listeners: {
        "onQss.performQssShow": {
            listener: "{qssWrapper}.qss.show"
        },

        "onAbout.showAbout": {
            listener: "{dialogManager}.show",
            args: ["aboutDialog"]
        },

        // onKeyOut event is fired when a keyed-in user keys out through the task tray.
        // This should result in:
        // 1. key out the currently keyed in user
        //    a) change model.keyedInUserToken
        //    b) update the menu
        "onKeyOut.performKeyOut": {
            listener: "{app}.keyOut"
        }
    }
});

/**
 * Refreshes the task tray menu for the GPII Application using the menu in the model.
 *
 * @param {Object} tray - An Electron 'Tray' object.
 * @param {Array} menuTemplate - A nested array that is the menu template for the GPII Application.
 * @param {Object} events - An object containing the events that may be fired by items in the menu.
 */
gpii.app.updateMenu = function (tray, menuTemplate, events) {
    // XXX Related to: https://github.com/electron/electron/issues/12698
    // Needed in order to get around this non graceful check: https://github.com/electron/electron/blob/v1.8.4/lib/browser/api/menu.js#L170
    // The infusion's expander applies a different contexts (generated with https://nodejs.org/api/vm.html)
    // than the current which cases this Array check to fail.
    menuTemplate = gpii.app.recontextualise(menuTemplate);

    menuTemplate = gpii.app.menu.expandMenuTemplate(menuTemplate, events);

    tray.setContextMenu(Menu.buildFromTemplate(menuTemplate));
};


/**
 * Extended menu version to support Dev functionality:
 * - manual keyIn from a fixed snapsets
 * - manual exit from the PSP
 */
fluid.defaults("gpii.app.menuInAppDev", {
    gradeNames: "gpii.app.menuInApp",

    // Override menu list generation to include dev options
    modelRelay: {
        "menuTemplate": {
            target: "menuTemplate",
            singleTransform: {
                type: "fluid.transforms.free",
                func: "gpii.app.menu.generateMenuTemplate",
                args: [
                    "{that}.model.showQSS",
                    "{that}.model.keyedInSnapset",
                    "{that}.options.locales",
                    "{that}.options.themes",
                    "{that}.options.snapsets",
                    "{that}.model.preferenceSetsMenuItems",
                    "{that}.model.showAbout",
                    "@expand:gpii.app.menu.getSeparatorItem()",
                    "{that}.model.keyOut",
                    "{that}.options.exit"]
            },
            priority: "last"
        }
    },
    events: {
        onLocale: null,
        onThemeChanged: null,
        onKeyIn: null,
        onExit: null
    },

    listeners: {
        "onLocale.changeLocale": {
            changePath: "{app}.model.locale",
            value: "{arguments}.0.locale"
        },
        "onThemeChanged.changeTheme": {
            changePath: "{app}.model.theme",
            value: "{arguments}.0.theme"
        },
        // Key-in using /proximityTriggered endpoint automatically takes care
        // of the keyout of the preious key.
        "onKeyIn.performKeyIn": {
            listener: "{app}.keyIn",
            args: ["{arguments}.0.token"], // token
        },
        // onKeyIn event is fired when a new user keys in through the task tray.
        // This should result in:
        // 1. key out the old keyed in user token
        // 2. key in the new user token
        //   a) trigger GPII {lifecycleManager}.events.onSessionStart
        //   b) fire a model change to set the new model.keyedInUserToken
        //   c) update the menu
        // "onKeyIn.performKeyOut": {
        //     listener: "{app}.keyOut",
        //     args: ["{that}.model.keyedInUserToken", true]
        // },
        // "onKeyIn.performKeyIn": {
        //     listener: "{app}.keyIn",
        //     args: ["{arguments}.0.token"], // token
        //     priority: "after:performKeyOut"
        // },

        // onExit
        "onExit.performExit": {
            listener: "{app}.exit"
        }
    },

    locales: {
        label: "Locale",
        submenu: [{
            label: "bg",
            click: "onLocale",
            args: {
                locale: "bg"
            }
        }, {
            label: "en",
            click: "onLocale",
            args: {
                locale: "en_us"
            }
        }, {
            label: "missing",
            click: "onLocale",
            args: {
                locale: "fr"
            }
        }]
    },

    themes: {
        label: "Theme...",
        submenu: [{
            label: "white",
            click: "onThemeChanged",
            args: {
                theme: "white"
            }
        }, {
            label: "dark",
            click: "onThemeChanged",
            args: {
                theme: "dark"
            }
        }]
    },

    // The list of the default snapsets shown on the task tray menu for key-in
    snapsets: {
        label: "Key in ...",
        submenu: [{
            label: "Voice control with Increased Size",
            click: "onKeyIn",
            args: {
                token: "snapset_5"
            }
        }, {
            label: "Larger 125%",
            click: "onKeyIn",
            args: {
                token: "snapset_1a"
            }
        }, {
            label: "Larger 150%",
            click: "onKeyIn",
            args: {
                token: "snapset_1b"
            }
        }, {
            label: "Larger 175%",
            click: "onKeyIn",
            args: {
                token: "snapset_1c"
            }
        }, {
            label: "Dark & Larger 125%",
            click: "onKeyIn",
            args: {
                token: "snapset_2a"
            }
        }, {
            label: "Dark & Larger 150%",
            click: "onKeyIn",
            args: {
                token: "snapset_2b"
            }
        }, {
            label: "Dark & Larger 175%",
            click: "onKeyIn",
            args: {
                token: "snapset_2c"
            }
        }, {
            label: "Read To Me",
            click: "onKeyIn",
            args: {
                token: "snapset_3"
            }
        }, {
            label: "Magnifier 200%",
            click: "onKeyIn",
            args: {
                token: "snapset_4a"
            }
        }, {
            label: "Magnifier 400%",
            click: "onKeyIn",
            args: {
                token: "snapset_4b"
            }
        }, {
            label: "Magnifier 200% & Display Scaling 175%",
            click: "onKeyIn",
            args: {
                token: "snapset_4c"
            }
        }, {
            label: "Dark Magnifier 200%",
            click: "onKeyIn",
            args: {
                token: "snapset_4d"
            }
        }, {
            label: "Multiple pref sets. Magnifier & Volume Control",
            click: "onKeyIn",
            args: {
                token: "multi_context"
            }
        }, {
            label: "Invalid user",
            click: "onKeyIn",
            args: {
                token: "danailbd"
            }
        }]
    },
    exit: {
        label: "Exit GPII",
        click: "onExit"
    }
});


/*
 * Component to generate the menu tree structure that is relayed to gpii.app for display.
 */
fluid.defaults("gpii.app.menu", {
    gradeNames: "fluid.modelComponent",
    model: {
        // Expected as configuration
        //keyedInUserToken: null,
        //snapsetName: null,
        //preferences: {
        //    sets: null,
        //    activeSet: null
        //},
        // locally updated
        menuTemplate: [],             // This is updated on change of keyedInUserToken.

        preferenceSetsMenuItems: [],  // Updated on `preferences` changed.
        keyedInSnapset: null,        // Must be updated when keyedInUserToken changes.
        keyOut: null,                 // May or may not be in the menu, must be updated when keyedInUserToken changes.
        showAbout: null,
        showQSS: null,

        messages: {
            about:      null,
            keyOut:     null,
            keyedIn:    null,
            notKeyedIn: null,
            openQss:    null
        }
    },
    modelRelay: {
        "keyedInSnapset": {
            target: "keyedInSnapset",
            singleTransform: {
                type: "fluid.transforms.free",
                func: "gpii.app.menu.getKeyedInSnapset",
                args: ["{that}.model.isKeyedIn", "{that}.model.snapsetName", "{that}.model.messages.keyedIn"]
            },
            forward: {
                excludeSource: "init"
            }
        },
        "keyOut": {
            target: "keyOut",
            singleTransform: {
                type: "fluid.transforms.free",
                func: "gpii.app.menu.getKeyOut",
                args: [
                    "{that}.model.isKeyedIn",
                    "{that}.model.keyedInUserToken",
                    "{that}.model.messages.keyOut",
                    "{that}.model.messages.notKeyedIn"
                ]
            },
            forward: {
                excludeSource: "init"
            }
        },
        "showAbout": {
            target: "showAbout",
            singleTransform: {
                type: "fluid.transforms.free",
                func: "gpii.app.menu.getSimpleMenuItem",
                args: ["{that}.model.messages.about", "onAbout"]
            },
            forward: {
                excludeSource: "init"
            }
        },
        "showQSS": {
            target: "showQSS",
            singleTransform: {
                type: "fluid.transforms.free",
                func: "gpii.app.menu.getSimpleMenuItem",
                args: ["{that}.model.messages.openQss", "onQss"]
            },
            forward: {
                excludeSource: "init"
            }
        },
        "preferenceSetsMenuItems": {
            target: "preferenceSetsMenuItems",
            singleTransform: {
                type: "fluid.transforms.free",
                func: "gpii.app.menu.getPreferenceSetsMenuItems",
                args: ["{that}.model.isKeyedIn", "{that}.model.preferences.sets", "{that}.model.preferences.activeSet"]
            },
            forward: {
                excludeSource: "init"
            }
        },
        "menuTemplate": {
            target: "menuTemplate",
            singleTransform: {
                type: "fluid.transforms.free",
                func: "gpii.app.menu.generateMenuTemplate",
                args: [
                    "{that}.model.showQSS",
                    "{that}.model.keyedInSnapset",
                    "{that}.model.preferenceSetsMenuItems",
                    "{that}.model.showAbout",
                    "@expand:gpii.app.menu.getSeparatorItem()",
                    "{that}.model.keyOut"
                ]
            },
            forward: {
                excludeSource: "init"
            },
            priority: "last"
        }
    },
    events: {
        onQss:                        null,
        onAbout:                      null,
        onActivePreferenceSetAltered: null,
        onKeyOut:                     null
    }
});

/**
 * Object representing options for a `Electron` `ContextMenu` item.
 * @typedef {Object} ElectronMenuItem
 * @property {String} label The label that will be visualized in the menu
 * @property {String} enabled Whether the menu item is enabled
 * @property {String} [type] The type of the menu item
 * @property {String} [click] The event that is fired when the menu item is clicked
 * @property {Object} [args] The arguments to be passed to the click handler currently in use
 * @property {String} [args.token] The user token
 * @property {String} [args.path] The path of the setting
 */

/**
 * Generates an object that represents the menu item for keying in.
 *
 * @param {Boolean} isKeyedIn - Indicates whether there is a currently keyed in user.
 * @param {String} snapsetName - The user-friendly name of the keyed in snapset.
 * @param {String} keyedInStrTemp - The string template for the label when a user is keyed in.
 * @return {ElectronMenuItem} - The Electron menu item for keying in.
 */
gpii.app.menu.getKeyedInSnapset = function (isKeyedIn, snapsetName, keyedInStrTemp) {
    var keyedInUser = null;

    if (isKeyedIn) {
        keyedInUser = {
            label: fluid.stringTemplate(keyedInStrTemp, {"snapsetName": snapsetName}),
            enabled: false
        };
    }

    return keyedInUser;
};

/**
 * Generates an object that represents the menu item for keying out.
 * @param {Boolean} isKeyedIn - Indicates whether there is a currently keyed in user.
 * @param {String} keyedInUserToken - The user token that is currently keyed in.
 * @param {String} keyOutStr - The string to be displayed for the key out menu item if there is a keyed in user.
 * @param {String} notKeyedInStr - The string to be displayed when a user is not keyed in.
 * @return {ElectronMenuItem} - The Electron menu item for keying out.
 */
gpii.app.menu.getKeyOut = function (isKeyedIn, keyedInUserToken, keyOutStr, notKeyedInStr) {
    var keyOut;

    if (isKeyedIn) {
        keyOut = {
            label: keyOutStr,
            click: "onKeyOut",
            args: {
                token: keyedInUserToken
            },
            enabled: true
        };
    } else {
        keyOut = {
            label: notKeyedInStr,
            enabled: false
        };
    }

    return keyOut;
};

/**
 * Generates an array that represents the menu items related to a user's preference sets. The returned array can be used
 * in the context menu of a {Tray} object.
 * @param {Boolean} isKeyedIn - Indicates whether there is a currently keyed in user.
 * @param {Array} preferenceSets - An array of all preference sets for the user.
 * @param {String} activeSet - The path of the currently active preference set.
 * @return {ElectronMenuItem[]} - An array of Electron menu items.
 */
gpii.app.menu.getPreferenceSetsMenuItems = function (isKeyedIn, preferenceSets, activeSet) {
    if (!isKeyedIn) {
        return [];
    }

    var preferenceSetsLabels,
        separator = {type: "separator"};

    preferenceSetsLabels = preferenceSets.map(function (preferenceSet) {
        return {
            label: preferenceSet.name,
            type: "radio",
            args: preferenceSet.path,
            click: "onActivePreferenceSetAltered",
            checked: preferenceSet.path === activeSet
        };
    });

    if (preferenceSetsLabels.length > 0) {
        preferenceSetsLabels.unshift(separator);
        preferenceSetsLabels.push(separator);
    }

    return preferenceSetsLabels;
};

/**
  * Generates an object that represents a selectable menu item
  * @param {String} label - The label of the item.
  * @param {String} event - The event to be triggered on click.
  * @param {Object} [payload] - The payload that is to be supplied with the on click event.
  * @return {ElectronMenuItem} A simple selectable Electron menu item.
  */
gpii.app.menu.getSimpleMenuItem = function (label, event, payload) {
    return {
        label: label,
        click: event,
        args: payload || {}
    };
};

/**
 * Generate a simple Electron context menu separator item.
 * @return {Object} The separator menu item.
 */
gpii.app.menu.getSeparatorItem = function () {
    return {type: "separator"};
};

/**
  * Creates a JSON representation of a menu.
  * @param {...Object} The - arguments represent menu item templates and should be passed to the function
  * in the order they should appear in the menu. If an item is not defined or null, it should be ignored.
  * @return {Array} An array of the menu item templates.
  */
gpii.app.menu.generateMenuTemplate = function (/* all the items in the menu */) {
    var menuTemplate = [],
        menuItems = fluid.flatten(fluid.makeArray(arguments));

    fluid.each(menuItems, function (item) {
        if (item) {
            menuTemplate.push(item);
        }
    });

    return menuTemplate;
};

/**
 * Takes a JSON array that represents a menu template and expands the "click" entries into functions that fire the
 * appropriate event.
 *
 * @param {Array} menuTemplate - A JSON array that represents a menu template
 * @param {Object} events - An object that contains the events that might be fired from an item in the menu.
 * @return {Array} The expanded menu template. This can be used to create an Electron menu.
 */
gpii.app.menu.expandMenuTemplate = function (menuTemplate, events) {
    fluid.each(menuTemplate, function (menuItem) {
        if (typeof menuItem.click === "string") {
            var evtName = menuItem.click;
            menuItem.click = function () {
                events[evtName].fire(menuItem.args);
            };
        }
        if (menuItem.submenu) {
            menuItem.submenu = gpii.app.menu.expandMenuTemplate(menuItem.submenu, events);
        }
    });

    return menuTemplate;
};
