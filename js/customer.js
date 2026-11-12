// =======================
// 🔥 CUSTOMER DASHBOARD
// =======================
document.addEventListener("DOMContentLoaded", function(){

// =======================
// 👤 CURRENT USER
// =======================
let customer =
localStorage.getItem("userName") ||
localStorage.getItem("currentUser") ||
"Guest";

console.log("CURRENT CUSTOMER:", customer);

// =======================
// 👤 SHOW NAME
// =======================
let nameEl = document.getElementById("customerName");

if(nameEl){
    nameEl.innerText = "👤 " + customer;
}

// =======================
// 🔁 SECTION SWITCH
// =======================
window.showSection = function(id){

    document.querySelectorAll(".section").forEach(sec=>{
        sec.style.display = "none";
    });

    let target = document.getElementById(id);

    if(target){
        target.style.display = "block";
    }
};

// =======================
// 📦 LOAD DASHBOARD
// =======================
function loadDashboard(){

fetch(`http://localhost:3000/customer-orders?customer=${customer}`)
.then(res => res.json())
.then(data => {

console.log("CUSTOMER ORDERS:", data);

let orderDiv = document.getElementById("orderList");
let bargainDiv = document.getElementById("bargainList");
let visitDiv = document.getElementById("visitList");

// SAFETY
if(!orderDiv || !bargainDiv || !visitDiv){
    console.log("Dashboard elements missing ❌");
    return;
}

// CLEAR
orderDiv.innerHTML = "";
bargainDiv.innerHTML = "";
visitDiv.innerHTML = "";

// EMPTY
if(data.length === 0){

    orderDiv.innerHTML = `
    <h3 style="margin-top:20px;">
    No Orders Yet ❌
    </h3>
    `;

    return;
}

// =======================
// 🔁 LOOP
// =======================
data.forEach(item => {

let status = item.status || "Pending";

let color = "black";

if(status === "Accepted"){
    color = "green";
}

if(status === "Rejected"){
    color = "red";
}

// =======================
// 📦 CARD
// =======================
let card = `
<div class="order-card">

<h3>${item.product || "Product"}</h3>

<p>🏪 Shop: ${item.shop || "-"}</p>

<p>💰 Price: ₹${item.price || 0}</p>

<p style="color:${color}; font-weight:bold;">
Status: ${status}
</p>

${
item.created_at
? `<p>🕒 ${new Date(item.created_at).toLocaleString()}</p>`
: ""
}

${
status === "Accepted" &&
(!item.rating || item.rating == 0)
?
`
<button onclick="rateOrder(${item.id})">
⭐ Rate
</button>
`
: ""
}

${
item.rating > 0
?
`
<p>⭐ ${item.rating}/5</p>
<p>${item.review || ""}</p>
`
: ""
}

</div>
`;

// =======================
// 📦 BOOKINGS
// =======================
if(item.type === "booking"){
    orderDiv.innerHTML += card;
}

// =======================
// 💰 BARGAIN
// =======================
else if(item.type === "price"){
    bargainDiv.innerHTML += card;
}

// =======================
// 🏪 VISIT
// =======================
else if(item.type === "visit"){
    visitDiv.innerHTML += card;
}

});

})
.catch(err=>{
console.log("Dashboard Error:", err);
});

// =======================
// 💳 WALLET
// =======================
let wallet = parseInt(localStorage.getItem("wallet")) || 0;

let walletText = document.getElementById("walletBalance");

if(walletText){
    walletText.innerText = "Balance: ₹" + wallet;
}

}

// =======================
// ⭐ RATE ORDER
// =======================
window.rateOrder = function(id){

let rating = prompt("Enter rating (1-5)");

if(!rating) return;

let review = prompt("Write review");

fetch("http://localhost:3000/add-rating",{

method: "POST",

headers:{
"Content-Type":"application/json"
},

body: JSON.stringify({
id,
rating,
review
})

})
.then(res => res.text())
.then(msg => {

alert(msg);

loadDashboard();

})
.catch(err=>{
console.log(err);
});

};

// =======================
// 🚀 INIT
// =======================
showSection("orders");

loadDashboard();

// 🔄 AUTO REFRESH
setInterval(loadDashboard, 3000);

});