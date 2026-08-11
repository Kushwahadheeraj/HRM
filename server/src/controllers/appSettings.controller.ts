import { Request, Response } from 'express';
import User from '../models/User.model';
import AppSettings from '../models/AppSettings.model';
import { ApiResponse } from '../types';

const isSuperAdmin = async (req: Request): Promise<{ isSuper: boolean; user?: any }> => {
  const userId = req.headers['x-user-id'];
  if (!userId) return { isSuper: false };
  const user = await User.findById(userId);
  if (!user) return { isSuper: false };
  return { isSuper: user.role === 'super_admin', user };
};

export const getAppSettings = async (req: Request, res: Response<ApiResponse>) => {
  try {
    const { isSuper } = await isSuperAdmin(req);
    if (!isSuper) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only super admin can view app settings.',
      });
    }
    const settings = await (AppSettings as any).getOrCreate();
    res.json({
      success: true,
      data: settings,
    });
  } catch (error) {
    console.error('Get App Settings Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const updateAppSettings = async (req: Request, res: Response<ApiResponse>) => {
  try {
    const { isSuper, user } = await isSuperAdmin(req);
    if (!isSuper) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only super admin can update app settings.',
      });
    }

    const { googleDriveApkFileId, apkFileName } = req.body;
    const updateData: any = { updatedBy: user?._id };
    if (typeof googleDriveApkFileId === 'string' && googleDriveApkFileId.trim().length > 0) {
      updateData.googleDriveApkFileId = googleDriveApkFileId.trim();
    }
    if (typeof apkFileName === 'string' && apkFileName.trim().length > 0) {
      updateData.apkFileName = apkFileName.trim();
    }

    const settings = await (AppSettings as any).getOrCreate();
    Object.assign(settings, updateData);
    await settings.save();

    res.json({
      success: true,
      message: 'App settings updated successfully',
      data: settings,
    });
  } catch (error) {
    console.error('Update App Settings Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

// Public read endpoint: expose ONLY non-sensitive fields for the landing page
// (e.g., so client can preview the stored fileId / filename if needed)
export const getPublicAppSettings = async (_req: Request, res: Response<ApiResponse>) => {
  try {
    const settings = await (AppSettings as any).getOrCreate();
    res.json({
      success: true,
      data: {
        apkFileName: settings?.apkFileName || 'traxale-app.apk',
      },
    });
  } catch (error) {
    console.error('Get Public App Settings Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};
