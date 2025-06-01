// backend/models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs'); // <-- Make sure to import bcryptjs here

const cartItemSchema = new mongoose.Schema({
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    name: { // Store name for easier display without extra product lookup
        type: String,
        required: true
    },
    imageUrl: { // Store image for easier display
        type: String
    },
    price: { // Store price at the time of adding to cart
        type: Number,
        required: true
    },
    selectedVariant: {
        type: String // e.g., "Black", "Small", "128GB"
    },
    quantity: {
        type: Number,
        required: true,
        min: 1
    }
});

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: true
    },
    fullName: {
        type: String,
        required: true
    },
    isAdmin: { // <-- ADD THIS FIELD for distinguishing user roles
        type: Boolean,
        required: true,
        default: false,
    },
    cart: [cartItemSchema], // Array of cart items
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Method to compare entered password with hashed password in the database
userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

// Middleware to hash password before saving (only if password has been modified)
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) { // Only hash if the password field is being changed
        next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next(); // Don't forget to call next()
});

module.exports = mongoose.model('User', userSchema);