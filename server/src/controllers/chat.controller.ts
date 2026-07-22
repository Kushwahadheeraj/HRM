import { Request, Response } from 'express';
import ChatMessage from '../models/ChatMessage.model';
import Channel from '../models/Channel.model';
import { ApiResponse } from '../types';
import path from 'path';
import fs from 'fs';

// Ensure uploads directory exists
const UPLOAD_DIR = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

/**
 * Send a message to a channel
 */
export const sendMessage = async (req: Request, res: Response<ApiResponse>) => {
  try {
    const { channelId, content } = req.body;
    const userId = req.headers['x-user-id'] as string;
    const files: any[] = [];

    // Handle file uploads
    if (req.files) {
      // Handle both single file and multiple files
      const uploadedFiles = Array.isArray(req.files) ? req.files :
        Object.values(req.files).flat();

      for (const file of uploadedFiles as any) {
        const uniqueFileName = `${Date.now()}-${file.name}`;
        const filePath = path.join(UPLOAD_DIR, uniqueFileName);
        
        await file.mv(filePath);
        
        files.push({
          name: file.name,
          url: `/uploads/${uniqueFileName}`,
          type: file.mimetype,
          size: file.size,
        });
      }
    }

    // Create message
    const message = await ChatMessage.create({
      userId,
      channelId,
      content: content || '',
      files,
      organizationId: req.organizationId,
    });

    // Populate user data
    const populatedMessage = await ChatMessage.findById(message._id)
      .populate('userId', 'name email avatar');

    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: populatedMessage,
    });
  } catch (error) {
    console.error('Send Message Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * Get messages for a channel
 */
export const getChannelMessages = async (req: Request, res: Response<ApiResponse>) => {
  try {
    const { channelId } = req.params;
    const { limit = 50, before } = req.query;

    const filter: any = {
      channelId,
      isDeleted: false,
      organizationId: req.organizationId,
    };

    if (before) {
      filter.createdAt = { $lt: new Date(before as string) };
    }

    const messages = await ChatMessage.find(filter)
      .populate('userId', 'name email avatar')
      .sort({ createdAt: -1 })
      .limit(Number(limit));

    res.json({
      success: true,
      data: messages.reverse(),
    });
  } catch (error) {
    console.error('Get Channel Messages Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * Add reaction to a message
 */
export const addReaction = async (req: Request, res: Response<ApiResponse>) => {
  try {
    const { messageId } = req.params;
    const { emoji } = req.body;
    const userId = req.headers['x-user-id'] as string;

    const message = await ChatMessage.findById(messageId);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found',
      });
    }

    // Check if reaction already exists
    const reactionIndex = message.reactions?.findIndex(r => r.emoji === emoji);
    
    if (reactionIndex !== undefined && reactionIndex > -1) {
      // Check if user already reacted
      const userReaction = message.reactions![reactionIndex].users.find(u => u.toString() === userId);
      if (userReaction) {
        return res.status(400).json({
          success: false,
          message: 'You already reacted with this emoji',
        });
      }
      message.reactions![reactionIndex].users.push(userId as any);
    } else {
      // Add new reaction
      if (!message.reactions) message.reactions = [];
      message.reactions.push({
        emoji,
        users: [userId as any],
      });
    }

    await message.save();
    
    const populatedMessage = await ChatMessage.findById(messageId)
      .populate('userId', 'name email avatar');

    res.json({
      success: true,
      data: populatedMessage,
    });
  } catch (error) {
    console.error('Add Reaction Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * Remove reaction from a message
 */
export const removeReaction = async (req: Request, res: Response<ApiResponse>) => {
  try {
    const { messageId } = req.params;
    const { emoji } = req.body;
    const userId = req.headers['x-user-id'] as string;

    const message = await ChatMessage.findById(messageId);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found',
      });
    }

    const reactionIndex = message.reactions?.findIndex(r => r.emoji === emoji);
    if (reactionIndex === undefined || reactionIndex === -1) {
      return res.status(400).json({
        success: false,
        message: 'Reaction not found',
      });
    }

    message.reactions![reactionIndex].users = message.reactions![reactionIndex].users.filter(
      u => u.toString() !== userId
    );

    // Remove reaction if no users left
    if (message.reactions![reactionIndex].users.length === 0) {
      message.reactions!.splice(reactionIndex, 1);
    }

    await message.save();
    
    const populatedMessage = await ChatMessage.findById(messageId)
      .populate('userId', 'name email avatar');

    res.json({
      success: true,
      data: populatedMessage,
    });
  } catch (error) {
    console.error('Remove Reaction Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * Delete a message
 */
export const deleteMessage = async (req: Request, res: Response<ApiResponse>) => {
  try {
    const { messageId } = req.params;

    const message = await ChatMessage.findById(messageId);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found',
      });
    }

    // Soft delete
    message.isDeleted = true;
    await message.save();

    res.json({
      success: true,
      message: 'Message deleted successfully',
    });
  } catch (error) {
    console.error('Delete Message Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

