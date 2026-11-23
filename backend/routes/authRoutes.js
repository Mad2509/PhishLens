
import express from "express";
import rateLimit from "express-rate-limit";

import {
    registerUser,
    loginUser
} from "../controllers/authController.js";

const router = express.Router();

// Login rate limiter
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: {
        success: false,
        message: "Too many login attempts. Please try again after 15 minutes."
    },
    standardHeaders: true,
    legacyHeaders: false
});

// Registration rate limiter
const registerLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 10,
    message: {
        success: false,
        message: "Too many registration attempts. Please try again after one hour."
    },
    standardHeaders: true,
    legacyHeaders: false
});

// Register route
router.post("/register", registerLimiter, registerUser);

// Login route
router.post("/login", loginLimiter, loginUser);

export default router;
