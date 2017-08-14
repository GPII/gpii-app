"use strict";
(function () {
    var fluid = window.fluid,
        gpii = fluid.registerNamespace("gpii"),
        ipcRenderer = require("electron").ipcRenderer;

    ipcRenderer.on("message", function (event, message) {
        console.log("Browser window received message:", message);
    });

    //XXX This is a test component. Will be removed.
    fluid.defaults("gpii.app.settingsMenu", {
        gradeNames: ["fluid.viewComponent"],
        selectors: {
            title: ".flc-title"
        },
        listeners: {
            "onCreate.saySuccess": {
                "this": "{that}.dom.title",
                method: "html",
                args: ["Settings Menu"]
            }
        }
    });

    $(function () {
        gpii.app.settingsMenu(".flc-body", {});

        //XXX This in only with test perpose
        ipcRenderer.send("reply", "This message goes back to the main window.");
    });
})();
