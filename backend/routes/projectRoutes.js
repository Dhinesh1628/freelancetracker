const express = require('express');
const router = express.Router();

const {
  getAllProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
} = require('../controllers/projectController');
const { protect } = require('../middleware/authMiddleware');
const { loadProjectRole, requireRole } = require('../middleware/permissionMiddleware');

router.use(protect);

router.get('/', getAllProjects);
router.post('/', createProject);

router.get('/:id', loadProjectRole, getProjectById);
router.put('/:id', loadProjectRole, requireRole('admin', 'member'), updateProject);
router.delete('/:id', loadProjectRole, requireRole('admin'), deleteProject);

module.exports = router;