import express from 'express';
import {
  getMessages,
  sendMessage,
  markAsRead,
  getMessagesForUser
} from '../controllers/message.controller';

const router = express.Router();

router.get('/', getMessages);
router.get('/user/:userId', getMessagesForUser);
router.post('/', sendMessage);
router.patch('/:messageId/read', markAsRead);

export default router;
// import express from 'express';

// import {
//   getMessages,
//   sendMessage,
//   markAsRead,
//   getMessagesForUser
// } from '../controllers/message.controller';

// const router = express.Router();

// // GET CHAT BETWEEN 2 USERS
// router.get('/', getMessages);

// // GET ALL USER MESSAGES
// router.get('/user/:userId', getMessagesForUser);

// // SEND MESSAGE
// router.post('/', sendMessage);

// // MARK AS READ
// router.patch('/:messageId/read', markAsRead);

// export default router;