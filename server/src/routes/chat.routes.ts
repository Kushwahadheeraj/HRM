import express from 'express';
import {
  sendMessage,
  getChannelMessages,
  addReaction,
  removeReaction,
  deleteMessage,
} from '../controllers/chat.controller';
import { blockHrFromChat } from '../middleware/chatAccess.middleware';

const router = express.Router();

router.use(blockHrFromChat);

router.post('/', sendMessage);
router.get('/channels/:channelId', getChannelMessages);
router.post('/:messageId/reactions', addReaction);
router.delete('/:messageId/reactions', removeReaction);
router.delete('/:messageId', deleteMessage);

export default router;

