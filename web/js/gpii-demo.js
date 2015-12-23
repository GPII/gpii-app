window.$ = window.jQuery = require("./static/jquery-2.1.4.js");

var curtoken = false;


var updateUI = function(curtoken) {
    if (curtoken) {
        $('.curuser').html(curtoken);
    }
    else {
        $('.curuser').html("No one logged in");
    }
};

var checkSytem = function() {
    $.ajax({
        url: "http://localhost:8081/userToken",
        dataType: "json",
        success: function(data) {
            console.log("Logged in as "+data[0]);
        },
        error: function(jqXHR, textStatus, errorThrown) {
            if (jqXHR.responseJSON) {
                var data = jqXHR.responseJSON;
                if (data.isError && data.message.indexOf("No user currently logged in to the system") == 0) {
                    console.log("No one logged in.");
                }
                else if (data.isError) {
                    console.log("Some other correct error.");
                }
            }
            else {
                console.log("Unable to contact server.");
            }
        }
    });
};

var loginWithUser = function(usertoken) {
    $.ajax({
        url: "http://localhost:8081/user/"+usertoken+"/login",
        success: function() {
            updateUI(usertoken);
            curtoken = usertoken;
        },
        error: function() {

        }
    });
};

var logout = function() {
    $.ajax({
        url: "http://localhost:8081/user/"+curtoken+"/logout",
        success: function() {
            curtoken = false;
            updateUI(token);
        },
        error: function() {

        }
    });
};

$(document).ready(function () {
    $(".userlogin").click(function () {
        var token = $(this).data('token');
        loginWithUser(token);
    });

    $(".userlogout").click(function () {
        logout();
    })
});
