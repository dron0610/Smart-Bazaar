const API = "http://localhost:3000";

// Current product selection (also used by the existing price/visit popups)
let currentProduct = "";
let currentPrice = "";
let currentProductShop = "";
let allShopProducts = [];

async function readResponse(response) {
    const responseText = await response.text();
    let data;

    try {
        data = JSON.parse(responseText);
    } catch (_) {
        data = responseText;
    }

    if (!response.ok) {
        const message = data && typeof data === "object"
            ? (data.message || data.error)
            : data;
        throw new Error(message || "Request failed");
    }

    return data;
}

function getMessage(data) {
    if (typeof data === "string") return data;
    return data?.message || data?.error || "Request successful";
}

function getCustomer() {
    return localStorage.getItem("currentUser") || "";
}

function getHistoryKey() {
    const customer = getCustomer();
    return `smartBazaarProductHistory:${customer || "guest"}`;
}

function getLocalProductHistory() {
    try {
        const history = JSON.parse(localStorage.getItem(getHistoryKey()) || "[]");
        return Array.isArray(history) ? history : [];
    } catch (_) {
        return [];
    }
}

// Save genuine product interactions (opening a product action, booking, cart, etc.)
function trackProduct(product, shop, price, category) {
    if (!product || !shop) return;

    const history = getLocalProductHistory();
    const entry = {
        product: String(product),
        shop: String(shop),
        price: Number(price) || 0,
        category: String(category || ""),
        viewedAt: Date.now()
    };

    const updated = [
        entry,
        ...history.filter(item =>
            !(String(item.product).toLowerCase() === entry.product.toLowerCase() &&
              String(item.shop).toLowerCase() === entry.shop.toLowerCase())
        )
    ].slice(0, 25);

    localStorage.setItem(getHistoryKey(), JSON.stringify(updated));
}

function normalizeRecommendationCategory(value) {
    const text = String(value || "").toLowerCase().trim();
    if (!text || text === "general" || text === "other" || text === "unknown") return "";
    if (/cloth|fashion|apparel|garment|ethnic/.test(text)) return "clothing";
    if (/electronic|mobile|gadget|computer/.test(text)) return "electronics";
    if (/footwear|shoe|sandal/.test(text)) return "footwear";
    if (/fruit|vegetable|produce/.test(text)) return "fruits";
    if (/grocery|kirana|supermarket|daily needs|general store/.test(text)) return "grocery";
    if (/cosmetic|beauty|makeup|skin care/.test(text)) return "cosmetics";
    if (/furniture|interior|wood|decor/.test(text)) return "furniture";
    if (/hardware|tools|construction/.test(text)) return "hardware";
    if (/pharmacy|medical|medicine|health/.test(text)) return "pharmacy";
    if (/restaurant|food|dhaba|cafe|eatery/.test(text)) return "restaurants";
    if (/stationery|book|school|office supplies/.test(text)) return "stationery";
    if (/sweet|bakery|cake|mithai|dessert/.test(text)) return "sweets";
    return "";
}

function getPageCategory() {
    // The product folder is the strongest source of truth: /products/grocery/... etc.
    const match = window.location.pathname.match(/\/products\/([^/]+)\//i);
    if (match) return normalizeRecommendationCategory(match[1]);

    const shop = String(localStorage.getItem("currentShop") || "").toLowerCase();
    const shopRules = [
        ["clothing", /fashion|wear|garment|cloth|threads|outfit|ethnic/],
        ["electronics", /electronic|digital|laptop|mobile|gadget/],
        ["footwear", /shoe|footwear|walk|step/],
        ["fruits", /fruit|green|farm|veggie|fresh produce/],
        ["grocery", /grocery|kirana|mart|basket|family store|daily needs|supermarket/],
        ["cosmetics", /beauty|cosmetic|glow|makeup/],
        ["furniture", /furniture|home decor/],
        ["hardware", /hardware|tools/],
        ["pharmacy", /medical|medico|pharma|health|care/],
        ["restaurants", /restaurant|food|dhaba|bites|tadka/],
        ["stationery", /stationery|book|paper|study/],
        ["sweets", /sweet|bakery|mithai|dessert|cake/]
    ];
    for (const [category, pattern] of shopRules) if (pattern.test(shop)) return category;
    return "";
}

function inferCategory(product) {
    const supplied = normalizeRecommendationCategory(product?.category || product?.shopCategory || product?.type);
    if (supplied) return supplied;

    const name = String(product?.name || "").toLowerCase();
    const rules = [
        ["electronics", /phone|mobile|laptop|computer|tv|television|camera|speaker|headphone|earphone|charger|tablet|keyboard|mouse|watch/],
        ["footwear", /shoe|sneaker|sandal|slipper|boot|heel|footwear/],
        ["clothing", /shirt|t-shirt|jeans|trouser|dress|saree|kurta|lehenga|jacket|blazer|top|skirt|hoodie|cap|blouse|suit/],
        ["cosmetics", /lipstick|foundation|mascara|moisturizer|cream|serum|shampoo|conditioner|perfume|makeup|face wash/],
        ["fruits", /apple|banana|orange|mango|grape|potato|tomato|onion|spinach|vegetable|fruit/],
        ["grocery", /rice|atta|flour|oil|sugar|salt|dal|pulses|biscuit|tea|coffee|milk|bread|cereal|butter|grain|snack|beverage/],
        ["furniture", /sofa|chair|table|bed|wardrobe|cabinet|desk|shelf|furniture/],
        ["hardware", /hammer|drill|screw|nail|pipe|tool|paint|cement|wrench|pliers/],
        ["pharmacy", /tablet|medicine|syrup|capsule|ointment|medical|sanitizer|bandage/],
        ["restaurants", /thali|biryani|pizza|burger|dosa|idli|paneer|paratha|sandwich|meal/],
        ["stationery", /notebook|pen|pencil|book|paper|eraser|marker|file|register/],
        ["sweets", /cake|pastry|sweet|mithai|chocolate|cookie|laddu|gulab jamun|barfi/]
    ];
    for (const [category, pattern] of rules) if (pattern.test(name)) return category;
    return "";
}

function getCardShop(card) {
    return card?.dataset.shop || localStorage.getItem("currentShop") || "";
}

function getCardPrice(card) {
    const raw = card?.dataset.price || card?.querySelector(".product-price")?.textContent || card?.querySelector("p")?.textContent || "0";
    return Number(String(raw).replace(/[^0-9.]/g, "")) || 0;
}

function setCurrentProduct(btn) {
    const card = btn?.closest(".product-card");
    if (!card) return;

    const nameElement = card.querySelector("h3");
    currentProduct = nameElement?.textContent?.trim() || "";
    currentPrice = String(getCardPrice(card));
    currentProductShop = getCardShop(card);

    trackProduct(
        currentProduct,
        currentProductShop,
        currentPrice,
        card.dataset.category || ""
    );
}

function makeStockInfo(stock) {
    if (stock <= 0) return { label: "Out of Stock", className: "stock-out" };
    if (stock <= 5) return { label: "Low Stock", className: "stock-low" };
    return { label: "Available", className: "stock-available" };
}

function createProductCard(product, options = {}) {
    const stock = Number(product.stock ?? 0);
    const stockInfo = makeStockInfo(stock);
    const card = document.createElement("div");
    card.className = "product-card";
    card.dataset.stock = String(stock);
    card.dataset.shop = product.shop || localStorage.getItem("currentShop") || "";
    card.dataset.price = String(Number(product.price) || 0);
    card.dataset.category = inferCategory(product);

    const image = document.createElement("img");
    image.alt = product.name || "Product";
    image.loading = "lazy";
    image.decoding = "async";

    // Keep a product-specific visual fallback when the database image URL is
    // blank, unavailable, or returns an error. This prevents broken-image icons.
    const makeProductImageFallback = (productName) => {
        const safeName = String(productName || "Product")
            .replace(/[&<>"']/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));
        const lower = safeName.toLowerCase();
        const groups = [
            [/cake|pastry|bakery|bread|cookie|biscuit/, "🎂", "BAKERY"],
            [/sweet|mithai|laddu|barfi|gulab|jalebi/, "🍬", "SWEETS"],
            [/food|pizza|burger|sandwich|thali|biryani|tandoori|noodle|pasta|rice|paneer|dosa|idli|snack/, "🍽️", "FOOD"],
            [/fruit|orange|apple|banana|mango|vegetable|tomato|potato|onion/, "🍎", "FRESH PRODUCE"],
            [/book|novel|comic|textbook|story|notebook|pen|pencil|stationery/, "📚", "BOOKS & STATIONERY"],
            [/shirt|jean|dress|shoe|sandal|fashion|jacket|clothing/, "👕", "FASHION"],
            [/phone|iphone|mobile|laptop|computer|tv|speaker|headphone|camera|charger/, "📱", "ELECTRONICS"],
            [/medicine|syrup|tablet|bandage|lotion|oil|monitor|medical/, "🩺", "HEALTH & CARE"]
        ];
        const match = groups.find(([pattern]) => pattern.test(lower));
        const emoji = match ? match[1] : "🛍️";
        const category = match ? match[2] : "SMART BAZAAR";
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="420" viewBox="0 0 640 420"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#eef3f8"/><stop offset="1" stop-color="#dce6ef"/></linearGradient></defs><rect width="640" height="420" rx="24" fill="url(#g)"/><circle cx="320" cy="145" r="82" fill="#ffffff" opacity=".78"/><text x="320" y="180" text-anchor="middle" font-size="100">${emoji}</text><text x="320" y="285" text-anchor="middle" font-family="Arial,sans-serif" font-size="27" font-weight="700" fill="#243447">${safeName.slice(0, 30)}</text><text x="320" y="335" text-anchor="middle" font-family="Arial,sans-serif" font-size="17" letter-spacing="3" fill="#64748b">${category}</text></svg>`;
        return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
    };

    image.onerror = () => {
        if (image.dataset.fallbackApplied === "true") return;
        image.dataset.fallbackApplied = "true";
        image.src = makeProductImageFallback(product.name);
    };
    image.src = product.image && String(product.image).trim()
        ? String(product.image).trim()
        : makeProductImageFallback(product.name);

    const name = document.createElement("h3");
    name.textContent = product.name || "Unnamed Product";

    const price = document.createElement("p");
    price.className = "product-price";
    price.textContent = `₹${product.price}`;

    const stockText = document.createElement("p");
    stockText.className = `stock-status ${stockInfo.className}`;
    stockText.textContent = `Stock: ${stock} — ${stockInfo.label}`;

    const actions = document.createElement("div");
    actions.className = "btns actions";

    const addButton = document.createElement("button");
    addButton.textContent = "🛒 Add to Cart";
    addButton.disabled = stock <= 0;
    addButton.title = stock <= 0 ? "Product is out of stock" : "Add to cart";
    addButton.addEventListener("click", () => addToCart(addButton));

    const bookButton = document.createElement("button");
    bookButton.textContent = "📦 Book Now";
    bookButton.disabled = stock <= 0;
    bookButton.title = stock <= 0 ? "Product is out of stock" : "Book this product";
    bookButton.addEventListener("click", () => bookNow(bookButton));

    const priceButton = document.createElement("button");
    priceButton.textContent = "💰 Get Best Price";
    priceButton.addEventListener("click", () => setProductAndOpenPrice(priceButton));

    const visitButton = document.createElement("button");
    visitButton.textContent = "🏪 Visit Shop";
    visitButton.addEventListener("click", () => setProductAndOpenVisit(visitButton));

    actions.append(addButton, bookButton, priceButton, visitButton);
    card.append(image, name, price, stockText, actions);

    if (options.recommended) {
        const tag = document.createElement("span");
        tag.className = "ai-recommendation-tag";
        tag.textContent = options.reason || "Recommended for you";
        card.insertBefore(tag, card.firstChild);

        const shopLabel = document.createElement("p");
        shopLabel.className = "ai-recommendation-shop";
        shopLabel.textContent = `Shop: ${product.shop || "Local Shop"}`;
        card.insertBefore(shopLabel, actions);
    }

    return card;
}

function attachStaticCardTracking(container) {
    container.querySelectorAll(".product-card").forEach(card => {
        if (card.dataset.trackingAttached === "true") return;
        card.dataset.trackingAttached = "true";
        card.dataset.shop = card.dataset.shop || localStorage.getItem("currentShop") || "";

        const name = card.querySelector("h3")?.textContent?.trim();
        const category = card.dataset.category || "";
        const price = getCardPrice(card);

        // Track a product when the user interacts with its card (not merely when listed).
        card.addEventListener("click", event => {
            if (event.target.closest("button, .info-btn, .popup, a")) return;
            trackProduct(name, getCardShop(card), price, category);
        });
    });
}

function setupFilterButtons() {
    document.querySelectorAll(".filter-btn").forEach(btn => {
        if (btn.dataset.filterAttached === "true") return;
        btn.dataset.filterAttached = "true";
        btn.addEventListener("click", () => {
            document.querySelectorAll(".filter-btn").forEach(button => button.classList.remove("active"));
            btn.classList.add("active");

            const category = String(btn.dataset.category || "all").toLowerCase();
            document.querySelectorAll("#products-container .product-card, .product-grid .product-card").forEach(card => {
                const cardCategory = String(card.dataset.category || "").toLowerCase();
                card.style.display = category === "all" || cardCategory === category ? "" : "none";
            });
        });
    });
}

function addRecommendationStyles() {
    if (document.getElementById("ai-recommendation-styles")) return;
    const style = document.createElement("style");
    style.id = "ai-recommendation-styles";
    style.textContent = `
      .ai-recommendations{max-width:1200px;margin:28px auto;padding:22px;background:#f7f9fc;border-radius:16px}
      .ai-recommendations-header{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:16px}
      .ai-recommendations-header h2{margin:0;color:#172033;font-size:24px}
      .ai-recommendations-header p{margin:5px 0 0;color:#667085;font-size:14px}
      .ai-recommendation-badge{display:inline-block;padding:7px 12px;border-radius:20px;background:#e8f1ff;color:#2457a7;font-size:12px;font-weight:700}
      .ai-recommendations-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:16px}
      .ai-recommendations .product-card{position:relative;background:#fff;border-radius:12px;padding:12px;box-shadow:0 3px 14px rgba(20,35,60,.08);min-width:0}
      .ai-recommendations .product-card img{width:100%;height:165px;object-fit:cover;border-radius:9px}
      .ai-recommendations .product-card h3{margin:10px 0 5px;font-size:17px}
      .ai-recommendations .product-card p{margin:5px 0}
      .ai-recommendations .btns{display:flex;flex-wrap:wrap;gap:6px;margin-top:10px}
      .ai-recommendations .btns button{font-size:12px;padding:8px 9px;cursor:pointer}
      .ai-recommendation-tag{display:inline-block;margin:2px 0 8px;padding:5px 8px;border-radius:6px;background:#eef6ff;color:#2056a5;font-size:11px;font-weight:700}
      .ai-recommendation-shop{font-size:12px;color:#667085}
      .ai-recommendations-empty{color:#667085;font-size:14px}
      @media(max-width:600px){.ai-recommendations{margin:18px 10px;padding:15px}.ai-recommendations-header h2{font-size:20px}}
    `;
    document.head.appendChild(style);
}

function getRecommendationSection(productContainer) {
    let section = document.getElementById("ai-recommendations-section");
    if (section) return section;

    section = document.createElement("section");
    section.id = "ai-recommendations-section";
    section.className = "ai-recommendations";

    const header = document.createElement("div");
    header.className = "ai-recommendations-header";

    const headingWrap = document.createElement("div");
    const heading = document.createElement("h2");
    heading.textContent = " Recommended for You";
    const subtitle = document.createElement("p");
    subtitle.textContent = "Suggestions based on your interests, popular bookings and product similarity.";
    headingWrap.append(heading, subtitle);

    const badge = document.createElement("span");
    badge.className = "ai-recommendation-badge";
    badge.textContent = "SMART PICKS";
    header.append(headingWrap, badge);

    const grid = document.createElement("div");
    grid.id = "ai-recommendations-container";
    grid.className = "ai-recommendations-grid";
    section.append(header, grid);

    productContainer.parentNode.insertBefore(section, productContainer);
    return section;
}

function tokenize(value) {
    const stopWords = new Set(["for", "the", "and", "with", "wear", "fashion", "style", "men", "women", "mens", "womens"]);
    return String(value || "").toLowerCase().replace(/[^a-z0-9\s-]/g, " ")
        .split(/\s+/).filter(word => word.length > 2 && !stopWords.has(word));
}

function scoreRecommendation(product, history, popularity, currentShop, currentCategory) {
    const productTokens = tokenize(product.name);
    let score = Math.min(Number(popularity) || 0, 10) * 0.7;
    let reason = Number(popularity) > 0 ? "Popular in this category" : "Picked for you";

    for (const item of history) {
        const historyTokens = tokenize(item.product);
        const overlap = productTokens.filter(token => historyTokens.includes(token)).length;
        const oldPrice = Number(item.price) || 0;
        const newPrice = Number(product.price) || 0;
        if (overlap > 0) {
            score += Math.min(overlap * 3, 6);
            reason = "Similar to products you viewed";
        }
        if (oldPrice > 0 && newPrice > 0) {
            const difference = Math.abs(newPrice - oldPrice) / oldPrice;
            if (difference <= 0.25) score += 2.5;
            else if (difference <= 0.5) score += 1.2;
        }
    }

    if (String(product.shop).toLowerCase() !== String(currentShop).toLowerCase()) score += 1.5;
    if (history.length && reason === "Picked for you") reason = `Matches your ${currentCategory} interests`;
    return { score, reason };
}

async function loadRecommendations(currentShop) {
    const container = document.querySelector("#products-container, .product-grid");
    if (!container) return;

    const section = getRecommendationSection(container);
    const recommendationsContainer = section.querySelector("#ai-recommendations-container");
    const customer = getCustomer();
    const currentCategory = getPageCategory();

    try {
        if (!currentCategory) throw new Error("Cannot identify this shop's category from its product page URL.");

        const url = new URL(`${API}/ai-recommendations`);
        if (customer) url.searchParams.set("customer", customer);
        url.searchParams.set("shop", currentShop);
        url.searchParams.set("category", currentCategory);

        const response = await fetch(url.toString());
        const result = await readResponse(response);
        const candidates = Array.isArray(result?.products) ? result.products : [];
        const orderHistory = Array.isArray(result?.history) ? result.history : [];
        const popularityMap = new Map();
        candidates.forEach(product => popularityMap.set(`${product.shop}|||${product.name}`, Number(product.popularity) || 0));

        const localHistory = getLocalProductHistory();
        const allHistory = [
            ...localHistory,
            ...orderHistory.map(order => ({
                product: order.product,
                shop: order.shop,
                price: Number(order.price) || 0,
                category: normalizeRecommendationCategory(order.category),
                viewedAt: 0
            }))
        ].filter(item => !item.category || normalizeRecommendationCategory(item.category) === currentCategory).slice(0, 35);

        // Hard safety gate: only products whose DB shop category matches this page's folder.
        // Unknown category products are excluded rather than guessed into the current category.
        const available = candidates.filter(product =>
            Number(product.stock) > 0 &&
            normalizeRecommendationCategory(product.category) === currentCategory
        );

        const crossShop = available.filter(product => String(product.shop || "").trim().toLowerCase() !== String(currentShop || "").trim().toLowerCase());
        const pool = crossShop.length >= 3 ? crossShop : available;
        const ranked = pool.map(product => {
            const popularity = popularityMap.get(`${product.shop}|||${product.name}`) || product.popularity || 0;
            const result = scoreRecommendation(product, allHistory, popularity, currentShop, currentCategory);
            return { product, score: result.score, reason: result.reason };
        }).sort((a, b) => b.score - a.score);

        const selected = ranked.slice(0, 4);
        recommendationsContainer.innerHTML = "";
        if (!selected.length) {
            const empty = document.createElement("p");
            empty.className = "ai-recommendations-empty";
            empty.textContent = `No in-stock ${currentCategory} recommendations are available yet.`;
            recommendationsContainer.appendChild(empty);
            return;
        }
        selected.forEach(item => recommendationsContainer.appendChild(createProductCard(item.product, { recommended: true, reason: item.reason })));
    } catch (error) {
        console.error("AI recommendations error:", error);
        recommendationsContainer.innerHTML = "";
        const note = document.createElement("p");
        note.className = "ai-recommendations-empty";
        note.textContent = error.message || "Recommendations are temporarily unavailable.";
        recommendationsContainer.appendChild(note);
    }
}

async function loadProducts() {
    let shop = localStorage.getItem("currentShop");
    if (!shop) {
        console.warn("No shop selected in localStorage.");
        return;
    }

    // Standardize the one inconsistent page label to the actual shop name.
    if (shop === "Modern Outfits") shop = "Modern Outfit";
    localStorage.setItem("currentShop", shop);

    const title = document.getElementById("shop-title");
    if (title) title.textContent = shop;

    const container = document.querySelector("#products-container, .product-grid");
    if (!container) {
        console.warn("Product grid not found. Expected #products-container or .product-grid.");
        return;
    }

    // Preserve the page's existing HTML product cards as a fallback.
    attachStaticCardTracking(container);
    setupFilterButtons();
    addRecommendationStyles();

    try {
        const response = await fetch(`${API}/products/${encodeURIComponent(shop)}`);
        const products = await readResponse(response);

        if (!Array.isArray(products)) throw new Error("Invalid products response from server");

        if (products.length > 0) {
            allShopProducts = products;
            container.innerHTML = "";
            products.forEach(product => container.appendChild(createProductCard({ ...product, shop })));
            attachStaticCardTracking(container);
        } else {
            console.info("No database products found for this shop; keeping the HTML fallback cards.");
        }
    } catch (error) {
        console.warn("Could not load database products; keeping existing HTML cards.", error);
    }

    setupFilterButtons();
    await loadRecommendations(shop);
}

// Price and visit popups
function setProductAndOpenPrice(btn) {
    setCurrentProduct(btn);
    const popup = document.getElementById("pricePopup");
    if (popup) popup.style.display = "flex";
    else alert("Price popup not found.");
}

function setProductAndOpenVisit(btn) {
    setCurrentProduct(btn);
    const popup = document.getElementById("visitPopup");
    if (popup) popup.style.display = "flex";
    else alert("Visit popup not found.");
}

function closePopup() {
    ["pricePopup", "visitPopup"].forEach(id => {
        const popup = document.getElementById(id);
        if (popup) popup.style.display = "none";
    });
    document.querySelectorAll(".popup").forEach(popup => {
        if (popup.id !== "pricePopup" && popup.id !== "visitPopup") popup.style.display = "none";
    });
}

function openPricePopup() {
    const popup = document.getElementById("pricePopup");
    if (!popup) return alert("Price popup missing.");
    popup.style.display = "flex";
}

function openVisitPopup() {
    const popup = document.getElementById("visitPopup");
    if (!popup) return alert("Visit popup missing.");
    popup.style.display = "flex";
}

async function submitPrice() {
    const userPrice = document.getElementById("userPrice")?.value;
    const shop = currentProductShop || localStorage.getItem("currentShop");
    const customer = getCustomer();

    if (!currentProduct || !shop || !customer) return alert("Please log in and select a product first.");
    if (userPrice === "" || userPrice == null || !Number.isFinite(Number(userPrice)) || Number(userPrice) <= 0) {
        return alert("Please enter a valid price.");
    }

    try {
        const response = await fetch(`${API}/add-order`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ type: "price", product: currentProduct, price: userPrice, shop, customer })
        });
        alert(getMessage(await readResponse(response)));
        closePopup();
    } catch (error) {
        alert("Could not submit price request: " + error.message);
        console.error(error);
    }
}

async function bookNow(btn) {
    const card = btn?.closest(".product-card");
    if (!card) return;
    setCurrentProduct(btn);

    const stock = Number(card.dataset.stock ?? 0);
    if (stock <= 0) return alert("Sorry, this product is out of stock.");

    const shop = getCardShop(card);
    const customer = getCustomer();
    if (!shop || !customer) return alert("Please log in and select a shop first.");

    try {
        btn.disabled = true;
        const response = await fetch(`${API}/add-order`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ type: "booking", product: currentProduct, price: currentPrice, shop, customer })
        });
        alert(getMessage(await readResponse(response)));
    } catch (error) {
        alert("Could not create booking: " + error.message);
        console.error(error);
    } finally {
        btn.disabled = false;
    }
}

async function confirmVisit() {
    const shop = currentProductShop || localStorage.getItem("currentShop");
    const customer = getCustomer();
    if (!currentProduct || !shop || !customer) return alert("Please log in and select a product first.");

    try {
        const response = await fetch(`${API}/add-order`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ type: "visit", product: currentProduct, price: "-", shop, customer })
        });
        alert(getMessage(await readResponse(response)));
        closePopup();
    } catch (error) {
        alert("Could not submit visit request: " + error.message);
        console.error(error);
    }
}

async function addToCart(btn) {
    const card = btn?.closest(".product-card");
    if (!card) return;
    setCurrentProduct(btn);

    if (Number(card.dataset.stock ?? 0) <= 0) return alert("Sorry, this product is out of stock.");

    const shop = getCardShop(card);
    const customer = getCustomer();
    if (!shop || !customer) return alert("Please log in and select a shop first.");

    const image = card.querySelector("img")?.src || "";
    try {
        btn.disabled = true;
        const response = await fetch(`${API}/add-cart`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ product: currentProduct, price: `₹${currentPrice}`, image, shop, customer })
        });
        alert(getMessage(await readResponse(response)));
    } catch (error) {
        alert("Could not add to cart: " + error.message);
        console.error(error);
    } finally {
        btn.disabled = false;
    }
}

// Existing product info popups
function setupInfoAndPopupButtons() {
    document.querySelectorAll(".info-btn").forEach(btn => {
        if (btn.dataset.infoAttached === "true") return;
        btn.dataset.infoAttached = "true";
        btn.addEventListener("click", () => {
            const popup = btn.closest(".product-card")?.querySelector(".popup");
            if (popup) popup.style.display = "flex";
        });
    });

    document.querySelectorAll(".close-btn").forEach(btn => {
        if (btn.dataset.closeAttached === "true") return;
        btn.dataset.closeAttached = "true";
        btn.addEventListener("click", () => {
            const popup = btn.closest(".popup");
            if (popup) popup.style.display = "none";
        });
    });
}

window.addEventListener("click", event => {
    document.querySelectorAll(".popup").forEach(popup => {
        if (event.target === popup) popup.style.display = "none";
    });
});

document.addEventListener("DOMContentLoaded", () => {
    setupInfoAndPopupButtons();
    loadProducts();
});
