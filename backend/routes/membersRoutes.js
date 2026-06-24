const express = require('express');
const router = express.Router({ mergeParams: true });

const { getMembers, addMember, updateMemberRole, removeMember } = require('../controllers/membersController');
const { protect } = require('../middleware/authMiddleware');
const { loadProjectRole, requireRole } = require('../middleware/permissionMiddleware');

router.use(protect);
router.use(loadProjectRole); // attaches req.project + req.role for /:id

router.get('/', getMembers); // any member/viewer/admin can view
router.post('/', requireRole('admin'), addMember);
router.put('/:userId', requireRole('admin'), updateMemberRole);
router.delete('/:userId', requireRole('admin'), removeMember);

module.exports = router;