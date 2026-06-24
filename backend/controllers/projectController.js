const Project = require('../models/project');

const roleOf = (project, userId) => {
  if (String(project.userId) === String(userId)) return 'admin';
  const m = project.members.find(m => String(m.userId) === String(userId));
  return m ? m.role : null;
};

// GET /projects  -> only projects the user owns or is a member of
const getAllProjects = async (req, res) => {
  try {
    const { search, status } = req.query;
    const filter = {
      $or: [
        { userId: req.user.id },
        { 'members.userId': req.user.id },
      ],
    };
    if (status === 'active') filter.isCompleted = false;
    if (status === 'completed') filter.isCompleted = true;
    if (search) {
      filter.$and = [{
        $or: [
          { clientName: { $regex: search, $options: 'i' } },
          { projectTitle: { $regex: search, $options: 'i' } },
        ],
      }];
    }

    const projects = await Project.find(filter).sort({ createdAt: -1 });
    const withRole = projects.map(p => ({
      ...p.toObject(),
      yourRole: roleOf(p, req.user.id),
    }));
    res.json(withRole);
  } catch {
    res.status(500).json({ error: 'Failed to fetch projects.' });
  }
};

// GET /projects/:id -> uses req.project / req.role set by loadProjectRole middleware
const getProjectById = async (req, res) => {
  res.json({ ...req.project.toObject(), yourRole: req.role });
};

// POST /projects -> creator becomes admin automatically
const createProject = async (req, res) => {
  try {
    const { clientName, projectTitle, budget, deadline } = req.body;
    const project = await Project.create({
      clientName,
      projectTitle,
      budget,
      deadline,
      userId: req.user.id,
      members: [{ userId: req.user.id, role: 'admin' }],
    });
    res.status(201).json({ ...project.toObject(), yourRole: 'admin' });
  } catch {
    res.status(500).json({ error: 'Failed to create project.' });
  }
};

// PUT /projects/:id -> requires admin or member (member cannot rename/delete, only edit task-level fields)
// Route layer enforces exact role via requireRole; here we just guard renaming for non-admins.
const updateProject = async (req, res) => {
  try {
    const project = req.project;

    if (req.role === 'member') {
      // members cannot rename the project or change client/budget/deadline structure
      const { clientName, projectTitle, ...rest } = req.body;
      Object.assign(project, rest);
    } else {
      Object.assign(project, req.body);
    }

    await project.save();
    res.json({ ...project.toObject(), yourRole: req.role });
  } catch {
    res.status(500).json({ error: 'Failed to update project.' });
  }
};

// DELETE /projects/:id -> admin only (enforced at route layer too)
const deleteProject = async (req, res) => {
  try {
    await Project.findByIdAndDelete(req.params.id);
    res.json({ message: 'Project deleted successfully.' });
  } catch {
    res.status(500).json({ error: 'Failed to delete project.' });
  }
};

module.exports = { getAllProjects, getProjectById, createProject, updateProject, deleteProject };