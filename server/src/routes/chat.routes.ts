import express from 'express';
import {
  sendMessage,
  getChannelMessages,
  addReaction,
  removeReaction,
  deleteMessage,
} from '../controllers/chat.controller';

const router = express.Router();

router.post('/', sendMessage);
router.get('/channels/:channelId', getChannelMessages);
router.post('/:messageId/reactions', addReaction);
router.delete('/:messageId/reactions', removeReaction);
router.delete('/:messageId', deleteMessage);

export default router;

