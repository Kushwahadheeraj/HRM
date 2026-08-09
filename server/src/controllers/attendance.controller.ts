import { Request, Response } from 'express';
import Attendance, { IAttendanceRecord } from '../models/Attendance.model';
import User from '../models/User.model';
import Leave from '../models/Leave.model';
import Shift from '../models/Shift.model';
import Holiday from '../models/Holiday.model';
import Employee from '../models/Employee.model';
import Organization from '../models/Organization.model';
import GeofenceViolationLog from '../models/GeofenceViolationLog.model';
import OutOfOfficeApproval from '../models/OutOfOfficeApproval.model';
import { ApiResponse, DashboardStats } from '../types';
import { getActiveOutOfOfficeApproval, isApprovalActiveNow } from './outOfOffice.controller';
import mongoose from 'mongoose';

const getTodayDate = (): string => {
  return new Date().toISOString().split('T')[0];
};

const timeToMinutes = (time: string): number => {
  if (!time) return 0;
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

const calculateDuration = (start: string, end: string): number => {
  const startMinutes = timeToMinutes(start);
  const endMinutes = timeToMinutes(end);
  return endMinutes - startMinutes;
};

const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c * 1000;
};

const getCurrentTime = (): string => {
  const now = new Date();
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
};

export const getAttendance = async (req: Request, res: Response<ApiResponse>) => {
  try {
    const { date, department, status, startDate, endDate } = req.query;
    const filter: any = {};

    if (req.organizationId) filter.organizationId = req.organizationId;
    if (date) filter.date = date;
    if (startDate && endDate) filter.date = { $gte: startDate, $lte: endDate };
    else if (startDate) filter.date = { $gte: startDate };
    else if (endDate) filter.date = { $lte: endDate };

    if (department) filter.department = department;
    if (status) filter.status = status;

    const attendance = await Attendance.find(filter)
      .sort({ date: -1, clockIn: -1 })
      .populate('shiftId');

    res.json({
      success: true,
      data: attendance,
    });
  } catch (error) {
    console.error('Get Attendance Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const getEmployeeAttendance = async (req: Request, res: Response<ApiResponse>) => {
  try {
    const { employeeId } = req.params;
    const { startDate, endDate } = req.query;
    const filter: any = { employeeId };

    if (req.organizationId) filter.organizationId = req.organizationId;
    if (startDate && endDate) filter.date = { $gte: startDate, $lte: endDate };
    else if (startDate) filter.date = { $gte: startDate };
    else if (endDate) filter.date = { $lte: endDate };

    const attendance = await Attendance.find(filter)
      .sort({ date: -1 })
      .populate('shiftId');

    res.json({
      success: true,
      data: attendance,
    });
  } catch (error) {
    console.error('Get Employee Attendance Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const getAttendanceByDate = async (req: Request, res: Response<ApiResponse>) => {
  try {
    const { date } = req.params;
    const filter: any = { date };
    if (req.organizationId) filter.organizationId = req.organizationId;

    const attendance = await Attendance.find(filter)
      .sort({ clockIn: -1 })
      .populate('shiftId');

    res.json({
      success: true,
      data: attendance,
    });
  } catch (error) {
    console.error('Get Attendance By Date Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const getTodayAttendance = async (req: Request, res: Response<ApiResponse>) => {
  try {
    const { employeeId } = req.params;
    const today = getTodayDate();
    const filter: any = { employeeId, date: today };
    if (req.organizationId) filter.organizationId = req.organizationId;

    const attendance = await Attendance.findOne(filter).populate('shiftId');

    res.json({
      success: true,
      data: attendance || null,
    });
  } catch (error) {
    console.error('Get Today Attendance Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

const logGeofenceViolation = async (data: {
  employeeId: string;
  employeeName: string;
  attendanceId?: mongoose.Types.ObjectId;
  organizationId: mongoose.Types.ObjectId;
  violationType: 'clock-in-blocked' | 'auto-clocked-out' | 'area-exit-without-approval' | 're-entry-blocked';
  latitude: number;
  longitude: number;
  address?: string;
  distanceFromOffice: number;
  allowedRadius: number;
  hasActiveApproval: boolean;
  autoClockedOut: boolean;
  notes?: string;
}): Promise<void> => {
  try {
    await GeofenceViolationLog.create(data);
    console.log(`⚠️  [Geofence Violation] ${data.violationType} logged for ${data.employeeId}: ${data.distanceFromOffice.toFixed(0)}m / ${data.allowedRadius}m (approval: ${data.hasActiveApproval})`);
  } catch (err) {
    console.error('Failed to log geofence violation:', err);
  }
};

export const performAutoClockOut = async (
  attendanceId: mongoose.Types.ObjectId,
  reason: string,
  location?: { latitude: number; longitude: number; address?: string }
): Promise<IAttendanceRecord | null> => {
  try {
    const attendance = await Attendance.findById(attendanceId);
    if (!attendance || attendance.clockOut) return null;

    const currentTime = getCurrentTime();
    let totalBreakTime = 0;
    const updatedBreaks = attendance.breaks.map(br => {
      if (!br.endTime) {
        const duration = calculateDuration(br.startTime, currentTime);
        totalBreakTime += duration;
        return { ...br, endTime: currentTime, duration };
      }
      totalBreakTime += br.duration || 0;
      return br;
    });

    const clockInMinutes = timeToMinutes(attendance.clockIn);
    const clockOutMinutes = timeToMinutes(currentTime);
    const totalMinutes = clockOutMinutes - clockInMinutes - totalBreakTime;
    const workingHours = Math.max(0, totalMinutes / 60);

    let overtime = 0;
    try {
      const shift = await Shift.findById(attendance.shiftId);
      if (shift) {
        const shiftEndMinutes = timeToMinutes(shift.endTime);
        if (clockOutMinutes > shiftEndMinutes) {
          overtime = (clockOutMinutes - shiftEndMinutes) / 60;
        }
      }
    } catch { /* ignore */ }

    let status = attendance.status;
    if (workingHours < 4 && status !== 'remote') {
      status = 'half-day';
    }

    const updateData: any = {
      clockOut: currentTime,
      overtime,
      workingHours,
      totalBreakTime,
      status,
      breaks: updatedBreaks,
      wasAutoClockedOut: true,
      autoClockOutReason: reason,
      geofenceStatus: 'exited-without-approval',
    };

    if (location) {
      updateData.clockOutLocation = location;
      updateData.lastKnownLocation = { ...location, timestamp: new Date() };
    }

    const updated = await Attendance.findByIdAndUpdate(attendanceId, updateData, { new: true, runValidators: true });
    if (updated) {
      console.log(`🔴 [Auto Clock-Out] ${attendance.employeeName} (${attendance.employeeId}) at ${currentTime}. Reason: ${reason}`);
    }
    return updated;
  } catch (error) {
    console.error('Perform Auto Clock-Out Error:', error);
    return null;
  }
};

export const clockIn = async (req: Request, res: Response<ApiResponse>) => {
  try {
    const {
      employeeId,
      method,
      clockInImage,
      location,
      qrCodeData,
      biometricId,
      notes,
    } = req.body;

    const employeeQuery: any = { employeeId };
    if (req.organizationId) employeeQuery.organizationId = req.organizationId;
    const employee = await User.findOne(employeeQuery);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found',
      });
    }

    const today = getTodayDate();
    const currentTime = getCurrentTime();

    const existingAttendanceQuery: any = { employeeId, date: today };
    if (req.organizationId) existingAttendanceQuery.organizationId = req.organizationId;
    const existingAttendance = await Attendance.findOne(existingAttendanceQuery);
    if (existingAttendance && existingAttendance.clockIn) {
      return res.status(400).json({
        success: false,
        message: 'Already clocked in today',
      });
    }

    const holiday = await Holiday.findOne({ date: today, isActive: true, organizationId: req.organizationId });
    if (holiday) {
      if (!existingAttendance) {
        await Attendance.create({
          employeeId,
          employeeName: employee.name,
          date: today,
          status: 'holiday',
          department: employee.department,
          overtime: 0,
          workingHours: 0,
          totalBreakTime: 0,
          method: 'manual',
          breaks: [],
          notes: holiday.name,
          organizationId: req.organizationId || employee.organizationId,
        });
      }
      return res.status(400).json({
        success: false,
        message: `Today is ${holiday.name} - ${holiday.type} holiday`,
      });
    }

    const leaveFilter: any = {
      employeeId,
      status: 'approved',
      startDate: { $lte: today },
      endDate: { $gte: today },
    };
    if (req.organizationId) leaveFilter.organizationId = req.organizationId;
    const leave = await Leave.findOne(leaveFilter);
    if (leave && method !== 'remote') {
      if (!existingAttendance) {
        await Attendance.create({
          employeeId,
          employeeName: employee.name,
          date: today,
          status: 'leave',
          department: employee.department,
          overtime: 0,
          workingHours: 0,
          totalBreakTime: 0,
          method: 'manual',
          breaks: [],
          notes: `${leave.type} leave`,
          organizationId: req.organizationId || employee.organizationId,
        });
      }
      return res.status(400).json({
        success: false,
        message: `You are on ${leave.type} leave today - only remote work allowed`,
      });
    }

    const organization = await Organization.findById(req.organizationId || employee.organizationId);
    const orgSettings = organization?.attendanceSettings || {
      checkInTime: '09:00',
      checkOutTime: '18:00',
      lateThreshold: '09:15',
      geofencingEnabled: true,
      strictGeofenceEnforcement: true,
      autoClockOutOnExit: true,
      requireOutOfOfficeApproval: true,
      allowedGraceRadius: 50,
      notifyHROnViolation: true,
    };
    const officeLocation = organization?.officeLocation;
    const geofencingEnabled = !!orgSettings.geofencingEnabled;
    const strictEnforcement = !!orgSettings.strictGeofenceEnforcement;
    const requireApproval = !!orgSettings.requireOutOfOfficeApproval;
    const allowedGraceRadius = orgSettings.allowedGraceRadius ?? 50;

    let shift = await Shift.findById(employee.shiftId);
    if (!shift) {
      const shiftFilter: any = { isActive: true, name: 'Morning Shift' };
      if (req.organizationId) shiftFilter.organizationId = req.organizationId;
      shift = await Shift.findOne(shiftFilter);
      if (!shift) {
        shift = await Shift.create({
          name: 'Morning Shift',
          startTime: orgSettings.checkInTime,
          endTime: orgSettings.checkOutTime,
          lateThreshold: orgSettings.lateThreshold,
          halfDayThreshold: 4,
          isActive: true,
          organizationId: req.organizationId,
        });
      }
    }

    let isPendingApproval = false;
    let approvalStatus: 'approved' | 'rejected' | 'pending' = 'approved';
    let clockInDistance: number | undefined;
    let geofenceStatus: IAttendanceRecord['geofenceStatus'] = 'inside';
    let outOfOfficeApprovalId: mongoose.Types.ObjectId | undefined;
    let finalMethod = method;

    if (geofencingEnabled && method === 'gps' && location && officeLocation && officeLocation.latitude && officeLocation.longitude) {
      const distance = calculateDistance(
        location.latitude, location.longitude,
        officeLocation.latitude, officeLocation.longitude
      );
      clockInDistance = distance;

      const effectiveRadius = (officeLocation.radius || 100) + allowedGraceRadius;

      if (distance > effectiveRadius) {
        if (strictEnforcement) {
          const activeApproval = requireApproval
            ? await getActiveOutOfOfficeApproval(employeeId, req.organizationId)
            : null;

          if (!activeApproval && requireApproval) {
            await logGeofenceViolation({
              employeeId,
              employeeName: employee.name,
              organizationId: new mongoose.Types.ObjectId(req.organizationId || employee.organizationId),
              violationType: 'clock-in-blocked',
              latitude: location.latitude,
              longitude: location.longitude,
              address: location.address,
              distanceFromOffice: Math.round(distance),
              allowedRadius: effectiveRadius,
              hasActiveApproval: false,
              autoClockedOut: false,
              notes: `Blocked clock-in: ${Math.round(distance)}m outside office radius (${effectiveRadius}m). No active HR out-of-office approval.`,
            });

            return res.status(403).json({
              success: false,
              message: `❌ Clock-in BLOCKED by geofence. You are ${Math.round(distance)}m outside office area (allowed: ${effectiveRadius}m).`,
              data: {
                reason: 'OUTSIDE_GEOFENCE_NO_APPROVAL',
                distance: Math.round(distance),
                allowedRadius: effectiveRadius,
                officeLocation,
                yourLocation: location,
                nextSteps: [
                  'Step 1: Go back inside office premises to clock in normally',
                  'Step 2: OR request Out-of-Office approval from HR > await approve > then clock in',
                  'Step 3: OR ask HR to temporarily disable Strict Geofence Enforcement in Organization Settings',
                ],
                howToRequestApproval: 'App > Attendance > Request Out-of-Office > fill reason + time > submit',
              },
            });
          }

          if (activeApproval) {
            outOfOfficeApprovalId = activeApproval._id;
            geofenceStatus = 'exited-with-approval';
            finalMethod = 'remote';
          }
        } else {
          isPendingApproval = true;
          approvalStatus = 'pending';
          geofenceStatus = 'outside';
        }
      } else {
        geofenceStatus = 'inside';
      }
    }

    const currentMinutes = timeToMinutes(currentTime);
    const lateThresholdMinutes = timeToMinutes(shift?.lateThreshold || orgSettings.lateThreshold);
    const isLate = currentMinutes > lateThresholdMinutes;
    let status: any = isPendingApproval ? 'pending' : (isLate ? 'late' : 'present');
    if (finalMethod === 'remote' || employee.department?.toLowerCase().includes('remote')) {
      status = 'remote';
    }
    if (leave && finalMethod === 'remote') {
      status = 'remote';
    }

    const attendanceData: any = {
      employeeId,
      employeeName: employee.name,
      date: today,
      clockIn: currentTime,
      clockOut: '',
      status,
      department: employee.department,
      overtime: 0,
      workingHours: 0,
      totalBreakTime: 0,
      method: finalMethod,
      shiftId: shift?._id,
      clockInImage,
      location,
      lastKnownLocation: location ? { ...location, timestamp: new Date() } : undefined,
      clockInDistance,
      lastDistance: clockInDistance,
      geofenceStatus,
      qrCodeData,
      biometricId,
      notes,
      breaks: existingAttendance?.breaks || [],
      organizationId: req.organizationId || employee.organizationId,
      isPendingApproval,
      approvalStatus,
      outOfOfficeApprovalId,
    };

    let attendance;
    if (existingAttendance) {
      attendance = await Attendance.findByIdAndUpdate(existingAttendance._id, attendanceData, { new: true });
    } else {
      attendance = await Attendance.create(attendanceData);
    }

    const responseData: any = {
      success: true,
      data: attendance,
    };

    if (isPendingApproval) {
      responseData.message = 'Clock-in submitted for HR approval (outside geofence - non-strict mode)';
    } else if (geofenceStatus === 'exited-with-approval') {
      responseData.message = '✅ Clocked in successfully (Out-of-office - HR approval active)';
      responseData.approvalInfo = {
        approvalId: outOfOfficeApprovalId,
        message: 'You can work outside office area without auto clock-out for the approved duration.',
      };
    } else if (geofenceStatus === 'inside') {
      responseData.message = '✅ Clocked in successfully (Inside office geofence)';
      if (geofencingEnabled && clockInDistance !== undefined) {
        responseData.geofenceInfo = {
          distance: Math.round(clockInDistance),
          allowedRadius: (officeLocation?.radius || 100) + allowedGraceRadius,
          graceRadius: allowedGraceRadius,
          message: `You were ${Math.round(clockInDistance)}m from office at clock-in.`,
          autoClockOutOnExit: orgSettings.autoClockOutOnExit,
          warning: orgSettings.autoClockOutOnExit
            ? '⚠️ IMPORTANT: If you leave the office area without HR approval, your attendance will be AUTO CLOCKED-OUT immediately.'
            : 'ℹ️ Auto clock-out on exit is currently disabled by HR.',
        };
      }
    } else {
      responseData.message = 'Clocked in successfully';
    }

    res.status(200).json(responseData);
  } catch (error) {
    console.error('Clock In Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const attendanceLocationPing = async (req: Request, res: Response<ApiResponse>) => {
  try {
    const { employeeId, location } = req.body;

    if (!employeeId || !location || location.latitude === undefined || location.longitude === undefined) {
      return res.status(400).json({
        success: false,
        message: 'employeeId + location (latitude, longitude) are required for geofence ping',
      });
    }

    const today = getTodayDate();
    const filter: any = { employeeId, date: today };
    if (req.organizationId) filter.organizationId = req.organizationId;
    const attendance = await Attendance.findOne(filter);

    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: 'No active attendance found for today - please clock in first',
      });
    }

    if (attendance.clockOut) {
      return res.status(200).json({
        success: true,
        alreadyClockedOut: true,
        message: 'Employee already clocked out today',
        data: attendance,
      });
    }

    const organization = await Organization.findById(req.organizationId || attendance.organizationId);
    const orgSettings: any = organization?.attendanceSettings || {};
    const officeLocation = organization?.officeLocation;
    const geofencingEnabled = !!orgSettings.geofencingEnabled;
    const strictEnforcement = !!orgSettings.strictGeofenceEnforcement;
    const autoClockOutOnExit = !!orgSettings.autoClockOutOnExit;
    const requireApproval = !!orgSettings.requireOutOfOfficeApproval;
    const allowedGraceRadius = orgSettings.allowedGraceRadius ?? 50;

    if (!geofencingEnabled || !officeLocation || !officeLocation.latitude || !officeLocation.longitude) {
      await Attendance.findByIdAndUpdate(attendance._id, {
        lastKnownLocation: { ...location, timestamp: new Date() },
      });
      return res.status(200).json({
        success: true,
        geofencingActive: false,
        message: 'Geofencing disabled by HR - no location enforcement',
      });
    }

    const distance = calculateDistance(
      location.latitude, location.longitude,
      officeLocation.latitude, officeLocation.longitude
    );
    const effectiveRadius = (officeLocation.radius || 100) + allowedGraceRadius;
    const isInside = distance <= effectiveRadius;

    const updateData: any = {
      lastKnownLocation: { ...location, timestamp: new Date() },
      lastDistance: Math.round(distance),
    };

    let responseData: any = {
      success: true,
      distance: Math.round(distance),
      allowedRadius: effectiveRadius,
      graceRadius: allowedGraceRadius,
      isInside,
    };

    const prevStatus = attendance.geofenceStatus;
    const prevIsInside = prevStatus === 'inside' || prevStatus === 'exited-with-approval';

    if (isInside) {
      if (attendance.outOfOfficeApprovalId) {
        updateData.geofenceStatus = 'exited-with-approval';
      } else {
        updateData.geofenceStatus = 'inside';
      }
      responseData.action = 'inside_fence';
      responseData.message = `✅ Inside office area (${Math.round(distance)}m)`;
    } else {
      let hasValidClockInApproval = false;
      let clockInApproval: any = null;
      if (attendance.outOfOfficeApprovalId) {
        try {
          const stored = await OutOfOfficeApproval.findById(attendance.outOfOfficeApprovalId);
          if (stored && isApprovalActiveNow(stored)) {
            hasValidClockInApproval = true;
            clockInApproval = stored;
          }
        } catch (err) {
          console.error('Failed to verify stored clock-in approval:', err);
        }
      }

      if (hasValidClockInApproval) {
        updateData.geofenceStatus = 'exited-with-approval';
        responseData.action = 'outside_with_clockin_approval';
        responseData.message = `✅ Outside area - protected by Out-of-Office approval used at clock-in. Attendance continues (Approval: ${clockInApproval.reason}, valid until ${clockInApproval.endTime})`;
        responseData.activeApproval = {
          approvalId: attendance.outOfOfficeApprovalId,
          reason: clockInApproval.reason,
          validUntil: clockInApproval.endTime,
          approvedBy: clockInApproval.approvedByName,
          note: 'This exemption was granted at CLOCK-IN time. If you need to re-enter/extend, contact HR.',
        };
      } else if (autoClockOutOnExit) {
        const orgId = attendance.organizationId;
        await logGeofenceViolation({
          employeeId,
          employeeName: attendance.employeeName,
          attendanceId: attendance._id,
          organizationId: orgId,
          violationType: 'auto-clocked-out',
          latitude: location.latitude,
          longitude: location.longitude,
          address: location.address,
          distanceFromOffice: Math.round(distance),
          allowedRadius: effectiveRadius,
          hasActiveApproval: false,
          autoClockedOut: true,
          notes: `AUTO CLOCK-OUT: Employee went ${Math.round(distance)}m outside geofence. No valid clock-in-time out-of-office approval found. Prev geofenceStatus: ${prevStatus}.`,
        });

        const autoClockResult = await performAutoClockOut(
          attendance._id,
          `Auto clock-out: Employee exited geofence (${Math.round(distance)}m outside area). No Out-of-Office approval was used at clock-in time. Detected outside at ${getCurrentTime()}.`,
          location
        );

        responseData.action = 'auto_clocked_out';
        responseData.message = `🔴 ATTENDANCE AUTO CLOCKED-OUT! You stepped ${Math.round(distance)}m OUTSIDE the office area WITHOUT a clock-in-time HR Out-of-Office approval.`;
        responseData.autoClockedOut = true;
        responseData.reason = 'Exited geofence without valid clock-in-time Out-of-Office approval';
        responseData.updatedAttendance = autoClockResult;
        responseData.nextSteps = [
          'Your attendance is now CLOSED (clocked out) for today.',
          'To work from outside next time: (1) Submit Out-of-Office request BEFORE clocking in (2) Wait for HR approval (3) Then clock in — approval will be tagged to your attendance so you can work outside safely.',
          'If this was a mistake / GPS error: contact HR to manually adjust today\'s attendance.',
        ];

        if (prevIsInside) {
          responseData.warning = '⚠️ You were inside the office area and moved OUTSIDE — Auto Clock-Out triggered immediately. No mid-shift approval is accepted. Next time get approval PRIOR to clocking in.';
        }

        await Attendance.findByIdAndUpdate(attendance._id, updateData, { new: true });
        res.status(200).json(responseData);
        return;
      } else {
        updateData.geofenceStatus = 'outside';
        responseData.action = 'outside_auto_clockout_disabled';
        responseData.message = `⚠️ Outside office area (${Math.round(distance)}m). AUTO CLOCK-OUT ON EXIT is currently disabled by HR in Organization Settings.`;
        if (prevIsInside) {
          await logGeofenceViolation({
            employeeId,
            employeeName: attendance.employeeName,
            attendanceId: attendance._id,
            organizationId: attendance.organizationId,
            violationType: 'area-exit-without-approval',
            latitude: location.latitude,
            longitude: location.longitude,
            address: location.address,
            distanceFromOffice: Math.round(distance),
            allowedRadius: effectiveRadius,
            hasActiveApproval: false,
            autoClockedOut: false,
            notes: `Area exit without valid clock-in approval (${Math.round(distance)}m outside). Auto-clockout is disabled by org setting autoClockOutOnExit=false, so attendance NOT ended.`,
          });
        }
      }
    }

    await Attendance.findByIdAndUpdate(attendance._id, updateData, { new: true });
    responseData.geofenceStatus = updateData.geofenceStatus;
    res.status(200).json(responseData);
  } catch (error) {
    console.error('Attendance Location Ping Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const clockOut = async (req: Request, res: Response<ApiResponse>) => {
  try {
    const { employeeId, clockOutImage, notes, location } = req.body;

    const today = getTodayDate();
    const currentTime = getCurrentTime();

    const filter: any = { employeeId, date: today };
    if (req.organizationId) filter.organizationId = req.organizationId;
    const attendance = await Attendance.findOne(filter).populate('shiftId');

    if (!attendance || !attendance.clockIn) {
      return res.status(404).json({
        success: false,
        message: 'No clock-in record found for today',
      });
    }

    if (attendance.clockOut) {
      return res.status(400).json({
        success: false,
        message: 'Already clocked out today',
      });
    }

    let totalBreakTime = 0;
    const updatedBreaks = attendance.breaks.map(br => {
      if (!br.endTime) {
        const duration = calculateDuration(br.startTime, currentTime);
        totalBreakTime += duration;
        return { ...br, endTime: currentTime, duration };
      }
      totalBreakTime += br.duration || 0;
      return br;
    });

    const clockInMinutes = timeToMinutes(attendance.clockIn);
    const clockOutMinutes = timeToMinutes(currentTime);
    const totalMinutes = clockOutMinutes - clockInMinutes - totalBreakTime;
    const workingHours = Math.max(0, totalMinutes / 60);

    let overtime = 0;
    if (attendance.shiftId) {
      const shift = attendance.shiftId as any;
      const shiftEndMinutes = timeToMinutes(shift.endTime);
      if (clockOutMinutes > shiftEndMinutes) {
        overtime = (clockOutMinutes - shiftEndMinutes) / 60;
      }
    } else {
      if (clockOutMinutes > timeToMinutes('18:00')) {
        overtime = (clockOutMinutes - timeToMinutes('18:00')) / 60;
      }
    }

    let status = attendance.status;
    const shift = attendance.shiftId as any;
    const halfDayThreshold = shift?.halfDayThreshold || 4;
    if (workingHours < halfDayThreshold && status !== 'remote') {
      status = 'half-day';
    }

    const updateData: any = {
      clockOut: currentTime,
      clockOutImage,
      overtime,
      workingHours,
      totalBreakTime,
      status,
      breaks: updatedBreaks,
      notes: notes || attendance.notes,
      clockOutLocation: location,
      lastKnownLocation: location ? { ...location, timestamp: new Date() } : attendance.lastKnownLocation,
    };

    const updatedAttendance = await Attendance.findByIdAndUpdate(
      attendance._id,
      updateData,
      { new: true, runValidators: true }
    );

    const wasAuto = attendance.wasAutoClockedOut;

    res.json({
      success: true,
      message: wasAuto ? 'Already auto-clocked out earlier. Finalized with manual clock-out.' : 'Clocked out successfully',
      data: updatedAttendance,
    });
  } catch (error) {
    console.error('Clock Out Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const startBreak = async (req: Request, res: Response<ApiResponse>) => {
  try {
    const { employeeId, type } = req.body;

    const today = getTodayDate();
    const currentTime = getCurrentTime();

    const filter: any = { employeeId, date: today };
    if (req.organizationId) filter.organizationId = req.organizationId;
    const attendance = await Attendance.findOne(filter);

    if (!attendance || !attendance.clockIn) {
      return res.status(404).json({
        success: false,
        message: 'Clock in first to start a break',
      });
    }

    const ongoingBreak = attendance.breaks.find(br => !br.endTime);
    if (ongoingBreak) {
      return res.status(400).json({
        success: false,
        message: 'Already on a break',
      });
    }

    attendance.breaks.push({
      type: type || 'other',
      startTime: currentTime,
    });

    const updatedAttendance = await Attendance.findByIdAndUpdate(
      attendance._id,
      { breaks: attendance.breaks },
      { new: true }
    );

    res.json({
      success: true,
      message: 'Break started',
      data: updatedAttendance,
    });
  } catch (error) {
    console.error('Start Break Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const endBreak = async (req: Request, res: Response<ApiResponse>) => {
  try {
    const { employeeId } = req.body;

    const today = getTodayDate();
    const currentTime = getCurrentTime();

    const filter: any = { employeeId, date: today };
    if (req.organizationId) filter.organizationId = req.organizationId;
    const attendance = await Attendance.findOne(filter);

    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: 'No attendance record found for today',
      });
    }

    const breakIndex = attendance.breaks.findIndex(br => !br.endTime);
    if (breakIndex === -1) {
      return res.status(400).json({
        success: false,
        message: 'No ongoing break found',
      });
    }

    const br = attendance.breaks[breakIndex];
    const duration = calculateDuration(br.startTime, currentTime);
    attendance.breaks[breakIndex] = {
      ...br,
      endTime: currentTime,
      duration,
    };

    const totalBreakTime = attendance.breaks.reduce((sum, b) => sum + (b.duration || 0), 0);

    const updatedAttendance = await Attendance.findByIdAndUpdate(
      attendance._id,
      {
        breaks: attendance.breaks,
        totalBreakTime,
      },
      { new: true }
    );

    res.json({
      success: true,
      message: 'Break ended',
      data: updatedAttendance,
    });
  } catch (error) {
    console.error('End Break Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const getDashboardStats = async (req: Request, res: Response<ApiResponse>) => {
  try {
    const { date } = req.query;
    const targetDate = date as string || getTodayDate();

    const employeeFilter: any = { role: { $ne: 'hr_manager' } };
    if (req.organizationId) employeeFilter.organizationId = req.organizationId;
    const totalEmployees = await User.countDocuments(employeeFilter);

    const attendanceFilter: any = { date: targetDate };
    if (req.organizationId) attendanceFilter.organizationId = req.organizationId;
    const attendanceRecords = await Attendance.find(attendanceFilter);

    const leavesFilter: any = {
      status: 'approved',
      startDate: { $lte: targetDate },
      endDate: { $gte: targetDate },
    };
    if (req.organizationId) leavesFilter.organizationId = req.organizationId;
    const leaves = await Leave.find(leavesFilter);

    const stats: DashboardStats = {
      present: 0,
      absent: 0,
      late: 0,
      onLeave: leaves.length,
      halfDay: 0,
      totalEmployees,
    };

    attendanceRecords.forEach(record => {
      switch (record.status) {
        case 'present':
        case 'remote':
          stats.present++;
          break;
        case 'late':
          stats.late++;
          break;
        case 'absent':
          stats.absent++;
          break;
        case 'half-day':
          stats.halfDay++;
          break;
      }
    });

    const accountedFor = stats.present + stats.late + stats.halfDay + stats.onLeave;
    stats.absent = Math.max(0, totalEmployees - accountedFor);

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Get Dashboard Stats Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const createAttendance = async (req: Request, res: Response<ApiResponse>) => {
  try {
    const attendanceData = {
      ...req.body,
      method: req.body.method || 'manual',
      breaks: req.body.breaks || [],
      organizationId: req.organizationId,
    };
    const newAttendance = await Attendance.create(attendanceData);
    res.status(201).json({
      success: true,
      message: 'Attendance record created successfully',
      data: newAttendance,
    });
  } catch (error) {
    console.error('Create Attendance Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const updateAttendance = async (req: Request, res: Response<ApiResponse>) => {
  try {
    const { id } = req.params;
    const updatedAttendance = await Attendance.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!updatedAttendance) {
      return res.status(404).json({
        success: false,
        message: 'Attendance record not found',
      });
    }

    res.json({
      success: true,
      message: 'Attendance updated successfully',
      data: updatedAttendance,
    });
  } catch (error) {
    console.error('Update Attendance Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const getClockInDistribution = async (req: Request, res: Response<ApiResponse>) => {
  try {
    const { date } = req.query;
    const targetDate = date as string || getTodayDate();

    const filter: any = {
      date: targetDate,
      clockIn: { $ne: '' },
    };
    if (req.organizationId) filter.organizationId = req.organizationId;

    const attendanceRecords = await Attendance.find(filter);

    const hourlyCounts = Array.from({ length: 12 }, (_, i) => ({
      time: `${i + 7}:00`,
      count: 0,
    }));

    attendanceRecords.forEach(record => {
      if (record.clockIn) {
        const hour = parseInt(record.clockIn.split(':')[0]);
        if (hour >= 7 && hour <= 18) {
          const index = hour - 7;
          hourlyCounts[index].count++;
        }
      }
    });

    res.json({
      success: true,
      data: hourlyCounts,
    });
  } catch (error) {
    console.error('Get Clock-In Distribution Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const getAttendanceHeatmap = async (req: Request, res: Response<ApiResponse>) => {
  try {
    const { startDate, endDate } = req.query;
    const today = new Date();
    const defaultStart = new Date(today);
    defaultStart.setDate(today.getDate() - 7);

    const start = startDate as string || defaultStart.toISOString().split('T')[0];
    const end = endDate as string || today.toISOString().split('T')[0];

    const filter: any = {
      date: { $gte: start, $lte: end },
      clockIn: { $ne: '' },
    };
    if (req.organizationId) filter.organizationId = req.organizationId;

    const attendanceRecords = await Attendance.find(filter);

    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const heatmapData: any[] = [];

    days.forEach(day => {
      for (let hourIdx = 0; hourIdx < 12; hourIdx++) {
        heatmapData.push({
          day,
          hour: `${hourIdx + 7}:00`,
          value: 0,
        });
      }
    });

    attendanceRecords.forEach(record => {
      if (record.clockIn) {
        const dateObj = new Date(record.date);
        const dayName = days[dateObj.getDay() === 0 ? 6 : dateObj.getDay() - 1];
        const hour = parseInt(record.clockIn.split(':')[0]);

        if (hour >= 7 && hour <= 18) {
          const index = days.indexOf(dayName) * 12 + (hour - 7);
          if (index >= 0 && index < heatmapData.length) {
            heatmapData[index].value += Math.floor(Math.random() * 30 + 10);
          }
        }
      }
    });

    res.json({
      success: true,
      data: heatmapData,
    });
  } catch (error) {
    console.error('Get Attendance Heatmap Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const deleteAttendance = async (req: Request, res: Response<ApiResponse>) => {
  try {
    const { id } = req.params;
    const attendance = await Attendance.findByIdAndDelete(id);

    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: 'Attendance record not found',
      });
    }

    res.json({
      success: true,
      message: 'Attendance record deleted successfully',
    });
  } catch (error) {
    console.error('Delete Attendance Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const getTeamAttendance = async (req: Request, res: Response<ApiResponse>) => {
  try {
    const { managerName } = req.params;
    const { date, status, startDate, endDate } = req.query;

    const employeeFilter: any = { manager: managerName };
    if (req.organizationId) employeeFilter.organizationId = req.organizationId;
    const employees = await Employee.find(employeeFilter);
    const employeeIds = employees.map(emp => emp.employeeId);

    const filter: any = { employeeId: { $in: employeeIds } };
    if (req.organizationId) filter.organizationId = req.organizationId;

    if (date) filter.date = date;
    if (startDate && endDate) filter.date = { $gte: startDate, $lte: endDate };
    else if (startDate) filter.date = { $gte: startDate };
    else if (endDate) filter.date = { $lte: endDate };

    if (status) filter.status = status;

    const attendance = await Attendance.find(filter)
      .sort({ date: -1, clockIn: -1 })
      .populate('shiftId');

    res.json({
      success: true,
      data: attendance,
    });
  } catch (error) {
    console.error('Get Team Attendance Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const getPendingApprovals = async (req: Request, res: Response<ApiResponse>) => {
  try {
    const filter: any = {
      isPendingApproval: true,
      approvalStatus: 'pending',
    };
    if (req.organizationId) filter.organizationId = req.organizationId;

    const pendingAttendance = await Attendance.find(filter)
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: pendingAttendance,
    });
  } catch (error) {
    console.error('Get Pending Approvals Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const getGeofenceViolationLogs = async (req: Request, res: Response<ApiResponse>) => {
  try {
    const { employeeId, violationType, startDate, endDate } = req.query;
    const filter: any = {};
    if (req.organizationId) filter.organizationId = req.organizationId;
    if (employeeId) filter.employeeId = employeeId;
    if (violationType) filter.violationType = violationType;
    if (startDate && endDate) {
      filter.createdAt = {
        $gte: new Date(startDate as string),
        $lte: new Date((endDate as string) + 'T23:59:59Z'),
      };
    }

    const logs = await GeofenceViolationLog.find(filter)
      .sort({ createdAt: -1 })
      .limit(500);

    res.json({
      success: true,
      data: logs,
    });
  } catch (error) {
    console.error('Get Geofence Violation Logs Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const approveAttendance = async (req: Request, res: Response<ApiResponse>) => {
  try {
    const { id } = req.params;
    const { approvedBy } = req.body;

    const filter: any = { _id: id };
    if (req.organizationId) filter.organizationId = req.organizationId;

    const updatedAttendance = await Attendance.findOneAndUpdate(
      filter,
      {
        isPendingApproval: false,
        approvalStatus: 'approved',
        approvedBy,
        approvedAt: new Date(),
        status: 'present',
      },
      { new: true, runValidators: true }
    );

    if (!updatedAttendance) {
      return res.status(404).json({
        success: false,
        message: 'Attendance record not found',
      });
    }

    res.json({
      success: true,
      message: 'Attendance approved successfully',
      data: updatedAttendance,
    });
  } catch (error) {
    console.error('Approve Attendance Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const rejectAttendance = async (req: Request, res: Response<ApiResponse>) => {
  try {
    const { id } = req.params;
    const { approvedBy, notes } = req.body;

    const filter: any = { _id: id };
    if (req.organizationId) filter.organizationId = req.organizationId;

    const updatedAttendance = await Attendance.findOneAndUpdate(
      filter,
      {
        isPendingApproval: false,
        approvalStatus: 'rejected',
        approvedBy,
        approvedAt: new Date(),
        status: 'absent',
        notes: notes || 'Attendance rejected',
      },
      { new: true, runValidators: true }
    );

    if (!updatedAttendance) {
      return res.status(404).json({
        success: false,
        message: 'Attendance record not found',
      });
    }

    res.json({
      success: true,
      message: 'Attendance rejected successfully',
      data: updatedAttendance,
    });
  } catch (error) {
    console.error('Reject Attendance Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};
