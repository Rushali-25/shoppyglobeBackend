const express = require('express');
const authMiddleware = require('../middlewares/authMiddleware');
const Cart = require('../models/Cart');

const router = express.Router();

// GET User Cart (Protected)
router.get('/', authMiddleware, async (req, res) => {
    try {
        const cart = await Cart.findOne({ user: req.user.id });
        if (!cart) return res.status(404).json({ message: "Cart not found!" });

        res.json(cart);
    } catch (error) {
        res.status(500).json({ message: "Server Error", error });
    }
});

// ADD to Cart (Protected)
router.post('/add', authMiddleware, async (req, res) => {
    try {
        const { productId, quantity } = req.body;
        let cart = await Cart.findOne({ user: req.user.id });

        if (!cart) {
            cart = new Cart({ user: req.user.id, items: [{ productId, quantity }] });
        } else {
            const existingItem = cart.items.find(item => item.productId.toString() === productId);
            if (existingItem) {
                existingItem.quantity += quantity;
            } else {
                cart.items.push({ productId, quantity });
            }
        }

        await cart.save();
        res.status(200).json({ message: "Product added to cart!", cart });
    } catch (error) {
        res.status(500).json({ message: "Server Error", error });
    }
});

module.exports = router;
