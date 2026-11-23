
import jwt from "jsonwebtoken";

const authMiddleware = (req, res, next) => {
    try {
        // Check JWT secret configuration
        if (!process.env.JWT_SECRET) {
            console.error("JWT_SECRET is not configured.");

            return res.status(500).json({
                success: false,
                message: "Authentication service unavailable."
            });
        }

        // Get authorization header
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                success: false,
                message: "Access denied. No token provided."
            });
        }

        // Extract token
        const token = authHeader.slice(7).trim();

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Invalid authentication token."
            });
        }

        // Verify JWT signature and expiration
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET,
            {
                algorithms: ["HS256"]
            }
        );

        // Validate user ID
        if (
            !decoded ||
            typeof decoded !== "object" ||
            typeof decoded.id !== "string" ||
            !/^[a-fA-F0-9]{24}$/.test(decoded.id)
        ) {
            return res.status(401).json({
                success: false,
                message: "Invalid authentication token."
            });
        }

        // Store authenticated user information
        req.user = decoded;

        next();

    } catch (error) {
        return res.status(401).json({
            success: false,
            message: "Invalid or expired token."
        });
    }
};

export default authMiddleware;
