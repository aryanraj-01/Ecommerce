require('dotenv').config(); // Load environment variables first
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const nodemailer = require('nodemailer'); // For sending emails
const bcrypt = require('bcryptjs'); // For password hashing
const jwt = require('jsonwebtoken'); // For JSON Web Tokens
const Product = require('./models/Product'); // Product Model
const Order = require('./models/Order');     // Order Model
const User = require('./models/User');       // User Model

const userRoutes = require('./routes/userRoutes');
const { protect } = require('./middleware/authMiddleware');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');
// const generateToken = require('./utils/generateToken');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors()); // Enable CORS for frontend communication
app.use(express.json()); // Parse JSON request bodies

// Database Connection
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB Connected Successfully'))
    .catch(err => console.error('MongoDB connection error:', err));

// Mailtrap Transporter Setup
const transporter = nodemailer.createTransport({
    host: process.env.MAILTRAP_HOST,
    port: process.env.MAILTRAP_PORT,
    auth: {
        user: process.env.MAILTRAP_USER,
        pass: process.env.MAILTRAP_PASS,
    }
});


// --- API Routes ---

app.use('/api/users', userRoutes);

app.get('/api/products', async (req, res) => {
    try {
        const { search } = req.query; // Get search query from URL (e.g., /api/products?search=headphone)
        let products;
        let query = {};

        if (search) {
            // Case-insensitive search on product name or description
            query = {
                $or: [
                    { name: { $regex: search, $options: 'i' } },
                    { description: { $regex: search, $options: 'i' } }
                ]
            };
        }

        products = await Product.find(query);

        // If no products exist (first run or empty DB), populate with many dummy products
        if (products.length === 0) {
            console.log('No products found. Populating dummy products...');
            const dummyProducts = [
                {
                    name: "Premium Wireless Headphones",
                    description: "Experience immersive sound with our noise-cancelling premium wireless headphones. Enjoy crystal-clear audio and comfortable earcups for hours of listening pleasure.",
                    price: 149.99,
                    imageUrl: "https://images.unsplash.com/photo-1546435770-d3e498c0b0ed?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
                    variants: ["Black", "Silver", "Rose Gold"],
                    inventoryCount: 100
                },
                {
                    name: "Ergonomic Office Chair",
                    description: "High-back mesh office chair with lumbar support and adjustable armrests. Perfect for long working hours.",
                    price: 299.99,
                    imageUrl: "https://images.unsplash.com/photo-1591871232010-d352b27008ca?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
                    variants: ["Black", "Grey"],
                    inventoryCount: 50
                },
                {
                    name: "Smartwatch with Heart Rate Monitor",
                    description: "Track your fitness, receive notifications, and monitor your heart rate with this sleek and functional smartwatch.",
                    price: 89.99,
                    imageUrl: "https://images.unsplash.com/photo-1523275373859-a9ce8962c5e5?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
                    variants: ["Sport Band", "Leather Band"],
                    inventoryCount: 75
                },
                {
                    name: "Portable Bluetooth Speaker",
                    description: "Compact and powerful speaker with rich bass and crystal-clear highs. Waterproof for outdoor adventures.",
                    price: 59.99,
                    imageUrl: "https://images.unsplash.com/photo-1545610816-3e4b857732d8?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
                    variants: ["Black", "Blue", "Red"],
                    inventoryCount: 120
                },
                {
                    name: "High-Speed SSD (1TB)",
                    description: "Boost your computer's performance with this ultra-fast 1TB Solid State Drive. Ideal for gaming and professional use.",
                    price: 129.99,
                    imageUrl: "https://images.unsplash.com/photo-1618251268307-8874945d8b2d?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
                    variants: [],
                    inventoryCount: 60
                },
                {
                    name: "4K UHD Smart TV (55 inch)",
                    description: "Immerse yourself in stunning visuals with this 55-inch 4K UHD Smart TV. Built-in streaming apps and voice control.",
                    price: 699.99,
                    imageUrl: "https://images.unsplash.com/photo-1574942006720-7f212260195c?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
                    variants: [],
                    inventoryCount: 20
                },
                {
                    name: "Robot Vacuum Cleaner",
                    description: "Effortlessly clean your home with this smart robot vacuum. Features intelligent navigation and app control.",
                    price: 349.99,
                    imageUrl: "https://images.unsplash.com/photo-1581729013233-a3b04c86b2d2?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
                    variants: [],
                    inventoryCount: 30
                },
                {
                    name: "Digital Camera (Mirrorless)",
                    description: "Capture breathtaking photos and videos with this professional mirrorless camera. Includes a versatile zoom lens.",
                    price: 899.99,
                    imageUrl: "https://images.unsplash.com/photo-1502920514313-52581002a659?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
                    variants: [],
                    inventoryCount: 15
                },
                {
                    name: "Smart Home Security Camera",
                    description: "Keep your home safe with 1080p HD video, night vision, and motion detection. Easy to install and monitor via app.",
                    price: 79.99,
                    imageUrl: "https://images.unsplash.com/photo-1596700054737-1422c5496417?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
                    variants: [],
                    inventoryCount: 90
                },
                {
                    name: "Gaming Laptop (RTX 4070)",
                    description: "Unleash your gaming potential with this powerful laptop featuring an RTX 4070 GPU, i7 processor, and 16GB RAM.",
                    price: 1599.99,
                    imageUrl: "https://images.unsplash.com/photo-1593642632782-0193ed9fd26b?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
                    variants: [],
                    inventoryCount: 10
                },
                // Add more products (aim for 20-30 for good search variety)
                { name: "Wireless Keyboard and Mouse Combo", description: "Ergonomic design with silent keys.", price: 45.00, imageUrl: "https://images.unsplash.com/photo-1587823565355-08103c27e387?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", variants: [], inventoryCount: 80 },
                { name: "External Hard Drive 2TB", description: "Portable storage for all your files.", price: 79.99, imageUrl: "https://images.unsplash.com/photo-1628126744855-328b0f807831?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", variants: [], inventoryCount: 40 },
                { name: "Coffee Maker with Grinder", description: "Freshly ground coffee, brewed to perfection.", price: 120.00, imageUrl: "https://images.unsplash.com/photo-1559495116-2c5e52c8b091?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", variants: [], inventoryCount: 25 },
                { name: "Electric Toothbrush", description: "Advanced cleaning for healthier gums.", price: 65.00, imageUrl: "https://images.unsplash.com/photo-1601614749382-7774207865f3?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", variants: [], inventoryCount: 150 },
                { name: "Air Fryer (5.8-Quart)", description: "Cook healthier meals with less oil.", price: 85.00, imageUrl: "https://images.unsplash.com/photo-1616854585640-5a9e334a1d82?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", variants: [], inventoryCount: 35 },
                { name: "Smart LED Strip Lights", description: "Set the mood with customizable RGB lighting.", price: 25.00, imageUrl: "https://images.unsplash.com/photo-1626297380961-f09b2b528b70?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", variants: [], inventoryCount: 200 },
                { name: "Portable Projector", description: "Enjoy movies anywhere with this compact projector.", price: 180.00, imageUrl: "https://images.unsplash.com/photo-1628126744855-328b0f807831?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", variants: [], inventoryCount: 18 },
                { name: "Noise Cancelling Earbuds", description: "Small, powerful, and truly wireless sound.", price: 99.00, imageUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06f2e0?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", variants: ["Black", "White"], inventoryCount: 110 },
                { name: "Fitness Tracker Bracelet", description: "Monitor steps, calories, and sleep patterns.", price: 39.99, imageUrl: "https://images.unsplash.com/photo-1551608632-d17e57973d09?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", variants: [], inventoryCount: 95 },
                { name: "Smart Water Bottle", description: "Tracks your hydration and glows to remind you to drink.", price: 49.99, imageUrl: "https://images.unsplash.com/photo-1627483321926-2187ed2b339f?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", variants: ["Blue", "Pink"], inventoryCount: 60 },
                { name: "Portable Power Bank (20000mAh)", description: "Charge your devices on the go, multiple ports.", price: 35.00, imageUrl: "https://images.unsplash.com/photo-1587823565355-08103c27e387?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", variants: [], inventoryCount: 130 },
                { name: "Gaming Headset with Mic", description: "Immersive 7.1 surround sound and clear communication.", price: 75.00, imageUrl: "https://images.unsplash.com/photo-1546435770-d3e498c0b0ed?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", variants: [], inventoryCount: 55 },
                { name: "Wireless Charging Pad", description: "Fast and convenient charging for your smartphone.", price: 20.00, imageUrl: "https://images.unsplash.com/photo-1627483321926-2187ed2b339f?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", variants: [], inventoryCount: 180 },
                { name: "Smart Thermostat", description: "Control your home's temperature from anywhere.", price: 150.00, imageUrl: "https://images.unsplash.com/photo-1582236371587-8898b9f7a5c8?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", variants: [], inventoryCount: 22 },
                { name: "Portable Espresso Maker", description: "Enjoy fresh espresso on the go.", price: 70.00, imageUrl: "https://images.unsplash.com/photo-1559495116-2c5e52c8b091?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", variants: [], inventoryCount: 30 },
                { name: "Electric Kettle (Variable Temp)", description: "Boil water to the exact temperature you need.", price: 40.00, imageUrl: "https://images.unsplash.com/photo-1545610816-3e4b857732d8?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", variants: [], inventoryCount: 45 },
                { name: "HD Webcam with Microphone", description: "Perfect for video calls and streaming.", price: 55.00, imageUrl: "https://images.unsplash.com/photo-1596700054737-1422c5496417?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", variants: [], inventoryCount: 70 },
                { name: "Smart Doorbell with Camera", description: "See and speak to visitors from anywhere.", price: 130.00, imageUrl: "https://images.unsplash.com/photo-1628126744855-328b0f807831?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", variants: [], inventoryCount: 28 },
                { name: "Digital Photo Frame (10-inch)", description: "Display your favorite memories in a slideshow.", price: 80.00, imageUrl: "https://images.unsplash.com/photo-1550009158-745a76e93290?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", variants: [], inventoryCount: 33 },
                { name: "Home Wi-Fi Mesh System", description: "Eliminate dead zones with whole-home coverage.", price: 199.00, imageUrl: "https://images.unsplash.com/photo-1628126744855-328b0f807831?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", variants: [], inventoryCount: 12 },
                { name: "Portable Mini Fan", description: "Stay cool on the go with this powerful yet compact fan.", price: 15.00, imageUrl: "https://images.unsplash.com/photo-1523275373859-a9ce8962c5e5?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", variants: ["White", "Black", "Pink"], inventoryCount: 250 },
                { name: "USB-C Hub Multiport Adapter", description: "Expand your laptop's connectivity with HDMI, USB, and SD card slots.", price: 30.00, imageUrl: "https://images.unsplash.com/photo-1517336714731-489689fd5b3a?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", variants: [], inventoryCount: 170 },
                { name: "Electric Wine Opener", description: "Effortlessly open wine bottles in seconds.", price: 28.00, imageUrl: "https://images.unsplash.com/photo-1627483321926-2187ed2b339f?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", variants: [], inventoryCount: 90 },
                { name: "Smart Light Bulbs (4-pack)", description: "Control your lighting from your phone, dimmable and color-changing.", price: 40.00, imageUrl: "https://images.unsplash.com/photo-1616854585640-5a9e334a1d82?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", variants: [], inventoryCount: 65 },
                { name: "Wireless Gaming Mouse", description: "Precision and speed for serious gamers, customizable buttons.", price: 60.00, imageUrl: "https://images.unsplash.com/photo-1547842609-bc91959edb7a?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", variants: [], inventoryCount: 70 },
                { name: "Standing Desk Converter", description: "Transform any desk into a standing desk, adjustable height.", price: 180.00, imageUrl: "https://images.unsplash.com/photo-1593642632782-0193ed9fd26b?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", variants: [], inventoryCount: 20 },
                { name: "E-Reader (Paperwhite)", description: "Enjoy reading for hours with glare-free display and built-in light.", price: 110.00, imageUrl: "https://images.unsplash.com/photo-1628126744855-328b0f807831?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", variants: [], inventoryCount: 40 },
                { name: "Portable Scanner", description: "Scan documents on the go, ideal for remote work.", price: 90.00, imageUrl: "https://images.unsplash.com/photo-1627483321926-2187ed2b339f?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", variants: [], inventoryCount: 25 },
                { name: "Wireless Video Doorbell", description: "See, hear, and speak to visitors from your phone.", price: 140.00, imageUrl: "https://images.unsplash.com/photo-1596700054737-1422c5496417?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", variants: [], inventoryCount: 18 },
                { name: "Smart Plug (2-pack)", description: "Control any plugged-in device with your voice or app.", price: 20.00, imageUrl: "https://images.unsplash.com/photo-1628126744855-328b0f807831?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", variants: [], inventoryCount: 150 },
                { name: "Handheld Garment Steamer", description: "Quickly remove wrinkles from clothes.", price: 35.00, imageUrl: "https://images.unsplash.com/photo-1627483321926-2187ed2b339f?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", variants: [], inventoryCount: 60 },
                { name: "Digital Kitchen Scale", description: "Accurate measurements for cooking and baking.", price: 22.00, imageUrl: "https://images.unsplash.com/photo-1628126744855-328b0f807831?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", variants: [], inventoryCount: 110 },
                { name: "Massage Gun (Deep Tissue)", description: "Relieve muscle soreness and stiffness.", price: 100.00, imageUrl: "https://images.unsplash.com/photo-1627483321926-2187ed2b339f?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", variants: [], inventoryCount: 30 },
                { name: "Smart Garden Kit", description: "Grow herbs and vegetables indoors with ease.", price: 95.00, imageUrl: "https://images.unsplash.com/photo-1627483321926-2187ed2b339f?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", variants: [], inventoryCount: 15 },
                { name: "Portable Photo Printer", description: "Print instant photos from your smartphone.", price: 115.00, imageUrl: "https://images.unsplash.com/photo-1627483321926-2187ed2b339f?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", variants: [], inventoryCount: 20 },
                { name: "USB Microphone (Condenser)", description: "Studio-quality sound for podcasting and streaming.", price: 70.00, imageUrl: "https://images.unsplash.com/photo-1627483321926-2187ed2b339f?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", variants: [], inventoryCount: 40 },
                { name: "Gaming Chair with Footrest", description: "Ultimate comfort for long gaming sessions.", price: 250.00, imageUrl: "https://images.unsplash.com/photo-1593642632782-0193ed9fd26b?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", variants: ["Black", "Red"], inventoryCount: 10 },
                { name: "Wireless Security Camera (Outdoor)", description: "Durable and weatherproof, 1080p HD, motion alerts.", price: 105.00, imageUrl: "https://images.unsplash.com/photo-1596700054737-1422c5496417?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", variants: [], inventoryCount: 30 },
                { name: "Smart Scale with Body Composition", description: "Tracks weight, BMI, body fat, and more.", price: 50.00, imageUrl: "https://images.unsplash.com/photo-1627483321926-2187ed2b339f?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", variants: [], inventoryCount: 80 },
                { name: "Dash Cam (Front & Rear)", description: "Record your drives for safety and evidence.", price: 90.00, imageUrl: "https://images.unsplash.com/photo-1628126744855-328b0f807831?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", variants: [], inventoryCount: 25 },
                { name: "Smart Air Purifier (HEPA)", description: "Improve air quality, removes allergens and pollutants.", price: 160.00, imageUrl: "https://images.unsplash.com/photo-1627483321926-2187ed2b339f?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", variants: [], inventoryCount: 15 },
                { name: "Robot Mop", description: "Automated mopping for hard floors, keeps your home spotless.", price: 280.00, imageUrl: "https://images.unsplash.com/photo-1581729013233-a3b04c86b2d2?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", variants: [], inventoryCount: 10 },
                { name: "Portable SSD (500GB)", description: "Ultra-fast external storage in a compact design.", price: 85.00, imageUrl: "https://images.unsplash.com/photo-1618251268307-8874945d8b2d?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", variants: [], inventoryCount: 50 },
                { name: "Curved Gaming Monitor (27-inch)", description: "Immersive visuals with a high refresh rate for gaming.", price: 320.00, imageUrl: "https://images.unsplash.com/photo-1593642632782-0193ed9fd26b?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", variants: [], inventoryCount: 8 },
                { name: "Electric Gooseneck Kettle", description: "Precise pouring for perfect pour-over coffee.", price: 55.00, imageUrl: "https://images.unsplash.com/photo-1559495116-2c5e52c8b091?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", variants: [], inventoryCount: 38 },
                { name: "Smart Water Leak Sensor", description: "Get alerts on your phone if water is detected.", price: 25.00, imageUrl: "https://images.unsplash.com/photo-1627483321926-2187ed2b339f?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", variants: [], inventoryCount: 100 },
                { name: "Wireless Bluetooth Earbuds", description: "Compact and comfortable, great for workouts.", price: 45.00, imageUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06f2e0?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", variants: ["White", "Black"], inventoryCount: 180 },
                { name: "Smart Door Lock", description: "Keyless entry with smartphone control and access codes.", price: 170.00, imageUrl: "https://images.unsplash.com/photo-1628126744855-328b0f807831?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", variants: [], inventoryCount: 15 },
                { name: "LED Desk Lamp with Wireless Charger", description: "Adjustable lighting with a built-in phone charger.", price: 50.00, imageUrl: "https://images.unsplash.com/photo-1627483321926-2187ed2b339f?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", variants: [], inventoryCount: 65 },
                { name: "Portable USB Fan (Mini)", description: "Small and mighty, powered by USB, perfect for desk.", price: 12.00, imageUrl: "https://images.unsplash.com/photo-1523275373859-a9ce8962c5e5?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", variants: ["Blue", "Green"], inventoryCount: 200 },
                { name: "Electric Stand Mixer", description: "Bake like a pro with this versatile kitchen appliance.", price: 200.00, imageUrl: "https://images.unsplash.com/photo-1627483321926-2187ed2b339f?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", variants: ["Red", "Silver"], inventoryCount: 12 },
                { name: "Smart Air Quality Monitor", description: "Real-time tracking of indoor air pollutants.", price: 75.00, imageUrl: "https://images.unsplash.com/photo-1627483321926-2187ed2b339f?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", variants: [], inventoryCount: 28 },
                { name: "Gaming Headset Stand with USB Hub", description: "Organize your desk and add extra USB ports.", price: 30.00, imageUrl: "https://images.unsplash.com/photo-1627483321926-2187ed2b339f?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", variants: [], inventoryCount: 90 },
                { name: "Portable Clothes Dryer", description: "Quickly dry small loads of laundry anywhere.", price: 110.00, imageUrl: "https://images.unsplash.com/photo-1627483321926-2187ed2b339f?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", variants: [], inventoryCount: 18 },
                { name: "Smart Pet Feeder with Camera", description: "Feed your pet remotely and monitor them with HD video.", price: 150.00, imageUrl: "https://images.unsplash.com/photo-1627483321926-2187ed2b339f?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", variants: [], inventoryCount: 10 },
                { name: "Digital Blood Pressure Monitor", description: "Accurate readings for home health monitoring.", price: 40.00, imageUrl: "https://images.unsplash.com/photo-1627483321926-2187ed2b339f?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", variants: [], inventoryCount: 75 },
                { name: "Home Security System Kit", description: "Comprehensive alarm system with motion sensors and door contacts.", price: 250.00, imageUrl: "https://images.unsplash.com/photo-1627483321926-2187ed2b339f?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", variants: [], inventoryCount: 8 },
                { name: "Smart Water Bottle (Infuser)", description: "Infuse your water with fruits and track hydration.", price: 35.00, imageUrl: "https://images.unsplash.com/photo-1627483321926-2187ed2b339f?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", variants: ["Green", "Purple"], inventoryCount: 90 },
                { name: "Gaming Desk with LED Lighting", description: "Spacious desk designed for gamers, built-in RGB lights.", price: 190.00, imageUrl: "https://images.unsplash.com/photo-1627483321926-2187ed2b339f?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", variants: [], inventoryCount: 10 },
                { name: "Portable Mini Projector", description: "Pocket-sized projector for movies and presentations.", price: 100.00, imageUrl: "https://images.unsplash.com/photo-1627483321926-2187ed2b339f?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", variants: [], inventoryCount: 20 },
                { name: "Electric Crepe Maker", description: "Make perfect crepes and pancakes with ease.", price: 45.00, imageUrl: "https://images.unsplash.com/photo-1627483321926-2187ed2b339f?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", variants: [], inventoryCount: 30 },
                { name: "Smart Jump Rope with App Sync", description: "Track your jumps, calories, and progress on your phone.", price: 30.00, imageUrl: "https://images.unsplash.com/photo-1627483321926-2187ed2b339f?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", variants: [], inventoryCount: 120 },
                { name: "Portable Camp Shower", description: "Enjoy a warm shower outdoors with this rechargeable unit.", price: 60.00, imageUrl: "https://images.unsplash.com/photo-1627483321926-2187ed2b339f?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", variants: [], inventoryCount: 25 },
                { name: "UV Sanitizer Box", description: "Disinfect your phone, keys, and small items with UV light.", price: 40.00, imageUrl: "https://images.unsplash.com/photo-1627483321926-2187ed2b339f?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", variants: [], inventoryCount: 50 },
                { name: "Smart Bird Feeder with Camera", description: "Watch birds up close and get alerts when they visit.", price: 180.00, imageUrl: "https://images.unsplash.com/photo-1627483321926-2187ed2b339f?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", variants: [], inventoryCount: 8 },
                { name: "Portable Blender (USB Rechargeable)", description: "Make smoothies on the go, easy to clean.", price: 30.00, imageUrl: "https://images.unsplash.com/photo-1627483321926-2187ed2b339f?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", variants: ["Blue", "Pink"], inventoryCount: 70 },
                { name: "Smart Sprinkler Controller", description: "Automate your lawn watering and save water.", price: 130.00, imageUrl: "https://images.unsplash.com/photo-1627483321926-2187ed2b339f?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", variants: [], inventoryCount: 15 },
                { name: "Electric Scooter (Foldable)", description: "Commute effortlessly with this portable electric scooter.", price: 400.00, imageUrl: "https://images.unsplash.com/photo-1627483321926-2187ed2b339f?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", variants: [], inventoryCount: 5 },
                { name: "Smart Pen with Digital Notebook", description: "Write notes and drawings that instantly digitize.", price: 90.00, imageUrl: "https://images.unsplash.com/photo-1627483321926-2187ed2b339f?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", variants: [], inventoryCount: 30 },
                { name: "Handheld Vacuum Cleaner (Cordless)", description: "Quick clean-ups with powerful suction, lightweight.", price: 65.00, imageUrl: "https://images.unsplash.com/photo-1627483321926-2187ed2b339f?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", variants: [], inventoryCount: 40 },
                { name: "Smart Cat Litter Box", description: "Self-cleaning and odor-controlling, app connected.", price: 450.00, imageUrl: "https://images.unsplash.com/photo-1627483321926-2187ed2b339f?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", variants: [], inventoryCount: 3 },
                { name: "Portable Espresso Machine", description: "Brew quality espresso shots wherever you are.", price: 150.00, imageUrl: "https://images.unsplash.com/photo-1627483321926-2187ed2b339f?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", variants: [], inventoryCount: 10 },
                { name: "Outdoor Security Camera (Solar)", description: "Wireless camera with solar panel for continuous power.", price: 160.00, imageUrl: "https://images.unsplash.com/photo-1627483321926-2187ed2b339f?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", variants: [], inventoryCount: 12 },
                { name: "Smart Fitness Mirror", description: "Interactive workouts with a personal trainer, right at home.", price: 800.00, imageUrl: "https://images.unsplash.com/photo-1627483321926-2187ed2b339f?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", variants: [], inventoryCount: 2 }

            ];
            await Product.insertMany(dummyProducts);
            products = await Product.find(query); // Refetch after insertion
            console.log(`${dummyProducts.length} dummy products populated.`);
        }
        res.json(products);
    } catch (err) {
        console.error('Error fetching/populating products:', err);
        res.status(500).json({ message: 'Server error fetching products' });
    }
});


// --- NEW: Use User Routes from userRoutes.js ---
// app.use('/api/users', userRoutes); // All routes defined in userRoutes will now be accessible under /api/users

// Cart Routes (Existing)
app.get('/api/cart', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('cart');
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }
        res.status(200).json(user.cart);
    } catch (err) {
        console.error('Error fetching cart:', err);
        res.status(500).json({ message: 'Server error fetching cart.' });
    }
});

app.post('/api/cart/add', protect, async (req, res) => {
    const { productId, quantity, selectedVariant } = req.body;
    try {
        const product = await Product.findById(productId);
        if (!product) { return res.status(404).json({ message: 'Product not found.' }); }
        if (product.inventoryCount < quantity) { return res.status(400).json({ message: `Insufficient stock for ${product.name}. Available: ${product.inventoryCount}` }); }
        const user = await User.findById(req.user._id);
        if (!user) { return res.status(404).json({ message: 'User not found.' }); }
        const existingItemIndex = user.cart.findIndex(item => item.productId.toString() === productId && item.selectedVariant === selectedVariant);
        if (existingItemIndex > -1) {
            user.cart[existingItemIndex].quantity += quantity;
        } else {
            user.cart.push({ productId, name: product.name, imageUrl: product.imageUrl, price: product.price, selectedVariant, quantity });
        }
        await user.save();
        res.status(200).json({ message: 'Item added to cart successfully!', cart: user.cart });
    } catch (err) { console.error('Error adding to cart:', err); res.status(500).json({ message: 'Server error adding to cart.' }); }
});

app.put('/api/cart/update', protect, async (req, res) => {
    const { productId, quantity, selectedVariant } = req.body;
    if (quantity <= 0) { return res.status(400).json({ message: 'Quantity must be greater than 0. Use DELETE to remove.' }); }
    try {
        const user = await User.findById(req.user._id);
        if (!user) { return res.status(404).json({ message: 'User not found.' }); }
        const itemIndex = user.cart.findIndex(item => item.productId.toString() === productId && item.selectedVariant === selectedVariant);
        if (itemIndex > -1) {
            const product = await Product.findById(productId);
            if (!product) { return res.status(404).json({ message: 'Product not found.' }); }
            if (product.inventoryCount < quantity) { return res.status(400).json({ message: `Insufficient stock for ${product.name}. Available: ${product.inventoryCount}` }); }
            user.cart[itemIndex].quantity = quantity;
            await user.save();
            res.status(200).json({ message: 'Cart updated successfully!', cart: user.cart });
        } else { res.status(404).json({ message: 'Item not found in cart.' }); }
    } catch (err) { console.error('Error updating cart:', err); res.status(500).json({ message: 'Server error updating cart.' }); }
});

// DELETE /api/cart/remove/:productId/:selectedVariant - Remove item from cart
app.delete('/api/cart/remove/:productId/:selectedVariant', protect, async (req, res) => {
    const { productId, selectedVariant } = req.params;
    try {
        const user = await User.findById(req.user._id);
        if (!user) { return res.status(404).json({ message: 'User not found.' }); }
        const initialCartLength = user.cart.length;
        user.cart = user.cart.filter(item => !(item.productId.toString() === productId && item.selectedVariant === selectedVariant));
        if (user.cart.length === initialCartLength) { return res.status(404).json({ message: 'Item not found in cart.' }); }
        await user.save();
        res.status(200).json({ message: 'Item removed from cart successfully!', cart: user.cart });
    } catch (err) { console.error('Error removing from cart:', err); res.status(500).json({ message: 'Server error removing from cart.' }); }
});

// POST /api/checkout - Handle checkout process
app.post('/api/checkout', protect, async (req, res) => {
    const { shippingAddress, billingAddress, paymentDetails } = req.body;

    // --- Server-side Validations (Basic) ---
    if (!shippingAddress || !shippingAddress.fullName || !shippingAddress.addressLine1 || !shippingAddress.city || !shippingAddress.state || !shippingAddress.zipCode || !shippingAddress.country || !paymentDetails || !paymentDetails.cardType || !paymentDetails.cardNumber || !paymentDetails.expiryDate || !paymentDetails.cvv) {
        return res.status(400).json({ message: 'Missing required checkout information (address or payment).' });
    }
    if (!/^\d{16}$/.test(paymentDetails.cardNumber)) { return res.status(400).json({ message: 'Card number must be 16 digits.' }); }
    if (!/^\d{3}$/.test(paymentDetails.cvv)) { return res.status(400).json({ message: 'CVV must be 3 digits.' }); }
    const [month, year] = paymentDetails.expiryDate.split('/').map(Number);
    const currentYear = new Date().getFullYear() % 100; const currentMonth = new Date().getMonth() + 1;
    if (isNaN(month) || isNaN(year) || month < 1 || month > 12 || year < currentYear || (year === currentYear && month < currentMonth)) {
        return res.status(400).json({ message: 'Invalid or expired card expiry date.' });
    }

    try {
        const user = await User.findById(req.user._id).select('cart email fullName');
        if (!user || user.cart.length === 0) { return res.status(400).json({ message: 'Your cart is empty. Please add items before checking out.' }); }

        let subtotal = 0; let orderItems = []; let productsToUpdate = [];
        const productPromises = user.cart.map(item => Product.findById(item.productId));
        const productsInCart = await Promise.all(productPromises);

        for (let i = 0; i < user.cart.length; i++) {
            const cartItem = user.cart[i]; const product = productsInCart[i];
            if (!product) { return res.status(400).json({ message: `Product "${cartItem.name}" is no longer available.` }); }
            if (product.inventoryCount < cartItem.quantity) { return res.status(400).json({ message: `Insufficient stock for ${product.name}. Available: ${product.inventoryCount}` }); }
            subtotal += cartItem.price * cartItem.quantity;
            orderItems.push({ productId: cartItem.productId, name: cartItem.name, imageUrl: cartItem.imageUrl, price: cartItem.price, selectedVariant: cartItem.selectedVariant, quantity: cartItem.quantity });
            productsToUpdate.push({ product, quantity: cartItem.quantity });
        }

        const shippingCost = 10; const taxRate = 0.05;
        const taxAmount = subtotal * taxRate; const total = subtotal + shippingCost + taxAmount;
        const orderNumber = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

        const transactionOutcome = Math.random();
        let paymentStatus; let orderStatus = 'pending';

        if (transactionOutcome < 0.7) {
            paymentStatus = 'Approved'; orderStatus = 'processing';
            for (const { product, quantity } of productsToUpdate) { product.inventoryCount -= quantity; await product.save(); }
            user.cart = []; await user.save();
        } else if (transactionOutcome < 0.9) {
            paymentStatus = 'Declined'; orderStatus = 'cancelled';
        } else {
            paymentStatus = 'Gateway Error'; orderStatus = 'cancelled';
        }

        const newOrder = new Order({
            userId: req.user._id, orderNumber, items: orderItems,
            shippingAddress: { fullName: shippingAddress.fullName, addressLine1: shippingAddress.addressLine1, addressLine2: shippingAddress.addressLine2 || '', city: shippingAddress.city, state: shippingAddress.state, zipCode: shippingAddress.zipCode, country: shippingAddress.country },
            billingAddress: billingAddress || shippingAddress, paymentDetails: { cardType: paymentDetails.cardType, lastFour: paymentDetails.cardNumber.slice(-4) },
            subtotal, shippingCost, taxAmount, total, status: orderStatus
        });
        await newOrder.save();

        let emailSubject; let emailHtml;
        if (paymentStatus === 'Approved') {
            emailSubject = `Order #${orderNumber} Confirmed - Thank You!`;
            emailHtml = `<p>Dear ${user.fullName},</p><p>Thank you for your order! Your order number is <strong>#${orderNumber}</strong>.</p><p>Your payment was approved, and your order is now being processed.</p><p><strong>Order Details:</strong></p><ul>${orderItems.map(item => `<li>${item.name} ${item.selectedVariant ? `(${item.selectedVariant})` : ''} - ${item.quantity} x $${item.price.toFixed(2)} = $${(item.price * item.quantity).toFixed(2)}</li>`).join('')}</ul><p>Subtotal: $${subtotal.toFixed(2)}</p><p>Shipping: $${shippingCost.toFixed(2)}</p><p>Tax: $${taxAmount.toFixed(2)}</p><p><strong>Total: $${total.toFixed(2)}</strong></p><p>Your order status: <strong>${newOrder.status}</strong>.</p><p>We will send another email once your order has been shipped.</p><p>Shipping to:<br>${shippingAddress.fullName}<br>${shippingAddress.addressLine1}<br>${shippingAddress.addressLine2 ? shippingAddress.addressLine2 + '<br>' : ''}${shippingAddress.city}, ${shippingAddress.state} ${shippingAddress.zipCode}<br>${shippingAddress.country}</p><p>Thank you for shopping with us!</p>`;
        } else {
            emailSubject = `Order #${orderNumber} - Payment ${paymentStatus}`;
            emailHtml = `<p>Dear ${user.fullName},</p><p>We regret to inform you that your payment for order <strong>#${orderNumber}</strong> was ${paymentStatus}.</p><p>Your order has been cancelled. Please check your payment details or try again with a different method.</p>${paymentStatus === 'Gateway Error' ? '<p>There was a temporary issue with our payment gateway. Please try again in a few moments.</p>' : ''}<p>If you continue to experience issues, please contact support.</p><p>Customer Email: ${user.email}</p>`;
        }
        try { await transporter.sendMail({ from: process.env.MAILTRAP_SENDER_EMAIL || 'no-reply@ecommerce.com', to: user.email, subject: emailSubject, html: emailHtml, }); console.log(`Email sent for order ${orderNumber} with status: ${paymentStatus}`); } catch (emailErr) { console.error('Error sending email:', emailErr); }

        res.status(paymentStatus === 'Approved' ? 200 : 400).json({ message: paymentStatus === 'Approved' ? 'Order placed successfully! Payment approved.' : `Payment ${paymentStatus}. Order cancelled.`, orderNumber: newOrder.orderNumber, orderId: newOrder._id, total: newOrder.total, status: newOrder.status, paymentStatus: paymentStatus });
    } catch (err) { console.error('Checkout error:', err); res.status(500).json({ message: 'Server error during checkout process.' }); }
});
// GET /api/orders - Fetch all orders for the authenticated user
app.get('/api/orders', protect, async (req, res) => {
    try {
        const orders = await Order.find({ userId: req.user._id }).sort({ orderDate: -1 });
        if (orders.length === 0) { return res.status(200).json({ message: 'No orders found for this user.', orders: [] }); }
        res.status(200).json(orders);
    } catch (err) { console.error('Error fetching user orders:', err); res.status(500).json({ message: 'Server error fetching orders.' }); }
});
// GET /api/order/:orderNumber - Fetch specific order details (for Thank You Page)
app.get('/api/order/:orderNumber', protect, async (req, res) => { // Added protect middleware
    try {
        const order = await Order.findOne({ orderNumber: req.params.orderNumber });
        if (!order) { return res.status(404).json({ message: 'Order not found.' }); }
        if (order.userId.toString() !== req.user._id.toString()) { return res.status(403).json({ message: 'Not authorized to view this order.' }); }
        res.json(order);
    } catch (err) { console.error('Error fetching order details:', err); res.status(500).json({ message: 'Server error fetching order details.' }); }
});

// Error Handling Middleware (AFTER all other routes and middleware) <-- ADD THESE LINES
app.use(notFound);
app.use(errorHandler);

// Start the server
app.listen(PORT, () => {
    console.log(`Backend server running on port ${PORT}`);
});