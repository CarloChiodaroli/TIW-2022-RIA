(function () {

    let pageOrchestrator = new PageOrchestrator();

    window.addEventListener('load', () => {
        pageOrchestrator.initialize();
    })

    function WelcomeMessage(_username, place) {
        let username = _username;
        this.show = function () {
            place.textContent = username;
        }
    }

    function User() {
        let user = JSON.parse(sessionStorage.getItem('user'))
        this.username = function () {
            return user.username
        }
    }

    function ProductsAndOptions(_productListPlace, _optionListPlace) {

        let productListPlace = _productListPlace;
        let optionListPlace = _optionListPlace;
        let data;


        this.show = function () {
            let self = this;
            makeCall("GET", "GetProductsAndOptions", null, (req) => {
                if (req.readyState === XMLHttpRequest.DONE) {
                    let message = req.responseText;
                    switch (req.status) {
                        case 200:
                            data = JSON.parse(message);
                            self.update(self);
                            break;
                        case 500:
                            break;
                    }
                }
            }, false)
        }

        this.update = function (self) {

            let productFormPage = productListPlace.closest("fieldset");
            let optionFormPage = optionListPlace.closest("fieldset");
            // preventive hiding
            productFormPage.classList.add("hidden");
            optionFormPage.classList.add("hidden");
            // initialization of form's page 1
            this.updatePage1(self);
            // initialization of pages buttons
            //    next button
            productFormPage.children.namedItem("next").addEventListener('click', (event) => {
                console.log("clicked next button");
                event.target.classList.add("hidden");

                this.updatePage2();
                optionFormPage.classList.remove("hidden");
            })
            //    abort button
            optionFormPage.children.namedItem("")
            //    submit button

            // showing form's first page
            productListPlace.closest("fieldset").classList.remove("hidden");
        }

        this.updatePage1 = function (self) {
            productListPlace.innerHTML="";
            let products = self.products();
            if(products == null) return;
            products.forEach(function (product) {
                productListPlace.appendChild(productCard(product))
            })
        }

        this.updatePage2 = function (self) {

        }

        this.products = function () {
            console.log(data);
            return data.products;
        };

        this.options = function () {
            return data.options;
        };

        this.available = function (productCode) {
            let map = data.availability;
            return map.get(productCode);
        };
    }

    function PageOrchestrator() {

        let user = new User();

        this.initialize = function () {
            let message = new WelcomeMessage(user.username(), document.getElementById('usernameWelcome'));
            message.show();

            let productsAndOptions = new ProductsAndOptions(
                document.getElementById("product-list"),
                document.getElementById("option-list"));

            productsAndOptions.show();


        }
    }

    let productCard = function (product) {
        let basePath = "images/dbImages/";
        let baseId = "product_"
        let card = document.createElement("div");
        card.classList.add("content");
        card.id = baseId + product.code;
        let image = document.createElement("img");
        image.src = basePath + product.image;
        let caption = document.createElement("span");
        caption.textContent = product.name;
        let input = document.createElement("input");
        input.type = "checkbox"
        input.value = product.code;
        input.hidden = true;
        card.appendChild(image);
        card.appendChild(caption);
        card.appendChild(input);
        card.addEventListener('click', (event) => {
            let target = event.target;
            if(target.tagName !== "DIV"){
                target = target.closest("div");
            }
            resetChoice(target);
            setChoice(target)
        });
        return card;
    }

}())