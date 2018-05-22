/**
 * Interactions listeners
 *
 * Generic components for DOM element interaction events.
 * Copyright 2017 Raising the Floor - International
 *
 * Licensed under the New BSD license. You may not use this file except in
 * compliance with this License.
 * The research leading to these results has received funding from the European Union's
 * Seventh Framework Programme (FP7/2007-2013) under grant agreement no. 289016.
 * You may obtain a copy of the License at
 * https://github.com/GPII/universal/blob/master/LICENSE.txt
 */

/* global fluid */

"use strict";
(function (fluid) {
    var gpii = fluid.registerNamespace("gpii");


    fluid.defaults("gpii.qss.elementRepeater.clickable", {
        events: {
            onClicked: null
        },

        listeners: {
            "onCreate.addClickHandler": {
                this: "{that}.container",
                method: "click",
                args: "{that}.events.onClicked.fire"
            }
        }
    });

    /**
     * TODO
     * add timeout?
     */
    fluid.defaults("gpii.qss.elementRepeater.hoverable", {
        events: {
            onMouseEnter: null,
            onMouseLeave: null
        },

        listeners: {
            "onCreate.addHoverHandler": {
                this: "{that}.container",
                method: "hover",
                args: [
                    "{that}.events.onMouseEnter.fire",
                    "{that}.events.onMouseLeave.fire"
                ]
            }
        }
    });


    /**
     * Register keyup events on a DOM element. Once a key is pressed a
     * corresponding component's event is fired, if event by a special name
     * is supplied for it.
     * Every special component event follow the format: `on<KeyName>Clicked`
     * where the available <KeyName>s can be view here:
     * https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key/Key_Values
     *
     * Expects the either a target (jquery element) to be given or
     * the implementor component to have container (fluid.viewComponent).
     *
     * N.B.! The <KeyName> for the space bar is "Spacebar", which differs from the name
     * in the specification which is simply " "
     */
    fluid.defaults("gpii.qss.elementRepeater.keyListener", {

        events: {}, // given by implementor

        target: null,

        listeners: {
            "onCreate.addKeyPressHandler": {
                funcName: "gpii.qss.elementRepeater.keyListener.registerListener",
                args: ["{that}"]
            }
        },

        invokers: {
            registerKeyPress: {
                funcName: "gpii.qss.elementRepeater.keyListener.registerKeyPress",
                args: ["{that}.events", "{arguments}.0"]
            }
        }
    });

    gpii.qss.elementRepeater.keyListener.registerListener = function (that) {
        var target = that.options.target || that.container;

        target.keyup(that.registerKeyPress);
    };

    /**
     * TODO
     */
    gpii.qss.elementRepeater.keyListener.registerKeyPress = function (events, KeyboardEvent) {
        // Make use of a relatively new feature https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key
        var keyName;

        // rename Space key in order to achieve proper generic method for key presses
        // The full list of key names can be view here: https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key/Key_Values
        if (KeyboardEvent.key === " ") {
            keyName = "Spacebar";
        } else { // e.g. ArrowDown, Enter
            keyName = KeyboardEvent.key;
        }

        var eventName = "on" + keyName + "Pressed";

        // Check whether such key press is observed
        if (events[eventName]) {
            events[eventName].fire(KeyboardEvent);
        }
    };
})(fluid);
