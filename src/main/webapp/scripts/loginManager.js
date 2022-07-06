(function () {

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

        let passwordInputs = document.getElementById("signUpContainer").querySelectorAll('input[type="password"]');
        passwordInputs.forEach((x) => {
            x.pattern = "^(?=.*[A-Z])(?=.*[!@#$&*])(?=.*[0-9])(?=.*[a-z]).{8}.*";
        })
    })

    function authenticationButton(buttonId, servletUrl) {
        document.getElementById(buttonId).addEventListener('click', (event) => {
            let form = event.target.closest("form");
            for (let key of (new FormData(form)).keys()) {
                console.log(key);
            }
            if (checkLoginValidity(form)) {
                makeCall("POST", servletUrl, event.target.closest("form"),
                    (req) => requestManagement(req,
                        function (data) {
                            sessionStorage.setItem("user", JSON.stringify(data));
                            homePageDispatcher(data.userType);
                        },
                        (status, message) => errorFromServer(status, message)
                    ), true);
            } else {
                form.reportValidity();
            }
        })
    }

    function checkLoginValidity(form) {
        let validity = form.checkValidity();
        let pswInput = form.querySelector('input[name="password"]');
        let repPswInput = form.querySelector('input[name="rep-password"]');
        if (repPswInput !== null && pswInput.value !== repPswInput.value) {
            pswInput.setCustomValidity("Passwords do not coincide");
            repPswInput.setCustomValidity("Passwords do not coincide")
            validity = false;
        }
        if (pswInput.validity.patternMismatch) {
            pswInput.setCustomValidity("Password needs to be 8 characters long and have a number and an uppercase character");
            validity = false
        }
        return validity;
    }

    function homePageDispatcher(userType) {
        switch (userType) {
            case "EMPLOYEE":
                window.location.href = "employeeHomePage.html";
                break;
            case "CLIENT" :
                window.location.href = "clientHomePage.html";
                break;
            default :
        }
    }
}())