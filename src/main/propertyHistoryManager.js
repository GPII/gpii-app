/**
 * The PSP Main component
 *
 * A component that represents the whole PSP. It wraps all of the PSP's functionality and also provides information on whether there's someone keyIn or not.
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


fluid.defaults("gpii.app.propertyHistoryManager", {
    gradeNames: "fluid.modelComponent",

    members: {
        queues: {
            // <gradeName>: [ { ref: <Component>, undoStack: [] } ]
        }
    },

    listeners: {
        // TODO
        // Clear up attached listeners
        // onDestroy: null
    },

    invokers: {
        undo: {
            funcName: "gpii.app.propertyHistoryManager.undo",
            args: [
                "{that}",
                "{arguments}.0" // component
            ]
        },
        /// cmp, prop
        registerPropertyObserver: {
            funcName: "gpii.app.propertyHistoryManager.registerPropertyObserver",
            args: [
                "{that}",
                "{arguments}.0", // component
                "{arguments}.1" // prop
            ]
        }
    }
});

gpii.app.propertyHistoryManager.undo = function (that, cmpGrade) {
    console.log("Undoo: ", cmpGrade);

    if (!that.queues[cmpGrade]) {
        return;
    }

    var component = that.queues[cmpGrade].ref;
    var stack = that.queues[cmpGrade].undoStack;

    if (stack.length === 0) {
        return;
    }

    var prevState = stack.pop();
    var path = prevState.path.join(".");

    // clear the setting before going further
    // component.applier.change(path, null, "DELETE", "gpii.app.propertyHistoryManager.undo");
    // XXX can we just avoid notifications from the change applier?
    component.model[path] = null;
    component.applier.change(path, prevState.oldValue, null, "gpii.app.propertyHistoryManager.undo");
};

gpii.app.propertyHistoryManager.registerPropertyObserver = function (that, component, prop) {
    var cmpGrade = component.options.gradeNames.slice(-1);

    function registerChange(value, oldValue, pathSegs) {
        // TODO check whether the last state differs with the new one
        that.queues[cmpGrade].undoStack.push({
            oldValue: oldValue,
            path:     pathSegs
        });
    }

    console.log("Register Undo Observer: ", component);

    // create our stack
    that.queues[cmpGrade] = {
        ref: component,
        undoStack: []
    };

    // listen to changes of the property
    component.applier.modelChanged.addListener({
        path: prop,
        excludeSource: "gpii.app.propertyHistoryManager.undo"
    }, registerChange);
};

// XXX move to tests
// fluid.defaults("gpii.tests.undoable", {
//     gradeNames: ["fluid.modelComponent"],

//     model: {
//         list: [{a:1}, {a:2}]
//     }
// });

// fluid.defaults("gpii.tests.propertyHistoryManager", {
//     gradeNames: ["fluid.component"],


//     components: {
//         manager: {
//             type: "gpii.app.propertyHistoryManager"
//         },
//         undoable: {
//             type: "gpii.tests.undoable",

//             options: {
//                 listeners: {
//                     onCreate: {
//                         func: "{manager}.registerPropertyObserver",
//                         args: [ "{that}", "list.*"]
//                     }
//                 }
//             }
//         }
//     }
// });

// var tstCmp = gpii.tests.propertyHistoryManager();

// tstCmp.undoable.applier.change("list.1", { a:0, b: 3 });

// var hasQueueCreated = fluid.keys(tstCmp.manager.queues).length === 1;

// var hasUndowQueueFilled = tstCmp.manager.queues["gpii.tests.undoable"].undoStack.length === 1;
// var registeredItemValueMatched = tstCmp.manager.queues["gpii.tests.undoable"].undoStack[0].oldValue.b === 3;
// var registeredItemPathMatched  = tstCmp.manager.queues["gpii.tests.undoable"].undoStack[0].path === "1";


// tstCmp.manager.undo(tstCmp.undoable.options.gradeNames.slice(-1));

// var hasOldStateReturned = tstCmp.undoable.model.list[1].a === 2 &&
//                             !tstCmp.undoable.model.list[1].b;

// var hasQueueClearedUp = tstCmp.manager.queues["gpii.tests.undoable"].undoStack.length === 0;

