/**
 * PSP Messages Distributor Integration Test Definitions
 *
 * Test message bundles loading and distribution.
 *
 * Copyright 2017 Raising the Floor - International
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

fluid.require("node-jqunit", require, "jqUnit");

require("../src/shared/messageBundles.js");

fluid.registerNamespace("gpii.tests.messageBundles.testDefs");


fluid.defaults("gpii.tests.messageBundles.eatComp", {
    gradeNames: ["fluid.modelComponent"],

    model: {
        messages: {
            eat: null // expected to be passed by the distribution
        }
    }
});

fluid.defaults("gpii.tests.messageBundles.greetComp", {
    gradeNames: ["fluid.modelComponent"],

    model: {
        messages: {
            greet: null
        }
    }
});

/**
 * This component will receive both the `eat` message from the `eatComp` and the
 * `greet` message from the `greetComp`. There is no limitation on the number of
 * grades from which a component can receive i18n messages. This can be done by
 * distributing to the grade name in the `defaults` block, to any other grade
 * specified in the `gradeNames` property or to both.
 */
fluid.defaults("gpii.tests.messageBundles.eatAndGreetComp", {
    gradeNames: ["gpii.tests.messageBundles.eatComp", "gpii.tests.messageBundles.greetComp"]
});

fluid.defaults("gpii.tests.messageBundles.byeComp", {
    gradeNames: ["fluid.modelComponent"],

    model: {
        messages: {
            greet: null
        }
    }
});

/**
 * This component will receive 2 `greet` messages - one from the `greetComp` and one
 * from the `byeComp`. The message from the `byeComp` will take precedence over the
 * one from the `greetComp` as the `byeComp` grade comes after the `greetComp` in
 * the grade names definition array.
 */
fluid.defaults("gpii.tests.messageBundles.politeComp", {
    gradeNames: ["gpii.tests.messageBundles.greetComp", "gpii.tests.messageBundles.byeComp"]
});

fluid.defaults("gpii.tests.messageBundles.translatableComp", {
    gradeNames: ["gpii.tests.messageBundles.greetComp"],

    components: {
        deeper: {
            type: "gpii.tests.messageBundles.eatComp"
        }
    }
});

fluid.defaults("gpii.tests.messageBundles.mainComp", {
    gradeNames: ["fluid.component", "gpii.app.messageBundles"],

    model: {
        locale: "en"
    },

    messageBundlesPath: "./tests/fixtures/test-message-bundles.json",

    events: {
        onPostponed: null
    },

    components: {
        simple: {
            type: "gpii.tests.messageBundles.translatableComp"
        },
        postponed: {
            type: "gpii.tests.messageBundles.translatableComp",
            // simply ensure that the distribution component has been created
            createOnEvent: "{mainComp}.events.onPostponed"
        },
        extended: {
            type: "gpii.tests.messageBundles.eatAndGreetComp"
        },
        overridden: {
            type: "gpii.tests.messageBundles.politeComp"
        }
    }
});

fluid.defaults("gpii.tests.messageBundles", {
    gradeNames: "fluid.test.testEnvironment",
    components: {
        messageBundleTester: {
            type: "gpii.tests.psp.messageBundleTester"
        }
    }
});

fluid.defaults("gpii.tests.psp.messageBundleTester", {
    gradeNames: "fluid.test.testCaseHolder",

    components: {
        mainComp: {
            type: "gpii.tests.messageBundles.mainComp"
        }
    },

    modules: [{
        name: "Messages Distribution tests",
        tests: [{
            name: "Distribution to normal subcomponent",
            expect: 6,
            sequence: [
                { // Check distribution is proper using default message bundle
                    funcName: "jqUnit.assertEquals",
                    args: [
                        "MessageBundles: simple component has message distributed",
                        "{mainComp}.model.messages.gpii_tests_messageBundles_greetComp.greet",
                        "{mainComp}.simple.model.messages.greet"
                    ]
                },

                [ // check whether the dependent component's model was updated properly (the binding works)
                    {
                        func: "{mainComp}.applier.change",
                        args: ["locale", "it"]
                    }, {
                        funcName: "jqUnit.assertEquals",
                        args: [
                            "MessageBundles: the simple component has a proper message set",
                            "{mainComp}.options.messageBundles.it.gpii_tests_messageBundles_greetComp_greet",
                            "{mainComp}.simple.model.messages.greet"
                        ]
                    }, { // and a subcomponent
                        funcName: "jqUnit.assertEquals",
                        args: [
                            "MessageBundles: A nested component has a prper message set",
                            "{mainComp}.options.messageBundles.it.gpii_tests_messageBundles_eatComp_eat",
                            "{mainComp}.simple.deeper.model.messages.eat"
                        ]
                    }
                ], [ // use missing bundle, check whether default is set
                    {
                        func: "{mainComp}.applier.change",
                        args: ["locale", "bg"]
                    }, {
                        funcName: "jqUnit.assertEquals",
                        args: [
                            "MessageBundles: A proper message is set for a missing locale",
                            "{mainComp}.options.messageBundles.en.gpii_tests_messageBundles_greetComp_greet",
                            "{mainComp}.simple.model.messages.greet"
                        ]
                    }
                ], [ // use partial bundle and check that the default locale messages are used for the missing ones
                    {
                        func: "{mainComp}.applier.change",
                        args: ["locale", "de"]
                    }, {
                        funcName: "jqUnit.assertEquals",
                        args: [
                            "MessageBundles: A proper message is set for the DE locale",
                            "{mainComp}.options.messageBundles.de.gpii_tests_messageBundles_greetComp_greet",
                            "{mainComp}.simple.model.messages.greet"
                        ]
                    }, {
                        funcName: "jqUnit.assertEquals",
                        args: [
                            "MessageBundles: The default locale message for EAT is used as the DE locale does not have such a message",
                            "{mainComp}.options.messageBundles.en.gpii_tests_messageBundles_eatComp_eat",
                            "{mainComp}.simple.deeper.model.messages.eat"
                        ]
                    }
                ]
            ]
        }, {
            name: "Distribution to components with postponed creation",
            expect: 2,
            sequence: [
                { // change the language before the component is created
                    func: "{mainComp}.applier.change",
                    args: ["locale", "it"]
                },
                { // create the subcomponent
                    funcName: "{mainComp}.events.onPostponed.fire"
                },

                [ // check if it has proper bindings
                    {
                        funcName: "jqUnit.assertEquals",
                        args: [
                            "MessageBundles: A proper message is set for a component with postponed creation",
                            "{mainComp}.options.messageBundles.it.gpii_tests_messageBundles_greetComp_greet",
                            "{mainComp}.postponed.model.messages.greet"
                        ]
                    }, {
                        func: "{mainComp}.applier.change",
                        args: ["locale", "en"]
                    }, {
                        funcName: "jqUnit.assertEquals",
                        args: [
                            "MessageBundles: A proper message is set for a component after it has been created",
                            "{mainComp}.options.messageBundles.en.gpii_tests_messageBundles_greetComp_greet",
                            "{mainComp}.postponed.model.messages.greet"
                        ]
                    }
                ]
            ]
        }, {
            name: "Distributions via multiple grades for one and the same component",
            expect: 2,
            sequence: [ // check that a component can receive messages via more than one of its grades
                {
                    func: "{mainComp}.applier.change",
                    args: ["locale", "it"]
                }, {
                    funcName: "jqUnit.assertEquals",
                    args: [
                        "MessageBundles: A proper greet message is set for a multiple-grade component",
                        "{mainComp}.options.messageBundles.it.gpii_tests_messageBundles_greetComp_greet",
                        "{mainComp}.extended.model.messages.greet"
                    ]
                }, {
                    funcName: "jqUnit.assertEquals",
                    args: [
                        "MessageBundles: A proper eat message is set for a multiple-grade component",
                        "{mainComp}.options.messageBundles.it.gpii_tests_messageBundles_eatComp_eat",
                        "{mainComp}.extended.model.messages.eat"
                    ]
                }
            ]
        }, {
            name: "Overriding distributed messages via different grades for the same component",
            expect: 1,
            sequence: [ // check that the message value is the one that comes with the last grade
                {
                    func: "{mainComp}.applier.change",
                    args: ["locale", "de"]
                }, {
                    funcName: "jqUnit.assertEquals",
                    args: [
                        "MessageBundles: The greet message is properly overridden",
                        "{mainComp}.options.messageBundles.de.gpii_tests_messageBundles_byeComp_greet",
                        "{mainComp}.overridden.model.messages.greet"
                    ]
                }
            ]
        }]
    }]
});

fluid.test.runTests(["gpii.tests.messageBundles"]);
