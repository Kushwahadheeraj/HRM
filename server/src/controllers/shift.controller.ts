import { Request, Response } from 'express';
import Shift from '../models/Shift.model';
import { ApiResponse } from '../types';

export const getShifts = async (req: Request, res: Response<ApiResponse>) => {
  try {
    const { department, isActive } = req.query;
    const filter: any = {};
    if (req.organizationId) filter.organizationId = req.organizationId;
    if (department) filter.department = department;
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    
    const shifts = await Shift.find(filter);
    res.json({
      success: true,
      data: shifts,
    });
  } catch (error) {
    // console.error('Get Shifts Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const getShiftById = async (req: Request, res: Response<ApiResponse>) => {
  try {
    const { id } = req.params;
    const filter: any = { _id: id };
    if (req.organizationId) filter.organizationId = req.organizationId;
    const shift = await Shift.findOne(filter);
    
    if (!shift) {
      return res.status(404).json({
        success: false,
        message: 'Shift not found',
      });
    }
    
    res.json({
      success: true,
      data: shift,
    });
  } catch (error) {
    // console.error('Get Shift Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const createShift = async (req: Request, res: Response<ApiResponse>) => {
  try {
    const shiftData = { ...req.body, organizationId: req.organizationId };
    const newShift = await Shift.create(shiftData);
    res.status(201).json({
      success: true,
      message: 'Shift created successfully',
      data: newShift,
    });
  } catch (error) {
    // console.error('Create Shift Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const updateShift = async (req: Request, res: Response<ApiResponse>) => {
  try {
    const { id } = req.params;
    const filter: any = { _id: id };
    if (req.organizationId) filter.organizationId = req.organizationId;
    const updatedShift = await Shift.findOneAndUpdate(filter, req.body, {
      new: true,
      runValidators: true,
    });
    
    if (!updatedShift) {
      return res.status(404).json({
        success: false,
        message: 'Shift not found',
      });
    }
    
    res.json({
      success: true,
      message: 'Shift updated successfully',
      data: updatedShift,
    });
  } catch (error) {
    // console.error('Update Shift Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const deleteShift = async (req: Request, res: Response<ApiResponse>) => {
  try {
    const { id } = req.params;
    const filter: any = { _id: id };
    if (req.organizationId) filter.organizationId = req.organizationId;
    const shift = await Shift.findOneAndDelete(filter);
    
    if (!shift) {
      return res.status(404).json({
        success: false,
        message: 'Shift not found',
      });
    }
    
    res.json({
      success: true,
      message: 'Shift deleted successfully',
    });
  } catch (error) {
    // console.error('Delete Shift Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};
