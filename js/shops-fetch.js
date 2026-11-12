document.addEventListener("DOMContentLoaded", function(){

    function loadShops(){

        let category = localStorage.getItem("selectedCategory");

        let title = document.getElementById("category-title");
        let container = document.getElementById("shop-list");

        if(!title || !container){
            console.log("HTML elements missing ❌");
            return;
        }

        title.innerText = category ? category.toUpperCase() + " Shops" : "Shops";

        fetch("http://localhost:3000/shops")
        .then(res => res.json())
        .then(data => {

            let filtered = data.filter(shop =>
                shop.category.toLowerCase() === category.toLowerCase()
            );

            if(filtered.length === 0){
                container.innerHTML = "<h2>No shops found ❌</h2>";
                return;
            }

            filtered.forEach(shop => {
            container.innerHTML += `
    <div class="shop-card" onclick="openShop('${shop.name}')">
        <h3>${shop.name}</h3>
        <p>${shop.open_time} - ${shop.close_time}</p>
    </div>
`;
            });

        })
        .catch(err => console.log(err));
    }
    // category-shops.js

function openShop(name,email){
    localStorage.setItem("currentShop", name);
    localStorage.setItem("ownerEmail", email);
    window.location.href = "products.html";
}

    loadShops();
});