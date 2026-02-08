import express from 'express';
import {
    login,
    register,
    logout,
    getCurrentUser,
    refreshToken,
} from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = express.Router();

/**
 * @route   POST /api/auth/login
 * @desc    Login user and get JWT token
 * @access  Public
 */
router.post('/login', login);

/**
 * @route   POST /api/auth/register
 * @desc    Register new user (supervisor)
 * @access  Public
 */
router.post('/register', register);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user (client-side token removal)
 * @access  Private
 */
router.post('/logout', authenticate, logout);

/**
 * @route   GET /api/auth/me
 * @desc    Get current user information
 * @access  Private
 */
router.get('/me', authenticate, getCurrentUser);

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh JWT token
 * @access  Private
 */
router.post('/refresh', authenticate, refreshToken);

export default router;
