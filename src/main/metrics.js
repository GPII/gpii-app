/**
 * User interface metrics capture
 *
 * Copyright 2019 Raising the Floor - International
 *
 * Licensed under the New BSD license. You may not use this file except in
 * compliance with this License.
 *
 * The R&D leading to these results received funding from the
 * Department of Education - Grant H421A150005 (GPII-APCP). However,
 * these results do not necessarily represent the policy of the
 * Department of Education, and you should not assume endorsement by the
 * Federal Government.
 *
 * You may obtain a copy of the License at
 * https://github.com/GPII/gpii-app/blob/master/LICENSE.txt
 */

"use strict";

var fluid = require("infusion");

/*

The following events are captured:

qss-shown: The quick-strip was shown.
{
    "module":"metrics.app",
    "event":"qss-shown"
}

qss-hidden: The quick-strip was hidden.
{
    "module":"metrics.app",
    "event":"qss-hidden",
    "data": { duration: 56 }
}

button-focused: A button on the quick-strip has been focused.
{
    "module": "metrics.app",
    "event": "button-focused",
    "data": {
        "buttonPath":"undo"
    }
}

button-activated: A quick-strip button has been actioned.

Via mouse click:
{
    "module": "metrics.app",
    "event": "button-activated",
    "data":{
        "buttonPath":"undo",
        "mouse":"click"
    }
}

Using the keyboard:
{
    "module": "metrics.app",
    "event": "button-activated",
    "data": {
        "buttonPath": "http://registry\\.gpii\\.net/common/DPIScale",
        "key": "Enter"
    }
}

widget-shown: A qss widget is displayed
{
    "module": "metrics.app",
    "event":"widget-shown",
    "data": {
        "path":"http://registry\\.gpii\\.net/common/highContrastTheme"
    }
}

widget-hidden: A qss widget is closed
{
    "module": "metrics.app",
    "event":"widget-hidden",
    "data": {
        "path":"appTextZoom"
        "duration": 15
    }
}

setting-changed: A setting has changed via a quick-strip widget
{
    "module":"metrics.app",
    "event":"setting-changed",
    "data":{
        "path": "http://registry\\.gpii\\.net/common/selfVoicing/enabled",
        "value":false,
    }
}

tooltip-shown: QS tooltip was shown
{
  "module": "metrics.app",
  "event": "tooltip-shown",
  "data": {
    "path": "http://registry\\.gpii\\.net/common/language"
  }
}

tooltip-shown: QS tooltip was hidden
{
  "module": "metrics.app",
  "event": "tooltip-hidden",
  "data": {
    "path": "http://registry\\.gpii\\.net/common/language"
    "duration": 10
  }
}

reset: The reset to standard desktop icon was clicked:
{
  "module": "startup",
  "event": "reset",
  "data": {
    "commandLine": "morphic-app.exe --reset"
  }
}

open: The show Morphic desktop link was clicked:
{
  "module": "startup",
  "event": "open",
  "data": {
    "commandLine": "morphic-app.exe"
  }
}

tray-icon: The tray icon was clicked
{
    "module":"metrics.app",
    "event":"setting-changed",
    "data":{
        "menu": true // optional: true of icon was right-clicked.
    }
}

*/


/**
 * Metrics for gpii-app
 */
fluid.defaults("gpii.app.metrics", {
    gradeNames: ["fluid.component"],
    invokers: {
        "uiMetric": {
            func: "{eventLog}.logEvent",
            args: [ "metrics.app", "{arguments}.0", "{arguments}.1" ] // eventName, eventData
        }
    },
    distributeOptions: {
        "qss": {
            record: "gpii.app.metrics.qssInWrapper",
            target: "{/ gpii.app.qssInWrapper}.options.gradeNames"
        },
        "qssWidget": {
            record: "gpii.app.metrics.qssWidget",
            target: "{/ gpii.app.qssWidget}.options.gradeNames"
        },
        "tooltip": {
            record: "gpii.app.metrics.qssTooltipDialog",
            target: "{/ gpii.app.qssTooltipDialog}.options.gradeNames"
        }
    },
    durationEvents: {
        "tooltip-shown": "tooltip-hidden",
        "qss-shown": "qss-hidden",
        "widget-shown": "widget-hidden"
    }
});

/** Mix-in grade to provide metrics for the QSS */
fluid.defaults("gpii.app.metrics.qssInWrapper", {
    gradeNames: ["fluid.component"],
    listeners: {
        "onCreate.logSite": {
            func: "{eventLog}.metrics.uiMetric",
            args: [ "site-id", "{siteConfigurationHandler}.options.siteConfig.site" ]
        },
        "{channelListener}.events.onQssButtonFocused": [{
            namespace: "metric",
            func: "{eventLog}.metrics.uiMetric",
            args: [ "button-focused", {
                buttonPath: "{arguments}.0.path"
            } ]
        }, {
            priority: "before:metric",
            namespace: "metrics-state",
            func: "{eventLog}.setState",
            args: [ "focus", "{arguments}.0.path" ]
        }],
        "{channelListener}.events.onQssButtonActivated": {
            namespace: "metrics",
            func: "{eventLog}.metrics.uiMetric",
            args: [ "button-activated", {
                buttonPath: "{arguments}.0.path",
                key: "{arguments}.2.key",
                mouse: "{arguments}.2.type"
            } ]
        },
        "{channelListener}.events.onQssButtonMouseEnter": {
            namespace: "metric-state",
            func: "{eventLog}.setState",
            args: [ "hover", "{arguments}.0.path" ]
        },
        "{channelListener}.events.onQssButtonMouseLeave": {
            namespace: "metric-state",
            func: "{eventLog}.setState",
            args: [ "hover" ]
        },
        "{channelListener}.events.onQssButtonsFocusLost": {
            namespace: "metric-state",
            func: "{eventLog}.setState",
            args: [ "focus" ]
        },
        "onDialogShown.metrics": {
            func: "{eventLog}.metrics.uiMetric",
            args: [ "qss-shown" ]
        },
        "onDialogHidden.metrics": {
            func: "{eventLog}.metrics.uiMetric",
            args: [ "qss-hidden" ]
        },
        "onDialogShown.logState": {
            func: "{eventLog}.setState",
            args: [ "qss", "open" ]
        },
        "onDialogHidden.logState": {
            func: "{eventLog}.setState",
            args: [ "qss" ]
        }
    },
    components: {
        trayListener: {
            createOnEvent: "{app}.events.onPSPReady",
            type: "fluid.component",
            options: {
                listeners: {
                    "{gpii.app}.tray.events.onTrayIconClicked": {
                        func: "{eventLog}.metrics.uiMetric",
                        args: [ "tray-icon" ]
                    },
                    "{gpii.app}.tray.events.onTrayIconMenuShown": {
                        func: "{eventLog}.metrics.uiMetric",
                        args: [ "button-activated", {
                            buttonPath: "{arguments}.0.path",
                            key: "{arguments}.2.key",
                            mouse: "{arguments}.2.type"
                        } ]
                    }
                }
            }
        }
    }
});

/** Mix-in grade to provide metrics for QSS widgets */
fluid.defaults("gpii.app.metrics.qssWidget", {
    gradeNames: ["fluid.component"],
    listeners: {
        "onQssWidgetSettingAltered.metrics": {
            func: "{eventLog}.metrics.uiMetric",
            args: ["setting-changed", {
                path: "{arguments}.0.path",
                value: "{arguments}.0.value"
            }]
        },
        "onDialogShown.metrics": {
            func: "{eventLog}.metrics.uiMetric",
            args: [ "widget-shown", {
                path: "{that}.model.setting.path"
            } ]
        },
        "onDialogHidden.metrics": {
            func: "{eventLog}.metrics.uiMetric",
            args: [ "widget-hidden", {
                path: "{that}.model.setting.path"
            } ]
        },
        "{channelListener}.events.onMetric": {
            namespace: "metric",
            func: "{eventLog}.metrics.uiMetric",
            args: [ "{arguments}.0", "{arguments}.1" ]
        },
        "{channelListener}.events.onMetricState": {
            namespace: "metrics-state",
            func: "{eventLog}.setState",
            args: [ "{arguments}.0", "{arguments}.1" ]
        }
    }
});

/** Mix-in grade to provide metrics for QSS widgets */
fluid.defaults("gpii.app.metrics.qssTooltipDialog", {
    gradeNames: ["fluid.component"],
    listeners: {
        "onDialogShown.metrics": {
            func: "{eventLog}.metrics.uiMetric",
            args: [ "tooltip-shown", {
                path: "{that}.model.setting.path"
            } ]
        },
        "onDialogHidden.metrics": {
            func: "{eventLog}.metrics.uiMetric",
            args: [ "tooltip-hidden", {
                path: "{that}.model.setting.path"
            } ]
        }
    }
});
