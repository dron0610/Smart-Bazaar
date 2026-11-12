function loginUser(){

let email = document.getElementById("email").value;
let password = document.getElementById("password").value;
let role = document.getElementById("role").value;

// validation
if(!email || !password){
    alert("Fill all fields ❌");
    return;
}

fetch("http://localhost:3000/login", {
    method:"POST",
    headers:{
        "Content-Type":"application/json"
    },
    body: JSON.stringify({ email, password })
})
.then(res=>res.json())
.then(data=>{

    if(data.success){

        // 🔥 SAVE USER DATA
        localStorage.setItem("currentUser", data.user.name);
        localStorage.setItem("currentUserEmail", data.user.email);
        localStorage.setItem("userRole", data.user.role);

        // ❌ पहले role check करो
        if(data.user.role !== role){
            alert("Wrong role selected ❌");
            return;
        }

        // 🔥 SHOP USER FIX
        if(data.user.role === "shop"){

            // 👉 IMPORTANT: shop name same होना चाहिए DB से
            // अगर name mismatch है तो manually fix करना होगा

            localStorage.setItem("currentShop", data.user.name);

            console.log("Shop Login:", data.user.name);
        }

        alert("Login Success ✅");

        // 🔥 REDIRECT
        if(role === "admin"){
            window.location.href = "admin-dashboard.html";
        }
        else if(role === "shop"){
            window.location.href = "shop-dashboard.html";
        }
        else{
            window.location.href = "index.html";
        }

    } else {
        alert("Invalid Credentials ❌");
    }

})
.catch(err => console.log(err));

}