let user = localStorage.getItem("currentUser");

function loadSlots(){

fetch("http://localhost:3000/parking-slots")
.then(res => res.json())
.then(data => {

    document.querySelectorAll(".slot").forEach(box => {

        let slotName = box.dataset.slot;

        let found = data.find(s => s.slot_name === slotName);

        if(found){

            let now = new Date();
            let end = new Date(found.end_time);

            let diff = end - now;

            if(diff <= 0){
                box.innerHTML = slotName + "<br>🟢 Available";
                return;
            }

            let mins = Math.floor(diff / 60000);
            let hrs = Math.floor(mins / 60);
            mins = mins % 60;

            box.innerHTML = `
            ${slotName}<br>
            🔴 Booked<br>
            ⏳ ${hrs}h ${mins}m
            `;
            box.style.background = "#ffb3b3";

        }else{
            box.innerHTML = slotName + "<br>🟢 Available";
        }

    });

});
}

function bookSlot(slot){

fetch("http://localhost:3000/book-slot", {
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body: JSON.stringify({
        slot: slot,
        customer: user
    })
})
.then(res => res.text())
.then(msg => {
    alert(msg);
    loadSlots();
});

}
setInterval(loadSlots, 60000); // हर 1 मिनट
loadSlots();