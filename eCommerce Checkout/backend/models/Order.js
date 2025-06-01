const mongoose = require('mongoose');

// Define a schema for individual items within an order
const orderItemSchema = new mongoose.Schema({
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product', // Reference to the Product model
        required: true
    },
    name: { // Store name to avoid extra lookup
        type: String,
        required: true
    },
    imageUrl: { // Store image URL
        type: String
    },
    price: { // Price at the time of order
        type: Number,
        required: true
    },
    selectedVariant: {
        type: String
    },
    quantity: {
        type: Number,
        required: true,
        min: 1
    }
});

const orderSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Link to the User who placed the order
        required: true
    },
    orderNumber: {
        type: String,
        required: true,
        unique: true
    },
    items: [orderItemSchema], // Now an array of items
    shippingAddress: {
        fullName: String,
        addressLine1: String,
        addressLine2: String,
        city: String,
        state: String,
        zipCode: String,
        country: String
    },
    billingAddress: { // Can be the same as shipping
        fullName: String,
        addressLine1: String,
        addressLine2: String,
        city: String,
        state: String,
        zipCode: String,
        country: String
    },
    paymentDetails: {
        cardType: String,
        lastFour: String, // Store only last four digits for security
        // Add other non-sensitive payment details as needed
    },
    subtotal: {
        type: Number,
        required: true
    },
    shippingCost: {
        type: Number,
        default: 0
    },
    taxAmount: {
        type: Number,
        default: 0
    },
    total: {
        type: Number,
        required: true
    },
    orderDate: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
        default: 'pending'
    }
});

module.exports = mongoose.model('Order', orderSchema);