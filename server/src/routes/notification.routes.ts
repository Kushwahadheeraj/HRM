import express from 'express';
import {
  getNotifications,
  createNotification,
  updateNotification,
  markAsRead,
} from '../controllers/notification.controller';

const router = express.Router();

router.get('/', getNotifications);
router.post('/', createNotification);
router.put('/:id', updateNotification);
router.patch('/:id/read', markAsRead);

export default router;
