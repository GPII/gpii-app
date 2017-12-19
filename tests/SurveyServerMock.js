/*
 * GPII App Integration Test Definitions
 *
 * Copyright 2017 OCAD University
 *
 * Licensed under the New BSD license. You may not use this file except in
 * compliance with this License.
 *
 * The research leading to these results has received funding from the European Union's
 * Seventh Framework Programme (FP7/2007-2013)
 * under grant agreement no. 289016.
 *
 * You may obtain a copy of the License at
 * https://github.com/GPII/universal/blob/master/LICENSE.txt
 */

"use strict";
var fluid = require("infusion"),
    gpii = fluid.registerNamespace("gpii"),
    WebSocket = require("ws");

fluid.registerNamespace("gpii.tests.mocks");

fluid.defaults("gpii.tests.mocks.surveyServer", {
    gradeNames: "fluid.component",
    config: {
        port: 3334
    },
    members: {
        server: {
            expander: {
                funcName: "gpii.tests.mocks.surveyServer.create",
                args: ["{that}.options.config.port"]
            }
        }
    }
});

gpii.tests.mocks.surveyServer.create = function (port) {
    return new WebSocket.Server({port: port});
};

fluid.defaults("gpii.tests.mocks.surveyServerWrapper", {
    gradeNames: "fluid.component",
    config: {
        port: 3334
    },
    components: {
        surveyServer: {
            type: "gpii.tests.mocks.surveyServer",
            options: {
                config: {
                    port: "{surveyServerWrapper}.options.config.port"
                }
            }
        },
        surveyConnector: {
            priority: "after:surveyServer",
            options: {
                config: {
                    serverPort: "{surveyServerWrapper}.options.config.port"
                }
            }
        }
    }
});
