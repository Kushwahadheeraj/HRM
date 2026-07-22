import { Request, Response, NextFunction } from 'express';
import User from '../models/User.model';

declare global {
  namespace Express {
    interface Request {
      user?: any;
      organizationId?: string;
    }
  }
}

export const attachOrganizationId = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // console.log('attachOrganizationId middleware called');
    // console.log('Headers:', req.headers);
    // For now, let's get the user from headers (we'll use auth token later)
    const userId = req.headers['x-user-id'];
    // console.log('x-user-id header:', userId);
    if (!userId) {
      // console.log('No x-user-id header');
      return next();
    }

    const user = await User.findById(userId);
    // console.log('Found user:', user);
    if (user && user.organizationId) {
      req.organizationId = user.organizationId.toString();
      // console.log('Set req.organizationId to:', req.organizationId);
    } else {
      // console.log('User has no organizationId');
    }
    next();
  } catch (error) {
    // console.error('Error in attachOrganizationId:', error);
    next(error);
  }
};
