import { body, validationResult } from 'express-validator';

const validationMiddleware = {
  register: [
    body('phone')
      .isString()
      .withMessage('Phone number is required')
      .matches(/^254[17]\d{8}$/)
      .withMessage('Invalid Safaricom phone number'),
    body('email')
      .isEmail()
      .withMessage('Valid email is required'),
    body('nationalId')
      .isString()
      .withMessage('National ID is required'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters long'),
    (req, res, next) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      next();
    }
  ],

  login: [
    body('phone')
      .isString()
      .withMessage('Phone number is required'),
    body('password')
      .isString()
      .withMessage('Password is required'),
    (req, res, next) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      next();
    }
  ],

  kycUpload: [
    body('nationalId')
      .isString()
      .withMessage('National ID is required'),
    (req, res, next) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      next();
    }
  ],

  createListing: [
    body('title')
      .isString()
      .withMessage('Title is required'),
    body('description')
      .isString()
      .withMessage('Description is required'),
    body('price')
      .isNumeric()
      .withMessage('Price must be a number'),
    (req, res, next) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      next();
    }
  ]
};

export default validationMiddleware;