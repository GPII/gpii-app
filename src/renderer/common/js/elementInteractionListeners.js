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


    fluid.defaults("gpii.app.clickable", {
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
    fluid.defaults("gpii.app.hoverable", {
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
    fluid.defaults("gpii.app.keyListener", {

        events: {}, // given by implementor

        target: null,

        listeners: {
            "onCreate.addKeyPressHandler": {
                funcName: "gpii.app.keyListener.registerListener",
                args: ["{that}"]
            },
            "onDestroy.clearListeners": {
                funcName: "gpii.app.keyListener.deregisterListener",
                args: ["{that}"]
            }
        },

        invokers: {
            registerKeyPress: {
                funcName: "gpii.app.keyListener.registerKeyPress",
                args: ["{that}.events", "{arguments}.0"]
            }
        }
    });

    gpii.app.keyListener.registerListener = function (that) {
        var target = that.options.target || that.container;

        target.on("keyup", that.registerKeyPress);
    };

    gpii.app.keyListener.deregisterListener = function (that) {
        var target = that.options.target || that.container;

        target.off("keyup", that.registerKeyPress);
    };

    /**
     * TODO
     */
    gpii.app.keyListener.registerKeyPress = function (events, KeyboardEvent) {
        // Make use of a relatively new feature https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key
        var keyName;

        // rename Space key in order to achieve proper generic method for key presses
        // The full list of key names can be view here: https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key/Key_Values
        if (KeyboardEvent.key === " ") {
            keyName = "Spacebar";
        } else if (KeyboardEvent.key === "+") {
            keyName = "Add";
        } else if (KeyboardEvent.key === "-") {
            keyName = "Subtract";
        } else { // e.g. ArrowDown, Enter
            keyName = KeyboardEvent.key;
        }

        var eventName = "on" + keyName + "Pressed";

        // Check whether such key press is observed
        if (events[eventName]) {
            events[eventName].fire(KeyboardEvent);
        }
    };

    /**
     * Represents a visual component which can be activated by clicking its
     * container or by pressing Enter or Spacebar. The implementors have to
     * provide the behavior for the `activate` invoker.
     */
    fluid.defaults("gpii.app.activatable", {
        gradeNames: [
            "gpii.app.keyListener",
            "gpii.app.clickable",
            "fluid.viewComponent"
        ],

        events: {
            onSpacebarPressed: null,
            onEnterPressed: null
        },

        attrs: {
            // User provided attrs such as aria-*
        },

        listeners: {
            "onCreate.addAttrs": {
                "this": "{that}.container",
                method: "attr",
                args: ["{that}.options.attrs"]
            },

            "onClicked.activate": {
                func: "{that}.activate",
                args: [
                    {key: null}
                ]
            },
            "onSpacebarPressed.activate": {
                func: "{that}.activate",
                args: [
                    {key: "Spacebar"}
                ]
            },
            "onEnterPressed.activate": {
                func: "{that}.activate",
                args: [
                    {key: "Enter"}
                ]
            }
        },

        invokers: {
            activate: {
                func: "fluid.notImplemented"
            }
        }
    });
})(fluid);
