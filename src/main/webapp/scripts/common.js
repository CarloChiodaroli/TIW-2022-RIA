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
    let children = document.querySelectorAll("#" + exclude.parentNode.id + " > div")
    for (let child of children) {
        if(child !== exclude){
            child.children.item(2).checked = false;
            child.classList.remove("selected");
        }
    }
}

function setChoice (element) {
    let input = document.querySelector("#" + element.id + " > input");
    input.checked  = !input.checked;
    if(input.checked) element.classList.add("selected");
    else element.classList.remove("selected");
}