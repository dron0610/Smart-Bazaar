function registerUser(){

let name = document.getElementById("name").value;
let email = document.getElementById("email").value;
let password = document.getElementById("password").value;

fetch("http://localhost:3000/register", {
    method:"POST",
    headers:{
        "Content-Type":"application/json"
    },
    body: JSON.stringify({ name, email, password })
})
.then(res=>res.text())
.then(msg=>{
    alert(msg);
});
}