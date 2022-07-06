(function () {

    let pageOrchestrator = new PageOrchestrator();
    let user = new SessionUser();

    window.addEventListener('load', () => {
        pageOrchestrator.initialize();
    })

    function WelcomeMessage(_username, place) {
        let username = _username;
        this.show = function () {
            place.textContent = username;
        }
    }

    // User Manager

    function SessionUser() {
        let user = JSON.parse(sessionStorage.getItem('user'))

        if (user === null || user.userType !== "CLIENT") {
            logOut();
        }

        this.username = user.username;

        this.id = user.ID;

        this.type = user.userType;

        this.present = function () {
            return user != null;
        }
    }

    // --- Product and option Manager ---

    function ProductsAndOptions(_productListPlace, _optionListPlace) {

        let productListPlace = _productListPlace;
        let optionListPlace = _optionListPlace;
        let productFormPage = productListPlace.closest("fieldset");
        let optionFormPage = optionListPlace.closest("fieldset");
        let submitButton = optionFormPage.querySelector(':scope > div > input[name="submit"]');
        let nextButton = productFormPage.children.namedItem("next");
        let abortButton = optionFormPage.querySelector(':scope > div > input[name="abort"]');
        let data;

        // Gets data from server
        this.show = function () {
            makeCall("GET", "GetProductsAndOptions", null, (req) =>
                    requestManagement(req,
                        (received) => {
                            data = received;
                            this.update()
                        },
                        (code, message) => errorFromServer(code, message))
                , false)
        }

        // Initializes the form visualization
        this.update = function update() {
            // preventive hiding
            productFormPage.classList.add("hidden");
            optionFormPage.classList.add("hidden");
            // initialization of form's page 1
            this.updatePage1();

            // initialization of pages buttons
            // next button
            nextButton.addEventListener('click', (event) => {
                event.target.classList.add("hidden");
                optionFormPage.classList.remove("hidden");
            })

            // abort button
            abortButton.addEventListener('click', (event) => {
                console.log("Clicked abort button");
                empty(optionListPlace);
                optionListPlace.closest("fieldset").classList.add("hidden");
                productFormPage.children.namedItem("next").classList.remove("hidden");
                this.updatePage1();
            })

            // submit button
            submitButton.addEventListener('click', (event) => {
                console.log("Clicked submit button");
                if (this.checkDataCorrectness()) {
                    makeCall("POST", "CreateEstimate", optionFormPage.closest("form"),
                        (req) => requestManagement(req, () => {
                                pageOrchestrator.update();
                            },
                            (code, message) => errorFromServer(code, message)
                            , true));
                    abortButton.dispatchEvent(new MouseEvent('click')); // Auto click to effectively reset the form.
                }
            });
            // showing form's first page
            productListPlace.closest("fieldset").classList.remove("hidden");
        }

        // Product list initialization
        this.updatePage1 = () => {
            empty(productListPlace);
            let products = this.products();
            // Do I have products?
            if (products == null) {
                return;
            }
            // Build singular Product card
            products.forEach((product) => {
                productListPlace.appendChild(productCard(product, (event) => {
                    // listener function on click on a card
                    let target = event.target;
                    if (target.tagName !== "DIV") {
                        target = target.closest(".content");
                    }
                    empty(optionListPlace);
                    setActualProduct(target.children[2]); // checking checkbox
                    resetChoice(target);
                    setChoice(target);
                    this.updatePage2();
                }));
            })
            nextButton.classList.remove("hidden");
        }

        // Option list initialization
        this.updatePage2 = () => {
            empty(optionListPlace);
            let options = this.options();
            let possibleOptionCodes = this.available(actualProductCode);
            // there are no options available for actual product
            if (possibleOptionCodes == null) {
                return;
            }
            // for every single option
            options.forEach((option) => {
                    // is this option's code in the available for actual product?
                    if (possibleOptionCodes.includes(option.code)) {
                        // Yes it is so append a new line to the list
                        optionListPlace.appendChild(optionLine(option, (event) => {
                            // listener function on click of an option
                            let target = event.target;
                            if (target.tagName !== "DT") {
                                target = target.closest(".content-row");
                            }
                            setChoice(target);
                        }));
                    } // No so don't do anything
                }
            )
        }

        this.checkDataCorrectness = () => {
            let formData = new FormData(optionFormPage.closest("form"))
            let productCode
            if (formData.get("productCode") === null) {
                errorFromServer("Error", "You need to choose a product");
                return false;
            } else {
                productCode = formData.get("productCode");
            }
            let options;
            if (formData.get("optionCode") === null) {
                errorFromServer("Error", "You need to select at least one option");
                return false;
            } else {
                options = this.available(productCode);
            }
            let seenNotPresent = false;
            formData.getAll("optionCode").forEach((code) => {
                if (!seenNotPresent) seenNotPresent = !options.includes(parseInt(code));
            })
            if (seenNotPresent) {
                errorFromServer("Error", "An option is not available for the selected product");
                return false;
            }
            return true;
        }

        // exposes the whole products list
        this.products = function () {
            return data.products;
        };

        // gives a product from its code
        this.product = function (code) {
            return data.products.filter((prod) => prod.code === code)[0];
        }

        // exposes the whole option list
        this.options = function () {
            return data.options;
        };

        // gives an option form a code
        this.option = function (code) {
            return data.options.filter((opt) => opt.code === code)[0];
        }

        // gives the list of the available products
        this.available = function (productCode) {
            let map = data.availability;
            return map[productCode];
        };

        let actualProductCode;

        let setActualProduct = function (productCode) {
            actualProductCode = productCode.value
        }
    }

    // --- Estimate List Manager

    function EstimateList(_listContainer) {

        let listContainer = _listContainer;
        let estimateList;

        // gets data from the server
        this.update = function () {
            makeCall("GET", "GetUserEstimates", null, (req) => {
                requestManagement(req, function (data) {
                        estimateList = data;
                        show();
                    },
                    (code, message) => errorFromServer(code, message))
            }, false)
        }

        // shows the data on screen
        function show() {
            listContainer.classList.add("hidden");
            empty(listContainer);
            if (estimateList.length === 0) {
                let text = document.createElement("h3");
                text.textContent = "No estimates found";
                listContainer.appendChild(text);
            } else {
                estimateList.forEach((estimate) => listContainer.appendChild(estimateRow(estimate)));
            }
            listContainer.classList.remove("hidden");
        }

        // resets the option list view, needed to remove estimate details from screen
        this.resetView = function () {
            let detailLeft = document.getElementById("estimateDetail");
            let row = null;
            if (detailLeft !== null) {
                row = detailLeft.previousElementSibling;
                row.classList.remove("selected");
                detailLeft.remove();
            }
            return row;
        }
    }

    function EstimateDetails (_estimateList, _productsAndOptions) {

        let estimateList = _estimateList;
        let productsAndOptions = _productsAndOptions;

        this.showEstimateDetails = function (estimate, target) {
            let oldSelection = estimateList.resetView();
            console.log(oldSelection);
            console.log(target);
            if (oldSelection === target) return;
            let url = "EstimateDetail?estimateCode=" + estimate.code;
            makeCall("GET", url, null,
                (req) => requestManagement(req,
                    function (estimateDetail) {
                        let optionList = [];
                        estimateList.resetView();
                        estimateDetail.estimate.options.forEach((code) => optionList.push(productsAndOptions.option(code)));
                        console.log(optionList);
                        estimateDetailPane(estimateDetail, target,
                            productsAndOptions.product(estimateDetail.estimate.product),
                            optionList);
                    },
                    (status, message) => errorFromServer(status, message)
                ), false);
        }
    }



    // --- Page Orchestrator ---

    function PageOrchestrator() {

        let user = new SessionUser();
        let productsAndOptions;
        let estimateList;
        let estimateDetail;

        this.initialize = function () {

            let message = new WelcomeMessage(
                user.username,
                document.getElementById('usernameWelcome'));
            message.show();

            productsAndOptions = new ProductsAndOptions(
                document.getElementById("product-list"),
                document.getElementById("option-list"));

            estimateList = new EstimateList(
                document.getElementById("userEstimatesList"));

            let logoutButton = document.getElementById("logout-button");
            logoutButton.addEventListener('click', logOut);

            estimateDetail = new EstimateDetails(estimateList, productsAndOptions);

            productsAndOptions.show();
            estimateList.update();
        }

        this.update = function () {
            productsAndOptions.show();
            estimateList.update();
        };

        // gets estimate details from database and shows them on screen
        this.showEstimateDetails = (estimate, target) => estimateDetail.showEstimateDetails(estimate, target);
    }

    // Graphical rendering

    function productCard(product, onClick) {
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

    function optionLine(option, onClick) {
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
            if (target.classList.contains("selected")) {
                target.classList.remove("selected");
            } else target.classList.add("selected");
            pageOrchestrator.showEstimateDetails(estimate, target);
        })
        line.classList.add("hover");
        return line;
    }

    function estimateDetailPane(estimateDetail, place, product, options) {
        let basePath = "images/dbImages/";
        let pane = document.createElement("dt");
        pane.id = "estimateDetail";
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
        if (estimateDetail.estimate.employee === 0) {
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

    function empty(place) {
        place.innerHTML = "";
    }
}())