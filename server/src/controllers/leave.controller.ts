import { Request, Response } from 'express';
import Leave from '../models/Leave.model';
import Employee from '../models/Employee.model';
import Notification from '../models/Notification.model';
import User from '../models/User.model';
import { ApiResponse, LeaveRequest } from '../types';

export const getLeaves = async (req: Request, res: Response<ApiResponse>) => {
  try {
    const query = req.organizationId ? { organizationId: req.organizationId } : {};
    const leaves = await Leave.find(query).sort({ createdAt: -1 });
    res.json({
      success: true,
      data: leaves,
    });
  } catch (error) {
    console.error('Get Leaves Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const getEmployeeLeaves = async (req: Request, res: Response<ApiResponse>) => {
  try {
    const { employeeId } = req.params;
    const query: any = { employeeId };
    if (req.organizationId) query.organizationId = req.organizationId;
    const leaves = await Leave.find(query).sort({ createdAt: -1 });
    res.json({
      success: true,
      data: leaves,
    });
  } catch (error) {
    console.error('Get Employee Leaves Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const updateLeaveRequestStatus = async (req: Request, res: Response<ApiResponse>) => {
  try {
    const { id } = req.params;
    const { status, role } = req.body as { status: LeaveRequest['status']; role?: string };

    // Only HR Manager can approve/reject leaves
    if (role !== 'hr_manager') {
      return res.status(403).json({
        success: false,
        message: 'Only HR Manager can approve/reject leave requests',
      });
    }

    const validStatuses = ['pending', 'approved', 'rejected'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status',
      });
    }

    const updatedLeave = await Leave.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true }
    );

    if (!updatedLeave) {
      return res.status(404).json({
        success: false,
        message: 'Leave request not found',
      });
    }

    // Update employee status if leave is approved
    if (status === 'approved') {
      await Employee.findOneAndUpdate(
        { employeeId: updatedLeave.employeeId },
        { status: 'on-leave' },
        { new: true }
      );
    }
    
    // Notify employee about status update
    const employeeUser = await User.findOne({ employeeId: updatedLeave.employeeId });
    if (employeeUser) {
      const now = new Date();
      const timeString = now.toLocaleString();
      
      await Notification.create({
        userId: employeeUser._id,
        title: `Leave Request ${status.charAt(0).toUpperCase() + status.slice(1)}`,
        message: `Your ${updatedLeave.days} days ${updatedLeave.type} leave (${updatedLeave.startDate} to ${updatedLeave.endDate}) has been ${status}`,
        type: status === 'approved' ? 'success' : status === 'rejected' ? 'error' : 'info',
        time: timeString,
        read: false
      });
    }

    res.json({
      success: true,
      message: 'Leave status updated successfully',
      data: updatedLeave,
    });
  } catch (error) {
    console.error('Update Leave Status Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const createLeave = async (req: Request, res: Response<ApiResponse>) => {
  try {
    const leaveData = { ...req.body, organizationId: req.organizationId };
    const newLeave = await Leave.create(leaveData);
    
    // Get current time string for notification
    const now = new Date();
    const timeString = now.toLocaleString();
    
    // Find HR managers (from same organization) to notify
    const hrManagersQuery: any = { role: 'hr_manager' };
    if (req.organizationId) hrManagersQuery.organizationId = req.organizationId;
    const hrManagers = await User.find(hrManagersQuery);
    
    // Create notifications for HR managers
    for (const hrManager of hrManagers) {
      await Notification.create({
        userId: hrManager._id,
        organizationId: req.organizationId,
        title: 'New Leave Request',
        message: `${leaveData.employeeName} requested ${leaveData.days} days ${leaveData.type} leave (${leaveData.startDate} to ${leaveData.endDate})`,
        type: 'warning',
        time: timeString,
        read: false
      });
    }
    
    // If leave is created by someone else (team manager), notify the employee
    if (leaveData.createdBy && leaveData.createdBy !== leaveData.employeeId) {
      const employeeUserQuery: any = { employeeId: leaveData.employeeId };
      if (req.organizationId) employeeUserQuery.organizationId = req.organizationId;
      const employeeUser = await User.findOne(employeeUserQuery);
      if (employeeUser) {
        await Notification.create({
          userId: employeeUser._id,
          organizationId: req.organizationId,
          title: 'Leave Request Submitted',
          message: `Your ${leaveData.days} days ${leaveData.type} leave (${leaveData.startDate} to ${leaveData.endDate}) has been submitted`,
          type: 'info',
          time: timeString,
          read: false
        });
      }
    }
    
    res.status(201).json({
      success: true,
      message: 'Leave request created successfully',
      data: newLeave,
    });
  } catch (error) {
    console.error('Create Leave Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const deleteLeave = async (req: Request, res: Response<ApiResponse>) => {
  try {
    const { id } = req.params;
    const deletedLeave = await Leave.findByIdAndDelete(id);
    if (!deletedLeave) {
      return res.status(404).json({ success: false, message: 'Leave request not found' });
    }
    res.json({
      success: true,
      message: 'Leave request deleted successfully',
    });
  } catch (error) {
    console.error('Delete Leave Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

// Get team leaves (for team managers)
export const getTeamLeaves = async (req: Request, res: Response<ApiResponse>) => {
  try {
    const { managerName } = req.params;
    const { status } = req.query;

    // Get all employees under this manager (from same organization)
    const employeeQuery: any = { manager: managerName };
    if (req.organizationId) employeeQuery.organizationId = req.organizationId;
    const employees = await Employee.find(employeeQuery);
    const employeeIds = employees.map(emp => emp.employeeId);

    // Build leave filter
    const filter: any = { employeeId: { $in: employeeIds } };
    if (req.organizationId) filter.organizationId = req.organizationId;
    if (status) filter.status = status;

    const leaves = await Leave.find(filter).sort({ createdAt: -1 });
    res.json({
      success: true,
      data: leaves,
    });
  } catch (error) {
    console.error('Get Team Leaves Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};