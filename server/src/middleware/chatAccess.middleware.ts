import { Request, Response, NextFunction } from 'express';
import User from '../models/User.model';

export const blockHrFromChat = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User ID is required',
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    if (user.role === 'hr_manager' || user.role === 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Chat access is not allowed for HR/Administrator users',
      });
    }

    next();
  } catch (error) {
    console.error('Chat Access Middleware Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};
