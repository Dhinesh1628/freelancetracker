const express = require('express');
const router = express.Router();
const { getAllProjects, createProject, updateProject, deleteProject } = require('../controllers/projectController');
const { protect } = require('../middleware/authMiddleware');

// All project routes are protected — must send Bearer token
router.use(protect);

router.get('/', getAllProjects);
router.post('/', createProject);
router.put('/:id', updateProject);
router.delete('/:id', deleteProject);

module.exports = router;
