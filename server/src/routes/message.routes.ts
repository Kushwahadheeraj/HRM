import express from 'express';
import {
  getMessages,
  sendMessage,
  markAsRead,
  getMessagesForUser
} from '../controllers/message.controller';
import { blockHrFromChat } from '../middleware/chatAccess.middleware';

const router = express.Router();

router.use(blockHrFromChat);

router.get('/', getMessages);
router.get('/user/:userId', getMessagesForUser);
router.post('/', sendMessage);
router.patch('/:messageId/read', markAsRead);

export default router;