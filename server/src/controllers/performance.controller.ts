import { Request, Response } from 'express';
import Performance from '../models/Performance.model';
import { ApiResponse } from '../types';

export const getAllPerformances = async (req: Request, res: Response<ApiResponse>) => {
  try {
    const { month, year, managerName, employeeId } = req.query;
    let query: any = {};
    if (req.organizationId) query.organizationId = req.organizationId;
    if (month) query.month = month;
    if (year) query.year = Number(year);
    if (managerName) query.managerName = managerName;
    if (employeeId) query.employeeId = employeeId; // Filter by employeeId for employees viewing their own performance

    const performances = await Performance.find(query).sort({ createdAt: -1 });
    res.json({
      success: true,
      data: performances,
    });
  } catch (error) {
    console.error('Get Performances Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const getPerformanceById = async (req: Request, res: Response<ApiResponse>) => {
  try {
    const { id } = req.params;
    const filter: any = { _id: id };
    if (req.organizationId) filter.organizationId = req.organizationId;
    const performance = await Performance.findOne(filter);
    if (!performance) {
      return res.status(404).json({
        success: false,
        message: 'Performance not found',
      });
    }
    res.json({
      success: true,
      data: performance,
    });
  } catch (error) {
    console.error('Get Performance Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const createPerformance = async (req: Request, res: Response<ApiResponse>) => {
  try {
    const { teamwork, innovation, communication, ...rest } = req.body;
    const overallScore = Math.round((teamwork + innovation + communication) / 3);
    
    const performance = await Performance.create({
      ...rest,
      teamwork,
      innovation,
      communication,
      overallScore,
      organizationId: req.organizationId,
    });
    
    res.status(201).json({
      success: true,
      message: 'Performance created successfully',
      data: performance,
    });
  } catch (error) {
    console.error('Create Performance Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const updatePerformance = async (req: Request, res: Response<ApiResponse>) => {
  try {
    const { id } = req.params;
    const { teamwork, innovation, communication, ...rest } = req.body;
    const overallScore = teamwork !== undefined && innovation !== undefined && communication !== undefined 
      ? Math.round((teamwork + innovation + communication) / 3) 
      : undefined;
      
    const filter: any = { _id: id };
    if (req.organizationId) filter.organizationId = req.organizationId;
    const updatedPerformance = await Performance.findOneAndUpdate(
      filter, 
      { ...rest, ...(overallScore !== undefined ? { teamwork, innovation, communication, overallScore } : {}) }, 
      {
        new: true,
        runValidators: true,
      }
    );
    
    if (!updatedPerformance) {
      return res.status(404).json({
        success: false,
        message: 'Performance not found',
      });
    }
    
    res.json({
      success: true,
      message: 'Performance updated successfully',
      data: updatedPerformance,
    });
  } catch (error) {
    console.error('Update Performance Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const deletePerformance = async (req: Request, res: Response<ApiResponse>) => {
  try {
    const { id } = req.params;
    const filter: any = { _id: id };
    if (req.organizationId) filter.organizationId = req.organizationId;
    const performance = await Performance.findOneAndDelete(filter);
    if (!performance) {
      return res.status(404).json({
        success: false,
        message: 'Performance not found',
      });
    }
    res.json({
      success: true,
      message: 'Performance deleted successfully',
    });
  } catch (error) {
    console.error('Delete Performance Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};
