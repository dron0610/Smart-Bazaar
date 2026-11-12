// 🔁 SWITCH
function showSection(id){
    document.querySelectorAll(".section").forEach(sec=>{
        sec.style.display = "none";
    });
    document.getElementById(id).style.display = "block";
}

// 🔥 GET DATA EVERY TIME (IMPORTANT FIX)
function getShops(){
    return JSON.parse(localStorage.getItem("shops")) || [];
}

// 🟢 CHECK OPEN
function isOpen(shop){
    let now = new Date().toTimeString().slice(0,5);
    return now >= shop.open && now <= shop.close;
}

// 🔥 LOAD DATA
function loadData(){

    let shops = getShops();   // 🔥 FIX

    document.getElementById("totalShops").innerText = shops.length;

    let openCount = 0;

    // CLEAR
    document.querySelectorAll(".shop-grid").forEach(div=>{
        div.innerHTML = "";
    });

    shops.forEach((shop, index) => {

        if(isOpen(shop)){
            openCount++;
        }

        let card = document.createElement("div");
        card.className = "shop-card";

        card.innerHTML = `
        <img src="${shop.image}">
        <h4>${shop.name}</h4>
        <p>Category: ${shop.category}</p>
        <p>⏰ ${shop.open} - ${shop.close}</p>

        <button onclick="openShop('${shop.name}', ${shop.owner_email}')">View Shop</button>
        `;

        // 🔥 SAFE CATEGORY APPEND (IMPORTANT FIX)
        let categoryDiv = document.getElementById(shop.category);
        if(categoryDiv){
            categoryDiv.appendChild(card);
        }
    });

    document.getElementById("openShops").innerText = openCount;
}

// 🔥 ADD SHOP
function addShop(){

    let name = document.getElementById("shopNameInput").value.trim();
    let image = document.getElementById("shopImageInput").value.trim();
    let category = document.getElementById("category").value;
    let open = document.getElementById("openTime").value;
    let close = document.getElementById("closeTime").value;

    if(!name || !image || !category || !open || !close){
        alert("Fill all fields");
        return;
    }

    let shops = getShops();   // 🔥 FIX

    shops.push({
        name,
        image,
        category,
        open,
        close
    });

    localStorage.setItem("shops", JSON.stringify(shops));

    // CLEAR INPUTS
    document.getElementById("shopNameInput").value = "";
    document.getElementById("shopImageInput").value = "";

    loadData();
}

// 🔥 OPEN SHOP (CONNECTION)
function openShop(name){
    localStorage.setItem("currentShop", name);
    window.location.href = "products.html";
}

// 🚀 INIT
loadData();
setInterval(loadData, 2000);



fetch("http://localhost:3000/add-shop", {
    method: "POST",
    headers: {
        "Content-Type": "application/json"
    },
    body: JSON.stringify({
        name: name,
        image: image,
        category: category,
        open: open,
        close: close
    })
})
.then(res => res.text())
.then(data => alert(data));