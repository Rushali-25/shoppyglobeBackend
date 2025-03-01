const express = require("express");
const { body, param, validationResult } = require("express-validator");
const Product = require("../models/Product");

const router = express.Router();

// Error Handling Middleware
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
};

// Create Product
router.post(
    "/add",
    [
        body("name").isString().notEmpty().withMessage("Name is required"),
        body("price").isNumeric().withMessage("Price must be a number"),
        body("description").isString().optional(),
        body("stock").isInt({ min: 0 }).withMessage("Stock must be a positive integer")
    ],
    handleValidationErrors,
    async (req, res) => {
        try {
            const product = new Product(req.body);
            await product.save();
            res.status(201).json({ message: "Product added", product });
        } catch (error) {
            res.status(500).json({ error: "Server error: " + error.message });
        }
    }
);

// Get a Product by ID
router.get(
    "/:id",
    [param("id").isMongoId().withMessage("Invalid product ID")],
    handleValidationErrors,
    async (req, res) => {
        try {
            const product = await Product.findById(req.params.id);
            if (!product) {
                return res.status(404).json({ error: "Product not found" });
            }
            res.json(product);
        } catch (error) {
            res.status(500).json({ error: "Server error: " + error.message });
        }
    }
);

module.exports = router;
