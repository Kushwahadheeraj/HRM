import { Request, Response } from 'express';
import LeaveBalance from '../models/LeaveBalance.model';
import Leave from '../models/Leave.model';
import { ApiResponse } from '../types';

export const getEmployeeLeaveBalance = async (req: Request, res: Response<ApiResponse>) => {
  try {
    const { employeeId } = req.params;
    const filter: any = { employeeId };
    if (req.organizationId) filter.organizationId = req.organizationId;
    
    // First, get or create leave balance records for the employee
    const defaultBalances = [
      { type: 'annual' as const, total: 20 },
      { type: 'sick' as const, total: 10 },
      { type: 'personal' as const, total: 5 },
      { type: 'maternity' as const, total: 180 },
      { type: 'paternity' as const, total: 30 },
      { type: 'remote' as const, total: 24 }
    ];

    // Get existing balances
    let balances = await LeaveBalance.find(filter);
    
    // If no balances exist, create default ones
    if (balances.length === 0) {
      const newBalances = defaultBalances.map(b => ({
        employeeId,
        type: b.type,
        used: 0,
        total: b.total,
        organizationId: req.organizationId
      }));
      balances = await LeaveBalance.create(newBalances);
    }

    // Calculate used days from approved leaves
    const leaveFilter: any = { 
      employeeId, 
      status: 'approved' 
    };
    if (req.organizationId) leaveFilter.organizationId = req.organizationId;
    const approvedLeaves = await Leave.find(leaveFilter);

    const usedDays: Record<string, number> = {};
    approvedLeaves.forEach(leave => {
      usedDays[leave.type] = (usedDays[leave.type] || 0) + leave.days;
    });

    // Update balances with calculated used days
    for (let i = 0; i < balances.length; i++) {
      const type = balances[i].type as string;
      const used = usedDays[type] || 0;
      if (balances[i].used !== used) {
        balances[i].used = used;
        await balances[i].save();
      }
    }

    // Get updated balances
    const updatedBalances = await LeaveBalance.find(filter);

    res.json({
      success: true,
      data: updatedBalances
    });
  } catch (error) {
    console.error('Get Employee Leave Balance Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const updateLeaveBalance = async (req: Request, res: Response<ApiResponse>) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const filter: any = { _id: id };
    if (req.organizationId) filter.organizationId = req.organizationId;

    const updatedBalance = await LeaveBalance.findOneAndUpdate(
      filter,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedBalance) {
      return res.status(404).json({
        success: false,
        message: 'Leave balance not found'
      });
    }

    res.json({
      success: true,
      message: 'Leave balance updated successfully',
      data: updatedBalance
    });
  } catch (error) {
    console.error('Update Leave Balance Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};
