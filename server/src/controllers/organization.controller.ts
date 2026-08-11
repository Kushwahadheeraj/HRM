import { Request, Response } from 'express';
import Organization from '../models/Organization.model';
import { ApiResponse } from '../types';

export const getOrganizationSettings = async (req: Request, res: Response<ApiResponse>) => {
  try {
    console.log('🔍 [getOrganizationSettings] req.organizationId:', req.organizationId);
    console.log('🔍 [getOrganizationSettings] x-user-id header:', req.headers['x-user-id']);
    const organization = await Organization.findById(req.organizationId);
    if (!organization) {
      console.log('❌ [getOrganizationSettings] Organization not found for orgId:', req.organizationId);
      return res.status(404).json({
        success: false,
        message: 'Organization not found',
      });
    }
    console.log('✅ [getOrganizationSettings] Found org:', {
      name: organization.name,
      address: organization.officeLocation?.address,
      adminId: organization.adminId,
    });
    res.json({
      success: true,
      data: organization,
    });
  } catch (error) {
    console.error('Get Organization Settings Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const updateOrganizationSettings = async (req: Request, res: Response<ApiResponse>) => {
  try {
    const { officeLocation, attendanceSettings } = req.body;
    const organization = await Organization.findByIdAndUpdate(
      req.organizationId,
      { officeLocation, attendanceSettings },
      { new: true, runValidators: true }
    );
    if (!organization) {
      return res.status(404).json({
        success: false,
        message: 'Organization not found',
      });
    }
    res.json({
      success: true,
      message: 'Settings updated successfully',
      data: organization,
    });
  } catch (error) {
    console.error('Update Organization Settings Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};
