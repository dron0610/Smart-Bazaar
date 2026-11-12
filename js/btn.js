document.querySelectorAll(".category-btn").forEach(btn => {

    btn.addEventListener("click", function(){

        let category = this.getAttribute("data-category").toLowerCase();

        // 🔥 mapping correct file names
        let pages = {
            electronics: "shops/electronics-shops.html",
            clothing: "shops/clothing-shops.html",
            grocery: "shops/grocery-shops.html",
            fruits: "shops/fruits-shops.html",
            pharmacy: "shops/pharmacy-shops.html",
            sweets: "shops/sweets-shops.html",
            footwear: "shops/footwear-shops.html",
            cosmetics: "shops/cosmetics-shops.html",
            stationery: "shops/stationery-shops.html",
            hardware: "shops/hardware-shops.html",
            furniture: "shops/furniture-shops.html",
            restaurants: "shops/restaurants-shops.html"
        };

        // 🚀 redirect
        if(pages[category]){
            window.location.href = pages[category];
        } else {
            alert("Page not found for " + category);
        }

    });

});