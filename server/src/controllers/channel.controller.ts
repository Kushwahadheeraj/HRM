import { Request, Response } from 'express';
import Channel from '../models/Channel.model';
import User from '../models/User.model';
import Employee from '../models/Employee.model';
import ChatMessage from '../models/ChatMessage.model';
import { ApiResponse } from '../types';

/**
 * Get all channels (team chat and DMs) for current user
 */
export const getChannels = async (req: Request, res: Response<ApiResponse>) => {
  try {
    console.log('getChannels called');
    
    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required',
      });
    }

    const currentUser = await User.findById(userId);
    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Get or create team chat channel
    let teamChannel = await Channel.findOne({
      organizationId: req.organizationId,
      type: 'team',
    }).populate('participants', 'name email avatar');
    
    if (!teamChannel) {
      teamChannel = await Channel.create({
        name: 'Team Chat',
        type: 'team',
        organizationId: req.organizationId,
        participants: [userId],
        description: 'Team group chat',
        createdBy: userId,
      });
      await teamChannel.populate('participants', 'name email avatar');
    }

    const directChannels = await Channel.find({
      organizationId: req.organizationId,
      type: 'direct',
      participants: userId,
    }).populate('participants', 'name email avatar');

    const channels = [teamChannel, ...directChannels];

    res.json({
      success: true,
      data: channels,
    });
  } catch (error) {
    console.error('Get Channels Error:', error);
    res.json({
      success: true,
      data: [],
    });
  }
};

/**
 * Get team members for current user
 */
export const getTeamMembers = async (req: Request, res: Response<ApiResponse>) => {
  try {
    console.log('getTeamMembers called');
    
    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required',
      });
    }

    const currentUser = await User.findById(userId);
    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Get team members:
    // 1. If current user has a manager: include manager + others with same manager
    // 2. If current user is a manager: include their direct reports
    // Also exclude Administration users
    const query: any = {
      organizationId: req.organizationId,
      _id: { $ne: userId },
      department: { $ne: 'Administration' },
    };

    if (currentUser.manager) {
      // Current user has a manager: team is manager + others with same manager
      query.$or = [
        { _id: currentUser.manager },
        { manager: currentUser.manager }
      ];
    } else {
      // Current user might be a manager: find users who have them as manager
      query.$or = [
        { manager: userId },
        // Also include other users in same department if no manager set?
        { department: currentUser.department }
      ];
    }

    let userMembers = await User.find(query);

    res.json({
      success: true,
      data: userMembers,
    });
  } catch (error) {
    console.error('Get Team Members Error:', error);
    res.json({
      success: true,
      data: [],
    });
  }
};

/**
 * Get or create direct channel with another user
 */
export const getOrCreateDirectChannel = async (req: Request, res: Response<ApiResponse>) => {
  try {
    console.log('getOrCreateDirectChannel');
    
    const userId = req.headers['x-user-id'] as string;
    const { targetUserId } = req.body;
    
    if (!targetUserId) {
      return res.status(400).json({
        success: false,
        message: 'Target user ID is required',
      });
    }

    let channel = await Channel.findOne({
      organizationId: req.organizationId,
      type: 'direct',
      participants: { $all: [userId, targetUserId] },
    }).populate('participants', 'name email avatar');

    if (!channel) {
      channel = await Channel.create({
        name: 'Direct Chat',
        type: 'direct',
        organizationId: req.organizationId,
        participants: [userId, targetUserId],
        createdBy: userId,
      });
      await channel.populate('participants', 'name email avatar');
    }

    res.json({
      success: true,
      data: channel,
    });
  } catch (error) {
    console.error('Get/Create DM Channel Error:', error);
    res.status(500).json({
      success: false,
      message: 'Could not create DM channel',
    });
  }
};

/**
 * Get a channel by ID with messages
 */
export const getChannel = async (req: Request, res: Response<ApiResponse>) => {
  try {
    console.log('getChannel called for ID:', req.params.channelId);
    
    const { channelId } = req.params;
    
    const channel = await Channel.findById(channelId)
      .populate('participants', 'name email avatar');
      
    if (!channel) {
      return res.status(404).json({
        success: false,
        message: 'Channel not found',
      });
    }

    const messages = await ChatMessage.find({
      channelId,
      isDeleted: false,
      organizationId: req.organizationId,
    })
      .populate('userId', 'name email avatar')
      .sort({ createdAt: 1 });

    res.json({
      success: true,
      data: {
        channel,
        messages,
      },
    });
  } catch (error) {
    console.error('Get Channel Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};
