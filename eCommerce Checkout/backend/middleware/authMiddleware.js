const jwt = require('jsonwebtoken');
const User = require('../models/User'); // Ensure this points to your *single* User model

const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Fetch user by ID from the token payload and attach to request
            // .select('-password') ensures password hash is not returned
            req.user = await User.findById(decoded.id).select('-password');
            
            // Check if req.user is valid and exists
            if (!req.user) {
                res.status(401);
                throw new Error('Not authorized, user not found');
            }

            next();
        } catch (error) {
            console.error('Auth middleware error:', error);
            res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        res.status(401).json({ message: 'Not authorized, no token' });
    }
};

module.exports = { protect };