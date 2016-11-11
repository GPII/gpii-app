/* eslint-env node */
"use strict";

var app = require("electron").app;

app.on("ready", function () {
    require("./node_modules/gpii-windows/tests/UnitTests.js");
});
