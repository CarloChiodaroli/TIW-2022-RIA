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

        if (user === null) {
            logOut();
        }

        this.username = user.username;

        this.id = user.ID;

        this.type = function () {
            return user.userType;
        }

        this.present = function () {
            return user != null;
        }
    }

    // --- Product and option Manager ---

    function ProductsAndOptions() {

        let data;

        // Gets data from server
        this.getInfo = function () {
            makeCall("GET", "GetProductsAndOptions", null, (req) =>
                    requestManagement(req,
                        (received) => {
                            data = received;
                        },
                        (code, message) => errorFromServer(code, message))
                , false)
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
    }

    // --- Estimate List Manager

    function EstimateList(_listContainer, kindOfList, price) {

        let listContainer = _listContainer;
        let estimateList;

        // gets data from the server
        this.update = function () {
            makeCall("GET", kindOfList, null, (req) => {
                requestManagement(req, function (data) {
                        estimateList = data;
                        show();
                    },
                    (code, message) => errorFromServer(code, message))
            }, false)
        }

        // shows the data on screen
        let show = () => {
            listContainer.classList.add("hidden");
            empty(listContainer);
            console.log(estimateList);
            if(estimateList.length === 0){
                let text = document.createElement("h3");
                text.textContent = "No estimates found";
                listContainer.appendChild(text);
            } else {
                if (price === true) {
                    estimateList.forEach((estimate) => listContainer.appendChild(estimateRow(estimate, getPriceEstimateForm, this.resetView)));
                } else {
                    estimateList.forEach((estimate) => listContainer.appendChild(estimateRow(estimate, null, this.resetView)));
                }
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

        this.containsCode = function (code) {
            let estimateCodes = estimateList.map((estimate) => estimate.code);
            return estimateCodes.includes(parseInt(code));
        }

        this.removeEstimate = function (estimateCode) {
            let estimateToRemove;
            console.log(estimateList)
            estimateList.forEach((estimate) => {
                if(estimate.code === estimateCode) estimateToRemove = estimateList.indexOf(estimate);
            })
            estimateList.splice(estimateToRemove, 1);
            show();
        }

        this.addEstimate = function (estimate) {
            estimateList.unshift(estimate);
            show();
        }
    }

    // --- Page Orchestrator ---

    function PageOrchestrator() {

        let productsAndOptions;
        let myEstimateList
        let notPricedEstimateList;

        this.initialize = function () {

            let message = new WelcomeMessage(
                user.username,
                document.getElementById('usernameWelcome'));
            message.show();

            productsAndOptions = new ProductsAndOptions(
                document.getElementById("product-list"),
                document.getElementById("option-list"));

            myEstimateList = new EstimateList(
                document.getElementById("userEstimatesList"), "GetUserEstimates", false);

            notPricedEstimateList = new EstimateList(
                document.getElementById("notPricedList"), "GetNotPricedEstimates", true)

            let logoutButton = document.getElementById("logout-button");
            logoutButton.addEventListener('click', logOut);

            productsAndOptions.getInfo();
            myEstimateList.update();
            notPricedEstimateList.update();
        }

        this.update = function () {
            myEstimateList.update();
            notPricedEstimateList.update();
        };

        // gets estimate details from database and shows them on screen
        this.showEstimateDetails = function (estimate, target, form, resetView) {
            let oldSelection = resetView();
            console.log(oldSelection);
            console.log(target);
            if (oldSelection === target) return;
            let url = "EstimateDetail?estimateCode=" + estimate.code;
            makeCall("GET", url, null,
                (req) => requestManagement(req,
                    function (estimateDetail) {
                        let optionList = [];
                        estimateDetail.estimate.options.forEach((code) => optionList.push(productsAndOptions.option(code)));
                        console.log(optionList);
                        estimateDetailPane(estimateDetail, target,
                            productsAndOptions.product(estimateDetail.estimate.product),
                            optionList, form);
                    },
                    (status, message) => errorFromServer(status, message)
                ), false);
        }

        this.isNotPriced = function (estimateCode) {
            return notPricedEstimateList.containsCode(estimateCode);
        }

        this.priced = function (data) {
            notPricedEstimateList.removeEstimate(data.code);
            myEstimateList.addEstimate(data);
        }
    }

    // Graphical rendering

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

    function estimateRow(estimate, formBuilder, resetView) {
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
            pageOrchestrator.showEstimateDetails(estimate, target, formBuilder, resetView);
        })
        line.classList.add("hover");
        return line;
    }

    function estimateDetailPane(estimateDetail, place, product, options, formBuilder) {
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
        if (formBuilder !== null) {
            let title = document.createElement("h2");
            title.textContent = "Price Estimate Form";
            title.classList.add("table-title");
            let form = formBuilder(estimateDetail);
            pane.appendChild(form);
            pane.insertBefore(title, form);
        }
        place.parentNode.insertBefore(pane, place.nextSibling);
    }

    function getPriceEstimateForm(estimateDetail) {
        console.log(estimateDetail);
        console.log(user);
        let form = document.createElement("form");
        let employeeInfo = document.createElement("input");
        employeeInfo.type = "hidden";
        employeeInfo.name = "employeeId";
        employeeInfo.value = user.id;
        employeeInfo.required = true;
        let estimateInfo = document.createElement("input");
        estimateInfo.type = "hidden";
        estimateInfo.name = "estimateCode";
        estimateInfo.value = estimateDetail.estimate.code;
        estimateInfo.required = true;
        let priceInfoLabel = document.createElement("label");
        let priceHeader = document.createElement("span");
        priceHeader.textContent = "Price: ";
        let priceInfo = document.createElement("input");
        priceInfo.type = "number";
        priceInfo.step = "0.01";
        priceInfo.min = "0.01";
        priceInfo.name = "price";
        priceInfo.required = true;
        priceInfoLabel.appendChild(priceHeader);
        priceInfoLabel.appendChild(priceInfo);
        let submitDiv = document.createElement("div");
        let submitButton = document.createElement("input");
        submitButton.type = "button";
        submitButton.name = "submit";
        submitButton.value = "Submit";
        submitButton.classList.add("my-button");
        submitDiv.appendChild(submitButton);
        form.appendChild(employeeInfo);
        form.appendChild(estimateInfo);
        form.appendChild(priceInfoLabel);
        form.appendChild(submitDiv);
        submitButton.addEventListener('click', (event) => {
            let selected = event.target.closest('form');
            if (formCorrectness(selected))
                makeCall('POST', "PriceEstimate", selected, (req) =>
                    requestManagement(req,
                        (data) => {
                            pageOrchestrator.priced(data);
                            document.getElementById("errorScreen").classList.add("green");
                            document.getElementById('errorCode').textContent = "200"
                            document.getElementById('errorMessage').textContent = "Estimate " + data.code + " priced successfully";
                            document.getElementById("errorScreen").classList.remove("hidden");
                        },
                        (code, message) => errorFromServer(code, message)), true)
        })
        let section = document.createElement("section");

        function formCorrectness(form) {
            let formData = new FormData(form);

            let employeeId = formData.get("employeeId");
            let estimateCode = formData.get("estimateCode");
            let price = formData.get("price");

            if (price === null   || price.length === 0) {
                errorFromServer("Error", "No Price given");
                return false;
            }
            if (estimateCode === null || estimateCode.length === 0){
                errorFromServer("Error", "No Estimate code given");
                return false;
            }
            if (employeeId === null || employeeId.length === 0){
                errorFromServer("Error", "No Employee Id given");
                return false;
            }

            price = parseInt(price);
            employeeId = parseInt(employeeId);
            estimateCode = parseInt(estimateCode);

            if (isNaN(price)){
                errorFromServer("Error", "Given price is not a number");
                return false;
            }
            if (isNaN(employeeId)){
                errorFromServer("Error", "Given employee id is not a number");
                return false;
            }
            if (isNaN(estimateCode)){
                errorFromServer("Error", "Given estimate code not a number");
                return false;
            }

            if (employeeId !== user.id) {
                errorFromServer("Error", "Wrong user Id");
                return false;
            }

            if (!pageOrchestrator.isNotPriced(estimateCode)) {
                errorFromServer("Error", "Given Estimate Id is not in not priced estimates");
                return false;
            }

            if (price == null) {
                errorFromServer("Error", "No price has been given");
                return false;
            }

            if (price <= 0) {
                errorFromServer("Error", "Given price was zero or negative");
                return false;
            }
            return true;
        }

        section.appendChild(form);
        return section;
    }

    function empty(place) {
        place.innerHTML = "";
    }
}())