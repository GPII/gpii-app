/*!
Network check client for GPII-2349
Copyright 2017 Raising the Floor - International

Licensed under the New BSD license. You may not use this file except in
compliance with this License.
You may obtain a copy of the License at
https://github.com/GPII/universal/blob/master/LICENSE.txt
*/
"use strict";

var fluid = require("infusion");
var gpii = fluid.registerNamespace("gpii");

fluid.defaults("gpii.app.networkCheck", {
    gradeNames: "fluid.component",
    testUrl: "https://preferences.gpii.net/preferences/sammy",
    testInterval: 60 * 1000,
    components: {
        dataSource: {
            type: "kettle.dataSource.URL",
            options: {
                url: "{gpii.app.networkCheck}.options.testUrl"
            }
        }
    },
    invokers: {
        sendRequest: "gpii.app.networkCheck.sendRequest({that})",
        logSuccess: "gpii.app.networkCheck.logSuccess({that}, {arguments}.0)",
        logFailure: "gpii.app.networkCheck.logFailure({that}, {arguments}.0)"
    },
    listeners: {
        "onCreate.setInterval": "gpii.app.networkCheck.setInterval({that})",
        "onDestroy.clearInterval": "gpii.app.networkCheck.clearInterval({that})"
    }
});

gpii.app.networkCheck.setInterval = function (that) {
    that.intervalId = setInterval(that.sendRequest, that.options.testInterval);
};

gpii.app.networkCheck.clearInterval = function (that) {
    clearInterval(that.intervalId);
};

gpii.app.networkCheck.sendRequest = function (that) {
    that.dataSource.get(null).then(that.logSuccess, that.logFailure);
};

gpii.app.networkCheck.logSuccess = function (that/*, response */) {
    fluid.log("Network diagnostic request to url " + that.options.testUrl + " successful with response ");
};

gpii.app.networkCheck.logFailure = function (that, error) {
    fluid.log(fluid.logLevel.WARN, "ERROR: Network diagnostic request to url " + that.options.testUrl
        + " failed with error " + error.message);
};
