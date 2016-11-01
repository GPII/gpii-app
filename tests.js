"use strict";

const {app} = require('electron')

app.on("ready", function() {
    require("./node_modules/gpii-windows/tests/UnitTests.js");
});
