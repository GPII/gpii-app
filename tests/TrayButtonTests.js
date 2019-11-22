/**
 * Tray button unit tests
 *
 * Copyright 2018 Raising the Floor - International
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
var gpii = fluid.registerNamespace("gpii");
fluid.loadTestingSupport();
var jqUnit = fluid.require("node-jqunit");

require("../src/main/app.js");
fluid.registerNamespace("gpii.tests.app.trayButton");

jqUnit.module("Tray Button Tests");

gpii.tests.app.trayButton.buttonTests = fluid.freezeRecursive([
    {
        name: "icon",
        value: fluid.module.resolvePath("%gpii-app/src/icons/Morphic-tray-icon-white.ico")
    },
    {
        name: "highContrastIcon",
        value: fluid.module.resolvePath("%gpii-app/src/icons/Morphic-tray-icon-white.ico")
    },
    {
        name: "tooltip",
        value: "hello"
    },
    {
        name: "icon",
        value: fluid.module.resolvePath("%gpii-app/src/icons/Morphic-tray-icon-green.ico")
    },
    {
        name: "isKeyedIn",
        value: true
    },
    {
        name: "isKeyedIn",
        value: false
    },
    {
        name: "icon",
        value: "bad icon file"
    }
]);

/**
 * Checks if the button seems to be displayed correctly.
 * @param {Number} buttonWindow The button's window handle.
 * @param {Number} taskbarWindow The taskbar's window handle.
 */
gpii.tests.app.trayButton.checkButton = function (buttonWindow, taskbarWindow) {
    var buttonRect = gpii.windows.getWindowRect(buttonWindow);
    var taskbarRect = gpii.windows.getWindowRect(taskbarWindow);
    var inside = buttonRect.left >= taskbarRect.left && buttonRect.right <= taskbarRect.right
        && buttonRect.top >= taskbarRect.top && buttonRect.bottom <= taskbarRect.bottom;
    fluid.log("button rect:", buttonRect);
    fluid.log("taskbar rect:", taskbarRect);
    jqUnit.assertTrue("button should be contained in the taskbar", inside);

    // This assumes a horizontal taskbar
    jqUnit.assertTrue("button should be a reasonable width", buttonRect.width > 15 && buttonRect.width < 100);
    jqUnit.assertTrue("button should be a roughly the same height as the taskbar",
        (taskbarRect.height - buttonRect.height) < 3);
};

/**
 * Event handler for onTrayIconClicked
 * @param {Component} that The trayButton instance.
 */
gpii.tests.app.trayButton.buttonClicked = function (that) {
    that.clicked++;
};

/**
 * Event handler for onMenuUpdated
 * @param {Component} that The trayButton instance.
 * @param {Object} menu The new menu object.
 */
gpii.tests.app.trayButton.buttonMenuUpdated = function (that, menu) {
    that.menu = menu;
};

// Tests the button by making changes to it, and check that it is still there.
jqUnit.asyncTest("Testing tray button", function () {

    var tests = gpii.tests.app.trayButton.buttonTests;
    var checkButtonExpects = 3;
    jqUnit.expect(checkButtonExpects * (tests.length + 2) + 6);

    // Make sure there isn't a button already (from another instance).
    var buttonWindows = gpii.windows.findWindows(["Shell_TrayWnd", "GPII-TrayButton"]);
    jqUnit.assertEquals("Button window should not exist (yet)", 0, buttonWindows.length);

    var fakeMenu = {
        poppedUp: 0,
        popup: function () {
            fakeMenu.poppedUp++;
        }
    };

    var trayButton = gpii.app.trayButton({
        events: {
            onMenuUpdated: null,
            onTrayIconClicked: null
        },
        listeners: {
            onMenuUpdated: {
                funcName: "gpii.tests.app.trayButton.buttonMenuUpdated",
                args: [ "{that}", "{arguments}.0" ]
            },
            onTrayIconClicked: {
                funcName: "gpii.tests.app.trayButton.buttonClicked",
                args: [ "{that}" ]
            }
        },
        members: {
            clicked: 0
        }
    });

    var taskbarWindow = gpii.windows.findWindows("Shell_TrayWnd")[0];
    jqUnit.assertTrue("taskbar should exist", !!taskbarWindow);

    var leftButtonClicks = 3;
    var rightButtonClicks = 2;

    var buttonWindow;
    var newButtonWindow;
    var work = [
        // Test the button gets created
        function () {
            fluid.log("Waiting for button window");
            return gpii.windows.waitForCondition(function () {
                buttonWindow = gpii.windows.findWindows(["Shell_TrayWnd", "GPII-TrayButton"])[0];
                return !!buttonWindow;
            }, {timeout: 5000});
        },
        // Test the button survives changes
        function () {
            gpii.tests.app.trayButton.checkButton(buttonWindow, taskbarWindow);

            // Make changes to the button, and check if it's still ok and nothing has exploded.
            fluid.each(tests, function (test) {
                fluid.log("Changing button: ", test);
                trayButton.applier.change(test.name, test.value);
                gpii.tests.app.trayButton.checkButton(buttonWindow, taskbarWindow);
            });

            // Kill the button process, it should restart.
            gpii.windows.killProcessByName("tray-button.exe");

            fluid.log("Waiting for new button");
            return gpii.windows.waitForCondition(function () {
                newButtonWindow = gpii.windows.findWindows(["Shell_TrayWnd", "GPII-TrayButton"])[0];
                return !!newButtonWindow && newButtonWindow !== buttonWindow;
            }, {timeout:5000});
        },
        // Test the events
        function () {
            var leftButtonMessage = gpii.windows.API_constants.WM_LBUTTONUP;
            var rightButtonMessage = gpii.windows.API_constants.WM_RBUTTONUP;

            jqUnit.assertNull("Menu should not be already set", trayButton.menu);
            trayButton.events.onMenuUpdated.fire(fakeMenu);
            jqUnit.assertDeepEq("Menu should be set", fakeMenu, trayButton.menu);

            jqUnit.assertEquals("Button should not have been clicked before", 0, trayButton.clicked);
            jqUnit.assertEquals("Menu should not have been popped up before", 0, trayButton.menu.poppedUp);

            fluid.log("Clicking tray button");

            // Click the buttons a few times, by sending the windows message to the button.
            for (var n = 0; n < Math.max(leftButtonClicks, rightButtonClicks); n++) {
                if (n < leftButtonClicks) {
                    gpii.windows.messages.sendMessage(newButtonWindow, leftButtonMessage, 0, 0);
                }
                if (n < rightButtonClicks) {
                    gpii.windows.messages.sendMessage(newButtonWindow, rightButtonMessage, 0, 0);
                }
            }

            // Wait a moment for the messages to go through (almost instant)
            return gpii.windows.waitForCondition(function () {
                return trayButton.clicked === leftButtonClicks && trayButton.menu.poppedUp;
            }, {timeout:2000}).then(null, function () {
                fluid.log("clicks: left=" + leftButtonClicks + " right=" + rightButtonClicks);
                fluid.log("actual: left=" + trayButton.clicked + " right=" + trayButton.menu.poppedUp);
                jqUnit.fail("Timed out waiting for all clicks to be received");
            });
        },
        function () {
            gpii.tests.app.trayButton.checkButton(newButtonWindow, taskbarWindow);
            // Stop it gracefully
            trayButton.destroy();

            fluid.log("Waiting for button to be destroyed");
            return gpii.windows.waitForCondition(function () {
                var exists = gpii.windows.findWindows(["Shell_TrayWnd", "GPII-TrayButton"]).length > 0;
                return !exists;
            }, {timeout:5000});
        }
    ];

    fluid.promise.sequence(work).then(jqUnit.start, jqUnit.fail);
});
