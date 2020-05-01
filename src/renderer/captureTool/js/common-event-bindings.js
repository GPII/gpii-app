"use strict";

/**
 * This work is currently being reviewed for inclusion in gpii-binder and being tracked
 * here https://issues.gpii.net/browse/GPII-2933, with work in progress here:
 * https://github.com/GPII/gpii-binder/pull/13. The work as it stands below satisfies the
 * current requirements for the capture tool user interactions. Work in the above ticket
 * and PR is adding support for more use cases and general robustness.
 *
 * GPII Binder Markup Events Grade
 * This grade allows binding typical HTML events such as
 * mouse clicks and keypress events to selectors each time
 * the markup is rendered for a component. (Meaning they will
 * also apply if a component is rerendered after a model refresh
 * or similar situation)
 *
 * It adds a new area to a grades options called `markupEventBindings`
 * which allows binding `selectors` to jQuery events. Theoretically
 * other event constructs could be supported in the future, but only
 * jQuery events are implemented at the time of writing.
 *
 * Example usage of adding a click handler to a selector productListLinks.
 * ```
 * markupEventBindings: {
 *     productListLinks: {
 *         // type: jQuery <- Defaults to jQuery but could be configured ITF
 *         method: "click",
 *         args: ["{that}.selectProduct"]
 *     }
 * }
 * ```
 */
fluid.defaults("gpii.binder.bindMarkupEvents", {
    mergePolicy: {
        markupEventBindings: "noexpand"
    },
    events: {
        onDomBind: null,
        onDomUnbind: null
    },
    listeners: {
        onMarkupRendered: "{that}.events.onDomBind.fire({that}, {that}.container)",
        onDestroy: "{that}.events.onDomUnbind.fire({that}, {that}.container)",
        onDomBind: "fluid.decoratorViewComponent.processDecorators({that}, {that}.options.markupEventBindings)"
    }
});

fluid.registerNamespace("fluid.decoratorViewComponent");

//
// The methods below might be generic enough to go straight to infusion
//

fluid.expandCompoundArg = function (that, arg, name) {
    var expanded = arg;
    if (typeof(arg) === "string") {
        if (arg.indexOf("(") !== -1) {
            var invokerec = fluid.compactStringToRec(arg, "invoker");
            // TODO: perhaps a a courtesy we could expose {node} or even {this}
            expanded = fluid.makeInvoker(that, invokerec, name);
        } else {
            expanded = fluid.expandOptions(arg, that);
        }
    }
    return expanded;
};

fluid.processjQueryDecorator = function (dec, node, that, name) {
    var args = fluid.makeArray(dec.args);
    var expanded = fluid.transform(args, function (arg, index) {
        return fluid.expandCompoundArg(that, arg, name + " argument " + index);
    });
    fluid.log("Got expanded value of ", expanded, " for jQuery decorator");
    var func = node[dec.method];
    return func.apply(node, expanded);
};

fluid.decoratorViewComponent.processDecorators = function (that, decorators) {
    fluid.each(decorators, function (val, key) {
        var node = that.locate(key);
        if (node.length > 0) {
            var name = "Decorator for DOM node with selector " + key + " for component " + fluid.dumpThat(that);
            var decs = fluid.makeArray(val);
            fluid.each(decs, function (dec) {
                // If no type is specified default to jQuery
                if (!dec.type || dec.type === "jQuery") {
                    fluid.processjQueryDecorator(dec, node, that, name);
                }
            });
        }
    });
};
