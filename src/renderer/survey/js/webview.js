/*!
Copyright 2017 Raising the Floor - International

Licensed under the New BSD license. You may not use this file except in
compliance with this License.
The research leading to these results has received funding from the European Union's
Seventh Framework Programme (FP7/2007-2013) under grant agreement no. 289016.
You may obtain a copy of the License at
https://github.com/GPII/universal/blob/master/LICENSE.txt
*/

"use strict";
(function () {
    var ipcRenderer = require("electron").ipcRenderer;

    function initWebview(callback) {
        document.addEventListener("DOMContentLoaded", function () {
            callback();
        });
    }

    function isBreakOutLink(target) {
        return target && target.nodeName === "A" && target.target === "_blank"
                && target.classList.contains("flc-breakOut");
    }

    function initExitAnchor() {
        document.body.addEventListener("click", function (e) {
            if (isBreakOutLink(e.target)) {
                ipcRenderer.sendToHost("onSurveyClose");
            }
        });
    }

    initWebview(function () {
        initExitAnchor();
    });
})();
