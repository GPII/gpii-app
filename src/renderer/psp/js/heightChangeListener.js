/**
 * A component which detects height modifications of the parent DOM element
 *
 * This component should always have an iframe as a container. It fires an event whenever
 * the height of the parent DOM element changes.
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
    /**
     * Responsible for detecting height changes in the element in which
     * the component's container is nested.
     */
    fluid.defaults("gpii.psp.heightChangeListener", {
        gradeNames: ["fluid.viewComponent"],
        listeners: {
            "onCreate.initResizeListener": {
                "this": "@expand:$({that}.container.0.contentWindow)",
                method: "on",
                args: ["resize", "{that}.events.onHeightChanged.fire"]
            }
        },
        events: {
            onHeightChanged: null
        }
    });

    fluid.defaults("gpii.psp.heightObservable", {
        gradeNames: "fluid.viewComponent",

        selectors: {
            heightChangeListener: ".flc-contentHeightChangeListener"
        },

        components: {
            heightChangeListener: {
                type: "gpii.psp.heightChangeListener",
                container: "{that}.dom.heightChangeListener",
                options: {
                    listeners: {
                        onHeightChanged: {
                            funcName: "{heightObservable}.onContentHeightChanged"
                        }
                    }
                }
            }
        }
    });
})(fluid);
