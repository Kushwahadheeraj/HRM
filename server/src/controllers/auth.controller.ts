import { Request, Response } from 'express';
import User from '../models/User.model';
import Organization from '../models/Organization.model';
import Pricing from '../models/Pricing.model';
import { ApiResponse } from '../types';
import bcrypt from 'bcrypt';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import { env } from '../config/env';

// Debug route to list all users
export const listAllUsers = async (req: Request, res: Response<ApiResponse>) => {
  try {
    const users = await User.find().select('email role name');
    // console.log('All users in database:', users);
    res.json({
      success: true,
      data: users,
    });
  } catch (error) {
    console.error('List Users Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const login = async (req: Request, res: Response<ApiResponse>) => {
  try {
    // console.log('=== Login request received ===');
    // console.log('Request body:', req.body);
    const { email, password } = req.body;

    // Check if email and password are provided
    if (!email || !password) {
      // console.log('Missing email or password!');
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password',
      });
    }

    // Find user by email
    const user = await User.findOne({ email });
    // console.log('Full user document:', user);
    // console.log('User organizationId:', user?.organizationId);
    // console.log('Type of user.organizationId:', typeof user?.organizationId);
    if (!user || !user.password) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Compare password with bcrypt
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Update last login time
    user.lastLogin = new Date();
    await user.save();

    // console.log('Login successful for:', user.email);
    const userJson = user.toJSON();
    // console.log('userJson:', userJson);
    res.json({
      success: true,
      message: 'Login successful',
      data: userJson,
    });
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const registerAdmin = async (req: Request, res: Response<ApiResponse>) => {
  // console.log('=== [registerAdmin] Request received ===');
  // console.log('Request body:', req.body);
  try {
    const { name, email, password, organizationName, phone } = req.body;

    // Check required fields
    if (!name || !email || !password || !organizationName) {
      // console.log('❌ [registerAdmin] Missing required fields');
      return res.status(400).json({
        success: false,
        message: 'Name, email, password, and organization name are required',
      });
    }

    // Check if user already exists
    // console.log('🔍 [registerAdmin] Checking for existing user with email:', email);
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      // console.log('❌ [registerAdmin] User already exists');
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists',
      });
    }

    // Hash password
    // console.log('🔑 [registerAdmin] Hashing password');
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create admin user
    // console.log('👤 [registerAdmin] Creating user in MongoDB');
    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      role: 'hr_manager',
      roleLabel: 'HR Manager',
      department: 'Administration',
      avatar: '',
      employeeId: `TRX-ADMIN-${Date.now().toString().slice(-6)}`,
      phone: phone || '',
    });
    // console.log('✅ [registerAdmin] User created:', newUser._id);
    // console.log('newUser object after create:', newUser);

    // Create organization
    // console.log('🏢 [registerAdmin] Creating organization in MongoDB');
    const trialStartDate = new Date();
    const trialEndDate = new Date(trialStartDate);
    trialEndDate.setDate(trialEndDate.getDate() + 30);
    const newOrganization = await Organization.create({
      name: organizationName,
      adminId: newUser._id,
      trialStartDate,
      trialEndDate,
      isPaid: false
    });
    // console.log('✅ [registerAdmin] Organization created:', newOrganization);
    // console.log('newOrganization._id:', newOrganization._id);

    // Update user with organizationId
    // console.log('🔗 [registerAdmin] Updating user with organizationId:', newOrganization._id);
    const updatedUser = await User.findByIdAndUpdate(
      newUser._id,
      { organizationId: newOrganization._id },
      { new: true, runValidators: true }
    );
    // console.log('✅ [registerAdmin] User updated with organizationId');
    // console.log('updatedUser:', updatedUser);
    // console.log('updatedUser.organizationId:', updatedUser?.organizationId);

    const userJson = updatedUser?.toJSON() || newUser.toJSON();
    // console.log('userJson:', userJson);

    // console.log('🎉 [registerAdmin] Registration successful!');
    res.status(201).json({
      success: true,
      message: 'Admin and organization registered successfully',
      data: { user: userJson, organization: newOrganization },
    });
  } catch (error) {
    console.error('❌ [registerAdmin] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const register = async (req: Request, res: Response<ApiResponse>) => {
  try {
    const { name, email, password, role = 'employee', roleLabel, department, avatar, employeeId, phone, organizationId } = req.body;

    // Auto-generate missing fields
    const defaultRoleLabel: Record<string, string> = {
      'hr_manager': 'HR Manager',
      'team_manager': 'Team Manager',
      'employee': 'Employee',
    };

    const generatedRoleLabel = roleLabel || defaultRoleLabel[role] || 'Employee';
    const generatedDepartment = department || 'General';
    const generatedEmployeeId = employeeId || `TRX-${Date.now().toString().slice(-6)}`;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists',
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
      roleLabel: generatedRoleLabel,
      department: generatedDepartment,
      avatar: avatar || '',
      employeeId: generatedEmployeeId,
      phone: phone || '',
      organizationId,
    });

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: newUser,
    });
  } catch (error) {
    console.error('Register Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const getSuperAdmin = async (req: Request, res: Response<ApiResponse>) => {
  try {
    // Find super admin by role or by specific email
    let superAdmin = await User.findOne({ role: 'super_admin' }) || await User.findOne({ email: 'dheeraj01072001@gmail.com' });
    
    // If no super admin exists, create one
    if (!superAdmin) {
      superAdmin = await User.create({
        name: 'Dheeraj Kushwaha',
        email: 'dheeraj01072001@gmail.com',
        password: bcrypt.hashSync('@Dkushwaha123', 10),
        role: 'super_admin',
        roleLabel: 'Super Administrator',
        department: 'Administration',
        avatar: '',
        employeeId: 'TRX-SUPER-ADMIN',
        phone: '8299301972',
      });
      // console.log('✅ Created new Super Admin!');
    }

    res.json({
      success: true,
      data: superAdmin,
    });
  } catch (error) {
    console.error('Get Super Admin Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

// Update user settings (profile, theme, notifications, integrations, password, etc.)
export const updateSettings = async (req: Request, res: Response<ApiResponse>) => {
  try {
    const { userId } = req.params;
    const updateData = req.body;

    // If password is being updated, hash it
    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, 10);
    }

    // Update user in DB
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.json({
      success: true,
      message: 'Settings updated successfully',
      data: updatedUser,
    });
  } catch (error) {
    console.error('Update Settings Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

// Get current organization's trial/payment status
export const getOrganizationStatus = async (req: Request, res: Response<ApiResponse>) => {
  try {
    if (!req.organizationId) {
      return res.status(400).json({
        success: false,
        message: 'No organization found',
      });
    }

    const organization = await Organization.findById(req.organizationId);
    if (!organization) {
      return res.status(404).json({
        success: false,
        message: 'Organization not found',
      });
    }

    // Calculate remaining days if in trial
    let daysRemaining = null;
    if (!organization.isPaid) {
      const today = new Date();
      const timeDiff = organization.trialEndDate.getTime() - today.getTime();
      daysRemaining = Math.max(0, Math.ceil(timeDiff / (1000 * 3600 * 24)));
    }

    res.json({
      success: true,
      data: {
        ...organization.toJSON(),
        daysRemaining,
        isTrialActive: !organization.isPaid && daysRemaining !== null && daysRemaining > 0
      }
    });
  } catch (error) {
    console.error('Get Organization Status Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

// Mark organization as paid (simulating payment)
export const markOrganizationAsPaid = async (req: Request, res: Response<ApiResponse>) => {
  try {
    if (!req.organizationId) {
      return res.status(400).json({
        success: false,
        message: 'No organization found',
      });
    }

    const organization = await Organization.findById(req.organizationId);
    if (!organization) {
      return res.status(404).json({
        success: false,
        message: 'Organization not found',
      });
    }

    organization.isPaid = true;
    organization.paymentDate = new Date();
    await organization.save();

    res.json({
      success: true,
      message: 'Payment successful! Your organization now has full access.',
      data: organization
    });
  } catch (error) {
    console.error('Mark Organization As Paid Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

// Initialize Razorpay instance
const razorpayInstance = new Razorpay({
  key_id: env.RAZORPAY_KEY_ID,
  key_secret: env.RAZORPAY_KEY_SECRET,
});

// Create Razorpay payment order
export const createPaymentOrder = async (req: Request, res: Response<ApiResponse>) => {
  try {
    const { amount, currency } = req.body;

    if (!amount || !currency) {
      return res.status(400).json({
        success: false,
        message: 'Amount and currency are required',
      });
    }

    const options = {
      amount: amount,
      currency: currency,
      receipt: `receipt_${Date.now()}`,
    };

    const order = await razorpayInstance.orders.create(options);
    res.json({
      success: true,
      data: {
        id: order.id,
        amount: order.amount,
        currency: order.currency,
        receipt: order.receipt,
        key_id: env.RAZORPAY_KEY_ID,
      },
    });
  } catch (error) {
    console.error('Create Payment Order Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create payment order',
    });
  }
};

// Verify Razorpay payment
export const verifyPayment = async (req: Request, res: Response<ApiResponse>) => {
  try {
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;

    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: 'Missing payment details',
      });
    }

    if (!req.organizationId) {
      return res.status(400).json({
        success: false,
        message: 'No organization found',
      });
    }

    // Create signature to verify
    const signature = crypto
      .createHmac('sha256', env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (signature === razorpay_signature) {
      // Payment is valid - mark organization as paid
      const organization = await Organization.findById(req.organizationId);
      if (organization) {
        organization.isPaid = true;
        organization.paymentDate = new Date();
        await organization.save();
      }

      res.json({
        success: true,
        message: 'Payment verified successfully',
        data: organization,
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Invalid payment signature',
      });
    }
  } catch (error) {
    console.error('Verify Payment Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify payment',
    });
  }
};

// Verify payment AND create user/organization in one go
export const verifyPaymentAndRegister = async (req: Request, res: Response<ApiResponse>) => {
  try {
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature, registrationData, plan } = req.body;

    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: 'Missing payment details',
      });
    }
    if (!registrationData) {
      return res.status(400).json({
        success: false,
        message: 'Registration data missing',
      });
    }

    // Verify signature first
    const signature = crypto
      .createHmac('sha256', env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (signature !== razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment signature',
      });
    }

    // Now create organization and user!
    const existingUser = await User.findOne({ email: registrationData.email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered',
      });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(registrationData.password, saltRounds);

    // Create organization first
    const trialStartDate = new Date();
    const trialEndDate = new Date(trialStartDate);
    trialEndDate.setDate(trialEndDate.getDate() + 30);
    const newOrganization = await Organization.create({
      name: registrationData.organizationName,
      trialStartDate,
      trialEndDate,
      isPaid: true,
      paymentDate: new Date(),
      plan: plan || 'Basic', // Default to Basic if no plan provided
    });
    // console.log('✅ Organization created:', newOrganization._id);

    // Create user
    const newUser = await User.create({
      name: registrationData.name,
      email: registrationData.email,
      password: hashedPassword,
      role: 'hr_manager',
      organizationId: newOrganization._id,
    });
    // console.log('✅ User created:', newUser._id);

    // Update organization to set adminId
    newOrganization.adminId = newUser._id;
    await newOrganization.save();

    const userJson = newUser.toJSON();
    delete (userJson as any).password;

    res.status(201).json({
      success: true,
      message: 'Registration and payment successful!',
      data: { user: userJson, organization: newOrganization },
    });
  } catch (error) {
    console.error('Verify Payment and Register Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

// Get organization stats (for super admin only)
export const getOrganizationStats = async (req: Request, res: Response<ApiResponse>) => {
  try {
    // Check if user is super admin (by email or role)
    const userId = req.headers['x-user-id'];
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    const user = await User.findById(userId);
    if (!user || user.email !== 'dheeraj01072001@gmail.com') {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }

    // Get counts
    const freeTrialCount = await Organization.countDocuments({ isPaid: false });
    const paidCount = await Organization.countDocuments({ isPaid: true });

    // Get all organizations with their admin data
    const organizations = await Organization.aggregate([
      {
        $lookup: {
          from: 'users',
          localField: 'adminId',
          foreignField: '_id',
          as: 'admin'
        }
      },
      {
        $unwind: '$admin'
      },
      {
        $project: {
          _id: 1,
          name: 1,
          isPaid: 1,
          trialStartDate: 1,
          trialEndDate: 1,
          paymentDate: 1,
          createdAt: 1,
          plan: 1,
          'admin.name': 1,
          'admin.email': 1,
          'admin.employeeId': 1
        }
      }
    ]);

    res.json({
      success: true,
      data: { freeTrialCount, paidCount, organizations },
    });
  } catch (error) {
    console.error('Get Organization Stats Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

// Get all pricing plans (for everyone)
export const getPricing = async (req: Request, res: Response<ApiResponse>) => {
  try {
    const pricing = await Pricing.find();
    
    // Sort in fixed order: Basic → Pro → Enterprise
    const planOrder = ['Basic', 'Pro', 'Enterprise'];
    const sortedPricing = pricing.sort((a, b) => 
      planOrder.indexOf(a.plan) - planOrder.indexOf(b.plan)
    );
    
    res.json({
      success: true,
      data: sortedPricing,
    });
  } catch (error) {
    console.error('Get Pricing Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

// Update pricing (super admin only)
export const updatePricing = async (req: Request, res: Response<ApiResponse>) => {
  try {
    // Check if user is super admin
    const userId = req.headers['x-user-id'];
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }
    const user = await User.findById(userId);
    if (!user || user.email !== 'dheeraj01072001@gmail.com') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only super admin can update pricing.',
      });
    }

    // Update pricing
    const { plan, priceInr, priceUsd, employeeLimit, features } = req.body;
    if (!plan) {
      return res.status(400).json({
        success: false,
        message: 'Plan is required.',
      });
    }

    const updatedPricing = await Pricing.findOneAndUpdate(
      { plan },
      {
        priceInr: priceInr !== undefined ? priceInr : undefined,
        priceUsd: priceUsd !== undefined ? priceUsd : undefined,
        employeeLimit: employeeLimit !== undefined ? employeeLimit : undefined,
        features: features !== undefined ? features : undefined,
      },
      { new: true, upsert: true }
    );

    res.json({
      success: true,
      message: 'Pricing updated successfully.',
      data: updatedPricing,
    });
  } catch (error) {
    console.error('Update Pricing Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

