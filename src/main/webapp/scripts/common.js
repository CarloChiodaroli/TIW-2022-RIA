function makeCall(method, url, formElement, cback, reset) {
    resetErrorFromServer();
    let req = new XMLHttpRequest();
    req.onreadystatechange = function () {
        cback(req);
    };
    req.open(method, url, true);
    if(formElement == null) {
        req.send();
    } else {
        let gino = new FormData(formElement);
        console.log(formElement);
        req.send(gino)
    }
    if (formElement !== null && reset === true) {
        formElement.reset();
    }
}

function requestManagement (req, positive, negative) {
    if(req.readyState === XMLHttpRequest.DONE) {
        let message = req.responseText;
        switch (req.status) {
            case 200:
                let data = JSON.parse(message);
                positive(data);
                break;
            default:
                negative(req.status, message);
        }
    }
}

function resetChoice (exclude) {
    let children = exclude.parentNode.querySelectorAll(":scope > div");
    for (let child of children) {
        if(child !== exclude){
            child.querySelector(":scope > input").checked = false;
            child.classList.remove("selected");
        }
    }
}

function setChoice (element) {
    let input = element.querySelector(":scope > input");
    input.checked  = !input.checked;
    if(input.checked) element.classList.add("selected");
    else element.classList.remove("selected");
}

function hiddenCheckbox (name, value) {
    let input = document.createElement("input");
    input.name = name
    input.type = "checkbox"
    input.value = value;
    input.hidden = true;
    return input;
}

function optionLineComponent(caption, value, invert){
    let element = document.createElement("div");
    let valueElement = document.createElement("span");
    valueElement.textContent = value;
    let captionElement = document.createElement("span");
    captionElement.classList.add("headers");
    captionElement.textContent = caption;
    element.appendChild(captionElement);
    element.appendChild(valueElement);

    return element;
}

function errorFromServer(code, message) {
    document.getElementById('errorCode').textContent = code
    document.getElementById('errorMessage').textContent = message;
    document.getElementById("errorScreen").classList.remove("hidden");
}

function resetErrorFromServer() {
    document.getElementById("errorScreen").classList.remove("green");
    document.getElementById('errorScreen').classList.add("hidden");
}

function logOut(){
    sessionStorage.removeItem('user');
    makeCall("GET", "Logout", null, function (req) {
        window.location.href = window.location.pathname.substring(0, window.location.pathname.substring(1).indexOf("/") + 1);
    }, false)
}