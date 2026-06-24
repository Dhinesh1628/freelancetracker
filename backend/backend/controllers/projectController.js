const Project = require('../models/project');

// GET /projects?search=&status=
const getAllProjects = async (req, res) => {
  try {
    const { search, status } = req.query;
    const filter = { userId: req.user.id };

    if (status === 'active') filter.isCompleted = false;
    if (status === 'completed') filter.isCompleted = true;

    if (search) {
      filter.$or = [
        { clientName: { $regex: search, $options: 'i' } },
        { projectTitle: { $regex: search, $options: 'i' } },
      ];
    }

    const projects = await Project.find(filter).sort({ createdAt: -1 });
    res.json(projects);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch projects.' });
  }
};

// POST /projects
const createProject = async (req, res) => {
  try {
    const { clientName, projectTitle, budget, deadline } = req.body;
    if (!clientName || !projectTitle || !budget || !deadline)
      return res.status(400).json({ error: 'All fields are required.' });

    const project = await Project.create({
      clientName,
      projectTitle,
      budget,
      deadline,
      userId: req.user.id,
    });
    res.status(201).json(project);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create project.' });
  }
};

// PUT /projects/:id
const updateProject = async (req, res) => {
  try {
    const project = await Project.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!project) return res.status(404).json({ error: 'Project not found.' });
    res.json(project);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update project.' });
  }
};

// DELETE /projects/:id
const deleteProject = async (req, res) => {
  try {
    const project = await Project.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id,
    });
    if (!project) return res.status(404).json({ error: 'Project not found.' });
    res.json({ message: 'Project deleted successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete project.' });
  }
};

module.exports = { getAllProjects, createProject, updateProject, deleteProject };
