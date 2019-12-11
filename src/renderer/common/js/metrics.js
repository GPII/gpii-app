/**
 * Metrics for the renderer
 *
 * Copyright 2019 Raising the Floor - International
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

    // Mix-in grade to capture metrics in dialogs.
    fluid.defaults("gpii.psp.metrics.dialog", {
        gradeNames: ["gpii.psp.metrics"],
        distributeOptions: {
            "clickable": {
                target: "{that gpii.app.clickable}.options.gradeNames",
                record: "gpii.psp.metrics"
            },
            "button": {
                target: "{that gpii.psp.widgets.button}.options.gradeNames",
                record: "gpii.psp.metrics"
            },
            "switch": {
                target: "{that gpii.psp.widgets.switch}.options.gradeNames",
                record: "gpii.psp.metrics"
            },
            "office": {
                target: "{that gpii.qssWidget.office}.options.gradeNames",
                record: "gpii.psp.metrics.office"
            }
        },
        events: {
            onMetric: null,
            onMetricState: null
        },
        members: {
            componentType: "dialog"
        }
    });

    fluid.defaults("gpii.psp.metrics.office", {
        modelListeners: {
            setting: {
                func: "{channelNotifier}.events.onMetric.fire",
                args: ["office-change", {
                    id: "{change}.value.path",
                    value: "{change}.value.value",
                    oldValue: "{change}.oldValue.value"
                }],
                includeSource: "fromWidget"
            }
        }
    });

    fluid.defaults("gpii.psp.metrics.qssWidget", {
        gradeNames: ["gpii.psp.metrics.dialog"],
        members: {
            componentType: "widget",
            metricsID: undefined
        },
        invokers: {
            getMetricsID: {
                funcName: "gpii.psp.metrics.getWidgetMetricsID",
                args: ["{that}"]
            }
        },
        listeners: {
            "onQssWidgetCreated.metric": {
                funcName: "gpii.psp.metrics.addTipLinkHandlers",
                args: ["{that}", "{that}.container"]
            }
        }
    });

    // Mix-in grade for components whose hover/focus state should be captured for metrics.
    fluid.defaults("gpii.psp.metrics", {
        gradeNames: ["gpii.app.hoverable"],
        members: {
            metricsID: "@expand:fluid.identity({that}.container.selectorName)",
            componentType: "field",
            hoverState: "@expand:fluid.add({that}.componentType,-hover)",
            focusState: "@expand:fluid.add({that}.componentType,-focus)"
        },
        invokers: {
            metric: {
                func: "{channelNotifier}.events.onMetric.fire",
                args: ["{arguments}.0", "{arguments}.1"]
            },
            setState: {
                func: "{channelNotifier}.events.onMetricState.fire",
                args: ["{arguments}.0", "{arguments}.1"]
            },
            getMetricsID: {
                funcName: "gpii.psp.metrics.getMetricsID",
                args: ["{that}", "{that}.model.item"]
            }
        },
        listeners: {
            "onCreate.getId": {
                func: "{that}.getMetricsID"
            },
            "onCreate.addFocusHandlers": {
                funcName: "gpii.psp.metrics.addFocusHandlers",
                args: ["{that}", "{that}.container"]
            },
            "onMouseEnter.metricsState": {
                func: "{that}.setState",
                args: ["{that}.hoverState", "@expand:{that}.getMetricsID()"]
            },
            "onMouseLeave.metricsState": {
                func: "{that}.setState",
                args: ["{that}.hoverState"]
            },
            "onMouseEnter.metric": {
                func: "{that}.metric",
                args: ["mouse-enter", { id : "@expand:{that}.getMetricsID()" }]
            },
            "onMouseLeave.metric": {
                func: "{that}.metric",
                args: ["mouse-leave", { id : "@expand:{that}.getMetricsID()" }]
            }
        }
    });

    /**
     * Gets a static string which is used to identify this component in metrics. The default value is the container's
     * selectorName, which is fit for purpose, however it's not available for dynamically generated components.
     *
     * @param {Component} that The gpii.psp.metrics instance.
     * @param {Object} modelItem [optional] The item member of the component's model.
     * @return {String} A string to identify this component, in human readable form.
     */
    gpii.psp.metrics.getMetricsID = function (that, modelItem) {
        if (that.metricsID === undefined) {
            if (modelItem) {
                that.metricsID = fluid.firstDefined(modelItem.key, modelItem.indicatorValue);
            }
            if (that.metricsID === undefined) {
                fluid.log("Unable to get metricsID for " + that.typeName);
                that.metricsID = that.typeName;
            }
        }

        return that.metricsID;
    };

    gpii.psp.metrics.getWidgetMetricsID = function (that) {
        return fluid.get(that.model, "setting.path") || that.typeName;
    };

    /**
     * Adds the focus and blur handlers to the container, so the metrics core can keep an eye on what's currently
     * focused.
     *
     * @param {Component} that The gpii.psp.metrics instance.
     * @param {jQuery} container A jQuery object representing the component's container.
     *
     */
    gpii.psp.metrics.addFocusHandlers = function (that, container) {
        container.on("focus", function () {
            that.setState(that.componentType + "-focus", that.getMetricsID());
            that.metric(that.componentType + "-focus", {id: that.getMetricsID()});
        });
        container.on("blur", function () {
            that.metric(that.componentType + "-unfocus", {id: that.getMetricsID()});
            that.setState(that.componentType + "-focus");
        });
    };

    /**
     * Adds the click handlers to links within the tip element of the container.
     *
     * @param {Component} that The gpii.psp.metrics instance.
     * @param {jQuery} container A jQuery object representing the component's container.
     *
     */
    gpii.psp.metrics.addTipLinkHandlers = function (that, container) {
        container.find(".flc-qssWidget-tip a").on("click", function (eventObject) {
            that.metric("link-click", {
                widget: that.getMetricsID(),
                link: eventObject.target.href,
                id: eventObject.target.id,
                text: eventObject.target.innerText,
                eventType: eventObject.type
            });
        });
    };

})(fluid, jQuery);
