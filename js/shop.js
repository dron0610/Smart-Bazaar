// =======================
// 🏪 SHOP NAME + EMAIL
// =======================
let currentShop = localStorage.getItem("currentShop") || "Raj Electronics";

// 🔥 FIXED LINE (MOST IMPORTANT)
let ownerEmail = localStorage.getItem("ownerEmail");

let title = document.getElementById("shopName");
if(title){
    title.innerText = "Dashboard - " + currentShop;
}

// =======================
// 🔁 SECTION SWITCH
// =======================
function showSection(id){
    document.querySelectorAll(".section").forEach(sec=>{
        sec.style.display = "none";
    });
    document.getElementById(id).style.display = "block";
}

// =======================
// 📦 LOAD ORDERS (FIXED)
// =======================
function loadOrders(){

    if(!ownerEmail){
        console.log("❌ Owner email missing");
        return;
    }

    console.log("Fetching orders for:", ownerEmail);

    fetch(`http://localhost:3000/owner-orders/${ownerEmail}`)
    .then(res => res.json())
    .then(data => {

        let priceDiv = document.getElementById("priceRequests");
        let bookDiv = document.getElementById("bookOrders");
        let visitDiv = document.getElementById("visitRequests");
        let acceptedDiv = document.getElementById("acceptedList");

        priceDiv.innerHTML = "";
        bookDiv.innerHTML = "";
        visitDiv.innerHTML = "";
        acceptedDiv.innerHTML = "";

        if(data.length === 0){
            bookDiv.innerHTML = "<h3>No Orders Yet</h3>";
            return;
        }

        data.forEach(order => {

            let color = "black";
            if(order.status === "Accepted") color = "green";
            if(order.status === "Rejected") color = "red";

            let buttons = `
            <div class="actions">
                <button onclick="updateStatus(${order.id}, 'Accepted')">✅ Accept</button>
                <button onclick="updateStatus(${order.id}, 'Rejected')">❌ Reject</button>
            </div>
            `;

            // 💰 PRICE
            if(order.type === "price"){
                priceDiv.innerHTML += `
                <div class="order-card">
                    <h3>${order.product}</h3>
                    <p>👤 ${order.customer}</p>
                    <p>💰 ₹${order.price}</p>
                    <p style="color:${color}">Status: ${order.status}</p>
                    ${buttons}
                </div>
                `;
            }

            // 📦 BOOKING
            if(order.type === "booking"){
                bookDiv.innerHTML += `
                <div class="order-card">
                    <h3>${order.product}</h3>
                    <p>👤 ${order.customer}</p>
                    <p>💰 ${order.price}</p>
                    <p style="color:${color}">Status: ${order.status}</p>
                    <p>🕒 ${new Date(order.created_at).toLocaleString()}</p>
                    ${buttons}
                </div>
                `;
            }

            // 🏪 VISIT
            if(order.type === "visit"){
                visitDiv.innerHTML += `
                <div class="order-card">
                    <h3>${order.product}</h3>
                    <p>👤 ${order.customer}</p>
                    <p style="color:${color}">Status: ${order.status}</p>
                    ${buttons}
                </div>
                `;
            }

            // ✅ ACCEPTED
            if(order.status === "Accepted"){
                acceptedDiv.innerHTML += `
                <div class="order-card">
                    <h3>${order.product}</h3>
                    <p>👤 ${order.customer}</p>
                    <p style="color:green;">Accepted ✅</p>
                </div>
                `;
            }

        });

    })
    .catch(err => console.log("Fetch Error:", err));

}

// =======================
// 🔄 UPDATE STATUS
// =======================
function updateStatus(id, status){

fetch("http://localhost:3000/update-order", {
    method: "POST",
    headers: {
        "Content-Type": "application/json"
    },
    body: JSON.stringify({ id, status })
})
.then(res => res.text())
.then(msg => {
    alert(msg);
    loadOrders();
})
.catch(err => console.log(err));

}


// =======================
// 🚀 INIT
// =======================
showSection("orders");
loadOrders();

// 🔄 AUTO REFRESH
setInterval(loadOrders, 3000);