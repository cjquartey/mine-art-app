const {body, validationResult} = require('express-validator');

const validateLogin = [
    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Invalid email format'),

    body('password')
        .notEmpty().withMessage('Password is required'),

    handleValidationErrors
]

const validateRegister = [
    body('firstName')
        .trim()
        .escape()
        .notEmpty().withMessage('First name is required'),
    
    body('lastName')
        .trim()
        .escape()
        .notEmpty().withMessage('Last name is required'),

    body('username')
        .trim()
        .escape()
        .notEmpty().withMessage('Username is required')
        .isLength({min: 3, max: 20}).withMessage('Username must be between 3 and 20 characters'),

    body('email')
        .normalizeEmail()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Invalid email format'),

    body('password')
        .notEmpty().withMessage('Password is required')
        .isLength({min: 8}).withMessage('Password must be at least 8 characters')
        .matches(/[a-z]/).withMessage('Password must contain at least one lowercase letter')
        .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
        .matches(/\d/).withMessage('Password must contain at least one number')
        .matches(/[!@#$%^&*]/).withMessage('Password must contain at least one special character'),
    
    handleValidationErrors
]

function handleValidationErrors(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const errorMessages = errors.array().map(err => err.msg);
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: errorMessages
        });
    }
    next();
}

module.exports = {
    validateLogin,
    validateRegister
}