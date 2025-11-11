import { body, validationResult } from 'express-validator';

const validators = {
  register: [
    body('phone')
      .isString()
      .matches(/^254[17]\d{8}$/)
      .withMessage('Invalid Safaricom phone number'),
    body('email')
      .isEmail()
      .withMessage('Invalid email address'),
    body('nationalId')
      .isString()
      .notEmpty()
      .withMessage('National ID is required'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters long'),
  ],
  
  login: [
    body('phone')
      .isString()
      .matches(/^254[17]\d{8}$/)
      .withMessage('Invalid Safaricom phone number'),
    body('password')
      .isString()
      .notEmpty()
      .withMessage('Password is required'),
  ],

  kycUpload: [
    body('nationalId')
      .isString()
      .notEmpty()
      .withMessage('National ID is required'),
  ],

  validate: (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
};

export default validators;