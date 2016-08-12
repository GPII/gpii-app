"use strict";

var app = require("app");

app.on("ready", function() {
    console.log("In tests");
    require("./node_modules/gpii-windows/tests/UnitTests.js");
});
