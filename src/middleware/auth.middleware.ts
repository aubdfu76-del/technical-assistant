import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt.util';

/**
 * Authentication middleware
 * Verifies JWT token and attaches user data to request
 */
export const authenticate = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        // Get token from Authorization header
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'يرجى تسجيل الدخول أولاً',
            });
        }

        // Extract token (remove 'Bearer ' prefix)
        const token = authHeader.substring(7);

        // Verify token
        const decoded = verifyToken(token);

        // Attach user data to request
        (req as any).user = decoded;

        // Continue to next middleware/controller
        next();
    } catch (error: any) {
        return res.status(401).json({
            success: false,
            message: error.message || 'الجلسة منتهية، يرجى تسجيل الدخول مرة أخرى',
        });
    }
};

/**
 * Authorization middleware
 * Checks if user has required role(s)
 * @param roles - Array of allowed roles
 */
export const authorize = (...roles: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const user = (req as any).user;

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'يرجى تسجيل الدخول أولاً',
            });
        }

        if (!roles.includes(user.role)) {
            return res.status(403).json({
                success: false,
                message: 'ليس لديك صلاحية للوصول إلى هذا المورد',
            });
        }

        next();
    };
};

/**
 * Optional authentication middleware
 * Attaches user data if token is present, but doesn't require it
 */
export const optionalAuth = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const authHeader = req.headers.authorization;

        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.substring(7);
            const decoded = verifyToken(token);
            (req as any).user = decoded;
        }

        next();
    } catch (error) {
        // If token is invalid, just continue without user data
        next();
    }
};
