import { Request, Response, NextFunction } from 'express';
import Organization from '../models/Organization.model';
import mongoose from 'mongoose';

declare global {
  namespace Express {
    interface Request {
      organization?: any;
    }
  }
}

export const checkTrialStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // console.log('=== checkTrialStatus middleware called ===');

    // Skip trial check for authentication routes
    const authPaths = ['/api/auth/login', '/api/auth/register-admin', '/api/auth/register', '/api/auth/super-admin', '/api/auth/create-payment-order', '/api/auth/verify-payment', '/api/auth/verify-payment-and-register'];
    if (authPaths.some(path => req.path.startsWith(path))) {
      // console.log('Skipping trial check for auth path:', req.path);
      return next();
    }

    // If no organizationId, skip (for super admin or unauthenticated)
    if (!req.organizationId) {
      // console.log('No organizationId, skipping trial check');
      return next();
    }

    // console.log('Checking trial for organizationId:', req.organizationId);

    // Fetch organization
    let organization = await Organization.findById(req.organizationId);
    if (!organization) {
      // console.log('Organization not found');
      return res.status(404).json({
        success: false,
        message: 'Organization not found'
      });
    }

    // If organization doesn't have trial dates, set them!
    if (!organization.trialStartDate || !organization.trialEndDate) {
      // console.log('Organization missing trial dates, setting them now');
      const trialStart = new Date();
      const trialEnd = new Date(trialStart);
      trialEnd.setDate(trialEnd.getDate() + 30);
      
      organization.trialStartDate = trialStart;
      organization.trialEndDate = trialEnd;
      organization = await organization.save();
      // console.log('Updated organization with trial dates');
    }

    req.organization = organization;

    // If paid, allow access
    if (organization.isPaid) {
      // console.log('Organization is paid, allowing access');
      return next();
    }

    // Check trial status
    const today = new Date();
    // console.log('Today:', today.toISOString());
    // console.log('Trial end date:', organization.trialEndDate.toISOString());

    if (today > organization.trialEndDate) {
      // console.log('Trial expired');
      return res.status(403).json({
        success: false,
        message: 'Your free trial has expired. Please make a payment to continue using the system.',
        data: {
          trialExpired: true,
          trialEndDate: organization.trialEndDate,
          isPaid: organization.isPaid
        }
      });
    }

    // Calculate days remaining
    const timeDiff = organization.trialEndDate.getTime() - today.getTime();
    const daysRemaining = Math.ceil(timeDiff / (1000 * 3600 * 24));
    // console.log(`Trial active, ${daysRemaining} days remaining`);

    // Allow access
    next();
  } catch (error) {
    // console.error('Error in checkTrialStatus middleware:', error);
    next(error);
  }
};