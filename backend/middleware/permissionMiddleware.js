const Project = require('../models/project');

/**
 * Loads the project and attaches the current user's role to req.
 * Must run AFTER `protect` (which sets req.user).
 * Usage: router.get('/:id', protect, loadProjectRole, handler)
 */
const loadProjectRole = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found.' });

    // creator is always admin even if somehow missing from members[]
    let role = null;
    if (String(project.userId) === String(req.user.id)) {
      role = 'admin';
    } else {
      const m = project.members.find(m => String(m.userId) === String(req.user.id));
      role = m ? m.role : null;
    }

    if (!role) return res.status(403).json({ error: 'You do not have access to this project.' });

    req.project = project;
    req.role = role;
    next();
  } catch (err) {
    res.status(500).json({ error: 'Failed to verify project access.' });
  }
};

/**
 * Restricts a route to specific roles. Use after loadProjectRole.
 * Usage: router.delete('/:id', protect, loadProjectRole, requireRole('admin'), handler)
 */
const requireRole = (...allowedRoles) => (req, res, next) => {
  if (!req.role || !allowedRoles.includes(req.role)) {
    return res.status(403).json({ error: 'You do not have permission to perform this action.' });
  }
  next();
};

module.exports = { loadProjectRole, requireRole };