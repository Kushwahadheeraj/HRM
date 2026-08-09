import { Request, Response } from 'express';
import OutOfOfficeApproval, { IOutOfOfficeApproval } from '../models/OutOfOfficeApproval.model';
import User from '../models/User.model';
import { ApiResponse } from '../types';

const getTodayDate = (): string => {
  return new Date().toISOString().split('T')[0];
};

const timeToMinutes = (time: string): number => {
  if (!time) return 0;
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

export const isApprovalActiveNow = (approval: IOutOfOfficeApproval): boolean => {
  if (approval.approvalStatus !== 'approved') return false;
  const today = getTodayDate();
  if (approval.requestDate !== today) return false;
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const startMinutes = timeToMinutes(approval.startTime);
  const endMinutes = timeToMinutes(approval.endTime);
  return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
};

export const createOutOfOfficeRequest = async (req: Request, res: Response<ApiResponse>) => {
  try {
    const {
      employeeId,
      reason,
      description,
      requestDate,
      startTime,
      endTime,
      fullDay,
      requestedLocation,
    } = req.body;

    if (!employeeId) {
      return res.status(400).json({
        success: false,
        message: 'Employee ID is required',
      });
    }

    const employeeQuery: any = { employeeId };
    if (req.organizationId) employeeQuery.organizationId = req.organizationId;
    const employee = await User.findOne(employeeQuery);

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found',
      });
    }

    const dataToCreate: any = {
      employeeId,
      employeeName: employee.name,
      email: employee.email,
      department: employee.department,
      organizationId: req.organizationId || employee.organizationId,
      reason: reason || 'Out of office work',
      description: description || '',
      requestDate: requestDate || getTodayDate(),
      startTime: startTime || '09:00',
      endTime: endTime || '18:00',
      fullDay: fullDay !== undefined ? !!fullDay : true,
      approvalStatus: 'pending',
      isCurrentlyActive: false,
    };

    if (requestedLocation && requestedLocation.latitude && requestedLocation.longitude) {
      dataToCreate.requestedLocation = {
        latitude: requestedLocation.latitude,
        longitude: requestedLocation.longitude,
        address: requestedLocation.address || '',
      };
    }

    const request = await OutOfOfficeApproval.create(dataToCreate);

    res.status(201).json({
      success: true,
      message: 'Out-of-office request created successfully. Awaiting HR approval.',
      data: request,
    });
  } catch (error) {
    console.error('Create Out-of-Office Request Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const getMyOutOfOfficeRequests = async (req: Request, res: Response<ApiResponse>) => {
  try {
    const { employeeId } = req.params;
    const { startDate, endDate, approvalStatus } = req.query;
    const filter: any = { employeeId };
    if (req.organizationId) filter.organizationId = req.organizationId;
    if (approvalStatus) filter.approvalStatus = approvalStatus;
    if (startDate && endDate) {
      filter.requestDate = { $gte: startDate, $lte: endDate };
    } else if (startDate) {
      filter.requestDate = { $gte: startDate };
    } else if (endDate) {
      filter.requestDate = { $lte: endDate };
    }
    const requests = await OutOfOfficeApproval.find(filter)
      .sort({ requestDate: -1, createdAt: -1 });

    res.json({
      success: true,
      data: requests,
    });
  } catch (error) {
    console.error('Get My Out-of-Office Requests Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const getAllOutOfOfficeRequests = async (req: Request, res: Response<ApiResponse>) => {
  try {
    const { startDate, endDate, approvalStatus, employeeId, department } = req.query;
    const filter: any = {};
    if (req.organizationId) filter.organizationId = req.organizationId;
    if (approvalStatus) filter.approvalStatus = approvalStatus;
    if (employeeId) filter.employeeId = employeeId;
    if (department) filter.department = department;
    if (startDate && endDate) {
      filter.requestDate = { $gte: startDate, $lte: endDate };
    } else if (startDate) {
      filter.requestDate = { $gte: startDate };
    } else if (endDate) {
      filter.requestDate = { $lte: endDate };
    }
    const requests = await OutOfOfficeApproval.find(filter)
      .sort({ requestDate: -1, createdAt: -1 });

    res.json({
      success: true,
      data: requests,
    });
  } catch (error) {
    console.error('Get All Out-of-Office Requests Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const getPendingOutOfOfficeRequests = async (req: Request, res: Response<ApiResponse>) => {
  try {
    const filter: any = { approvalStatus: 'pending' };
    if (req.organizationId) filter.organizationId = req.organizationId;
    const requests = await OutOfOfficeApproval.find(filter)
      .sort({ requestDate: -1, createdAt: -1 });

    res.json({
      success: true,
      data: requests,
    });
  } catch (error) {
    console.error('Get Pending Out-of-Office Requests Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const approveOutOfOfficeRequest = async (req: Request, res: Response<ApiResponse>) => {
  try {
    const { id } = req.params;
    const { approvedBy, approvedByName } = req.body;

    const filter: any = { _id: id, approvalStatus: 'pending' };
    if (req.organizationId) filter.organizationId = req.organizationId;

    const updateData: any = {
      approvalStatus: 'approved',
      approvedBy: approvedBy || 'HR',
      approvedByName: approvedByName || 'HR Manager',
      approvedAt: new Date(),
      isCurrentlyActive: true,
    };

    const request = await OutOfOfficeApproval.findOneAndUpdate(filter, updateData, { new: true, runValidators: true });

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Pending request not found',
      });
    }

    res.json({
      success: true,
      message: `Out-of-office request approved for ${request.employeeName}. Employee can now work outside office geofence without auto clock-out.`,
      data: request,
    });
  } catch (error) {
    console.error('Approve Out-of-Office Request Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const rejectOutOfOfficeRequest = async (req: Request, res: Response<ApiResponse>) => {
  try {
    const { id } = req.params;
    const { rejectedBy, rejectedByName, rejectionReason } = req.body;

    const filter: any = { _id: id, approvalStatus: 'pending' };
    if (req.organizationId) filter.organizationId = req.organizationId;

    const updateData: any = {
      approvalStatus: 'rejected',
      rejectedBy: rejectedBy || 'HR',
      rejectedByName: rejectedByName || 'HR Manager',
      rejectedAt: new Date(),
      rejectionReason: rejectionReason || 'Request rejected by HR',
      isCurrentlyActive: false,
    };

    const request = await OutOfOfficeApproval.findOneAndUpdate(filter, updateData, { new: true, runValidators: true });

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Pending request not found',
      });
    }

    res.json({
      success: true,
      message: `Out-of-office request rejected for ${request.employeeName}`,
      data: request,
    });
  } catch (error) {
    console.error('Reject Out-of-Office Request Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const cancelOutOfOfficeRequest = async (req: Request, res: Response<ApiResponse>) => {
  try {
    const { id } = req.params;
    const { cancelledBy } = req.body;

    const filter: any = { _id: id, approvalStatus: { $in: ['pending', 'approved'] } };
    if (req.organizationId) filter.organizationId = req.organizationId;

    const request = await OutOfOfficeApproval.findOneAndUpdate(
      filter,
      {
        approvalStatus: 'cancelled',
        cancelledBy: cancelledBy || 'System',
        cancelledAt: new Date(),
        isCurrentlyActive: false,
      },
      { new: true, runValidators: true }
    );

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Request not found or already cancelled/rejected',
      });
    }

    res.json({
      success: true,
      message: 'Out-of-office request cancelled successfully',
      data: request,
    });
  } catch (error) {
    console.error('Cancel Out-of-Office Request Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const getActiveOutOfOfficeApproval = async (
  employeeId: string,
  organizationId: string | undefined
): Promise<IOutOfOfficeApproval | null> => {
  try {
    const filter: any = {
      employeeId,
      approvalStatus: 'approved',
      isCurrentlyActive: true,
    };
    if (organizationId) filter.organizationId = organizationId;

    const approvals = await OutOfOfficeApproval.find(filter).sort({ requestDate: -1 });
    const activeApproval = approvals.find(ap => isApprovalActiveNow(ap));
    return activeApproval || null;
  } catch (error) {
    console.error('Get Active Out-of-Office Approval Error:', error);
    return null;
  }
};
