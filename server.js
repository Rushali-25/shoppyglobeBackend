require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const User = require("./models/User");
const Product = require("./models/Product");
const Cart = require("./models/Cart");

const app = express();
app.use(express.json());
app.use(cors());

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ MongoDB Connected Successfully");
  } catch (err) {
    console.error("❌ MongoDB Connection Failed:", err.message);
    process.exit(1); // Exit server if unable to connect
  }
};

// Call the function before starting the server
connectDB();

// Middleware: Verify JWT Token
const verifyToken = (req, res, next) => {
  const authHeader = req.header("Authorization");

  if (!authHeader) {
    return res.status(401).json({ message: "Access Denied: No token provided" });
  }

  const token = authHeader.split(" ")[1]; // Extract token after 'Bearer'

  if (!token) {
    return res.status(401).json({ message: "Access Denied: Invalid token format" });
  }

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    console.log("Token Verified:", verified); // Debugging log
    req.user = verified;
    next();
  } catch (err) {
    console.error("JWT Verification Error:", err.message); // Debugging log
    res.status(400).json({ message: "Invalid Token" });
  }
};

// ================== AUTH ROUTES ==================

// Register User
app.post("/api/users/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    let user = await User.findOne({ email });

    if (user) return res.status(400).json({ message: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    user = new User({ name, email, password: hashedPassword });

    await user.save();
    res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    console.error("Error in /api/users/register:", err); // Log error
    res.status(500).json({ message: "Server Error", error: err.message });
  }
});

// Login User
app.post("/api/users/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword)
      return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    res.json({ token });
  } catch (err) {
    res.status(500).json({ message: "Server Error" });
  }
});

// ================== PRODUCT ROUTES ==================

// Fetch all products
app.get("/api/products", async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: "Error fetching products" });
  }
});

// Fetch product by ID
app.get("/api/products/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });

    res.json(product);
  } catch (err) {
    res.status(500).json({ message: "Error fetching product" });
  }
});

// ================== CART ROUTES (PROTECTED) ==================

// Add product to cart
app.post("/api/cart", verifyToken, async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    const product = await Product.findById(productId);

    if (!product) return res.status(404).json({ message: "Product not found" });

    const cartItem = new Cart({ userId: req.user.id, productId, quantity });
    await cartItem.save();

    res.status(201).json({ message: "Product added to cart" });
  } catch (err) {
    res.status(500).json({ message: "Error adding to cart" });
  }
});

// Fetch all cart items for the logged-in user
app.get("/api/cart", verifyToken, async (req, res) => {
  try {
    const cartItems = await Cart.find({ userId: req.user.id }).populate("productId");

    if (!cartItems.length) {
      return res.status(404).json({ message: "Cart is empty" });
    }

    res.json(cartItems);
  } catch (err) {
    res.status(500).json({ message: "Error fetching cart items" });
  }
});

app.put("/api/cart/:id", verifyToken, async (req, res) => {
    console.log("Received PUT request for cart item ID:", req.params.id);
    console.log("Request Body:", req.body);

    try {
        const { quantity } = req.body;
        if (!quantity || quantity < 1) {
            return res.status(400).json({ message: "Quantity must be at least 1" });
        }

        const cartItem = await Cart.findOne({ _id: req.params.id, userId: req.user.id });

        if (!cartItem) {
            console.log("Cart item not found in DB");
            return res.status(404).json({ message: "Cart item not found" });
        }

        cartItem.quantity = quantity;
        await cartItem.save();
        console.log("Cart updated successfully");

        res.json({ message: "Cart updated successfully", cartItem });
    } catch (err) {
        console.error("Error updating cart:", err);
        res.status(500).json({ message: "Error updating cart" });
    }
});

app.delete("/api/cart/:id", verifyToken, async (req, res) => {
    try {
        const cartItem = await Cart.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
        if (!cartItem) {
            return res.status(404).json({ message: "Cart item not found" });
        }
        res.json({ message: "Item removed from cart successfully" });
    } catch (err) {
        console.error("Error removing item from cart:", err);
        res.status(500).json({ message: "Error removing item from cart" });
    }
});


// ================== SERVER LISTEN ==================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
