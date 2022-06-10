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

    function SessionUser() {
        let user = JSON.parse(sessionStorage.getItem('user'))

        this.username = function () {
            return user.username
        }

        this.type = function () {
            return user.userType;
        }
    }

    function ProductsAndOptions(_productListPlace, _optionListPlace) {

        let productListPlace = _productListPlace;
        let optionListPlace = _optionListPlace;
        let productFormPage = productListPlace.closest("fieldset");
        let optionFormPage = optionListPlace.closest("fieldset");
        let submitButton = optionFormPage.querySelector(':scope > div > input[name="submit"]');
        let nextButton = productFormPage.children.namedItem("next");
        let abortButton = optionFormPage.querySelector(':scope > div > input[name="abort"]');
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
            // preventive hiding
            productFormPage.classList.add("hidden");
            optionFormPage.classList.add("hidden");
            // initialization of form's page 1
            this.updatePage1(self);

            // initialization of pages buttons
            nextButton.addEventListener('click', (event) => {
                console.log("clicked next button");
                event.target.classList.add("hidden");
                this.updatePage2(self);
                optionFormPage.classList.remove("hidden");
            })

            abortButton.addEventListener('click', (event) => {
                console.log("Clicked abort button");
                optionListPlace.innerHTML = "";
                optionListPlace.closest("fieldset").classList.add("hidden");
                productFormPage.children.namedItem("next").classList.remove("hidden")
                this.updatePage1(self);
            })

            submitButton.addEventListener('click', (event) => {
                console.log("Clicked submit button");
                makeCall("POST", "CreateEstimate", optionFormPage.closest("form"), function (req) {
                    if (req.readyState === XMLHttpRequest.DONE) {
                        let message = req.responseText;
                        switch (req.status) {
                            case 200:
                                console.log("Estimate saved well");
                                pageOrchestrator.update();
                                break;
                            case 400 | 401 | 403 | 404 | 500:
                                errorFromServer(req.status, message);
                                break;
                        }
                    }
                }, false)
            })
            // showing form's first page
            productListPlace.closest("fieldset").classList.remove("hidden");
        }

        this.updatePage1 = function (self) {
            productListPlace.innerHTML = "";
            let products = self.products();
            if (products == null) return;
            products.forEach(function (product) {
                productListPlace.appendChild(productCard(product, (event) => {
                    let target = event.target;
                    if (target.tagName !== "DIV") {
                        target = target.closest(".content");
                    }
                    self.resetOptionList();
                    setActualProduct(target.children[2]);
                    resetChoice(target);
                    setChoice(target);
                }));
            })
            nextButton.classList.remove("hidden");
        }

        this.updatePage2 = function (self) {
            optionListPlace.innerHTML = "";
            let options = self.options();
            let possibleOptionCodes = self.available(actualProductCode);
            if (possibleOptionCodes == null) return;
            options.forEach(
                function (option) {
                    if (possibleOptionCodes.includes(option.code)) {
                        optionListPlace.appendChild(optionLine(option, (event) => {
                            let target = event.target;
                            if (target.tagName !== "DT") {
                                target = target.closest(".content-row");
                            }
                            setChoice(target);
                        }));
                    }
                }
            )
        }

        this.products = function () {
            return data.products;
        };

        this.product = function (code) {
            console.log(code);
            return data.products.filter((prod) => prod.code === code)[0];
        }

        this.options = function () {
            return data.options;
        };

        this.option = function (code) {
            return data.options.filter((opt) => opt.code === code)[0];
        }

        this.available = function (productCode) {
            let map = data.availability;
            return map[productCode];
        };

        this.resetOptionList = function () {
            optionListPlace.innerHTML = "";
        }

    }

    let actualProductCode;

    let setActualProduct = function (productCode) {
        actualProductCode = productCode.value
    }

    function EstimateList(_listContainer) {

        let listContainer = _listContainer;
        let data;

        this.show = function () {
            let self = this;
            makeCall("GET", "GetUserEstimates", null, (req) => {
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

        this.update = function () {
            listContainer.classList.add("hidden");
            listContainer.innerHTML = "";
            data.forEach((estimate) => listContainer.appendChild(estimateRow(estimate)));
            listContainer.classList.remove("hidden");
        }

    }

    function PageOrchestrator() {

        let user = new SessionUser();
        let productsAndOptions;
        let estimateList

        this.initialize = function () {
            let message = new WelcomeMessage(
                user.username(),
                document.getElementById('usernameWelcome'));
            message.show();

            productsAndOptions = new ProductsAndOptions(
                document.getElementById("product-list"),
                document.getElementById("option-list"));

            estimateList = new EstimateList(
                document.getElementById("userEstimatesList"));

            productsAndOptions.show();
            estimateList.show();
        }

        this.update = function () {
            productsAndOptions.show();
            estimateList.show();
        };

        this.showEstimateDetails = function (estimate, target) {
            let url = "EstimateDetail?estimateCode=" + estimate.code;
            makeCall("GET", url, null,
                (req) => requestManagement(req,
                    function (estimateDetail) {
                        let optionList = [];
                        estimateDetail.estimate.options.forEach((code) => optionList.push(productsAndOptions.option(code)));
                        console.log(optionList);
                        estimateDetailPane(estimateDetail, target,
                            productsAndOptions.product(estimateDetail.estimate.product),
                            optionList);
                    },
                    (status, message)  =>errorFromServer(status, message)
                ), false);
        }
    }

    let productCard = function (product, onClick) {
        let basePath = "images/dbImages/";
        let baseId = "product_";
        let inputName = "productCode";
        let card = document.createElement("div");
        card.classList.add("content");
        card.classList.add("hover");
        card.id = baseId + product.code;
        let image = document.createElement("img");
        image.src = basePath + product.image;
        let caption = document.createElement("span");
        caption.textContent = product.name;
        let input = hiddenCheckbox(inputName, product.code);
        card.appendChild(image);
        card.appendChild(caption);
        card.appendChild(input);
        card.addEventListener('click', (event) => onClick(event));
        return card;
    }

    let optionLine = function (option, onClick) {
        let baseId = "option_";
        let inputName = "optionCode";
        let line = document.createElement("dt");
        line.classList.add("content-row");
        line.classList.add("hover");
        line.id = baseId + option.code;
        line.appendChild(optionLineComponent("Code", option.code));
        line.appendChild(optionLineComponent("Name", option.name));
        line.appendChild(optionLineComponent("Type", option.type));
        line.appendChild(hiddenCheckbox(inputName, option.code));
        line.addEventListener('click', (event) => onClick(event))
        return line;
    }

    function estimateRow(estimate) {
        let line = document.createElement("dt");
        line.appendChild(optionLineComponent("Estimate Code", estimate.code));
        line.appendChild(optionLineComponent("Product Name", estimate.product));
        if (estimate.employee === 0) {
            line.appendChild(optionLineComponent(null, "Not Priced"));
        } else {
            line.appendChild(optionLineComponent("Estimate Price", estimate.price));
        }
        line.addEventListener('click', (event) => {
            let target = event.target;
            if (target.tagName !== "DT") {
                target = target.closest("dt");
            }
            if (target.classList.contains("selected")) target.classList.remove("selected");
            else target.classList.add("selected");
            pageOrchestrator.showEstimateDetails(estimate, target);
        })
        line.classList.add("hover");
        return line;
    }

    function estimateDetailPane(estimateDetail, place, product, options) {
        console.log(product);
        console.log(options);

        let basePath = "images/dbImages/";
        let pane = document.createElement("dt");
        pane.classList.add("detail-Body");
        let firstRow = document.createElement("div");
        firstRow.classList.add("first-row");

        let productView = document.createElement("div");
        productView.classList.add("product-details");
        let image = document.createElement("img")
        image.src = basePath + product.image;
        image.alt = "Image of" + product.name;
        productView.appendChild(image);
        productView.appendChild(optionLineComponent("Product name", product.name));
        productView.appendChild(optionLineComponent("Product code", product.code));

        let userView = document.createElement("div");
        userView.classList.add("user-details");
        let clientDetails = document.createElement("div");
        clientDetails.appendChild(optionLineComponent("Client username: ", estimateDetail.client.username));
        let pricingDetail = document.createElement("div");
        if(estimateDetail.estimate.employee === 0){
            pricingDetail.appendChild(optionLineComponent(null, "This estimate has not been priced yet"));
        } else {
            pricingDetail.appendChild(optionLineComponent("Priced by: ", estimateDetail.employee.username));
            pricingDetail.appendChild(optionLineComponent("Price: ", estimateDetail.estimate.price));
        }
        userView.appendChild(clientDetails);
        userView.appendChild(pricingDetail);

        firstRow.appendChild(productView);
        firstRow.appendChild(userView);

        let optionList = document.createElement("dl");
        let title = document.createElement("h2");
        title.textContent = "With options";
        title.classList.add("table-title");
        optionList.appendChild(title)
        options.forEach((option) => optionList.appendChild(optionLine(option, null)));
        for (let child of optionList.children) {
            child.classList.remove("hover");
        }

        let productTitle = document.createElement("h2");
        productTitle.textContent = "Estimate with: ";
        productTitle.classList.add("table-title");
        pane.appendChild(productTitle);
        pane.appendChild(firstRow);
        pane.appendChild(optionList);

        place.parentNode.insertBefore(pane, place.nextSibling);
    }

}())