// 🔐 DUMMY USERS (you can change later)
let users = [
{username: "admin", password: "1234", role: "admin"},
{username: "shop1", password: "1234", role: "shop"},
{username: "customer1", password: "1234", role: "customer"}
];

function loginUser(){

let username = document.getElementById("username").value;
let password = document.getElementById("password").value;
let role = document.getElementById("role").value;

// VALIDATION
if(username === "" || password === ""){
alert("Enter all fields");
return;
}

// CHECK USER
let foundUser = users.find(user => 
user.username === username &&
user.password === password &&
user.role === role
);

if(!foundUser){
alert("Invalid credentials");
return;
}

// SAVE LOGIN
localStorage.setItem("currentUser", username);
localStorage.setItem("currentRole", role);

// 🔥 REDIRECT
if(role === "shop"){
localStorage.setItem("currentShop", username);
window.location.href = "shop-dashboard.html";
}
else if(role === "admin"){
window.location.href = "dashboard.html";
}
else{
window.location.href = "index.html";
}

}