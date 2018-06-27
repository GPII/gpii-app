/**
 * Property history manager
 *
 * A component that keeps history in separate queues for different components' properties. It can be used for going to previous version.
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
 * A component that keeps history for changes over a component's property (model element).
 * Once a component registers with this manager, the manager would start adding changes made
 * to a dedicated queue for the component.
 */
fluid.defaults("gpii.app.propertyHistoryManager", {
    gradeNames: "fluid.modelComponent",

    members: {
        queues: {
            /*
               <gradeName>: {
                 historyStack: [],
                 listener: <Function>
               }
             */
        }
    },

    maxHistoryEntries: 100,

    listeners: {
        onDestroy: {
            funcName: "gpii.app.propertyHistoryManager.deregisterListeners",
            args: ["{that}"]
        }
    },

    invokers: {
        undo: {
            funcName: "gpii.app.propertyHistoryManager.undo",
            args: [
                "{that}",
                "{arguments}.0" // component
            ]
        },
        registerPropertyObserver: {
            funcName: "gpii.app.propertyHistoryManager.registerPropertyObserver",
            args: [
                "{that}",
                "{arguments}.0", // component
                "{arguments}.1"  // changePath
            ]
        },
        deregisterObserver: {
            funcName: "gpii.app.propertyHistoryManager.deregisterListener",
            args: [
                "{that}",
                "{arguments}.0" // grade
            ]
        },
        registerChange: {
            funcName: "gpii.app.propertyHistoryManager.registerChange",
            args: [
                "{that}",
                "{arguments}.0", // grade
                "{arguments}.1", // value
                "{arguments}.2", // oldValue
                "{arguments}.3"  // pathSegs
            ]
        }
    }
});


/**
 * De-register change listener for a single component.
 *
 * @param {Component} that - The `gpii.app.propertyHistoryManager` instance
 * @param {String} grade - The grade name of the component that will have its listener removed
 */
gpii.app.propertyHistoryManager.deregisterListener = function (that, grade) {
    var cmp = fluid.queryIoCSelector(fluid.rootComponent, grade)[0],
        listener = that.queues[grade].listener;

    if (cmp) {
        cmp.modelChanged.removeListener(listener);
    }
};

/**
 * De-register all listeners.
 *
 * @param {Component} that - The `gpii.app.propertyHistoryManager`
 */
gpii.app.propertyHistoryManager.deregisterListeners = function (that) {
    fluid.keys(that.queues, function (grade) {
        that.deregisterObserver(grade);
    });
};

/**
 * Restore the previous state of a component's property. Changes that are made to the component's model
 * are with source "gpii.app.propertyHistoryManager.undo" which could be used for exclusion.
 *
 * @param {Comopnent} that - The `gpii.app.propertyHistoryManager`
 * @param {String} cmpGrade - The grade name of the component which property is to
 * be reverted
 */
gpii.app.propertyHistoryManager.undo = function (that, cmpGrade) {
    var historyStack = that.queues[cmpGrade] && that.queues[cmpGrade].historyStack;

    // Is it even registered
    if (historyStack.length === 0) {
        return;
    }

    // now search for component
    var component = fluid.queryIoCSelector(fluid.rootComponent, cmpGrade)[0];

    // does the component still exists
    if (!component) {
        // no need of that queue anymore
        delete that.queues[cmpGrade];
        return;
    }

    var prevState = historyStack.pop();
    var propertyPath = prevState.path.join(".");

    // clear the setting before going further
    // direct access will avoid triggering notifications from the change applier
    component.model[propertyPath] = null;
    component.applier.change(propertyPath, prevState.oldValue, null, "gpii.app.propertyHistoryManager.undo");
};


/**
 * Register single change of grade's model property.
 *
 * @param {Component} that - The gpii.app.propertyHistoryManager component
 * @param {String} grade - The interested component's grade name
 * @param {Object} value - The new state of the component's property
 * @param {Object} oldValue - The old state of the property
 * @param {String[]} pathSegs - The path to the element's change (changePath)
 */
gpii.app.propertyHistoryManager.registerChange = function (that, grade, value, oldValue, pathSegs) {
    var historyStack = that.queues[grade] && that.queues[grade].historyStack;

    // component not yet registered?
    if (!historyStack) {
        return;
    }

    // simply add the new state even if it hasn't changed
    historyStack.push({
        oldValue: oldValue,
        path:     pathSegs
    });

    if (that.options.maxHistoryEntries <= historyStack.length) {
        historyStack.shift();
    }
};

/**
 * Registers a component's model property observer. It will build up history of the properties changes that
 * could be afterwards reverted using the `undo` method.
 * Observation of property is done through the `changeApplier` API which means any property changePath may be
 * provided to the function to be used.
 *
 * @param {Comopnent} that - The `gpii.app.propertyHistoryManager`
 * @param {Comopnent} component - The component which is to be observed
 * @param {String} changePath - The changeApplier's changePath expression, e.g. "settings.*" or "setting"
 */
gpii.app.propertyHistoryManager.registerPropertyObserver = function (that, component, changePath) {
    var gradeNames = component.options.gradeNames;
    var cmpGrade = gradeNames[gradeNames.length - 1];

    var listener = that.registerChange.bind(null, cmpGrade);

    // create our fresh component's history stack
    that.queues[cmpGrade] = {
        historyStack: [],
        // needed for de-registering
        listener: listener
    };

    // listen to changes of the property
    component.applier.modelChanged.addListener({
        path: changePath,
        excludeSource: "gpii.app.propertyHistoryManager.undo"
    }, listener);
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

// var hasUndowQueueFilled = tstCmp.manager.queues["gpii.tests.undoable"].historyStack.length === 1;
// var registeredItemValueMatched = tstCmp.manager.queues["gpii.tests.undoable"].historyStack[0].oldValue.b === 3;
// var registeredItemPathMatched  = tstCmp.manager.queues["gpii.tests.undoable"].historyStack[0].path === "1";


// tstCmp.manager.undo(tstCmp.undoable.options.gradeNames.slice(-1));

// var hasOldStateReturned = tstCmp.undoable.model.list[1].a === 2 &&
//                             !tstCmp.undoable.model.list[1].b;

// var hasQueueClearedUp = tstCmp.manager.queues["gpii.tests.undoable"].historyStack.length === 0;

