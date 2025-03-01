const mongoose = require("mongoose");

const CartSchema = new mongoose.Schema({
    userId: mongoose.Schema.Types.ObjectId,
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    quantity: { type: Number, required: true, min: 1 }
});

module.exports = mongoose.model("Cart", CartSchema);
