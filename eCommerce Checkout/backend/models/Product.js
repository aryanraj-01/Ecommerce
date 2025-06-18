const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    imageUrls: {
        type: [String], // Array of strings
        default: ['https://via.placeholder.com/300'] // Placeholder image
    },
    variants: [
        {
            type: String // e.g., 'Red', 'Blue', 'Small', 'Large'
        }
    ],
    inventoryCount: {
        type: Number,
        required: true,
        min: 0,
        default: 100 // Starting inventory
    }
});

module.exports = mongoose.model('Product', productSchema);