import express from 'express';
import {
  getChannels,
  getTeamMembers,
  getOrCreateDirectChannel,
  getChannel,
} from '../controllers/channel.controller';

const router = express.Router();

console.log('✅ Channel routes initializing...');
router.get('/test', (req, res) => {
  res.json({ success: true, message: 'Channel routes are working!' });
});

router.get('/', getChannels);
router.get('/team-members', getTeamMembers);
router.post('/direct', getOrCreateDirectChannel);
router.get('/:channelId', getChannel);

export default router;
