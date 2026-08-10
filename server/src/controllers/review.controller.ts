import { Request, Response } from 'express';
import Review from '../models/Review.model';
import User from '../models/User.model';
import Organization from '../models/Organization.model';
import { ApiResponse } from '../types';

// Submit a review (only admins)
export const submitReview = async (req: Request, res: Response<ApiResponse>) => {
  try {
    const userId = req.headers['x-user-id'];
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const user = await User.findById(userId);
    if (!user || user.role !== 'hr_manager') {
      return res.status(403).json({ success: false, message: 'Only admins can submit reviews' });
    }

    const { rating, comment } = req.body;
    if (!rating || !comment) {
      return res.status(400).json({ success: false, message: 'Rating and comment are required' });
    }

    // Get organization details
    const organization = await Organization.findById(user.organizationId);
    if (!organization) {
      return res.status(404).json({ success: false, message: 'Organization not found' });
    }

    // Check if user already submitted a review
    const existingReview = await Review.findOne({ userId });
    if (existingReview) {
      return res.status(400).json({ success: false, message: 'You have already submitted a review' });
    }

    const review = await Review.create({
      userId,
      organizationId: user.organizationId,
      organizationName: organization.name,
      userName: user.name,
      userRole: user.roleLabel,
      rating,
      comment,
      isApproved: false
    });

    res.status(201).json({
      success: true,
      message: 'Review submitted successfully',
      data: review
    });
  } catch (error) {
    // console.error('Submit Review Error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Get all reviews (super admin only)
export const getAllReviews = async (req: Request, res: Response<ApiResponse>) => {
  try {
    const userId = req.headers['x-user-id'];
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const user = await User.findById(userId);
    if (!user || user.role !== 'super_admin') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const reviews = await Review.find().sort({ createdAt: -1 });
    res.json({ success: true, data: reviews });
  } catch (error) {
    // console.error('Get All Reviews Error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Approve/Disapprove a review (super admin only)
export const updateReviewStatus = async (req: Request, res: Response<ApiResponse>) => {
  try {
    const userId = req.headers['x-user-id'];
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const user = await User.findById(userId);
    if (!user || user.role !== 'super_admin') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const { reviewId } = req.params;
    const { isApproved } = req.body;

    const review = await Review.findByIdAndUpdate(
      reviewId,
      { isApproved },
      { new: true }
    );

    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }

    res.json({
      success: true,
      message: `Review ${isApproved ? 'approved' : 'disapproved'} successfully`,
      data: review
    });
  } catch (error) {
    // console.error('Update Review Status Error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Delete a review (super admin only)
export const deleteReview = async (req: Request, res: Response<ApiResponse>) => {
  try {
    const userId = req.headers['x-user-id'];
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const user = await User.findById(userId);
    if (!user || user.role !== 'super_admin') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const { reviewId } = req.params;
    await Review.findByIdAndDelete(reviewId);

    res.json({ success: true, message: 'Review deleted successfully' });
  } catch (error) {
    // console.error('Delete Review Error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Get approved reviews (for landing page - public)
export const getApprovedReviews = async (req: Request, res: Response<ApiResponse>) => {
  try {
    const approvedReviews = await Review.find({ isApproved: true }).sort({ createdAt: -1 });
    res.json({ success: true, data: approvedReviews });
  } catch (error) {
    // console.error('Get Approved Reviews Error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Get user's own review
export const getUserReview = async (req: Request, res: Response<ApiResponse>) => {
  try {
    const userId = req.headers['x-user-id'];
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const review = await Review.findOne({ userId });
    res.json({ success: true, data: review });
  } catch (error) {
    // console.error('Get User Review Error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
