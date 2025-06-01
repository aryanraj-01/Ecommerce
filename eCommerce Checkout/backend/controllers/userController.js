const asyncHandler = require('express-async-handler');
const generateToken = require('../utils/generateToken'); // Correct path to generateToken
const User = require('../models/User'); // Ensure this points to your *single* User model
const bcrypt = require('bcryptjs'); // Needed for direct password handling if not using model methods

// @desc    Auth user & get token (Login)
// @route   POST /api/users/login
// @access  Public
const authUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    // Use the matchPassword method from the User model
    if (user && (await user.matchPassword(password))) {
        res.json({
            _id: user._id,
            fullName: user.fullName,
            email: user.email,
            isAdmin: user.isAdmin,
            // FIX: Pass fullName and isAdmin to generateToken
            token: generateToken(user._id, user.fullName, user.isAdmin),
        });
    } else {
        res.status(401);
        throw new Error('Invalid email or password');
    }
});

// @desc    Register a new user
// @route   POST /api/users
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
    const { fullName, email, password } = req.body;

    const userExists = await User.findOne({ email });

    if (userExists) {
        res.status(400);
        throw new Error('User already exists');
    }

    // User.create will trigger the pre('save') hook in the model to hash the password
    const user = await User.create({
        fullName,
        email,
        password,
    });

    if (user) {
        res.status(201).json({
            _id: user._id,
            fullName: user.fullName,
            email: user.email,
            isAdmin: user.isAdmin,
            // FIX: Pass fullName and isAdmin to generateToken
            token: generateToken(user._id, user.fullName, user.isAdmin),
        });
    } else {
        res.status(400);
        throw new Error('Invalid user data');
    }
});

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
const getUserProfile = asyncHandler(async (req, res) => {
    // req.user is populated by the protect middleware and already contains the user object (without password)
    // We already have req.user from the middleware, so no need to fetch again unless you need more specific fields.
    // However, fetching again ensures latest data if middleware was not designed to give full object.
    const user = await User.findById(req.user._id).select('-password'); // Fetch again to ensure consistency

    if (user) {
        res.json({
            _id: user._id,
            fullName: user.fullName,
            email: user.email,
            isAdmin: user.isAdmin,
            createdAt: user.createdAt, // Include createdAt for profile view
        });
    } else {
        res.status(404);
        throw new Error('User not found');
    }
});

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
const updateUserProfile = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);

    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    // Check if email is being changed and if the new email already exists for another user
    if (req.body.email && req.body.email !== user.email) {
        const emailExists = await User.findOne({ email: req.body.email });
        if (emailExists) {
            res.status(400);
            throw new Error('This email is already registered.');
        }
        user.email = req.body.email;
    }

    user.fullName = req.body.fullName || user.fullName; // Update fullName if provided

    const updatedUser = await user.save(); // This will trigger pre('save') for password if changed

    res.json({
        message: 'Profile updated successfully!', // Add a success message
        _id: updatedUser._id,
        fullName: updatedUser.fullName,
        email: updatedUser.email,
        isAdmin: updatedUser.isAdmin,
        // FIX: Generate new token with updated fullName/email if they were changed
        token: generateToken(updatedUser._id, updatedUser.fullName, updatedUser.isAdmin),
    });
});

// @desc    Update user password
// @route   PUT /api/users/profile/password
// @access  Private
const updateUserPassword = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
        res.status(400);
        throw new Error('Please provide current and new password');
    }

    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    // Check if current password matches using the model method
    if (!(await user.matchPassword(currentPassword))) {
        res.status(401);
        throw new Error('Invalid current password');
    }

    // Update password field. The pre-save hook in userModel will hash this.
    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password updated successfully' });
});


module.exports = {
    authUser,
    registerUser,
    getUserProfile,
    updateUserProfile,
    updateUserPassword,
};