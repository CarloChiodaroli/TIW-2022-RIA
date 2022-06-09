function makeCall(method, url, formElement, cback, reset) {
    let req = new XMLHttpRequest();
    req.onreadystatechange = function () {
        cback(req);
    };
    req.open(method, url, true);
    if(formElement == null) {
        req.send();
    } else {
        let gino = new FormData(formElement);
        req.send(gino)
    }
    if (formElement !== null && reset === true) {
        formElement.reset();
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

function optionLineComponent(caption, value){
    let element = document.createElement("div");
    let valueElement = document.createElement("span");
    valueElement.textContent = value;
    let captionElement = document.createElement("span");
    captionElement.classList.add("headers");
    captionElement.textContent = caption;
    element.appendChild(valueElement);
    element.appendChild(captionElement);
    return element;
}

function errorFromServer(code, message) {
    document.getElementById('errorCode').textContent = code
    document.getElementById('errorMessage').textContent = message;
    document.getElementById("errorScreen").classList.remove("hidden");
}