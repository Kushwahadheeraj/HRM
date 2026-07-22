import { Request, Response } from 'express';
import Message from '../models/Message.model';
import { ApiResponse } from '../types';

export const getMessages = async (req: Request, res: Response<ApiResponse>) => {
  try {
    const { userId1, userId2 } = req.query;
    const filter: any = {
      $or: [
        { from: userId1, to: userId2 },
        { from: userId2, to: userId1 }
      ]
    };
    if (req.organizationId) filter.organizationId = req.organizationId;
    const messages = await Message.find(filter)
      .sort({ createdAt: 1 })
      .populate('from', 'name')
      .populate('to', 'name');
    res.json({ success: true, data: messages });
  } catch (error) {
    console.error('Get Messages Error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const sendMessage = async (req: Request, res: Response<ApiResponse>) => {
  try {
    const { from, to, content } = req.body;
    const newMessage = await Message.create({ 
      from, 
      to, 
      content, 
      organizationId: req.organizationId 
    });
    await newMessage.populate('from', 'name');
    await newMessage.populate('to', 'name');
    res.status(201).json({ success: true, message: 'Message sent', data: newMessage });
  } catch (error) {
    console.error('Send Message Error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const markAsRead = async (req: Request, res: Response<ApiResponse>) => {
  try {
    const { messageId } = req.params;
    const filter: any = { _id: messageId };
    if (req.organizationId) filter.organizationId = req.organizationId;
    const updatedMessage = await Message.findOneAndUpdate(
      filter,
      { read: true },
      { new: true }
    );
    res.json({ success: true, data: updatedMessage });
  } catch (error) {
    console.error('Mark As Read Error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const getMessagesForUser = async (req: Request, res: Response<ApiResponse>) => {
  try {
    const { userId } = req.params;
    const filter: any = {
      $or: [{ from: userId }, { to: userId }]
    };
    if (req.organizationId) filter.organizationId = req.organizationId;
    const messages = await Message.find(filter)
      .sort({ createdAt: -1 })
      .populate('from', 'name')
      .populate('to', 'name');
    res.json({ success: true, data: messages });
  } catch (error) {
    console.error('Get Messages For User Error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
