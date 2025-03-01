const Cart = require("../models/Cart");

// Get cart items
exports.getCart = async (req, res) => {
  try {
    const cart = await Cart.findOne().populate("items.productId");
    if (!cart) return res.status(404).json({ message: "Cart is empty" });
    res.json(cart);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Add a product to the cart
exports.addToCart = async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    let cart = await Cart.findOne();

    if (!cart) {
      cart = new Cart({ items: [] });
    }

    const existingItem = cart.items.find(item => item.productId.toString() === productId);

    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      cart.items.push({ productId, quantity });
    }

    await cart.save();
    res.json(cart);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Update quantity of a product in the cart
exports.updateCart = async (req, res) => {
  try {
    const { quantity } = req.body;
    const cart = await Cart.findOne();

    if (!cart) return res.status(404).json({ message: "Cart not found" });

    const item = cart.items.find(item => item.productId.toString() === req.params.id);

    if (!item) return res.status(404).json({ message: "Product not in cart" });

    item.quantity = quantity;
    await cart.save();

    res.json(cart);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Remove a product from the cart
exports.removeFromCart = async (req, res) => {
  try {
    const cart = await Cart.findOne();

    if (!cart) return res.status(404).json({ message: "Cart not found" });

    cart.items = cart.items.filter(item => item.productId.toString() !== req.params.id);
    await cart.save();

    res.json(cart);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Clear the cart
exports.clearCart = async (req, res) => {
  try {
    await Cart.deleteOne();
    res.json({ message: "Cart cleared" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
