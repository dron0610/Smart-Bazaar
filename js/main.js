// =======================
// 🏪 POPULAR SHOPS SLIDER
// =======================

let slider = document.getElementById("shopTrack");

function slideLeft() {
    if (slider) {
        slider.scrollBy({
            left: -300,
            behavior: "smooth"
        });
    }
}

function scrollRight() {
    if (slider) {
        slider.scrollBy({
            left: 300,
            behavior: "smooth"
        });
    }
}


// =======================
// 🅿️ PARKING
// =======================

let parkingButtons = document.querySelectorAll(".book-slot-btn");

parkingButtons.forEach(btn => {

    btn.addEventListener("click", function () {

        // Directly go to parking page
        window.location.href = "parking.html";

    });

});


// =======================
// 🛒 CURRENT PRODUCT
// =======================

let currentProduct = "";

function setCurrentProduct(btn) {

    let card = btn.closest(".product-card");

    if (!card) return;

    let title = card.querySelector("h3");

    if (title) {
        currentProduct = title.innerText.trim();
    }

}


// =======================
// 🔥 PRODUCT CARD INFO BUTTON
// =======================

document.querySelectorAll(".info-btn").forEach(btn => {

    btn.addEventListener("click", function () {

        let card = this.closest(".product-card");

        if (!card) return;

        let popup = card.querySelector(".popup");

        if (popup) {
            popup.style.display = "flex";
        }

    });

});


// =======================
// ❌ CLOSE PRODUCT POPUP
// =======================

document.querySelectorAll(".close-btn").forEach(btn => {

    btn.addEventListener("click", function () {

        let popup = this.closest(".popup");

        if (popup) {
            popup.style.display = "none";
        }

    });

});


// =======================
// 💰 PRICE POPUP
// =======================

function openPricePopup() {

    if (currentProduct === "") {
        alert("Select product first ❌");
        return;
    }

    let popup = document.getElementById("pricePopup");

    if (popup) {
        popup.style.display = "flex";
    } else {

        // If common popup doesn't exist,
        // use product's own popup
        let cards = document.querySelectorAll(".product-card");

        cards.forEach(card => {

            let title = card.querySelector("h3");

            if (title && title.innerText.trim() === currentProduct) {

                let productPopup = card.querySelector(".popup");

                if (productPopup) {
                    productPopup.style.display = "flex";
                }

            }

        });

    }

}


// =======================
// 🏪 VISIT POPUP
// =======================

function openVisitPopup() {

    if (currentProduct === "") {
        alert("Select product first ❌");
        return;
    }

    let popup = document.getElementById("visitPopup");

    if (popup) {
        popup.style.display = "flex";
    } else {

        let cards = document.querySelectorAll(".product-card");

        cards.forEach(card => {

            let title = card.querySelector("h3");

            if (title && title.innerText.trim() === currentProduct) {

                let productPopup = card.querySelector(".popup");

                if (productPopup) {
                    productPopup.style.display = "flex";
                }

            }

        });

    }

}


// =======================
// 📦 BOOK NOW
// =======================

function bookNow(btn) {

    let card = btn.closest(".product-card");

    if (!card) return;

    let product = card.querySelector("h3")?.innerText.trim() || "";
    let priceText = card.querySelector("p")?.innerText || "";
    let price = priceText.replace(/[₹,]/g, "").trim();

    let shop = localStorage.getItem("currentShop") || "Local Shop";

    let customer =
        localStorage.getItem("currentUser") ||
        localStorage.getItem("userName") ||
        "Guest";

    if (customer === "Guest") {
        alert("Please login first ❌");
        window.location.href = "login.html";
        return;
    }

    fetch("http://localhost:3000/add-order", {

        method: "POST",

        headers: {
            "Content-Type": "application/json"
        },

        body: JSON.stringify({

            type: "booking",
            product: product,
            price: price,
            shop: shop,
            customer: customer

        })

    })

    .then(res => res.text())

    .then(msg => {

        alert(msg);

    })

    .catch(err => {

        console.error(err);
        alert("Server connection error ❌");

    });

}


// =======================
// 💰 BARGAIN REQUEST
// =======================

function submitPrice() {

    let priceInput = document.getElementById("userPrice");

    if (!priceInput) {
        alert("Price field not found ❌");
        return;
    }

    let offeredPrice = priceInput.value.trim();

    if (!offeredPrice) {
        alert("Enter your price ❌");
        return;
    }

    let shop =
        localStorage.getItem("currentShop") ||
        "Local Shop";

    let customer =
        localStorage.getItem("currentUser") ||
        localStorage.getItem("userName") ||
        "Guest";

    if (customer === "Guest") {
        alert("Please login first ❌");
        window.location.href = "login.html";
        return;
    }

    // Find product price
    let productPrice = "";

    document.querySelectorAll(".product-card").forEach(card => {

        let title = card.querySelector("h3");

        if (title && title.innerText.trim() === currentProduct) {

            let p = card.querySelector("p");

            if (p) {
                productPrice = p.innerText
                    .replace(/[₹,]/g, "")
                    .trim();
            }

        }

    });

    fetch("http://localhost:3000/add-order", {

        method: "POST",

        headers: {
            "Content-Type": "application/json"
        },

        body: JSON.stringify({

            type: "price",
            product: currentProduct,
            price: offeredPrice,
            shop: shop,
            customer: customer

        })

    })

    .then(res => res.text())

    .then(msg => {

        alert(msg);

        if (priceInput) {
            priceInput.value = "";
        }

        closePopup();

    })

    .catch(err => {

        console.error(err);
        alert("Server connection error ❌");

    });

}


// =======================
// 🏪 VISIT REQUEST
// =======================

function confirmVisit() {

    let shop =
        localStorage.getItem("currentShop") ||
        "Local Shop";

    let customer =
        localStorage.getItem("currentUser") ||
        localStorage.getItem("userName") ||
        "Guest";

    if (customer === "Guest") {
        alert("Please login first ❌");
        window.location.href = "login.html";
        return;
    }

    fetch("http://localhost:3000/add-order", {

        method: "POST",

        headers: {
            "Content-Type": "application/json"
        },

        body: JSON.stringify({

            type: "visit",
            product: currentProduct || "Visit Request",
            price: "-",
            shop: shop,
            customer: customer

        })

    })

    .then(res => res.text())

    .then(msg => {

        alert(msg);
        closePopup();

    })

    .catch(err => {

        console.error(err);
        alert("Server connection error ❌");

    });

}


// =======================
// 🛒 ADD TO CART
// =======================

function addToCart(btn) {

    let card = btn.closest(".product-card");

    if (!card) return;

    let product =
        card.querySelector("h3")?.innerText.trim() || "";

    let price =
        card.querySelector("p")?.innerText.trim() || "";

    let image =
        card.querySelector("img")?.src || "";

    let shop =
        localStorage.getItem("currentShop") ||
        "Local Shop";

    let customer =
        localStorage.getItem("currentUser") ||
        localStorage.getItem("userName") ||
        "Guest";

    if (customer === "Guest") {
        alert("Please login first ❌");
        window.location.href = "login.html";
        return;
    }

    fetch("http://localhost:3000/add-cart", {

        method: "POST",

        headers: {
            "Content-Type": "application/json"
        },

        body: JSON.stringify({

            product: product,
            price: price,
            image: image,
            shop: shop,
            customer: customer

        })

    })

    .then(res => res.text())

    .then(msg => {

        alert(msg);

    })

    .catch(err => {

        console.error(err);
        alert("Server connection error ❌");

    });

}


// =======================
// ❌ CLOSE POPUPS
// =======================

function closePopup() {

    let pricePopup = document.getElementById("pricePopup");
    let visitPopup = document.getElementById("visitPopup");

    if (pricePopup) {
        pricePopup.style.display = "none";
    }

    if (visitPopup) {
        visitPopup.style.display = "none";
    }

    document.querySelectorAll(".popup").forEach(popup => {
        popup.style.display = "none";
    });

}


// =======================
// 🔍 SEARCH
// =======================

let searchBtn = document.getElementById("searchBtn");

if (searchBtn) {

    searchBtn.addEventListener("click", function () {

        let input =
            document.getElementById("searchInput")
            ?.value
            .toLowerCase()
            .trim() || "";

        let shops =
            document.querySelectorAll(".shop-card");

        let products =
            document.querySelectorAll(".product-card");

        // Search Shops
        shops.forEach(shop => {

            let text =
                shop.innerText.toLowerCase();

            shop.style.display =
                text.includes(input)
                    ? ""
                    : "none";

        });

        // Search Products
        products.forEach(product => {

            let text =
                product.innerText.toLowerCase();

            product.style.display =
                text.includes(input)
                    ? ""
                    : "none";

        });

    });

}


// =======================
// ⌨️ SEARCH ON ENTER
// =======================

let searchInput =
    document.getElementById("searchInput");

if (searchInput) {

    searchInput.addEventListener("keypress", function(e) {

        if (e.key === "Enter" && searchBtn) {
            searchBtn.click();
        }

    });

}