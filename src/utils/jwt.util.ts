import jwt from 'jsonwebtoken';

/**
 * JWT Secret Key from environment variables
 */
const JWT_SECRET = process.env.JWT_SECRET || 'intelligent-technical-assistant-secret-key-2026';

/**
 * JWT Expiration time from environment variables
 */
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

/**
 * JWT Payload interface
 */
export interface JwtPayload {
    userId: number;
    employeeId: string;
    role: string;
}

/**
 * Generate a JWT token
 * @param payload - User data to encode in token
 * @returns JWT token string
 */
export const generateToken = (payload: JwtPayload): string => {
    try {
        const token = jwt.sign(
            payload,
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions
        );
        return token;
    } catch (error) {
        console.error('Error generating token:', error);
        throw new Error('فشل إنشاء رمز المصادقة');
    }
};

/**
 * Verify and decode a JWT token
 * @param token - JWT token to verify
 * @returns Decoded payload
 * @throws Error if token is invalid or expired
 */
export const verifyToken = (token: string): JwtPayload => {
    try {
        const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
        return decoded;
    } catch (error: any) {
        if (error.name === 'TokenExpiredError') {
            throw new Error('انتهت صلاحية الجلسة، يرجى تسجيل الدخول مرة أخرى');
        } else if (error.name === 'JsonWebTokenError') {
            throw new Error('رمز المصادقة غير صالح');
        } else {
            throw new Error('فشل التحقق من رمز المصادقة');
        }
    }
};

/**
 * Decode a JWT token without verification (for debugging)
 * @param token - JWT token to decode
 * @returns Decoded payload or null
 */
export const decodeToken = (token: string): JwtPayload | null => {
    try {
        const decoded = jwt.decode(token) as JwtPayload;
        return decoded;
    } catch (error) {
        console.error('Error decoding token:', error);
        return null;
    }
};
