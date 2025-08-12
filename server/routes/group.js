import express from 'express';
import { 
  createGroup,
  searchGroups,
  joinGroup,
  getUserGroups,
  leaveGroup,
  deleteGroup
} from '../controllers/group.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// Create a new group
router.post('/create', auth, createGroup);

// Search groups
router.get('/search', searchGroups);

// Join group by invite code
router.post('/join', auth, joinGroup);

// Get user's groups
router.get('/user-groups', auth, getUserGroups);

// Leave group
router.delete('/leave/:groupId', auth, leaveGroup);

// Delete group (creator only)
router.delete('/delete/:groupId', auth, deleteGroup);

export default router;
