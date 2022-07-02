(function() {

    window.addEventListener('load', () => {
        authenticationButton('loginButton', "CheckLogin"); // add event for login
        authenticationButton('signUpButton', "CheckSignUp"); // ass event for signup
        document.getElementById("showLogin").addEventListener('click', function (event) {
            document.getElementById("loginContainer").classList.remove("hidden"); // show login form
            document.getElementById("signUpContainer").classList.add("hidden") // hide sign up form
        })
        document.getElementById("showSignUp").addEventListener('click', function (event) {
            document.getElementById("loginContainer").classList.add("hidden"); // hide login form
            document.getElementById("signUpContainer").classList.remove("hidden");// show sign up form
        })
    })

    function authenticationButton (buttonId, servletUrl) {
        document.getElementById(buttonId).addEventListener('click', (event) => {
            let form = event.target.closest("form");
            if (form.checkValidity()){
                makeCall("POST", servletUrl, event.target.closest("form"),
                    function(x) {
                        if (x.readyState === XMLHttpRequest.DONE) {
                            let message = x.responseText;
                            switch (x.status) {
                                case 200:
                                    sessionStorage.setItem("user", message);
                                    let user =  JSON.parse(message);
                                    homePageDispatcher(user.userType);
                                    break
                                case 400 | 401 | 500:
                                    console.log("gino");
                                    errorFromServer(x.status, message)
                                    break
                            }
                        }
                    }, true)
            } else {
                form.reportValidity();
            }
        })
    }

    function homePageDispatcher (userType){
        switch (userType) {
            case "EMPLOYEE":
                window.location.href = "employeeHomePage.html";
                break;
            case "CLIENT" :
                window.location.href = "clientHomePage.html";
                break;
            default :
                document.getElementById('errormessage').textContent = "UserType was not recognized";
        }
    }
}())