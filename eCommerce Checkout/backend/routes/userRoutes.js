const express = require('express');
const router = express.Router();
const {
    authUser,
    registerUser,
    getUserProfile,
    updateUserProfile,
    updateUserPassword,
} = require('../controllers/userController'); // Ensure path is correct
const { protect } = require('../middleware/authMiddleware'); // Ensure path is correct

// Public routes
router.route('/').post(registerUser); // POST /api/users (for registration)
router.post('/login', authUser);     // POST /api/users/login

// Private routes (require authentication)
router
    .route('/profile')
    .get(protect, getUserProfile)      // GET /api/users/profile
    .put(protect, updateUserProfile);  // PUT /api/users/profile

router.put('/profile/password', protect, updateUserPassword); // PUT /api/users/profile/password

module.exports = router;