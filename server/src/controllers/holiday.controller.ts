import { Request, Response } from 'express';
import Holiday from '../models/Holiday.model';
import { ApiResponse } from '../types';

export const getHolidays = async (req: Request, res: Response<ApiResponse>) => {
  try {
    const { year, type, isActive } = req.query;
    const filter: any = {};
    if (req.organizationId) filter.organizationId = req.organizationId;
    if (year) {
      const startDate = `${year}-01-01`;
      const endDate = `${year}-12-31`;
      filter.date = { $gte: startDate, $lte: endDate };
    }
    if (type) filter.type = type;
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    
    const holidays = await Holiday.find(filter).sort({ date: 1 });
    res.json({
      success: true,
      data: holidays,
    });
  } catch (error) {
    console.error('Get Holidays Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const getHolidayById = async (req: Request, res: Response<ApiResponse>) => {
  try {
    const { id } = req.params;
    const filter: any = { _id: id };
    if (req.organizationId) filter.organizationId = req.organizationId;
    const holiday = await Holiday.findOne(filter);
    
    if (!holiday) {
      return res.status(404).json({
        success: false,
        message: 'Holiday not found',
      });
    }
    
    res.json({
      success: true,
      data: holiday,
    });
  } catch (error) {
    console.error('Get Holiday Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const createHoliday = async (req: Request, res: Response<ApiResponse>) => {
  try {
    const holidayData = { ...req.body, organizationId: req.organizationId };
    const newHoliday = await Holiday.create(holidayData);
    res.status(201).json({
      success: true,
      message: 'Holiday created successfully',
      data: newHoliday,
    });
  } catch (error) {
    console.error('Create Holiday Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const updateHoliday = async (req: Request, res: Response<ApiResponse>) => {
  try {
    const { id } = req.params;
    const filter: any = { _id: id };
    if (req.organizationId) filter.organizationId = req.organizationId;
    const updatedHoliday = await Holiday.findOneAndUpdate(filter, req.body, {
      new: true,
      runValidators: true,
    });
    
    if (!updatedHoliday) {
      return res.status(404).json({
        success: false,
        message: 'Holiday not found',
      });
    }
    
    res.json({
      success: true,
      message: 'Holiday updated successfully',
      data: updatedHoliday,
    });
  } catch (error) {
    console.error('Update Holiday Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const deleteHoliday = async (req: Request, res: Response<ApiResponse>) => {
  try {
    const { id } = req.params;
    const filter: any = { _id: id };
    if (req.organizationId) filter.organizationId = req.organizationId;
    const holiday = await Holiday.findOneAndDelete(filter);
    
    if (!holiday) {
      return res.status(404).json({
        success: false,
        message: 'Holiday not found',
      });
    }
    
    res.json({
      success: true,
      message: 'Holiday deleted successfully',
    });
  } catch (error) {
    console.error('Delete Holiday Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};
