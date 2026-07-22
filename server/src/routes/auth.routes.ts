import express from 'express';
import { login, register, registerAdmin, listAllUsers, getSuperAdmin, updateSettings, getOrganizationStatus, markOrganizationAsPaid, createPaymentOrder, verifyPayment, verifyPaymentAndRegister, getOrganizationStats, getPricing, updatePricing } from '../controllers/auth.controller';

const router = express.Router();

router.post('/login', login);
router.post('/register', register);
router.post('/register-admin', registerAdmin); // New route for admin registration
router.get('/users', listAllUsers); // Debug route
router.get('/super-admin', getSuperAdmin);
router.put('/:userId/settings', updateSettings); // Update user settings
router.get('/organization-status', getOrganizationStatus); // Get organization trial/payment status
router.post('/mark-paid', markOrganizationAsPaid); // Mark organization as paid (simulate payment)
router.post('/create-payment-order', createPaymentOrder); // Create Razorpay payment order
router.post('/verify-payment', verifyPayment); // Verify Razorpay payment
router.post('/verify-payment-and-register', verifyPaymentAndRegister); // Verify payment and create user
router.get('/organization-stats', getOrganizationStats); // Get super admin stats
router.get('/pricing', getPricing); // Get all pricing plans
router.put('/pricing', updatePricing); // Update pricing (super admin only)

export default router;
