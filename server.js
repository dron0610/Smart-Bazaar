
const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

// =======================
// MYSQL CONNECTION
// =======================
const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "root",
    database: "smart_bazaar"
});

db.connect(err => {
    if (err) {
        console.log("DB Error:", err);
    } else {
        console.log("MySQL Connected ✅");
    }
});

// =======================
// TEST
// =======================
app.get("/", (req, res) => {
    res.send("Server working 🚀");
});

// =======================
// SHOPS
// =======================
app.post("/add-shop", (req, res) => {
    const { name, image, category, open, close } = req.body;

    if (!name || !category) {
        return res.status(400).send("Shop name and category required");
    }

    const sql = `
        INSERT INTO shops (name, image, category, open_time, close_time)
        VALUES (?, ?, ?, ?, ?)
    `;

    db.query(sql, [name, image, category, open, close], err => {
        if (err) {
            console.log(err);
            return res.status(500).send("Error adding shop ❌");
        }

        res.send("Shop Added ✅");
    });
});

app.get("/shops", (req, res) => {
    const category = req.query.category;

    let sql = "SELECT * FROM shops";
    const params = [];

    if (category) {
        sql += " WHERE LOWER(category)=LOWER(?)";
        params.push(category);
    }

    db.query(sql, params, (err, result) => {
        if (err) {
            console.log(err);
            return res.status(500).json({ message: "Unable to fetch shops" });
        }

        res.json(result);
    });
});

// =======================
// PRODUCTS
// =======================

// Get products for a shop, including stock
app.get("/products/:shop", (req, res) => {
    const shop = req.params.shop;

    db.query(
        "SELECT * FROM products WHERE shop=?",
        [shop],
        (err, result) => {
            if (err) {
                console.log(err);
                return res.status(500).json({ message: "Unable to fetch products" });
            }

            res.json(result);
        }
    );
});

// Add product with initial stock
app.post("/add-product", (req, res) => {
    const { name, price, image, shop, stock } = req.body;

    const quantity = Number(stock);

    if (
        !name ||
        price == null ||
        !Number.isFinite(Number(price)) ||
        Number(price) < 0 ||
        !shop ||
        stock === undefined ||
        stock === null ||
        stock === "" ||
        !Number.isSafeInteger(quantity) ||
        quantity < 0
    ) {
        return res.status(400).json({
            success: false,
            message: "Enter valid product details and stock quantity"
        });
    }

    const sql = `
        INSERT INTO products (name, price, image, shop, stock)
        VALUES (?, ?, ?, ?, ?)
    `;

    db.query(
        sql,
        [name, Number(price), image || "", shop, quantity],
        (err, result) => {
            if (err) {
                console.log(err);
                return res.status(500).json({
                    success: false,
                    message: "Product could not be added. Check the products table."
                });
            }

            res.status(201).json({
                success: true,
                message: "Product Added ✅",
                productId: result.insertId
            });
        }
    );
});

// Update existing product stock
app.post("/update-stock", (req, res) => {
    const { id, stock } = req.body;
    const productId = Number(id);
    const quantity = Number(stock);

    if (
        !Number.isSafeInteger(productId) ||
        productId <= 0 ||
        stock === undefined ||
        stock === null ||
        stock === "" ||
        !Number.isSafeInteger(quantity) ||
        quantity < 0
    ) {
        return res.status(400).json({
            success: false,
            message: "Invalid product ID or stock quantity"
        });
    }

    db.query(
        "UPDATE products SET stock=? WHERE id=?",
        [quantity, productId],
        (err, result) => {
            if (err) {
                console.log(err);
                return res.status(500).json({
                    success: false,
                    message: "Stock update failed"
                });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    success: false,
                    message: "Product not found"
                });
            }

            res.json({
                success: true,
                message: "Stock updated successfully ✅",
                stock: quantity
            });
        }
    );
});

// =======================
// ORDERS
// =======================
app.post("/add-order", (req, res) => {
    const { product, price, shop, customer, type } = req.body;

    if (!product || !shop || !customer || !type) {
        return res.status(400).json({
            success: false,
            message: "Product, shop, customer and request type are required"
        });
    }

    const sql = `
        INSERT INTO orders
        (product, price, shop, customer, type, status)
        VALUES (?, ?, ?, ?, ?, 'Pending')
    `;

    db.query(sql, [product, price, shop, customer, type], (err, result) => {
        if (err) {
            console.log("ADD ORDER ERROR:", err);
            return res.status(500).json({
                success: false,
                message: "Order request could not be saved"
            });
        }

        console.log("ORDER SAVED ✅", result.insertId);

        res.status(201).json({
            success: true,
            message: "Order placed ✅",
            orderId: result.insertId
        });
    });
});

// Shop owner orders
app.get("/owner-orders/:shop", (req, res) => {
    const shop = req.params.shop;

    db.query(
        "SELECT * FROM orders WHERE shop=? ORDER BY id DESC",
        [shop],
        (err, result) => {
            if (err) {
                console.log(err);
                return res.status(500).json({ message: "Unable to fetch orders" });
            }

            res.json(result);
        }
    );
});

// Customer orders
app.get("/customer-orders", (req, res) => {
    const customer = req.query.customer;

    if (!customer) {
        return res.status(400).json({ message: "Customer is required" });
    }

    db.query(
        "SELECT * FROM orders WHERE customer=? ORDER BY id DESC",
        [customer],
        (err, result) => {
            if (err) {
                console.log(err);
                return res.status(500).json({ message: "Unable to fetch orders" });
            }

            res.json(result);
        }
    );
});

// =======================
// UPDATE ORDER STATUS + STOCK
// =======================
app.post("/update-order", (req, res) => {
    const { id, status } = req.body;
    const orderId = Number(id);

    const allowedStatuses = [
        "Pending",
        "Accepted",
        "Rejected",
        "Completed"
    ];

    if (
        !Number.isSafeInteger(orderId) ||
        orderId <= 0 ||
        !allowedStatuses.includes(status)
    ) {
        return res.status(400).json({
            success: false,
            message: "Invalid order ID or status"
        });
    }

    db.beginTransaction(err => {
        if (err) {
            console.log(err);
            return res.status(500).json({
                success: false,
                message: "Could not start transaction"
            });
        }

        db.query(
            "SELECT * FROM orders WHERE id=? FOR UPDATE",
            [orderId],
            (err, rows) => {
                if (err || rows.length === 0) {
                    return db.rollback(() => {
                        res.status(err ? 500 : 404).json({
                            success: false,
                            message: err
                                ? "Unable to retrieve order"
                                : "Order not found"
                        });
                    });
                }

                const order = rows[0];

                // Do not allow a processed order to be accepted/rejected again.
                if (
                    order.status !== "Pending" &&
                    status !== order.status
                ) {
                    return db.rollback(() => {
                        res.status(409).json({
                            success: false,
                            message: "This order has already been processed"
                        });
                    });
                }

                function saveOrderStatus() {
                    db.query(
                        "UPDATE orders SET status=? WHERE id=?",
                        [status, orderId],
                        updateErr => {
                            if (updateErr) {
                                console.log(updateErr);

                                return db.rollback(() => {
                                    res.status(500).json({
                                        success: false,
                                        message: "Order status update failed"
                                    });
                                });
                            }

                            db.commit(commitErr => {
                                if (commitErr) {
                                    return db.rollback(() => {
                                        res.status(500).json({
                                            success: false,
                                            message: "Could not save order changes"
                                        });
                                    });
                                }

                                res.json({
                                    success: true,
                                    message: "Order status updated ✅"
                                });
                            });
                        }
                    );
                }

                // Only booking orders reduce product stock.
                // Price and visit requests do not reduce stock.
                if (
                    status === "Accepted" &&
                    order.status === "Pending" &&
                    order.type === "booking"
                ) {
                    db.query(
                        `UPDATE products
                         SET stock = stock - 1
                         WHERE name = ? AND shop = ? AND stock > 0`,
                        [order.product, order.shop],
                        (stockErr, stockResult) => {
                            if (stockErr) {
                                console.log(stockErr);

                                return db.rollback(() => {
                                    res.status(500).json({
                                        success: false,
                                        message: "Stock update failed"
                                    });
                                });
                            }

                            if (stockResult.affectedRows === 0) {
                                return db.rollback(() => {
                                    res.status(409).json({
                                        success: false,
                                        message: "Product is out of stock ❌"
                                    });
                                });
                            }

                            saveOrderStatus();
                        }
                    );
                } else {
                    saveOrderStatus();
                }
            }
        );
    });
});

// =======================
// RATINGS
// =======================
app.post("/add-rating", (req, res) => {
    const { id, rating, review } = req.body;

    db.query(
        "UPDATE orders SET rating=?, review=? WHERE id=?",
        [rating, review, id],
        err => {
            if (err) {
                console.log(err);
                return res.status(500).send("Error ❌");
            }

            res.send("Rating Submitted ⭐");
        }
    );
});

// =======================
// LOGIN
// =======================
app.post("/login", (req, res) => {
    const { email, password } = req.body;

    db.query(
        "SELECT * FROM users WHERE email=? AND password=?",
        [email, password],
        (err, result) => {
            if (err) {
                console.log(err);
                return res.status(500).json({ success: false });
            }

            if (result.length > 0) {
                res.json({
                    success: true,
                    user: result[0]
                });
            } else {
                res.json({ success: false });
            }
        }
    );
});

// =======================
// REGISTER
// =======================
app.post("/register", (req, res) => {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({
            success: false,
            message: "Name, email and password are required"
        });
    }

    db.query(
        "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
        [name, email, password, role || "customer"],
        err => {
            if (err) {
                console.log(err);
                return res.status(400).send("User already exists ❌");
            }

            res.status(201).send("Registered Successfully ✅");
        }
    );
});

// =======================
// CART
// =======================
app.post("/add-cart", (req, res) => {
    const { product, price, shop, image, customer } = req.body;

    db.query(
        `INSERT INTO cart (product, price, shop, image, customer)
         VALUES (?, ?, ?, ?, ?)`,
        [product, price, shop, image, customer],
        err => {
            if (err) {
                console.log(err);
                return res.status(500).send("Error ❌");
            }

            res.send("Added to Cart 🛒");
        }
    );
});

app.get("/cart", (req, res) => {
    const customer = req.query.customer;

    db.query(
        "SELECT * FROM cart WHERE customer=? ORDER BY id DESC",
        [customer],
        (err, result) => {
            if (err) {
                console.log(err);
                return res.status(500).json({ message: "Unable to fetch cart" });
            }

            res.json(result);
        }
    );
});

app.post("/remove-cart", (req, res) => {
    const { id } = req.body;

    db.query(
        "DELETE FROM cart WHERE id=?",
        [id],
        err => {
            if (err) {
                console.log(err);
                return res.status(500).send("Error ❌");
            }

            res.send("Removed ✅");
        }
    );
});

// =======================
// PARKING
// =======================
app.post("/book-slot", (req, res) => {
    const { slot, customer } = req.body;

    if (!slot || !customer) {
        return res.status(400).send("Slot and customer are required");
    }

    db.query(
        `SELECT * FROM parking_slots
         WHERE customer=? AND end_time > NOW()`,
        [customer],
        (err, userResult) => {
            if (err) {
                console.log(err);
                return res.status(500).send("DB Error ❌");
            }

            if (userResult.length > 0) {
                return res.status(409).send("Already booked ❌");
            }

            db.query(
                `SELECT * FROM parking_slots
                 WHERE slot_name=? AND end_time > NOW()`,
                [slot],
                (err, slotResult) => {
                    if (err) {
                        console.log(err);
                        return res.status(500).send("DB Error ❌");
                    }

                    if (slotResult.length > 0) {
                        return res.status(409).send("Slot occupied ❌");
                    }

                    db.query(
                        `INSERT INTO parking_slots
                         (slot_name, customer, start_time, end_time)
                         VALUES (?, ?, NOW(), DATE_ADD(NOW(), INTERVAL 3 HOUR))`,
                        [slot, customer],
                        err => {
                            if (err) {
                                console.log(err);
                                return res.status(500).send("Booking failed ❌");
                            }

                            res.send("Slot booked ✅");
                        }
                    );
                }
            );
        }
    );
});

app.get("/parking-slots", (req, res) => {
    db.query(
        "SELECT * FROM parking_slots",
        (err, result) => {
            if (err) {
                console.log(err);
                return res.status(500).json({ message: "Unable to fetch parking slots" });
            }

            res.json(result);
        }
    );
});

// =======================
// ADMIN STATS
// =======================
app.get("/shop-stats", (req, res) => {
    db.query(
        "SELECT COUNT(*) AS total FROM shops",
        (err, result) => {
            if (err) {
                console.log(err);
                return res.status(500).json({ total: 0, open: 0 });
            }

            res.json({
                total: result[0].total,
                open: result[0].total
            });
        }
    );
});


// =======================
// AI PRODUCT RECOMMENDATIONS (STRICT CATEGORY FILTER)
// =======================

// Normalize category labels from the shops table and URL.
function normalizeText(value) {
    return String(value || "")
        .toLowerCase()
        .trim()
        .replace(/&/g, "and")
        .replace(/[^a-z0-9]+/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

const recommendationCategoryAliases = {
    clothing: [
        "clothing", "clothes", "fashion", "clothing and fashion",
        "apparel", "garments", "wear"
    ],
    electronics: ["electronics", "electronic", "electrical", "gadgets"],
    footwear: ["footwear", "shoes", "shoe", "s footwear"],
    fruits: [
        "fruits", "fruit", "vegetables", "vegetable",
        "fruits and vegetables", "produce"
    ],
    grocery: [
        "grocery", "groceries", "grocery and kirana", "kirana",
        "general store", "supermarket", "daily needs"
    ],
    cosmetics: ["cosmetics", "cosmetic", "beauty", "cosmetics and beauty"],
    furniture: ["furniture", "home and furniture", "home decor", "furnishing"],
    hardware: ["hardware", "tools", "building materials"],
    pharmacy: ["pharmacy", "medical", "medicine", "chemist"],
    restaurants: ["restaurants", "restaurant", "food", "cafe"],
    stationery: ["stationery", "books", "book store", "office supplies"],
    sweets: ["sweets", "sweet", "bakery", "sweets and bakery"]
};

// Known shop-name hints are checked first. This prevents a shop such as
// "Urban Wear" from being treated as Grocery if its shops.category value
// was accidentally set incorrectly in the database.
const shopNameCategoryHints = [
    ["clothing", ["urban wear", "fashion", "garment", "cloth", "apparel", "threads", "outfit", "denim", "style street", "mehta garments", "royal fashion"]],
    ["electronics", ["electronics", "digital world", "laptop", "mobile", "computer", "gadget", "tech"]],
    ["footwear", ["footwear", "shoe", "sneaker", "step"]],
    ["fruits", ["fresh basket", "fruit", "vegetable", "farm fresh"]],
    ["grocery", ["family store", "green mart", "green basket", "daily needs", "kirana", "grocery", "super market"]],
    ["cosmetics", ["glow beauty", "beauty", "cosmetic", "makeup"]],
    ["furniture", ["furniture", "home decor", "furnishing"]],
    ["hardware", ["hardware", "tools"]],
    ["pharmacy", ["pharmacy", "medical", "chemist", "health hub"]],
    ["restaurants", ["restaurant", "cafe", "food", "kitchen", "dhaba"]],
    ["stationery", ["stationery", "book store", "books"]],
    ["sweets", ["sweet", "bakery", "mithai"]]
];

function getRecommendationCategory(shopName, shopCategory) {
    const normalizedShopName = normalizeText(shopName);
    const normalizedShopCategory = normalizeText(shopCategory);

    // Prefer recognizable shop names over potentially mis-entered DB categories.
    for (const [category, hints] of shopNameCategoryHints) {
        if (hints.some(hint => normalizedShopName.includes(normalizeText(hint)))) {
            return category;
        }
    }

    for (const [category, aliases] of Object.entries(recommendationCategoryAliases)) {
        if (aliases.some(alias => normalizeText(alias) === normalizedShopCategory)) {
            return category;
        }
    }

    return null;
}

app.get("/ai-recommendations", (req, res) => {
    const customer = String(req.query.customer || "").trim();
    const requestedCategory = normalizeText(req.query.category);

    const supportedCategories = Object.keys(recommendationCategoryAliases);
    if (!supportedCategories.includes(requestedCategory)) {
        return res.status(400).json({
            success: false,
            message: "A valid product-page category is required.",
            supportedCategories
        });
    }

    // Use a scalar subquery for the shop category so duplicate shop-name
    // rows cannot multiply product records.
    const productSql = `
        SELECT
            p.*,
            (
                SELECT s.category
                FROM shops s
                WHERE LOWER(TRIM(s.name)) = LOWER(TRIM(p.shop))
                LIMIT 1
            ) AS shop_category,
            COALESCE(pop.popularity, 0) AS popularity
        FROM products p
        LEFT JOIN (
            SELECT product, shop, COUNT(*) AS popularity
            FROM orders
            WHERE LOWER(type) = 'booking'
              AND LOWER(status) IN ('accepted', 'completed')
            GROUP BY product, shop
        ) pop
          ON LOWER(TRIM(pop.product)) = LOWER(TRIM(p.name))
         AND LOWER(TRIM(pop.shop)) = LOWER(TRIM(p.shop))
        WHERE COALESCE(p.stock, 0) > 0
        ORDER BY popularity DESC, p.id DESC
        LIMIT 2000
    `;

    db.query(productSql, (productErr, allProducts) => {
        if (productErr) {
            console.log("AI RECOMMENDATION PRODUCTS ERROR:", productErr);
            return res.status(500).json({
                success: false,
                message: "Unable to load recommendations"
            });
        }

        // Strictly keep only products whose shop is classified into the
        // requested category. Unknown shops are excluded, never guessed.
        const products = allProducts
            .map(product => {
                const inferredCategory = getRecommendationCategory(
                    product.shop,
                    product.shop_category
                );
                return {
                    ...product,
                    category: inferredCategory
                };
            })
            .filter(product => product.category === requestedCategory)
            .slice(0, 100);

        if (!customer) {
            return res.json({
                success: true,
                category: requestedCategory,
                total: products.length,
                products,
                history: []
            });
        }

        const historySql = `
            SELECT
                o.product,
                o.shop,
                o.price,
                o.type,
                o.status,
                (
                    SELECT s.category
                    FROM shops s
                    WHERE LOWER(TRIM(s.name)) = LOWER(TRIM(o.shop))
                    ORDER BY s.id DESC
                    LIMIT 1
                ) AS shop_category
            FROM orders o
            WHERE o.customer = ?
              AND LOWER(o.type) IN ('booking', 'price', 'visit')
            ORDER BY o.id DESC
            LIMIT 100
        `;

        db.query(historySql, [customer], (historyErr, allHistory) => {
            if (historyErr) {
                console.log("AI RECOMMENDATION HISTORY ERROR:", historyErr);
                return res.json({
                    success: true,
                    category: requestedCategory,
                    total: products.length,
                    products,
                    history: []
                });
            }

            const history = allHistory
                .map(item => ({
                    ...item,
                    category: getRecommendationCategory(item.shop, item.shop_category)
                }))
                .filter(item => item.category === requestedCategory)
                .slice(0, 25);

            res.json({
                success: true,
                category: requestedCategory,
                total: products.length,
                products,
                history
            });
        });
    });
});

// =======================
// START SERVER
// =======================
app.listen(3000, () => {
    console.log("Server running on port 3000 🚀");
});
