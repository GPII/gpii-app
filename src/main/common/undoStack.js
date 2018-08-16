/**
 * Undo stack component
 *
 * A component that represents a simple undo stack.
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
var gpii  = fluid.registerNamespace("gpii");


/**
 * A simple wrapper of an array to simulate an undo stack. It simply stores a
 * number of reversible changes (no more than `maxUndoEntries` in total). If
 * a change has to be undone, it is removed from the stack and the `onChangeUndone`
 * event is fired. It is up to the users of the undo stack to define what the
 * change object should contain and how exactly the effect of the change should
 * be undone when necessary.
 */
fluid.defaults("gpii.app.undoStack", {
    gradeNames: "fluid.modelComponent",

    model: {
        undoStack: [],
        hasChanges: false
    },

    events: {
        onChangeUndone: null
    },

    modelRelay: {
        hasChanges: {
            target: "hasChanges",
            singleTransform: {
                type: "fluid.transforms.free",
                func: "gpii.app.undoStack.hasChanges",
                args: ["{that}.model.undoStack"]
            },
            forward: {
                // on the initial step the `undoStack` is still `undefined`
                excludeSource: "init"
            }
        }
    },

    maxUndoEntries: 100,

    invokers: {
        undo: {
            funcName: "gpii.app.undoStack.undo",
            args: ["{that}"]
        },
        registerChange: {
            funcName: "gpii.app.undoStack.registerChange",
            args: [
                "{that}",
                "{arguments}.0" // change
            ]
        },
        clear: {
            changePath: "undoStack",
            value: []
        }
    }
});

/**
 * Removes the topmost change from the stack and fires the `onChangeUndone`
 * event with that change as an argument. This is essentially all that the
 * undo stack needs to do to consider that the change is reverted.
 * @param {Component} that - The `gpii.app.undoStack` instance.
 */
gpii.app.undoStack.undo = function (that) {
    var undoStack = fluid.copy(that.model.undoStack);

    if (undoStack.length === 0) {
        fluid.log("UndoStack: undoStack is empty.");
        return;
    }

    var undoChange = undoStack.pop();

    that.applier.change("undoStack", undoStack);

    that.events.onChangeUndone.fire(undoChange);
};

/**
 * Registers a single change in the undo stack.
 * @param {Component} that - The `gpii.app.undoStack` instance.
 * @param {Any} change - The change to be registered.
 */
gpii.app.undoStack.registerChange = function (that, change) {
    var undoStack = fluid.copy(that.model.undoStack);

    undoStack.push(change);

    // get rid of the oldest change if there are a lot of changes
    if (that.options.maxUndoEntries <= undoStack.length) {
        undoStack.shift();
    }

    that.applier.change("undoStack", undoStack);
};

/**
 * Returns whether there are changes in the undo stack.
 * @param {Any[]} undoStack - The array of the registered undoable changes
 * so far.
 * @return `true` if there is at least one registered undoable change and
 * `false` otherwise.
 */
gpii.app.undoStack.hasChanges = function (undoStack) {
    return undoStack.length > 0;
};
