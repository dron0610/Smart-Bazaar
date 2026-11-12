let container = document.getElementById("shopContainer");

function loadShops(){

let shops = JSON.parse(localStorage.getItem("shops")) || [];

container.innerHTML = "";

shops.forEach(shop => {

let div = document.createElement("div");
div.className = "shop-card";

div.innerHTML = `
<img src="${shop.image}">
<h3>${shop.name}</h3>
<p>${shop.category}</p>

<button onclick="openShop('${shop.name}', ${shop.owner_email}')">View Shop</button>
`;

container.appendChild(div);

});

}

// 🔥 CONNECT
function openShop(name){
localStorage.setItem("currentShop", name);
window.location.href = "products.html";
}

loadShops();