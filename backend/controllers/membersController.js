const Project = require('../models/project');
const User = require('../models/user');

// GET /projects/:id/members
const getMembers = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id).populate('members.userId', 'name email');
    if (!project) return res.status(404).json({ error: 'Project not found.' });

    // always include creator as admin in the list, even if not in members[]
    const creator = await User.findById(project.userId).select('name email');
    const list = (project.members || [])
      .filter(m => m && m.userId)
      .map(m => ({
        userId: m.userId._id,
        name: m.userId.name,
        email: m.userId.email,
        role: m.role,
      }));

    const hasCreator = list.some(m => String(m.userId) === String(project.userId));
    if (!hasCreator && creator) {
      list.unshift({ userId: creator._id, name: creator.name, email: creator.email, role: 'admin' });
    }

    res.json({ members: list, yourRole: req.role });
  } catch {
    res.status(500).json({ error: 'Failed to fetch members.' });
  }
};

// POST /projects/:id/members  { email, role }
const addMember = async (req, res) => {
  try {
    const { email, role } = req.body;
    if (!email || !role) return res.status(400).json({ error: 'Email and role are required.' });
    if (!['admin', 'member', 'viewer'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role.' });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: 'No registered user found with that email.' });

    const project = req.project;

    if (String(project.userId) === String(user._id)) {
      return res.status(400).json({ error: 'This user is already the project owner.' });
    }

    const existing = project.members.find(m => String(m.userId) === String(user._id));
    if (existing) return res.status(409).json({ error: 'User is already a member of this project.' });

    project.members.push({ userId: user._id, role });
    await project.save();

    res.status(201).json({ message: 'Member added.', member: { userId: user._id, name: user.name, email: user.email, role } });
  } catch {
    res.status(500).json({ error: 'Failed to add member.' });
  }
};

// PUT /projects/:id/members/:userId  { role }
const updateMemberRole = async (req, res) => {
  try {
    const { role } = req.body;
    if (!['admin', 'member', 'viewer'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role.' });
    }

    const project = req.project;

    if (String(project.userId) === String(req.params.userId)) {
      return res.status(400).json({ error: "Cannot change the project owner's role." });
    }

    const member = project.members.find(m => String(m.userId) === String(req.params.userId));
    if (!member) return res.status(404).json({ error: 'Member not found.' });

    member.role = role;
    await project.save();

    res.json({ message: 'Role updated.', member: { userId: member.userId, role: member.role } });
  } catch {
    res.status(500).json({ error: 'Failed to update member role.' });
  }
};

// DELETE /projects/:id/members/:userId
const removeMember = async (req, res) => {
  try {
    const project = req.project;

    if (String(project.userId) === String(req.params.userId)) {
      return res.status(400).json({ error: 'Cannot remove the project owner.' });
    }

    const before = project.members.length;
    project.members = project.members.filter(m => String(m.userId) !== String(req.params.userId));
    if (project.members.length === before) return res.status(404).json({ error: 'Member not found.' });

    await project.save();
    res.json({ message: 'Member removed.' });
  } catch {
    res.status(500).json({ error: 'Failed to remove member.' });
  }
};

module.exports = { getMembers, addMember, updateMemberRole, removeMember };
