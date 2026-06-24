const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/user');

const JWT_SECRET = process.env.JWT_SECRET;

const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, name: user.name, email: user.email },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// REGISTER
const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password)
      return res.status(400).json({ error: 'All fields required' });

    const exists = await User.findOne({ email });
    if (exists)
      return res.status(409).json({ error: 'Email already exists' });

    const hashed = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashed,
    });

    const token = generateToken(user);

    res.status(201).json({
      user: { id: user._id, name: user.name, email: user.email },
      token,
    });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
};

// LOGIN
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user)
      return res.status(401).json({ error: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch)
      return res.status(401).json({ error: 'Invalid credentials' });

    const token = generateToken(user);

    res.json({
      user: { id: user._id, name: user.name, email: user.email },
      token,
    });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
};

// GET ME
const getMe = (req, res) => {
  res.json({ user: req.user });
};

module.exports = { register, login, getMe };