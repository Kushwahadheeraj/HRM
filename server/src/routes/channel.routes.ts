import express from 'express';
import {
  getChannels,
  getTeamMembers,
  getOrCreateDirectChannel,
  getChannel,
} from '../controllers/channel.controller';
import { blockHrFromChat } from '../middleware/chatAccess.middleware';

const router = express.Router();

console.log('✅ Channel routes initializing...');
router.get('/test', (req, res) => {
  res.json({ success: true, message: 'Channel routes are working!' });
});

router.use(blockHrFromChat);

router.get('/', getChannels);
router.get('/team-members', getTeamMembers);
router.post('/direct', getOrCreateDirectChannel);
router.get('/:channelId', getChannel);

export default router;
