import { Request, Response, NextFunction } from 'express';

const roles = {
  admin: 'admin',
  farmer: 'farmer',
  buyer: 'buyer',
  driver: 'driver',
  cooperative_manager: 'cooperative_manager',
};

const rbac = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const userRole = req.user?.role; // Assuming user role is attached to the request object

    if (!userRole || !allowedRoles.includes(userRole)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    next();
  };
};

export { rbac, roles };