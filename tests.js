"use strict";

var app = require("app");

app.on("ready", function() {
    require("./node_modules/gpii-windows/tests/UnitTests.js");
});
