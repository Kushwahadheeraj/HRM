import { Request, Response } from 'express';
import Notification from '../models/Notification.model';
import { ApiResponse } from '../types';

export const getNotifications = async (req: Request, res: Response<ApiResponse>) => {
  try {
    const { userId } = req.query;
    const query: any = {};
    if (req.organizationId) query.organizationId = req.organizationId;
    if (userId) {
      query.userId = userId;
    }
    const notifications = await Notification.find(query).sort({ createdAt: -1 });
    res.json({
      success: true,
      data: notifications,
    });
  } catch (error) {
    console.error('Get Notifications Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const createNotification = async (req: Request, res: Response<ApiResponse>) => {
  try {
    const notificationData = {
      ...req.body,
      organizationId: req.organizationId
    };
    const notification = await Notification.create(notificationData);
    res.status(201).json({
      success: true,
      message: 'Notification created successfully',
      data: notification,
    });
  } catch (error) {
    console.error('Create Notification Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const updateNotification = async (req: Request, res: Response<ApiResponse>) => {
  try {
    const { id } = req.params;
    const filter: any = { _id: id };
    if (req.organizationId) filter.organizationId = req.organizationId;
    const updatedNotification = await Notification.findOneAndUpdate(filter, req.body, {
      new: true,
      runValidators: true,
    });
    if (!updatedNotification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found',
      });
    }
    res.json({
      success: true,
      message: 'Notification updated successfully',
      data: updatedNotification,
    });
  } catch (error) {
    console.error('Update Notification Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const markAsRead = async (req: Request, res: Response<ApiResponse>) => {
  try {
    const { id } = req.params;
    const filter: any = { _id: id };
    if (req.organizationId) filter.organizationId = req.organizationId;
    const updatedNotification = await Notification.findOneAndUpdate(filter, { read: true }, {
      new: true,
    });
    if (!updatedNotification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found',
      });
    }
    res.json({
      success: true,
      message: 'Notification marked as read',
      data: updatedNotification,
    });
  } catch (error) {
    console.error('Mark As Read Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};
