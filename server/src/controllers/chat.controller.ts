import { Request, Response } from 'express';
import ChatMessage from '../models/ChatMessage.model';
import Channel from '../models/Channel.model';
import User from '../models/User.model';
import { ApiResponse } from '../types';
import path from 'path';
import fs from 'fs';

const UPLOAD_DIR = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

export const sendMessage = async (req: Request, res: Response<ApiResponse>) => {
  try {
    const { channelId, content } = req.body;
    const userId = req.headers['x-user-id'] as string;
    const files: any[] = [];

    if (!channelId) {
      return res.status(400).json({
        success: false,
        message: 'Channel ID is required',
      });
    }

    const currentUser = await User.findById(userId);
    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    if (currentUser.role === 'hr_manager' || currentUser.role === 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Chat access not allowed for HR/Administrator users',
      });
    }

    const channel = await Channel.findById(channelId);
    if (!channel) {
      return res.status(404).json({
        success: false,
        message: 'Channel not found',
      });
    }

    const isParticipant = channel.participants.some(
      (p) => p.toString() === userId
    );
    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this channel',
      });
    }

    if (req.files) {
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

    const message = await ChatMessage.create({
      userId,
      channelId,
      content: content || '',
      files,
      organizationId: req.organizationId,
    });

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

export const getChannelMessages = async (req: Request, res: Response<ApiResponse>) => {
  try {
    const { channelId } = req.params;
    const { limit = 50, before } = req.query;
    const userId = req.headers['x-user-id'] as string;

    const channel = await Channel.findById(channelId);
    if (!channel) {
      return res.status(404).json({
        success: false,
        message: 'Channel not found',
      });
    }

    const isParticipant = channel.participants.some(
      (p) => p.toString() === userId
    );
    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this channel',
      });
    }

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

    const channel = await Channel.findById(message.channelId);
    if (channel) {
      const isParticipant = channel.participants.some(
        (p) => p.toString() === userId
      );
      if (!isParticipant) {
        return res.status(403).json({
          success: false,
          message: 'You do not have access to this channel',
        });
      }
    }

    const reactionIndex = message.reactions?.findIndex(r => r.emoji === emoji);

    if (reactionIndex !== undefined && reactionIndex > -1) {
      const userReaction = message.reactions![reactionIndex].users.find(u => u.toString() === userId);
      if (userReaction) {
        return res.status(400).json({
          success: false,
          message: 'You already reacted with this emoji',
        });
      }
      message.reactions![reactionIndex].users.push(userId as any);
    } else {
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

    const channel = await Channel.findById(message.channelId);
    if (channel) {
      const isParticipant = channel.participants.some(
        (p) => p.toString() === userId
      );
      if (!isParticipant) {
        return res.status(403).json({
          success: false,
          message: 'You do not have access to this channel',
        });
      }
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

export const deleteMessage = async (req: Request, res: Response<ApiResponse>) => {
  try {
    const { messageId } = req.params;
    const userId = req.headers['x-user-id'] as string;

    const message = await ChatMessage.findById(messageId);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found',
      });
    }

    const channel = await Channel.findById(message.channelId);
    if (channel) {
      const isParticipant = channel.participants.some(
        (p) => p.toString() === userId
      );
      if (!isParticipant) {
        return res.status(403).json({
          success: false,
          message: 'You do not have access to this channel',
        });
      }
    }

    if (message.userId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own messages',
      });
    }

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
