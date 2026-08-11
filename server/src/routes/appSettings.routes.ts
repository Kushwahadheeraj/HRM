import express from 'express';
import {
  getAppSettings,
  updateAppSettings,
  getPublicAppSettings,
} from '../controllers/appSettings.controller';

const router = express.Router();

// Public: minimal fields
router.get('/public', getPublicAppSettings);

// Protected: requires super-admin (x-user-id header with super_admin role)
router.get('/', getAppSettings);
router.put('/', updateAppSettings);

export default router;
