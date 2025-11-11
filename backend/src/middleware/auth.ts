import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers['authorization']?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token is missing or invalid.' });
  }

  jwt.verify(token, process.env.JWT_ACCESS_SECRET as string, (err, decoded) => {
    if (err) {
      return res.status(403).json({ message: 'Token is not valid.' });
    }

    req.user = decoded;
    next();
  });
};

export default authMiddleware;