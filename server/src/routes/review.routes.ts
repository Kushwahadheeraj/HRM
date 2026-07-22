import express from 'express';
import {
  submitReview,
  getAllReviews,
  updateReviewStatus,
  deleteReview,
  getApprovedReviews,
  getUserReview
} from '../controllers/review.controller';

const router = express.Router();

// Public route for landing page
router.get('/approved', getApprovedReviews);

// Admin routes
router.post('/', submitReview);
router.get('/my', getUserReview);

// Super admin routes
router.get('/', getAllReviews);
router.put('/:reviewId/status', updateReviewStatus);
router.delete('/:reviewId', deleteReview);

export default router;
