const jwt = require('jsonwebtoken');

const generateToken = (id, fullName, isAdmin) => {
    return jwt.sign({ id, fullName, isAdmin }, process.env.JWT_SECRET, {
        expiresIn: '1h', // Token expires in 1 hour
    });
};

module.exports = generateToken;