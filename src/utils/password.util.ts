import bcrypt from 'bcrypt';

/**
 * Number of salt rounds for bcrypt hashing
 * Higher number = more secure but slower
 */
const SALT_ROUNDS = 10;

/**
 * Hash a plain text password
 * @param password - Plain text password to hash
 * @returns Hashed password
 */
export const hashPassword = async (password: string): Promise<string> => {
    try {
        const hash = await bcrypt.hash(password, SALT_ROUNDS);
        return hash;
    } catch (error) {
        console.error('Error hashing password:', error);
        throw new Error('فشل تشفير كلمة المرور');
    }
};

/**
 * Compare a plain text password with a hashed password
 * @param password - Plain text password
 * @param hash - Hashed password from database
 * @returns True if passwords match, false otherwise
 */
export const comparePassword = async (
    password: string,
    hash: string
): Promise<boolean> => {
    try {
        const isMatch = await bcrypt.compare(password, hash);
        return isMatch;
    } catch (error) {
        console.error('Error comparing passwords:', error);
        throw new Error('فشل التحقق من كلمة المرور');
    }
};

/**
 * Validate password strength
 * @param password - Password to validate
 * @returns Object with isValid and message
 */
export const validatePasswordStrength = (password: string): {
    isValid: boolean;
    message: string;
} => {
    if (!password || password.length < 8) {
        return {
            isValid: false,
            message: 'كلمة المرور يجب أن تكون 8 أحرف على الأقل',
        };
    }

    // You can add more validation rules here
    // For example: require uppercase, lowercase, numbers, special chars

    return {
        isValid: true,
        message: 'كلمة المرور قوية',
    };
};
