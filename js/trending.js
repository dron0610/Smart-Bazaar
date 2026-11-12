let buttons = document.querySelectorAll(".filter-btn");
let cards = document.querySelectorAll(".product-card");

buttons.forEach(btn => {
btn.addEventListener("click", () => {

document.querySelector(".filter-btn.active").classList.remove("active");
btn.classList.add("active");

let filter = btn.getAttribute("data-filter");

cards.forEach(card => {
if(filter === "all" || card.getAttribute("data-category") === filter){
card.style.display = "block";
} else {
card.style.display = "none";
}
});

});
});