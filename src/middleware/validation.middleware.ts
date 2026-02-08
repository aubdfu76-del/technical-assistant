import { Request, Response, NextFunction } from 'express';
import { validationResult, ValidationChain } from 'express-validator';

/**
 * Validation error handler middleware
 * Checks for validation errors and returns them in a consistent format
 */
export const handleValidationErrors = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        const formattedErrors = errors.array().map(error => ({
            field: error.type === 'field' ? (error as any).path : 'unknown',
            message: error.msg,
        }));

        const errorMessage = formattedErrors.map(e => e.message).join('، ');

        return res.status(400).json({
            success: false,
            message: errorMessage,
            errors: formattedErrors,
        });
    }

    next();
};

/**
 * Wrapper to run validation chains
 * @param validations - Array of validation chains
 */
export const validate = (validations: ValidationChain[]) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        // Run all validations
        for (const validation of validations) {
            await validation.run(req);
        }

        // Check for errors
        handleValidationErrors(req, res, next);
    };
};
