import express from 'express';
import {
  getOrganizationSettings,
  updateOrganizationSettings,
} from '../controllers/organization.controller';

const router = express.Router();

router.get('/settings', getOrganizationSettings);
router.put('/settings', updateOrganizationSettings);

export default router;
