// =======================
// 🛒 LOAD CART FROM DB
// =======================
let container = document.getElementById("cartItems");

let currentUser = localStorage.getItem("currentUser") || "Guest";

function loadCart(){

fetch(`http://localhost:3000/cart?customer=${currentUser}`)
.then(res => res.json())
.then(data => {

    container.innerHTML = "";

    if(data.length === 0){
        container.innerHTML = "<h3>Your cart is empty</h3>";
        return;
    }

    data.forEach(item => {

        let div = document.createElement("div");
        div.classList.add("product-card");

        div.innerHTML = `
            <img src="${item.image}" style="width:100%; height:150px; object-fit:cover; border-radius:8px;">

            <h3>${item.product}</h3>

            <p><b>💰 Price:</b> ${item.price}</p>

            <p><b>🏪 Shop:</b> ${item.shop || "Unknown Shop"}</p>

            <div class="cart-actions">
                <button onclick="sendPriceRequest('${item.product}','${item.shop}')">💰 Price</button>
                <button onclick="bookFromCart('${item.product}','${item.price}','${item.shop}')">📦 Book</button>
                <button onclick="removeItem(${item.id})">❌ Remove</button>
            </div>
        `;

        container.appendChild(div);
    });

})
.catch(err => console.log(err));

}

// =======================
// ❌ REMOVE ITEM (DB)
// =======================
function removeItem(id){

fetch("http://localhost:3000/remove-cart", {
    method: "POST",
    headers: {
        "Content-Type": "application/json"
    },
    body: JSON.stringify({ id })
})
.then(res => res.text())
.then(() => loadCart())
.catch(err => console.log(err));

}

// =======================
// 💰 PRICE REQUEST (DB)
// =======================
function sendPriceRequest(product, shop){

let price = prompt("Enter your price");
if(!price) return;

let currentUser = localStorage.getItem("currentUser") || "Guest";

fetch("http://localhost:3000/add-order", {
    method: "POST",
    headers: {
        "Content-Type": "application/json"
    },
    body: JSON.stringify({
        type: "price",
        product: product,
        price: price,
        shop: shop,
        customer: currentUser,
        status: "Pending"
    })
})
.then(res => res.text())
.then(msg => alert(msg))
.catch(err => console.log(err));

}

// =======================
// 📦 BOOK FROM CART (DB)
// =======================
function bookFromCart(product, price, shop){

let currentUser = localStorage.getItem("currentUser") || "Guest";

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
        customer: currentUser,
        status: "Pending"
    })
})
.then(res => res.text())
.then(msg => {
    alert(msg);
})
.catch(err => console.log(err));

}

// =======================
// 🚀 INIT
// =======================
loadCart();
